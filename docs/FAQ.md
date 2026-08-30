# ❓ 常见问题 FAQ

---

## 📱 安装 / 运行

### 问: 手机下载 APK 后安装提示「未知来源」怎么办？
**答**: 不同品牌叫法略有不同：
- MIUI: 设置 → 隐私保护 → 更多设置 → 「安装未知应用」→ 给浏览器/微信 授权
- ColorOS: 设置 → 密码与安全 → 系统安全 → 「未知来源应用下载」开
- 原生 Android: 安装界面会自动弹授权，点「允许本次安装」即可

### 问: 有没有 iOS 版？
**答**: 当前没有 iOS 原生包。但 v2 是一个 PWA：在 iPhone Safari 打开部署好的 v2/index.html → 分享 →
「添加到主屏幕」，体验与原生 App 几乎一致（离线、全屏、图标一致）。
欢迎在 [Discussion](https://github.com/BAIYI0324/LinguaVerse/discussions)
里投票 / 提 PR 做 Swift WKWebView 外壳。

### 问: 为什么不用后端？为什么没有「账号同步」？
**答**: 本项目核心定位是 **100% 离线可用**。
- 手机端纯本地 localStorage 存储，学习记录不会被任何人看到
- 需要多设备迁移？用「我的 → 导出学习数据」，拿到 JSON 后在另一台设备导入即可
- 云同步是 v2.2 规划中的可选开关（零知识加密端到端同步），默认保持关闭

---

## 🧠 学习方式

### 问: SRS 的 5 个盒子分别是多久？
**答**: 默认值写在 `v2/js/app.js` 顶部的 `SRS_INTERVALS`：
```js
[1, 2, 4, 7, 15, 30]  // 单位: 天
```
- 第一次「认识」→ 明天到期 (1d, Box 1)
- 连续 3 次都认识 → 7 天后到期 (Box 4)
- 不认识 → Box 减 1，当天稍后再出一次
你可以改这个数组调整记忆节奏。

### 问: 为什么有些单词过了还在出现？
**答**: 不认识的词会在同组内往后数 3 张重新出现，直到你连续「认识」。如果是当天复习到期，
它会在「复习」Tab 出现（不是新词学习里）。

### 问: 例句发音不对 / 想换成英式发音？
**答**: 英语默认使用 Web Speech API `en-US`（美式）。
- 想切英式：在 `js/data.js` 的 `LANGUAGES.en.ttsLang` 改成 `'en-GB'`
- 自定义音频包：把 mp3/wav 放到 `v2/icons/audio/xxx.mp3`，并在 `speak()` 函数第一行优先加载 URL

---

## 🎨 UI / MIUIX

### 问: 为什么设计成竖屏固定手机外壳的样子？
**答**: v2 的目标平台是手机，PC 打开时居中的手机外壳让开发者一眼看到真实效果。
如果你想在 PC 端当网页用，可以：
1. 在 `css/styles.css` 里删掉 `.phone` 的 `max-width:390px` + 圆角 + 外壳
2. 让 `.tabbar` 改为左侧/顶部导航

### 问: 配色 Token 都在哪？我想自定义一套主题。
**答**: 全部在 `styles.css` 最顶部的 `:root` 段：
```css
--bg: #F4F5F7; --text: #1F2328; --primary: #FF6900; --success:#00B578; ...
```
改动这一段即可全局换色（例如做深色模式只需覆盖为另一套值）。

---

## 🏗️ 构建 / 打包

### 问: 自己打包 APK 需要什么环境？
**答**:
- **Java 17+**（测试通过 17 / 21 / 25，JDK 25 需 build-tools 36+）
- **Android SDK**: 装 `cmdline-tools;latest` + `build-tools;36.0.0` + `platforms;android-34`
- 运行 `bash android/build.sh`，10 秒内产出签名后的 APK

### 问: 打包用的 keystore 可以换成我自己的吗？
**答**: 可以。用下面命令生成新的：
```bash
keytool -genkeypair -keystore my.keystore -alias myapp \
  -keyalg RSA -keysize 2048 -validity 36500 \
  -storepass 你的密码 -keypass 你的密码 -dname "CN=你, O=公司, C=CN"
```
然后修改 `build.sh` 第 6 步的 `--ks my.keystore --ks-pass pass:你的密码`。

---

## 💾 数据 / 隐私

### 问: 学习数据都存到哪了？
**答**:
- **Web 版**：浏览器 localStorage，键名前缀 `yujie:`
- **APK 版**：WebView 的 localStorage 沙箱，随 App 安装目录保存，卸载会清除
- **绝对不会**发请求到外部服务器。你可以开飞行模式照常使用。

### 问: 导出的 JSON 里有什么？
**答**: 形如：
```json
{
  "users":  [{id, name, avatar, lang, level, dailyGoal, ttsRate, xp, srs:{...}, lessons:{...}, badges:[...], stats:{...}}],
  "session": "当前用户id",
  "exportedAt": "2026-08-30T...",
  "appVersion": "2.0.0"
}
```
- `srs` 是每个课时的每个单词的 Box + 到期日 + 复习次数
- `lessons` 是每节课是否完成、得分、xp
- 没有任何个人联系方式 / 定位 / 设备信息

### 问: 数据不小心删除了怎么办？
**答**: 很遗憾，纯本地无备份。请定期使用「我的 → 导出学习数据」存一份 JSON 到你的云盘 / 邮箱。
我们在 [ROADMAP](./ROADMAP.md) 的 v2.2 里规划了「自动备份到 WebDAV」开关。

---

## 🐛 Bug 类

### 问: 打开页面是白屏？
1. 打开控制台（F12）看有没有 `Unexpected token '}'` 这种 — 说明 `data.js` 里某处字符串撇号没转义
2. 检查是不是 `file://` 直接打开（localStorage 在某些浏览器的 file:// 上被禁），必须用本地服务器
   `python3 -m http.server` 访问 `http://localhost:8080/`
3. 确认 Service Worker 没缓存脏版本：DevTools → Application → Service Workers → Unregister

### 问: 安卓 APK 里有些字（如日语片假名）显示成方块？
**答**: WebView 默认用系统字体。某些超老国产 ROM 没装日韩字体。
临时方案：在 `styles.css` 中 `body` 加 `font-family: 'Noto Sans SC', 'Noto Sans JP', sans-serif;`，并在 APK 内 assets
加字体文件（文件会变大 ~5MB）。

### 问: 语音朗读没声音？
1. 手机 TTS 引擎没装 / 禁了：设置 → 无障碍 → 文字转语音输出，装 Google / 小米 TTS
2. 某些国产 ROM 拦截 WebView 的 TTS API，可以用「设置 → 朗读语速」重触发一次重新请求引擎

还有问题？开 Issue 或直接发 Discussion，我们通常 24 小时内回复 ✨
