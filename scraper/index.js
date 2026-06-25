import "dotenv/config";
import cron from "node-cron";
import { scrape } from "./scrape.js";
import { fetchAllReviews } from "./reviews.js";

const expr = process.env.CRON_EXPRESSION || "*/10 * * * *";
const reviewsExpr = process.env.REVIEWS_CRON_EXPRESSION || "0 */1 * * *";

console.log(`Scheduler started. Forum cron: ${expr}  ·  Reviews cron: ${reviewsExpr}`);

async function runAll() {
  await scrape().catch((e) => console.error("Scrape failed:", e));
  await fetchAllReviews().catch((e) => console.error("Reviews failed:", e));
}

runAll();

cron.schedule(expr, () => {
  console.log(`[${new Date().toISOString()}] Running forum scrape…`);
  scrape().catch((e) => console.error("Scrape failed:", e));
});

cron.schedule(reviewsExpr, () => {
  console.log(`[${new Date().toISOString()}] Running reviews fetch…`);
  fetchAllReviews().catch((e) => console.error("Reviews failed:", e));
});
