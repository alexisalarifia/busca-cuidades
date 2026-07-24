import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trip } from "@/lib/types";

export async function getActiveTrip(
  supabase: SupabaseClient
): Promise<Trip | null> {
  const { data } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Trip | null;
}
