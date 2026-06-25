import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const now = Date.now();
const d30 = new Date(now - 30 * 86400_000).toISOString();
const d90 = new Date(now - 90 * 86400_000).toISOString();

async function fetchAll() {
  const PAGE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("discord_messages")
      .select("channel_name, created_at")
      .eq("project_id", 1)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}
const allTime = await fetchAll();

const byChannel = {};
const byChannel30 = {};
const byChannel90 = {};
for (const m of allTime ?? []) {
  const c = m.channel_name || "(null)";
  byChannel[c] = (byChannel[c] ?? 0) + 1;
  if (m.created_at && new Date(m.created_at) >= new Date(d30)) byChannel30[c] = (byChannel30[c] ?? 0) + 1;
  if (m.created_at && new Date(m.created_at) >= new Date(d90)) byChannel90[c] = (byChannel90[c] ?? 0) + 1;
}

const sorted = Object.entries(byChannel).sort((a, b) => b[1] - a[1]);
console.log("Channel · all-time · last 90d · last 30d");
console.log("─".repeat(60));
for (const [ch, total] of sorted) {
  console.log(`${ch.padEnd(40)} ${String(total).padStart(5)} ${String(byChannel90[ch] ?? 0).padStart(6)} ${String(byChannel30[ch] ?? 0).padStart(5)}`);
}
console.log("─".repeat(60));
console.log(`TOTAL: ${allTime?.length ?? 0} messages, ${sorted.length} distinct channels`);
