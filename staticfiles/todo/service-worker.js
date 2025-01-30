// static/todo/service-worker.js （パスはお好み）

self.addEventListener('install', (event) => {
    // インストール時にキャッシュを確保など
    event.waitUntil(
      caches.open('my-todo-app-cache').then((cache) => {
        // 必要なファイルをキャッシュに追加
        return cache.addAll([
          '/tasks',
          '/static/todo/main.css',
          '/static/todo/main.js',
          '/static/todo/manifest.json',
          // その他オフラインで使うファイル
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    // ネットワークがない場合などにキャッシュから返す例
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  