const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  return (
    <div className="text-[10px] text-zinc-500">
      <div className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))] gap-[2px] items-center">
        <div />
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className="text-center">
            {h % 4 === 0 ? h : ""}
          </div>
        ))}
        {grid.map((row, day) => (
          <FragmentRow key={day} day={DAYS[day]} row={row} max={max} />
        ))}
      </div>
    </div>
  );
}

function FragmentRow({ day, row, max }: { day: string; row: number[]; max: number }) {
  return (
    <>
      <div className="text-zinc-500">{day}</div>
      {row.map((v, h) => {
        const ratio = v / max;
        const alpha = 0.08 + ratio * 0.92;
        return (
          <div
            key={h}
            className="aspect-square rounded-[2px]"
            style={{ background: `rgba(52, 211, 153, ${alpha.toFixed(2)})` }}
            title={`${day} ${h}:00 — ${v}`}
          />
        );
      })}
    </>
  );
}
