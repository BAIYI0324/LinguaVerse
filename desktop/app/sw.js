/* 语界 LinguaVerse v5.1 · Service Worker
   策略:
   - 静态资源: 网络优先(保证升级即时生效), 失败回退缓存, 彻底离线可用
   - 缓存名带版本号, 升级时旧缓存自动清理, 杜绝"升级后白屏"
*/
const CACHE_SHELL = 'yujie-shell-v5.1';
const CACHE_RUNTIME = 'yujie-runtime-v5.1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/data.js',
  './js/app.js',
  './js/data_words_patch.js',
  './js/vendor/mespeak/mespeak_config.js',
  './js/vendor/mespeak/ESpeak.js',
  './js/vendor/mespeak/mespeak.js',
  './js/vendor/mespeak/voice-en-us.js',
  './js/vendor/mespeak/voice-zh.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_SHELL)
      .then(c => c.addAll(SHELL).catch(()=>{}))  // 单项失败不阻塞安装
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_SHELL && k !== CACHE_RUNTIME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 同源: 网络优先, 失败用缓存 (升级即时生效, 离线仍可用)
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_SHELL).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() =>
        caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
      )
    );
    return;
  }

  // 跨域音频: 网络优先, 成功后缓存
  if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) {
          try {
            const copy = res.clone();
            caches.open(CACHE_RUNTIME).then(c => c.put(req, copy)).catch(()=>{});
          } catch(_) {}
        }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || new Response('', {status: 503})))
    );
    return;
  }

  // 其他跨域(字体等): 网络优先
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        try {
          const copy = res.clone();
          caches.open(CACHE_RUNTIME).then(c => c.put(req, copy)).catch(()=>{});
        } catch(_) {}
      }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || new Response('', {status: 503})))
  );
});
