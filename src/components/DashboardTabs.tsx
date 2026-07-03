"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare, Gamepad2, RefreshCw, Check } from "lucide-react";

type TabId = "discord" | "steam";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function DashboardTabs({
  discord,
  steam,
  lastRuns,
}: {
  discord: ReactNode;
  steam: ReactNode;
  lastRuns: { discordBackfill: string | null; steamScraper: string | null; steamReviews: string | null };
}) {
  const [tab, setTab] = useState<TabId>("discord");
  const [isPending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState<TabId | null>(null);
  const [ok, setOk] = useState<TabId | null>(null);
  const router = useRouter();

  async function refresh(source: TabId) {
    setRefreshing(source);
    setOk(null);
    try {
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source }),
      });
      if (res.ok) {
        setOk(source);
        startTransition(() => router.refresh());
        setTimeout(() => setOk(null), 4000);
      } else {
        const j = await res.json().catch(() => ({}));
        alert(`Refresh failed: ${j.error ?? res.status}`);
      }
    } catch (e) {
      alert(`Refresh failed: ${(e as Error).message}`);
    } finally {
      setRefreshing(null);
    }
  }

  const btn = (id: TabId, label: string, Icon: typeof MessagesSquare) =>
    tab === id ? (
      <button
        key={id}
        onClick={() => setTab(id)}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors"
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </button>
    ) : (
      <button
        key={id}
        onClick={() => setTab(id)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </button>
    );

  const ago = tab === "discord" ? timeAgo(lastRuns.discordBackfill) : timeAgo(lastRuns.steamScraper);
  const refreshDisabled = refreshing !== null || isPending;
  const showCheck = ok === tab;

  return (
    <>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {btn("discord", "Discord", MessagesSquare)}
        {btn("steam", "Steam", Gamepad2)}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-zinc-500">updated {ago}</span>
          <button
            onClick={() => refresh(tab)}
            disabled={refreshDisabled}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={tab === "discord" ? "Re-run Discord backfill" : "Re-run Steam scraper"}
          >
            {showCheck ? (
              <>
                <Check className="size-3.5 text-emerald-400" aria-hidden />
                queued
              </>
            ) : (
              <>
                <RefreshCw className={`size-3.5 ${refreshing === tab ? "animate-spin" : ""}`} aria-hidden />
                refresh
              </>
            )}
          </button>
        </div>
      </div>
      <p className="text-xs text-zinc-600 mb-6">
        Background jobs run automatically · Steam every 15 min · Discord hourly · or hit refresh anytime
      </p>
      <div>{tab === "discord" ? discord : steam}</div>
    </>
  );
}
