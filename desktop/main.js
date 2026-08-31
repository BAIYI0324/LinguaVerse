/* 语界 LinguaVerse · Windows 桌面版主进程
 * Windows 11 Fluent Design:
 *  - 自定义标题栏 (titleBarOverlay 保留系统窗口控件, Win11 应用标准做法)
 *  - 圆角窗口 + Mica 质感由 CSS 层 (desktop.css) 实现
 */
const { app, BrowserWindow, shell, nativeTheme } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 860,
    minHeight: 600,
    show: false,
    backgroundColor: '#f6f7fb',
    title: '语界 LinguaVerse',
    // Win11 风格: 隐藏系统标题栏 + 覆盖层保留 最小化/最大化/关闭 按钮
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#1b1b1b',
      height: 44
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  win.once('ready-to-show', () => win.show());

  // 桌面标记 + 主题色注入到渲染层
  win.webContents.on('did-finish-load', () => {
    try {
      win.webContents.executeJavaScript(`
        window.IS_DESKTOP = true;
        window.DESKTOP_THEME = ${JSON.stringify(nativeTheme.shouldUseDarkColors ? 'dark' : 'light')};
        if (!document.documentElement.classList.contains('desktop')) {
          document.documentElement.classList.add('desktop');
        }
      `).catch(()=>{});
    } catch(_) {}
  });

  // 外链走系统浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
