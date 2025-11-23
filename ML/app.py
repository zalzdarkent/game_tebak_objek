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
label_encoder = None
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
    global df, st_model, tfidf, nb_model, label_encoder
    
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
    
    # Build models
    rebuild_all_models()
    print("✅ All models ready!")

def gabung_teks(row):
    """Combine objek and deskripsi"""
    return f"{row['objek']} - {row['deskripsi']}"

def rebuild_all_models():
    """Rebuild both Semantic and NLP models"""
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
        clues = row["clue_history"].split(", ")
        for c in clues:
            if len(c.strip()) > 2:
                train_texts.append(c.strip().lower())
                train_labels.append(row["objek"])
    
    if len(train_texts) > 0:
        X_tfidf = tfidf.fit_transform(train_texts)
        y_encoded = label_encoder.fit_transform(train_labels)
        nb_model.fit(X_tfidf, y_encoded)
    
    print("✅ Models rebuilt!")

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

def predict_hybrid(clue, top_k=5, weight_st=0.5, weight_nb=0.5):
    """Hybrid prediction combining Semantic + Naive Bayes"""
    
    # Get scores from both models
    scores_st = predict_semantic(clue)
    scores_nb = predict_naive_bayes(clue)
    
    # Normalize ST scores to 0-1 range
    max_st = max(scores_st.values()) if scores_st else 1
    min_st = min(scores_st.values()) if scores_st else 0
    range_st = max_st - min_st if max_st != min_st else 1
    
    # Combine scores
    final_scores = {}
    for objek in objek_only:
        st_norm = (scores_st.get(objek, 0) - min_st) / range_st
        nb_score = scores_nb.get(objek, 0)
        
        # Weighted average
        final_scores[objek] = (weight_st * st_norm) + (weight_nb * nb_score)
    
    # Sort and get top_k
    sorted_scores = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
    
    hasil = []
    for objek, score in sorted_scores[:top_k]:
        hasil.append({
            "objek": objek,
            "score": round(score, 4),
            "st": round(scores_st.get(objek, 0), 4),
            "nb": round(scores_nb.get(objek, 0), 4)
        })
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
        
        # Get predictions
        hasil = predict_hybrid(clue, top_k=top_k)
        
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
    """Get all objects in database"""
    try:
        objects = df[["objek", "deskripsi"]].to_dict('records')
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
