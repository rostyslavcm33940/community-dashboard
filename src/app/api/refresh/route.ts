import { NextResponse } from "next/server";

const REPO = "rostyslavcm33940/community-dashboard";

export async function POST(request: Request) {
  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GH_DISPATCH_TOKEN not configured" }, { status: 500 });
  }

  const { source } = (await request.json().catch(() => ({}))) as { source?: string };
  const workflows: Record<string, string> = {
    discord: "bot-backfill.yml",
    steam: "scraper.yml",
  };
  const file = source ? workflows[source] : null;
  if (!file) {
    return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  }

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
  return NextResponse.json({ ok: true });
}
