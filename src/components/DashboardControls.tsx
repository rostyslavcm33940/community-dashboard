"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

const selectCls =
  "rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 cursor-pointer transition-colors hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-60";

export function DashboardControls({ range }: { range: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setRange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    startTransition(() => router.push(`/?${params.toString()}`, { scroll: false }));
  }

  return (
    <div className="flex items-center gap-3">
      <select
        className={selectCls}
        value={String(range)}
        onChange={(e) => setRange(e.target.value)}
        aria-label="Time range"
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
      </select>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 cursor-pointer transition-colors hover:bg-zinc-800 hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-60"
      >
        <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} aria-hidden /> Refresh
      </button>
    </div>
  );
}
