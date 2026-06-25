"use client";

import { useState, useRef, DragEvent } from "react";
import { uploadInsightsCsv } from "@/app/actions/upload-csv";

export function CsvUploadCard({ lastUploadAt }: { lastUploadAt?: string }) {
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "uploading" }
    | { kind: "ok"; count: number; csvKind: string }
    | { kind: "err"; error: string }
  >({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function send(files: FileList | File[]) {
    if (!files || (files as FileList).length === 0) return;
    setStatus({ kind: "uploading" });
    const fd = new FormData();
    for (const f of Array.from(files as ArrayLike<File>)) fd.append("files", f);
    const res = await uploadInsightsCsv(fd);
    if (res.ok) setStatus({ kind: "ok", count: res.count, csvKind: res.kind });
    else setStatus({ kind: "err", error: res.error });
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    send(e.dataTransfer.files);
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 flex flex-col min-h-[220px] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="text-sm font-medium text-zinc-100 tracking-tight">Insights CSV</div>
        <div className="text-[11px] text-zinc-500 shrink-0">Growth / Audience / Engagement</div>
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex-1 grid place-content-center border-2 border-dashed rounded-xl p-4 text-center text-xs cursor-pointer transition ${
          dragOver
            ? "border-emerald-400/60 bg-emerald-400/[0.06] text-emerald-300"
            : "border-white/10 text-zinc-500 hover:border-white/20 hover:bg-white/[0.02]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files && send(e.target.files)}
        />
        <div className="text-2xl mb-2">📤</div>
        {status.kind === "idle" && (
          <>
            <div>Drop CSV files here</div>
            <div className="text-zinc-700 mt-1">or click to browse</div>
          </>
        )}
        {status.kind === "uploading" && <div>Uploading…</div>}
        {status.kind === "ok" && (
          <div className="text-emerald-400">
            ✓ Uploaded {status.count} file{status.count > 1 ? "s" : ""} ({status.csvKind})
          </div>
        )}
        {status.kind === "err" && (
          <div className="text-rose-400 break-words">✗ {status.error}</div>
        )}
      </div>
      {lastUploadAt && (
        <div className="text-[10px] text-zinc-600 mt-2">
          Last upload: {new Date(lastUploadAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
