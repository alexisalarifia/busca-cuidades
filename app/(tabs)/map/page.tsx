import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import type { Item } from "@/lib/types";
import MapView from "@/components/map-view";

export default async function MapPage() {
  const supabase = await createClient();
  const trip = await getActiveTrip(supabase);

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("trip_id", trip!.id)
    .not("lat", "is", null)
    .not("lng", "is", null);

  const { data: attachmentRows } = await supabase
    .from("attachments")
    .select("item_id")
    .eq("trip_id", trip!.id)
    .not("item_id", "is", null);

  const photoCounts: Record<string, number> = {};
  for (const row of attachmentRows ?? []) {
    const id = row.item_id as string;
    photoCounts[id] = (photoCounts[id] ?? 0) + 1;
  }

  return (
    <MapView
      items={(items as Item[]) ?? []}
      photoCounts={photoCounts}
      lodging={
        trip!.lodging_lat != null && trip!.lodging_lng != null
          ? { lat: trip!.lodging_lat, lng: trip!.lodging_lng }
          : null
      }
    />
  );
}
