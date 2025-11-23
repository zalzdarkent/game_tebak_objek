'use client';

import { useState, useEffect } from 'react';
import { Brain, Send, CheckCircle, XCircle, TrendingUp, Database, Sparkles, Vote, Award, Target } from 'lucide-react';
import { predictObject, submitFeedback, getStats, checkHealth } from '@/lib/api';
import type { Prediction, StatsResponse } from '@/lib/api';

export default function GamePage() {
  const [clue, setClue] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [topPrediction, setTopPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [stats, setStats] = useState<StatsResponse['stats'] | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [currentClue, setCurrentClue] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showWrongAnswerModal, setShowWrongAnswerModal] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');

  // Check API health on mount
  useEffect(() => {
    checkAPIHealth();
    loadStats();
  }, []);

  const checkAPIHealth = async () => {
    try {
      await checkHealth();
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const loadStats = async () => {
    try {
      const response = await getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clue.trim()) return;
    
    setLoading(true);
    setFeedbackMessage('');
    
    try {
      const response = await predictObject(clue.trim(), 5);
      setPredictions(response.predictions);
      setTopPrediction(response.top_prediction);
      setCurrentClue(clue.trim());
      setShowFeedback(true);
      await loadStats();
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Gagal mendapatkan prediksi. Pastikan Flask API berjalan!');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (isCorrect: boolean) => {
    if (!topPrediction || !currentClue || submittingFeedback) return;
    
    if (!isCorrect) {
      // Show modal for wrong answer
      setShowWrongAnswerModal(true);
      return;
    }
    
    // Handle correct answer
    await submitCorrectFeedback(topPrediction.objek);
  };

  const submitCorrectFeedback = async (jawabanBenar: string, deskripsiTambahan?: string) => {
    if (!currentClue || submittingFeedback) return;
    
    try {
      setSubmittingFeedback(true);
      
      const response = await submitFeedback(
        currentClue,
        jawabanBenar,
        !showWrongAnswerModal, // true if correct, false if wrong
        deskripsiTambahan
      );
      
      setFeedbackMessage(response.message);
      await loadStats();
      
      // Close modal if open
      setShowWrongAnswerModal(false);
      setCorrectAnswer('');
      setAdditionalDescription('');
      
      // Reset after feedback
      setTimeout(() => {
        setClue('');
        setPredictions([]);
        setTopPrediction(null);
        setShowFeedback(false);
        setFeedbackMessage('');
        setSubmittingFeedback(false);
      }, 2000);
      
    } catch (error) {
      console.error('Feedback error:', error);
      setFeedbackMessage('');
      setSubmittingFeedback(false);
      // Show error in modal or alert
      alert('Gagal mengirim feedback. Silakan coba lagi.');
    }
  };

  const handleWrongAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!correctAnswer.trim()) {
      return;
    }
    
    await submitCorrectFeedback(
      correctAnswer.trim(),
      additionalDescription.trim() || undefined
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              Game Tebak Objek ML
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Berikan clue dan biarkan AI menebak objek yang kamu maksud!
          </p>
          
          {/* API Status */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'online' ? 'bg-green-500' :
              apiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            } animate-pulse`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              API {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Benar</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.benar}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Salah</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.salah}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Akurasi</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accuracy.toFixed(1)}%</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <Database className="w-4 h-4" />
                <span className="text-sm font-medium">Objek</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_objects}</p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          {/* Input Form */}
          <form onSubmit={handlePredict} className="mb-6">
            <label htmlFor="clue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Masukkan Clue
            </label>
            <div className="flex gap-2">
              <input
                id="clue"
                type="text"
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                placeholder="Contoh: hewan berkaki empat yang suka makan ikan"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !clue.trim() || apiStatus === 'offline'}
                className="px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span className="hidden md:inline">Memprediksi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="hidden md:inline">Tebak</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Feedback Message */}
          {feedbackMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 animate-in zoom-in duration-500" />
                <p className="text-green-800 dark:text-green-200 text-sm font-medium">{feedbackMessage}</p>
              </div>
            </div>
          )}

          {/* Predictions */}
          {predictions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Prediksi AI
              </h3>
              
              <div className="space-y-3">
                {predictions.map((pred, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      index === 0
                        ? 'bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 border-purple-400 dark:border-purple-600 shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {pred.objek}
                        </span>
                        
                        {/* Confidence Badge */}
                        {index === 0 && pred.confidence_level && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            pred.confidence_level === 'unanimous' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            pred.confidence_level === 'high' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            pred.confidence_level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {pred.confidence_level === 'unanimous' ? '🎯 UNANIMOUS' :
                             pred.confidence_level === 'high' ? '✨ HIGH' :
                             pred.confidence_level === 'medium' ? '🔍 MEDIUM' :
                             '⚠️ LOW'}
                          </span>
                        )}
                      </div>
                      
                      {/* Score & Votes */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {pred.votes !== undefined && (
                            <div className="flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                              <Vote className="w-3 h-3" />
                              <span>{pred.votes}pts</span>
                            </div>
                          )}
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {(pred.score * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Model Scores */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {/* Sentence Transformer */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                          <Brain className="w-3 h-3 text-blue-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">ST</span>
                          {pred.st_rank && pred.st_rank > 0 && (
                            <span className="ml-auto text-xs font-bold text-blue-600 dark:text-blue-400">#{pred.st_rank}</span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {(pred.st * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      {/* Naive Bayes */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                          <Target className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">NB</span>
                          {pred.nb_rank && pred.nb_rank > 0 && (
                            <span className="ml-auto text-xs font-bold text-green-600 dark:text-green-400">#{pred.nb_rank}</span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {(pred.nb * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      {/* Logistic Regression */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                          <Award className="w-3 h-3 text-purple-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">LR</span>
                          {pred.lr_rank && pred.lr_rank > 0 && (
                            <span className="ml-auto text-xs font-bold text-purple-600 dark:text-purple-400">#{pred.lr_rank}</span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {pred.lr ? (pred.lr * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          index === 0
                            ? 'bg-linear-to-r from-purple-600 via-blue-600 to-pink-600'
                            : 'bg-gray-400 dark:bg-gray-500'
                        }`}
                        style={{ width: `${pred.score * 100}%` }}
                      />
                    </div>
                    
                    {/* Voting Details for Top Prediction */}
                    {index === 0 && pred.votes !== undefined && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Vote className="w-3 h-3" />
                          <span className="font-medium">Voting Breakdown:</span>
                          <span>
                            {pred.st_rank === 1 ? '✅' : pred.st_rank === 2 ? '🥈' : pred.st_rank === 3 ? '🥉' : '⚪'} ST
                            {' • '}
                            {pred.nb_rank === 1 ? '✅' : pred.nb_rank === 2 ? '🥈' : pred.nb_rank === 3 ? '🥉' : '⚪'} NB
                            {' • '}
                            {pred.lr_rank === 1 ? '✅' : pred.lr_rank === 2 ? '🥈' : pred.lr_rank === 3 ? '🥉' : '⚪'} LR
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Feedback Buttons */}
              {showFeedback && topPrediction && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Apakah tebakan <span className="font-semibold text-gray-900 dark:text-white">{topPrediction.objek}</span> sudah benar?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleFeedback(true)}
                      disabled={submittingFeedback}
                      className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                      {submittingFeedback ? (
                        <>
                          <div className="absolute inset-0 bg-green-400 animate-pulse" />
                          <Sparkles className="w-5 h-5 animate-spin relative z-10" />
                          <span className="relative z-10">Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          Benar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      disabled={submittingFeedback}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                      {submittingFeedback ? (
                        <>
                          <div className="absolute inset-0 bg-red-400 animate-pulse" />
                          <Sparkles className="w-5 h-5 animate-spin relative z-10" />
                          <span className="relative z-10">Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          Salah
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {predictions.length === 0 && !loading && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Masukkan clue untuk mulai bermain!
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Model menggunakan <span className="font-semibold">Ensemble Voting</span> (3 Models: ST + NB + LR)</p>
          <p className="mt-1">Setiap feedback akan melatih semua model untuk lebih akurat! 🚀</p>
        </div>
      </div>

      {/* Wrong Answer Modal */}
      {showWrongAnswerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!submittingFeedback) {
                setShowWrongAnswerModal(false);
                setCorrectAnswer('');
                setAdditionalDescription('');
              }
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Jawaban Salah
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bantu AI belajar dengan memberikan jawaban yang benar!
              </p>
            </div>

            <form onSubmit={handleWrongAnswerSubmit} className="space-y-4">
              <div>
                <label htmlFor="correctAnswer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apa jawaban yang benar? <span className="text-red-500">*</span>
                </label>
                <input
                  id="correctAnswer"
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Masukkan jawaban yang benar..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400"
                  disabled={submittingFeedback}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label htmlFor="additionalDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deskripsi tambahan (opsional)
                </label>
                <textarea
                  id="additionalDescription"
                  value={additionalDescription}
                  onChange={(e) => setAdditionalDescription(e.target.value)}
                  placeholder="Tambahkan deskripsi untuk membantu AI belajar..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder:text-gray-400 resize-none"
                  disabled={submittingFeedback}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!submittingFeedback) {
                      setShowWrongAnswerModal(false);
                      setCorrectAnswer('');
                      setAdditionalDescription('');
                    }
                  }}
                  disabled={submittingFeedback}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback || !correctAnswer.trim()}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  {submittingFeedback ? (
                    <>
                      <div className="absolute inset-0 bg-red-400 animate-pulse" />
                      <Sparkles className="w-5 h-5 animate-spin relative z-10" />
                      <span className="relative z-10">Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
