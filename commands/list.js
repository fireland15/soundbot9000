const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { listSounds } = require('../src/sounds');

module.exports = {
  data: new SlashCommandBuilder().setName('list').setDescription('List all available sounds'),

  async execute(interaction) {
    const sounds = listSounds();

    if (sounds.length === 0) {
      await interaction.reply({ content: 'No sounds yet. Add one with `/add`!', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔊 Soundboard (${sounds.length})`)
      .setDescription(sounds.map((s) => `\`${s.name}\``).join(', '))
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed] });
  },
};
