# 语界 LinguaVerse · v2.0 当前版本

> 🚀 **v2.0.0 (Current)** · 发布于 2025-08-30 · 推荐使用本版本
>
> [顶层 README](../README.md) · [设计文档 v2](../docs/DESIGN-v2.md) ·
> [测试记录](../docs/TESTING-v2.md) · [已知 Bug&修复](../docs/KNOWN-BUGS.md) ·
> [CHANGELOG](../CHANGELOG.md)

## ✨ v2.0 新特性 (相比 v1)

| 特性 | 说明 |
|---|---|
| 🎨 **MIUIX / HyperOS 设计** | 底部 Tab + 手机外壳桌面端,卡片圆角 + 悬浮阴影 |
| 📚 **四六级词书** | 英语从 A1-B2 → **CET-4 四级(3单元) / CET-6 六级(2单元)** |
| 🧠 **SRS 间隔复习算法** | Box 0-5,间隔 [1,2,4,7,15,30] 天,到期自动出现在「复习」Tab |
| 🃏 **不背单词式词卡** | 3D 翻面,正面单词+音标+🔊,背面释义+词根助记+3条例句(真题/影视/日常) |
| 👤 **本地多账号** | 引导页三步创建,可切换、导入、导出、清空学习记录 |
| 🎯 **每日目标** | 10/20/30/40 四档,首页环形进度可视化 |
| 🔊 **TTS 多档语速** | 0.5x ~ 1.5x 五档可设置,保存到账号 |
| 🏅 **成就 12 枚** | 新增首 Deck / 复习五十 / 语法 / 听力 / 口语 / 千XP / 五级大佬 等 |
| 📱 **PWA 离线** | manifest.json + Service Worker (yujie-v3),可安装到主屏幕 |
| 🤖 **Android APK** | WebView 外壳 + Assets 虚拟主机,约 **474 KB** 直接安装 (Android 8+) |

## 📦 快速使用

### 方式一: 浏览器 (推荐)
```bash
cd v2/ && python3 -m http.server 8000
# 打开 http://localhost:8000/
```

### 方式二: 安装 PWA
> 用 Chrome / Edge / Safari 打开上述地址 → 地址栏「安装应用」按钮,离线可用 ✅

### 方式三: 安装 APK 到安卓手机
```bash
# 已在仓库预编译
adb install ../android/语界-LinguaVerse-v3.0.apk
```
> 或者直接把 `android/语界-LinguaVerse-v3.0.apk` 发到手机,在文件管理器点击安装。
> 签名密钥: `yujie.keystore` (密码 **yujie2026**),使用 apksigner v2 签名。

### 方式四: 重新构建 APK
```bash
cd ../android
# 设置环境变量 (需 Android SDK + JDK 17)
export JAVA_HOME=/path/to/jdk-17
export ANDROID_HOME=/path/to/Android/Sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/build-tools/36.0.0:$PATH

chmod +x build.sh && ./build.sh
# 产物: 语界-LinguaVerse-v3.0.apk
```

## 📚 词书体系

| 语种 | 级别 | 单元 | 覆盖内容 |
|---|---|---|---|
| 🇬🇧 英语 | CET-4 四级 | U1 核心词汇 / U2 校园生活 / U3 情感成长 | 36 核心词 + 15 语法 + 15 听力 + 15 口语题 |
| 🇬🇧 英语 | CET-6 六级 | U1 六级核心 / U2 职场进阶 | 24 高阶词 + 10 语法/听力/口语题 |
| 🇯🇵 日语 | N5 / N4 / N3 | 各 2 单元 | 48 单词 + 12×3 题型 |
| 🇰🇷 韩语 | TOPIK I / II / III | 各 2 单元 | 48 单词 + 12×3 题型 |

### 英语富格式示例
```js
[
  "accommodate", "/əˈkɒmədeɪt/", "v. 容纳;提供住宿",
  "ac(加强)+commod(方便)+ate → 给人方便 → 提供食宿",
  [
    ["The hotel can accommodate up to 300 guests.","这家酒店最多可容纳 300 位客人。","🎬 影视"],
    ["We must accommodate different views.","我们必须包容不同观点。","📖 真题"],
    ["My schedule is flexible — I can accommodate you.",
     "我的时间安排比较灵活,可以配合你。","💬 日常"],
  ]
]
```

## 🧠 SRS 间隔重复

| Box | 间隔天数 | 状态 |
|---|---|---|
| 0 | 1 | 新词(或答错重置) |
| 1 | 2 | 刚会 |
| 2 | 4 | 熟悉中 |
| 3 | 7 | 已熟悉 |
| **4** | **15** | **已掌握 ✓** |
| 5 | 30 | 长期记忆 |

点击词卡「**不认识**」→ Box 降级,3 个词后再次出现。
点击「**认识**」→ Box 升级,下一次到期时间 = 今天 + 间隔天数。

## 📂 文件结构

```
v2/
├── index.html                  # 主入口 (phone壳 + app + player + toasts + onboard 容器)
├── manifest.json               # PWA 清单 (yujie-v3)
├── sw.js                       # Service Worker (Cache First, 版本 yujie-v3)
├── README.md                   # 本文件
├── css/
│   └── styles.css              # ~795 行 MIUIX 完整样式 + 响应式 + 手机外壳
├── js/
│   ├── data.js                 # 774 行 · 词库+分级+成就+SRS间隔+常量
│   └── app.js                  # 1089 行 · 数据库/路由/播放器/设置/引导/成就检查
└── icons/
    ├── icon-192.png            # PWA 192
    ├── icon-512.png            # PWA 512
    ├── icon-maskable-512.png   # maskable Android 自适应图标
    └── icon-1024.jpg           # App Store/市场大图
```

## 兼容性 (已测试 ✅)

| 端 | 最低版本 | 备注 |
|---|---|---|
| Chrome / Edge | 120+ | **完美**,推荐使用 |
| Safari macOS / iOS | 16+ | TTS 需手势 → 「再听一次」按钮兜底 |
| Firefox | 118+ | ✅ TTS 依赖系统音频包 |
| Android (APK) | **8.0+** (API 26) | 原生安装包,全功能支持 |

## ⚠️ 与 v1 的不兼容

> v2 是一次**重写级别升级**,数据不兼容:
>
> - v1 使用 `yujie_v1` localStorage 键, v2 使用 `yujie_v3` (中间无 v2 正式发布)
> - v1 账号是 Mock API, v2 是本地多账号体系,**需要新建账号**
> - v1 社区帖子板在 v2 已下架(移至 v2.1 roadmap),社区数据不迁移
> - 英语 A1-B2 分级已替换为 **CET-4/CET-6 四六级**

如果希望保留 v1 的学习体验,请查看 `/v1/` 目录快照,
也可以在 GitHub Release 的 **v1.0.0** 中下载对应版本。

## 🗺️ 路线图 (Roadmap)

- **v2.1 (Q4 2025)**: 重写社区帖子板(多级评论、话题、点赞排序)
- **v2.2**: 统计页(7 日柱状图 + 热力图)
- **v2.3**: 自定义词书上传 / CSV 导入
- **v3.0**: 真正的云同步账号 (云端 + 端侧加密)

---

**License**: MIT © CHANG (BAIYI0324) · 同 [顶层 LICENSE](../LICENSE)
