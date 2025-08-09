import React, { useState } from 'react';
import { Mail, Lock, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }

    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-morphism rounded-2xl p-8 w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            英単語フラッシュカード
          </h1>
          <p className="text-white/80">
            ログインして学習を開始しましょう
          </p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg py-3 px-10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              パスワード
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg py-3 px-10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="パスワードを入力"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-purple-600 font-semibold py-3 px-6 rounded-lg hover:bg-white/90 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '認証中...' : 'ログイン'}
          </button>
        </form>

        {/* デモ用アカウント情報 */}
        <div className="mt-8 p-4 bg-white/10 rounded-lg">
          <h3 className="text-white font-medium mb-2">デモアカウント</h3>
          <div className="text-sm text-white/80 space-y-1">
            <p><strong>生徒:</strong> student@example.com / password123</p>
            <p><strong>先生:</strong> admin@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;