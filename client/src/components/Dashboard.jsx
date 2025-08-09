import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, BarChart3, Settings, LogOut, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStudy } from '../contexts/StudyContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { studyStats, fetchStudyStats, getAccuracyRate } = useStudy();

  useEffect(() => {
    fetchStudyStats();
  }, []);

  const handleStartStudy = () => {
    navigate('/study');
  };

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="glass-morphism rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                おかえりなさい、{user?.name || user?.email}さん！
              </h1>
              <p className="text-white/80">
                今日も一緒に英単語を学習しましょう
              </p>
            </div>
            <div className="flex space-x-2">
              {user?.role === 'admin' && (
                <button
                  onClick={handleAdminPanel}
                  className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                >
                  <Crown className="w-4 h-4" />
                  <span>管理画面</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>

        {/* 学習統計 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="glass-morphism rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">学習済み単語</h3>
              <BarChart3 className="w-6 h-6 text-white/60" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {studyStats.totalStudied}
            </div>
            <p className="text-white/60 text-sm">単語</p>
          </div>

          <div className="glass-morphism rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">正答率</h3>
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">%</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {getAccuracyRate()}%
            </div>
            <p className="text-white/60 text-sm">
              正解 {studyStats.correctAnswers} / 不正解 {studyStats.incorrectAnswers}
            </p>
          </div>

          <div className="glass-morphism rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">連続正解</h3>
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">🔥</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {studyStats.streak}
            </div>
            <p className="text-white/60 text-sm">
              最高記録: {studyStats.bestStreak}
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={handleStartStudy}
            className="glass-morphism rounded-2xl p-8 text-left hover:bg-white/10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-green-500 p-3 rounded-full">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">学習開始</h3>
            </div>
            <p className="text-white/80">
              フラッシュカードで英単語を学習しましょう。タップして表裏を切り替え、知っているかどうかを答えてください。
            </p>
          </button>

          <div className="glass-morphism rounded-2xl p-8 text-left">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-blue-500 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">学習進捗</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">今日の学習</span>
                <span className="text-white font-medium">{studyStats.totalStudied}語</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((studyStats.totalStudied / 50) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-white/60 text-sm">
                目標: 50語/日
              </p>
            </div>
          </div>
        </div>

        {/* PWAインストール案内 */}
        <div className="glass-morphism rounded-2xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-2">💡 便利な使い方</h3>
          <p className="text-white/80 text-sm">
            このアプリをスマートフォンのホーム画面に追加すると、アプリのように使用できます。
            ブラウザのメニューから「ホーム画面に追加」を選択してください。
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;