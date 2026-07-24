"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { parsePlaces } from "@/lib/import-places";
import { contentHash } from "@/lib/hash";
import { geocode, CDMX_TZ } from "@/lib/geocode";
import { nextDisplayId, KIND_CATEGORY, KIND_PREFIX } from "@/lib/display-id";

export interface ImportState {
  error?: string;
  imported?: number;
  skipped?: number;
  unlocated?: number;
}

const IMPORT_CAP = 100;

export async function importPlaces(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const trip = await getActiveTrip(supabase);
  if (!user || !trip) return { error: "No active trip." };

  const file = formData.get("file");
  const pasted = String(formData.get("text") ?? "");
  const text =
    file instanceof File && file.size > 0 ? await file.text() : pasted;
  if (!text.trim()) return { error: "Paste an export or choose a file." };

  const kind = String(formData.get("kind") ?? "landmark");
  if (!(kind in KIND_PREFIX)) return { error: "Unknown kind." };

  const places = parsePlaces(text);
  if (places.length === 0) {
    return { error: "Couldn't find any places in that export." };
  }

  let imported = 0;
  let skipped = 0;
  let unlocated = 0;

  for (const place of places.slice(0, IMPORT_CAP)) {
    const hash = contentHash(
      `import|${place.name}|${place.address ?? ""}|${place.lat}|${place.lng}`
    );

    let { lat, lng, address } = place;
    if (lat == null || lng == null) {
      const located = await geocode(
        place.address ?? `${place.name}, Mexico City`
      );
      if (located) {
        lat = located.lat;
        lng = located.lng;
        address = address ?? located.address;
      } else {
        unlocated++;
      }
    }

    const displayId = await nextDisplayId(supabase, trip.id, kind);
    const { error } = await supabase.from("items").insert({
      trip_id: trip.id,
      user_id: user.id,
      category: KIND_CATEGORY[kind] ?? "excursion",
      kind,
      display_id: displayId,
      title: place.name,
      notes: place.note,
      address,
      lat,
      lng,
      venue_tz: CDMX_TZ,
      source_type: "manual",
      source_raw: place.raw,
      content_hash: hash,
    });

    if (error) {
      if (error.code === "23505") {
        skipped++; // already imported (dedupe index)
        continue;
      }
      return { error: `Import stopped: ${error.message}`, imported, skipped };
    }
    imported++;
  }

  revalidatePath("/map");
  return { imported, skipped, unlocated };
}

export async function archiveTrip(): Promise<void> {
  const supabase = await createClient();
  const trip = await getActiveTrip(supabase);
  if (trip) {
    await supabase.from("trips").update({ status: "archived" }).eq("id", trip.id);
  }
  redirect("/trip-gate");
}
