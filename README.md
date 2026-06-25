# Community Dashboard

Live: https://community-dashboard-gdqcghrf7-rostyslavcm33940s-projects.vercel.app

Multi-source community dashboard. v1 targets **Last Pirates: Die Together** — Discord server + Steam Discussions.

## Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Discord Bot  │    │ Steam        │    │ CSV Upload   │
│ (bot/)       │    │ Scraper      │    │ (web form)   │
│ Node + d.js  │    │ (scraper/)   │    │              │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                   ┌───────▼────────┐
                   │   Supabase     │
                   │   (Postgres)   │
                   └───────┬────────┘
                           │
                   ┌───────▼────────┐
                   │  Next.js       │
                   │  (Vercel)      │
                   │  src/          │
                   └────────────────┘
```

## Repo layout

```
.
├── src/                         Next.js dashboard (deployed to Vercel)
├── bot/                         Discord bot — separate Node service
├── scraper/                     Steam scraper — separate Node service
├── db/
│   ├── schema.sql               Core tables (projects, insights uploads)
│   ├── schema_bot.sql           Discord bot tables
│   └── schema_steam.sql         Steam scraper tables
└── .env.local.example           Frontend env template
```

## Setup checklist

In rough order:

1. **Supabase project** — already created (`ztxtoaogbbpkkvcqvorq.supabase.co`).
2. **Run migrations** — paste each `db/*.sql` into [SQL Editor](https://supabase.com/dashboard/project/ztxtoaogbbpkkvcqvorq/sql/new) and Run.
3. **Frontend env vars** — copy `.env.local.example` → `.env.local`, fill in keys from [API Keys](https://supabase.com/dashboard/project/ztxtoaogbbpkkvcqvorq/settings/api-keys).
4. **Vercel env vars** — same keys in [Vercel project settings](https://vercel.com/rostyslavcm33940s-projects/community-dashboard/settings/environment-variables).
5. **Discord bot** — see `bot/README.md`.
6. **Steam scraper** — see `scraper/README.md`.

## Local dev

```
npm install
npm run dev
# http://localhost:3000
```

Without Supabase env vars the dashboard runs on mocked data (still useful for UI work).

## Data sources

| Metric | Source |
|---|---|
| Members total / new / churn | Discord bot |
| Retention, activation | Discord bot (computed from join + first message) |
| Messages, top channels, top members | Discord bot |
| Bugs / ideas from #sea-bugs / #your-ideas | Discord bot |
| Heatmap activity | Discord bot |
| Countries, devices, visitors, mutes | CSV upload from Discord Insights |
| Steam threads, comments, dev-response % | Steam scraper |
| Pinned threads, sub-forum split | Steam scraper |
