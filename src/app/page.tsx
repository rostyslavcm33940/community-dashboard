type KPI = {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
};

function KpiCard({ label, value, delta, trend }: KPI) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
      ? "text-rose-400"
      : "text-zinc-400";
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-zinc-100">{value}</div>
      {delta && (
        <div className={`mt-1 text-sm ${trendColor}`}>
          {arrow} {delta}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-5">
      <span className="text-2xl">{icon}</span>
      <h2 className="text-xl font-semibold text-zinc-100 tracking-wide">
        {title}
      </h2>
    </div>
  );
}

function Placeholder({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-6 min-h-[160px] flex flex-col">
      <div className="text-sm font-medium text-zinc-300">{title}</div>
      {hint && <div className="text-xs text-zinc-600 mt-1">{hint}</div>}
      <div className="mt-auto text-xs text-zinc-700">— chart coming —</div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold tracking-tight">
              Community Dashboard
            </div>
            <select
              className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
              defaultValue="last-pirates"
            >
              <option value="last-pirates">Last Pirates: Die Together</option>
              <option value="ok">OK</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
              defaultValue="30d"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-800">
              ↻ Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-12">
        <section>
          <SectionHeader icon="📊" title="Discord" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Members" value="920" delta="+12% vs prev" trend="up" />
            <KpiCard label="Active" value="108" delta="−3%" trend="down" />
            <KpiCard label="Messages" value="1 548" delta="+18%" trend="up" />
            <KpiCard label="New members" value="539" delta="+22%" trend="up" />
            <KpiCard label="New bugs" value="3" delta="−1" trend="down" />
            <KpiCard label="New ideas" value="5" delta="+2" trend="up" />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Placeholder title="New members per day" />
            <Placeholder title="Messages per day" />
            <Placeholder title="Messages by channel" />
            <Placeholder title="Activity heatmap" hint="day × hour" />
            <Placeholder title="Top 5 active members" />
            <Placeholder title="Top 5 by reactions" />
            <Placeholder title="Latest bugs (#sea-bugs)" />
            <Placeholder title="Latest ideas (#your-ideas)" />
            <Placeholder title="Retention week-1 / activation %" />
          </div>

          <div className="mt-6">
            <div className="text-sm uppercase tracking-wide text-zinc-500 mb-2">
              CSV Insights (manual upload, weekly)
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <Placeholder title="Drop Insights CSV here" hint="Growth / Audience / Engagement" />
              <Placeholder title="Countries" hint="UA 11% · US 25% · Other 64%" />
              <Placeholder title="Devices" hint="Desktop+Mobile 58% · Desktop 29% · Mobile 8%" />
              <Placeholder title="Visitors trend" />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon="🎮" title="Steam Discussions" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard label="Active threads" value="34" delta="+4" trend="up" />
            <KpiCard label="New threads (7d)" value="4" delta="+1" trend="up" />
            <KpiCard label="New comments (7d)" value="28" delta="+5" trend="up" />
            <KpiCard label="Unanswered" value="2" delta="0" trend="flat" />
            <KpiCard label="Dev response %" value="75%" delta="+10%" trend="up" />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Placeholder title="Threads per week" />
            <Placeholder title="Comments per week" />
            <Placeholder title="Sub-forum split" hint="General / Reported / Events / Trading" />
            <Placeholder title="Last 5 threads" />
            <Placeholder title="Last 5 comments" />
            <Placeholder title="Top 5 hottest threads" />
            <Placeholder title="Top 5 posters" />
            <Placeholder title="Pinned threads tracker" />
            <Placeholder title="Avg time-to-first-reply" />
          </div>
        </section>

        <footer className="text-center text-xs text-zinc-600 pt-8 pb-4">
          MVP scaffold · data is mocked · v0.1
        </footer>
      </main>
    </div>
  );
}
