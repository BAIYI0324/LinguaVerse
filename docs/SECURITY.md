# 🔐 安全政策 / Security Policy

语界 LinguaVerse 以「数据只在你本地」为核心原则，因此安全模型和普通在线产品很不一样。
但我们仍然严肃对待任何可能影响你数据或设备的问题。

---

## ✅ 我们已采取的保障

1. **零网络请求**：v2 代码中不包含任何 `fetch` / `XMLHttpRequest` / 第三方 SDK；
   打开 Fiddler / mitmproxy 看，APK 或 Web 版都不会主动发一个包出去（除了
   Service Worker 首次注册和 Web Speech API 可能调系统 TTS）。
2. **敏感数据全部留本机**：用户名、学习 SRS、课时进度、导入导出 JSON —— 全在 localStorage / JSON 文件。
3. **APK 签名**：使用 v2 签名方案（Android 7+ 强制验证），任何人篡改 APK 内容都无法通过安装校验。
4. **WebView 注入策略**：只拦截 `https://localhost/*`，其他 URL 一律交给系统浏览器（不会被本应用劫持）。
5. **无动态 eval / 无从远程加载的 JS**：所有逻辑都是仓库内的静态脚本，APK 安装后执行的字节 100% 可审计。

---

## 🚨 发现安全问题？

**请不要公开在 Issue 里发 PoC**（可能被恶意利用）。
请通过以下**私密渠道**之一发送：

- 方式 A：发邮件到 `yujie_oss@proton.me`（推荐附 PGP 公钥以加密通信）
- 方式 B：在 GitHub 里开 **Security Advisory**（推荐）：
  仓库 → `Security` 选项卡 → `Advisories` → `New draft security advisory`
  （草稿只有维护者和你本人可见，协商修复方式 + CVE 编号后再公开）

我们承诺：
- **24 小时内**确认收到
- **72 小时内**给出风险评级与修复计划
- **修复后**在 Release 笔记 / Security Advisory 中公开致谢（除非你希望匿名）

---

## 🎯 风险评级

| 级别 | 定义 | 修复时限 | 例子 |
|---|---|---|---|
| **Critical 🟥** | 可远程执行任意代码 / 数据泄露到第三方 | 7 天 | XSS 导致 U 对象被 exfiltrate 到某域名 |
| **High 🟧** | 本地提权 / 非授权导入 JSON 覆盖他人数据 | 14 天 | Android APK WebView JS 接口暴露导致任意文件读取 |
| **Medium 🟨** | UI 上可被诱导操作导致数据丢失 | 30 天 | 分享含恶意 JS 的导出 JSON，对方导入后清空数据 |
| **Low 🟩** | 展示问题 / 信息泄露风险低 | 下个版本修 | 导入导出 JSON 未提示包含用户名 |

---

## 🚫 不被视为安全问题的内容

- 「卸载 APP 数据没了」——纯本地的特性（请使用导出功能定期备份）
- 「别人拿到我的手机直接打开 APP 看到我的进度」——这是物理安全，APK 默认不设密码锁
  （需要加应用锁？可在 [Discussion](https://github.com/BAIYI0324/LinguaVerse/discussions)
  投票 `PIN 启动锁` 功能，我们会在 v2.1 评估）
- Service Worker 的离线缓存「导致我看不到页面最新修改」——这是 PWA 的正常行为，
  DevTools 里 `Unregister` 即可，不算安全漏洞

---

## 📦 第三方依赖审计

为了最小化攻击面，v2 **运行时 0 依赖**（除浏览器/系统 WebView 内置 API）。

| 类别 | 是否有依赖 | 说明 |
|---|---|---|
| JS 运行时（v2）| **零** | 自己写的 app.js/data.js，纯原生 DOM |
| CSS 框架 | **零** | 原生 CSS + MIUIX tokens |
| APK 构建 | JDK + Android SDK | Google 官方工具链，版本在 `android/build.sh` 可查 |
| CI 环境 | `actions/checkout@v4` + `setup-node@v4` | GitHub Actions 官方 Actions |

依赖越少，攻击面越小。如发现任何依赖（build 脚本里引用的 URL / jar）有漏洞，
同样走上面的安全上报通道。

---

## 🔐 版本支持策略

只给 **当前主要版本（v2.x）** 打安全补丁。
v1 是历史快照，不再接受补丁（仍欢迎 PR，但不作为安全维护线）。

建议始终升级到最新 Release：
- [![Latest Release](https://img.shields.io/github/v/release/BAIYI0324/LinguaVerse?label=latest)](https://github.com/BAIYI0324/LinguaVerse/releases/latest)
