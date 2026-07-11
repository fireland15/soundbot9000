const express = require('express');
const { listSounds, findSound } = require('./sounds');
const { joinChannel, playSound, stopPlayback } = require('./playback');
const { getVoiceConnection } = require('@discordjs/voice');

function startApi(client) {
  const apiKey = process.env.API_KEY;
  const port = Number(process.env.API_PORT) || 3939;
  const host = process.env.API_HOST || '0.0.0.0';
  const guildId = process.env.GUILD_ID;
  const defaultChannelId = process.env.VOICE_CHANNEL_ID;

  if (!apiKey) {
    console.warn('API_KEY not set in .env — the control API will not start. See .env.example.');
    return;
  }

  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    if (req.get('x-api-key') !== apiKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  });

  async function resolveGuild(req) {
    const id = req.body?.guildId || guildId;
    if (!id) throw Object.assign(new Error('No guildId provided and GUILD_ID is not set in .env'), { status: 400 });
    const guild = client.guilds.cache.get(id) || (await client.guilds.fetch(id).catch(() => null));
    if (!guild) throw Object.assign(new Error(`Bot is not in guild ${id}`), { status: 404 });
    return guild;
  }

  async function resolveVoiceChannel(req, guild) {
    const id = req.body?.channelId || defaultChannelId;
    if (!id) {
      throw Object.assign(
        new Error('No channelId provided and VOICE_CHANNEL_ID is not set in .env'),
        { status: 400 }
      );
    }
    const channel = guild.channels.cache.get(id) || (await guild.channels.fetch(id).catch(() => null));
    if (!channel || !channel.isVoiceBased()) {
      throw Object.assign(new Error(`${id} is not a valid voice channel in this guild`), { status: 404 });
    }
    return channel;
  }

  app.get('/sounds', (req, res) => {
    res.json(listSounds().map((s) => ({ name: s.name })));
  });

  app.get('/status', async (req, res, next) => {
    try {
      const guild = await resolveGuild(req);
      const connection = getVoiceConnection(guild.id);
      res.json({
        connected: Boolean(connection),
        channelId: connection?.joinConfig?.channelId ?? null,
        playing: connection?.player?.state?.status === 'playing',
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/join', async (req, res, next) => {
    try {
      const guild = await resolveGuild(req);
      const channel = await resolveVoiceChannel(req, guild);
      await joinChannel(guild, channel);
      res.json({ ok: true, channelId: channel.id });
    } catch (err) {
      next(err);
    }
  });

  app.post('/play', async (req, res, next) => {
    try {
      const { name } = req.body || {};
      if (!name) throw Object.assign(new Error('Missing "name" in request body'), { status: 400 });

      const sound = findSound(name);
      if (!sound) throw Object.assign(new Error(`No sound found named "${name}"`), { status: 404 });

      const guild = await resolveGuild(req);
      const channel = await resolveVoiceChannel(req, guild);
      const connection = await joinChannel(guild, channel);
      await playSound(connection, sound);

      res.json({ ok: true, playing: sound.name });
    } catch (err) {
      next(err);
    }
  });

  app.post('/stop', async (req, res, next) => {
    try {
      const guild = await resolveGuild(req);
      const stopped = stopPlayback(guild.id);
      res.json({ ok: true, stopped });
    } catch (err) {
      next(err);
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  });

  app.listen(port, host, () => {
    console.log(`Control API listening on http://${host}:${port}`);
  });
}

module.exports = { startApi };
