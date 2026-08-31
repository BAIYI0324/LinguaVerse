# 语界 LinguaVerse · Code Wiki

> 版本：v4.0.0 ｜ 类型：PWA + Android WebView 离线多语种学习应用
> 主题：四六级英语 · 日语 · 韩语，"不背单词式"词卡 + SRS 间隔复习
> 协议：MIT

---

## 目录

1. [项目概览](#1-项目概览)
2. [整体架构](#2-整体架构)
3. [目录结构](#3-目录结构)
4. [主要模块职责](#4-主要模块职责)
5. [核心数据结构](#5-核心数据结构)
6. [关键类与函数说明](#6-关键类与函数说明)
7. [SRS 间隔复习算法](#7-srs-间隔复习算法)
8. [离线 TTS 语音管线](#8-离线-tts-语音管线)
9. [数据持久化与同步](#9-数据持久化与同步)
10. [依赖关系](#10-依赖关系)
11. [项目运行方式](#11-项目运行方式)
12. [Android 构建说明](#12-android-构建说明)
13. [已知注意事项](#13-已知注意事项)

---

## 1. 项目概览

**语界 LinguaVerse** 是一个完全离线运行的多语种学习应用，核心特点：

- **纯内置离线**：朗读由前端 `meSpeak.js`（eSpeak Emscripten）纯 JS 合成 WAV，不依赖任何外部 TTS 服务、系统已安装 TTS 软件或词典 CDN。
- **不背单词式词卡**：左右滑动翻卡 / 长按发音 / 自动朗读，配合 SRS（间隔重复）记忆系统。
- **多语种**：英语（CET-4 / CET-6）、日语（N5 / N4）、韩语（TOPIK I / II）。
- **本地账号**：数据全在本机（localStorage + IndexedDB），支持多账号、导入导出。
- **双形态部署**：作为 PWA 直接在浏览器运行，或打包为 Android APK（WebView 外壳）。
- **澎湃美学 UI**：HyperOS 风格设计系统，渐变 / 毛玻璃 / 大圆角 / 触感反馈。

**词库规模**：CET-4 扩充词库 4500+ 词、CET-6 扩充词库 2000+ 词，按课切片。

---

## 2. 整体架构

应用采用 **单页应用（SPA）+ 纯原生 JS** 架构，无任何前端框架，所有逻辑集中在 `js/app.js`（约 1816 行）。

```
┌─────────────────────────────────────────────────────────────┐
│                     Android WebView 外壳                      │
│  MainActivity.java → 加载 https://localhost/ → assets/www/  │
└───────────────────────────┬─────────────────────────────────┘
                            │ (WebView 拦截 localhost 请求，从 assets 注入)
┌───────────────────────────▼─────────────────────────────────┐
│                         PWA 前端层                            │
│  index.html (入口)                                           │
│   ├─ css/styles.css      HyperOS 设计系统                      │
│   ├─ js/vendor/mespeak/  离线 TTS 引擎 (eSpeak Emscripten)     │
│   ├─ js/data.js         课程/词库/SRS/成就 数据                 │
│   ├─ js/data_words_patch.js  四六级扩充词库 + 课切片范围         │
│   └─ js/app.js          全部应用逻辑 (SPA 渲染/播放器/账号)      │
│                                                              │
│  sw.js                 Service Worker (离线缓存)              │
│  manifest.json         PWA 清单                               │
└──────┬────────────────┬───────────────────┬──────────────────┘
       │                │                   │
┌──────▼──────┐  ┌──────▼──────┐    ┌───────▼────────┐
│ localStorage │  │ IndexedDB   │    │ Service Worker  │
│  用户/SRS/   │  │ 音频 Blob   │    │  Cache (Shell)  │
│  XP/设置     │  │ 永久缓存     │    │  离线秒开        │
└─────────────┘  └─────────────┘    └─────────────────┘
```

**渲染模型**：`render()` 是唯一渲染入口，根据当前 `tab` / `courseView` 状态，将对应 `renderHome/renderCourses/renderCourseDetail/renderReview/renderMe` 的 HTML 字符串注入 `#app` 容器。学习播放器（词卡 / Quiz）作为独立覆盖层 `#player` 渲染。事件通过 `onclick` 内联 + `exposeAPI()` 暴露的全局函数绑定。

---

## 3. 目录结构

```
/workspace
├── index.html                 # 应用入口（加载全部脚本）
├── manifest.json              # PWA 清单
├── sw.js                      # Service Worker（缓存优先策略）
├── gen_words.js               # Node.js 词库生成器（产物: data_words_patch.js）
├── css/
│   └── styles.css             # HyperOS 设计系统（1137 行）
├── js/
│   ├── app.js                 # 应用全部逻辑（1816 行）
│   ├── data.js                # 课程/词库/成就数据（926 行）
│   ├── data_words_patch.js    # 四六级扩充词库 + 课切片范围
│   └── vendor/mespeak/        # 离线 TTS 引擎
│       ├── mespeak.js / mespeak_config.js
│       ├── voice-en-us.js / voice-en-rp.js / voice-zh.js
│       └── voices/            # 语音数据
├── icons/                     # 应用图标（192/512/maskable/1024）
├── android/                   # Android WebView 外壳工程
│   ├── AndroidManifest.xml
│   ├── build.sh               # APK 直编脚本（无 Gradle）
│   ├── yujie.keystore         # 签名密钥
│   ├── java/com/yujie/app/MainActivity.java
│   ├── res/                   # 资源（主题/图标/网络安全配置）
│   ├── assets/www/            # 与根目录同构的前端资源副本
│   └── LinguaVerse-v4.0.0.apk # 预构建 APK
├── LinguaVerse-v4.0.0.apk     # 根目录预构建 APK
└── .gitignore
```

> `android/assets/www/` 是前端资源的打包副本，结构与根目录 `css/js/icons/index.html/manifest.json/sw.js` 一致，供 WebView 离线加载。

---

## 4. 主要模块职责

### 4.1 前端核心 `js/app.js`

按职责划分为以下区块（文件内以注释分隔）：

| 区块 | 职责 |
|------|------|
| 工具函数 | `$/$$/esc/shuffle/dateKey/today/GREET/colorOf` 等基础工具 |
| 词义归一化 | `normWord` / `lessonWords`：兼容英语富格式与日韩简格式，并按课切片取词 |
| 本地数据库 | `DB` 对象 + `save()` + `U`（当前用户）+ `newUser` |
| 反馈层 | `toast` / `confetti` / `haptic`（振动触感） |
| 语音引擎 | `ME`（meSpeak 封装）+ `AUD`（IndexedDB 音频缓存）+ `speak()` 公共入口 |
| 导航渲染 | `go/openCourse/render/bindCommon` + 四大页面渲染函数 |
| 引导流程 | `startOnboard/renderOnboard`（三步：昵称头像 → 语言等级 → 每日目标） |
| 设置弹窗 | `showGoalModal/setGoal/showRateModal/setRate/showModal/closeModalMask` |
| 本地账号 | `switchAccount/selectAccount/exportData/importData/confirmClear/doClear` |
| 成就/打卡 | `checkBadges/touchStreak` |
| 词汇播放器 | `openLesson/startVocabSession/startReview/renderPlayer` + 词卡手势 + `gradeWord/finishVocabSession` |
| Quiz 播放器 | `startQuizSession/renderQuiz/replayListen/answerQuiz/startRecognize/scoreSelf/nextQuiz/finishQuizSession` |
| 全局初始化 | `exposeAPI` + `DOMContentLoaded` 应用外壳注入 + SW 注册 + 错误兜底 |

### 4.2 数据层 `js/data.js`

- `LANGUAGES`：三种语言及其等级定义。
- `TYPE_META` / `SKILL_NAME`：课型元信息（词汇/语法/听力/口语）。
- `COURSES`：语言 → 等级 → 单元（units）→ 课（lessons）的层级结构。
- `CONTENT`：按 `lessonId` 索引的具体内容（单词数组 / 语法题 / 听力 / 口语）。
- `SRS_INTERVALS`：间隔复习天数表 `[1, 2, 4, 7, 15, 30]`。
- `ACHIEVEMENTS`：成就定义（含 `check` 判定与 `prog` 进度回调）。
- `DAILY_QUOTES`：每日一句（`{t, m}` 格式，注意见 §13）。

### 4.3 扩充词库 `js/data_words_patch.js`

由 `gen_words.js` 生成，提供大规模四六级词库与课切片：

- `CET4_WORDS` / `CET6_WORDS`：扁平词数组。
- `CET4_LESSONS_RANGE` / `CET6_LESSONS_RANGE`：`{ 课id: [起始下标, 结束下标] }`，供 `lessonWords()` 按 `slice` 切出每课词汇。
- 兼容 CommonJS（`module.exports`），便于生成器测试。

### 4.4 离线 TTS `js/vendor/mespeak/`

eSpeak 经 Emscripten 编译的纯 JS 语音合成引擎，提供英语（美音/RP）、中文语音包。首次合成 WAV 后缓存至 IndexedDB，下次命中秒开。

### 4.5 Service Worker `sw.js`

- Shell（HTML/CSS/JS/图片）：缓存优先，离线秒开。
- 导航请求：网络优先，失败回退离线 index。
- 跨域音频：网络优先，成功尝试缓存。

### 4.6 Android 外壳 `android/`

- `MainActivity.java`：以 `https://localhost/` 虚拟域名加载 `assets/www/`，拦截请求从 assets 注入资源；沉浸式状态栏；WebView 配置（JS/DOMStorage/数据库/媒体自动播放）。`shouldOverrideUrlLoading` 限制仅允许 localhost。
- `build.sh`：用 `aapt2/javac/d8/zipalign/apksigner` 直接产出签名 APK，无需 Gradle。
- `AndroidManifest.xml`：仅保留 `INTERNET`/`ACCESS_NETWORK_STATE` 权限（离线不依赖），移除所有 TTS/麦克风权限。

---

## 5. 核心数据结构

### 5.1 用户对象 `U`（由 `newUser` 创建）

```js
{
  id, name, avatar, color, createdAt, lang, level,
  dailyGoal, ttsRate, xp,
  streak: { count, last, days: {} },   // 连续打卡
  log: {},                              // { 'YYYY-MM-DD': {words, review, xp} }
  stats: { decks, words, reviews, grammar, listen, speak },
  srs: {},                              // { lessonId: { word: {box, due, reps, seen} } }
  lessons: {},                          // { lessonId: {done, at, xp, score} }
  badges: []                            // 已解锁成就 id
}
```

### 5.2 SRS 单词记录（存于 `U.srs[lessonId][word]`）

```js
{ box, due, reps, seen }   // box: 0..6, due: 'YYYY-MM-DD', seen: 是否已首次学过
```

### 5.3 顶层 `DB`（localStorage `yujie_v3`）

```js
{ users: [], session: null, prefs: { autoSpeak, theme, accent } }
```

### 5.4 课程层级 `COURSES`

```
COURSES[lang][level] = [ { id, title, desc, lessons: [ { id, type, title, xp } ] } ]
```

### 5.5 内容对象 `CONTENT[lessonId]`

- 词汇课：`{ words: [[词, 音标, 释义, 词根, [[例句, 译文, 标签], ...]], ...] }`
- 日韩简格式：`{ words: [[词, 读音, 释义, 例句, 例句译文], ...] }`（由 `normWord` 归一化）
- 语法/听力/口语课：`{ items: [ ... ] }`（详见 §13 字段约定）

### 5.6 词库切片 `CET4_LESSONS_RANGE`

```js
{ "en-c4-u1-v": [0, 157], "en-c4-u1-v-2": [157, 314], ... }
```

---

## 6. 关键类与函数说明

### 6.1 工具与数据

| 名称 | 类型 | 说明 |
|------|------|------|
| `$` / `$$` | fn | `querySelector` / `querySelectorAll` 简写 |
| `esc(s)` | fn | HTML 转义，防注入 |
| `shuffle(a)` | fn | Fisher–Yates 洗牌（返回新数组） |
| `dateKey(offset)` / `today()` | fn | 生成 `YYYY-MM-DD` 日期键 |
| `colorOf(s)` | fn | 由字符串哈希映射到预设色板 |
| `normWord(lessonId, raw)` | fn | 把英语富格式 / 日韩简格式词条统一为 `{w, ph, def, root, ex}` |
| `lessonWords(lessonId)` | fn | 取某课全部单词：优先 `CONTENT`，否则按 `*_LESSONS_RANGE` 切片扩充词库 |
| `newUser(...)` | fn | 构造完整用户对象 |
| `save()` | fn | 将 `DB` 序列化写入 localStorage |
| `levelOf/userLevel` | fn | 取语言等级对象 |

### 6.2 语音（`ME` / `AUD` / `speak`）

| 名称 | 说明 |
|------|------|
| `ME.ensure()` | 懒加载 meSpeak 配置与语音包（en-us / en-rp / zh），返回就绪状态 |
| `ME.langToVoice(langId, accent)` | 语言→voice/variant 映射 |
| `ME.synthesize(text, langId, userRate)` | 合成 WAV → `Blob`（`rawdata` 模式） |
| `ME.playBlob(blob, rate)` | 用 `<audio>` 播放 Blob，15s 超时兜底 |
| `ME.stop()` | 停止播放与队列 |
| `AUD.openDB()` | 打开 IndexedDB `yujie_audio`（store: `blobs`，keyPath `k`） |
| `AUD.blobGet/blobPut` | 读写音频 Blob 缓存 |
| `speak(text, langId, rate, opts)` | **公共入口**：① IndexedDB 命中 → ② meSpeak 合成并缓存；用 `_speaking` 锁防并发 |

### 6.3 导航与渲染

| 名称 | 说明 |
|------|------|
| `go(tab)` | 切换主 Tab 并重渲染 |
| `openCourse(l, lv)` | 进入某语言等级的词书详情 |
| `render()` | 唯一渲染入口：未登录→引导；否则按 `tab`/`courseView` 注入对应页面 HTML，并 `bindCommon()` |
| `renderOnboard()` | 三步引导（昵称头像 / 语言等级 / 每日目标） |
| `renderHome()` | 首页：环形目标进度、连续打卡、推荐课、成就进度、每日一句、等级进度 |
| `renderCourses()` | 词书 Tab：语言 pill + 等级卡片网格 |
| `renderCourseDetail()` | 词书详情：单元 + 课程列表 + 完成进度 |
| `renderReview()` | 复习 Tab：到期词数 + SRS Box 分布 + 开始复习 |
| `renderMe()` | 我的：统计、连续打卡、成就、设置（目标/语速/网络/自动朗读/账号/导入导出/清空） |

### 6.4 学习播放器

#### 词汇卡（`mode: 'vocab' | 'review'`）

| 名称 | 说明 |
|------|------|
| `openLesson(lang, level, id)` | 路由：vocab→`startVocabSession`，其余→`startQuizSession` |
| `startVocabSession` | 取词、分新词/到期词、洗牌组队，初始化 `P` |
| `startReview` | 取全局到期词组队复习 |
| `renderPlayer()` | 渲染词卡（正反面）+ 评分按钮 + 进度；自动朗读 |
| `flipCard()` | 翻面 |
| `cardTouchStart/Move/End` / `cardMouseDown` | 触摸/鼠标手势：点击翻面、横滑评分、长按发音 |
| `handleSwipe(...)` | 横滑判定（>60px 且横向为主）：左滑不认识、右滑认识 |
| `gradeWord(known)` | **SRS 评分核心**：认识→升 box+设到期；不认识→降 box+隔位重现；写日志/统计 |
| `finishVocabSession()` | 结算 XP、标记课时完成、打卡、查成就、弹完成窗 |
| `askClosePlayer/closePlayer` | 退出确认 / 关闭播放器 |

#### Quiz（`mode: 'quiz'`，语法/听力/口语）

| 名称 | 说明 |
|------|------|
| `startQuizSession` | 按 `type` 取 `content.questions/dialogs/topics`，初始化 `P` |
| `renderQuiz()` | 渲染语法选择 / 听力对话 / 口语跟读三种 UI |
| `replayListen()` | 逐句 TTS 朗读听力对话 |
| `answerQuiz(i)` | 语法/听力判分，标记正误，延时进入下一题 |
| `startRecognize(lang)` | Web Speech API 跟读识别（不支持时降级提示） |
| `scoreSelf()` | 词级命中匹配算分 |
| `speakSelf()` | 回放本人录音 |
| `nextQuiz(point)` / `finishQuizSession()` | 推进 / 结算得分与 XP |

### 6.5 账号与设置

| 名称 | 说明 |
|------|------|
| `switchAccount/selectAccount` | 多账号切换 |
| `exportData/importData` | JSON 备份导出 / 合并导入（按 `id` 合并，取 XP 高者） |
| `confirmClear/doClear` | 清空当前用户学习记录 |
| `showGoalModal/setGoal` / `showRateModal/setRate` | 每日目标 / 朗读语速设置 |
| `toggleAutoSpeak` | 自动朗读开关 |
| `showModal/closeModalMask` | 通用模态框 |

### 6.6 成就与打卡

| 名称 | 说明 |
|------|------|
| `checkBadges()` | 遍历 `ACHIEVEMENTS`，`check(U)` 为真则解锁并 toast + 撒花 |
| `touchStreak()` | 连续打卡：与昨日比较累加或重置 |

### 6.7 初始化

| 名称 | 说明 |
|------|------|
| `exposeAPI()` | 把所有 `onclick` 用到的函数挂到 `window` |
| `DOMContentLoaded` 监听 | 一次性创建应用外壳（状态栏 / `#app` / `#player` / `#toasts` / `#tabbar`），启动定时器、初始渲染、注册 SW |
| `window.error` 兜底 | 防止白屏，失败时回退到引导 |

---

## 7. SRS 间隔复习算法

间隔表：`SRS_INTERVALS = [1, 2, 4, 7, 15, 30]`（天），对应 Box 1–6。

**评分逻辑**（`gradeWord(known)`）：

- **认识**：`box = min(box+1, 6)`，`due = 今日 + INTERVALS[box-1]`；首次标记 `seen`，记入新学；推进队列。
- **不认识**：`box = max(box-1, 0)`，`due = 今日 + INTERVALS[max(box,0)]`；将该词**插回队列向后 3 位**重现；同样首次标记 `seen`。

**到期判定**（`dueWords`）：遍历当前语言所有等级、所有课、所有词，`s.seen && s.due <= today()` 即到期。

**复习 Tab** 展示按 Box 分布的到期词数，Box 间隔为 1→2→4→7→15→30 天（掌握）。

---

## 8. 离线 TTS 语音管线

```
speak(text, langId, rate, opts)
   │
   ├─ source 为 'word'/'sentence' ?
   │     是 → 缓存 key = langId::[rate::]text.toLowerCase()
   │           ① AUD.blobGet(key)  命中(>200B) → ME.playBlob  ✓
   │           ② 未命中 → ME.synthesize 生成 WAV Blob
   │                       → AUD.blobPut 异步缓存
   │                       → ME.playBlob 播放
   │     否（长文/口语）→ 直接 synthesize 播放
   │
   └─ _speaking 全局锁防并发；ME.stop() 中断上一次
```

- `ME.synthesize`：调用 `mespeak.speak(text, {rawdata:true, speed, pitch, amplitude, voice})`，返回 `Uint8Array` → 包装为 `audio/wav` Blob。
- 首次交互（click/touchstart）触发 `ME.ensure()` 解锁 WebView 的 WebAudio。
- 语速映射：`speed = 170 * userRate`（80–400 clamp）。

---

## 9. 数据持久化与同步

| 存储 | 用途 | 位置 |
|------|------|------|
| `localStorage` (`yujie_v3`) | 全部用户/SRS/XP/设置（JSON） | `DB` / `save()` |
| IndexedDB (`yujie_audio`) | TTS 音频 Blob 永久缓存 | `AUD.blobGet/blobPut` |
| Service Worker Cache | Shell 离线缓存（`yujie-shell-v3.0`） + 运行时缓存 | `sw.js` |

**跨设备**：无云同步，靠 `exportData`/`importData` 的 JSON 备份迁移；导入按用户 `id` 合并，XP 高者胜出。

---

## 10. 依赖关系

### 外部依赖

| 依赖 | 用途 | 引入位置 |
|------|------|----------|
| `meSpeak.js` (eSpeak Emscripten) | 纯 JS 离线语音合成 | `js/vendor/mespeak/`，由 `index.html` 加载 |
| Web Speech API (`webkitSpeechRecognition`) | 口语跟读识别（可选，不支持时降级） | 运行时按需调用 |

> 无 npm 前端依赖、无前端框架、无构建步骤（前端侧）。`gen_words.js` 仅用 Node 内置 `fs/path`。

### 运行时 API 依赖

`localStorage`、`IndexedDB`、`Web Audio`（`Audio` 元素）、`Service Worker`、`navigator.vibrate`、`navigator.onLine`、`URL.createObjectURL`。

### 脚本加载顺序（`index.html`）

```
mespeak_config.js → mespeak.js → voice-en-us.js → voice-zh.js
→ data.js → data_words_patch.js → app.js
```

`app.js` 依赖 `data.js` 提供的 `LANGUAGES/COURSES/CONTENT/SRS_INTERVALS/ACHIEVEMENTS` 与 `data_words_patch.js` 提供的 `CET4_WORDS/CET6_WORDS/*_LESSONS_RANGE`。

---

## 11. 项目运行方式

### 方式一：浏览器 / PWA（开发与桌面使用）

需要通过 **HTTP(S) 协议**访问（Service Worker 仅在 http/https 注册；`file://` 下 SW 与部分 API 受限）：

```bash
# 在仓库根目录启动静态服务器
python3 -m http.server 8080
# 或
npx serve .
```

浏览器访问 `http://localhost:8080/`。首次访问走引导流程创建本地账号。

### 方式二：Android APK

仓库已附带预构建 APK：

- `LinguaVerse-v4.0.0.apk`（根目录）
- `android/LinguaVerse-v4.0.0.apk`

直接安装即可（沉浸式状态栏、离线运行、不依赖系统 TTS）。详见 §12 自行构建。

### 方式三：词库重新生成（开发维护用）

```bash
node gen_words.js          # 产出 data_words_patch.js
# 之后按需手工合并到 js/data.js 的 CONTENT 中（见 gen_words.js 顶部注释）
```

---

## 12. Android 构建说明

`android/build.sh` 使用 Android SDK 工具链直接产出签名 APK，**无需 Gradle**：

**依赖**：Android SDK（build-tools 34/36 + platforms/android-34）、JDK 17+。

**流程**（6 步）：

1. `aapt2 compile` 编译 `res/` → `res.zip`
2. `aapt2 link` 生成 `base.apk`（含 manifest、assets、min/target sdk 24/34、versionCode 5 / versionName 4.0.0）
3. `javac --release 8` 编译 `java/` → `classes.jar`
4. `d8 --release --min-api 24` 转 DEX
5. 合并 `classes.dex` + `zipalign` 对齐
6. `apksigner` 用 `yujie.keystore`（口令 `yujie2026`）签名 → `LinguaVerse-v4.0.0.apk`，并 `verify`

**Manifest 要点**：`package=com.yujie.app`，仅 `INTERNET`/`ACCESS_NETWORK_STATE` 权限，`singleTask`/竖屏/`adjustResize`，`hardwareAccelerated`/`largeHeap`。

**WebView 行为**：`MainActivity` 以 `https://localhost/` 加载，`shouldInterceptRequest` 将 localhost 请求映射到 `assets/www/`，按扩展名返回 MIME；`shouldOverrideUrlLoading` 仅放行 localhost。

---

## 13. 已知注意事项

1. **Quiz 内容字段约定**：`data.js` 中语法/听力/口语课内容存于 `CONTENT[lessonId].items`（字段：`q`/`opts`/`a`/`explain` 等），而 `app.js` 的 `startQuizSession` 读取的是 `content.questions`（语法）/ `content.dialogs`（听力）/ `content.topics`（口语），渲染选项时读取 `q.o`。**两者字段命名不一致**：若要让 Quiz 正常加载，需保证 `CONTENT` 条目使用 `questions`/`dialogs`/`topics` 与 `o` 字段，或调整 `app.js` 读取逻辑。维护词库与新增课型时务必对齐该契约。

2. **每日一句重复定义**：`DAILY_QUOTES` 在 `data.js`（`{t, m}` 格式）与 `app.js`（`{en, cn}` 格式）各定义一份。因 `app.js` 后加载，首页 `renderHome` 实际使用的是 `app.js` 版本（`quote.en`/`quote.cn`）；`data.js` 版本被覆盖、未生效。修改每日一句时以 `app.js` 为准，或删除其一以避免歧义。

3. **离线 TTS 语种覆盖**：meSpeak 内置英语（美音/RP）与中文语音包；日语/韩语无专门 voice 包，`ME.langToVoice` 对 `ja`/`ko` 返回默认值，依赖 eSpeak 内部支持（不一定可用）。

4. **缓存键与语速**：音频缓存 key 含 `rate`，切换语速后会重新合成（不命中旧缓存）。

5. **前端资源双副本**：根目录与 `android/assets/www/` 是两份独立副本，修改前端后需同步更新 `android/assets/www/` 才能影响 APK 内行为。

---

*文档基于源码静态分析生成，反映仓库当前状态。*
