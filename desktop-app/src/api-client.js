const store = require('./config');

async function request(path, options = {}) {
  const apiUrl = store.get('apiUrl');
  const apiKey = store.get('apiKey');

  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

function getSounds() {
  return request('/sounds');
}

function playSound(name) {
  const guildId = store.get('guildId');
  const channelId = store.get('channelId');
  return request('/play', {
    method: 'POST',
    body: JSON.stringify({
      name,
      ...(guildId ? { guildId } : {}),
      ...(channelId ? { channelId } : {}),
    }),
  });
}

function stopSound() {
  const guildId = store.get('guildId');
  return request('/stop', {
    method: 'POST',
    body: JSON.stringify({ ...(guildId ? { guildId } : {}) }),
  });
}

module.exports = { getSounds, playSound, stopSound };
