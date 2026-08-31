# 语界 LinguaVerse

多语种背单词 / 学习平台，支持 **英语（CET-4 / CET-6）、日语（N5 / N4）、韩语（TOPIK I / II）**。
纯前端实现，零后端、零账号服务器，学习数据全部保存在本地。

> Web PWA · Android APK · Windows 桌面版（Electron）三端同构，共享同一套前端代码。

## ✨ 功能特性

- **不背单词式词卡**：点击翻面查看释义，左右滑动评分（认识 / 不认识），上下滑动翻面，长按发音
- **SRS 间隔复习**：Leitner 盒子算法，按记忆曲线安排复习计划，每日目标打卡
- **多级 TTS 发音引擎**（详见下文），在线微软自然语音 + 离线兜底，发音不再机械
- **课程体系**：单词卡、语法、听力、口语跟读（语音识别打分）多题型
- **本地账号**：多账号切换、数据 JSON 导入 / 导出、XP 等级与徽章成就、连胜打卡
- **词根词缀助记 + 真题 / 影视 / 日常分类例句**
- 离线可用：Service Worker 缓存应用外壳，无网也能复习已缓存内容

## 🔊 发音引擎架构（v4.1）

朗读按以下顺序自动选择引擎，任一失败无缝回退：

1. **IndexedDB 缓存**：合成过的音频永久缓存，命中秒开（语速已烘焙进缓存，不会二次变速）
2. **微软 Edge TTS 在线自然语音**：WebSocket 直连 `speech.platform.bing.com`，免费、无需 API Key，音质为神经网络自然人声（`Sec-MS-GEC` 鉴权参数在本地计算）
3. **系统语音 speechSynthesis**：设备本地 TTS，音质自然，不可缓存
4. **meSpeak.js**：纯 JS 形式合成引擎打包在应用内，保证完全离线可用

可在 **设置 → 在线发音** 中开关在线引擎；朗读语速支持 0.5x ~ 1.5x。

## 📁 目录结构

```
├── index.html            # Web 入口 (PWA)
├── js/app.js             # 应用逻辑（词卡 / SRS / TTS / 设置等）
├── js/data.js            # 课程与词库数据
├── js/data_words_patch.js# 四六级扩充词库 (4500+/2000+)
├── js/vendor/mespeak/    # 内置离线 TTS 引擎
├── css/                  # 样式
├── sw.js                 # Service Worker
├── android/              # Android WebView 外壳 + APK 直编脚本
│   ├── build.sh          # aapt2/d8/apksigner 无 Gradle 构建
│   └── assets/www/       # 与 Web 版同步的前端副本
└── desktop/              # Windows 桌面版 (Electron, Win11 Fluent Design)
    └── app/              # 与 Web 版同步的前端副本
```

## 🚀 运行与构建

### Web（本地预览）

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000/
```

### Android APK

依赖 Android SDK（build-tools + platforms/android-34）与 JDK 17+：

```bash
cd android
./build.sh        # 产物: LinguaVerse-v5.0.0.apk (已签名)
```

前端有改动时，先同步 `js/ css/ index.html` 到 `android/assets/www/` 再打包。

### Windows 桌面版

```bash
cd desktop
npm install
npm start         # 开发运行
npm run dist      # 打包 win32 x64
```

## 📱 技术要点

- 零构建、零框架、零后端：原生 HTML/CSS/JS，数据存 `localStorage` + `IndexedDB`
- Android 壳通过 `https://localhost/` 虚拟域从 assets 注入页面，保证 localStorage / SW / IndexedDB 正常
- Service Worker 网络优先策略：升级即时生效、离线仍可用、旧缓存自动清理
- 语音跟读使用 Web Speech API（`SpeechRecognition`）

## 许可证

MIT（页面脚注标注）。desktop/package.json 中为 GPL-3.0，以仓库根目录许可声明为准。
