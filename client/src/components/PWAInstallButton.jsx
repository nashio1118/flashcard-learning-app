import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // PWAが既にインストールされているかチェック
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    // beforeinstallpromptイベントをリッスン
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // アプリがインストールされた後
    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
  };

  // インストール済みまたは表示条件を満たさない場合は何も表示しない
  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="glass-morphism rounded-xl p-4 shadow-2xl animate-slide-in">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">
                アプリをインストール
              </h3>
              <p className="text-white/70 text-xs">
                ホーム画面に追加して簡単アクセス
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            インストール
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white/70 hover:text-white/90 text-sm transition-colors"
          >
            後で
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallButton;