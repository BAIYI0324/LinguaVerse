# 语界 LinguaVerse v2 · 技术设计文档

> 版本: v2.0.0 · 2025-08-30
> 设计人: CHANG (BAIYI0324)

## 1. v1 → v2 升级目标

| 维度 | v1.0 | v2.0 |
|---|---|---|
| 🎨 UI 风格 | 桌面后台 / 顶部导航 | **MIUIX HyperOS 手机外壳** / 底部四 Tab |
| 📚 英语词库 | A1-B2 通用级 | **CET-4 四级 / CET-6 六级** (贴合国内用户) |
| 🧠 记忆算法 | 无 | **SRS Box 0-5,间隔 [1,2,4,7,15,30] 天** |
| 📇 单词卡 | 5 元线性展示 | **不背单词式翻面词卡**(词根+3例句带标签) |
| 👤 账号体系 | Mock API 单用户(假在线) | **本地多账号**,可切换/导入/导出 |
| 🎯 学习目标 | 无 | **每日目标 10/20/30/40** + 进度环可视化 |
| 🔊 发音 | 固定速度(1x) | **0.5x~1.5x 五档变速可持久化** |
| 📱 发布形态 | 纯 H5 | **PWA + Android APK** (WebView 外壳, Assets 虚拟主机) |
| 🏅 成就 | 10 枚 | **12 枚**(含 Lv 连续/首复习/口语/首 Deck) |
| 🏫 社区 | 保留 | 保留 v1 版在 `v1/` 目录,v2.0 聚焦词卡学习 |

## 2. 技术选型

**零依赖纯 Vanilla**: 无 npm / React / Webpack,保证可离线运行、
PWA 可缓存、可打包进 Android APK 静态 Assets。

```
index.html (入口)
  └─ css/styles.css (795 行,MIUIX 设计 Token + 组件 + 响应式)
  └─ js/data.js (774 行, 词书数据 + SRS 间隔 + 元数据常量)
  └─ js/app.js  (1089 行, SPA 路由 + 状态机 + 播放器 + 设置 + 存档)
  └─ manifest.json  (PWA 清单, yujie-v3, lang="zh-CN")
  └─ sw.js          (Cache-First 离线缓存, static_assets = ["index.html", css, js, 图标])
  └─ icons/icon-{192,512,maskable-512}.png + 1024.jpg
```

**运行时模型**:
- 数据存储: `localStorage['yujie_v3']` → JSON 结构, 多用户 + session
- TTS: 浏览器/系统原生 `SpeechSynthesis`, 语言从 `LANG[langId].ttsLang` 映射
- Router: 极简 Tab 变量 + `render()` 全量渲染,DOM 重绘 < 12ms
- Player: 单例 `P` 对象承载所有学习会话态 (词汇/语法/听力/口语/复习)

## 3. MIUIX 设计系统

| Token | 值 | 说明 |
|---|---|---|
| `--primary` | #2E6BFF | 主色蓝 |
| `--primary-soft` | #EAF0FF | 主色淡底 |
| `--ok` | #00B578 / --warn #FF8A00 / --err #FA5151 | 状态色 |
| `--bg` | #F4F6FA (桌面) / 渐变 (手机壳内部) | 背景 |
| 圆角 | 大 24 / 中 18 / 小 14 | 小米风圆角 |
| 阴影 | `0 4px 20px rgba(46,107,255,.12)` 高频使用 | 悬浮感 |

**桌面手机外壳**:
```css
@media (min-width: 900px) {
  body { background: 径向渐变蓝色光圈; padding: 28px; }
  .phone { width: 420px; height: 880px; border-radius: 44px; border:10px solid #111;
           box-shadow: 0 25px 80px rgba(0,0,0,.4); overflow: hidden; position:relative; }
  .phone::before { 顶部刘海 120×28 黑块圆角 22px; position:absolute; top:0; left:50%; margin-left:-60px; z-index:10 }
  .app { width:100%; height:100%; }
}
```

**底部四 Tab** (56px 高, 固定):
🏠 首页 · 📚 词书 · 🔄 复习 · 👤 我的
```
.tab { display:flex; flex-direction:column; align-items:center; gap:2px; font-size:11px; color:#8B95A7; }
.tab.active { color:var(--primary); font-weight:700 }
.tab .ic   { width:24px; height:24px; transition: transform .2s; }
.tab.active .ic { transform: scale(1.15) translateY(-2px) }
```

## 4. 英语四六级词库 (CET-4/6)

| 级别 | 单元 | 课时 ID | 主题 | 词数 | 词汇格式 |
|---|---|---|---|---|---|
| CET-4 | U1 | en-c4-u1-v | 核心词汇(一) | 12 个 | 富格式 |
| CET-4 | U1 | en-c4-u1-g / en-c4-u1-l / en-c4-u1-s | 语法/听力/口语各 5 题 | - | - |
| CET-4 | U2 | en-c4-u2-v | 校园生活(二) | 12 | 富格式 |
| CET-4 | U3 | en-c4-u3-v | 情感成长(三) | 12 | 富格式 |
| CET-6 | U1 | en-c6-u1-v | 六级核心(一) | 12 | 富格式 |
| CET-6 | U2 | en-c6-u2-v | 职场进阶(二) | 12 | 富格式 |

**富格式 7 元组定义**:
```js
// 0:word · 1:phonetic · 2:def · 3:root助记 · 4:examples(嵌套数组每例三元[text,cn,tag])
[
  "abandon",
  "/əˈbændən/",
  "v. 放弃,抛弃",
  "a(不)+band(绷带)+on → 不在身上绑绷带 → 放弃(治疗)",
  [
    ["He abandoned his family and went abroad.", "他抛弃家人,去了国外。","🎬 影视"],
    ["Students abandoned traditional methods.", "学生放弃了传统方法。","📖 真题"],
    ["Never abandon hope in times of crisis.", "危机时刻永远不要放弃希望。","💬 日常"],
  ],
]
```

日韩词书保留原有 `[w, ph, def, exT, exM]` 5 元简式,运行时 `normWord()` 统一。

## 5. SRS 间隔重复算法 (Leitner Box)

```
Box 0 → 间隔 1 天    (今天刚学,明天再来)
Box 1 → 间隔 2 天
Box 2 → 间隔 4 天
Box 3 → 间隔 7 天
Box 4 → 间隔 15 天   ← 达到此盒计为「已掌握」
Box 5 → 间隔 30 天
```

**判分规则 (gradeWord)**:
- 点「认识」: box = min(box+1, 5) → due = today + SRS_INTERVALS[box]
- 点「不认识」: box = max(box-1, 0) → 该词回入当前队列后方 (3 词后再次出现)

**数据结构**:
```js
U.srs[lessonId] = {
  "abandon": { box:2, due:"2025-09-02", reps:5, seen:true },
  ...
}
```

**复习 Tab 触发条件**: `U.srs[*][word].due <= today()` → 放入 dueWords(),
通过 dueWord() 取出来自所有课时的到期词,合并去重后乱序组成复习会话队列。

## 6. 本地多账号体系

```js
DB = {
  users: [ { id, name, avatar, color, createdAt, lang, level, dailyGoal, ttsRate,
             xp, streak:{count,last,days}, log:{}, stats:{}, srs:{}, lessons:{}, badges:[] },
           ... ],
  session: "u_xxx"   // 当前用户 id
}
```

**三步引导页 (#onboard)**:
- Step 1: 昵称输入 + 10 个表情头像 + 8 色随机 (点击头像保存昵称先)
- Step 2: 三语种 Tab × 对应级别卡片 (CET4/5,N5/N4/N3,TOPIK I/II/III)
- Step 3: 每日目标 10/20/30/40, 点击卡片即跳 App

**账号切换 (toggleUserMenu)**:
- 弹出底部 sheet → 列出所有已创建用户卡片 +「＋ 创建新账号」
- 切换用户写入 `DB.session`,重渲染,可能触发 onboarding

**数据管理**:
- 导出: 生成 `yujie_v3_backup_2025-08-30.json`,触发浏览器下载
- 导入: 读取文件, JSON.parse 合法 → 覆盖 DB,刷新页面
- 清空: 确认二次 → `U.xp/stats/srs/lessons/log/streak/badges` 全清

## 7. 四大学习模块 (Player 共用外壳)

### 7.1 词汇 (Vocabulary / Review)
- **不背单词式翻面**: 正面 = 单词 + 音标 + 🔊; 翻面后 = 释义 + 词根助记 + 3 例句(每例自携🔊播放)
- 进度条: idx / total × 100%
- 完成: confetti 特效 + 结算卡 (新学/复习/XP 三项)

### 7.2 语法 (Grammar) / 听力 (Listening) / 口语 (Speaking)
- **语法**: 题干 + A/B/C/D 4 选 1 → 正确绿+解析 / 错误红+正确项绿 → 继续
- **听力**: 自动 `speak(t, lang)` 原文 → 四译文打乱 + 「再听一次/🐢慢速」双按钮 → 判分后显示原文
- **口语**: 原文(音标) + 🔊示范 → 自评「需要再练/读得不错」→ 读得不错计 correct

### XP 结算比例
- 语法/听力/口语: `XP = meta.xp × correct/total (≥50%)`
- 词汇: XP = meta.xp × max(.5, newWords/origLen) + reviews
- 复习会话: XP = 复习次数 (每次 1 XP)

## 8. PWA 离线部署

### manifest.json
```json
{
  "name": "语界 LinguaVerse",
  "short_name": "语界",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#F4F6FA",
  "theme_color": "#2E6BFF",
  "icons": [{
    "src":"icons/icon-192.png","sizes":"192x192","type":"image/png"
  },{
    "src":"icons/icon-maskable-512.png","sizes":"512x512","type":"image/png",
    "purpose":"maskable any"
  }]
}
```

### sw.js (cache-first, ver `yujie-v3`)
- install: preCache `[index.html, css/styles.css, js/data.js, js/app.js, manifest.json, 各图标]`
- activate: 清理旧版本缓存
- fetch: request.mode==='navigate' → 回退 index.html; 其他请求 cache-first → 未命中 fetch+cache

## 9. Android APK 工程 (WebView 壳 + Assets 虚拟主机)

### 架构
```
android/
├── AndroidManifest.xml         package="com.yujie.app" / LAUNCHER activity / INTERNET
├── build.sh                    一键编译(仅需 JDK 17 + Android SDK 环境变量)
├── yujie.keystore              签名密钥 (alias=yujie, password=yujie2026)
├── java/com/yujie/app/
│   └── MainActivity.java       WebAssetManager 虚拟 https://localhost/ → 读 assets/www
├── res/values/styles.xml       Theme.NoTitleBar.Fullscreen
├── res/mipmap-{xxhdpi/xxxhdpi} 应用图标
├── assets/www/                 v2 全部文件 (index.html+css+js+manifest+sw+icons)
└── 语界-LinguaVerse-v3.0.apk   最终签名产物 (约 474KB, Android 8+ 直接安装)
```

### build.sh 流水线
```
1. aapt2 compile 资源 → res.zip
2. aapt2 link      → AndroidManifest.xml + res.zip → base.apk + R.java
3. javac           → R.java + MainActivity.java → *.class (compileSdk=36)
4. d8              → classes.jar(含*.class) → classes.dex (最低 API 26 / Android 8)
5. aapt add        → classes.dex 塞入 base.apk
6. zipalign 4      → aligned.apk
7. apksigner sign  → 语界-LinguaVerse-v3.0.apk (keystore=yujie.keystore pw=yujie2026)
```

**关键**: 虚拟 Assets 主机解决 APK 内静态资源跨域 / localStorage / Service Worker / TTS 权限问题,
使用 `WebAssetManager.Builder().setHttpHost("localhost", 443)` 映射 `https://localhost/` 到 `assets/www/`。

## 10. 成就系统 (v2 12 枚)

| id | 名称 | 触发条件 |
|---|---|---|
| join | 🌱初次见面 | 完成引导页(必获) |
| first-deck | 🚀首学习时 | 完成任意课时(词汇+4选1类皆可) |
| streak-3 | 🔥三日之约 | 连续打卡 3 天 |
| streak-7 | ⚡一周坚持 | 连续打卡 7 天 |
| words-50 | 📖五十达成 | 学单词 ≥ 50 |
| words-200 | 📚两百词霸 | 学单词 ≥ 200 |
| review-50 | 🧠复习五十 | 复习次数 ≥ 50 |
| grammar-20 | ✏️语法二十 | 语法对题 ≥ 20 |
| listen-20 | 🎧听力二十 | 听力对题 ≥ 20 |
| speak-10 | 🎤口语十题 | 口语自评正确 ≥ 10 |
| xp-1000 | ⭐千 XPer | 累计 XP ≥ 1000 |
| level-5 | 💎五级大佬 | Lv.5+ (=XP ≥ 1500) |

## 11. 目录结构 (仓库根)

```
.
├── README.md                 顶层说明
├── LICENSE (MIT)
├── CHANGELOG.md              v1.0.0 / v1.1.0-过渡 / v2.0.0
├── android/                  APK 工程 (上面第 9 节)
├── docs/
│   ├── DESIGN-v1.md
│   ├── DESIGN-v2.md          ← 本文件
│   ├── TESTING-v1.md
│   ├── TESTING-v2.md
│   └── KNOWN-BUGS.md
├── v1/                       v1.0.0 历史版本快照
│   ├── index.html · README.md
│   ├── css/styles.css
│   └── js/{app,data}.js
└── v2/                       v2.0.0 当前主版本
    ├── index.html
    ├── manifest.json · sw.js
    ├── css/styles.css
    ├── js/{app,data}.js
    └── icons/{192,512,maskable-512,1024}
```
