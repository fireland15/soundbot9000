const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('soundboard', {
  getSounds: () => ipcRenderer.invoke('get-sounds'),
  playSound: (name) => ipcRenderer.invoke('play-sound', name),
  stopSound: () => ipcRenderer.invoke('stop-sound'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (patch) => ipcRenderer.invoke('set-config', patch),
  getLockState: () => ipcRenderer.invoke('get-lock-state'),
  onLockState: (cb) => ipcRenderer.on('lock-state', (event, locked) => cb(locked)),
  onSoundPlayed: (cb) => ipcRenderer.on('sound-played', (event, name) => cb(name)),
  onSoundError: (cb) => ipcRenderer.on('sound-error', (event, payload) => cb(payload)),
});
