export type Point = { date: string; value: number };
export type MultiPoint = { date: string; [key: string]: number | string };

function pseudo(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function daySeries(days: number, base: number, variance: number, seed: number): Point[] {
  const rand = pseudo(seed);
  const out: Point[] = [];
  const today = new Date(2026, 5, 25);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const val = Math.max(0, Math.round(base + (rand() - 0.5) * variance * 2));
    out.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, value: val });
  }
  return out;
}

function weekSeries(weeks: number, base: number, variance: number, seed: number): Point[] {
  const rand = pseudo(seed);
  const out: Point[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const val = Math.max(0, Math.round(base + (rand() - 0.5) * variance * 2));
    out.push({ date: `W-${i === 0 ? "now" : i}`, value: val });
  }
  return out;
}

export const discordNewMembersPerDay = daySeries(30, 18, 15, 11);
export const discordMessagesPerDay = daySeries(30, 52, 30, 23);
export const discordNewBugsPerWeek = weekSeries(8, 3, 3, 31);
export const discordNewIdeasPerWeek = weekSeries(8, 5, 4, 41);

export const discordMessagesByChannel = [
  { name: "main-deck", value: 678 },
  { name: "crew-call", value: 295 },
  { name: "your-ideas", value: 58 },
  { name: "sea-bugs", value: 22 },
  { name: "shanty-theatre", value: 20 },
  { name: "announcements", value: 41 },
  { name: "carrier-parrots", value: 12 },
];

export const discordTopActive = [
  { name: "tiphix", value: 142 },
  { name: "BoiThePumpkin", value: 98 },
  { name: "_nAyK_", value: 76 },
  { name: "Lextao", value: 64 },
  { name: "silverSif", value: 51 },
];

export const discordTopReactions = [
  { name: "Lin_Mod", value: 87 },
  { name: "tiphix", value: 64 },
  { name: "cm.diana", value: 52 },
  { name: "Lextao", value: 38 },
  { name: "BoiThePumpkin", value: 29 },
];

export const discordLatestBugs = [
  { author: "BoiThePumpkin", title: "in game mob need nerf", at: "18 Jun" },
  { author: "BoiThePumpkin", title: "game starts but window doesn't appear", at: "17 Jun" },
  { author: "silverSif", title: "How to cancel the hand gesture??", at: "18 Jun" },
];

export const discordLatestIdeas = [
  { author: "Lextao", title: "At least try harder", at: "22 Jun" },
  { author: "tiphix", title: "game is ♥♥♥♥", at: "23 Jun" },
  { author: "_nAyK_", title: "Mouse invert Y ?", at: "22 Jun" },
];

export const discordHeatmap: number[][] = (() => {
  const rand = pseudo(99);
  const grid: number[][] = [];
  for (let day = 0; day < 7; day++) {
    const row: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const peakBoost = hour >= 17 && hour <= 22 ? 3 : 1;
      const weekendBoost = day === 5 || day === 6 ? 1.4 : 1;
      row.push(Math.round(rand() * 8 * peakBoost * weekendBoost));
    }
    grid.push(row);
  }
  return grid;
})();

export const insightsCountries = [
  { name: "Other", value: 64 },
  { name: "US", value: 25 },
  { name: "UA", value: 11 },
];

export const insightsDevices = [
  { name: "Desktop+Mobile", value: 58 },
  { name: "Desktop only", value: 29 },
  { name: "Mobile only", value: 8 },
  { name: "Other", value: 5 },
];

export const steamThreadsPerWeek = weekSeries(8, 4, 3, 51);
export const steamCommentsPerWeek = weekSeries(8, 28, 12, 61);

export const steamSubForumSplit = [
  { name: "General Discussions", value: 32 },
  { name: "Events & Announcements", value: 26 },
  { name: "Reported Posts", value: 2 },
  { name: "Trading", value: 0 },
];

export const steamLastThreads = [
  { title: "game is ♥♥♥♥♥", author: "tiphix", at: "23 Jun" },
  { title: "ищу тиму", author: "Lin_Mod", at: "22 Jun" },
  { title: "At least try harder", author: "Lextao", at: "22 Jun" },
  { title: "Mouse invert Y ?", author: "_nAyK_", at: "22 Jun" },
  { title: "How to cancel the hand gesture??", author: "silverSif", at: "18 Jun" },
];

export const steamLastComments = [
  { snippet: "Try verifying game files first…", author: "cm.diana", at: "23 Jun" },
  { snippet: "Same issue on my side", author: "BoiThePumpkin", at: "23 Jun" },
  { snippet: "Will be fixed in next patch", author: "cm.diana", at: "22 Jun" },
  { snippet: "Can you share your specs?", author: "Lin_Mod", at: "22 Jun" },
  { snippet: "thx for the report", author: "cm.diana", at: "21 Jun" },
];

export const steamTopHottest = [
  { title: "Last Pirates: Die Together - F.A.Q.", replies: 12 },
  { title: "Bug Reports & Technical Issues", replies: 6 },
  { title: "At least try harder", replies: 5 },
  { title: "Mouse invert Y ?", replies: 4 },
  { title: "in game mob need nerf", replies: 2 },
];

export const steamTopPosters = [
  { name: "cm.diana", value: 24 },
  { name: "BoiThePumpkin", value: 11 },
  { name: "tiphix", value: 7 },
  { name: "Lin_Mod", value: 5 },
  { name: "Lextao", value: 4 },
];

export const steamPinned = [
  { title: "Bug Reports & Technical Issues", replies: 6, author: "cm.diana" },
  { title: "Last Pirates: Die Together - F.A.Q.", replies: 12, author: "cm.diana" },
  { title: "Join the Official Last Pirates Discord Server!", replies: 0, author: "cm.diana" },
  { title: "Got Feedback or Crazy Idea? Share it with us!", replies: 0, author: "cm.diana" },
];
