# 🏗️ 总体架构

本文档面向想**深度贡献 / 二次开发**的开发者，快速建立全局认知。
（v1 架构见 [DESIGN-v1.md](./DESIGN-v1.md)，本文主要讲 v2）

---

## 🧩 架构图（总览）

```
┌──────────────────────────────────────────────────────────┐
│                     用户的设备                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Presentation (UI 层)                │    │
│  │                                                  │    │
│  │   index.html  ← 单页容器 (Phone Shell + TabBar)  │    │
│  │   styles.css  ← MIUIX 设计 Token + 组件          │    │
│  │   app.js      ← SPA 路由 / 渲染 / 事件绑定       │    │
│  └───────────────────▲──────────────────────────────┘    │
│                      │                                   │
│  ┌───────────────────┴──────────────────────────────┐    │
│  │              Domain (业务/状态层)                │    │
│  │                                                  │    │
│  │  U (当前用户)     DB (所有账号)    P (播放器)    │    │
│  │  ├─ xp/level      ├─ users[]       ├─ queue[]    │    │
│  │  ├─ srs{}         ├─ session        ├─ idx/flip  │    │
│  │  ├─ lessons{}     │                 └─ stats     │    │
│  │  └─ badges[]      │                              │    │
│  └───────────────────▲──────────────────────────────┘    │
│                      │                                   │
│  ┌───────────────────┴──────────────────────────────┐    │
│  │              Data (词库/课程)                    │    │
│  │   data.js  → LANGUAGES · COURSES · ACHIEVEMENTS  │    │
│  └───────────────────▲──────────────────────────────┘    │
│                      │                                   │
│  ┌───────────────────┴──────────────────────────────┐    │
│  │          Infrastructure (能力层 · 本地)          │    │
│  │                                                  │    │
│  │  localStorage  (save/load)  ←→  U, DB           │    │
│  │  speechSynthesis / WebView TTS (speak())        │    │
│  │  Service Worker  (离线缓存 assets)              │    │
│  │  JSON 导入/导出 (exportData / importData)       │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ──  安卓 APK 形态  ──                                   │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Android MainActivity (Java, WebView)           │    │
│  │   intercepts https://localhost/* → assets/www/*  │    │
│  │   (保证 storage / TTS / SW 都在一个 origin)     │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘

                       ☁️   无网络请求   ☁️
```

> 设计原则：**单页应用 + 纯本地存储 + 无任何网络请求**。
> 除了浏览器内部的 TTS 引擎，本应用不发起任何 fetch/XMLHttpRequest。

---

## 🗂️ 数据流（典型：学完一组词卡）

```
用户点「认识」
   │
   ▼
gradeWord(true)          ← app.js
   │
   ├─ 更新 U.srs[lessonId][word].box / due / reps
   ├─ P.idx++ / P.reviews++
   ├─ 若首次看到: U.stats.words++ / P.newWords++
   │
   └─ save() → JSON.stringify(DB) → localStorage.setItem('yujie:db')
   │
   ├─ checkBadges() → 触发成就解锁
   │
   └─ 若 P.idx >= P.queue.length → finishVocabSession()
            │
            ├─ XP += P.newWords * 2 + P.reviews
            ├─ U.lessons[lessonId] = {done:true, score, xp}
            ├─ save()
            └─ 渲染结算页 (modal with 完成按钮)
```

### SRS 算法（间隔重复）
```js
SRS_INTERVALS = [1, 2, 4, 7, 15, 30];  // 天数, Box 0-5
gradeWord(known):
    if known:   s.box = min(box+1, 5); s.due = today() + SRS_INTERVALS[s.box]
    else:       s.box = max(box-1, 0); s.due = today() + SRS_INTERVALS[s.box]
                + 当前卡片被插入 queue[idx+3] 位置, 本组稍后重现
```

到期判定：`today() >= s.due`，在 **复习** Tab 聚合所有课时的到期词，
生成复习队列，同样调用 `gradeWord()`。

---

## 💾 存储契约（localStorage Keys）

| Key | 内容 | 类型 |
|---|---|---|
| `yujie:db` | `{users:[...], session}` | JSON |
| `yujie:db_version` | 预留迁移版本号 | 数字 |

单条 `user` 结构：
```ts
interface User {
  id: string;                          // 随机 id
  name: string; avatar: string;        // 本地资料
  lang: 'en'|'ja'|'ko'; level: string; // 当前学习语言+等级
  dailyGoal: number;                   // 每日目标词数 10|20|30|40
  ttsRate: number;                     // 朗读语速 0.5~1.5
  xp: number;                          // 累计经验值
  badges: string[];                    // 已解锁成就 id
  srs: Record<lessonId,Record<word,{box:0..5, due:string, reps:number, seen:boolean}>>;
  lessons: Record<lessonId,{done:boolean, score:number, xp:number, at:number}>;
  stats: {decks:number, words:number, reviews:number,
          grammar:number, listen:number, speak:number};
  createdAt: number;                   // 创建时间
  lastStudyDate?: string;              // 最后学习日期(用于连续天数)
  streak?: number;                     // 连续学习天数
}
```

**JSON 导入导出**：直接序列化整个 `DB + DB_VERSION`，并附加 `exportedAt` 时间戳。
导入时按「合并策略」：id 相同的用户取更新时间较新的合并。

---

## 🧭 SPA 路由（Hash-Based）

不依赖 History API，避免 file:// 和 WebView 限制。

```
#home      → 首页(今日学习卡片 + 推荐)
#courses   → 词书(语言切换 → 等级 → 单元 → 课时)
#review    → 复习(所有到期的 SRS 卡片聚合)
#me        → 我的(个人统计 + 设置)
```

- URL 变化：`render()` 根据 `location.hash` 路由
- 所有内部导航都走 `<a href="#xxx">`，无需任何 polyfill

---

## 🎨 设计系统（MIUIX）

设计 Token 全部集中在 `styles.css` 顶部的 `:root`：

```
色彩：  --bg / --surface / --primary(#FF6900) / --success / --warning / --danger
       --text(强)  --text-2(正文)  --text-3(辅助)  --divider
间距：  --space-xs=4  sm=8  md=12  lg=16  xl=20  xxl=28
圆角：  --radius-sm=8  md=12  lg=16  xl=20  pill=999
阴影：  阴影 1/2/3 三档(高度分层)
字号：  --fs-xs=11  sm=12  base=14  lg=16  xl=20  2xl=28
字体：  system-ui + 系统中日韩回退
```

组件：`.card` `.btn-primary` `.btn-ghost` `.chip` `.tabbar` `.modal-mask/.modal`
`.progress-bar` `.badge-card` `.stat-card` `.avatar` `.toast` `.lesson-card`
`.word-card` (翻面 3D) `.set-group/.set-row` `.sec-title`

---

## 📱 APK 外壳（WebView 策略）

**为什么不用 `file:///android_asset/...`？**
- Service Worker 要求 http(s) origin
- localStorage 在 file:// 上不同路径可能不共享
- 某些国产 ROM 的 WebView 对 file:// 有限制

**采用 `https://localhost` 虚拟 origin + 资源注入**：
```
WebViewClient.shouldInterceptRequest(req):
  if req.url starts with https://localhost/:
    path = URL.path.replace(/^\//,'')
    open AssetManager.open("www/" + path)
    return WebResourceResponse(mime, "utf-8", inputStream)
```

这样 v2 的所有源码（index.html/css/js/manifest/sw.js/icons）都塞进 `assets/www/`，
WebView 认为自己访问的是「真实 HTTPS 网站」，PWA/storage/TTS 行为 100% 一致。

**打包流程**（`android/build.sh`）：
```
aapt2 compile  res → res.zip
   ↓
aapt2 link  AndroidManifest + res.zip + assets/www → base.apk + R.java
   ↓
javac --release 8 java/... → classes.jar
   ↓
d8 --release --min-api 24 classes.jar → classes.dex
   ↓
zip base.apk + classes.dex → unsigned.apk
   ↓
zipalign 4  → aligned.apk
   ↓
apksigner sign (yujie.keystore) → 语界-LinguaVerse-v3.0.apk  ✅
```

---

## 🛠️ 调试技巧

- **看 DB 内容**：控制台 `JSON.parse(localStorage.getItem('yujie:db'))`
- **清空用户数据重走引导**：`localStorage.clear(); location.reload()`
- **模拟 100 天后到期**：`U.srs = {}; save(); render()` 后直接看到复习空状态
- **强制所有到期**：
  ```js
  DB.users.forEach(u => Object.values(u.srs).forEach(L =>
    Object.values(L).forEach(w => w.due='2000-01-01')));
  save(); location.reload();
  ```
- **绕过引导直接拿默认用户**：`U = DB.users[0]`（调试用）

---

## 🚦 版本兼容策略

| 目标 | 最低版本 | 说明 |
|---|---|---|
| 桌面 Chrome | 88+ | ES2020 + SpeechSynthesis + ES 模块可选 |
| 桌面 Safari | 14+ | Big Sur 以后 |
| 手机 Chrome（Android） | 72+ | Android 9+ |
| WebView（安卓 APK） | 58 (Android 7 起) | 实际 APK 最低 minSdk 24 (Android 7.0) |
| iOS Safari | 14+ | PWA「添加到主屏」|

JS 代码刻意只用 ES2017 语法（避免 ?. / ?? / 动态 import），确保老 WebView 直接跑。

---

## 🎯 贡献代码时的架构红线

为了不偏离「纯离线、零请求」的初心，以下 PR 会被礼貌地要求修改：

1. ❌ 在代码中引入任何 `fetch()` / `XMLHttpRequest()` 到外部域名
2. ❌ 引入需要联网才能工作的第三方 JS SDK（统计、广告、远程 TTS）
3. ❌ 把个人资料 / 学习进度发送到任何服务器（端到端加密可选云同步除外）
4. ❌ UI 脱离 MIUIX 设计 Token（硬编码颜色、自造间距）
5. ❌ 破坏 v1/v2 分目录结构（顶层目录保持工程/文档，v1/v2 放版本代码）

欢迎讨论边界情况 ✨
