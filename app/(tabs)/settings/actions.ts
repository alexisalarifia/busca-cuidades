"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";

export async function archiveTrip(): Promise<void> {
  const supabase = await createClient();
  const trip = await getActiveTrip(supabase);
  if (trip) {
    await supabase.from("trips").update({ status: "archived" }).eq("id", trip.id);
  }
  redirect("/trip-gate");
}
