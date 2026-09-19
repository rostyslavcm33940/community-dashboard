import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// The GitHub `schedule:` cron and cron-job.org both trigger these workflows, so
// runs arrive far more often than the data changes — and every run costs Supabase
// egress. Gate on the last completed run instead of on the trigger, which also
// makes the two schedules harmless no matter how they overlap.
//
// Returns false when the previous run is younger than `minMinutes`. On any error
// (including the project being restricted) it returns true: skipping should never
// be the thing that hides a real problem.
export async function shouldRun(source, minMinutes) {
  if (process.env.FORCE_RUN === "1") return true;
  try {
    const { data, error } = await supabase
      .from("system_runs")
      .select("ran_at")
      .eq("source", source)
      .order("ran_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data?.ran_at) return true;
    const ageMinutes = (Date.now() - new Date(data.ran_at).getTime()) / 60000;
    if (ageMinutes < minMinutes) {
      console.log(
        `Skipping ${source}: last run was ${Math.round(ageMinutes)}m ago (min interval ${minMinutes}m).`
      );
      return false;
    }
    return true;
  } catch {
    return true;
  }
}
