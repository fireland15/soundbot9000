require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in .env — see .env.example');
  process.exit(1);
}

const commandsDir = path.join(__dirname, '..', 'commands');
const commands = fs
  .readdirSync(commandsDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => require(path.join(commandsDir, f)).data.toJSON());

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    const route = GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);

    const scope = GUILD_ID ? `guild ${GUILD_ID}` : 'globally';
    console.log(`Registering ${commands.length} command(s) ${scope}...`);

    await rest.put(route, { body: commands });

    console.log('Done.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
