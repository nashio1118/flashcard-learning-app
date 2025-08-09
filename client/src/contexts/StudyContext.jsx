import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const StudyContext = createContext();

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};

export const StudyProvider = ({ children }) => {
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [studyStats, setStudyStats] = useState({
    totalStudied: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    streak: 0,
    bestStreak: 0
  });
  const [loading, setLoading] = useState(false);

  // 単語データを取得
  const fetchWords = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/words');
      setWords(response.data);
      setCurrentWordIndex(0);
    } catch (error) {
      console.error('Failed to fetch words:', error);
      toast.error('単語データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 学習統計を取得
  const fetchStudyStats = async () => {
    try {
      const response = await axios.get('/api/study/stats');
      setStudyStats(response.data);
    } catch (error) {
      console.error('Failed to fetch study stats:', error);
    }
  };

  // 回答を記録
  const recordAnswer = async (wordId, isCorrect) => {
    const answerData = {
      wordId,
      isCorrect,
      timestamp: new Date().toISOString()
    };

    try {
      await axios.post('/api/study/answer', answerData);

      // ローカル統計を更新
      setStudyStats(prev => ({
        ...prev,
        totalStudied: prev.totalStudied + 1,
        correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
        incorrectAnswers: isCorrect ? prev.incorrectAnswers : prev.incorrectAnswers + 1,
        streak: isCorrect ? prev.streak + 1 : 0,
        bestStreak: isCorrect && prev.streak + 1 > prev.bestStreak ? prev.streak + 1 : prev.bestStreak
      }));

    } catch (error) {
      console.error('Failed to record answer:', error);
      
      // オフラインの場合はローカルストレージに保存
      if (!navigator.onLine) {
        try {
          const offlineAnswers = JSON.parse(localStorage.getItem('offlineAnswers') || '[]');
          offlineAnswers.push(answerData);
          localStorage.setItem('offlineAnswers', JSON.stringify(offlineAnswers));
          
          // ローカル統計は更新
          setStudyStats(prev => ({
            ...prev,
            totalStudied: prev.totalStudied + 1,
            correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
            incorrectAnswers: isCorrect ? prev.incorrectAnswers : prev.incorrectAnswers + 1,
            streak: isCorrect ? prev.streak + 1 : 0,
            bestStreak: isCorrect && prev.streak + 1 > prev.bestStreak ? prev.streak + 1 : prev.bestStreak
          }));
          
          toast.success('オフラインで記録しました');
        } catch (storageError) {
          console.error('Failed to save offline answer:', storageError);
          toast.error('回答の記録に失敗しました');
        }
      } else {
        toast.error('回答の記録に失敗しました');
      }
    }
  };

  // 次の単語に進む
  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setCurrentWordIndex(0); // 最後の単語の場合は最初に戻る
    }
  };

  // 前の単語に戻る
  const previousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    } else {
      setCurrentWordIndex(words.length - 1); // 最初の単語の場合は最後に戻る
    }
  };

  // 現在の単語を取得
  const getCurrentWord = () => {
    return words[currentWordIndex] || null;
  };

  // 正答率を計算
  const getAccuracyRate = () => {
    const total = studyStats.correctAnswers + studyStats.incorrectAnswers;
    return total > 0 ? Math.round((studyStats.correctAnswers / total) * 100) : 0;
  };

  const value = {
    words,
    currentWordIndex,
    studyStats,
    loading,
    fetchWords,
    fetchStudyStats,
    recordAnswer,
    nextWord,
    previousWord,
    getCurrentWord,
    getAccuracyRate
  };

  return (
    <StudyContext.Provider value={value}>
      {children}
    </StudyContext.Provider>
  );
};