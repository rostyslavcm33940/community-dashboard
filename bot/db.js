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
  const user = member.user ?? member;
  const avatarUrl = typeof member.displayAvatarURL === "function"
    ? member.displayAvatarURL({ size: 64, extension: "png" })
    : typeof user.displayAvatarURL === "function"
    ? user.displayAvatarURL({ size: 64, extension: "png" })
    : null;

  const roleNames = member.roles?.cache
    ? [...member.roles.cache.values()].map((r) => r.name).filter((n) => n && n !== "@everyone")
    : null;
  const hasCrow = roleNames?.some((n) => /crow/i.test(n)) ?? false;

  const { data: existing } = await supabase
    .from("discord_members")
    .select("crow_since, role_names")
    .eq("project_id", PROJECT_ID)
    .eq("user_id", member.id)
    .maybeSingle();

  const joinedAt = member.joinedAt?.toISOString() ?? null;

  // Estimate crow_since for members whose real assignment date we never observed.
  // QA recruitment happened in two reaction waves; approximate by join date.
  const estimateCrowSince = () => {
    if (!joinedAt) return "2026-05-26T20:25:00+00:00";
    const t = new Date(joinedAt).getTime();
    if (t <= new Date("2026-05-27").getTime()) return "2026-05-26T20:25:00+00:00";
    if (t <= new Date("2026-06-20").getTime()) return "2026-06-19T20:32:00+00:00";
    return joinedAt; // joined after both waves — role obtained around join time
  };

  const hadCrowBefore = existing?.role_names?.some((n) => /crow/i.test(n)) ?? false;
  let crowSince;
  if (!hasCrow) {
    crowSince = null;
  } else if (existing?.crow_since) {
    crowSince = existing.crow_since; // already recorded — keep
  } else if (existing && !hadCrowBefore) {
    crowSince = new Date().toISOString(); // genuine new assignment we witnessed
  } else {
    crowSince = estimateCrowSince(); // first sight with crow — approximate
  }

  await supabase.from("discord_members").upsert(
    {
      project_id: PROJECT_ID,
      user_id: member.id,
      username: user.username ?? null,
      global_name: user.globalName ?? null,
      nickname: member.nickname ?? null,
      avatar_url: avatarUrl,
      joined_at: member.joinedAt?.toISOString() ?? null,
      account_created_at: accountCreated,
      role_names: roleNames,
      crow_since: crowSince,
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

export async function recordSystemRun(source) {
  await supabase.from("system_runs").insert({ source });
}

// Mark members who are no longer in the guild as left. Called after a full member
// sync: any tracked member (left_at null) not in the current guild set has left.
export async function markLeftMembers(activeUserIds) {
  const activeSet = new Set(activeUserIds);
  const { data: tracked } = await supabase
    .from("discord_members")
    .select("user_id")
    .eq("project_id", PROJECT_ID)
    .is("left_at", null);
  const gone = (tracked ?? []).filter((m) => !activeSet.has(m.user_id)).map((m) => m.user_id);
  const now = new Date().toISOString();
  for (const uid of gone) {
    await supabase.from("discord_members").update({ left_at: now }).eq("project_id", PROJECT_ID).eq("user_id", uid);
  }
  return gone.length;
}

// Store Discord's authoritative member count (guild.memberCount) for the KPI.
export async function recordGuildStats(memberCount) {
  await supabase.from("projects").update({ member_count: memberCount }).eq("id", PROJECT_ID);
}

export async function insertPresenceSnapshot(counts) {
  await supabase.from("discord_presence_snapshots").insert({
    project_id: PROJECT_ID,
    online_count: counts.online,
    idle_count: counts.idle,
    dnd_count: counts.dnd,
    offline_count: counts.offline,
    total_count: counts.total,
  });
}

export async function insertMessage(msg, channelNameOverride) {
  // For forum threads we attribute messages to the parent forum channel name
  // so existing channel-name filters (e.g. ilike "%bugs%") catch them.
  const parentForumName = msg.channel?.parent?.type === 15 ? msg.channel.parent.name : null;
  await supabase.from("discord_messages").upsert(
    {
      project_id: PROJECT_ID,
      message_id: msg.id,
      channel_id: msg.channelId,
      channel_name: channelNameOverride ?? parentForumName ?? msg.channel?.name ?? null,
      author_id: msg.author?.id ?? null,
      author_name: msg.author?.username ?? null,
      content: msg.content ?? "",
      created_at: msg.createdAt?.toISOString() ?? new Date().toISOString(),
      reaction_count: msg.reactions?.cache?.reduce((sum, r) => sum + (r.count ?? 0), 0) ?? 0,
    },
    { onConflict: "message_id" }
  );
}
