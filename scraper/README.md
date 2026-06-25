# Steam Discussions Scraper — community-dashboard

Lives in `scraper/`. Scrapes a Steam Community discussions page on a cron schedule and writes threads/comments to the same Supabase DB.

## Setup

### 1. Add tables to Supabase

Run `db/schema_steam.sql` in the SQL editor.

### 2. Local run

```
cd scraper
cp .env.example .env
# Fill in SUPABASE_SERVICE_ROLE_KEY
npm install
npm run once    # single run, useful for testing
npm start       # runs on cron schedule
```

### 3. Deploy to Railway

Same project as the bot — add a new service:

1. In your Railway project → **+ New** → **GitHub Repo** → same repo.
2. Settings → **Root Directory** = `scraper`.
3. Variables tab → add the same vars from `.env.example`.
4. Settings → **Start Command** = `npm start`.

## What it does

- Fetches `STEAM_FORUM_URL` every `CRON_EXPRESSION` (default every 10 min).
- Parses thread listings (title, author, reply count, pinned status).
- For each thread, fetches detail page and extracts comments.
- Flags comments from `DEV_ACCOUNTS` as `is_dev_reply = true`.
- Upserts everything — re-running is idempotent.

## Notes

- Respects ~1.5s delay between thread detail fetches (polite scraping).
- No authentication — only public data.
- User-Agent identifies us so Steam can contact us if there's an issue.
- HTML structure may change; if scraping breaks, update selectors in `scrape.js`.
