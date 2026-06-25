import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ID = parseInt(process.env.PROJECT_ID || "1", 10);
const APP_ID = process.env.STEAM_REVIEWS_APP_ID || process.env.STEAM_APP_ID || "4317790";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const UA =
  "Mozilla/5.0 (CommunityDashboardScraper; contact: cm.rostyslav@retrostylegames.com)";

const BUG_KEYWORDS = [
  "bug",
  "glitch",
  "crash",
  "broken",
  "freeze",
  "frozen",
  "lag",
  "stutter",
  "error",
  "exception",
  "issue",
  "problem",
  "баг",
  "глюк",
  "краш",
  "ошибка",
  "помилка",
  "вилет",
  "виліт",
  "вылет",
  "не работает",
  "не працює",
  "не запускается",
  "не запускається",
  "зависает",
  "зависає",
  "fix",
  "fixme",
  "broke",
];

function mentionsBug(text) {
  if (!text) return false;
  const lc = text.toLowerCase();
  return BUG_KEYWORDS.some((k) => lc.includes(k));
}

async function fetchPage(cursor = "*") {
  const url = `https://store.steampowered.com/appreviews/${APP_ID}?json=1&filter=recent&language=all&day_range=365&review_type=all&purchase_type=all&num_per_page=100&cursor=${encodeURIComponent(cursor)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Steam reviews ${res.status}`);
  return res.json();
}

async function upsertSummary(summary) {
  await supabase.from("steam_review_summary").upsert(
    {
      project_id: PROJECT_ID,
      app_id: APP_ID,
      total_reviews: summary.total_reviews ?? 0,
      total_positive: summary.total_positive ?? 0,
      total_negative: summary.total_negative ?? 0,
      review_score: summary.review_score ?? null,
      review_score_desc: summary.review_score_desc ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id" }
  );
}

async function upsertReviews(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const rows = reviews.map((r) => ({
    project_id: PROJECT_ID,
    recommendation_id: String(r.recommendationid),
    author_steamid: r.author?.steamid ?? null,
    author_name: null,
    language: r.language ?? null,
    content: r.review ?? "",
    voted_up: !!r.voted_up,
    weighted_vote_score: r.weighted_vote_score ?? null,
    votes_up: r.votes_up ?? 0,
    votes_funny: r.votes_funny ?? 0,
    comment_count: r.comment_count ?? 0,
    timestamp_created: r.timestamp_created
      ? new Date(r.timestamp_created * 1000).toISOString()
      : null,
    timestamp_updated: r.timestamp_updated
      ? new Date(r.timestamp_updated * 1000).toISOString()
      : null,
    mentions_bug: mentionsBug(r.review),
    review_url: `https://steamcommunity.com/profiles/${r.author?.steamid}/recommended/${APP_ID}/`,
  }));
  const { error } = await supabase
    .from("steam_reviews")
    .upsert(rows, { onConflict: "recommendation_id" });
  if (error) throw error;
  return rows.length;
}

export async function fetchAllReviews() {
  console.log(`Fetching Steam reviews for app ${APP_ID}`);
  let cursor = "*";
  let total = 0;
  let summaryWritten = false;
  for (let page = 0; page < 50; page++) {
    let data;
    try {
      data = await fetchPage(cursor);
    } catch (e) {
      console.warn(`Page ${page + 1} failed: ${e.message}`);
      break;
    }
    if (!data.success) {
      console.warn(`Page ${page + 1} unsuccessful`);
      break;
    }
    if (!summaryWritten) {
      await upsertSummary(data.query_summary || {});
      summaryWritten = true;
      console.log(
        `Summary: ${data.query_summary?.total_reviews ?? "?"} reviews · ${data.query_summary?.review_score_desc ?? ""}`
      );
    }
    const reviews = data.reviews ?? [];
    if (reviews.length === 0) break;
    const written = await upsertReviews(reviews);
    total += written;
    console.log(`  page ${page + 1}: +${written} reviews (total ${total})`);
    const next = data.cursor;
    if (!next || next === cursor) break;
    cursor = next;
    await new Promise((r) => setTimeout(r, 1200));
  }
  console.log(`Reviews done. Stored ${total}.`);
  return total;
}

if (import.meta.url === (await import("url")).pathToFileURL(process.argv[1]).href) {
  fetchAllReviews().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
