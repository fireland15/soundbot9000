const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { SOUNDS_DIR, ALLOWED_EXTENSIONS, MAX_FILE_BYTES, sanitizeName, soundExists } = require('../src/sounds');

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a new sound to the soundboard')
    .addAttachmentOption((option) =>
      option.setName('file').setDescription('Audio file (mp3, wav, ogg, m4a, flac, webm)').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('name').setDescription('Name to play the sound by (defaults to the filename)').setRequired(false)
    ),

  async execute(interaction) {
    const attachment = interaction.options.getAttachment('file', true);
    const rawName = interaction.options.getString('name') || path.basename(attachment.name, path.extname(attachment.name));
    const name = sanitizeName(rawName);
    const ext = path.extname(attachment.name).toLowerCase();

    if (!name) {
      await interaction.reply({ content: 'That name is invalid once cleaned up. Try letters, numbers, and dashes.', ephemeral: true });
      return;
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      await interaction.reply({
        content: `Unsupported file type \`${ext || 'unknown'}\`. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
        ephemeral: true,
      });
      return;
    }

    if (attachment.size > MAX_FILE_BYTES) {
      await interaction.reply({
        content: `That file is too big (${(attachment.size / 1024 / 1024).toFixed(1)}MB). Max is ${MAX_FILE_BYTES / 1024 / 1024}MB.`,
        ephemeral: true,
      });
      return;
    }

    if (soundExists(name)) {
      await interaction.reply({ content: `A sound named \`${name}\` already exists. Remove it first or pick a different name.`, ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const destPath = path.join(SOUNDS_DIR, `${name}${ext}`);
    try {
      await download(attachment.url, destPath);
    } catch (err) {
      await interaction.editReply(`Failed to download that file: ${err.message}`);
      return;
    }

    await interaction.editReply(`Added \`${name}\` — play it with \`/play sound:${name}\``);
  },
};
