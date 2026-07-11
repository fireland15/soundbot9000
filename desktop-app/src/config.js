const Store = require('electron-store');

const store = new Store({
  name: 'config',
  defaults: {
    apiUrl: 'http://127.0.0.1:3939',
    apiKey: '',
    guildId: '',
    channelId: '',
    toggleOverlayHotkey: 'CommandOrControl+Alt+O',
    toggleLockHotkey: 'CommandOrControl+Alt+L',
    hotkeys: {}, // { [soundName]: accelerator }
  },
});

module.exports = store;
