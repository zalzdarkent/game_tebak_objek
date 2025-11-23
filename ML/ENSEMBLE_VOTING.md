# 🗳️ Ensemble Voting System

## Arsitektur Model

Sistem sekarang menggunakan **3 Model** yang bekerja bersama:

### 1. **Sentence Transformer** (Semantic Understanding)
- Model: `all-MiniLM-L6-v2`
- Kekuatan: Memahami makna semantik, sinonim, konteks
- Cocok untuk: Clue deskriptif, kalimat panjang
- Contoh: "hewan pemangsa besar dari keluarga kucing" → Harimau

### 2. **Naive Bayes** (Keyword Matching)
- Model: MultinomialNB dengan TF-IDF
- Kekuatan: Cepat mengenali kata kunci spesifik
- Cocok untuk: Clue pendek, kata kunci eksak
- Contoh: "loreng oranye hitam" → Harimau

### 3. **Logistic Regression** (Balanced Approach)
- Model: LogisticRegression dengan TF-IDF (n-gram 1-3)
- Kekuatan: Balance antara semantic dan keyword
- Cocok untuk: Clue medium complexity
- Contoh: "binatang buas bergaris" → Harimau

---

## Mekanisme Voting

### Sistem Poin
Setiap model memberikan prediksi top 3, dengan poin:
- **Rank 1**: 3 poin
- **Rank 2**: 2 poin
- **Rank 3**: 1 poin

### Cara Kerja
```python
# Contoh voting untuk clue: "hewan buas loreng"
Model ST:  1. Harimau (3 poin) | 2. Macan (2 poin) | 3. Zebra (1 poin)
Model NB:  1. Harimau (3 poin) | 2. Singa (2 poin) | 3. Gajah (1 poin)
Model LR:  1. Harimau (3 poin) | 2. Macan (2 poin) | 3. Singa (1 poin)

Total Votes:
- Harimau: 9 poin (WINNER - unanimous!)
- Macan: 4 poin
- Singa: 3 poin
- Zebra: 1 poin
- Gajah: 1 poin
```

---

## Tingkat Confidence

### 1. **Unanimous** (Tertinggi)
- Ketiga model sepakat objek ini rank #1
- Confidence: 99%
- Contoh: ST#1 + NB#1 + LR#1 = Harimau

### 2. **High**
- Total votes ≥ 7 (minimal 2 model sangat setuju)
- Confidence: 85-95%
- Contoh: ST#1 + NB#1 + LR#3 atau ST#1 + NB#2 + LR#1

### 3. **Medium**
- Total votes ≥ 4
- Confidence: 60-80%
- Contoh: ST#1 + NB#3 + LR#2

### 4. **Low**
- Total votes < 4
- Confidence: <60%
- Contoh: Model-model tidak konsisten

---

## Response Format

```json
{
  "success": true,
  "clue": "hewan buas loreng",
  "predictions": [
    {
      "objek": "Harimau",
      "score": 0.8234,        // Average score dari 3 model
      "votes": 9,              // Total poin voting
      "st": 0.8456,            // Semantic Transformer score
      "nb": 0.7823,            // Naive Bayes score
      "lr": 0.8423,            // Logistic Regression score
      "st_rank": 1,            // Rank di ST
      "nb_rank": 1,            // Rank di NB
      "lr_rank": 1,            // Rank di LR
      "confidence_level": "unanimous"  // unanimous/high/medium/low
    },
    {
      "objek": "Macan",
      "score": 0.6234,
      "votes": 4,
      "st": 0.6456,
      "nb": 0.5823,
      "lr": 0.6423,
      "st_rank": 2,
      "nb_rank": 0,            // 0 = tidak masuk top 3
      "lr_rank": 2,
      "confidence_level": "medium"
    }
  ]
}
```

---

## Keuntungan Ensemble Voting

### ✅ Robustness
Tidak bergantung pada satu model. Jika ST salah, NB+LR masih bisa benar.

### ✅ Diversity
Setiap model punya "perspective" berbeda:
- ST: Semantic
- NB: Keyword
- LR: Balance

### ✅ Transparency
Kamu bisa lihat rank setiap model untuk debug/analisis.

### ✅ Consensus-Based
Keputusan lebih demokratis = lebih akurat.

---

## Expected Performance

### Sebelum (Dynamic Weighting):
- Akurasi: ~70-75%
- Waktu response: ~100-150ms

### Sesudah (Ensemble Voting):
- **Akurasi: ~80-85%** (+10-15%)
- Waktu response: ~150-200ms (+50ms karena 3 model)
- False positive rate: -30%

---

## Test Cases

### Test 1: Semantic Heavy
**Clue**: "alat musik tradisional dari bambu yang ditiup"
**Expected**: 
- ST rank 1: Suling ✅
- NB rank 2-3: Suling (keywords: bambu, tiup)
- LR rank 1: Suling ✅
- **Result**: Unanimous/High confidence

### Test 2: Keyword Heavy
**Clue**: "mengeong"
**Expected**:
- ST rank 2-3: Kucing (semantic match lemah)
- NB rank 1: Kucing ✅ (exact keyword)
- LR rank 1: Kucing ✅
- **Result**: High confidence

### Test 3: Ambiguous
**Clue**: "hewan"
**Expected**:
- ST rank: Banyak kandidat
- NB rank: Banyak kandidat
- LR rank: Banyak kandidat
- **Result**: Low confidence (votes tersebar)

### Test 4: Complex
**Clue**: "profesi yang membuat kode program dengan Python dan JavaScript"
**Expected**:
- ST rank 1: Programmer ✅ (semantic understanding)
- NB rank 2: Programmer (keywords: kode, program)
- LR rank 1: Programmer ✅
- **Result**: High confidence

---

## Cara Testing

1. **Restart Flask Server**:
```bash
cd ML
python app.py
```

2. **Test via Frontend** (recommended):
- Buka http://localhost:3000/game
- Coba berbagai jenis clue
- Perhatikan confidence_level di console

3. **Test via curl**:
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"clue": "hewan buas loreng", "top_k": 5}'
```

4. **Perhatikan**:
- `votes`: Apakah ada konsensus?
- `st_rank`, `nb_rank`, `lr_rank`: Model mana yang paling akurat?
- `confidence_level`: Sesuai ekspektasi?

---

## Next Steps

Setelah testing:
1. ✅ **Ensemble Voting** (CURRENT)
2. ⏳ **Contextual Learning** (multi-turn conversation)
3. ⏳ **Confidence Threshold** (request additional clue)
4. ⏳ **Active Learning** (smart feedback)
