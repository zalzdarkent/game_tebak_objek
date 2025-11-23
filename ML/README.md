# ML Game Tebak Objek - Flask API

API backend untuk game tebak objek menggunakan hybrid ML model (Sentence Transformer + Naive Bayes).

## 🚀 Setup

### 1. Install Dependencies

```bash
cd ML
pip install -r requirements.txt
```

### 2. Pastikan Dataset Ada

Pastikan file `daftar_objek_50.csv` ada di folder `ML/`

### 3. Run Flask Server

```bash
python app.py
```

Server akan berjalan di `http://localhost:5000`

## 📡 API Endpoints

### 1. Health Check
```
GET /health
```
Response:
```json
{
  "status": "ok",
  "message": "ML API is running",
  "total_objects": 50
}
```

### 2. Predict Object
```
POST /predict
Content-Type: application/json

{
  "clue": "hewan berkaki empat",
  "top_k": 5
}
```
Response:
```json
{
  "success": true,
  "clue": "hewan berkaki empat",
  "predictions": [
    {
      "objek": "kucing",
      "score": 0.8542,
      "st": 0.7234,
      "nb": 0.9850
    }
  ],
  "top_prediction": {
    "objek": "kucing",
    "score": 0.8542,
    "st": 0.7234,
    "nb": 0.9850
  }
}
```

### 3. Submit Feedback
```
POST /feedback
Content-Type: application/json

{
  "clue": "hewan berkaki empat",
  "jawaban_benar": "kucing",
  "is_correct": true,
  "deskripsi_tambahan": "punya kumis dan suka makan ikan"
}
```
Response:
```json
{
  "success": true,
  "message": "🔄 'kucing' diperkuat dengan: punya kumis dan suka makan ikan",
  "stats": {
    "benar": 1,
    "salah": 0,
    "total_predictions": 1
  }
}
```

### 4. Get Statistics
```
GET /stats
```
Response:
```json
{
  "success": true,
  "stats": {
    "benar": 5,
    "salah": 2,
    "total_predictions": 10,
    "accuracy": 71.43,
    "total_objects": 52
  }
}
```

### 5. Get All Objects
```
GET /objects
```
Response:
```json
{
  "success": true,
  "total": 50,
  "objects": [
    {
      "objek": "kucing",
      "deskripsi": "hewan peliharaan berbulu..."
    }
  ]
}
```

## 🔧 Development

- Model akan auto-save dataset setiap 3 feedback
- File hasil update: `daftar_objek_updated.csv`
- CORS sudah enabled untuk Next.js development

## 📝 Notes

- Model menggunakan hybrid approach untuk akurasi lebih baik
- Feedback akan melatih model secara real-time
- Dataset akan bertambah otomatis jika objek baru ditambahkan
