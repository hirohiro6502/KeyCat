// Steam 向け:HTML 版をそのまま Electron で包む
// 起動: npm install → npm start   配布用: npm run dist:win など
// Steamworks(実績など)を足すときは steamworks.js などをここで読み込む。
'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;
function create() {
  win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 640, minHeight: 360,
    fullscreen: true, backgroundColor: '#000000', autoHideMenuBar: true,
    title: 'Puzz Nyan Quest 2',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  win.setMenu(null);
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  // F11 で全画面の切り替え
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}
ipcMain.on('quit', () => app.quit());
ipcMain.on('toggle-fullscreen', () => win && win.setFullScreen(!win.isFullScreen()));
ipcMain.on('is-fullscreen', e => { e.returnValue = !!(win && win.isFullScreen()); });
// 音を最初のクリックなしで鳴らせるように
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
