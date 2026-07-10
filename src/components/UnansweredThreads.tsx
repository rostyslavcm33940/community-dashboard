"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Check, Pencil } from "lucide-react";
import { saveThreadNote } from "@/app/actions/save-thread-note";

type Thread = { title: string; author: string; at: string; url: string | null; note: string | null };

function Row({ t }: { t: Thread }) {
  const [note, setNote] = useState(t.note ?? "");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function save() {
    if (!t.url) return;
    const res = await saveThreadNote(t.url, note);
    if (res.ok) {
      setSaved(true);
      setEditing(false);
      startTransition(() => router.refresh());
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert(`Save failed: ${res.error}`);
    }
  }

  return (
    <li className="text-sm border-b border-white/[0.05] pb-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        {t.url ? (
          <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-zinc-200 leading-snug hover:text-emerald-400 transition-colors inline-flex items-center gap-1">
            {t.title}
            <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
          </a>
        ) : (
          <span className="text-zinc-200 leading-snug">{t.title}</span>
        )}
        <span className="text-xs text-zinc-500 whitespace-nowrap">{t.at}</span>
      </div>
      {t.author && <div className="text-xs text-zinc-500 mt-0.5">by {t.author}</div>}

      {editing ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why wasn't it answered?"
            className="flex-1 rounded-md bg-white/[0.04] border border-white/[0.08] px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400/40"
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
            autoFocus
          />
          <button onClick={save} disabled={isPending} className="rounded-md bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50">
            Save
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          {saved ? <Check className="size-3 text-emerald-400" aria-hidden /> : <Pencil className="size-3" aria-hidden />}
          {note ? <span className="text-zinc-400 italic">“{note}”</span> : <span>add note</span>}
        </button>
      )}
    </li>
  );
}

export function UnansweredThreads({ threads }: { threads: Thread[] }) {
  if (threads.length === 0) {
    return <div className="text-xs text-zinc-600">No unanswered threads — all caught up. 🎉</div>;
  }
  return (
    <ul className="space-y-3">
      {threads.map((t, i) => <Row key={t.url ?? i} t={t} />)}
    </ul>
  );
}
