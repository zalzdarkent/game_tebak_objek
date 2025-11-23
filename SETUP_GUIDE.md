# Game Tebak Objek ML - Setup Guide

Proyek ini adalah integrasi Machine Learning game tebak objek dengan Next.js frontend.

## 📁 Struktur Proyek

```
game_ml/
├── ML/                      # Flask API Backend
│   ├── app.py              # Flask server
│   ├── requirements.txt    # Python dependencies
│   ├── ml.ipynb           # Original notebook
│   └── daftar_objek_50.csv # Dataset
├── src/                    # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx       # Homepage
│   │   └── game/
│   │       └── page.tsx   # Game interface
│   └── lib/
│       └── api.ts         # API service
└── .env.local             # Environment config
```

## 🚀 Setup & Running

### 1. Setup Flask Backend

```bash
# Pindah ke folder ML
cd ML

# Install dependencies Python
pip install -r requirements.txt

# Pastikan file daftar_objek_50.csv ada di folder ML

# Run Flask server
python app.py
```

Flask akan berjalan di `http://localhost:5000`

### 2. Setup Next.js Frontend

```bash
# Dari root project
npm install

# Run development server
npm run dev
```

Next.js akan berjalan di `http://localhost:3000`

## 🎮 Cara Menggunakan

1. **Jalankan Flask API terlebih dahulu** (port 5000)
2. **Jalankan Next.js** (port 3000)
3. Buka browser ke `http://localhost:3000`
4. Klik "Mulai Bermain" atau langsung ke `/game`
5. Masukkan clue dan lihat prediksi AI!

## 🔧 API Endpoints

- `GET /health` - Check API status
- `POST /predict` - Get object predictions
- `POST /feedback` - Submit feedback untuk learning
- `GET /stats` - Get statistics
- `GET /objects` - Get all objects in database

## 💡 Features

- ✅ Hybrid ML Model (Sentence Transformer + Naive Bayes)
- ✅ Real-time prediction dengan confidence scores
- ✅ Self-learning dari user feedback
- ✅ Auto-save dataset setiap 3 feedback
- ✅ Responsive UI dengan Tailwind CSS
- ✅ Dark mode support
- ✅ Statistics tracking (accuracy, total predictions, dll)

## 📝 Environment Variables

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Untuk production, ubah ke URL Flask API yang sudah di-deploy.

## 🐛 Troubleshooting

**API Offline?**
- Pastikan Flask server berjalan di port 5000
- Check `daftar_objek_50.csv` ada di folder ML
- Lihat console Flask untuk error messages

**Model error?**
- Pastikan semua dependencies terinstall dengan benar
- Download model Sentence Transformer butuh internet

**CORS error?**
- Flask sudah di-setup dengan flask-cors
- Restart Flask server jika masih ada masalah

## 📊 Model Details

- **Sentence Transformer**: all-MiniLM-L6-v2
- **Naive Bayes**: MultinomialNB dengan TF-IDF
- **Hybrid Weighting**: 50% Semantic + 50% NLP
- **Learning**: Triple-boost feedback untuk reinforcement

Enjoy! 🎉
