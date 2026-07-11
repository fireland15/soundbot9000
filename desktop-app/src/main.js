const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const store = require('./config');
const api = require('./api-client');

let overlayWindow = null;
let settingsWindow = null;
let tray = null;
let overlayLocked = true; // locked = click-through, so it doesn't block game input

function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 420,
    height: 560,
    x: width - 440,
    y: 80,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function toggleOverlay() {
  if (!overlayWindow) return;
  if (overlayWindow.isVisible()) {
    overlayWindow.hide();
  } else {
    overlayWindow.show();
  }
}

function setOverlayLocked(locked) {
  overlayLocked = locked;
  if (!overlayWindow) return;
  overlayWindow.setIgnoreMouseEvents(locked, { forward: true });
  overlayWindow.webContents.send('lock-state', overlayLocked);
}

function toggleLock() {
  setOverlayLocked(!overlayLocked);
  if (!overlayLocked && overlayWindow && !overlayWindow.isVisible()) {
    overlayWindow.show();
  }
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 560,
    height: 640,
    title: 'Soundboard Overlay Settings',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function registerHotkeys() {
  globalShortcut.unregisterAll();

  const toggleOverlayHotkey = store.get('toggleOverlayHotkey');
  const toggleLockHotkey = store.get('toggleLockHotkey');
  const hotkeys = store.get('hotkeys') || {};

  if (toggleOverlayHotkey) {
    globalShortcut.register(toggleOverlayHotkey, toggleOverlay);
  }
  if (toggleLockHotkey) {
    globalShortcut.register(toggleLockHotkey, toggleLock);
  }

  for (const [soundName, accelerator] of Object.entries(hotkeys)) {
    if (!accelerator) continue;
    globalShortcut.register(accelerator, async () => {
      try {
        await api.playSound(soundName);
        overlayWindow?.webContents.send('sound-played', soundName);
      } catch (err) {
        overlayWindow?.webContents.send('sound-error', { name: soundName, message: err.message });
      }
    });
  }
}

function createTray() {
  tray = new Tray(path.join(__dirname, '..', 'assets', 'icon.png'));
  tray.setToolTip('Soundboard Overlay');
  const menu = Menu.buildFromTemplate([
    { label: 'Show/Hide Overlay', click: toggleOverlay },
    { label: 'Lock/Unlock Overlay', click: toggleLock },
    { label: 'Settings...', click: createSettingsWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', toggleOverlay);
}

app.whenReady().then(() => {
  createTray();
  createOverlayWindow();
  registerHotkeys();
  overlayWindow.once('ready-to-show', () => overlayWindow.show());
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', (e) => {
  // Keep running in the tray even with no windows open.
  e.preventDefault?.();
});

ipcMain.handle('get-sounds', async () => api.getSounds());
ipcMain.handle('play-sound', async (event, name) => api.playSound(name));
ipcMain.handle('stop-sound', async () => api.stopSound());
ipcMain.handle('get-config', () => store.store);
ipcMain.handle('set-config', (event, patch) => {
  for (const [key, value] of Object.entries(patch)) {
    store.set(key, value);
  }
  registerHotkeys();
  return store.store;
});
ipcMain.handle('get-lock-state', () => overlayLocked);
