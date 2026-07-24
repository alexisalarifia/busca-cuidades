import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import type { Attachment, Item } from "@/lib/types";
import VaultGrid, { type VaultEntry } from "@/components/vault-grid";

export default async function VaultPage() {
  const supabase = await createClient();
  const trip = await getActiveTrip(supabase);

  const [{ data: attachments }, { data: items }] = await Promise.all([
    supabase
      .from("attachments")
      .select("*")
      .eq("trip_id", trip!.id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("items")
      .select("id, display_id, title")
      .eq("trip_id", trip!.id)
      .order("display_id"),
  ]);

  const rows = (attachments as Attachment[]) ?? [];

  // Short-lived signed URLs (brief §5): the bucket is private.
  const paths = rows.map((a) => a.storage_path);
  const { data: signed } = paths.length
    ? await supabase.storage.from("vault").createSignedUrls(paths, 3600)
    : { data: [] };

  const entries: VaultEntry[] = rows.map((a, i) => ({
    ...a,
    url: signed?.[i]?.signedUrl ?? null,
  }));

  return (
    <VaultGrid
      entries={entries}
      tripId={trip!.id}
      items={(items as Pick<Item, "id" | "display_id" | "title">[]) ?? []}
    />
  );
}
