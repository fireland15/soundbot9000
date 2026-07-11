let config = null;

const apiUrlEl = document.getElementById('apiUrl');
const apiKeyEl = document.getElementById('apiKey');
const guildIdEl = document.getElementById('guildId');
const channelIdEl = document.getElementById('channelId');
const statusEl = document.getElementById('status');
const soundsListEl = document.getElementById('sounds-list');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#f04747' : '#43b581';
}

function acceleratorFromEvent(e) {
  const parts = [];
  if (e.ctrlKey) parts.push('Control');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Super');

  const key = e.key;
  const ignoreKeys = ['Control', 'Alt', 'Shift', 'Meta'];
  if (ignoreKeys.includes(key)) return null; // still waiting for a non-modifier key
  if (parts.length === 0) return null; // require at least one modifier

  let keyName;
  if (/^[a-zA-Z0-9]$/.test(key)) {
    keyName = key.toUpperCase();
  } else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(key)) {
    keyName = key;
  } else {
    const map = {
      ' ': 'Space',
      ArrowUp: 'Up',
      ArrowDown: 'Down',
      ArrowLeft: 'Left',
      ArrowRight: 'Right',
      Escape: 'Esc',
      '`': '`',
      '-': '-',
      '=': '=',
      '[': '[',
      ']': ']',
      ';': ';',
      "'": "'",
      ',': ',',
      '.': '.',
      '/': '/',
    };
    keyName = map[key];
  }

  if (!keyName) return null;
  parts.push(keyName);
  return parts.join('+');
}

function bindCapture(el, onCapture) {
  el.addEventListener('click', () => {
    document.querySelectorAll('.hotkey-capture.capturing').forEach((n) => n.classList.remove('capturing'));
    el.classList.add('capturing');
    const originalText = el.dataset.value || 'click to set';
    el.textContent = 'press keys...';

    function handleKey(e) {
      e.preventDefault();
      const accel = acceleratorFromEvent(e);
      if (!accel) return; // wait for a full combo
      cleanup();
      el.dataset.value = accel;
      el.textContent = accel;
      onCapture(accel);
    }

    function handleBlur() {
      cleanup();
      el.textContent = el.dataset.value || originalText;
    }

    function cleanup() {
      el.classList.remove('capturing');
      document.removeEventListener('keydown', handleKey, true);
      window.removeEventListener('blur', handleBlur);
    }

    document.addEventListener('keydown', handleKey, true);
    window.addEventListener('blur', handleBlur, { once: true });
  });
}

async function load() {
  config = await window.soundboard.getConfig();
  apiUrlEl.value = config.apiUrl || '';
  apiKeyEl.value = config.apiKey || '';
  guildIdEl.value = config.guildId || '';
  channelIdEl.value = config.channelId || '';

  const overlayCapture = document.querySelector('[data-target="toggleOverlayHotkey"]');
  overlayCapture.dataset.value = config.toggleOverlayHotkey || '';
  overlayCapture.textContent = config.toggleOverlayHotkey || 'click to set';
  bindCapture(overlayCapture, (accel) => window.soundboard.setConfig({ toggleOverlayHotkey: accel }));

  const lockCapture = document.querySelector('[data-target="toggleLockHotkey"]');
  lockCapture.dataset.value = config.toggleLockHotkey || '';
  lockCapture.textContent = config.toggleLockHotkey || 'click to set';
  bindCapture(lockCapture, (accel) => window.soundboard.setConfig({ toggleLockHotkey: accel }));

  await loadSounds();
}

async function loadSounds() {
  soundsListEl.innerHTML = '<div class="sound-row">Loading sounds...</div>';
  let sounds;
  try {
    sounds = await window.soundboard.getSounds();
  } catch (err) {
    soundsListEl.innerHTML = `<div class="sound-row">Couldn't load sounds: ${err.message}</div>`;
    return;
  }

  if (sounds.length === 0) {
    soundsListEl.innerHTML = '<div class="sound-row">No sounds yet — add some with /add in Discord.</div>';
    return;
  }

  const hotkeys = { ...(config.hotkeys || {}) };
  soundsListEl.innerHTML = '';

  for (const sound of sounds) {
    const row = document.createElement('div');
    row.className = 'sound-row';

    const label = document.createElement('span');
    label.textContent = sound.name;

    const capture = document.createElement('div');
    capture.className = 'hotkey-capture';
    capture.dataset.value = hotkeys[sound.name] || '';
    capture.textContent = hotkeys[sound.name] || 'click to set';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-btn';
    clearBtn.textContent = 'clear';
    clearBtn.addEventListener('click', async () => {
      hotkeys[sound.name] = undefined;
      capture.dataset.value = '';
      capture.textContent = 'click to set';
      config = await window.soundboard.setConfig({ hotkeys: { ...hotkeys } });
    });

    bindCapture(capture, async (accel) => {
      hotkeys[sound.name] = accel;
      config = await window.soundboard.setConfig({ hotkeys: { ...hotkeys } });
    });

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.appendChild(capture);
    right.appendChild(clearBtn);

    row.appendChild(label);
    row.appendChild(right);
    soundsListEl.appendChild(row);
  }
}

document.getElementById('save-connection').addEventListener('click', async () => {
  config = await window.soundboard.setConfig({
    apiUrl: apiUrlEl.value.trim().replace(/\/+$/, ''),
    apiKey: apiKeyEl.value.trim(),
    guildId: guildIdEl.value.trim(),
    channelId: channelIdEl.value.trim(),
  });
  setStatus('Saved.');
  await loadSounds();
});

document.getElementById('test-connection').addEventListener('click', async () => {
  setStatus('Testing...');
  try {
    const sounds = await window.soundboard.getSounds();
    setStatus(`Connected — found ${sounds.length} sound(s).`);
  } catch (err) {
    setStatus(`Failed: ${err.message}`, true);
  }
});

load();
