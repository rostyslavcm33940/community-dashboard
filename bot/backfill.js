import "dotenv/config";
import { Client, GatewayIntentBits, ChannelType } from "discord.js";
import { upsertChannel, upsertMember, insertMessage, recordSystemRun } from "./db.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TRACKED_CHANNEL_IDS = (process.env.TRACKED_CHANNEL_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const FETCH_BATCH = 100;
const MAX_PER_CHANNEL = parseInt(process.env.BACKFILL_LIMIT || "5000", 10);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", async (c) => {
  console.log(`Backfill logged in as ${c.user.tag}`);
  const guild = await c.guilds.fetch(GUILD_ID);

  const channels = await guild.channels.fetch();
  const tracked = (ch) => ch && (TRACKED_CHANNEL_IDS.length === 0 || TRACKED_CHANNEL_IDS.includes(ch.id));
  const textChannels = [...channels.values()].filter((ch) => ch?.type === ChannelType.GuildText && tracked(ch));
  const forumChannels = [...channels.values()].filter((ch) => ch?.type === ChannelType.GuildForum && tracked(ch));

  console.log(`Backfilling ${textChannels.length} text + ${forumChannels.length} forum channels (limit ${MAX_PER_CHANNEL}/channel)`);

  const members = await guild.members.fetch();
  for (const [, m] of members) await upsertMember(m);
  console.log(`Synced ${members.size} members`);

  async function backfillTextChannel(ch, channelNameOverride) {
    console.log(`-- #${channelNameOverride ?? ch.name}`);
    let before;
    let fetched = 0;
    while (fetched < MAX_PER_CHANNEL) {
      const batch = await ch.messages.fetch({ limit: FETCH_BATCH, before }).catch((e) => {
        console.warn(`  fetch failed: ${e.message}`);
        return null;
      });
      if (!batch || batch.size === 0) break;
      for (const [, m] of batch) await insertMessage(m, channelNameOverride);
      fetched += batch.size;
      before = batch.last()?.id;
      console.log(`  ${fetched} messages so far`);
      if (batch.size < FETCH_BATCH) break;
    }
  }

  for (const ch of textChannels) {
    await upsertChannel(ch);
    await backfillTextChannel(ch);
  }

  for (const ch of forumChannels) {
    await upsertChannel(ch);
    console.log(`== forum #${ch.name} — fetching threads`);
    const active = await ch.threads.fetchActive().catch(() => null);
    const archived = await ch.threads.fetchArchived({ limit: 100 }).catch(() => null);
    const threadList = [
      ...(active?.threads.values() ?? []),
      ...(archived?.threads.values() ?? []),
    ];
    console.log(`  ${threadList.length} threads in #${ch.name}`);
    for (const t of threadList) {
      await backfillTextChannel(t, ch.name);
    }
  }

  await recordSystemRun("discord_backfill");
  console.log("Backfill done.");
  client.destroy();
  process.exit(0);
});

client.login(TOKEN);
