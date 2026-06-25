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
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { audience: null, audienceUploadedAt: null, hasDb: true };
    }
    return {
      audience: data.raw_data as ParsedAudience,
      audienceUploadedAt: data.uploaded_at,
      hasDb: true,
    };
  } catch {
    return { audience: null, audienceUploadedAt: null, hasDb: false };
  }
}
