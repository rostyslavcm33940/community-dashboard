type Item = {
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  href?: string | null;
  avatarUrl?: string | null;
  avatarAlt?: string;
};

export function ItemList({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="text-sm">
          <div className="flex items-start justify-between gap-2">
            {it.href ? (
              <a
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-200 leading-snug truncate hover:text-emerald-400 transition-colors focus:outline-none focus-visible:text-emerald-400"
              >
                {it.title}
              </a>
            ) : (
              <span className="text-zinc-200 leading-snug truncate">{it.title}</span>
            )}
            {it.meta && (
              <span className="text-xs text-zinc-500 whitespace-nowrap">{it.meta}</span>
            )}
          </div>
          {(it.subtitle || it.badge || it.avatarUrl) && (
            <div className="flex items-center gap-2 mt-0.5">
              {it.avatarUrl && (
                <img
                  src={it.avatarUrl}
                  alt={it.avatarAlt ?? ""}
                  width={18}
                  height={18}
                  className="rounded-full bg-zinc-800 size-[18px] object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
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
