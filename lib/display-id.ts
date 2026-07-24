import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/lib/types";

// Prefix map per brief §4 — extensible.
export const KIND_PREFIX: Record<string, string> = {
  museum: "MUS",
  gallery: "GAL",
  restaurant: "REST",
  cafe: "CAFE",
  street_food: "SF",
  bar: "BAR",
  market: "MKT",
  park: "PRK",
  landmark: "LND",
  concert: "CON",
  event: "EVT",
  hotel: "HTL",
  flight: "FLT",
  transit: "TRN",
  excursion: "EXC",
  dining: "DIN",
  other: "OTH",
};

export const KINDS = Object.keys(KIND_PREFIX);

// Default category for each kind, used when a pin or import gives us only a kind.
export const KIND_CATEGORY: Record<string, Category> = {
  museum: "ticket",
  gallery: "ticket",
  restaurant: "dining",
  cafe: "dining",
  street_food: "dining",
  bar: "dining",
  market: "excursion",
  park: "excursion",
  landmark: "excursion",
  concert: "ticket",
  event: "ticket",
  hotel: "accommodation",
  flight: "flight",
  transit: "transport",
  excursion: "excursion",
  dining: "dining",
  other: "note",
};

export function prefixForKind(kind: string): string {
  return KIND_PREFIX[kind] ?? "OTH";
}

// PREFIX-NNN, sequenced per kind per trip; race-safe via the
// display_id_counters upsert (see supabase/migrations/0001_core_schema.sql).
export async function nextDisplayId(
  supabase: SupabaseClient,
  tripId: string,
  kind: string
): Promise<string> {
  const { data, error } = await supabase.rpc("next_display_id", {
    p_trip_id: tripId,
    p_kind: kind,
    p_prefix: prefixForKind(kind),
  });
  if (error) throw new Error(`display id: ${error.message}`);
  return data as string;
}
