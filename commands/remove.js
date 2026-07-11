const { SlashCommandBuilder } = require('discord.js');
const { listSounds, removeSound } = require('../src/sounds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a sound from the soundboard')
    .addStringOption((option) =>
      option.setName('sound').setDescription('Which sound to remove').setRequired(true).setAutocomplete(true)
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
    const name = interaction.options.getString('sound', true);
    const removed = removeSound(name);

    if (!removed) {
      await interaction.reply({ content: `No sound found named \`${name}\`.`, ephemeral: true });
      return;
    }

    await interaction.reply(`Removed \`${name}\`.`);
  },
};
