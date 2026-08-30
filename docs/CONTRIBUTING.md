# 贡献指南

欢迎来到 **语界 LinguaVerse** 开源项目！无论你是想补词、改 bug、做设计、写文档还是翻译界面，
每一份贡献都能让更多人受益。

---

## 🛣️ 首次贡献 · 快速上手

### 0. 先挑一个 Issue
- **好入手（10 分钟）**: [![good-first-issue](https://img.shields.io/github/issues/BAIYI0324/LinguaVerse/good%20first%20issue?color=green)](https://github.com/BAIYI0324/LinguaVerse/labels/good%20first%20issue)
  — 例如补一条例句、改一个单词的音标、修一个 CSS 错位
- **词汇纠错**: 直接用「📚 词汇/内容纠错」Issue 模板，无需提交代码
- **中等**: `help wanted` 标签

### 1. Fork + Clone
```bash
# Fork 右上角按钮后
git clone https://github.com/<你的用户名>/LinguaVerse.git
cd LinguaVerse
```

### 2. 本地跑起来
```bash
# Web v2（当前主版）— 需要 Python 3.8+
make dev      # 或: python3 -m http.server 8080 -d ./v2
# 浏览器打开 http://localhost:8080/
```
不需要任何依赖，纯静态页面即可跑。

### 3. 检查 & 提交
```bash
make lint              # 检查 JS 语法
make verify            # 产物完整性检查
git checkout -b feat/xxx
git commit -m "feat(v2): 新增 xxx 词汇课程

Closes #123"
git push origin feat/xxx
# 回 GitHub 提 PR
```

---

## 🧭 仓库结构

```
LinguaVerse/
├── v1/                历史快照 · 英语 A1-B2 + 顶栏导航（不再维护）
├── v2/                当前主版 · 四六级 + MIUIX + SRS
│   ├── index.html     页面骨架（SPA 容器 + 底部 tab 栏）
│   ├── css/styles.css MIUIX 设计系统 + 组件样式
│   ├── js/app.js      应用逻辑:路由/播放器/SRS/设置/本地账号
│   ├── js/data.js     核心数据:语言/等级/单元/课时词条
│   ├── manifest.json  PWA 元数据
│   ├── sw.js          Service Worker · 离线缓存
│   └── icons/         各尺寸应用图标
├── android/           安卓 APK 工程（WebView 外壳 + 构建脚本 + 签名后的 APK）
│   ├── build.sh       aapt2 → javac → d8 → zipalign → apksigner 一条龙
│   ├── java/          MainActivity: assets/www → https://localhost WebView 注入
│   ├── res/           Android 资源（图标 + 主题）
│   └── assets/www/    打包时内嵌的 v2 源码副本
├── docs/              设计/测试/架构/FAQ/路线图
├── .github/           CI / Issue 模板 / PR 模板 / CODEOWNERS
└── Makefile           常用快捷命令
```

---

## 📚 贡献类型速查

### 补单词 / 补课程
编辑 `v2/js/data.js`，按顶部注释的格式：

```js
// 英语(富格式): [词, 音标, 释义, 词根助记, [[例句,译文,标签],...]]
// 标签可选: "真题" | "影视" | "日常"
```

- 四六级新增词条建议标注出现频次（`真题` 标签 + 哪一年真题），可显著提升参考价值
- PR 中请说明来源（某词典 / 某真题卷）

### 修 Bug
- 必须在 PR 描述里写出 **复现步骤 → 根因 → 你的修复思路**
- 修完一定跑一组单词课，确认控制台 0 error

### 改 UI / 交互
- 必须在 ≤ 390px 宽的手机尺寸下检查无错位
- 参考 `docs/DESIGN-v2.md` 的 MIUIX 设计 token，不要随手选颜色/间距

### 写文档
- 直接提交 PR 即可，中文或英文均可
- 术语约定：「词卡」不写「单词卡片」，「课时」不写「课程」，「本地账号」不写「本地用户」

---

## 🔧 开发者小贴士

- **快速重置学习数据**: 浏览器控制台 `localStorage.clear(); location.reload()`
- **手动进入单词课调试**: 在首页 Console 输入
  ```js
  openLesson('en','cet4','en-c4-u1-v')
  ```
- **强制所有到期**: `Object.values(U.srs).forEach(x=>Object.values(x).forEach(y=>y.due='2000-01-01')); save(); location.reload()`
- **查看 SRS 参数**: 全局常量 `SRS_INTERVALS`（Box 0→5 的间隔天数）

---

## ⚖️ 提交规范

Conventional Commits（建议，不强制）：
```
feat(v2): 新增考研英语 5500 词课程
fix(v2): 修复 abandon 音标撇号导致的语法错误
docs(readme): 更新开发指南
refactor(app.js): 合并 showModal / closeModalMask
build(apk): 升级 build-tools 到 36.0.0 兼容 JDK 25
chore(gitignore): 新增 android/build 忽略
```

body 里可以写 `Closes #123` 自动关闭 Issue。

---

## 🤝 行为准则

语界 LinguaVerse 采用 [Contributor Covenant v2.1](https://www.contributor-covenant.org/zh-cn/version/2/1/code_of_conduct.html)。
简单说：**互相尊重，欢迎所有背景的贡献者**。遇到骚扰请联系维护者 `@BAIYI0324`。

---

## 💚 致谢

所有贡献者会在 CHANGELOG 和 Release 笔记中列出。如果你贡献了 3+ 条 Issue/PR，会被加入 `CODEOWNERS`
作为该模块的联合维护人 ✨
