"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { nextDisplayId } from "@/lib/display-id";
import { geocode, CDMX_TZ } from "@/lib/geocode";
import { localToUtc } from "@/lib/time";

export interface TripGateState {
  error?: string;
}

export async function createTrip(
  _prev: TripGateState,
  formData: FormData
): Promise<TripGateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const name = String(formData.get("name") ?? "").trim() || "Mexico City";
  const startsOn = String(formData.get("starts_on") ?? "");
  const endsOn = String(formData.get("ends_on") ?? "");
  if (!startsOn || !endsOn) return { error: "Trip dates are required." };
  if (endsOn < startsOn) return { error: "The trip can't end before it starts." };

  const lodgingName = String(formData.get("lodging_name") ?? "").trim();
  const lodgingAddress = String(formData.get("lodging_address") ?? "").trim();

  const located = lodgingAddress ? await geocode(lodgingAddress) : null;

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      name,
      starts_on: startsOn,
      ends_on: endsOn,
      lodging_name: lodgingName || null,
      lodging_address: located?.address ?? (lodgingAddress || null),
      lodging_lat: located?.lat ?? null,
      lodging_lng: located?.lng ?? null,
    })
    .select()
    .single();
  if (tripError) return { error: `Couldn't create the trip: ${tripError.message}` };

  // Where you're staying → HTL pin (brief §6).
  if (lodgingName || lodgingAddress) {
    const displayId = await nextDisplayId(supabase, trip.id, "hotel");
    const { error } = await supabase.from("items").insert({
      trip_id: trip.id,
      user_id: user.id,
      category: "accommodation",
      kind: "hotel",
      display_id: displayId,
      title: lodgingName || "Lodging",
      address: located?.address ?? (lodgingAddress || null),
      lat: located?.lat ?? null,
      lng: located?.lng ?? null,
      venue_tz: CDMX_TZ,
      source_type: "manual",
    });
    if (error) return { error: `Trip created, but the lodging pin failed: ${error.message}` };
  }

  // Flight quick fields → FLT item (paste-a-confirmation lands with ingest).
  const flightNo = String(formData.get("flight_number") ?? "")
    .trim()
    .toUpperCase();
  const departsLocal = String(formData.get("flight_departs") ?? "");
  const origin = String(formData.get("flight_from") ?? "").trim().toUpperCase();
  const destination = String(formData.get("flight_to") ?? "").trim().toUpperCase();

  if (flightNo && departsLocal) {
    const displayId = await nextDisplayId(supabase, trip.id, "flight");
    const route =
      origin && destination ? ` ${origin}→${destination}` : "";
    const { error } = await supabase.from("items").insert({
      trip_id: trip.id,
      user_id: user.id,
      category: "flight",
      kind: "flight",
      display_id: displayId,
      title: `${flightNo}${route}`,
      starts_at: localToUtc(departsLocal, CDMX_TZ),
      venue_tz: CDMX_TZ,
      source_type: "manual",
      notes: "Added from the trip gate. Edit times if this flight doesn't depart Mexico City.",
    });
    if (error) return { error: `Trip created, but the flight failed: ${error.message}` };
  }

  redirect("/today");
}
