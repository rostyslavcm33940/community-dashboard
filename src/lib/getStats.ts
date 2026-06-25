import { serverClient } from "./supabase/server";

export type DashboardStats = {
  hasDb: boolean;
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
    topActive: { name: string; value: number }[];
    topReactions: { name: string; value: number }[];
    messagesPerDay: { date: string; value: number }[];
    newMembersPerDay: { date: string; value: number }[];
    latestBugs: { title: string; author: string; at: string }[];
    latestIdeas: { title: string; author: string; at: string }[];
    topXp: { name: string; xp: number; level: number; messages: number }[];
    topXpTakenAt: string | null;
  };
  steam: {
    activeThreads: number;
    newThreads7d: number;
    newComments7d: number;
    unanswered: number;
    devResponsePct: number;
    lastThreads: { title: string; author: string; at: string }[];
    lastComments: { snippet: string; author: string; at: string }[];
    topHottest: { title: string; replies: number }[];
    topPosters: { name: string; value: number }[];
    pinned: { title: string; replies: number; author: string }[];
    subForumSplit: { name: string; value: number }[];
  };
  reviews: {
    total: number;
    positive: number;
    negative: number;
    positivePct: number;
    scoreDesc: string;
    bugMentions7d: number;
    bugMentionsAll: number;
    lastPositive: ReviewRow[];
    lastNegative: ReviewRow[];
    lastBugMentions: ReviewRow[];
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

function shortDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
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

  try {
    const [
      { count: members },
      { count: messages30d },
      { count: newMembers30d },
      { data: bugs7dRows },
      { data: ideas7dRows },
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
    ] = await Promise.all([
      supabase.from("discord_members").select("*", { count: "exact", head: true }).eq("project_id", 1).is("left_at", null),
      supabase.from("discord_messages").select("*", { count: "exact", head: true }).eq("project_id", 1).gte("created_at", d30),
      supabase.from("discord_members").select("*", { count: "exact", head: true }).eq("project_id", 1).gte("joined_at", d30),
      supabase.from("discord_messages").select("id, channel_name, created_at").eq("project_id", 1).gte("created_at", d7).ilike("channel_name", "%bugs%"),
      supabase.from("discord_messages").select("id, channel_name, created_at").eq("project_id", 1).gte("created_at", d7).ilike("channel_name", "%ideas%"),
      paginate<{ channel_name: string | null; author_name: string | null; created_at: string | null; reaction_count: number | null }>((from, to) => supabase.from("discord_messages").select("channel_name, author_name, created_at, reaction_count").eq("project_id", 1).gte("created_at", d30).range(from, to)).then((data) => ({ data, error: null })),
      Promise.resolve({ data: null }),
      supabase.from("discord_messages").select("content, author_name, created_at, channel_name").eq("project_id", 1).ilike("channel_name", "%bugs%").order("created_at", { ascending: false }).limit(5),
      supabase.from("discord_messages").select("content, author_name, created_at, channel_name").eq("project_id", 1).ilike("channel_name", "%ideas%").order("created_at", { ascending: false }).limit(5),
      Promise.resolve({ data: null }),
      supabase.from("discord_members").select("joined_at").eq("project_id", 1).gte("joined_at", d30),
      supabase.from("steam_threads").select("*").eq("project_id", 1).order("created_at", { ascending: false }),
      supabase.from("steam_comments").select("content, author, created_at, is_dev_reply").eq("project_id", 1).order("created_at", { ascending: false }).limit(5),
      supabase.from("steam_threads").select("title, reply_count, author").eq("project_id", 1).eq("is_pinned", true),
      supabase.from("discord_presence_snapshots").select("online_count, taken_at").eq("project_id", 1).order("taken_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("steam_review_summary").select("*").eq("project_id", 1).maybeSingle(),
      supabase.from("steam_reviews").select("content, language, voted_up, timestamp_created, review_url, mentions_bug").eq("project_id", 1).eq("voted_up", true).order("timestamp_created", { ascending: false }).limit(5),
      supabase.from("steam_reviews").select("content, language, voted_up, timestamp_created, review_url, mentions_bug").eq("project_id", 1).eq("voted_up", false).order("timestamp_created", { ascending: false }).limit(5),
      supabase.from("steam_reviews").select("content, language, voted_up, timestamp_created, review_url, mentions_bug").eq("project_id", 1).eq("mentions_bug", true).order("timestamp_created", { ascending: false }).limit(5),
      supabase.from("steam_reviews").select("timestamp_created, voted_up, mentions_bug").eq("project_id", 1).gte("timestamp_created", new Date(now.getTime() - 90 * 86400_000).toISOString()),
      supabase.from("mee6_leaderboard").select("username, xp, level, messages, taken_at").eq("project_id", 1).order("xp", { ascending: false }).limit(5),
    ]);

    const byChannel: Record<string, number> = {};
    const byAuthor: Record<string, number> = {};
    const byAuthorReactions: Record<string, number> = {};
    for (const m of allMsg30d ?? []) {
      const a = m.author_name ?? "unknown";
      byAuthor[a] = (byAuthor[a] ?? 0) + 1;
      byAuthorReactions[a] = (byAuthorReactions[a] ?? 0) + (m.reaction_count ?? 0);
    }

    const allMsgChannels = await paginate<{ channel_name: string | null }>(
      (from, to) => supabase.from("discord_messages").select("channel_name").eq("project_id", 1).range(from, to)
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
    const topActive = Object.entries(byAuthor)
      .map(([name, value]) => ({ name, value }))
      .filter((r) => !EXCLUDED_AUTHORS.has(r.name))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topReactions = Object.entries(byAuthorReactions)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .filter((x) => x.value > 0);

    const activeAuthorsSet = new Set((allMsg30d ?? []).map((r) => r.author_name).filter(Boolean));

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

    const newThreads7d = threads.filter((t) => t.created_at && new Date(t.created_at) > new Date(d7)).length;
    const unanswered = threads.filter((t) => (t.reply_count ?? 0) === 0 && t.created_at && new Date(t.created_at) > new Date(d7)).length;

    const lastThreads = threads.slice(0, 5).map((t) => ({
      title: t.title ?? "(no title)",
      author: t.author ?? "",
      at: shortDate(t.created_at),
    }));

    const topHottest = [...threads]
      .sort((a, b) => (b.reply_count ?? 0) - (a.reply_count ?? 0))
      .slice(0, 5)
      .map((t) => ({ title: t.title ?? "(no title)", replies: t.reply_count ?? 0 }));

    const pinned = (pinnedThreads ?? []).map((p) => ({
      title: p.title ?? "(no title)",
      replies: p.reply_count ?? 0,
      author: p.author ?? "",
    }));

    const { count: totalComments } = await supabase
      .from("steam_comments")
      .select("*", { count: "exact", head: true })
      .eq("project_id", 1)
      .gte("created_at", d7);

    const { count: devComments } = await supabase
      .from("steam_comments")
      .select("*", { count: "exact", head: true })
      .eq("project_id", 1)
      .gte("created_at", d7)
      .eq("is_dev_reply", true);

    const devResponsePct = (totalComments ?? 0) > 0 ? Math.round(((devComments ?? 0) / (totalComments ?? 1)) * 100) : 0;

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

      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400_000).getTime();
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
          if (created.getTime() >= sevenDaysAgo) bugMentions7d++;
        }
      }
      const perDay = Object.entries(dayBucket).map(([date, v]) => ({ date, positive: v.positive, negative: v.negative }));

      reviewsBlock = {
        total,
        positive,
        negative,
        positivePct,
        scoreDesc: summary.review_score_desc ?? "—",
        bugMentions7d,
        bugMentionsAll,
        lastPositive: (lastPositive ?? []).map(reviewRow),
        lastNegative: (lastNegative ?? []).map(reviewRow),
        lastBugMentions: (lastBugMentions ?? []).map(reviewRow),
        perDay,
      };
    }

    return {
      hasDb: true,
      reviews: reviewsBlock,
      discord: {
        members: members ?? 0,
        online: (presenceLatest as { online_count?: number | null } | null)?.online_count ?? null,
        onlineTakenAt: (presenceLatest as { taken_at?: string | null } | null)?.taken_at ?? null,
        activeAuthors30d: activeAuthorsSet.size,
        messages30d: messages30d ?? 0,
        newMembers30d: newMembers30d ?? 0,
        newBugs7d: bugs7dRows?.length ?? 0,
        newIdeas7d: ideas7dRows?.length ?? 0,
        messagesByChannel,
        topActive,
        topReactions,
        messagesPerDay,
        newMembersPerDay,
        latestBugs: (latestBugs ?? []).map((m) => ({
          title: (m.content ?? "").slice(0, 80) || "(no text)",
          author: m.author_name ?? "",
          at: shortDate(m.created_at),
        })),
        latestIdeas: (latestIdeas ?? []).map((m) => ({
          title: (m.content ?? "").slice(0, 80) || "(no text)",
          author: m.author_name ?? "",
          at: shortDate(m.created_at),
        })),
        topXp: ((mee6Top ?? []) as { username: string; xp: number; level: number; messages: number }[]).map((r) => ({
          name: r.username,
          xp: r.xp ?? 0,
          level: r.level ?? 0,
          messages: r.messages ?? 0,
        })),
        topXpTakenAt: (mee6Top?.[0] as { taken_at?: string } | undefined)?.taken_at ?? null,
      },
      steam: {
        activeThreads: threads.length,
        newThreads7d,
        newComments7d: totalComments ?? 0,
        unanswered,
        devResponsePct,
        lastThreads,
        lastComments: (lastComments ?? []).map((c) => ({
          snippet: (c.content ?? "").slice(0, 80) || "(no text)",
          author: c.author ?? "",
          at: shortDate(c.created_at),
        })),
        topHottest,
        topPosters,
        pinned,
        subForumSplit,
      },
    };
  } catch (e) {
    console.error("getDashboardStats error:", e);
    return null;
  }
}
