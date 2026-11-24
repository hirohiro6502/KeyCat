'use strict';
const { contextBridge, ipcRenderer } = require('electron');
// ゲーム側からは window.pq2Native として使う(ブラウザ版では無い)
contextBridge.exposeInMainWorld('pq2Native', {
  quit: () => ipcRenderer.send('quit'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.sendSync('is-fullscreen'),
});
