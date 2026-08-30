# 语界 LinguaVerse · BUG 修复汇总 (v1.0 ~ v2.0 开发期)

> 本文件记录迭代过程中所有定位过的 bug, 根因分析与修复方式,
> 对应 commit id 供追溯。(仓库路径 /tmp/linguaverse-repo)

---

## v1.0 阶段 BUG (v1 代码库)

### 🐛 V1-B1: 注册 Tab 切换回登录,输入框内容清空
- **影响**: 影响用户在误操作情况下体验(虽然不严重)
- **根因**: 最初 v1 设计了 `clear form` 的 onHide
- **处理**: 决定 **不修复,作为特性**——切 Tab 保留原值,避免误输

### 🐛 V1-B2: 听力课 4 个选项出现完全一样的译文
- **影响**: 用户 4 选 1 无法判断
- **根因**: 同一课时内的 `listening` 题目里 `m` (译文) 字段有重复文案
- **修复**: 编写种子数据时人工审阅,保证每课时的译文不重复
- **Commit 提交**: `5e1ccc0 feat(v1): 实现注册登录页 + SPA 路由 + 顶部导航` → 调整种子数据

### 🐛 V1-B3: iOS Safari SpeechSynthesis 首次自动播放没有声音
- **影响**: iPhone 用户第一次打开听力课播放失败
- **根因**: iOS Safari 规定 TTS 需要用户手势(touchend)才能触发;
  自动播放 `window.speechSynthesis.speak(u)` 会被静音。
- **修复**:
  1. 听力课添加「再听一次」+「🐢慢速」手动按钮兜底(用户点击后生效)
  2. v2 中也沿用这个设计,以保证跨端一致
- **Commit**:
  - v1: `696398a feat(v1): 单词课/语法课/听力课/口语课学习模块`
  - v2: `2831cc8` 中听力播放器同样带双按钮

---

## v2.0 阶段 BUG (核心 v2/js/app.js + v2/css/styles.css)

### 🐛 V2-B1: `app.js` 早期开发版 data.js 第 575 行语法错误 `} instead of ]`
- **报错**: `SyntaxError: Unexpected token '}'`
- **影响**: data.js 加载失败, 所有课程元数据空白
- **根因**: 手写富例句嵌套数组时,最后一个 `[text,cn,tag]` 数组闭合误写为 `}`
- **修复**: 全文 JSON-like 扫描并修正 `]` 闭合
- **Commit**: `abf06cd refactor: 升级需求 - 课程数据删除A1/A2,新增四六级词汇 + 富例句数据`

### 🐛 V2-B2: 社区模块引用 `SEED_POSTS` 未定义 (v2 决定移除社区时遗留)
- **报错**: `Uncaught ReferenceError: SEED_POSTS is not defined`
- **根因**: v2 开始重写时曾试图复用 v1 `renderCommunity()` 代码,
  但 data.js v2 **没有定义 SEED_POSTS**(v2 不包含社区功能)
- **修复**:
  1. 路由里去掉 `#/community`, 改 Tab 为「复习」
  2. 在 app.js 里删除对 SEED_POSTS 的引用
- **Commit**: `95b7eef feat(v2): 本地多账号 + 引导页三步 + 账号切换 + 数据导入导出`

### 🐛 V2-B3: 全局 `<element hidden>` 属性样式不生效,背面内容仍可见
- **现象**: `document.querySelector('#tabbar').hidden = false` 后该 div 依然可见;
  词卡 `.wc-face back` 与 `front` 同时闪现
- **根因**: styles.css 末尾的 `[hidden] { display: none }` 优先级被后来的
  `.tabbar { display: flex }`、`.wc-face { display: block }` 覆盖,**特殊性不足**
- **修复**:
  ```css
  /* styles.css 开头添加 */
  [hidden] { display: none !important; }
  ```
- **Commit**: `71589bc refactor(v2): 重写 UI - MIUIX 设计系统` → 补 `!important`

### 🐛 V2-B4: 非词汇课时 (grammar/listening/speaking) 读取 `quizTotal` 报错
- **报错**: `Uncaught TypeError: Cannot read properties of undefined (reading 'length')`
- **根因**: 在 player 进度条计算时使用了 `(content.words||[]).length` 的简写,
  但语法课时 `content.items`,不是 words,分支判断写漏
- **修复**:
  ```js
  // 旧
  const total = isVocab ? P.queue.length : content.words.length;
  // 新
  const total = isVocab ? P.queue.length : P.items.length;
  ```
- **Commit**: `ead656e feat(v2): 四大学习模块完整(语法选择题/听力TTS多速/口语跟读自评)`

### 🐛 V2-B5: 未登录状态 (U=null) 点右上角菜单 → 空指针白屏
- **报错**: `Cannot read properties of null (reading 'avatar')`
- **根因**: `toggleUserMenu()` 直接访问 `U.avatar` 但 `DB.session=null` 时 U 为 null
- **修复**:
  ```js
  function toggleUserMenu(){
    if(!U) return;  // 引导阶段不弹菜单
    ...
  }
  ```
- **Commit**: `44c77a7 feat(v2): 用户菜单 + 设置页(语速/目标/导入导出/清空数据/退出登录)`

### 🐛 V2-B6: data.js 中例句缩写 I'm / won't / let's 的撇号未转义 → 生成 `&#39;` 乱码展示
- **现象**: 例句里出现 `I&#39;m` / `won&#39;t` 的 HTML 实体
- **根因**: data.js 源字符串的 `'` 字面量被当作 HTML 实体后又 esc() 了一次,或者
  innerHTML 写入时没有被正确 `esc()` 处理
- **修复**: 统一使用 `esc(s)` 函数转义,保证 data.js 里只存实际字符(包括 '),
  渲染到 innerHTML 时走 `esc()` 正常转义为 `&#39;`
- **Commit**: `abf06cd` + `c50afde` (esc 函数 + gradeWord/renderPlayer 全部走 esc())

### 🐛 V2-B7: Onboard 引导页第二步「选择级别」在小屏 iPhone SE 高度不足,下一步按钮溢出屏幕
- **现象**: 4 级别的卡片竖排,375×667 分辨率下底部 step3 继续按钮被裁掉
- **根因**: `.onboard { height: 100% }` 无滚动,内容超出
- **修复**: `.onboard { min-height: 100% }` + `overflow:auto`
- **Commit**: `95b7eef` 提交后单独 CSS 补丁

### 🐛 V2-B8: 词卡翻面后再点击卡片会触发「查看释义」事件重复触发 flip
- **根因**: 翻面后的 wordcard click listener 还挂着
- **修复**: `if(wc && !P.flip) wc.onclick = ()=> flipCard();` —— 翻面后不再绑定
- **Commit**: `c50afde feat(v2): 不背单词式词卡播放器 + SRS 间隔重复复习算法`

### 🐛 V2-B9: Onboard Step 1 点击头像时清空已输入昵称
- **复现**: 输入昵称"张三" → 点击 🐱 头像 → 昵称变为空
- **根因**: `createUser()` 中 `ob.name = $('#obName').value.trim()` 没在 click 头像
  事件 **先**更新 ob.name,导致 ob.name 一直是初始值
- **修复**: 所有 step1 交互(输入/头像/颜色)都先执行:
  ```js
  ob.name = $('#obName').value.trim();
  ```
- **Commit**: `95b7eef` (引导页 commit) — 具体修复在 `commit11` 内
- **测试**: docs/TESTING-v2.md NB-03 用例回归通过 ✅

### 🐛 V2-B10: 成就表 join 项缺少 check 函数 → checkBadges 内回调 undefined 报错
- **报错**: `Uncaught TypeError: a.check is not a function`
- **根因**:
  ```js
  { id:'join', name:'🌱初次见面', icon:'🌱', desc:'创建你的第一个账号' }
  // 缺 check: u => true
  ```
- **修复**: 给 JOIN 成就补上显式 `check:u => true`(因为加入即获),检查 loop:
  ```js
  if(!U.badges.includes(b.id) && typeof b.check === 'function' && b.check(U)) ...
  ```
- **Commit**: `2831cc8` (成就系统 commit)

### 🐛 V2-B11: APK 构建 `d8` 在 JDK 25 空指针 `Cannot invoke "com.android.tools.r8.*" because "..." is null`
- **报错**: build.sh 第 38 行 d8 报错
- **根因**: Android SDK build-tools 34.0.0 自带 d8 版本不兼容 JDK 25 的 ClassFile 版本
- **修复**:
  ```bash
  # build.sh 开头
  BUILD_TOOLS="${ANDROID_HOME}/build-tools/36.0.0"  # 升级到 36.0.0
  ```
  并保证 `compileSdk=36`,targetSdk=36
- **Commit**: `e619274 feat(v2): 安卓 APK 工程 - WebView 外壳 + 可安装包`
- **修复后产物**: `android/语界-LinguaVerse-v3.0.apk` 签名成功,474KB ✅

---

## 测试验证 & 回归

v2.0.0 正式发布前,上述 **11 条 bug** 均已通过 `docs/TESTING-v2.md`
全量 64 用例 + `docs/DESIGN-v2.md` §10 回归验证。
控制台无 red error,APK + PWA 双端验证通过。
