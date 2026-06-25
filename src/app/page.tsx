import { Card } from "@/components/Card";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { BarList } from "@/components/charts/BarList";
import { ItemList } from "@/components/charts/ItemList";
import { Heatmap } from "@/components/charts/Heatmap";
import { CsvUploadCard } from "@/components/CsvUploadCard";
import { getLatestInsights } from "@/lib/getInsights";
import {
  discordNewMembersPerDay,
  discordMessagesPerDay,
  discordNewBugsPerWeek,
  discordNewIdeasPerWeek,
  discordMessagesByChannel,
  discordTopActive,
  discordTopReactions,
  discordLatestBugs,
  discordLatestIdeas,
  discordHeatmap,
  insightsCountries,
  insightsDevices,
  steamThreadsPerWeek,
  steamCommentsPerWeek,
  steamSubForumSplit,
  steamLastThreads,
  steamLastComments,
  steamTopHottest,
  steamTopPosters,
  steamPinned,
} from "@/lib/mockData";

export const dynamic = "force-dynamic";

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
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
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
      <h2 className="text-xl font-semibold text-zinc-100 tracking-wide">{title}</h2>
    </div>
  );
}

export default async function Dashboard() {
  const insights = await getLatestInsights();
  const countriesData =
    insights.audience?.countries && insights.audience.countries.length > 0
      ? insights.audience.countries
      : insightsCountries;
  const devicesData =
    insights.audience?.devices && insights.audience.devices.length > 0
      ? insights.audience.devices
      : insightsDevices;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold tracking-tight">Community Dashboard</div>
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
            <Card title="New members per day" hint="last 30 days">
              <LineChartCard data={discordNewMembersPerDay} color="#34d399" />
            </Card>
            <Card title="Messages per day" hint="last 30 days">
              <LineChartCard data={discordMessagesPerDay} color="#60a5fa" />
            </Card>
            <Card title="Messages by channel" hint="last 30 days, top 7">
              <BarChartCard data={discordMessagesByChannel} horizontal color="#60a5fa" />
            </Card>

            <Card title="New bugs per week" hint="from #sea-bugs">
              <BarChartCard data={discordNewBugsPerWeek} color="#f43f5e" />
            </Card>
            <Card title="New ideas per week" hint="from #your-ideas">
              <BarChartCard data={discordNewIdeasPerWeek} color="#a78bfa" />
            </Card>
            <Card title="Activity heatmap" hint="day × hour">
              <Heatmap grid={discordHeatmap} />
            </Card>

            <Card title="Top 5 active members" hint="by messages">
              <BarList data={discordTopActive} color="bg-emerald-500/70" />
            </Card>
            <Card title="Top 5 by reactions" hint="reactions received">
              <BarList data={discordTopReactions} color="bg-amber-500/70" />
            </Card>
            <Card title="Retention & activation">
              <div className="grid grid-cols-2 gap-3 h-full">
                <div className="rounded-lg bg-zinc-900/60 p-3 flex flex-col justify-center">
                  <div className="text-xs text-zinc-500 uppercase">Retention W1</div>
                  <div className="text-2xl font-semibold text-zinc-100 mt-1">40.1%</div>
                  <div className="text-xs text-emerald-400 mt-0.5">↑ +2.3%</div>
                </div>
                <div className="rounded-lg bg-zinc-900/60 p-3 flex flex-col justify-center">
                  <div className="text-xs text-zinc-500 uppercase">Activation</div>
                  <div className="text-2xl font-semibold text-zinc-100 mt-1">22.6%</div>
                  <div className="text-xs text-rose-400 mt-0.5">↓ −1.1%</div>
                </div>
              </div>
            </Card>

            <Card title="Latest bugs" hint="#sea-bugs">
              <ItemList
                items={discordLatestBugs.map((b) => ({
                  title: b.title,
                  subtitle: `by ${b.author}`,
                  meta: b.at,
                }))}
              />
            </Card>
            <Card title="Latest ideas" hint="#your-ideas">
              <ItemList
                items={discordLatestIdeas.map((b) => ({
                  title: b.title,
                  subtitle: `by ${b.author}`,
                  meta: b.at,
                }))}
              />
            </Card>
            <Card title="Notes">
              <div className="text-sm text-zinc-400 leading-relaxed">
                Дані оновлюються щогодини. Backfill історичних повідомлень виконано
                після підключення бота.
              </div>
            </Card>
          </div>

          <div className="mt-8">
            <div className="text-sm uppercase tracking-wide text-zinc-500 mb-3">
              CSV Insights — manual upload, weekly
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <CsvUploadCard lastUploadAt={insights.audienceUploadedAt ?? undefined} />
              <Card
                title="Countries"
                hint={insights.audience?.countries ? "from CSV" : "mocked"}
              >
                <PieChartCard data={countriesData} />
              </Card>
              <Card
                title="Devices"
                hint={insights.audience?.devices ? "from CSV" : "mocked"}
              >
                <PieChartCard data={devicesData} />
              </Card>
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
            <Card title="Threads per week" hint="last 8 weeks">
              <BarChartCard data={steamThreadsPerWeek} color="#34d399" />
            </Card>
            <Card title="Comments per week" hint="last 8 weeks">
              <BarChartCard data={steamCommentsPerWeek} color="#60a5fa" />
            </Card>
            <Card title="Sub-forum split" hint="active threads">
              <PieChartCard data={steamSubForumSplit} />
            </Card>

            <Card title="Last 5 threads">
              <ItemList
                items={steamLastThreads.map((t) => ({
                  title: t.title,
                  subtitle: `by ${t.author}`,
                  meta: t.at,
                }))}
              />
            </Card>
            <Card title="Last 5 comments">
              <ItemList
                items={steamLastComments.map((c) => ({
                  title: c.snippet,
                  subtitle: `by ${c.author}`,
                  meta: c.at,
                }))}
              />
            </Card>
            <Card title="Top 5 hottest" hint="by replies, last 30d">
              <ItemList
                items={steamTopHottest.map((t) => ({
                  title: t.title,
                  badge: `${t.replies} replies`,
                }))}
              />
            </Card>

            <Card title="Top 5 posters" hint="threads + comments">
              <BarList data={steamTopPosters} color="bg-blue-500/70" />
            </Card>
            <Card title="Pinned threads tracker" hint="active pins">
              <ItemList
                items={steamPinned.map((p) => ({
                  title: p.title,
                  subtitle: `by ${p.author}`,
                  badge: `${p.replies} replies`,
                }))}
              />
            </Card>
            <Card title="Avg time-to-first-reply" hint="last 30 days">
              <div className="grid grid-cols-2 gap-3 h-full">
                <div className="rounded-lg bg-zinc-900/60 p-3 flex flex-col justify-center">
                  <div className="text-xs text-zinc-500 uppercase">Any reply</div>
                  <div className="text-2xl font-semibold text-zinc-100 mt-1">3h 42m</div>
                </div>
                <div className="rounded-lg bg-zinc-900/60 p-3 flex flex-col justify-center">
                  <div className="text-xs text-zinc-500 uppercase">Dev reply</div>
                  <div className="text-2xl font-semibold text-zinc-100 mt-1">11h 8m</div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <footer className="text-center text-xs text-zinc-600 pt-8 pb-4">
          MVP scaffold · data is mocked · v0.2
        </footer>
      </main>
    </div>
  );
}
