import { serverClient } from "./supabase/server";
import type { ParsedAudience } from "./parseInsightsCsv";

export type LatestInsights = {
  audience: ParsedAudience | null;
  audienceUploadedAt: string | null;
  hasDb: boolean;
};

export async function getLatestInsights(): Promise<LatestInsights> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { audience: null, audienceUploadedAt: null, hasDb: false };
  }
  try {
    const supabase = serverClient();
    const { data, error } = await supabase
      .from("discord_insights_uploads")
      .select("csv_kind, raw_data, uploaded_at")
      .eq("project_id", 1)
      .eq("csv_kind", "audience")
      .order("uploaded_at", { ascending: false })
      .limit(12);

    if (error || !data || data.length === 0) {
      return { audience: null, audienceUploadedAt: null, hasDb: true };
    }

    // Country / platform / tenure often arrive as separate files. Merge them:
    // for each dimension take the newest upload that actually has it.
    const merged: ParsedAudience = {};
    for (const row of data) {
      const a = (row.raw_data ?? {}) as ParsedAudience;
      if (!merged.countries && a.countries?.length) merged.countries = a.countries;
      if (!merged.devices && a.devices?.length) merged.devices = a.devices;
      if (!merged.tenure && a.tenure?.length) merged.tenure = a.tenure;
      if (!merged.newToDiscord && a.newToDiscord?.length) merged.newToDiscord = a.newToDiscord;
    }
    return {
      audience: merged,
      audienceUploadedAt: data[0].uploaded_at,
      hasDb: true,
    };
  } catch {
    return { audience: null, audienceUploadedAt: null, hasDb: false };
  }
}
