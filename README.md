# Discord Soundboard

A Discord bot that plays sound clips into a voice channel on command. Add as
many sounds as you want, no code changes needed.

## Commands

- `/play sound:<name>` — joins your current voice channel and plays a sound (autocompletes as you type)
- `/add file:<attachment> name:<optional>` — upload an audio file to add it to the board
- `/list` — show all available sounds
- `/remove sound:<name>` — delete a sound
- `/stop` — stop whatever's currently playing
- `/leave` — disconnect the bot from voice

Supported formats: mp3, wav, ogg, m4a, flac, webm. Max upload size: 15MB.

## Setup

### 1. Create the bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. Under **Bot**, click "Reset Token" to get your bot token, and enable it if it isn't already.
3. Still under **Bot**, you don't need any privileged gateway intents for this bot.
4. Under **OAuth2 > URL Generator**, check the `bot` and `applications.commands` scopes, then under bot permissions check `Connect`, `Speak`, and `Send Messages`. Open the generated URL to invite the bot to your server.
5. Copy the **Application ID** from "General Information" — that's your `CLIENT_ID`.

### 2. Configure

```bash
cp .env.example .env
```

Fill in `.env`:

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-server-id   # optional but recommended while testing — commands register instantly
```

To get your server ID: enable Developer Mode in Discord (User Settings > Advanced), then right-click your server icon and "Copy Server ID".

### 3. Install and run

```bash
npm install
npm run deploy-commands   # registers the slash commands with Discord
npm start                 # starts the bot
```

Keep the process running (e.g. with `pm2`, a systemd service, or a `screen`/`tmux` session) so the bot stays online.

### 4. Add sounds

Either drop audio files directly into the `sounds/` folder, or use `/add`
in Discord to upload one. The filename (minus extension) becomes the sound's
name unless you override it with the `name` option.

If you add files directly to `sounds/` while the bot is running, they show up
immediately — no restart needed.

## Notes

- If you switch to global commands (no `GUILD_ID` set), it can take up to an hour for Discord to propagate them to all servers.
- The bot needs `Connect` and `Speak` permissions in whatever voice channel you want it to join.

## Running with Docker

Build the image:

```bash
docker build -t soundbot9000 .
```

Run it, mounting `sounds/` so your clips persist outside the container and
survive rebuilds:

```bash
docker run -d \
  --name soundbot9000 \
  --env-file .env \
  -p 3939:3939 \
  -v "$(pwd)/sounds:/app/sounds" \
  soundbot9000
```

- `--env-file .env` passes `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, and the
  `API_*`/`VOICE_CHANNEL_ID` vars from the [desktop overlay setup](#desktop-overlay--hotkeys-windows) below.
- `-p 3939:3939` only matters if you're using the control API from the
  desktop app — drop it if you're not.
- Command deployment (`npm run deploy-commands`) still needs to be run once,
  either from your host machine or inside the container:
  ```bash
  docker run --rm --env-file .env soundbot9000 node src/deploy-commands.js
  ```

The image runs as a non-root user and doesn't require system `ffmpeg` —
`ffmpeg-static` bundles a static binary via npm.

## Desktop overlay + hotkeys (Windows)

There's a companion Windows app in [`desktop-app/`](desktop-app) that gives you
a click-through, always-on-top overlay and global hotkeys to fire sounds
while you're in a game — it talks to the bot over a small local HTTP API,
so the bot still does the actual joining/playing in Discord.

### 1. Enable the bot's control API

In the bot's `.env` (this is the same `.env` from the section above), set:

```
API_KEY=<a random secret — see the comment above it in .env.example>
API_PORT=3939
API_HOST=127.0.0.1        # or 0.0.0.0 if the desktop app runs on a different machine
VOICE_CHANNEL_ID=<the voice channel the bot should join automatically>
```

Restart the bot (`npm start`). You should see `Control API listening on
http://127.0.0.1:3939` in the console. `GUILD_ID` (already set earlier for
command deployment) is reused as the default server for API calls.

If the desktop app will run on a different PC than the bot, set `API_HOST=0.0.0.0`
and make sure port `API_PORT` is reachable from that PC (same LAN, firewall
allows it). Keep `API_KEY` secret either way — anyone with it can make the
bot play sounds.

### 2. Run the desktop app

```bash
cd desktop-app
npm install
npm start
```

A tray icon appears (bottom-right on Windows). Right-click it → **Settings**
to enter:
- **Bot API URL** — `http://127.0.0.1:3939` (or the bot machine's LAN IP if remote)
- **API key** — the same `API_KEY` from the bot's `.env`
- Optionally override guild/channel IDs per-app instead of relying on the bot's defaults

Sounds pulled from the bot show up in the settings list — click a sound's
hotkey box and press a key combo (must include a modifier like Ctrl/Alt/Shift)
to bind it. Bindings save immediately and register as global hotkeys, so they
work even while a game has focus.

### 3. Using it in-game

- Default **Ctrl+Alt+O** toggles the overlay panel on/off.
- Default **Ctrl+Alt+L** toggles lock: locked (default) makes the overlay
  click-through so it never intercepts game input — use this mode with your
  hotkeys. Unlock it when you want to click sounds directly with your mouse.
- Both of these hotkeys are rebindable in Settings the same way as sound hotkeys.

### 4. Building a standalone .exe

```bash
cd desktop-app
npm run dist
```

Produces an NSIS installer under `desktop-app/dist/`.
