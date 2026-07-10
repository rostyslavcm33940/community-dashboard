import { serverClient } from "./supabase/server";

export type DashboardStats = {
  hasDb: boolean;
  lastRuns: {
    discordBackfill: string | null;
    steamScraper: string | null;
    steamReviews: string | null;
  };
  discord: {
    members: number;
    online: number | null;
    onlineTakenAt: string | null;
    activeAuthors30d: number;
    messages30d: number;
    newMembers30d: number;
    newBugs7d: number;
    newIdeas7d: number;
    messagesByChannel: { name: string; value: number }[];
    topActive: { name: string; value: number; avatarUrl: string | null }[];
    topReactions: { name: string; value: number; avatarUrl: string | null }[];
    messagesPerDay: { date: string; value: number }[];
    newMembersPerDay: { date: string; value: number }[];
    newMembersPerWeek: { date: string; value: number }[];
    membersFlowPerWeek: { date: string; joined: number; left: number }[];
    newBugsPerWeek: { date: string; value: number }[];
    newIdeasPerWeek: { date: string; value: number }[];
    latestBugs: { title: string; author: string; at: string; href: string | null; avatarUrl: string | null }[];
    latestIdeas: { title: string; author: string; at: string; href: string | null; avatarUrl: string | null }[];
    topXp: { name: string; xp: number; level: number; messages: number; avatarUrl: string | null }[];
    topXpTakenAt: string | null;
  };
  qa: {
    crowCount: number;
    bugReportsTotal: number;
    bugReportsInRange: number;
    newCrowsPerWeek: { date: string; value: number }[];
    topReporters: { name: string; value: number; avatarUrl: string | null }[];
    topBugChatters: { name: string; value: number; avatarUrl: string | null }[];
    latestBugReports: { title: string; author: string; at: string; href: string | null; avatarUrl: string | null }[];
  };
  steam: {
    activeThreads: number;
    newThreads7d: number;
    newComments7d: number;
    unanswered: number;
    devResponsePct: number;
    lastThreads: { title: string; author: string; at: string; url: string | null }[];
    lastComments: { snippet: string; author: string; at: string; url: string | null }[];
    topHottest: { title: string; replies: number; url: string | null }[];
    topPosters: { name: string; value: number }[];
    pinned: { title: string; replies: number; author: string }[];
    subForumSplit: { name: string; value: number }[];
    threadsPerWeek: { date: string; value: number }[];
    commentsPerWeek: { date: string; value: number }[];
    unansweredThreads: { title: string; author: string; at: string; url: string | null; note: string | null }[];
  };
  reviews: {
    total: number;
    positive: number;
    negative: number;
    positivePct: number;
    scoreDesc: string;
    allTimeScoreDesc: string;
    bugMentions7d: number;
    bugMentionsAll: number;
    lastPositive: ReviewRow[];
    lastNegative: ReviewRow[];
    lastBugMentions: ReviewRow[];
    usefulPositive30d: ReviewRow[];
    usefulNegative30d: ReviewRow[];
    perDay: { date: string; positive: number; negative: number }[];
  } | null;
};

export type ReviewRow = {
  snippet: string;
  language: string;
  votedUp: boolean;
  at: string;
  url: string;
  translateUrl: string;
  mentionsBug: boolean;
};

function fmt(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function weekBuckets(weeks: number, now: Date) {
  // ISO-style calendar weeks: Monday 00:00 to Sunday 23:59.
  const day = now.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - daysSinceMonday);
  currentMonday.setHours(0, 0, 0, 0);

  const out: { label: string; startMs: number; endMs: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(currentMonday);
    start.setDate(currentMonday.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const sameMonth = start.getMonth() === end.getMonth();
    const label = sameMonth
      ? `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}`
      : `${MONTHS[start.getMonth()]} ${start.getDate()}–${MONTHS[end.getMonth()]} ${end.getDate()}`;
    out.push({ label, startMs: start.getTime(), endMs: end.getTime() });
  }
  return out;
}

function bucketByWeek(items: { ts: string | null | undefined }[], buckets: ReturnType<typeof weekBuckets>) {
  const counts = buckets.map((b) => ({ date: b.label, value: 0 }));
  for (const it of items) {
    if (!it.ts) continue;
    const t = new Date(it.ts).getTime();
    for (let i = 0; i < buckets.length; i++) {
      if (t >= buckets[i].startMs && t <= buckets[i].endMs) {
        counts[i].value++;
        break;
      }
    }
  }
  return counts;
}

async function paginate<T>(makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, pageSize = 1000, maxPages = 100): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await makeQuery(from, to);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < pageSize) break;
  }
  return out;
}

export async function getDashboardStats(rangeDays = 30): Promise<DashboardStats | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  const supabase = serverClient();
  const now = new Date();
  // Selectable activity window (7 / 30 / 90d) — drives messages, new members,
  // per-day charts and top contributors. Bug/idea/thread metrics stay fixed at 7d.
  const d30 = new Date(now.getTime() - rangeDays * 86400_000).toISOString();
  const d7 = new Date(now.getTime() - 7 * 86400_000).toISOString();
  const d56 = new Date(now.getTime() - 56 * 86400_000).toISOString();

  try {
    const [
      { count: members },
      { count: messages30d },
      { count: newMembers30d },
      { data: bugs8wRows },
      { data: ideas8wRows },
      { data: allMsg30d },
      { data: activeAuthors },
      { data: latestBugs },
      { data: latestIdeas },
      { data: msgDays },
      { data: memberDays },
      { data: steamThreads },
      { data: lastComments },
      { data: pinnedThreads },
      { data: presenceLatest },
      { data: reviewSummary },
      { data: lastPositive },
      { data: lastNegative },
      { data: lastBugMentions },
      { data: reviewsForGraph },
      { data: mee6Top },
      { data: projectRow },
      { data: steamComments8w },
      { data: usefulPositive30d },
      { data: usefulNegative30d },
      { data: lastRunsRows },
      { data: bugReportsAll },
      { data: crowMembers },
      { data: leftMembers },
      { data: threadNotes },
    ] = await Promise.all([
      supabase.from("discord_members").select("*", { count: "exact", head: true }).eq("project_id", 1).is("left_at", null),
      supabase.from("discord_messages").select("*", { count: "exact", head: true }).eq("project_id", 1).gte("created_at", d30).not("channel_name", "ilike", "%moderator%"),
      supabase.from("discord_members").select("*", { count: "exact", head: true }).eq("project_id", 1).gte("joined_at", d30),
      supabase.from("discord_messages").select("id, channel_name, created_at, message_id, channel_id").eq("project_id", 1).gte("created_at", d56).ilike("channel_name", "%sea-bugs%"),
      supabase.from("discord_messages").select("id, channel_name, created_at, message_id, channel_id").eq("project_id", 1).gte("created_at", d56).ilike("channel_name", "%your-ideas%"),
      paginate<{ channel_name: string | null; author_id: string | null; author_name: string | null; created_at: string | null; reaction_count: number | null }>((from, to) => supabase.from("discord_messages").select("channel_name, author_id, author_name, created_at, reaction_count").eq("project_id", 1).gte("created_at", d30).not("channel_name", "ilike", "%moderator%").range(from, to)).then((data) => ({ data, error: null })),
      Promise.resolve({ data: null }),
      supabase.from("discord_messages").select("content, author_id, author_name, created_at, channel_name, message_id, channel_id").eq("project_id", 1).ilike("channel_name", "%sea-bugs%").order("created_at", { ascending: false }).limit(500),
      supabase.from("discord_messages").select("content, author_id, author_name, created_at, channel_name, message_id, channel_id").eq("project_id", 1).ilike("channel_name", "%your-ideas%").order("created_at", { ascending: false }).limit(500),
      Promise.resolve({ data: null }),
      supabase.from("discord_members").select("joined_at").eq("project_id", 1).gte("joined_at", new Date(now.getTime() - Math.max(rangeDays, 56) * 86400_000).toISOString()),
      supabase.from("steam_threads").select("*").eq("project_id", 1).order("created_at", { ascending: false }),
      supabase.from("steam_comments").select("content, author, created_at, is_dev_reply, comment_url").eq("project_id", 1).order("created_at", { ascending: false }).limit(5),
      supabase.from("steam_threads").select("title, reply_count, author").eq("project_id", 1).eq("is_pinned", true),
      supabase.from("discord_presence_snapshots").select("online_count, taken_at").eq("project_id", 1).order("taken_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("steam_review_summary").select("*").eq("project_id", 1).maybeSingle(),
      supabase.from("steam_reviews").select("content, language, voted_up, timestamp_created, review_url, mentions_bug, votes_up").eq("project_id", 1).eq("voted_up", true).order("timestamp_created", { ascending: false }).limit(5),
      supabase.from("steam_reviews").select("content, language, voted_up, timestamp_created, review_url, mentions_bug, votes_up").eq("project_id", 1).eq("voted_up", false).order("timestamp_created", { ascending: false }).limit(5),
      supabase.from("steam_reviews").select("content, language, voted_up, timestamp_created, review_url, mentions_bug, votes_up").eq("project_id", 1).eq("mentions_bug", true).order("timestamp_created", { ascending: false }).limit(5),
      supabase.from("steam_reviews").select("timestamp_created, voted_up, mentions_bug").eq("project_id", 1).gte("timestamp_created", new Date(now.getTime() - 90 * 86400_000).toISOString()),
      supabase.from("mee6_leaderboard").select("username, xp, level, messages, taken_at").eq("project_id", 1).order("xp", { ascending: false }).limit(10),
      supabase.from("projects").select("discord_guild_id, member_count").eq("id", 1).maybeSingle(),
      supabase.from("steam_comments").select("created_at").eq("project_id", 1).gte("created_at", d56),
      supabase.from("steam_reviews").select("content, language, voted_up, timestamp_created, review_url, mentions_bug, votes_up").eq("project_id", 1).eq("voted_up", true).gte("timestamp_created", new Date(now.getTime() - 30 * 86400_000).toISOString()).order("votes_up", { ascending: false }).order("timestamp_created", { ascending: false }).limit(5),
      supabase.from("steam_reviews").select("content, language, voted_up, timestamp_created, review_url, mentions_bug, votes_up").eq("project_id", 1).eq("voted_up", false).gte("timestamp_created", new Date(now.getTime() - 30 * 86400_000).toISOString()).order("votes_up", { ascending: false }).order("timestamp_created", { ascending: false }).limit(5),
      supabase.from("system_runs").select("source, ran_at").order("ran_at", { ascending: false }).limit(50),
      supabase.from("discord_messages").select("id, created_at, message_id, channel_id, author_id, author_name, channel_name, content").eq("project_id", 1).or("channel_name.ilike.%bug-reports%,channel_name.ilike.%lobby%").order("created_at", { ascending: false }).limit(3000),
      supabase.from("discord_members").select("role_names, crow_since").eq("project_id", 1).is("left_at", null).not("role_names", "is", null),
      supabase.from("discord_members").select("left_at").eq("project_id", 1).gte("left_at", new Date(now.getTime() - Math.max(rangeDays, 56) * 86400_000).toISOString()),
      supabase.from("steam_thread_notes").select("thread_url, note").eq("project_id", 1),
    ]);

    const lastBySource = new Map<string, string>();
    for (const r of (lastRunsRows ?? []) as { source: string; ran_at: string }[]) {
      if (!lastBySource.has(r.source)) lastBySource.set(r.source, r.ran_at);
    }

    const guildId = (projectRow as { discord_guild_id?: string | null } | null)?.discord_guild_id ?? null;
    function discordUrl(channelId: string | null | undefined, messageId: string | null | undefined): string | null {
      if (!guildId || !channelId || !messageId) return null;
      return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
    }

    type MemberRow = { user_id: string; username: string | null; global_name: string | null; nickname: string | null; avatar_url: string | null };
    const memberRows = await paginate<MemberRow>(
      (from, to) => supabase.from("discord_members").select("user_id, username, global_name, nickname, avatar_url").eq("project_id", 1).range(from, to)
    );
    const memberById = new Map<string, MemberRow>();
    const memberByUsername = new Map<string, MemberRow>();
    for (const m of memberRows) {
      memberById.set(m.user_id, m);
      if (m.username) memberByUsername.set(m.username, m);
    }
    function displayName(m: MemberRow | undefined, fallback: string): string {
      if (!m) return fallback;
      return m.nickname || m.global_name || m.username || fallback;
    }
    function resolveByAuthor(authorId: string | null | undefined, authorName: string | null | undefined) {
      const m = (authorId ? memberById.get(authorId) : undefined) ?? (authorName ? memberByUsername.get(authorName) : undefined);
      return {
        name: displayName(m, authorName ?? "unknown"),
        avatarUrl: m?.avatar_url ?? null,
      };
    }

    const byChannel: Record<string, number> = {};
    const byAuthor = new Map<string, { count: number; reactions: number; authorId: string | null; authorName: string }>();
    for (const m of allMsg30d ?? []) {
      const key = m.author_id ?? m.author_name ?? "unknown";
      const prev = byAuthor.get(key) ?? { count: 0, reactions: 0, authorId: m.author_id ?? null, authorName: m.author_name ?? "unknown" };
      prev.count++;
      prev.reactions += m.reaction_count ?? 0;
      byAuthor.set(key, prev);
    }

    const allMsgChannels = await paginate<{ channel_name: string | null }>(
      (from, to) => supabase.from("discord_messages").select("channel_name").eq("project_id", 1).not("channel_name", "ilike", "%moderator%").range(from, to)
    );
    for (const m of allMsgChannels) {
      const c = m.channel_name ?? "unknown";
      byChannel[c] = (byChannel[c] ?? 0) + 1;
    }

    const EXCLUDED_CHANNELS = new Set(["welcome-deck", "welcome", "rules"]);
    const messagesByChannel = Object.entries(byChannel)
      .map(([name, value]) => ({ name: name.replace(/[^\w-]/g, "").trim() || "unknown", value }))
      .filter((r) => !EXCLUDED_CHANNELS.has(r.name.toLowerCase()) && r.value > 0)
      .sort((a, b) => b.value - a.value);

    const EXCLUDED_AUTHORS = new Set(["mee6", "MEE6", "Carl-bot", "carl-bot", "AutoMod"]);
    const byAuthorList = [...byAuthor.values()].filter((a) => !EXCLUDED_AUTHORS.has(a.authorName));
    const topActive = byAuthorList
      .map((a) => {
        const r = resolveByAuthor(a.authorId, a.authorName);
        return { name: r.name, value: a.count, avatarUrl: r.avatarUrl };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topReactions = byAuthorList
      .map((a) => {
        const r = resolveByAuthor(a.authorId, a.authorName);
        return { name: r.name, value: a.reactions, avatarUrl: r.avatarUrl };
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const activeAuthorsSet = new Set((allMsg30d ?? []).map((r) => r.author_id ?? r.author_name).filter(Boolean));

    const msgDayCounts: Record<string, number> = {};
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400_000);
      msgDayCounts[fmt(d)] = 0;
    }
    for (const m of allMsg30d ?? []) {
      if (!m.created_at) continue;
      const k = fmt(new Date(m.created_at));
      if (k in msgDayCounts) msgDayCounts[k]++;
    }
    const messagesPerDay = Object.entries(msgDayCounts).map(([date, value]) => ({ date, value }));

    const memberDayCounts: Record<string, number> = {};
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400_000);
      memberDayCounts[fmt(d)] = 0;
    }
    for (const m of memberDays ?? []) {
      if (!m.joined_at) continue;
      const k = fmt(new Date(m.joined_at));
      if (k in memberDayCounts) memberDayCounts[k]++;
    }
    const newMembersPerDay = Object.entries(memberDayCounts).map(([date, value]) => ({ date, value }));

    const threads = steamThreads ?? [];
    const sub: Record<string, number> = {};
    for (const t of threads) {
      const k = t.sub_forum ?? "General Discussions";
      sub[k] = (sub[k] ?? 0) + 1;
    }
    const subForumSplit = Object.entries(sub).map(([name, value]) => ({ name, value }));

    const newThreads7d = threads.filter((t) => t.created_at && new Date(t.created_at) > new Date(d30)).length;
    const unansweredList = threads.filter((t) => (t.reply_count ?? 0) === 0 && !t.is_pinned && t.created_at && new Date(t.created_at) > new Date(d30));
    const unanswered = unansweredList.length;
    const noteByUrl = new Map<string, string>();
    for (const n of (threadNotes ?? []) as { thread_url: string; note: string | null }[]) {
      if (n.note) noteByUrl.set(n.thread_url, n.note);
    }
    const unansweredThreads = unansweredList
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .map((t) => ({
        title: (t.title ?? "(no title)").replace(/^PINNED:\s*/i, "").trim(),
        author: t.author ?? "",
        at: shortDate(t.created_at),
        url: (t.thread_url as string | null) ?? null,
        note: t.thread_url ? noteByUrl.get(t.thread_url) ?? null : null,
      }));

    const lastThreads = threads.slice(0, 5).map((t) => ({
      title: t.title ?? "(no title)",
      author: t.author ?? "",
      at: shortDate(t.created_at),
      url: (t.thread_url as string | null) ?? null,
    }));

    const topHottest = [...threads]
      .sort((a, b) => (b.reply_count ?? 0) - (a.reply_count ?? 0))
      .slice(0, 5)
      .map((t) => ({ title: t.title ?? "(no title)", replies: t.reply_count ?? 0, url: (t.thread_url as string | null) ?? null }));

    const pinned = (pinnedThreads ?? []).map((p) => ({
      title: p.title ?? "(no title)",
      replies: p.reply_count ?? 0,
      author: p.author ?? "",
    }));

    const { count: totalComments } = await supabase
      .from("steam_comments")
      .select("*", { count: "exact", head: true })
      .eq("project_id", 1)
      .gte("created_at", d30);

    // Dev response rate = share of threads (created in range) that got at least
    // one dev reply — a real "did the team respond" metric, not comment volume.
    const { data: devReplyRows } = await supabase
      .from("steam_comments")
      .select("thread_id")
      .eq("project_id", 1)
      .eq("is_dev_reply", true);
    const threadsWithDevReply = new Set((devReplyRows ?? []).map((r) => r.thread_id).filter((id) => id != null));
    const threadsInRange = threads.filter((t) => t.created_at && new Date(t.created_at) > new Date(d30) && !t.is_pinned);
    const answeredByDev = threadsInRange.filter((t) => threadsWithDevReply.has(t.id)).length;
    const devResponsePct = threadsInRange.length > 0 ? Math.round((answeredByDev / threadsInRange.length) * 100) : 0;

    const { data: posterRows } = await supabase
      .from("steam_comments")
      .select("author")
      .eq("project_id", 1)
      .gte("created_at", d30);
    const posterCounts: Record<string, number> = {};
    for (const r of posterRows ?? []) {
      const a = r.author ?? "";
      if (a) posterCounts[a] = (posterCounts[a] ?? 0) + 1;
    }
    const topPosters = Object.entries(posterCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    function reviewRow(r: { content?: string | null; language?: string | null; voted_up?: boolean | null; timestamp_created?: string | null; review_url?: string | null; mentions_bug?: boolean | null }): ReviewRow {
      const txt = (r.content ?? "").trim();
      return {
        snippet: txt.slice(0, 240) || "(no text)",
        language: r.language ?? "unknown",
        votedUp: !!r.voted_up,
        at: shortDate(r.timestamp_created),
        url: r.review_url ?? "",
        translateUrl: `https://translate.google.com/?sl=auto&tl=en&op=translate&text=${encodeURIComponent(txt.slice(0, 1000))}`,
        mentionsBug: !!r.mentions_bug,
      };
    }

    let reviewsBlock: DashboardStats["reviews"] = null;
    if (reviewSummary) {
      const summary = reviewSummary as { total_reviews?: number | null; total_positive?: number | null; total_negative?: number | null; review_score_desc?: string | null };
      const positive = summary.total_positive ?? 0;
      const negative = summary.total_negative ?? 0;
      const total = summary.total_reviews ?? positive + negative;
      const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;

      const rangeStart = new Date(now.getTime() - rangeDays * 86400_000).getTime();
      let bugMentions7d = 0;
      let bugMentionsAll = 0;
      const dayBucket: Record<string, { positive: number; negative: number }> = {};
      for (let i = 89; i >= 0; i--) {
        const dd = new Date(now.getTime() - i * 86400_000);
        dayBucket[fmt(dd)] = { positive: 0, negative: 0 };
      }
      for (const r of (reviewsForGraph ?? []) as { timestamp_created: string; voted_up: boolean; mentions_bug: boolean }[]) {
        if (!r.timestamp_created) continue;
        const created = new Date(r.timestamp_created);
        const key = fmt(created);
        if (key in dayBucket) {
          if (r.voted_up) dayBucket[key].positive++;
          else dayBucket[key].negative++;
        }
        if (r.mentions_bug) {
          bugMentionsAll++;
          if (created.getTime() >= rangeStart) bugMentions7d++;
        }
      }
      const perDay = Object.entries(dayBucket).map(([date, v]) => ({ date, positive: v.positive, negative: v.negative }));

      // Sentiment for the SELECTED range (not all-time), so it matches the picker.
      let rPos = 0, rNeg = 0;
      for (const r of (reviewsForGraph ?? []) as { timestamp_created: string; voted_up: boolean }[]) {
        if (!r.timestamp_created) continue;
        if (new Date(r.timestamp_created).getTime() < rangeStart) continue;
        if (r.voted_up) rPos++; else rNeg++;
      }
      const rTotal = rPos + rNeg;
      const rPct = rTotal > 0 ? Math.round((rPos / rTotal) * 100) : positivePct;
      // Steam's own rating bands.
      const label = (pct: number) =>
        pct >= 80 ? "Very Positive" : pct >= 70 ? "Mostly Positive" : pct >= 40 ? "Mixed" : pct >= 20 ? "Mostly Negative" : "Negative";
      const rangeScoreDesc = rTotal > 0 ? label(rPct) : (summary.review_score_desc ?? "—");

      reviewsBlock = {
        total,
        positive: rTotal > 0 ? rPos : positive,
        negative: rTotal > 0 ? rNeg : negative,
        positivePct: rPct,
        scoreDesc: rangeScoreDesc,
        allTimeScoreDesc: summary.review_score_desc ?? "—",
        bugMentions7d,
        bugMentionsAll,
        lastPositive: (lastPositive ?? []).map(reviewRow),
        lastNegative: (lastNegative ?? []).map(reviewRow),
        lastBugMentions: (lastBugMentions ?? []).map(reviewRow),
        usefulPositive30d: (usefulPositive30d ?? []).map(reviewRow),
        usefulNegative30d: (usefulNegative30d ?? []).map(reviewRow),
        perDay,
      };
    }

    const buckets8w = weekBuckets(8, now);
    const dRangeMs = new Date(d30).getTime();
    // Count only thread starters (topics created), not every reply in the thread.
    const isStarter = (r: { message_id?: string | null; channel_id?: string | null }) =>
      r.message_id && r.channel_id && r.message_id === r.channel_id;
    const bugStarters = (bugs8wRows ?? []).filter(isStarter);
    const ideaStarters = (ideas8wRows ?? []).filter(isStarter);
    const newBugs7d = bugStarters.filter((r) => r.created_at && new Date(r.created_at).getTime() >= dRangeMs).length;
    const newIdeas7d = ideaStarters.filter((r) => r.created_at && new Date(r.created_at).getTime() >= dRangeMs).length;
    const newBugsPerWeek = bucketByWeek(bugStarters.map((r) => ({ ts: r.created_at })), buckets8w);
    const newIdeasPerWeek = bucketByWeek(ideaStarters.map((r) => ({ ts: r.created_at })), buckets8w);
    const newMembersPerWeek = bucketByWeek((memberDays ?? []).map((m) => ({ ts: m.joined_at })), buckets8w);
    // The first backfill stamped left_at=NOW for every member already gone before
    // tracking existed (a one-off lump). Only chart leaves observed from this cutoff
    // onward so the past bulk-detection isn't shown as this week's churn.
    const LEAVES_TRACKED_SINCE = new Date("2026-07-09T00:00:00Z").getTime();
    const leftPerWeek = bucketByWeek(
      ((leftMembers ?? []) as { left_at: string | null }[])
        .filter((m) => m.left_at && new Date(m.left_at).getTime() >= LEAVES_TRACKED_SINCE)
        .map((m) => ({ ts: m.left_at })),
      buckets8w
    );
    const membersFlowPerWeek = newMembersPerWeek.map((j, i) => ({ date: j.date, joined: j.value, left: leftPerWeek[i]?.value ?? 0 }));
    const threadsPerWeek = bucketByWeek((steamThreads ?? []).map((t) => ({ ts: t.created_at })), buckets8w);
    const commentsPerWeek = bucketByWeek(((steamComments8w ?? []) as { created_at: string | null }[]).map((c) => ({ ts: c.created_at })), buckets8w);

    // QA track. bugReportsAll spans bug-reports + the Lobby thread (for the
    // "most active" metric). Bug-report counts use the bug-reports channel only.
    type BugRow = { created_at: string | null; message_id: string | null; channel_id: string | null; author_id: string | null; author_name: string | null; channel_name: string | null; content: string | null };
    const qaRows = (bugReportsAll ?? []) as BugRow[];
    const bugRows = qaRows.filter((r) => /bug-reports/i.test(r.channel_name ?? ""));
    const bugReportStarters = bugRows.filter((r) => r.message_id && r.channel_id && r.message_id === r.channel_id);
    const bugReportsTotal = bugReportStarters.length;
    const bugReportsInRange = bugReportStarters.filter((r) => r.created_at && new Date(r.created_at).getTime() >= dRangeMs).length;

    // Latest 5 bug reports (thread starters), newest first, with Discord deep-link.
    const latestBugReports = bugReportStarters.slice(0, 5).map((m) => {
      const res = resolveByAuthor(m.author_id, m.author_name);
      return {
        title: (m.content ?? "").slice(0, 80) || "(no text)",
        author: res.name,
        at: shortDate(m.created_at),
        href: discordUrl(m.channel_id, m.message_id),
        avatarUrl: res.avatarUrl,
      };
    });

    // Top bug reporters — by number of bug-report topics created.
    const reporterCounts = new Map<string, number>();
    for (const r of bugReportStarters) {
      const k = r.author_id ?? r.author_name ?? "unknown";
      reporterCounts.set(k, (reporterCounts.get(k) ?? 0) + 1);
    }
    const topReporters = [...reporterCounts.entries()]
      .map(([k, value]) => {
        const row = bugReportStarters.find((r) => (r.author_id ?? r.author_name) === k);
        const res = resolveByAuthor(row?.author_id, row?.author_name);
        return { name: res.name, value, avatarUrl: res.avatarUrl };
      })
      .filter((r) => !EXCLUDED_AUTHORS.has(r.name))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Most active — total messages across bug-reports + the Lobby thread.
    const chatterCounts = new Map<string, number>();
    for (const r of qaRows) {
      const k = r.author_id ?? r.author_name ?? "unknown";
      chatterCounts.set(k, (chatterCounts.get(k) ?? 0) + 1);
    }
    const topBugChatters = [...chatterCounts.entries()]
      .map(([k, value]) => {
        const row = qaRows.find((r) => (r.author_id ?? r.author_name) === k);
        const res = resolveByAuthor(row?.author_id, row?.author_name);
        return { name: res.name, value, avatarUrl: res.avatarUrl };
      })
      .filter((r) => !EXCLUDED_AUTHORS.has(r.name))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const crowRows = (crowMembers ?? []) as { role_names: string[] | null; crow_since: string | null }[];
    const crowCount = crowRows.filter((m) => m.role_names?.some((n) => /crow/i.test(n))).length;
    const newCrowsPerWeek = bucketByWeek(crowRows.filter((m) => m.crow_since).map((m) => ({ ts: m.crow_since })), buckets8w);

    return {
      hasDb: true,
      lastRuns: {
        discordBackfill: lastBySource.get("discord_backfill") ?? null,
        steamScraper: lastBySource.get("steam_scraper") ?? null,
        steamReviews: lastBySource.get("steam_reviews") ?? null,
      },
      reviews: reviewsBlock,
      discord: {
        members: (projectRow as { member_count?: number | null } | null)?.member_count ?? members ?? 0,
        online: (presenceLatest as { online_count?: number | null } | null)?.online_count ?? null,
        onlineTakenAt: (presenceLatest as { taken_at?: string | null } | null)?.taken_at ?? null,
        activeAuthors30d: activeAuthorsSet.size,
        messages30d: messages30d ?? 0,
        newMembers30d: newMembers30d ?? 0,
        newBugs7d,
        newIdeas7d,
        messagesByChannel,
        topActive,
        topReactions,
        messagesPerDay,
        newMembersPerDay,
        newMembersPerWeek,
        membersFlowPerWeek,
        newBugsPerWeek,
        newIdeasPerWeek,
        latestBugs: (latestBugs ?? [])
          .filter((m) => m.message_id && m.channel_id && m.message_id === m.channel_id)
          .slice(0, 5)
          .map((m) => {
            const r = resolveByAuthor(m.author_id, m.author_name);
            return {
              title: (m.content ?? "").slice(0, 80) || "(no text)",
              author: r.name,
              at: shortDate(m.created_at),
              href: discordUrl(m.channel_id, m.message_id),
              avatarUrl: r.avatarUrl,
            };
          }),
        latestIdeas: (latestIdeas ?? [])
          .filter((m) => m.message_id && m.channel_id && m.message_id === m.channel_id)
          .slice(0, 5)
          .map((m) => {
            const r = resolveByAuthor(m.author_id, m.author_name);
            return {
              title: (m.content ?? "").slice(0, 80) || "(no text)",
              author: r.name,
              at: shortDate(m.created_at),
              href: discordUrl(m.channel_id, m.message_id),
              avatarUrl: r.avatarUrl,
            };
          }),
        topXp: ((mee6Top ?? []) as { username: string; xp: number; level: number; messages: number }[]).map((r) => {
          const m = memberByUsername.get(r.username);
          return {
            name: displayName(m, r.username),
            xp: r.xp ?? 0,
            level: r.level ?? 0,
            messages: r.messages ?? 0,
            avatarUrl: m?.avatar_url ?? null,
          };
        }),
        topXpTakenAt: (mee6Top?.[0] as { taken_at?: string } | undefined)?.taken_at ?? null,
      },
      steam: {
        activeThreads: threads.length,
        newThreads7d,
        newComments7d: totalComments ?? 0,
        unanswered,
        devResponsePct,
        lastThreads,
        lastComments: (lastComments ?? []).map((c) => {
          const stripped = (c.content ?? "").replace(/^(Originally posted by [^:]+:\s*)+/g, "").trim();
          return {
            snippet: stripped.slice(0, 120) || "(no text)",
            author: c.author ?? "",
            at: shortDate(c.created_at),
            url: (c.comment_url as string | null) ?? null,
          };
        }),
        topHottest,
        topPosters,
        pinned,
        subForumSplit,
        threadsPerWeek,
        commentsPerWeek,
        unansweredThreads,
      },
      qa: {
        crowCount,
        bugReportsTotal,
        bugReportsInRange,
        newCrowsPerWeek,
        topReporters,
        topBugChatters,
        latestBugReports,
      },
    };
  } catch (e) {
    console.error("getDashboardStats error:", e);
    return null;
  }
}
