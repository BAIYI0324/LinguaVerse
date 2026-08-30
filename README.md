# 语界 LinguaVerse · 多语种在线教育平台

> **LinguaVerse = Language(语言) + Universe(世界)**
> 一款不背单词风格的多语种学习 App,支持英语四六级 / 日语 N5~N3 / 韩语 TOPIK I~III,
> 内置 SRS 间隔重复复习算法、MIUIX 风格 UI、PWA 离线, 以及 Android 原生 APK 双端发布。
>
> ⚠️ **当前主版本: v2.0** (推荐)  ·  v1.0 历史快照在 `v1/` 目录
>
> [GitHub 仓库](https://github.com/BAIYI0324/LinguaVerse) ·
> [Release v1.0](https://github.com/BAIYI0324/LinguaVerse/releases/tag/v1.0.0) ·
> [Release v2.0](https://github.com/BAIYI0324/LinguaVerse/releases/tag/v2.0.0)

---

## 📦 版本一览

| 版本 | 状态 | 代码路径 | 标签 | 核心特性 |
|---|---|---|---|---|
| **v2.0 (Current)** | ✅ 推荐 | [`v2/`](./v2/README.md) | `v2.0.0` | 四六级 / SRS / MIUIX / PWA / APK |
| v1.0 (Historical) | 🧳 历史归档 | [`v1/`](./v1/README.md) | `v1.0.0` | 顶部导航 + A1-B2 + 社区 |

## ✨ 快速开始 (v2.0)

```bash
# 1. 克隆仓库
git clone https://github.com/BAIYI0324/LinguaVerse.git
cd LinguaVerse

# 2. 以任意静态服务器运行 (PWA 需要 http:// 开头, file:// 协议 SW 不生效)
cd v2 && python3 -m http.server 8000

# 3. 在浏览器打开 http://localhost:8000/
# 4. 点击地址栏「安装」→ 即可像原生 App 一样离线使用 📱
```

### 🤖 安卓直接安装 APK

仓库预编译已签名 APK 位于 [android/语界-LinguaVerse-v3.0.apk](./android/语界-LinguaVerse-v3.0.apk):
```bash
adb install android/语界-LinguaVerse-v3.0.apk
```
包体约 474 KB,最低 Android 8.0 (API 26)。

---

## 🎯 v2.0 产品亮点

```
┌──────────────────────────────────────────────────────┐
│  🏠 首页                     📚 词书                  │
│  ┌────────────────┐         ┌─────────── CET-4 ───┐  │
│  │ ╭─环形进度 5/20│         │ Unit1 核心词汇  ✓───┘  │
│  │ │ 🎯今日目标   │         │ Unit2 校园生活  50%    │
│  │ └──────────────┘         │ Unit3 情感成长  ── 开始│
│  │ 📖继续学习 CET4 U2 词汇  │                         │
│  │ 已学 320   已掌握 128    │                         │
│  └──────────────────────────┘                         │
│                                                       │
│  🔄 复习 (SRS到期 12 词)       👤 我的               │
│  ┌──────────────────┐       ┌─────────🐻 张三 Lv.4 ─┐│
│  │   🧠 12 待复习   │       │ XP 980/1200 ━━━━━━━━░ ││
│  │   🃏翻卡/不认识   │       │ 连续打卡 6 🔥        ││
│  │   认识→15天后    │       │ 🏅 成就: 7 / 12       ││
│  └──────────────────┘       └───────────────────────┘│
└──────────────────────────────────────────────────────┘
```

### 🎨 MIUIX / HyperOS 设计系统

- 桌面端以手机外壳居中 (420×880,顶部黑色刘海 120×28)
- 底部四 Tab (🏠 首页 · 📚 词书 · 🔄 复习 · 👤 我的)
- 圆角规格 大24 / 中18 / 小14, 蓝 #2E6BFF 主色
- 悬浮阴影 `0 4px 20px rgba(46,107,255,.12)` 贯穿

### 🧠 SRS 间隔重复记忆 (Leitner Box System)

| Box | 间隔 | 达到即标记为「已掌握」 |
|---|---|---|
| 0 | 今天再记 | 新词 |
| 1 | 1 天 |  |
| 2 | 2 天 |  |
| 3 | 4 天 |  |
| 4 | **7 天** | ✅ |
| 5 | 30 天 | ✅ |

每次学词完成或复习会话结束,单词到期状态写入 `U.srs[lessonId][word]`,
下一次打开时自动合并到期列表,在「复习」Tab 排队。

### 🃏 不背单词式词卡

**正面**: 单词 + IPA 音标 + 🔊 发音按钮
**背面**: 释义 / 词根助记 (🧩 a(不)+band(绷带)+on → 放弃治疗) / 三条例句

每条例句自带独立的 🔊 播放按钮和 📖真题 / 🎬影视 / 💬日常 分类标签。

### 📚 完整词书

| 语种 | 分级 | 单元数 |
|---|---|---|
| 🇬🇧 **英语 CET-4 四级** | 大学四级核心 | 3 × (词汇 12 / 语法 5 / 听力 5 / 口语 5) |
| 🇬🇧 **英语 CET-6 六级** | 大学六级高阶 | 2 × (词汇 12 / 语法 5 / 听力 5 / 口语 5) |
| 🇯🇵 **日语** | N5 / N4 / N3 | 2 × 每级 4 课时 |
| 🇰🇷 **韩语** | TOPIK I / II / III | 2 × 每级 4 课时 |

### 👤 本地多账号体系 + 数据导入导出

```
三步引导页:
Step1 🐻🐱🦊 10头像 + 昵称 + 颜色分配
Step2 🇬🇧🇯🇵🇰🇷 选择语种+级别
Step3 🎯 10/20/30/40 每日目标
```

- 支持「我的 → ⋮ → 切换账号 → ＋ 创建新账号」多账号切换
- 支持 JSON 备份导出 / 导入, 单机多用户各自独立 `xp/stats/srs/lessons`
- 支持一键清空 / 退出登录

### 📱 PWA + Service Worker 离线

- `manifest.json`: `lang:zh-CN` · standalone 模式 · 主色蓝 maskable 图标
- `sw.js` (版本标识 `yujie-v3`): install cache-first → activate 清理旧版 → fetch cache-first
- 首次访问后 Service Worker 激活,断网仍可学习、记录进度 ✅

### 🤖 Android APK

- 壳: `WebViewAssetManager` 把 `assets/www/` 映射到 **https://localhost/**
  → 解决 file:// 协议下 localStorage / Service Worker / SpeechSynthesis 失效问题
- 构建链: aapt2 → javac 36 → d8 → zipalign 4 → apksigner (yujie.keystore yujie2026)
- 产物: `android/语界-LinguaVerse-v3.0.apk` (~474 KB,签名 v2)
- 最低系统: Android 8.0 Oreo (API 26)

---

## 📂 仓库结构

```
LinguaVerse/
├── README.md                     ← 本文件
├── LICENSE                       MIT License
├── CHANGELOG.md                  完整变更日志 (v1.0 → v1.1-过渡 → v2.0)
├──
├── v1/                           v1.0.0 历史版本 (顶部导航 + A1-B2 + 社区)
│   ├── index.html
│   ├── README.md
│   ├── css/styles.css
│   └── js/{app,data}.js
│
├── v2/                           v2.0.0 当前主版本
│   ├── index.html                SPA 入口 (手机壳+播放器+引导页)
│   ├── manifest.json             PWA 清单
│   ├── sw.js                     Service Worker (cache-first yujie-v3)
│   ├── README.md
│   ├── css/styles.css            MIUIX 完整样式 795 行
│   ├── js/
│   │   ├── data.js               词库/常量/成就/SRS间隔 774 行
│   │   └── app.js                数据/Router/Player/Settings 1089 行
│   └── icons/                    192 512 maskable 1024
│
├── docs/                         全部文档
│   ├── DESIGN-v1.md              v1 架构
│   ├── DESIGN-v2.md              v2 架构 (MIUIX / SRS / PWA / APK)
│   ├── TESTING-v1.md             v1 测试 58 用例 100% 通过
│   ├── TESTING-v2.md             v2 测试 64 用例 100% 通过
│   └── KNOWN-BUGS.md             11 条 BUG 根因+修复+对应commit
│
└── android/                      Android APK 工程
    ├── AndroidManifest.xml       package=com.yujie.app / targetSdk=36
    ├── build.sh                  一键编译
    ├── yujie.keystore            签名密钥 (密码 yujie2026)
    ├── 语界-LinguaVerse-v3.0.apk 预编译可安装 APK
    ├── java/com/yujie/app/MainActivity.java    WebView 外壳 + AssetsHost
    ├── res/                      launcher 图标 + styles
    └── assets/www/               ← v2 打包镜像 (和 v2/ 同步)
```

## 🧭 开发流程 (17 commits 历史追溯)

本仓库严格按照真实项目迭代的 commit 顺序构建,推荐按 commit 历史阅读学习:

```
 1. 424ba34 Init 仓库骨架 README + LICENSE
 2. 60316cc docs(v1): v1 data.js 40 课时种子数据
 3. 5e1ccc0 feat(v1): 注册登录 + SPA 路由 + 顶部导航
 4. 696398a feat(v1): 四大模块(词/语法/听/说)
 5. 44dc62b feat(v1): 进度追踪 + 成就 10 枚 + 社区板
 6. 69eac53 docs(v1): DESIGN + TESTING + CHANGELOG v1.0
 7. 1a0773d release: v1.0.0 tag 打标 + v1/README.md
 ──────────── v1 → v2 分界线 ────────────
 8. abf06cd refactor: 四六级 CET4/6 + 富例句 data.js
 9. 71589bc refactor(v2): MIUIX UI + 底部 Tab + 手机外壳
10. c50afde feat(v2): 不背单词词卡 + SRS 间隔复习算法
11. 95b7eef feat(v2): 本地多账号 + 引导三步 + 导入导出
12. ead656e feat(v2): 四大学习模块 语法/听力/口语完整
13. 2831cc8 feat(v2): 成就 12 枚 + 学习统计与分析
14. 44c77a7 feat(v2): 用户菜单 + 设置页(语速/目标/清空)
15. 1b1899d feat(v2): PWA manifest + Service Worker + 图标
16. e619274 feat(v2): Android APK 工程 + 可安装包 (签名)
17. ------→ 当前 commit + v2.0.0 tag
```

## 🛠️ 构建/开发依赖

| 工具 | 作用 | 最低版本 |
|---|---|---|
| `python3 -m http.server` 或任意静态服务器 | 本地预览 H5 | Python 3.6+ |
| **JDK** | APK 编译 (`javac` + `jarsigner` / `apksigner`) | JDK 17 LTS 或 JDK 21 LTS |
| **Android SDK** (`build-tools 36.0.0`) | APK 构建 (`aapt2`/`d8`/`zipalign`) | compileSdk 36 |
| **Chrome DevTools** | 调试 Service Worker / TTS / Console 无错误 | Chrome 120+ |

v2 纯 H5 部分**零外部依赖** (无 npm / webpack / react)。
编译 APK 只在需要重新生成 `语界-LinguaVerse-v3.0.apk` 时安装 JDK+SDK。

## 🔐 隐私与数据

语界 **100% 纯端侧** 运行:
- 没有云端 API,没有远程数据库,没有埋点上报
- 学习记录保存在浏览器 `localStorage['yujie_v3']`
- APK 版本保存在 WebView 专属存储 `/data/data/com.yujie.app/`
- 想跨设备迁移? 使用「我的 → ⋮ → 设置 → 导出数据」JSON 备份即可

## 🚀 发布历史

- **v1.0.0** · 2025-08-28: 首次多语种在线教育平台发布(英语 A1-B2 + 日 + 韩)
- **v2.0.0** · 2025-08-30: 四六级 / SRS / MIUIX / 不背单词词卡 / 本地多账号 / PWA / APK 双端

完整变更请看 [CHANGELOG](./CHANGELOG.md)。

## 📝 License

MIT © **CHANG (BAIYI0324)**. 完整文本见 [`LICENSE`](./LICENSE)。

> 愿每个人都能推开语言的大门,看到更广阔的宇宙 ✨
