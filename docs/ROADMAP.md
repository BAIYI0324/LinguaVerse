# 🗺️ 项目路线图 / Roadmap

> 版本格式遵循 [Semantic Versioning 2.0](https://semver.org/lang/zh-CN/)。
> 已完成的是 ✅，进行中 🔧，规划中 📅，投票中 💡。

---

## ✅ v1.0.x — MVP 首次发布
- [x] 多语种体系：英语 A1-B2 / 日语 N5-N3 / 韩语 TOPIK I-III
- [x] 四大学习模块：单词卡、语法选择、听力、口语
- [x] 顶部导航 + 社区帖子板 + 成就 10 枚
- [x] 本地 Mock 注册登录，localStorage 持久化

---

## ✅ v2.0.x — 当前主版

### v2.0.0 (2026-08-30)
- [x] **课程升级**：英语替换为 CET-4 / CET-6 四六级词库 + 富格式真题例句；删除过于简单的 A1/A2
- [x] **MIUIX 设计系统**：浅色卡片 + 大圆角 + 柔和阴影 + 主色 #FF6900；底部四 Tab 导航
- [x] **不背单词式词卡**：翻面交互 + 「认识 / 不认识」操作；不认识的卡片自动稍后重现
- [x] **SRS Box 间隔复习**：0→1→2→4→7→15→30 天，复习 Tab 聚合所有到期卡片
- [x] **纯本地账号**：三步引导（昵称+头像+语言等级）；多账号切换；导入导出 JSON；清空学习记录
- [x] **我的页**：等级/XP/连续天数/12 枚成就/每日目标 10-40/朗读语速 0.5-1.5x
- [x] **Web PWA**：manifest.json + Service Worker (Cache-first) + 各尺寸图标 → 添加到主屏
- [x] **安卓 APK**：WebView 外壳 (`https://localhost` 虚拟域名 → `assets/www` 注入)；`build.sh`
  aapt2+javac+d8+zipalign+apksigner 一键打包；APK 已签名发布

### v2.0.1 (2026-08-30) · 开源仓库补全
- [x] 顶层：`.gitignore`、`.editorconfig`、`.gitattributes`、`package.json`、`Makefile`、`CITATION.cff`
- [x] `.github/`：3 个 Issue 模板、PR 模板、CODEOWNERS、FUNDING、CI（语法+产物校验）
- [x] `docs/`：CONTRIBUTING、FAQ、ROADMAP、ARCHITECTURE、SECURITY
- [x] v1/v2 子目录 README 增强 + scripts 开发工具
- [x] CHANGELOG 修订，顶层 README 扩充贡献与章节导航

---

## 📅 v2.1.x — 内容与体验 扩充（下个小版本）
- [ ] **更多词库扩充**：CET 冲刺 800 高频、考研英语 5500、雅思 6.5、托福 90
- [ ] **日语 N3 / N2 入门课程**：按相同富格式补例句
- [ ] **韩语 TOPIK III**：补全「不背单词」格式例句
- [ ] **长难句专项**：六级阅读长难句拆分 + 语法高亮
- [ ] **听写模式**：播放例句音 → 你输入 → 逐字比对评分
- [ ] **成就动画**：每次解锁成就全屏烟花，更有仪式感
- [ ] **排行榜（纯本地）**：连续天数、XP、累计词数 三维自我对比

---

## 📅 v2.2.x — 多端 / 生态（2026 Q4）
- [ ] **WebDAV / iCloud Drive 自动备份**：学习数据 JSON 定时上传，一键在任意设备恢复
- [ ] **零知识端到端云同步（可选开关）**：默认关闭；密钥仅在你设备上
- [ ] **iOS WKWebView 外壳工程**：App Store 可上架结构，贡献者打包上架
- [ ] **桌面（Electron / Tauri）壳**：大屏模式，适合刷听力
- [ ] **鸿蒙 OpenHarmony Web 容器**：华为 HarmonyOS NEXT

---

## 💡 v3.0 — 下一代（投票 / 讨论中）

欢迎到 [Discussions](https://github.com/BAIYI0324/LinguaVerse/discussions) 投票 / 提想法：

- [ ] **AI 批改口语跟读**：接入端上 Whisper 打分
- [ ] **AI 语境生词**：给一段你想看的文章，自动抽取生词并生成课
- [ ] **多人同桌 / 打卡小组**：纯本地 WebRTC 点对点组队（不经过服务器）
- [ ] **真实发音包**：真人朗读 mp3（四六级全部 5500 词）
- [ ] **写作练习**：四六级作文真题 → AI 结构 / 词汇评分
- [ ] **多语言 UI**：界面本身翻译成英语、日语、韩语
- [ ] **无障碍**：屏幕阅读器、字体放大开关、高对比度模式

---

## 🤝 如何影响路线图

1. 👍 点赞你想要的 Issue，我们按 👍 数排优先级
2. 📊 [Discussions 投票帖](https://github.com/BAIYI0324/LinguaVerse/discussions/categories/polls)
3. 🌟 **自己提 PR 实现**：实现后直接进下一个小版本，不会被排期卡 ✨
