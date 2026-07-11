const grid = document.getElementById('grid');
const statusDot = document.getElementById('status-dot');
const lockLabel = document.getElementById('lock-label');

let config = null;

async function refreshSounds() {
  config = await window.soundboard.getConfig();
  const hotkeys = config.hotkeys || {};

  let sounds = [];
  try {
    sounds = await window.soundboard.getSounds();
  } catch (err) {
    grid.innerHTML = `<div id="empty">Can't reach the bot API.<br>${escapeHtml(err.message)}<br>Check Settings.</div>`;
    return;
  }

  if (sounds.length === 0) {
    grid.innerHTML = '<div id="empty">No sounds yet. Add some with /add in Discord.</div>';
    return;
  }

  grid.innerHTML = '';
  for (const sound of sounds) {
    const btn = document.createElement('div');
    btn.className = 'sound-btn';
    btn.dataset.name = sound.name;
    const hotkey = hotkeys[sound.name];
    btn.innerHTML = `${escapeHtml(sound.name)}${hotkey ? `<span class="hotkey">${escapeHtml(hotkey)}</span>` : ''}`;
    btn.addEventListener('click', () => trigger(sound.name, btn));
    grid.appendChild(btn);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function trigger(name, btnEl) {
  try {
    await window.soundboard.playSound(name);
    flash(name, 'playing');
  } catch (err) {
    flash(name, 'error');
  }
}

function flash(name, cls) {
  const btn = grid.querySelector(`[data-name="${CSS.escape(name)}"]`);
  if (!btn) return;
  btn.classList.add(cls);
  setTimeout(() => btn.classList.remove(cls), 500);
}

window.soundboard.onLockState((locked) => {
  statusDot.classList.toggle('unlocked', !locked);
  lockLabel.textContent = locked ? 'locked' : 'unlocked (click to play)';
});

window.soundboard.onSoundPlayed((name) => flash(name, 'playing'));
window.soundboard.onSoundError(({ name }) => flash(name, 'error'));

window.soundboard.getLockState().then((locked) => {
  statusDot.classList.toggle('unlocked', !locked);
  lockLabel.textContent = locked ? 'locked' : 'unlocked (click to play)';
});

refreshSounds();
setInterval(refreshSounds, 15000);
