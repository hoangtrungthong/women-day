const { contextBridge, ipcRenderer } = require('electron');

// Chỉ phơi ra đúng những gì trang web cần, không mở cửa cho Node
contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  platform: process.platform,
  toggleFullScreen: () => ipcRenderer.invoke('app:toggleFullScreen')
});
