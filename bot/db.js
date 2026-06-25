import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const PROJECT_ID = parseInt(process.env.PROJECT_ID || "1", 10);

export function categorize(channelName) {
  const lc = (channelName || "").toLowerCase();
  const bugs = (process.env.BUGS_CHANNEL_KEYWORDS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const ideas = (process.env.IDEAS_CHANNEL_KEYWORDS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (bugs.some((k) => lc.includes(k))) return "bugs";
  if (ideas.some((k) => lc.includes(k))) return "ideas";
  return "general";
}

export async function upsertChannel(channel) {
  const cat = categorize(channel.name);
  await supabase.from("discord_channels").upsert(
    {
      project_id: PROJECT_ID,
      channel_id: channel.id,
      name: channel.name,
      type: channel.type === 2 ? "voice" : "text",
      category: cat,
      is_tracked: true,
    },
    { onConflict: "project_id,channel_id" }
  );
}

export async function upsertMember(member) {
  const accountCreated = new Date(
    Number((BigInt(member.id) >> 22n) + 1420070400000n)
  ).toISOString();
  await supabase.from("discord_members").upsert(
    {
      project_id: PROJECT_ID,
      user_id: member.id,
      username: member.user?.username ?? member.username ?? null,
      joined_at: member.joinedAt?.toISOString() ?? null,
      account_created_at: accountCreated,
    },
    { onConflict: "project_id,user_id" }
  );
}

export async function markMemberLeft(userId) {
  await supabase
    .from("discord_members")
    .update({ left_at: new Date().toISOString() })
    .eq("project_id", PROJECT_ID)
    .eq("user_id", userId);
}

export async function insertMessage(msg) {
  await supabase.from("discord_messages").upsert(
    {
      project_id: PROJECT_ID,
      message_id: msg.id,
      channel_id: msg.channelId,
      channel_name: msg.channel?.name ?? null,
      author_id: msg.author?.id ?? null,
      author_name: msg.author?.username ?? null,
      content: msg.content ?? "",
      created_at: msg.createdAt?.toISOString() ?? new Date().toISOString(),
      reaction_count: msg.reactions?.cache?.size ?? 0,
    },
    { onConflict: "message_id" }
  );
}
