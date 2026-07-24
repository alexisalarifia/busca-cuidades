import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { buildZip, type ZipEntry } from "@/lib/zip";
import { buildIcs, type IcsEvent } from "@/lib/ics";
import type { Attachment, Item } from "@/lib/types";

// Export the active trip as a ZIP (brief §9): items.json (every field + all
// three traceability timestamps + raw source), trip.ics, photos/ originals,
// README.txt. Streamed inline; the client saves it.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trip = await getActiveTrip(supabase);
  if (!trip) return NextResponse.json({ error: "No active trip" }, { status: 400 });

  const enc = new TextEncoder();
  const entries: ZipEntry[] = [];

  const { data: itemsData } = await supabase
    .from("items")
    .select("*")
    .eq("trip_id", trip.id)
    .order("starts_at", { ascending: true, nullsFirst: false });
  const items = (itemsData as Item[]) ?? [];

  entries.push({
    name: "items.json",
    data: enc.encode(JSON.stringify({ trip, items }, null, 2)),
  });

  const events: IcsEvent[] = items
    .filter((i) => i.starts_at)
    .map((i) => ({
      uid: i.id,
      title: `${i.display_id} · ${i.title}`,
      startUtc: i.starts_at!,
      endUtc: i.ends_at,
      location: i.address ?? i.venue_address ?? null,
      description: i.notes ?? null,
      isFlight: i.category === "flight",
    }));
  entries.push({ name: "trip.ics", data: enc.encode(buildIcs(events)) });

  // Photos: download each original from the private bucket and store it.
  const { data: attachmentsData } = await supabase
    .from("attachments")
    .select("*")
    .eq("trip_id", trip.id);
  const attachments = (attachmentsData as Attachment[]) ?? [];

  let photoManifest = "";
  for (const a of attachments) {
    const { data: blob } = await supabase.storage.from("vault").download(a.storage_path);
    if (!blob) continue;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const filename = a.storage_path.split("/").pop() ?? `${a.id}`;
    entries.push({ name: `photos/${filename}`, data: bytes });
    photoManifest += `- photos/${filename}${a.caption ? ` — ${a.caption}` : ""}\n`;
  }

  const readme = [
    `BuscaCiudades export — ${trip.name}`,
    `${trip.starts_on} to ${trip.ends_on}`,
    ``,
    `items.json  Every itinerary item with all fields, including the three`,
    `            traceability timestamps (source_issued_at, ingested_at,`,
    `            starts_at) and the raw source text each was extracted from.`,
    `trip.ics    Every timed item as a calendar event with its alarm. Import`,
    `            into Apple/Google Calendar.`,
    `photos/     Your Vault originals, EXIF intact.`,
    ``,
    attachments.length ? `Photos:\n${photoManifest}` : `No photos in the Vault.`,
    ``,
    `Exported ${new Date().toISOString()}.`,
  ].join("\n");
  entries.push({ name: "README.txt", data: enc.encode(readme) });

  const zip = buildZip(entries);
  const safeName = trip.name.replace(/[^\w-]+/g, "-").toLowerCase();
  return new Response(new Uint8Array(zip) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="busca-${safeName}.zip"`,
    },
  });
}
