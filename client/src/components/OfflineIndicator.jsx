import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      
      // 3秒後にインジケーターを非表示
      setTimeout(() => setShowIndicator(false), 3000);
      
      // オフラインデータの同期を試行
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    // ペンディング中の同期データをチェック
    const checkPendingSync = () => {
      try {
        const offlineAnswers = JSON.parse(localStorage.getItem('offlineAnswers') || '[]');
        setPendingSync(offlineAnswers.length);
      } catch {
        setPendingSync(0);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 初期チェック
    checkPendingSync();
    
    // 定期的にペンディングデータをチェック
    const interval = setInterval(checkPendingSync, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const syncOfflineData = async () => {
    try {
      const offlineAnswers = JSON.parse(localStorage.getItem('offlineAnswers') || '[]');
      const token = localStorage.getItem('token');
      
      if (!token || offlineAnswers.length === 0) {
        return;
      }

      for (const answer of offlineAnswers) {
        try {
          const response = await fetch('/api/study/answer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              wordId: answer.wordId,
              isCorrect: answer.isCorrect,
              timestamp: answer.timestamp
            })
          });

          if (response.ok) {
            // 同期成功した回答を削除
            const remainingAnswers = offlineAnswers.filter(a => a !== answer);
            localStorage.setItem('offlineAnswers', JSON.stringify(remainingAnswers));
            setPendingSync(remainingAnswers.length);
          }
        } catch (error) {
          console.error('Failed to sync answer:', error);
          break; // エラーが発生したら同期を停止
        }
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  };

  // オンラインで表示する必要がない場合は何も表示しない
  if (isOnline && !showIndicator && pendingSync === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`glass-morphism rounded-lg px-4 py-2 shadow-lg transition-all duration-300 ${
        showIndicator ? 'animate-bounce-in' : ''
      }`}>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-white text-sm font-medium">
                オンライン
              </span>
              {pendingSync > 0 && (
                <>
                  <Cloud className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-white/80 text-xs">
                    同期中... ({pendingSync}件)
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-white text-sm font-medium">
                オフライン
              </span>
              {pendingSync > 0 && (
                <>
                  <CloudOff className="w-4 h-4 text-orange-400" />
                  <span className="text-white/80 text-xs">
                    未同期: {pendingSync}件
                  </span>
                </>
              )}
            </>
          )}
        </div>
        
        {!isOnline && (
          <div className="text-white/70 text-xs mt-1">
            学習データはオンライン時に同期されます
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;