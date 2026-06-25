# Discord Bot — community-dashboard

Lives in `bot/`. Separate Node.js service. Writes Discord data to the same Supabase DB that the Next.js dashboard reads.

## Setup

### 1. Create a Discord application

1. https://discord.com/developers/applications → **New Application**.
2. Name: `Community Dashboard Bot` (anything you like).
3. Left sidebar → **Bot** → **Reset Token** → copy. Save it — this is `DISCORD_BOT_TOKEN`.
4. On the same Bot page, scroll to **Privileged Gateway Intents** and enable BOTH:
   - **Server Members Intent**
   - **Message Content Intent**
5. Left sidebar → **OAuth2** → **URL Generator**:
   - Scopes: `bot`
   - Bot permissions: `View Channels`, `Read Message History`
6. Copy generated URL → open in browser → choose your server → **Authorize**.

### 2. Add tables to Supabase

Open https://supabase.com/dashboard/project/ztxtoaogbbpkkvcqvorq/sql/new and run `db/schema_bot.sql` from the repo root.

### 3. Local run

```
cd bot
cp .env.example .env
# Fill in DISCORD_BOT_TOKEN and SUPABASE_SERVICE_ROLE_KEY in .env
npm install
npm start          # live event listener
npm run backfill   # one-time historical import
```

### 4. Deploy to Railway (recommended)

1. https://railway.app → sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → pick `community-dashboard`.
3. Settings → **Root Directory** = `bot`.
4. Variables tab → add the same vars from `.env.example`.
5. Settings → **Start Command** = `npm start`.

## What it does

- On startup: syncs all current channels and members into DB.
- Live: appends every new message, tracks joins/leaves.
- `npm run backfill`: fetches up to `BACKFILL_LIMIT` (default 5000) messages per tracked channel.

## Troubleshooting

- "Used disallowed intents" → re-check step 1.4 (intents enabled).
- "Missing access" on backfill → bot lacks View Channels permission in some category. Re-invite with full permissions or grant per channel.
- Slow backfill → Discord rate-limits to ~50 req/sec; this is expected.
