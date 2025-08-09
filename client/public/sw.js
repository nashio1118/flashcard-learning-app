const CACHE_NAME = 'flashcard-app-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// APIエンドポイント
const API_ENDPOINTS = [
  '/api/words',
  '/api/study/stats',
  '/api/auth/verify'
];

// Service Workerのインストール
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  
  // 即座に新しいService Workerをアクティブ化
  self.skipWaiting();
});

// Service Workerのアクティベーション
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 古いキャッシュを削除
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 即座に新しいService Workerを制御開始
        return self.clients.claim();
      })
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // HTMLリクエストの処理
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // ネットワークから取得できた場合はそれを返す
          return response;
        })
        .catch(() => {
          // ネットワークエラーの場合はキャッシュからindex.htmlを返す
          return caches.match('/');
        })
    );
    return;
  }

  // APIリクエストの処理
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      handleApiRequest(request)
    );
    return;
  }

  // 静的リソースの処理
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // レスポンスが正常でない場合はキャッシュしない
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          });
      })
  );
});

// APIリクエストの処理
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // ネットワークから取得を試行
    const networkResponse = await fetch(request);
    
    // GETリクエストで成功した場合はキャッシュに保存
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', url.pathname);
    
    // ネットワークエラーの場合
    if (request.method === 'GET') {
      // GETリクエストの場合はキャッシュから返す
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 単語データの場合はオフライン用のダミーデータを返す
      if (url.pathname === '/api/words') {
        return new Response(JSON.stringify([
          {
            id: 1,
            english: "offline",
            japanese: "オフライン",
            level: "basic"
          }
        ]), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 統計データの場合はダミーデータを返す
      if (url.pathname === '/api/study/stats') {
        return new Response(JSON.stringify({
          totalStudied: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          streak: 0,
          bestStreak: 0
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // POSTリクエストの場合はオフライン用の応答を返す
    if (request.method === 'POST') {
      // 学習記録の場合は成功レスポンスを返す（実際の保存は後で同期）
      if (url.pathname === '/api/study/answer') {
        // リクエストデータをローカルストレージに保存
        const requestData = await request.json();
        saveOfflineAnswer(requestData);
        
        return new Response(JSON.stringify({
          message: 'オフラインで記録しました。オンライン時に同期されます。'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // その他の場合はエラーレスポンスを返す
    return new Response(JSON.stringify({
      message: 'オフラインです。インターネット接続を確認してください。'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// オフライン時の回答をローカルストレージに保存
function saveOfflineAnswer(answerData) {
  try {
    const offlineAnswers = JSON.parse(localStorage.getItem('offlineAnswers') || '[]');
    offlineAnswers.push({
      ...answerData,
      offlineTimestamp: new Date().toISOString()
    });
    localStorage.setItem('offlineAnswers', JSON.stringify(offlineAnswers));
  } catch (error) {
    console.error('Failed to save offline answer:', error);
  }
}

// バックグラウンド同期（実験的機能）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// オフラインデータの同期
async function syncOfflineData() {
  try {
    const offlineAnswers = JSON.parse(localStorage.getItem('offlineAnswers') || '[]');
    
    for (const answer of offlineAnswers) {
      try {
        const response = await fetch('/api/study/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(answer)
        });
        
        if (response.ok) {
          // 同期成功した回答を削除
          const remainingAnswers = offlineAnswers.filter(a => a !== answer);
          localStorage.setItem('offlineAnswers', JSON.stringify(remainingAnswers));
        }
      } catch (error) {
        console.error('Failed to sync answer:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync offline data:', error);
  }
}

// プッシュ通知（将来の拡張用）
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});