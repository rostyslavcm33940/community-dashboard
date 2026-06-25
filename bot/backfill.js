import "dotenv/config";
import { Client, GatewayIntentBits, ChannelType } from "discord.js";
import { upsertChannel, upsertMember, insertMessage } from "./db.js";

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
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", async (c) => {
  console.log(`Backfill logged in as ${c.user.tag}`);
  const guild = await c.guilds.fetch(GUILD_ID);

  const channels = await guild.channels.fetch();
  const textChannels = [...channels.values()].filter(
    (ch) =>
      ch &&
      ch.type === ChannelType.GuildText &&
      (TRACKED_CHANNEL_IDS.length === 0 || TRACKED_CHANNEL_IDS.includes(ch.id))
  );

  console.log(`Backfilling ${textChannels.length} channels (limit ${MAX_PER_CHANNEL}/channel)`);

  const members = await guild.members.fetch();
  for (const [, m] of members) await upsertMember(m);
  console.log(`Synced ${members.size} members`);

  for (const ch of textChannels) {
    await upsertChannel(ch);
    console.log(`-- #${ch.name}`);
    let before;
    let fetched = 0;
    while (fetched < MAX_PER_CHANNEL) {
      const batch = await ch.messages.fetch({ limit: FETCH_BATCH, before }).catch((e) => {
        console.warn(`  fetch failed: ${e.message}`);
        return null;
      });
      if (!batch || batch.size === 0) break;
      for (const [, m] of batch) await insertMessage(m);
      fetched += batch.size;
      before = batch.last()?.id;
      console.log(`  ${fetched} messages so far`);
      if (batch.size < FETCH_BATCH) break;
    }
  }

  console.log("Backfill done.");
  client.destroy();
  process.exit(0);
});

client.login(TOKEN);
