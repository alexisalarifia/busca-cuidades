import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { nextDisplayId } from "@/lib/display-id";
import { localToUtc } from "@/lib/time";
import { CDMX_TZ } from "@/lib/geocode";

// The one confirming tap (brief §7 step 5): commit the edited review card as a
// real item. Returns the new display_id so the client can offer its .ics.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trip = await getActiveTrip(supabase);
  if (!trip) return NextResponse.json({ error: "No active trip" }, { status: 400 });

  const b = await request.json().catch(() => ({}));
  const kind = String(b.kind || "other");
  const venueTz = String(b.venue_tz || CDMX_TZ);

  const startsAt = b.starts_at_local
    ? localToUtc(String(b.starts_at_local), venueTz)
    : null;
  const endsAt = b.ends_at_local ? localToUtc(String(b.ends_at_local), venueTz) : null;
  const purchaseTs = b.purchase_ts ? localToUtc(String(b.purchase_ts), venueTz) : null;
  const sourceIssuedAt = b.source_issued_at
    ? localToUtc(String(b.source_issued_at), venueTz)
    : null;

  const displayId = await nextDisplayId(supabase, trip.id, kind);

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      trip_id: trip.id,
      user_id: user.id,
      category: b.category || "note",
      kind,
      display_id: displayId,
      title: b.title || "Untitled",
      notes: b.notes || null,
      starts_at: startsAt,
      ends_at: endsAt,
      venue_tz: venueTz,
      lat: b.lat ?? null,
      lng: b.lng ?? null,
      address: b.venue_address || b.address || null,
      source_type: b.source_type || "paste",
      source_raw: b.source_raw || null,
      content_hash: b.content_hash || null,
      purchase_ts: purchaseTs,
      purchaser_contact: b.purchaser_contact || null,
      total_amount: b.total_amount ?? null,
      currency: b.currency || null,
      confirmation_code: b.confirmation_code || null,
      venue_name: b.venue_name || null,
      venue_address: b.venue_address || null,
      confidence: b.confidence ?? null,
      source_issued_at: sourceIssuedAt,
    })
    .select("id, display_id")
    .single();

  if (error) {
    // Dedupe collision surfaces as a friendly message, never a raw DB error.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already imported.", code: "duplicate" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: item.id, display_id: item.display_id });
}
