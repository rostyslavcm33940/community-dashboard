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
    <div className="group rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col min-h-[220px] shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/60 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] motion-reduce:transition-none">
      <div className="mb-3">
        <div className="text-sm font-medium text-zinc-200">{title}</div>
        {hint && <div className="text-xs text-zinc-500 mt-0.5">{hint}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
