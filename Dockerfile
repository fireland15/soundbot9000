# --- deps stage: install node_modules (may need to build the @discordjs/opus native addon) ---
FROM node:22-bookworm-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- runtime stage: slim image with just what's needed to run the bot ---
FROM node:22-bookworm-slim AS runtime

RUN useradd --system --create-home --uid 1001 bot
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY commands ./commands
COPY src ./src

RUN mkdir -p /app/sounds && chown -R bot:bot /app
VOLUME ["/app/sounds"]

USER bot
EXPOSE 3939

CMD ["node", "src/index.js"]
