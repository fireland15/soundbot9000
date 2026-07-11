const { SlashCommandBuilder } = require('discord.js');
const { listSounds, findSound } = require('../src/sounds');
const { joinChannel, playSound } = require('../src/playback');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a sound in your current voice channel')
    .addStringOption((option) =>
      option
        .setName('sound')
        .setDescription('Which sound to play')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const matches = listSounds()
      .filter((s) => s.name.includes(focused))
      .slice(0, 25)
      .map((s) => ({ name: s.name, value: s.name }));
    await interaction.respond(matches);
  },

  async execute(interaction) {
    const soundName = interaction.options.getString('sound', true);
    const sound = findSound(soundName);

    if (!sound) {
      await interaction.reply({ content: `No sound found named \`${soundName}\`.`, ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({ content: 'Join a voice channel first!', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    let connection;
    try {
      connection = await joinChannel(interaction.guild, voiceChannel);
    } catch (err) {
      await interaction.editReply(err.message);
      return;
    }

    try {
      await playSound(connection, sound);
    } catch (err) {
      await interaction.editReply(err.message);
      return;
    }

    await interaction.editReply(`Playing \`${sound.name}\` in **${voiceChannel.name}**`);
  },
};
