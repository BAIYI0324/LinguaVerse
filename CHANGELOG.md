# Changelog · 语界 LinguaVerse

所有重要变更将记录在本文件,格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/): `主版本.次版本.修订号`。

---

## [v2.0.1] - 2026-08-30

> 开源仓库补全 Patch Release — 顶层工程规范 / .github 协作模板 / 开发脚本 / 示例素材 / 6 份新文档。
> 版本代码无功能性变更,v2.0.0 APK 与学习逻辑保持稳定一致。

### ✨ Added (新增)

- **顶层工程文件组** (完整项目工程化):
  - `.gitignore` — OS/IDE/node_modules/android build/学习备份 JSON 精准忽略(不误排除项目图标/素材)
  - `.editorconfig` — 统一 UTF-8 / LF / 2-space indent / Java 4-space / md 保留行尾空格
  - `.gitattributes` — `* text=auto eol=lf` + PNG/JPG/APK/keystore 二进制标记 + Shell 强制 LF
  - `package.json` — 元数据 + `dev / dev:v1 / lint:js / verify / build:apk` 五个 npm scripts
  - `Makefile` — `help / dev / dev-v1 / lint / verify / apk / clean` 七个目标,自带注释
  - `CITATION.cff` — 学术引用 YAML,Zenodo/Zotero 可识别

- **.github 协作规范模板**:
  - `ISSUE_TEMPLATE/1-bug-report.yml` — 环境 6 选 1 / 严重程度 4 级的结构化 Bug 单
  - `ISSUE_TEMPLATE/2-feature-request.yml` — 词库/功能/UI/平台/无障碍 分类建议
  - `ISSUE_TEMPLATE/3-data-correction.yml` — 音标释义例句纠错专用表单
  - `ISSUE_TEMPLATE/config.yml` — 关闭空白 Issue,引导到 Discussion/文档
  - `PULL_REQUEST_TEMPLATE.md` — 自检 7 项清单 (lint/verify/手机尺寸/data.js 抽查 等)
  - `CODEOWNERS` — 模块归属 (data/app/UI/APK/文档) 默认 @BAIYI0324
  - `FUNDING.yml` — 赞助入口占位
  - `workflows/ci.yml` — push/PR 自动:JS 语法 (node --check) + 产物存在 + JSON 合法

- **docs/ 新文档 (5 份全新 + CHANGELOG 本次修订)**:
  - `CONTRIBUTING.md` — Fork→Clone→本地跑→8 项自检→提交规范→贡献者致谢
  - `FAQ.md` — 安装 / 学习方式 / SRS 参数 / UI 换肤 / 构建 / 数据 6 大类 15+ FAQ
  - `ROADMAP.md` — v1.0 ~ v3.0 完整路线图 + 投票方式 + 贡献者直接进排期通道
  - `ARCHITECTURE.md` — 5 层架构图 / SRS 数据流 / localStorage 契约 / APK WebView 注入策略
  - `SECURITY.md` — 安全保障说明 + 私密漏洞上报 (GitHub Security Advisory / Proton Mail) + 风险评级矩阵

- **scripts/ 开发工具 (全平台 bash + node)**:
  - `dev-server.sh [v1|v2] [port]` — 一行启静态服务器,自动切版本/端口
  - `verify-structure.sh` — 30 项发布前校验 (已 100% 通过):文件存在/JS语法/JSON&YAML/APK
  - `export-sample-data.js` — 生成示例用户数据 JSON (含 56 词 + 6 枚成就 + SRS Box 记录)

- **examples/ 扩展素材 (二次开发参考)**:
  - `sample-user-export.json` — 合法的导入导出 JSON 样本,用于测「我的→导入数据」
  - `custom-theme.css` — 深色模式主题模板 (只需覆盖 `:root` 设计 Token 即可全局换色)
  - `additional-cet4-words.js` — 20 条 CET-4 扩展词库 (词根助记 + 真题例句),可直接拼入 data.js

### 🧹 Chores (工程化)

- 给 shell 脚本统一加 `#!/usr/bin/env bash` + `set -e` + `chmod +x`
- 修正 `verify-structure.sh` 中 `CITATION.cff` 被误判 JSON 的 bug (cff 为 YAML,改用 grep 格式头检查)
- `.gitignore` 白名单策略: 不忽略 `android/*.apk` / `v2/icons/*.png` 等必要项目资源
- `package.json` 版本号同步升级至 `2.0.1` (与 Git tag / Release 一致)

### 📝 文档更新

- 顶层 `README.md` 新增 6 个章节: **📋 目录** · **⌨️ 开发者命令** · **🤝 参与贡献** · **❓ FAQ** · **🗺️ 路线图** · **🔐 安全与隐私**
- 修正 README 发布日期 (2025 → 2026),新增 v2.0.1 Release 条目
- `v1/README.md` / `v2/README.md` 补充对 docs 子文档的交叉引用链接

---



## [v1.0.0] - 2025-08-28

> 首次多语种在线教育平台发布 — v1 历史版本。
> **主要内容**: 英语 A1/A2/B1/B2 · 日语 N5/N4/N3 · 韩语 TOPIK I/II/III,
> 覆盖单词课、语法课、听力课、口语课四大学习模块,支持注册/登录 SPA,
> 学习进度追踪,成就系统,学习社区帖子板。

### ✨ Added (新增)

- **注册与登录系统** (Mock API 模拟: `POST /api/register` · `/api/login`, 600ms 延迟)
  - 表单校验:必填项 / 邮箱格式 / 密码 ≥6 位 / 邮箱查重
  - LocalStorage 会话持久化,刷新不丢失登录态

- **SPA 顶部导航**: 首页 / 词书 / 社区 / 我的 四个入口,Hash Router 无刷新切换

- **三语种分级词书**
  | 语种 | 级别 | 单元 | 课时总数 |
  |---|---|---|---|
  | 🇬🇧 英语 | A1/A2/B1/B2 | 每级 2 单元 | 16 课时 |
  | 🇯🇵 日语 | N5/N4/N3 | 每级 2 单元 | 12 课时 |
  | 🇰🇷 韩语 | TOPIK I/II/III | 每级 2 单元 | 12 课时 |

- **四大学习模块播放器**
  - 📇 单词课: 卡片式,单词+音标+释义+例句+译文 五元老格式
  - ✏️ 语法课: 4 选 1 选择题,带讲解解析
  - 🎧 听力课: 浏览器 TTS 自动播放原文,选正确译文(干扰项随机打乱)
  - 🎤 口语课: 示范朗读 + 自评模式(需要再练 / 读得不错)

- **学习数据追踪**
  - XP 结算(单词全额,语法/听力/口语按正确率比例)
  - 连续打卡 streak(last 比对昨天)
  - 课时完成记录 lessonsDone: {[lessonId]: {at, xp}}
  - stats: {words: 学单词数, quiz: 答题数}

- **成就系统** (10 枚)
  🌱初次见面 · 🚀第一课时 · 🔥三日之约 · ⚡一周坚持 · 📖半百词汇 · 📚百词达成 ·
  ✏️答题达人 · ⭐半千里程 · 🎯学习狂 · 🇬🇧英语学者

- **学习社区帖子板**
  - 3 条种子帖子(公告/打卡/求助)
  - 标签选择器: 打卡 / 求助 / 心得 / 讨论
  - 点赞切换 ❤️ / 评论嵌套 / 发布新帖
  - 全部内容 LocalStorage 持久化

- **「我的」页**: 头像卡片 + 4 项核心数据 + 各语言进度条 + 成就墙(含进度显示)

### 📘 Docs
- `docs/DESIGN-v1.md`: 架构设计(技术选型 / 模块划分 / 数据结构 / 流程)
- `docs/TESTING-v1.md`: 58 条全量测试用例 + 性能 + 浏览器兼容性报告
- `v1/README.md`: v1 快照说明(见 v1.0.0 tag)

### 🐛 Bug Fixes (v1.0 迭代期)
- V1-B2: 听力课时 4 选 1 选项重复 → 种子数据保证译文唯一
- V1-B3: iOS Safari TTS 需要手势 → 新增「再听一次」按钮兜底
- 路由刷新 hash 丢失 → window.addEventListener('hashchange', router) 加上启动 router()

---

## [v1.1.0] - 2025-08-29 (预发布 → 未实际 tag,作为 v2 升级基线)

> 本版本仅在 CHANGELOG 中记录为 v1→v2 的过渡需求清单,
> 作为实际 v2.0.0 实现的输入依据。

### 🔄 Changed
- **英语分级调整**: 废弃 A1/A2/B1/B2,改为 **CET-4 四级 / CET-6 六级**(贴合国内用户)
- **英语单词条目格式升级**: 5 元 → 富格式 5 元(新增词根助记 + 3 条例句(真题/影视/日常)
- **日韩词汇保留原有级别与格式**,运行时统一归一化接口

### 🏗️ Planned Removal (在 v2 完成)
- 移除 MockAPI 在线注册/登录 → 改为**本地多账号**体系
- 移除顶部导航 → 改为 **MIUIX 底部 Tab 手机外壳 UI**
- 移除社区帖子板(在 v2.1 重新设计再引入)

---

## [v2.0.0] - 2025-08-30

> 重大更新版本: 四六级 + MIUIX 设计 + 不背单词式词卡 + SRS 复习算法 +
> 本地账号(多用户切换 + 导入导出) + PWA 离线 + 安卓 APK。
> 详见 `docs/DESIGN-v2.md`、`docs/TESTING-v2.md`、`docs/KNOWN-BUGS.md`。

### ✨ Added
- 英语词库: CET-4 三个单元 × CET-6 两个单元(核心/校园/情感 + 六级核心/职场),每单元词汇 12 个富格式(词根+三例句)
- **不背单词式词卡播放器**: 3D 翻面卡片,正面单词+音标+🔊,背面释义+词根+真题例句
- **SRS 间隔重复算法**: Box 0-5,间隔 [1,2,4,7,15,30] 天,到期单词出现在「复习」Tab 排队
- **MIUIX/HyperOS 设计系统**: 手机外壳(桌面端带边框) · 底部 4 Tab 导航 · 渐变色主按钮 · 圆角 24/18/14
- **本地多账号**: 引导页三步(昵称+头像 → 语言+级别 → 每日目标),支持账号切换 + 创建新号
- **数据管理**: 一键导出 JSON 备份、一键清空学习记录、朗读语速切换 0.5~1.5x、每日目标 10/20/30/40
- **成就系统 12 枚**: 加入 v2 的 join / first-deck / streak-3~7 / words-50,200 / review-50 / grammar-20 / listen-20 / speak-10 / xp-1000 / level-5
- **PWA**: manifest.json + Service Worker (cache-first yujie-v3) + 兼容 icon maskable 512
- **安卓 APK 工程**: WebView 外壳 Assets 虚拟主机 https://localhost/ → 保证 localStorage + SW + TTS
  - build.sh 直编 aapt2 + javac + d8 + zipalign + apksigner
  - yujie.keystore (密码 yujie2026) 签名
  - 产物: 语界-LinguaVerse-v3.0.apk (约 474KB,已签名可直接安装)

### 🔧 Fixed (详见 KNOWN-BUGS.md)
- data.js:575 语法错误 `}` → `]`
- SEED_POSTS 未定义 → 移除对该引用/重新定义
- `hidden` 属性样式不生效 → 全局 `[hidden]{display:none!important}`
- 非词汇课时 quizTotal 报错 → 改为 `(content.words||[]).length`
- 退出登录空指针 → toggleUserMenu 加 `if(!U) return`
- data.js 撇号 I'm/won't 未转义 → XSS `esc()` 统一处理
- 引导页第二步高度不足不可见 → `.onboard { height → min-height:100% }`
- 词卡播放器 `hidden` 仍显示 → 全局 `[hidden]` CSS 提升优先级
- 选择头像清空已输入昵称 → 点击头像时先 `ob.name = $('#obName').value.trim()`
- 「join」成就缺 `check` 函数 → 显式 `check:u=>true`
- JDK 25 d8 NullPointerException → build.sh 切换 build-tools 36.0.0

### 📘 Docs
- `docs/DESIGN-v2.md`: MIUIX 设计 / SRS 算法 / PWA / 安卓工程设计
- `docs/TESTING-v2.md`: 全流程 60+ 用例,控制台零错误
- `docs/KNOWN-BUGS.md`: v2 开发过程 11 条 bug 列表 + 根因 + 修复提交
