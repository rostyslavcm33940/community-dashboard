"use server";

import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase/server";

export type SaveNoteResult = { ok: true } | { ok: false; error: string };

export async function saveThreadNote(threadUrl: string, note: string): Promise<SaveNoteResult> {
  if (!threadUrl) return { ok: false, error: "Missing thread URL" };
  try {
    const supabase = serverClient();
    const { error } = await supabase
      .from("steam_thread_notes")
      .upsert(
        { project_id: 1, thread_url: threadUrl, note: note.slice(0, 500), updated_at: new Date().toISOString() },
        { onConflict: "project_id,thread_url" }
      );
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
