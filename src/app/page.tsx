import { Card } from "@/components/Card";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { BarList } from "@/components/charts/BarList";
import { ItemList } from "@/components/charts/ItemList";
import { Heatmap } from "@/components/charts/Heatmap";
import { CsvUploadCard } from "@/components/CsvUploadCard";
import { getLatestInsights } from "@/lib/getInsights";
import { getDashboardStats } from "@/lib/getStats";
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
  const [insights, stats] = await Promise.all([getLatestInsights(), getDashboardStats()]);
  const countriesData =
    insights.audience?.countries && insights.audience.countries.length > 0
      ? insights.audience.countries
      : insightsCountries;
  const devicesData =
    insights.audience?.devices && insights.audience.devices.length > 0
      ? insights.audience.devices
      : insightsDevices;

  const live = stats && stats.discord.members > 0;
  const d = stats?.discord;
  const s = stats?.steam;
  const fmtNum = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

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
            <KpiCard label="Members" value={live ? fmtNum(d!.members) : "920"} delta={live ? "live" : "demo"} trend={live ? "up" : "flat"} />
            <KpiCard label="Active" value={live ? fmtNum(d!.activeAuthors30d) : "108"} delta={live ? "30d" : "demo"} trend={live ? "up" : "flat"} />
            <KpiCard label="Messages" value={live ? fmtNum(d!.messages30d) : "1 548"} delta={live ? "30d" : "demo"} trend={live ? "up" : "flat"} />
            <KpiCard label="New members" value={live ? fmtNum(d!.newMembers30d) : "539"} delta={live ? "30d" : "demo"} trend={live ? "up" : "flat"} />
            <KpiCard label="New bugs" value={live ? fmtNum(d!.newBugs7d) : "3"} delta={live ? "7d" : "demo"} trend={live ? "up" : "flat"} />
            <KpiCard label="New ideas" value={live ? fmtNum(d!.newIdeas7d) : "5"} delta={live ? "7d" : "demo"} trend={live ? "up" : "flat"} />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="New members per day" hint={live ? "last 30 days" : "demo"}>
              <LineChartCard data={live && d!.newMembersPerDay.length > 0 ? d!.newMembersPerDay : discordNewMembersPerDay} color="#34d399" />
            </Card>
            <Card title="Messages per day" hint={live ? "last 30 days" : "demo"}>
              <LineChartCard data={live && d!.messagesPerDay.length > 0 ? d!.messagesPerDay : discordMessagesPerDay} color="#60a5fa" />
            </Card>
            <Card title="Messages by channel" hint={live ? "last 30 days, top 7" : "demo"}>
              <BarChartCard data={live && d!.messagesByChannel.length > 0 ? d!.messagesByChannel : discordMessagesByChannel} horizontal color="#60a5fa" />
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

            <Card title="Top 5 active members" hint={live ? "by messages, 30d" : "demo"}>
              <BarList data={live && d!.topActive.length > 0 ? d!.topActive : discordTopActive} color="bg-emerald-500/70" />
            </Card>
            <Card title="Top 5 by reactions" hint={live ? "reactions received, 30d" : "demo"}>
              <BarList data={live && d!.topReactions.length > 0 ? d!.topReactions : discordTopReactions} color="bg-amber-500/70" />
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

            <Card title="Latest bugs" hint={live ? "live" : "demo"}>
              <ItemList
                items={(live && d!.latestBugs.length > 0 ? d!.latestBugs : discordLatestBugs).map((b) => ({
                  title: b.title,
                  subtitle: `by ${b.author}`,
                  meta: b.at,
                }))}
              />
            </Card>
            <Card title="Latest ideas" hint={live ? "live" : "demo"}>
              <ItemList
                items={(live && d!.latestIdeas.length > 0 ? d!.latestIdeas : discordLatestIdeas).map((b) => ({
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
            <KpiCard label="Active threads" value={live ? fmtNum(s!.activeThreads) : "34"} delta={live ? "live" : "demo"} trend={live ? "up" : "flat"} />
            <KpiCard label="New threads (7d)" value={live ? fmtNum(s!.newThreads7d) : "4"} delta={live ? "live" : "demo"} trend={live ? "up" : "flat"} />
            <KpiCard label="New comments (7d)" value={live ? fmtNum(s!.newComments7d) : "28"} delta={live ? "live" : "demo"} trend={live ? "up" : "flat"} />
            <KpiCard label="Unanswered" value={live ? fmtNum(s!.unanswered) : "2"} delta={live ? "live" : "demo"} trend={live ? "flat" : "flat"} />
            <KpiCard label="Dev response %" value={live ? `${s!.devResponsePct}%` : "75%"} delta={live ? "7d" : "demo"} trend={live ? "up" : "flat"} />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Threads per week" hint="last 8 weeks">
              <BarChartCard data={steamThreadsPerWeek} color="#34d399" />
            </Card>
            <Card title="Comments per week" hint="last 8 weeks">
              <BarChartCard data={steamCommentsPerWeek} color="#60a5fa" />
            </Card>
            <Card title="Sub-forum split" hint={live ? "active threads" : "demo"}>
              <PieChartCard data={live && s!.subForumSplit.length > 0 ? s!.subForumSplit : steamSubForumSplit} />
            </Card>

            <Card title="Last 5 threads" hint={live ? "live" : "demo"}>
              <ItemList
                items={(live && s!.lastThreads.length > 0 ? s!.lastThreads : steamLastThreads).map((t) => ({
                  title: t.title,
                  subtitle: `by ${t.author}`,
                  meta: t.at,
                }))}
              />
            </Card>
            <Card title="Last 5 comments" hint={live ? "live" : "demo"}>
              <ItemList
                items={(live && s!.lastComments.length > 0 ? s!.lastComments : steamLastComments).map((c) => ({
                  title: c.snippet,
                  subtitle: `by ${c.author}`,
                  meta: c.at,
                }))}
              />
            </Card>
            <Card title="Top 5 hottest" hint={live ? "by replies" : "demo"}>
              <ItemList
                items={(live && s!.topHottest.length > 0 ? s!.topHottest : steamTopHottest).map((t) => ({
                  title: t.title,
                  badge: `${t.replies} replies`,
                }))}
              />
            </Card>

            <Card title="Top 5 posters" hint={live ? "by comments, 30d" : "demo"}>
              <BarList data={live && s!.topPosters.length > 0 ? s!.topPosters : steamTopPosters} color="bg-blue-500/70" />
            </Card>
            <Card title="Pinned threads tracker" hint={live ? "live" : "demo"}>
              <ItemList
                items={(live && s!.pinned.length > 0 ? s!.pinned : steamPinned).map((p) => ({
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
