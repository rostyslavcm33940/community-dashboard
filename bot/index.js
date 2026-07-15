import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Events, ChannelType } from "discord.js";
import {
  supabase,
  PROJECT_ID,
  upsertChannel,
  upsertMember,
  markMemberLeft,
  insertMessage,
  insertPresenceSnapshot,
} from "./db.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TRACKED_CHANNEL_IDS = (process.env.TRACKED_CHANNEL_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN is required");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

function isTracked(channel) {
  if (TRACKED_CHANNEL_IDS.length === 0) {
    return (
      channel.type === ChannelType.GuildText ||
      channel.type === ChannelType.GuildAnnouncement ||
      channel.type === ChannelType.PublicThread ||
      channel.type === ChannelType.PrivateThread ||
      channel.type === ChannelType.AnnouncementThread
    );
  }
  return TRACKED_CHANNEL_IDS.includes(channel.id) || TRACKED_CHANNEL_IDS.includes(channel.parentId);
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  const guild = await c.guilds.fetch(GUILD_ID);
  console.log(`Connected to: ${guild.name}`);
  await guild.roles.fetch();

  const channels = await guild.channels.fetch();
  for (const [, ch] of channels) {
    if (!ch) continue;
    if (
      ch.type === ChannelType.GuildText ||
      ch.type === ChannelType.GuildVoice ||
      ch.type === ChannelType.GuildForum ||
      ch.type === ChannelType.GuildAnnouncement
    ) {
      await upsertChannel(ch);
    }
  }
  console.log(`Synced ${channels.size} channels`);

  const members = await guild.members.fetch({ withPresences: true });
  for (const [, m] of members) {
    await upsertMember(m);
  }
  console.log(`Synced ${members.size} members (with presences)`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  console.log(`+ ${member.user.username}`);
  await upsertMember(member);
});

client.on(Events.GuildMemberRemove, async (member) => {
  console.log(`- ${member.user.username}`);
  await markMemberLeft(member.id);
});

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author?.bot) return;
  if (!msg.guild || msg.guildId !== GUILD_ID) return;
  if (!isTracked(msg.channel)) return;
  await insertMessage(msg);
});

client.on(Events.Error, (err) => console.error("Discord error:", err));

const SNAPSHOT_INTERVAL_MS = parseInt(process.env.PRESENCE_INTERVAL_MS || "300000", 10);

async function snapshotPresence() {
  try {
    const guild = client.guilds.cache.get(GUILD_ID) ?? (await client.guilds.fetch(GUILD_ID));
    const counts = { online: 0, idle: 0, dnd: 0, offline: 0, total: 0 };
    for (const [, m] of guild.members.cache) {
      if (m.user?.bot) continue;
      counts.total++;
      const status = m.presence?.status ?? "offline";
      if (status === "online") counts.online++;
      else if (status === "idle") counts.idle++;
      else if (status === "dnd") counts.dnd++;
      else counts.offline++;
    }
    if (counts.total === 0) {
      console.warn("Presence snapshot skipped: member cache empty");
      return;
    }
    await insertPresenceSnapshot(counts);
    console.log(`Presence snapshot: ${counts.online} online, ${counts.idle} idle, ${counts.dnd} dnd / ${counts.total} total`);
  } catch (e) {
    console.warn("Presence snapshot failed:", e.message);
  }
}

setInterval(snapshotPresence, SNAPSHOT_INTERVAL_MS);
setTimeout(snapshotPresence, 60_000);

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing…");
  client.destroy();
  process.exit(0);
});

client.login(TOKEN);
