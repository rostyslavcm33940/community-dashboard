type Item = {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
};

export function ItemList({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="text-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-zinc-200 leading-snug truncate">{it.title}</span>
            {it.meta && (
              <span className="text-xs text-zinc-500 whitespace-nowrap">{it.meta}</span>
            )}
          </div>
          {(it.subtitle || it.badge) && (
            <div className="flex items-center gap-2 mt-0.5">
              {it.subtitle && (
                <span className="text-xs text-zinc-500">{it.subtitle}</span>
              )}
              {it.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {it.badge}
                </span>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
