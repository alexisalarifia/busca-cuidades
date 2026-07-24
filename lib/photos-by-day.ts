import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attachment } from "@/lib/types";
import { CDMX_TZ } from "@/lib/geocode";

export interface DayPhoto {
  id: string;
  url: string;
  caption: string | null;
}

/**
 * Photos keyed by the venue-tz day they were taken (falling back to upload
 * time when a file carries no EXIF date). Lets the itinerary thicken with
 * real memories as the trip is lived, instead of staying the plan you made
 * beforehand. Signed URLs are batched — the vault bucket is private.
 */
export async function photosByDay(
  supabase: SupabaseClient,
  tripId: string,
  tz: string = CDMX_TZ
): Promise<Map<string, DayPhoto[]>> {
  const byDay = new Map<string, DayPhoto[]>();

  const { data } = await supabase
    .from("attachments")
    .select("*")
    .eq("trip_id", tripId)
    .order("taken_at", { ascending: true, nullsFirst: false });

  const rows = ((data as Attachment[]) ?? []).filter((a) =>
    a.mime.startsWith("image/")
  );
  if (rows.length === 0) return byDay;

  const { data: signed } = await supabase.storage
    .from("vault")
    .createSignedUrls(
      rows.map((r) => r.storage_path),
      3600
    );

  rows.forEach((row, i) => {
    const url = signed?.[i]?.signedUrl;
    if (!url) return;
    const stamp = row.taken_at ?? row.uploaded_at;
    const day = new Date(stamp).toLocaleDateString("sv-SE", { timeZone: tz });
    const list = byDay.get(day) ?? [];
    list.push({ id: row.id, url, caption: row.caption });
    byDay.set(day, list);
  });

  return byDay;
}
