/**
 * API Service untuk ML Game Tebak Objek
 * Handles all communication with Flask backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Prediction {
  objek: string;
  score: number;
  votes?: number;           // Total voting points
  st: number;               // Sentence Transformer score
  nb: number;               // Naive Bayes score
  lr?: number;              // Logistic Regression score
  st_rank?: number;         // Rank in ST (0 = not in top 3)
  nb_rank?: number;         // Rank in NB
  lr_rank?: number;         // Rank in LR
  confidence_level?: string; // unanimous/high/medium/low
  weight_st?: number;       // Dynamic weight for ST (legacy)
  weight_nb?: number;       // Dynamic weight for NB (legacy)
}

export interface PredictResponse {
  success: boolean;
  clue: string;
  predictions: Prediction[];
  top_prediction: Prediction | null;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  stats: {
    benar: number;
    salah: number;
    total_predictions: number;
  };
}

export interface StatsResponse {
  success: boolean;
  stats: {
    benar: number;
    salah: number;
    total_predictions: number;
    accuracy: number;
    total_objects: number;
  };
}

export interface ObjectItem {
  objek: string;
  deskripsi: string;
}

export interface ObjectsResponse {
  success: boolean;
  total: number;
  objects: ObjectItem[];
}

export interface HealthResponse {
  status: string;
  message: string;
  total_objects: number;
}

/**
 * Check if API is healthy
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('API is not responding');
  }
  
  return response.json();
}

/**
 * Get prediction from clue
 */
export async function predictObject(
  clue: string,
  topK: number = 5
): Promise<PredictResponse> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clue, top_k: topK }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get prediction');
  }
  
  return response.json();
}

/**
 * Submit feedback for learning
 */
export async function submitFeedback(
  clue: string,
  jawabanBenar: string,
  isCorrect: boolean,
  deskripsiTambahan?: string
): Promise<FeedbackResponse> {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clue,
      jawaban_benar: jawabanBenar,
      is_correct: isCorrect,
      deskripsi_tambahan: deskripsiTambahan,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit feedback');
  }
  
  return response.json();
}

/**
 * Get current statistics
 */
export async function getStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE_URL}/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to get statistics');
  }
  
  return response.json();
}

/**
 * Get all objects in database
 */
export async function getObjects(): Promise<ObjectsResponse> {
  const response = await fetch(`${API_BASE_URL}/objects`);
  
  if (!response.ok) {
    throw new Error('Failed to get objects');
  }
  
  return response.json();
}
