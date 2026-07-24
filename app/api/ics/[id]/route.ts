import { createClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/ics";
import type { Item } from "@/lib/types";

// One item's .ics with its VALARM (brief §6). RLS scopes the select to the
// signed-in user, so no extra ownership check is needed.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  const item = data as Item | null;
  if (!item || !item.starts_at) {
    return new Response("Not found or untimed", { status: 404 });
  }

  const ics = buildIcs([
    {
      uid: item.id,
      title: `${item.display_id} · ${item.title}`,
      startUtc: item.starts_at,
      endUtc: item.ends_at,
      location: item.address ?? item.venue_address ?? null,
      description: item.notes ?? null,
      isFlight: item.category === "flight",
    },
  ]);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${item.display_id}.ics"`,
    },
  });
}
