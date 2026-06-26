type Row = { name: string; value: number; avatarUrl?: string | null };

export function BarList({
  data,
  color = "bg-emerald-500/70",
}: {
  data: Row[];
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((row) => (
        <div key={row.name} className="text-sm">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {row.avatarUrl && (
                <img
                  src={row.avatarUrl}
                  alt=""
                  width={18}
                  height={18}
                  className="rounded-full bg-zinc-800 size-[18px] object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-zinc-300 truncate">{row.name}</span>
            </div>
            <span className="text-zinc-500 tabular-nums shrink-0">{row.value}</span>
          </div>
          <div className="h-1.5 rounded bg-zinc-800 overflow-hidden">
            <div
              className={`${color} h-full rounded`}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
