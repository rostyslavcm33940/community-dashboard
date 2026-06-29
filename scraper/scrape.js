import "dotenv/config";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ID = parseInt(process.env.PROJECT_ID || "1", 10);
const FORUM_URL = process.env.STEAM_FORUM_URL;
const DEV_ACCOUNTS = (process.env.DEV_ACCOUNTS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const UA =
  "Mozilla/5.0 (CommunityDashboardScraper; contact: cm.rostyslav@retrostylegames.com)";

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.text();
}

function parseListingPage(html) {
  const $ = cheerio.load(html);
  const threads = [];

  $(".forum_topic").each((_, el) => {
    const $el = $(el);
    const linkEl = $el.find("a.forum_topic_overlay").first();
    const url = linkEl.attr("href");
    if (!url) return;
    const title = $el.find(".forum_topic_name").text().trim();
    const author = $el.find(".forum_topic_op").text().trim();
    const repliesText = $el.find(".forum_topic_reply_count").text().trim();
    const replies = parseInt(repliesText.replace(/[^\d]/g, ""), 10) || 0;
    const isPinned = $el.hasClass("forum_topic_sticky");
    const isLocked = $el.hasClass("forum_topic_locked");

    threads.push({
      thread_url: url,
      title,
      author,
      reply_count: replies,
      is_pinned: isPinned,
      is_locked: isLocked,
    });
  });

  const subForums = [];
  $(".forum_subforum a.subforum_name").each((_, el) => {
    const $el = $(el);
    const name = $el.text().trim();
    const count = parseInt(
      $el.parent().find(".subforum_count").text().replace(/[^\d]/g, ""),
      10
    );
    if (name) subForums.push({ name, threads: count || 0 });
  });

  return { threads, subForums };
}

async function parseThreadDetail(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const comments = [];

  $(".commentthread_comment").each((_, el) => {
    const $el = $(el);
    const id = $el.attr("id") || "";
    const author = $el.find(".commentthread_comment_author a.commentthread_author_link")
      .text()
      .trim();
    const content = $el.find(".commentthread_comment_text").text().trim();
    const ts = $el.find(".commentthread_comment_timestamp[data-timestamp]").attr("data-timestamp");
    const createdAt = ts ? new Date(parseInt(ts, 10) * 1000).toISOString() : null;
    const isDev = DEV_ACCOUNTS.includes(author.toLowerCase());

    comments.push({
      comment_url: `${url}#${id}`,
      author,
      content: content.slice(0, 5000),
      created_at: createdAt,
      is_dev_reply: isDev,
    });
  });

  const opTimestamp = $(".forum_op .commentthread_comment_timestamp[data-timestamp]").first().attr("data-timestamp");
  const createdAt = opTimestamp
    ? new Date(parseInt(opTimestamp, 10) * 1000).toISOString()
    : null;

  return { comments, createdAt };
}

async function upsertThread(t, createdAt, subForum) {
  const { data, error } = await supabase
    .from("steam_threads")
    .upsert(
      {
        project_id: PROJECT_ID,
        thread_url: t.thread_url,
        title: t.title,
        author: t.author,
        sub_forum: subForum,
        is_pinned: t.is_pinned,
        created_at: createdAt,
        reply_count: t.reply_count,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "thread_url" }
    )
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data?.id;
}

async function insertComments(threadId, comments) {
  if (!threadId || comments.length === 0) return;
  for (const c of comments) {
    await supabase
      .from("steam_comments")
      .upsert(
        { ...c, project_id: PROJECT_ID, thread_id: threadId },
        { onConflict: "comment_url" }
      );
  }
}

export async function scrape() {
  if (!FORUM_URL) throw new Error("STEAM_FORUM_URL is required");
  console.log(`Scraping ${FORUM_URL}`);
  const html = await fetchHtml(FORUM_URL);
  const { threads, subForums } = parseListingPage(html);
  console.log(`Found ${threads.length} threads, ${subForums.length} sub-forums`);

  for (const t of threads) {
    try {
      const detail = await parseThreadDetail(t.thread_url);
      const id = await upsertThread(t, detail.createdAt, "General Discussions");
      await insertComments(id, detail.comments);
      console.log(`  ✓ ${t.title.slice(0, 60)}  (${detail.comments.length} comments)`);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      console.warn(`  ✗ ${t.title}: ${e.message}`);
    }
  }

  await supabase.from("system_runs").insert({ source: "steam_scraper" });
  console.log("Scrape done.");
}

import { pathToFileURL } from "url";
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  scrape().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
