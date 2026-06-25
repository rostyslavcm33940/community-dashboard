import { Card } from "@/components/Card";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { BarList } from "@/components/charts/BarList";
import { ItemList } from "@/components/charts/ItemList";
import { Heatmap } from "@/components/charts/Heatmap";
import { CsvUploadCard } from "@/components/CsvUploadCard";
import { ReviewList } from "@/components/ReviewList";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { getLatestInsights } from "@/lib/getInsights";
import { getDashboardStats } from "@/lib/getStats";
import {
  Users,
  Wifi,
  MessageSquare,
  UserPlus,
  Bug,
  Lightbulb,
  MessagesSquare,
  Gamepad2,
  Star,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";
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

import type { LucideIcon } from "lucide-react";

type KPI = {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: LucideIcon;
};

function KpiCard({ label, value, delta, trend, icon: Icon }: KPI) {
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
      ? "text-rose-400"
      : "text-zinc-400";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className="group rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] focus-within:ring-2 focus-within:ring-emerald-500/40 motion-reduce:transition-none">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
        {Icon && <Icon className="size-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" aria-hidden />}
      </div>
      <div className="mt-2 text-3xl font-semibold text-zinc-100 tabular-nums">{value}</div>
      {delta && (
        <div className={`mt-1 flex items-center gap-1 text-sm ${trendColor}`}>
          <TrendIcon className="size-3.5" aria-hidden />
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-5">
      <Icon className="size-6 text-zinc-400" aria-hidden />
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
  const r = stats?.reviews ?? null;
  const fmtNum = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold tracking-tight">Community Dashboard</div>
            <select
              className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 cursor-pointer transition-colors hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              defaultValue="last-pirates"
            >
              <option value="last-pirates">Last Pirates: Die Together</option>
              <option value="ok">OK</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 cursor-pointer transition-colors hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              defaultValue="30d"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-200 cursor-pointer transition-colors hover:bg-zinc-800 hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
              <RefreshCw className="size-3.5" aria-hidden /> Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-12">
        <section>
          <SectionHeader icon={MessagesSquare} title="Discord" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Members" value={live ? fmtNum(d!.members) : "920"} delta={live ? "live" : "demo"} trend={live ? "up" : "flat"} icon={Users} />
            <KpiCard label="Online now" value={live && d!.online !== null ? fmtNum(d!.online) : "—"} delta={live && d!.online !== null ? "live" : "no data yet"} trend={live && d!.online !== null ? "up" : "flat"} icon={Wifi} />
            <KpiCard label="Messages" value={live ? fmtNum(d!.messages30d) : "1 548"} delta={live ? "30d" : "demo"} trend={live ? "up" : "flat"} icon={MessageSquare} />
            <KpiCard label="New members" value={live ? fmtNum(d!.newMembers30d) : "539"} delta={live ? "30d" : "demo"} trend={live ? "up" : "flat"} icon={UserPlus} />
            <KpiCard label="New bugs" value={live ? fmtNum(d!.newBugs7d) : "3"} delta={live ? "7d" : "demo"} trend={live ? "up" : "flat"} icon={Bug} />
            <KpiCard label="New ideas" value={live ? fmtNum(d!.newIdeas7d) : "5"} delta={live ? "7d" : "demo"} trend={live ? "up" : "flat"} icon={Lightbulb} />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="New members per day" hint={live ? "last 30 days" : "demo"}>
              <LineChartCard data={live && d!.newMembersPerDay.length > 0 ? d!.newMembersPerDay : discordNewMembersPerDay} color="#34d399" />
            </Card>
            <Card title="Messages per day" hint={live ? "last 30 days" : "demo"}>
              <LineChartCard data={live && d!.messagesPerDay.length > 0 ? d!.messagesPerDay : discordMessagesPerDay} color="#60a5fa" />
            </Card>
            <Card title="Messages by channel" hint={live ? "all time, all channels" : "demo"}>
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
            <Card
              title="Top 5 by MEE6 XP"
              hint={
                live && d!.topXp.length > 0 && d!.topXpTakenAt
                  ? `snapshot · ${new Date(d!.topXpTakenAt).toLocaleDateString()}`
                  : "no MEE6 data yet"
              }
            >
              {live && d!.topXp.length > 0 ? (
                <ul className="space-y-2.5 text-sm">
                  {d!.topXp.map((row, i) => (
                    <li key={row.name} className="flex items-center gap-2">
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-zinc-200">{row.name}</span>
                      <span className="text-xs text-zinc-500 tabular-nums">lvl {row.level}</span>
                      <span className="text-xs text-zinc-400 tabular-nums w-16 text-right">
                        {row.xp.toLocaleString("en-US").replace(/,/g, " ")} XP
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-zinc-600">MEE6 leaderboard not yet imported.</div>
              )}
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
          <SectionHeader icon={Gamepad2} title="Steam Discussions" />
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

        {r && (
          <section>
            <SectionHeader icon={Star} title="Steam Reviews (Demo)" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <KpiCard label="Total reviews" value={fmtNum(r.total)} delta={r.scoreDesc} trend="flat" icon={Star} />
              <KpiCard label="Positive" value={fmtNum(r.positive)} delta={`${r.positivePct}%`} trend="up" icon={ThumbsUp} />
              <KpiCard label="Negative" value={fmtNum(r.negative)} delta={`${100 - r.positivePct}%`} trend="down" icon={ThumbsDown} />
              <KpiCard label="Bug mentions (7d)" value={fmtNum(r.bugMentions7d)} delta={`${r.bugMentionsAll} all-time`} trend={r.bugMentions7d > 0 ? "down" : "flat"} icon={Bug} />
              <KpiCard label="Score" value={r.scoreDesc} delta="live" trend="flat" icon={Star} />
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Reviews per day" hint="last 90 days, stacked">
                <StackedBarChart data={r.perDay} />
              </Card>
              <Card title="Bug-mention reviews" hint={`${r.bugMentionsAll} total · keyword scan`}>
                <ReviewList rows={r.lastBugMentions} kind="bug" />
              </Card>

              <Card title="Last 5 positive" hint="newest first">
                <ReviewList rows={r.lastPositive} kind="positive" />
              </Card>
              <Card title="Last 5 negative" hint="newest first">
                <ReviewList rows={r.lastNegative} kind="negative" />
              </Card>
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-zinc-600 pt-8 pb-4">
          MVP scaffold · data is mocked · v0.2
        </footer>
      </main>
    </div>
  );
}
