"""
Flask API for ML Game Tebak Objek
Hybrid Model: Sentence Transformer + Naive Bayes
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import torch
from sentence_transformers import SentenceTransformer, util
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
import warnings
import os

warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)  # Enable CORS untuk Next.js

# ============================================================
#   GLOBAL VARIABLES
# ============================================================
df = None
st_model = None
tfidf = None
nb_model = None
lr_model = None  # Logistic Regression
tfidf_lr = None  # Separate TF-IDF for LR
label_encoder = None
label_encoder_lr = None  # Separate encoder for LR
objek_list = []
objek_only = []
objek_embeddings = None
X_tfidf = None
y_encoded = None
feedback_counter = 0
stats = {"benar": 0, "salah": 0, "total_predictions": 0}

# ============================================================
#   INITIALIZATION
# ============================================================
def init_models():
    """Initialize ML models and load dataset"""
    global df, st_model, tfidf, nb_model, lr_model, tfidf_lr, label_encoder, label_encoder_lr
    
    print("🔄 Initializing models...")
    
    # Load dataset
    filename = "daftar_objek_50.csv"
    if not os.path.exists(filename):
        raise FileNotFoundError(f"Dataset {filename} not found!")
    
    df = pd.read_csv(filename)
    
    # Add clue_history column if not exists
    if "clue_history" not in df.columns:
        df["clue_history"] = df["deskripsi"].copy()
    
    print(f"✅ Dataset loaded: {len(df)} objek")
    
    # Load Sentence Transformer
    st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    print("✅ Sentence Transformer loaded")
    
    # Initialize TF-IDF + Naive Bayes
    tfidf = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
    nb_model = MultinomialNB(alpha=0.1)
    label_encoder = LabelEncoder()
    
    # Initialize TF-IDF + Logistic Regression (Model 3)
    tfidf_lr = TfidfVectorizer(ngram_range=(1, 3), max_features=8000, min_df=1)
    lr_model = LogisticRegression(max_iter=1000, C=1.0, random_state=42)
    label_encoder_lr = LabelEncoder()
    
    # Build models
    rebuild_all_models()
    print("✅ All 3 models ready! (ST + NB + LR)")

def gabung_teks(row):
    """Combine objek, deskripsi, kategori, dan kata_kunci untuk embedding lebih kaya"""
    kategori = row.get('kategori', '')
    kata_kunci = row.get('kata_kunci', '')
    
    # Gabungkan semua informasi untuk semantic understanding yang lebih baik
    text_parts = [
        row['objek'],
        row['deskripsi'],
        f"Kategori: {kategori}" if kategori else "",
        f"Kata kunci: {kata_kunci}" if kata_kunci else ""
    ]
    
    return " - ".join([p for p in text_parts if p])

def rebuild_all_models():
    """Rebuild all 3 models: Semantic, Naive Bayes, and Logistic Regression"""
    global objek_list, objek_only, objek_embeddings
    global X_tfidf, y_encoded
    
    # === Sentence Transformer ===
    objek_list = df.apply(gabung_teks, axis=1).tolist()
    objek_only = df["objek"].tolist()
    objek_embeddings = st_model.encode(objek_list, convert_to_tensor=True)
    
    # === Naive Bayes ===
    train_texts = []
    train_labels = []
    
    for _, row in df.iterrows():
        # Gunakan clue_history untuk training
        clues = row["clue_history"].split(", ")
        for c in clues:
            if len(c.strip()) > 2:
                train_texts.append(c.strip().lower())
                train_labels.append(row["objek"])
        
        # Tambahkan kata_kunci sebagai training data tambahan (boost learning)
        if 'kata_kunci' in row and pd.notna(row['kata_kunci']):
            keywords = row['kata_kunci'].split()
            for keyword in keywords:
                if len(keyword.strip()) > 2:
                    train_texts.append(keyword.strip().lower())
                    train_labels.append(row["objek"])
    
    if len(train_texts) > 0:
        X_tfidf = tfidf.fit_transform(train_texts)
        y_encoded = label_encoder.fit_transform(train_labels)
        nb_model.fit(X_tfidf, y_encoded)
    
    # === Logistic Regression (Model 3) ===
    # Use richer training data: deskripsi + clue_history + keywords
    train_texts_lr = []
    train_labels_lr = []
    
    for _, row in df.iterrows():
        # Base description
        train_texts_lr.append(row["deskripsi"].lower())
        train_labels_lr.append(row["objek"])
        
        # Clue history
        clues = row["clue_history"].split(", ")
        for c in clues:
            if len(c.strip()) > 2:
                train_texts_lr.append(c.strip().lower())
                train_labels_lr.append(row["objek"])
        
        # Keywords
        if 'kata_kunci' in row and pd.notna(row['kata_kunci']):
            train_texts_lr.append(row['kata_kunci'].lower())
            train_labels_lr.append(row["objek"])
    
    if len(train_texts_lr) > 0:
        X_tfidf_lr = tfidf_lr.fit_transform(train_texts_lr)
        y_encoded_lr = label_encoder_lr.fit_transform(train_labels_lr)
        lr_model.fit(X_tfidf_lr, y_encoded_lr)
    
    print("✅ All 3 models rebuilt!")

# ============================================================
#   PREDICTION FUNCTIONS
# ============================================================
def predict_semantic(clue, top_k=10):
    """Predict using Sentence Transformer"""
    clue_emb = st_model.encode(clue, convert_to_tensor=True)
    scores = util.pytorch_cos_sim(clue_emb, objek_embeddings)[0]
    
    hasil = {}
    for i, score in enumerate(scores):
        hasil[objek_only[i]] = float(score)
    return hasil

def predict_naive_bayes(clue):
    """Predict using Naive Bayes"""
    try:
        X_new = tfidf.transform([clue.lower()])
        proba = nb_model.predict_proba(X_new)[0]
        classes = label_encoder.classes_
        
        hasil = {}
        for i, p in enumerate(proba):
            hasil[classes[i]] = float(p)
        return hasil
    except:
        return {}

def predict_logistic_regression(clue):
    """Predict using Logistic Regression"""
    try:
        X_new = tfidf_lr.transform([clue.lower()])
        proba = lr_model.predict_proba(X_new)[0]
        classes = label_encoder_lr.classes_
        
        hasil = {}
        for i, p in enumerate(proba):
            hasil[classes[i]] = float(p)
        return hasil
    except:
        return {}

def predict_ensemble_voting(clue, top_k=5):
    """Ensemble prediction with 3 models using VOTING system"""
    
    # Get predictions from all 3 models
    scores_st = predict_semantic(clue)
    scores_nb = predict_naive_bayes(clue)
    scores_lr = predict_logistic_regression(clue)
    
    # === VOTING MECHANISM ===
    # Each model votes for their top prediction
    votes = {}  # {objek: vote_count}
    vote_details = {}  # {objek: {st_rank, nb_rank, lr_rank}}
    
    # Get top 3 from each model
    top_st = sorted(scores_st.items(), key=lambda x: x[1], reverse=True)[:3]
    top_nb = sorted(scores_nb.items(), key=lambda x: x[1], reverse=True)[:3]
    top_lr = sorted(scores_lr.items(), key=lambda x: x[1], reverse=True)[:3]
    
    # Count votes (top 1 = 3 points, top 2 = 2 points, top 3 = 1 point)
    for i, (objek, _) in enumerate(top_st):
        votes[objek] = votes.get(objek, 0) + (3 - i)
        if objek not in vote_details:
            vote_details[objek] = {"st_rank": 0, "nb_rank": 0, "lr_rank": 0}
        vote_details[objek]["st_rank"] = i + 1
    
    for i, (objek, _) in enumerate(top_nb):
        votes[objek] = votes.get(objek, 0) + (3 - i)
        if objek not in vote_details:
            vote_details[objek] = {"st_rank": 0, "nb_rank": 0, "lr_rank": 0}
        vote_details[objek]["nb_rank"] = i + 1
    
    for i, (objek, _) in enumerate(top_lr):
        votes[objek] = votes.get(objek, 0) + (3 - i)
        if objek not in vote_details:
            vote_details[objek] = {"st_rank": 0, "nb_rank": 0, "lr_rank": 0}
        vote_details[objek]["lr_rank"] = i + 1
    
    # Sort by votes
    sorted_votes = sorted(votes.items(), key=lambda x: x[1], reverse=True)
    
    # Calculate confidence based on vote consensus
    max_votes = sorted_votes[0][1] if sorted_votes else 0
    
    # Build result with transparency
    hasil = []
    for objek, vote_count in sorted_votes[:top_k]:
        # Normalize scores
        st_score = scores_st.get(objek, 0)
        nb_score = scores_nb.get(objek, 0)
        lr_score = scores_lr.get(objek, 0)
        
        # Average score from all models
        avg_score = (st_score + nb_score + lr_score) / 3
        
        hasil.append({
            "objek": objek,
            "score": round(avg_score, 4),
            "votes": vote_count,
            "st": round(st_score, 4),
            "nb": round(nb_score, 4),
            "lr": round(lr_score, 4),
            "st_rank": vote_details[objek]["st_rank"],
            "nb_rank": vote_details[objek]["nb_rank"],
            "lr_rank": vote_details[objek]["lr_rank"]
        })
    
    # Add confidence level
    if hasil:
        # High confidence: unanimous top 1 (all 3 models agree)
        if hasil[0]["st_rank"] == 1 and hasil[0]["nb_rank"] == 1 and hasil[0]["lr_rank"] == 1:
            hasil[0]["confidence_level"] = "unanimous"
        elif hasil[0]["votes"] >= 7:  # At least 2 models strongly agree
            hasil[0]["confidence_level"] = "high"
        elif hasil[0]["votes"] >= 4:
            hasil[0]["confidence_level"] = "medium"
        else:
            hasil[0]["confidence_level"] = "low"
    
    return hasil

# ============================================================
#   LEARNING FUNCTION
# ============================================================
def learn_from_feedback(clue, jawaban_benar, deskripsi_tambahan=None):
    """Learn from user feedback"""
    global df, feedback_counter
    
    idx = df[df["objek"].str.lower() == jawaban_benar.lower()].index
    
    if len(idx) > 0:
        # Update existing object
        i = idx[0]
        old_desc = df.at[i, "deskripsi"]
        tambahan = deskripsi_tambahan if deskripsi_tambahan else clue
        df.at[i, "deskripsi"] = f"{old_desc}, {tambahan}"
        
        # Update clue_history (boost with 3x repetition)
        old_clues = df.at[i, "clue_history"]
        boost = f"{clue}, {clue}, {clue}"
        df.at[i, "clue_history"] = f"{old_clues}, {boost}"
        
        message = f"🔄 '{jawaban_benar}' diperkuat dengan: {tambahan}"
    else:
        # Add new object
        desc = deskripsi_tambahan if deskripsi_tambahan else f"{jawaban_benar} adalah {clue}"
        boost = f"{clue}, {clue}, {clue}"
        baru = pd.DataFrame({
            "objek": [jawaban_benar],
            "deskripsi": [desc],
            "clue_history": [f"{desc}, {boost}"]
        })
        df = pd.concat([df, baru], ignore_index=True)
        message = f"➕ Objek baru ditambahkan: {jawaban_benar}"
    
    # Rebuild models
    rebuild_all_models()
    
    # Auto-save every 3 feedbacks
    feedback_counter += 1
    if feedback_counter >= 3:
        save_dataset()
        feedback_counter = 0
    
    return message

def save_dataset(filename="daftar_objek_updated.csv"):
    """Save updated dataset"""
    df.to_csv(filename, index=False)
    print(f"💾 Dataset saved: {filename} ({len(df)} objek)")

# ============================================================
#   API ENDPOINTS
# ============================================================
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "ML API is running",
        "total_objects": len(df) if df is not None else 0
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict object from clue
    Body: {"clue": "string", "top_k": 5 (optional)}
    """
    try:
        data = request.get_json()
        clue = data.get('clue', '').strip()
        top_k = data.get('top_k', 5)
        
        if not clue:
            return jsonify({"error": "Clue is required"}), 400
        
        # Get predictions using ensemble voting
        hasil = predict_ensemble_voting(clue, top_k=top_k)
        
        # Update stats
        stats["total_predictions"] += 1
        
        return jsonify({
            "success": True,
            "clue": clue,
            "predictions": hasil,
            "top_prediction": hasil[0] if hasil else None
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/feedback', methods=['POST'])
def feedback():
    """
    Submit feedback for learning
    Body: {
        "clue": "string",
        "jawaban_benar": "string",
        "is_correct": boolean,
        "deskripsi_tambahan": "string" (optional)
    }
    """
    try:
        data = request.get_json()
        clue = data.get('clue', '').strip()
        jawaban_benar = data.get('jawaban_benar', '').strip()
        is_correct = data.get('is_correct', False)
        deskripsi_tambahan = data.get('deskripsi_tambahan', None)
        
        if not clue or not jawaban_benar:
            return jsonify({"error": "Clue and jawaban_benar are required"}), 400
        
        # Update stats
        if is_correct:
            stats["benar"] += 1
        else:
            stats["salah"] += 1
        
        # Learn from feedback
        message = learn_from_feedback(clue, jawaban_benar, deskripsi_tambahan)
        
        return jsonify({
            "success": True,
            "message": message,
            "stats": stats
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get current statistics"""
    total = stats["benar"] + stats["salah"]
    accuracy = (stats["benar"] / total * 100) if total > 0 else 0
    
    return jsonify({
        "success": True,
        "stats": {
            **stats,
            "accuracy": round(accuracy, 2),
            "total_objects": len(df) if df is not None else 0
        }
    })

@app.route('/objects', methods=['GET'])
def get_objects():
    """Get all objects in database with categories"""
    try:
        # Pilih kolom yang relevan
        columns = ["objek", "deskripsi", "kategori", "difficulty"] if "kategori" in df.columns else ["objek", "deskripsi"]
        objects = df[columns].to_dict('records')
        
        # Group by category jika ada
        if "kategori" in df.columns:
            categories = df['kategori'].value_counts().to_dict()
            return jsonify({
                "success": True,
                "total": len(objects),
                "objects": objects,
                "categories": categories
            })
        
        return jsonify({
            "success": True,
            "total": len(objects),
            "objects": objects
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
#   MAIN
# ============================================================
if __name__ == '__main__':
    print("="*60)
    print("🎮 ML GAME TEBAK OBJEK - Flask API")
    print("="*60)
    
    # Initialize models
    init_models()
    
    print("\n🚀 Starting Flask server...")
    print("📍 API will be available at: http://localhost:5000")
    print("="*60 + "\n")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
