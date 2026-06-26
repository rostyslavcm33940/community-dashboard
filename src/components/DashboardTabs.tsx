"use client";

import { useState, type ReactNode } from "react";
import { MessagesSquare, Gamepad2 } from "lucide-react";

type TabId = "discord" | "steam";

export function DashboardTabs({ discord, steam }: { discord: ReactNode; steam: ReactNode }) {
  const [tab, setTab] = useState<TabId>("discord");

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

  return (
    <>
      <div className="flex items-center gap-2 mb-8">
        {btn("discord", "Discord", MessagesSquare)}
        {btn("steam", "Steam", Gamepad2)}
      </div>
      <div>{tab === "discord" ? discord : steam}</div>
    </>
  );
}
