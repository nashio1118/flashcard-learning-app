import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, SkipForward, SkipBack } from 'lucide-react';
import { useStudy } from '../contexts/StudyContext';
import LoadingSpinner from './LoadingSpinner';

const StudyMode = () => {
  const navigate = useNavigate();
  const { 
    words, 
    currentWordIndex, 
    studyStats,
    loading,
    fetchWords,
    recordAnswer,
    nextWord,
    previousWord,
    getCurrentWord
  } = useStudy();

  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (words.length === 0) {
      fetchWords();
    }
  }, [words.length, fetchWords]);

  useEffect(() => {
    // 新しい単語になったらカードをリセット
    console.log('🔄 Resetting card state for word index:', currentWordIndex);
    setIsFlipped(false);
    setShowAnswer(false);
    setAnswered(false);
  }, [currentWordIndex]);

  const currentWord = getCurrentWord();

  const handleCardClick = () => {
    if (!answered) {
      setIsFlipped(!isFlipped);
      if (!showAnswer) {
        setShowAnswer(true);
      }
    }
  };

  const handleAnswer = async (isCorrect) => {
    if (answered || !currentWord) return;

    setAnswered(true);
    
    // 短い遅延後に次の単語に進む
    setTimeout(() => {
      nextWord(); // useEffectが自動的に状態をリセット
    }, 300);
    
    // API通信は非同期で実行（エラーハンドリングも含む）
    recordAnswer(currentWord.id, isCorrect).catch(error => {
      console.error('Failed to record answer:', error);
    });
  };

  const handleSkip = () => {
    nextWord();
  };

  const handlePrevious = () => {
    previousWord();
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <LoadingSpinner text="単語を読み込み中..." />;
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-morphism rounded-2xl p-8 text-center">
          <p className="text-white text-lg mb-4">学習する単語がありません</p>
          <button 
            onClick={handleBackToDashboard}
            className="btn-primary"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 glass-morphism px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>戻る</span>
          </button>

          <div className="glass-morphism px-4 py-2 rounded-lg">
            <span className="text-white font-medium">
              {currentWordIndex + 1} / {words.length}
            </span>
          </div>

          <div className="glass-morphism px-4 py-2 rounded-lg">
            <span className="text-white font-medium">
              連続: {studyStats.streak}
            </span>
          </div>
        </div>

        {/* フラッシュカード */}
        <div className="relative mb-8" style={{ height: '400px' }}>
          <div
            className={`card-flip w-full h-full cursor-pointer ${isFlipped ? 'flipped' : ''}`}
            onClick={handleCardClick}
          >
            {/* 表面（英語） */}
            <div className="card-front glass-morphism rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <span className="text-white/60 text-sm font-medium">英単語</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-4">
                {currentWord.english}
              </div>
              <div className="text-white/60 text-sm">
                タップして日本語を表示
              </div>
            </div>

            {/* 裏面（日本語） */}
            <div className="card-back glass-morphism rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <span className="text-white/60 text-sm font-medium">日本語</span>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-4">
                {currentWord.japanese}
              </div>
              <div className="text-2xl md:text-3xl text-white/80 mb-4">
                {currentWord.english}
              </div>
              <div className="text-white/60 text-sm">
                知っていましたか？
              </div>
            </div>
          </div>
        </div>

        {/* 操作ボタン */}
        <div className="space-y-4">
          {showAnswer && !answered && (
            <div className="flex space-x-4">
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <XCircle className="w-5 h-5" />
                <span>知らない</span>
              </button>

              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <CheckCircle className="w-5 h-5" />
                <span>知っている</span>
              </button>
            </div>
          )}

          {answered && (
            <div className="text-center">
              <div className="glass-morphism rounded-lg p-3">
                <p className="text-white text-sm">✅ 記録中...</p>
              </div>
            </div>
          )}



          {/* ナビゲーションボタン */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              className="flex items-center space-x-2 glass-morphism px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              disabled={answered}
            >
              <SkipBack className="w-4 h-4" />
              <span>前へ</span>
            </button>

            <button
              onClick={handleSkip}
              className="flex items-center space-x-2 glass-morphism px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              disabled={answered}
            >
              <span>スキップ</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 学習統計（簡易版） */}
        <div className="mt-8 glass-morphism rounded-2xl p-4">
          <div className="flex justify-between items-center text-sm">
            <div className="text-white/80">
              正解率: <span className="font-medium text-white">{studyStats.correctAnswers + studyStats.incorrectAnswers > 0 ? Math.round((studyStats.correctAnswers / (studyStats.correctAnswers + studyStats.incorrectAnswers)) * 100) : 0}%</span>
            </div>
            <div className="text-white/80">
              学習済み: <span className="font-medium text-white">{studyStats.totalStudied}</span>
            </div>
            <div className="text-white/80">
              最高連続: <span className="font-medium text-white">{studyStats.bestStreak}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyMode;