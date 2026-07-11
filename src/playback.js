const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
  AudioPlayerStatus,
  getVoiceConnection,
  NoSubscriberBehavior,
} = require('@discordjs/voice');

async function joinChannel(guild, voiceChannel) {
  let connection = getVoiceConnection(guild.id);
  if (connection && connection.joinConfig.channelId === voiceChannel.id) {
    return connection;
  }

  if (connection) {
    connection.destroy();
  }

  connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
  } catch (err) {
    connection.destroy();
    throw new Error("Couldn't connect to that voice channel in time.");
  }

  return connection;
}

async function playSound(connection, sound) {
  const player = connection.player || createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
  });
  connection.player = player;
  connection.subscribe(player);

  const resource = createAudioResource(sound.path);
  player.play(resource);

  try {
    await entersState(player, AudioPlayerStatus.Playing, 5_000);
  } catch (err) {
    throw new Error(`Failed to play ${sound.name}.`);
  }

  return player;
}

function stopPlayback(guildId) {
  const connection = getVoiceConnection(guildId);
  if (!connection || !connection.player) return false;
  connection.player.stop();
  return true;
}

module.exports = { joinChannel, playSound, stopPlayback };
