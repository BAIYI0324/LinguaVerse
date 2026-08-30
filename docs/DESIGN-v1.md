# 语界 LinguaVerse v1 · 架构设计文档

> 版本: v1.0 · 状态: Released
> 作者: CHANG (BAIYI0324)

## 1. 产品定位

v1 是语界平台的 **首次多语种在线教育 MVP**。核心目标：

- 覆盖 **英语(A1/A2/B1/B2)、日语(N5/N4/N3)、韩语(TOPIK I/II/III)** 三门主流外语
- 提供 **单词课 / 语法课 / 听力课 / 口语课** 四大基础学习模块
- 完成 **注册/登录 → 选语言 → 上课 → 查看进度** 的完整闭环
- 内置学习社区(帖子板)、学习进度追踪、成就系统,增强留存

## 2. 技术选型

| 层 | 选型 | 说明 |
|---|---|---|
| 前端架构 | 纯静态 SPA (Vanilla JS) | 零依赖、零打包、可直接用 file:// 打开或任意静态服务器部署 |
| UI 框架 | 无 · 手写 CSS | 白底 + 蓝色(#409EFF)主色 + Element UI 风格配色,符合常见后台视觉 |
| 路由 | Hash Router (`location.hash`) | SPA 页面切换,免服务器配置 |
| 用户体系 | Mock API (`setTimeout` 模拟) + `localStorage` 持久化 | POST /api/register · /api/login 接口语义,后续可无缝替换真实后端 |
| 数据存储 | LocalStorage (键 `linguaverse_v1_*`) | users、token、posts 分键存储 |
| TTS 发音 | 浏览器原生 `SpeechSynthesisUtterance` | 英语 en-US、日语 ja-JP、韩语 ko-KR |

## 3. 目录与模块划分

```
v1/
├── index.html              入口: 导航 + #app 挂载点
├── css/styles.css          全站样式(导航/卡片/课时播放器/社区/成就)
└── js/
    ├── data.js             课程数据: LANGUAGES / COURSES / CONTENT
    └── app.js              应用逻辑: MockAPI / Router / Player / Community
```

### 模块职责

| 模块 | 文件 | 职责 |
|---|---|---|
| **数据层** | `js/data.js` | 定义语种/级别/单元/课时元数据 + 单词/考题/听力/口语实体内容 |
| **用户层** | `js/app.js` MockAPI 段 | 注册、登录、用户对象 Schema、会话持久化 |
| **路由层** | `js/app.js` router() | Hash 解析 → 渲染对应视图: home / courses / lesson / community / me |
| **学习层** | `js/app.js` startLesson() | vocab 卡片翻页、grammar/listening 选择、speaking 自评 → finishLesson() 结算 XP & 打卡 |
| **社区层** | `js/app.js` renderCommunity() | 种子帖子、发布、点赞、评论(嵌套 localStorage) |
| **成就层** | `js/app.js` ACHIEVEMENTS + checkBadges() | 10 个成就: 新人/连续/词汇量/XP/英语通关 |
| **视图层** | `css/styles.css` | 全部视觉组件,响应式(≥1100px 居中容器) |

## 4. 数据结构

### 4.1 用户对象 Schema
```js
{
  id: 'u_' + timestamp36,
  name, email, avatar, color,
  createdAt: Date.now(),
  xp: 0,
  lessonsDone: { [lessonId]: {at, xp} },
  streak: { count:0, last: toDateString(today) },
  stats:  { words:0, quiz:0 },
  badges: ['newcomer', ...]
}
```

### 4.2 单词条目老格式(5 元数组)
```js
[word, phonetic, meaning, example_sentence, example_translation]
// 例: ['hello','/həˈloʊ/','你好','Hello, nice to meet you.','你好,很高兴认识你。']
```

### 4.3 考题(语法/听力)格式
```js
{ q: 题干, opts:[A,B,C,D], a: 正确索引, explain: 解析 }
```

### 4.4 口语条目
```js
{ t: 示范文本, r: 音标/罗马字读音可选, m: 译文 }
```

### 4.5 社区帖子 Schema
```js
{ id, uid, uname, uavatar, ucolor, tag, content, time,
  likes: [uid,...], comments: [{u,t,time}] }
```

## 5. 核心流程

### 5.1 新用户注册登录
```
访问页面 → 未检测到 token → renderAuth()
  → 切换 [登录|注册] Tab
  → 点击登录: MockAPI.login(email,pwd) → 500ms 模拟延迟
  → 成功: 存 localStorage token → router() 渲染首页
```

### 5.2 学习课时
```
点击词书课时 → hash #/lesson/:id
  → startLesson() lessonState 初始化
  → vocab: nextVocab() 逐词翻页 → 记录 U.stats.words
  → quiz: 选择后高亮对错 + 解析 → nextItem()
  → 最后一题/词: finishLesson()
    - 计算 XP: vocab 全额, quiz = xp * (正确/总数)
    - 写入 lessonsDone
    - bumpStreak() 检查连续天数
    - checkBadges() 触发成就
    - 显示结算页 🏆
```

### 5.3 成就检查
每个 `finishLesson()` 后遍历 **ACHIEVEMENTS** 数组,对尚未解锁且满足 `check(U) === true` 的成就 push 进 U.badges,并 toast 弹提示。

## 6. 语种课程设计

| 语种 | 级别 | 单元数 | 课时 |
|---|---|---|---|
| 🇬🇧 英语 | A1 | 2 | 各 2 课时(U1 词汇+语法 U2 词汇+听力) |
| 🇬🇧 英语 | A2 | 2 | 各 2 课时(U1 词汇+口语 U2 词汇+语法) |
| 🇬🇧 英语 | B1 | 2 | 各 2 课时(U1 词汇+听力 U2 词汇+口语) |
| 🇬🇧 英语 | B2 | 2 | 各 2 课时(U1 词汇+语法 U2 词汇+听力) |
| 🇯🇵 日语 | N5 | 2 | 词汇+语法 / 词汇+听力 |
| 🇯🇵 日语 | N4 | 2 | 词汇+语法 / 词汇+口语 |
| 🇯🇵 日语 | N3 | 2 | 词汇+语法 / 词汇+听力 |
| 🇰🇷 韩语 | TOPIK I | 2 | 词汇+语法 / 词汇+听力 |
| 🇰🇷 韩语 | TOPIK II | 2 | 词汇+语法 / 词汇+口语 |
| 🇰🇷 韩语 | TOPIK III | 2 | 词汇+语法 / 词汇+听力 |

## 7. 视觉与交互规范

- 主色: **#409EFF** (Element-UI 蓝),成功绿 #67C23A,警告橙 #E6A23C,错误红 #F56C6C
- 圆角: 卡片 14px / 按钮 10px / 头像 50%
- 顶部导航 60px 高 sticky,Logo 渐变胶囊图标
- 响应式: 容器 max-width:1100px,移动端自动铺满宽度
- 课时播放态: 顶部进度条 + 返回键,类「不背单词」但更简洁的卡片视图

## 8. 后续升级预研(v2 方向)

1. **数据模型升级**: 英语词汇增加词根助记 + 多例句(真题/影视/日常标签)
2. **去掉后端**: 纯本地多账号,支持数据导入导出
3. **SRS 算法**: 引入 1/2/4/7/15/30 日间隔的遗忘曲线复习系统
4. **PWA + 安卓 APK**: Service Worker 离线缓存 + WebView 原生外壳
5. **MIUIX 设计语言**: HyperOS 风格手机外壳 UI,底部 Tab 导航
6. **级别精简**: 英语改为 **CET-4 / CET-6 四六级** 更贴合国内用户需求
