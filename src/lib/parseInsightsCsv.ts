export type CsvKind = "growth" | "audience" | "engagement" | "unknown";

export type ParsedAudience = {
  countries?: { name: string; value: number }[];
  devices?: { name: string; value: number }[];
  tenure?: { name: string; value: number }[];
  newToDiscord?: { name: string; value: number }[];
};

export type ParsedGrowth = {
  totalNewMembers?: number;
  totalNewChatters?: number;
  retentionPct?: number;
  daily?: { date: string; joins: number }[];
  topInvites?: { url: string; joins: number }[];
  topReferrers?: { domain: string; joins: number }[];
};

export type ParsedEngagement = {
  visitors?: number;
  communicators?: number;
  totalMessages?: number;
  voiceMinutes?: number;
  daily?: { date: string; messages: number; visitors: number }[];
  topTextChannels?: { name: string; readers: number; talkers: number; messages: number }[];
  topVoiceChannels?: { name: string; listeners: number; talkers: number }[];
  prunable7d?: number;
  prunable30d?: number;
};

export type ParseResult = {
  kind: CsvKind;
  data: ParsedAudience | ParsedGrowth | ParsedEngagement | Record<string, unknown>;
};

export function detectCsvKind(filename: string, headerLine: string): CsvKind {
  const f = filename.toLowerCase();
  const h = headerLine.toLowerCase();
  if (f.includes("audience") || h.includes("country") || h.includes("device")) return "audience";
  if (f.includes("growth") || h.includes("new_members") || h.includes("invite")) return "growth";
  if (f.includes("engagement") || h.includes("visitors") || h.includes("communicators")) return "engagement";
  return "unknown";
}

function parseCsvRows(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => splitCsvLine(line));
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === "," && !inQuote) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseCsv(filename: string, text: string): ParseResult {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return { kind: "unknown", data: {} };

  const header = rows[0].map((h) => h.toLowerCase());
  const kind = detectCsvKind(filename, header.join(","));

  if (kind === "audience") return { kind, data: parseAudience(rows, header) };
  if (kind === "growth") return { kind, data: parseGrowth(rows, header) };
  if (kind === "engagement") return { kind, data: parseEngagement(rows, header) };
  return { kind: "unknown", data: { rawRows: rows.length } };
}

function parseAudience(rows: string[][], header: string[]): ParsedAudience {
  const out: ParsedAudience = {};
  const countryIdx = header.findIndex((h) => h.includes("country"));
  const deviceIdx = header.findIndex((h) => h.includes("device"));
  const tenureIdx = header.findIndex((h) => h.includes("tenure") || h.includes("membership"));
  const newDiscordIdx = header.findIndex((h) => h.includes("discord_tenure") || h.includes("new_to_discord"));
  const valueIdx = header.findIndex((h) => h.includes("percent") || h.includes("value") || h.includes("%"));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const val = parseFloat(row[valueIdx] ?? row[1] ?? "0");
    if (isNaN(val)) continue;

    if (countryIdx >= 0 && row[countryIdx]) {
      out.countries = out.countries ?? [];
      out.countries.push({ name: row[countryIdx], value: val });
    }
    if (deviceIdx >= 0 && row[deviceIdx]) {
      out.devices = out.devices ?? [];
      out.devices.push({ name: row[deviceIdx], value: val });
    }
    if (tenureIdx >= 0 && row[tenureIdx]) {
      out.tenure = out.tenure ?? [];
      out.tenure.push({ name: row[tenureIdx], value: val });
    }
    if (newDiscordIdx >= 0 && row[newDiscordIdx]) {
      out.newToDiscord = out.newToDiscord ?? [];
      out.newToDiscord.push({ name: row[newDiscordIdx], value: val });
    }
  }
  return out;
}

function parseGrowth(rows: string[][], header: string[]): ParsedGrowth {
  const out: ParsedGrowth = {};
  const dateIdx = header.findIndex((h) => h.includes("date") || h.includes("day"));
  const joinsIdx = header.findIndex((h) => h.includes("join") || h.includes("new_member"));
  if (dateIdx >= 0 && joinsIdx >= 0) {
    out.daily = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const v = parseFloat(r[joinsIdx]);
      if (!isNaN(v)) out.daily.push({ date: r[dateIdx], joins: v });
    }
    out.totalNewMembers = out.daily.reduce((a, b) => a + b.joins, 0);
  }
  return out;
}

function parseEngagement(rows: string[][], header: string[]): ParsedEngagement {
  const out: ParsedEngagement = {};
  const dateIdx = header.findIndex((h) => h.includes("date") || h.includes("day"));
  const msgIdx = header.findIndex((h) => h.includes("message"));
  const visitorsIdx = header.findIndex((h) => h.includes("visitor"));
  if (dateIdx >= 0 && (msgIdx >= 0 || visitorsIdx >= 0)) {
    out.daily = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      out.daily.push({
        date: r[dateIdx],
        messages: parseFloat(r[msgIdx] ?? "0") || 0,
        visitors: parseFloat(r[visitorsIdx] ?? "0") || 0,
      });
    }
    out.totalMessages = out.daily.reduce((a, b) => a + b.messages, 0);
  }
  return out;
}
