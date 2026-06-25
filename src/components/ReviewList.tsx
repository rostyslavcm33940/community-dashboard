import { ThumbsUp, ThumbsDown, Languages, ExternalLink, Bug } from "lucide-react";
import type { ReviewRow } from "@/lib/getStats";

export function ReviewList({ rows, kind }: { rows: ReviewRow[]; kind: "positive" | "negative" | "bug" }) {
  if (rows.length === 0) {
    return <div className="text-xs text-zinc-600">No reviews yet.</div>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={i} className="text-sm leading-snug">
          <div className="flex items-start gap-2">
            {kind === "positive" && <ThumbsUp className="size-3.5 text-emerald-400 shrink-0 mt-1" aria-hidden />}
            {kind === "negative" && <ThumbsDown className="size-3.5 text-rose-400 shrink-0 mt-1" aria-hidden />}
            {kind === "bug" && <Bug className="size-3.5 text-amber-400 shrink-0 mt-1" aria-hidden />}
            <div className="min-w-0 flex-1">
              <div className="text-zinc-200 line-clamp-3">{r.snippet}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 uppercase tracking-wide">{r.language}</span>
                <span>{r.at}</span>
                {r.mentionsBug && kind !== "bug" && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                    <Bug className="size-3" aria-hidden /> bug
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <a
                    href={r.translateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-zinc-300 transition-colors focus:outline-none focus-visible:text-zinc-100"
                  >
                    <Languages className="size-3" aria-hidden />
                    EN
                  </a>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-zinc-300 transition-colors focus:outline-none focus-visible:text-zinc-100"
                  >
                    <ExternalLink className="size-3" aria-hidden />
                    Steam
                  </a>
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
