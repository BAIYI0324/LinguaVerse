/* 语界 LinguaVerse v3.0 · Service Worker
   策略:
   - Shell (HTML/CSS/JS/图片): 缓存优先 (Cache First), 离线秒开
   - 接口(非GET) + 跨域音频: 网络优先, 失败忽略
   - 跨域 CDN mp3: 尝试 clone 入缓存,失败忽略(交给应用层兜底)
*/
const CACHE_SHELL = 'yujie-shell-v3.0';
const CACHE_RUNTIME = 'yujie-runtime-v3.0';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/data.js',
  './js/app.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_SHELL).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
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

  // ① 同源静态: 缓存优先
  if (url.origin === location.origin) {
    // 导航请求: 网络优先(尽量拿到最新html), 失败用离线index
    if (req.mode === 'navigate') {
      e.respondWith(
        fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE_SHELL).then(c => c.put(req, copy));
          return res;
        }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
      );
      return;
    }
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        // 缓存动态资源(避免SW崩溃)
        if (res && res.ok && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_RUNTIME).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => caches.match('./index.html')))
    );
    return;
  }

  // ② 跨域 mp3: 网络优先, 成功后尝试缓存
  if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && res.ok) {
          try {
            const copy = res.clone();
            caches.open(CACHE_RUNTIME).then(c => c.put(req, copy)).catch(()=>{});
          } catch(_) {}
        }
        return res;
      }).catch(() => hit || new Response('', {status: 503})))
    );
    return;
  }

  // ③ 其他跨域(字体等): 网络优先
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) {
        try {
          const copy = res.clone();
          caches.open(CACHE_RUNTIME).then(c => c.put(req, copy)).catch(()=>{});
        } catch(_) {}
      }
      return res;
    }).catch(() => hit || new Response('', {status: 503})))
  );
});
