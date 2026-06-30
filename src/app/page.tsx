import { Card } from "@/components/Card";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { BarList } from "@/components/charts/BarList";
import { ItemList } from "@/components/charts/ItemList";
import { CsvUploadCard } from "@/components/CsvUploadCard";
import { ReviewList } from "@/components/ReviewList";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { getLatestInsights } from "@/lib/getInsights";
import { getDashboardStats } from "@/lib/getStats";
import { DashboardControls } from "@/components/DashboardControls";
import { DashboardTabs } from "@/components/DashboardTabs";
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
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-4 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_8px_24px_-14px_rgba(0,0,0,0.7)] transition-all duration-200 hover:border-emerald-400/25 hover:from-white/[0.075] motion-reduce:transition-none">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</div>
        {Icon && <Icon className="size-4 text-zinc-600 transition-colors group-hover:text-emerald-400/80" aria-hidden />}
      </div>
      <div className="mt-2.5 text-[28px] leading-none font-semibold tracking-tight text-zinc-50 tabular-nums">{value}</div>
      {delta && (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="size-3.5" aria-hidden />
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="grid size-9 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
        <Icon className="size-5" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const sp = await searchParams;
  const range = [7, 30, 90].includes(Number(sp.range)) ? Number(sp.range) : 30;
  const [insights, stats] = await Promise.all([getLatestInsights(), getDashboardStats(range)]);
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
    <div className="min-h-screen text-zinc-200">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#06080c]/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-[#06080c] shadow-[0_0_18px_rgba(16,185,129,0.35)]">
              <MessagesSquare className="size-4" aria-hidden />
            </div>
            <div className="text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap">Community Dashboard</div>
            <span className="hidden md:inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 truncate">
              Last Pirates: Die Together
            </span>
          </div>
          <DashboardControls range={range} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-12">
        <DashboardTabs
          lastRuns={stats?.lastRuns ?? { discordBackfill: null, steamScraper: null, steamReviews: null }}
          discord={
        <section>
          <SectionHeader icon={MessagesSquare} title="Discord" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Members" value={live ? fmtNum(d!.members) : "920"} delta={live ? "live" : "demo"} trend={live ? "up" : "flat"} icon={Users} />
            <KpiCard label="Online now" value={live && d!.online !== null ? fmtNum(d!.online) : "—"} delta={live && d!.online !== null ? "live" : "no data yet"} trend={live && d!.online !== null ? "up" : "flat"} icon={Wifi} />
            <KpiCard label="Messages" value={live ? fmtNum(d!.messages30d) : "1 548"} delta={live ? `${range}d` : "demo"} trend={live ? "up" : "flat"} icon={MessageSquare} />
            <KpiCard label="New members" value={live ? fmtNum(d!.newMembers30d) : "539"} delta={live ? `${range}d` : "demo"} trend={live ? "up" : "flat"} icon={UserPlus} />
            <KpiCard label="New bugs" value={live ? fmtNum(d!.newBugs7d) : "3"} delta={live ? "7d" : "demo"} trend={live ? "up" : "flat"} icon={Bug} />
            <KpiCard label="New ideas" value={live ? fmtNum(d!.newIdeas7d) : "5"} delta={live ? "7d" : "demo"} trend={live ? "up" : "flat"} icon={Lightbulb} />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="New members per day" hint={live ? `last ${range} days` : "demo"}>
              <LineChartCard data={live && d!.newMembersPerDay.length > 0 ? d!.newMembersPerDay : discordNewMembersPerDay} color="#34d399" />
            </Card>
            <Card title="Messages per day" hint={live ? `last ${range} days` : "demo"}>
              <LineChartCard data={live && d!.messagesPerDay.length > 0 ? d!.messagesPerDay : discordMessagesPerDay} color="#60a5fa" />
            </Card>
            <Card title="Messages by channel" hint={live ? "all time, all channels" : "demo"}>
              <BarChartCard data={live && d!.messagesByChannel.length > 0 ? d!.messagesByChannel : discordMessagesByChannel} horizontal color="#60a5fa" />
            </Card>

            <Card title="New members per week" hint={live ? "last 8 weeks" : "demo"}>
              <BarChartCard data={live ? d!.newMembersPerWeek : discordNewMembersPerDay.slice(-8)} color="#34d399" />
            </Card>
            <Card title="New bugs per week" hint={live ? "last 8 weeks · #sea-bugs" : "demo · #sea-bugs"}>
              <BarChartCard data={live ? d!.newBugsPerWeek : discordNewBugsPerWeek} color="#f43f5e" />
            </Card>
            <Card title="New ideas per week" hint={live ? "last 8 weeks · #your-ideas" : "demo · #your-ideas"}>
              <BarChartCard data={live ? d!.newIdeasPerWeek : discordNewIdeasPerWeek} color="#a78bfa" />
            </Card>
            <Card title="Top 5 active members" hint={live ? `by messages, ${range}d` : "demo"}>
              <BarList data={live && d!.topActive.length > 0 ? d!.topActive : discordTopActive} color="bg-emerald-500/70" />
            </Card>
            <Card title="Top 5 by reactions" hint={live ? `reactions received, ${range}d` : "demo"}>
              <BarList data={live && d!.topReactions.length > 0 ? d!.topReactions : discordTopReactions} color="bg-amber-500/70" />
            </Card>
            <Card title="Retention & activation" hint="demo">
              <div className="grid grid-cols-2 gap-3 h-full">
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 flex flex-col justify-center">
                  <div className="text-xs text-zinc-500 uppercase">Retention W1</div>
                  <div className="text-2xl font-semibold text-zinc-100 mt-1">40.1%</div>
                  <div className="text-xs text-emerald-400 mt-0.5">↑ +2.3%</div>
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 flex flex-col justify-center">
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
                  href: ("href" in b ? b.href : null) as string | null,
                  avatarUrl: ("avatarUrl" in b ? b.avatarUrl : null) as string | null,
                  avatarAlt: b.author,
                }))}
              />
            </Card>
            <Card title="Latest ideas" hint={live ? "live" : "demo"}>
              <ItemList
                items={(live && d!.latestIdeas.length > 0 ? d!.latestIdeas : discordLatestIdeas).map((b) => ({
                  title: b.title,
                  subtitle: `by ${b.author}`,
                  meta: b.at,
                  href: ("href" in b ? b.href : null) as string | null,
                  avatarUrl: ("avatarUrl" in b ? b.avatarUrl : null) as string | null,
                  avatarAlt: b.author,
                }))}
              />
            </Card>
            <Card
              title="Top 10 by MEE6 XP"
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
                      {row.avatarUrl ? (
                        <img src={row.avatarUrl} alt="" width={20} height={20} className="rounded-full bg-zinc-800 size-5 object-cover" referrerPolicy="no-referrer" />
                      ) : null}
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
          }
          steam={
            <>
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
            <Card title="Threads per week" hint={live ? "last 8 weeks" : "last 8 weeks · demo"}>
              <BarChartCard data={live ? s!.threadsPerWeek : steamThreadsPerWeek} color="#34d399" />
            </Card>
            <Card title="Comments per week" hint={live ? "last 8 weeks" : "last 8 weeks · demo"}>
              <BarChartCard data={live ? s!.commentsPerWeek : steamCommentsPerWeek} color="#60a5fa" />
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
                  href: ("url" in t ? t.url : null) as string | null,
                }))}
              />
            </Card>
            <Card title="Last 5 comments" hint={live ? "live" : "demo"}>
              <ItemList
                items={(live && s!.lastComments.length > 0 ? s!.lastComments : steamLastComments).map((c) => ({
                  title: c.snippet,
                  subtitle: `by ${c.author}`,
                  meta: c.at,
                  href: ("url" in c ? c.url : null) as string | null,
                }))}
              />
            </Card>
            <Card title="Top 5 hottest" hint={live ? "by replies" : "demo"}>
              <ItemList
                items={(live && s!.topHottest.length > 0 ? s!.topHottest : steamTopHottest).map((t) => ({
                  title: t.title,
                  badge: `${t.replies} replies`,
                  href: ("url" in t ? t.url : null) as string | null,
                }))}
              />
            </Card>

            <Card title="Top 5 posters" hint={live ? `by comments, ${range}d` : "demo"}>
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
          </div>
        </section>

        {r && (
          <section>
            <SectionHeader icon={Star} title="Steam Reviews" />
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
              <Card title="Most useful positive" hint="last 30 days · by votes">
                <ReviewList rows={r.usefulPositive30d} kind="positive" />
              </Card>
              <Card title="Most useful negative" hint="last 30 days · by votes">
                <ReviewList rows={r.usefulNegative30d} kind="negative" />
              </Card>
            </div>
          </section>
        )}
            </>
          }
        />

        <footer className="text-center text-xs text-zinc-600 pt-8 pb-4">
          Community Dashboard · Retro Style Games
        </footer>
      </main>
    </div>
  );
}
