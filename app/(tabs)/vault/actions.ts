"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateAttachment(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const caption = String(formData.get("caption") ?? "").trim();
  const itemId = String(formData.get("item_id") ?? "");
  if (!id) return;

  await supabase
    .from("attachments")
    .update({ caption: caption || null, item_id: itemId || null })
    .eq("id", id);

  revalidatePath("/vault");
  revalidatePath("/map");
}
