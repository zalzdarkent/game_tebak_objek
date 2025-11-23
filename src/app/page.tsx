import Link from "next/link";
import { Brain, Sparkles, TrendingUp, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Brain className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-pulse" />
              <h1 className="text-5xl md:text-6xl font-bold bg-linear-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                Game Tebak Objek ML
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Powered by AI - Sentence Transformer & Naive Bayes
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Hybrid ML Model
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Kombinasi Semantic Understanding & Pattern Recognition
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Self-Learning
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Model belajar dari setiap feedback untuk lebih akurat
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <Zap className="w-12 h-12 text-pink-600 dark:text-pink-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Real-time Prediction
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Prediksi instan dengan confidence score detail
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Siap Mencoba?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Berikan clue dan biarkan AI menebak objek yang kamu maksud!
            </p>
            <Link
              href="/game"
              className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              <Brain className="w-6 h-6" />
              Mulai Bermain
            </Link>
          </div>

          {/* How it Works */}
          <div className="mt-12 text-left bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Cara Bermain
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <span className="shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Masukkan Clue</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Berikan petunjuk tentang objek yang kamu pikirkan
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <span className="shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">AI Memprediksi</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Model ML akan menganalisis dan memberikan 5 prediksi terbaik
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <span className="shrink-0 w-8 h-8 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Berikan Feedback</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Konfirmasi apakah tebakan benar atau salah - model akan belajar!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
