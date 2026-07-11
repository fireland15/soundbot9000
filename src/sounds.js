const fs = require('fs');
const path = require('path');

const SOUNDS_DIR = path.join(__dirname, '..', 'sounds');
const ALLOWED_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.webm']);
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB, generous for short clips

if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

function sanitizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function listSounds() {
  return fs
    .readdirSync(SOUNDS_DIR)
    .filter((f) => ALLOWED_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .map((f) => ({
      name: path.basename(f, path.extname(f)),
      file: f,
      path: path.join(SOUNDS_DIR, f),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function findSound(name) {
  return listSounds().find((s) => s.name === sanitizeName(name));
}

function soundExists(name) {
  return Boolean(findSound(name));
}

function removeSound(name) {
  const sound = findSound(name);
  if (!sound) return false;
  fs.unlinkSync(sound.path);
  return true;
}

module.exports = {
  SOUNDS_DIR,
  ALLOWED_EXTENSIONS,
  MAX_FILE_BYTES,
  sanitizeName,
  listSounds,
  findSound,
  soundExists,
  removeSound,
};
