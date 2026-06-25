import "dotenv/config";
import { Client, GatewayIntentBits, Partials, Events, ChannelType } from "discord.js";
import {
  supabase,
  PROJECT_ID,
  upsertChannel,
  upsertMember,
  markMemberLeft,
  insertMessage,
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
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

function isTracked(channel) {
  if (TRACKED_CHANNEL_IDS.length === 0) return channel.type === ChannelType.GuildText;
  return TRACKED_CHANNEL_IDS.includes(channel.id);
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  const guild = await c.guilds.fetch(GUILD_ID);
  console.log(`Connected to: ${guild.name}`);

  const channels = await guild.channels.fetch();
  for (const [, ch] of channels) {
    if (!ch) continue;
    if (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice) {
      await upsertChannel(ch);
    }
  }
  console.log(`Synced ${channels.size} channels`);

  const members = await guild.members.fetch();
  for (const [, m] of members) {
    await upsertMember(m);
  }
  console.log(`Synced ${members.size} members`);
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

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing…");
  client.destroy();
  process.exit(0);
});

client.login(TOKEN);
