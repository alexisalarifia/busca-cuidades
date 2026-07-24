"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { nextDisplayId, KIND_CATEGORY } from "@/lib/display-id";
import { CDMX_TZ } from "@/lib/geocode";

export async function createManualPin(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const trip = await getActiveTrip(supabase);
  if (!user || !trip) return;

  const kind = String(formData.get("kind") ?? "other");
  const title = String(formData.get("title") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const displayId = await nextDisplayId(supabase, trip.id, kind);
  await supabase.from("items").insert({
    trip_id: trip.id,
    user_id: user.id,
    category: KIND_CATEGORY[kind] ?? "note",
    kind,
    display_id: displayId,
    title: title || kind.replace("_", " "),
    lat,
    lng,
    venue_tz: CDMX_TZ,
    source_type: "manual",
  });

  revalidatePath("/map");
}

export async function setVisited(itemId: string, visited: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("items").update({ visited }).eq("id", itemId);
  revalidatePath("/map");
  revalidatePath("/today");
}
