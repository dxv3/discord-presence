require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { Client, IntentsBitField } = require('discord.js');
const express = require('express');
const cors = require('cors');

const TOKEN    = process.env.DISCORD_TOKEN;
const USER_ID  = process.env.DISCORD_USER_ID  || '541388135712423936';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1088461749902118956';
const PORT     = process.env.PORT || 3000;

// ── In-memory presence cache ──────────────────────────────────────────────────

let presenceCache = {
  status: 'offline',
  user: null,
  activity: {
    name: null,
    type: null,
    details: null,
    state: null,
    createdTimestamp: null,
  },
  updatedAt: new Date().toISOString(),
};

function buildPresence(presence) {
  const activity = presence?.activities?.[0] ?? null;
  return {
    status: presence?.status ?? 'offline',
    user: presence?.user?.tag ?? presence?.userId ?? USER_ID,
    activity: {
      name:             activity?.name             ?? null,
      type:             activity?.type             ?? null,
      details:          activity?.details          ?? null,
      state:            activity?.state            ?? null,
      createdTimestamp: activity?.createdTimestamp ?? null,
    },
    updatedAt: new Date().toISOString(),
  };
}

// ── Discord client ────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildPresences,
  ],
});

client.on('ready', async () => {
  console.log(`[discord] Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) {
    console.error(`[discord] Guild ${GUILD_ID} not found.`);
    return;
  }

  // Populate member/presence cache
  await guild.members.fetch();
  console.log(`[discord] Fetched ${guild.memberCount} members.`);

  // Seed cache from current presence
  const initial = guild.presences.cache.get(USER_ID);
  presenceCache = buildPresence(initial);

  // Fallback polling every 5 s (in case presenceUpdate is missed)
  setInterval(() => {
    const presence = guild.presences.cache.get(USER_ID);
    presenceCache = buildPresence(presence);
  }, 5000);
});

// Primary event — fires immediately on any presence change
client.on('presenceUpdate', (_oldPresence, newPresence) => {
  if (newPresence?.userId !== USER_ID) return;
  presenceCache = buildPresence(newPresence);
  console.log(`[discord] presence updated → ${presenceCache.status}`);
});

client.login(TOKEN);

// ── Express API ───────────────────────────────────────────────────────────────

const app = express();
app.use(cors());

app.get('/presence', (_req, res) => {
  res.json(presenceCache);
});

// Health check for Render / Railway
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[api] Listening on http://localhost:${PORT}`);
});
