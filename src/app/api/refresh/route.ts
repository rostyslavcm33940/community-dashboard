import { NextResponse } from "next/server";

const REPO = "rostyslavcm33940/community-dashboard";
const WORKFLOWS: Record<string, string> = {
  discord: "bot-backfill.yml",
  steam: "scraper.yml",
};

async function trigger(source: string | null | undefined) {
  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) return NextResponse.json({ error: "GH_DISPATCH_TOKEN not configured" }, { status: 500 });
  const file = source ? WORKFLOWS[source] : null;
  if (!file) return NextResponse.json({ error: "Unknown source" }, { status: 400 });

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${file}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `GitHub: ${res.status} ${text}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, source });
}

export async function POST(request: Request) {
  const { source } = (await request.json().catch(() => ({}))) as { source?: string };
  return trigger(source);
}

// Called by Vercel Cron. Vercel adds Authorization: Bearer <CRON_SECRET> when
// CRON_SECRET env is set, so we can verify the request came from Vercel.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const source = url.searchParams.get("source");
  return trigger(source);
}
