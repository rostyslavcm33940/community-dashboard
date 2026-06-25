type Row = { name: string; value: number };

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
          <div className="flex items-center justify-between mb-1">
            <span className="text-zinc-300 truncate">{row.name}</span>
            <span className="text-zinc-500 tabular-nums">{row.value}</span>
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
