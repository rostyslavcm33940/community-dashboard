"use server";

import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/parseInsightsCsv";

export type UploadResult =
  | { ok: true; kind: string; count: number }
  | { ok: false; error: string };

export async function uploadInsightsCsv(formData: FormData): Promise<UploadResult> {
  const files = formData.getAll("files") as File[];
  if (!files || files.length === 0) {
    return { ok: false, error: "No files provided" };
  }

  try {
    const supabase = serverClient();
    let count = 0;
    let lastKind = "unknown";

    for (const file of files) {
      const text = await file.text();
      const parsed = parseCsv(file.name, text);
      lastKind = parsed.kind;

      const { error } = await supabase.from("discord_insights_uploads").insert({
        project_id: 1,
        csv_kind: parsed.kind,
        filename: file.name,
        raw_data: parsed.data,
      });

      if (error) {
        return { ok: false, error: `DB error: ${error.message}` };
      }
      count++;
    }

    revalidatePath("/");
    return { ok: true, kind: lastKind, count };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
