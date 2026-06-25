import { ReactNode } from "react";

export function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 flex flex-col min-h-[220px] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.045] motion-reduce:transition-none">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="text-sm font-medium text-zinc-100 tracking-tight">{title}</div>
        {hint && <div className="text-[11px] text-zinc-500 shrink-0 tabular-nums">{hint}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
