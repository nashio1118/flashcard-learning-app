import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Users, BarChart3, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);

  // ユーザー管理用の状態
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student'
  });

  // 単語管理用の状態
  const [newWord, setNewWord] = useState({
    english: '',
    japanese: '',
    level: 'basic'
  });

  // CSVアップロード用の状態
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
    fetchWords();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('ユーザー一覧の取得に失敗しました');
    }
  };

  const fetchWords = async () => {
    try {
      const response = await axios.get('/api/admin/words');
      setWords(response.data);
    } catch (error) {
      console.error('Failed to fetch words:', error);
      toast.error('単語一覧の取得に失敗しました');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/admin/users', newUser);
      toast.success('ユーザーを作成しました');
      setNewUser({ email: '', password: '', name: '', role: 'student' });
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'ユーザー作成に失敗しました';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('本当にこのユーザーを削除しますか？')) return;

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      toast.success('ユーザーを削除しました');
      fetchUsers();
    } catch (error) {
      toast.error('ユーザー削除に失敗しました');
    }
  };

  const handleCreateWord = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/admin/words', newWord);
      toast.success('単語を追加しました');
      setNewWord({ english: '', japanese: '', level: 'basic' });
      fetchWords();
    } catch (error) {
      const message = error.response?.data?.message || '単語追加に失敗しました';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWord = async (wordId) => {
    if (!confirm('本当にこの単語を削除しますか？')) return;

    try {
      await axios.delete(`/api/admin/words/${wordId}`);
      toast.success('単語を削除しました');
      fetchWords();
    } catch (error) {
      toast.error('単語削除に失敗しました');
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('CSVファイルを選択してください');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('csvFile', csvFile);

    try {
      const response = await axios.post('/api/admin/words/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${response.data.count}個の単語を追加しました`);
      setCsvFile(null);
      fetchWords();
    } catch (error) {
      const message = error.response?.data?.message || 'CSVアップロードに失敗しました';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const tabs = [
    { id: 'users', name: 'ユーザー管理', icon: Users },
    { id: 'words', name: '単語管理', icon: BarChart3 },
    { id: 'upload', name: 'CSVアップロード', icon: Upload }
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 glass-morphism px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ダッシュボードに戻る</span>
          </button>

          <h1 className="text-2xl font-bold text-white">管理画面</h1>
          <div></div>
        </div>

        {/* タブナビゲーション */}
        <div className="glass-morphism rounded-2xl p-2 mb-6">
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-600 font-medium'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="space-y-6">
          {/* ユーザー管理 */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* 新規ユーザー作成 */}
              <div className="glass-morphism rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">新規ユーザー作成</h2>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="メールアドレス"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white placeholder-white/60"
                    required
                  />
                  <input
                    type="password"
                    placeholder="パスワード"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white placeholder-white/60"
                    required
                  />
                  <input
                    type="text"
                    placeholder="名前"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white placeholder-white/60"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white"
                  >
                    <option value="student">生徒</option>
                    <option value="admin">管理者</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="md:col-span-2 btn-primary flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{loading ? '作成中...' : 'ユーザー作成'}</span>
                  </button>
                </form>
              </div>

              {/* ユーザー一覧 */}
              <div className="glass-morphism rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">ユーザー一覧</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2">メール</th>
                        <th className="text-left py-2">名前</th>
                        <th className="text-left py-2">役割</th>
                        <th className="text-left py-2">作成日</th>
                        <th className="text-left py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-white/10">
                          <td className="py-2">{user.email}</td>
                          <td className="py-2">{user.name || '-'}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.role === 'admin' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}>
                              {user.role === 'admin' ? '管理者' : '生徒'}
                            </span>
                          </td>
                          <td className="py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="py-2">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 単語管理 */}
          {activeTab === 'words' && (
            <div className="space-y-6">
              {/* 新規単語追加 */}
              <div className="glass-morphism rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">新規単語追加</h2>
                <form onSubmit={handleCreateWord} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="英単語"
                    value={newWord.english}
                    onChange={(e) => setNewWord({...newWord, english: e.target.value})}
                    className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white placeholder-white/60"
                    required
                  />
                  <input
                    type="text"
                    placeholder="日本語"
                    value={newWord.japanese}
                    onChange={(e) => setNewWord({...newWord, japanese: e.target.value})}
                    className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white placeholder-white/60"
                    required
                  />
                  <select
                    value={newWord.level}
                    onChange={(e) => setNewWord({...newWord, level: e.target.value})}
                    className="bg-white/20 border border-white/30 rounded-lg py-2 px-4 text-white"
                  >
                    <option value="basic">基本</option>
                    <option value="intermediate">中級</option>
                    <option value="advanced">上級</option>
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="md:col-span-3 btn-primary flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{loading ? '追加中...' : '単語追加'}</span>
                  </button>
                </form>
              </div>

              {/* 単語一覧 */}
              <div className="glass-morphism rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">単語一覧 ({words.length}語)</h2>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-white">
                    <thead className="sticky top-0 bg-black/20">
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2">英語</th>
                        <th className="text-left py-2">日本語</th>
                        <th className="text-left py-2">レベル</th>
                        <th className="text-left py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {words.map((word) => (
                        <tr key={word.id} className="border-b border-white/10">
                          <td className="py-2 font-medium">{word.english}</td>
                          <td className="py-2">{word.japanese}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              word.level === 'basic' ? 'bg-green-500' :
                              word.level === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}>
                              {word.level === 'basic' ? '基本' :
                               word.level === 'intermediate' ? '中級' : '上級'}
                            </span>
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => handleDeleteWord(word.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CSVアップロード */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="glass-morphism rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">CSVファイルアップロード</h2>
                
                {/* CSVフォーマット説明 */}
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <h3 className="text-white font-medium mb-2">CSVファイルの形式</h3>
                  <p className="text-white/80 text-sm mb-2">
                    以下の形式でCSVファイルを作成してください：
                  </p>
                  <code className="block bg-black/30 p-2 rounded text-white/90 text-sm">
                    english,japanese,level<br/>
                    apple,りんご,basic<br/>
                    beautiful,美しい,intermediate<br/>
                    sophisticated,洗練された,advanced
                  </code>
                </div>

                <form onSubmit={handleCsvUpload} className="space-y-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/20 file:text-white hover:file:bg-white/30"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading || !csvFile}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{loading ? 'アップロード中...' : 'アップロード'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;