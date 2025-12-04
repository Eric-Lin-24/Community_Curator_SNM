const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Microsoft OAuth
  login: () => ipcRenderer.invoke('msal-login'),
  getAccessToken: () => ipcRenderer.invoke('get-access-token'),
  logout: () => ipcRenderer.invoke('msal-logout'),
  onAuthSuccess: (callback) => ipcRenderer.on('auth-success', callback),
  onAuthError: (callback) => ipcRenderer.on('auth-error', (event, error) => callback(error)),

  // Google OAuth
  googleLogin: () => ipcRenderer.invoke('google-login'),
  getGoogleAccessToken: () => ipcRenderer.invoke('get-google-access-token'),
  getGoogleUserInfo: () => ipcRenderer.invoke('get-google-user-info'),
  getGoogleDriveFiles: () => ipcRenderer.invoke('get-google-drive-files'),
  googleLogout: () => ipcRenderer.invoke('google-logout'),
  onGoogleAuthSuccess: (callback) => ipcRenderer.on('google-auth-success', (event, data) => callback(data)),
  onGoogleAuthError: (callback) => ipcRenderer.on('google-auth-error', (event, error) => callback(error))
});
