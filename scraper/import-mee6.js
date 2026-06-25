import "dotenv/config";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ID = parseInt(process.env.PROJECT_ID || "1", 10);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const file = process.argv[2] || "mee6_snapshot.json";
const raw = fs.readFileSync(file, "utf-8").replace(/^﻿/, "");
const rows = JSON.parse(raw);

const payload = rows.map((r, i) => ({
  project_id: PROJECT_ID,
  username: r.u ?? r.username,
  rank: i + 1,
  messages: r.n ?? r.messages,
  xp: r.x ?? r.xp,
  level: r.l ?? r.level,
  taken_at: new Date().toISOString(),
}));

const { error } = await supabase
  .from("mee6_leaderboard")
  .upsert(payload, { onConflict: "project_id,username" });

if (error) {
  console.error("Insert failed:", error);
  process.exit(1);
}
console.log(`Imported ${payload.length} MEE6 leaderboard rows.`);
console.log("Top 5:");
payload.slice(0, 5).forEach((p) => console.log(`  ${p.rank}. ${p.username} — ${p.xp} XP, lvl ${p.level}, ${p.messages} msg`));
