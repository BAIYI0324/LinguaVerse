/* 语界 LinguaVerse · 桌面版 preload
 * 在页面脚本执行前注入 IS_DESKTOP 标记, 让 index.html 能加载 desktop.css
 */
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('IS_DESKTOP', true);
