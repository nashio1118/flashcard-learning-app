// Service Worker登録
export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// PWAインストールプロンプト
export class PWAInstallPrompt {
  constructor() {
    this.deferredPrompt = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // beforeinstallpromptイベントをキャッチ
    window.addEventListener('beforeinstallprompt', (e) => {
      // デフォルトのインストールプロンプトを無効化
      e.preventDefault();
      this.deferredPrompt = e;
      
      // カスタムインストールボタンを表示
      this.showInstallButton();
    });

    // アプリがインストールされた後
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA was installed');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  }

  // インストールボタンを表示
  showInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
    }
  }

  // インストールボタンを非表示
  hideInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  // インストールプロンプトを表示
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      return false;
    }

    // インストールプロンプトを表示
    this.deferredPrompt.prompt();

    // ユーザーの選択を待つ
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // プロンプトをクリア
    this.deferredPrompt = null;

    return outcome === 'accepted';
  }

  // PWAがインストール可能かチェック
  canInstall() {
    return this.deferredPrompt !== null;
  }
}

// オフライン状態の検知
export class OfflineDetector {
  constructor(onOnline, onOffline) {
    this.onOnline = onOnline;
    this.onOffline = onOffline;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('App is online');
      if (this.onOnline) this.onOnline();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      if (this.onOffline) this.onOffline();
    });
  }

  isOnline() {
    return navigator.onLine;
  }
}

// データの同期管理
export class DataSync {
  constructor() {
    this.pendingActions = this.getPendingActions();
  }

  // ローカルストレージから未同期のアクションを取得
  getPendingActions() {
    try {
      return JSON.parse(localStorage.getItem('pendingActions') || '[]');
    } catch {
      return [];
    }
  }

  // 未同期のアクションを保存
  savePendingActions() {
    localStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
  }

  // アクションを追加
  addPendingAction(action) {
    this.pendingActions.push({
      ...action,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    });
    this.savePendingActions();
  }

  // 同期実行
  async syncPendingActions() {
    if (!navigator.onLine || this.pendingActions.length === 0) {
      return;
    }

    const actionsToSync = [...this.pendingActions];
    
    for (const action of actionsToSync) {
      try {
        await this.executeAction(action);
        // 成功したアクションを削除
        this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }

    this.savePendingActions();
  }

  // アクションを実行
  async executeAction(action) {
    const { type, data } = action;
    
    switch (type) {
      case 'RECORD_ANSWER':
        const response = await fetch('/api/study/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error('Failed to sync answer');
        }
        break;
        
      default:
        console.warn('Unknown action type:', type);
    }
  }

  // 未同期のアクション数を取得
  getPendingCount() {
    return this.pendingActions.length;
  }
}