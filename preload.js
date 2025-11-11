const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  login: () => ipcRenderer.invoke('msal-login'),
  getAccessToken: () => ipcRenderer.invoke('get-access-token'),
  logout: () => ipcRenderer.invoke('msal-logout'),
  onAuthSuccess: (callback) => ipcRenderer.on('auth-success', callback),
  onAuthError: (callback) => ipcRenderer.on('auth-error', (event, error) => callback(error))
});

