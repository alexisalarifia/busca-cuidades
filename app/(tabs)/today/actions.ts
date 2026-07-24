"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleVisited(itemId: string, visited: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("items").update({ visited }).eq("id", itemId);
  revalidatePath("/today");
  revalidatePath("/itinerary");
  revalidatePath("/map");
}
