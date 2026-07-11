const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder().setName('leave').setDescription('Disconnect the bot from voice'),

  async execute(interaction) {
    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      await interaction.reply({ content: 'I\'m not in a voice channel.', ephemeral: true });
      return;
    }

    connection.destroy();
    await interaction.reply('Disconnected.');
  },
};
