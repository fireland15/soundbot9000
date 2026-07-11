const { SlashCommandBuilder } = require('discord.js');
const { stopPlayback } = require('../src/playback');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop the currently playing sound'),

  async execute(interaction) {
    const stopped = stopPlayback(interaction.guild.id);

    if (!stopped) {
      await interaction.reply({ content: 'Nothing is playing.', ephemeral: true });
      return;
    }

    await interaction.reply('Stopped.');
  },
};
