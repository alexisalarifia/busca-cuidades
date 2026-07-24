import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";

// Active-trip payload for the offline snapshot (brief §10). Client stores this
// in IndexedDB on each load.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trip = await getActiveTrip(supabase);
  if (!trip) return NextResponse.json({ trip: null, items: [] });

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("trip_id", trip.id)
    .order("starts_at", { ascending: true, nullsFirst: false });

  return NextResponse.json({ trip, items: items ?? [], snapshot_at: new Date().toISOString() });
}
