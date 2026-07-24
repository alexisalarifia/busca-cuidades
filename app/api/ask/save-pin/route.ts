import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { nextDisplayId, KIND_CATEGORY, KIND_PREFIX } from "@/lib/display-id";
import { geocode, CDMX_TZ } from "@/lib/geocode";

// Promote an ephemeral AI suggestion pin to a real item (brief §8): the pin
// itself was never a table row, so this geocodes and inserts.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trip = await getActiveTrip(supabase);
  if (!trip) return NextResponse.json({ error: "No active trip" }, { status: 400 });

  const b = await request.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "No name" }, { status: 400 });
  const kind = b.kind && b.kind in KIND_PREFIX ? String(b.kind) : "restaurant";

  const located =
    typeof b.lat === "number" && typeof b.lng === "number"
      ? { lat: b.lat, lng: b.lng, address: b.address ?? null }
      : await geocode(`${name}, Mexico City`);

  const displayId = await nextDisplayId(supabase, trip.id, kind);
  const { data: item, error } = await supabase
    .from("items")
    .insert({
      trip_id: trip.id,
      user_id: user.id,
      category: KIND_CATEGORY[kind] ?? "dining",
      kind,
      display_id: displayId,
      title: name,
      notes: b.why ?? null,
      address: located?.address ?? null,
      lat: located?.lat ?? null,
      lng: located?.lng ?? null,
      venue_tz: CDMX_TZ,
      source_type: "manual",
    })
    .select("display_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ display_id: item.display_id });
}
