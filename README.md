# 语界 LinguaVerse

> 四六级英语 · 日语 · 韩语，"不背单词式"词卡 + SRS 间隔复习
> 纯内置离线运行 · PWA + Android WebView 双形态

<p align="center">
  <img src="icons/icon-512.png" width="120" alt="语界 icon" />
</p>

---

## ✨ 特性

- **完全离线**：朗读由前端 `meSpeak.js`（eSpeak Emscripten）纯 JS 合成，不依赖任何外部 TTS 服务 / 系统 TTS / 词典 CDN。
- **不背单词式词卡**：左右滑动翻卡 · 长按发音 · 自动朗读 · 点击翻面看释义。
- **SRS 间隔复习**：1→2→4→7→15→30 天 Box 记忆系统，到期自动汇总。
- **多语种**：英语（CET-4 / CET-6）、日语（N5 / N4）、韩语（TOPIK I / II）。
- **大词库**：CET-4 扩充词库 4500+ 词、CET-6 扩充词库 2000+ 词，按课切片。
- **本地账号**：数据全在本机，支持多账号、JSON 导入导出、跨设备迁移。
- **澎湃美学 UI**：HyperOS 风格设计系统，渐变 / 毛玻璃 / 大圆角 / 触感反馈。
- **成就 & 打卡**：连续学习、XP 等级、12 枚成就徽章。

## 📱 运行方式

### 浏览器 / PWA

需通过 HTTP(S) 访问（Service Worker 仅在 http/https 注册）：

```bash
# 仓库根目录启动静态服务器
python3 -m http.server 8080
# 或
npx serve .
```

浏览器打开 `http://localhost:8080/`，首次访问走引导流程创建本地账号。
桌面端可「安装为应用」获得独立窗口体验。

### Android

仓库已附带预构建 APK：

- `LinguaVerse-v4.0.0.apk`
- `android/LinguaVerse-v4.0.0.apk`

直接安装即可，沉浸式状态栏、纯离线运行、不依赖系统 TTS。

## 🗂️ 目录结构

```
.
├── index.html              # 应用入口
├── manifest.json           # PWA 清单
├── sw.js                   # Service Worker（缓存优先，离线秒开）
├── css/styles.css          # HyperOS 设计系统
├── js/
│   ├── app.js              # 全部应用逻辑
│   ├── data.js             # 课程 / 词库 / SRS / 成就数据
│   ├── data_words_patch.js # 四六级扩充词库 + 课切片范围
│   └── vendor/mespeak/     # 离线 TTS 引擎
├── icons/                  # 应用图标
├── android/                # Android WebView 外壳工程
│   ├── AndroidManifest.xml
│   ├── build.sh            # APK 直编脚本（无 Gradle）
│   ├── java/com/yujie/app/MainActivity.java
│   └── assets/www/         # 前端资源打包副本
├── gen_words.js            # Node.js 词库生成器
└── docs/CODE_WIKI.md       # 详细架构文档（Code Wiki）
```

## 🛠️ 技术栈

- **前端**：纯原生 JS（无框架）、CSS 变量设计系统、PWA
- **存储**：localStorage（用户数据）+ IndexedDB（音频缓存）+ Service Worker Cache
- **语音**：meSpeak.js（eSpeak Emscripten 编译，纯 JS 合成 WAV）
- **口语识别**：Web Speech API（可选，不支持时降级为跟读练习）
- **Android**：WebView 外壳，`https://localhost/` 虚拟域 → `assets/www/` 注入

## 🔨 自行构建 APK

依赖：Android SDK（build-tools 34/36 + platforms/android-34）、JDK 17+。

```bash
cd android
./build.sh        # 产出 LinguaVerse-v4.0.0.apk（已用 yujie.keystore 签名）
```

构建细节见 `android/build.sh` 与 [docs/CODE_WIKI.md](docs/CODE_WIKI.md#12-android-构建说明)。

## 📚 词库维护

```bash
node gen_words.js   # 重新生成 data_words_patch.js
# 之后按需手工合并到 js/data.js 的 CONTENT 中
```

## 📖 更多文档

完整的架构、模块职责、关键函数、SRS 算法、TTS 管线、数据结构等说明见：

👉 [docs/CODE_WIKI.md](docs/CODE_WIKI.md)

## 📄 许可证

MIT
