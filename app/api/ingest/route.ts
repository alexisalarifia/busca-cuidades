import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTrip } from "@/lib/trip";
import { chat } from "@/lib/llm";
import {
  extractionSchema,
  normalizeExtraction,
  EXTRACTION_SYSTEM,
  extractionUserPrompt,
  type Extraction,
} from "@/lib/extraction";
import { fetchReadable } from "@/lib/readable";
import { contentHash } from "@/lib/hash";
import { geocode, CDMX_TZ } from "@/lib/geocode";

// Ingest = extraction only. Nothing is written here (brief §7 step 5:
// "Nothing writes before this tap"). The client commits via /api/commit.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trip = await getActiveTrip(supabase);
  if (!trip) return NextResponse.json({ error: "No active trip" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const sourceType: "paste" | "url" = body.url ? "url" : "paste";

  let sourceRaw: string;
  try {
    sourceRaw = sourceType === "url" ? await fetchReadable(String(body.url)) : String(body.text ?? "");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Couldn't read that URL." },
      { status: 422 }
    );
  }
  if (!sourceRaw.trim()) {
    return NextResponse.json({ error: "Nothing to extract." }, { status: 400 });
  }

  // Dedupe against this trip before spending a model call (brief §4/§7).
  const hash = contentHash(sourceRaw);
  const { data: existing } = await supabase
    .from("items")
    .select("display_id")
    .eq("trip_id", trip.id)
    .eq("content_hash", hash)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { duplicate: true, display_id: existing.display_id },
      { status: 200 }
    );
  }

  // Extract, with one retry feeding the validation error back (brief §7 step 3).
  let extraction: Extraction | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < 2 && !extraction; attempt++) {
    try {
      const result = await chat({
        json: true,
        maxTokens: 700,
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM },
          { role: "user", content: extractionUserPrompt(sourceRaw) },
          ...(attempt === 1
            ? [
                {
                  role: "user" as const,
                  content: `Your previous JSON failed validation: ${lastError}. Return corrected JSON only.`,
                },
              ]
            : []),
        ],
      });
      const parsed = extractionSchema.safeParse(
        normalizeExtraction(JSON.parse(result.content))
      );
      if (parsed.success) {
        extraction = parsed.data;
      } else {
        lastError = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "parse error";
    }
  }

  // Never a dead end (brief §7): fall back to a manual-mode card with raw text.
  if (!extraction) {
    return NextResponse.json({
      manual: true,
      source_type: sourceType,
      source_raw: sourceRaw,
      content_hash: hash,
      error: lastError,
    });
  }

  // Geocode the venue (brief §7 step 4), flag low confidence for the card.
  const geoQuery =
    extraction.venue_address ||
    (extraction.venue_name ? `${extraction.venue_name}, Mexico City` : "");
  const located = geoQuery ? await geocode(geoQuery) : null;

  return NextResponse.json({
    source_type: sourceType,
    source_raw: sourceRaw,
    content_hash: hash,
    extraction,
    geo: located
      ? {
          lat: located.lat,
          lng: located.lng,
          address: located.address,
          confidence: located.confidence,
        }
      : null,
    venue_tz: extraction.venue_tz_guess || CDMX_TZ,
  });
}
