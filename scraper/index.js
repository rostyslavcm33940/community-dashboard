import "dotenv/config";
import cron from "node-cron";
import { scrape } from "./scrape.js";

const expr = process.env.CRON_EXPRESSION || "*/10 * * * *";

console.log(`Scheduler started. Cron: ${expr}`);
scrape().catch((e) => console.error("First scrape failed:", e));

cron.schedule(expr, () => {
  console.log(`[${new Date().toISOString()}] Running scrape…`);
  scrape().catch((e) => console.error("Scrape failed:", e));
});
