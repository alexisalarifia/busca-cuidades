import { z } from "zod";
import { KINDS } from "@/lib/display-id";

// The extraction contract (brief §7 step 3). The model returns local wall-clock
// times as strings; we convert to UTC with venue_tz at commit time.
export const extractionSchema = z.object({
  category: z.enum([
    "flight",
    "ticket",
    "accommodation",
    "dining",
    "excursion",
    "transport",
    "note",
  ]),
  kind: z.string(),
  title: z.string().min(1),
  venue_name: z.string().nullable().optional(),
  venue_address: z.string().nullable().optional(),
  starts_at_local: z.string().nullable().optional(), // "YYYY-MM-DDTHH:mm"
  ends_at_local: z.string().nullable().optional(),
  venue_tz_guess: z.string().nullable().optional(),
  purchase_ts: z.string().nullable().optional(),
  purchaser_contact: z.string().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  confirmation_code: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
  notes: z.string().nullable().optional(),
  source_issued_at: z.string().nullable().optional(),
});

export type Extraction = z.infer<typeof extractionSchema>;

export const EXTRACTION_SYSTEM = `You extract structured travel-booking data from a pasted email, receipt, or web page for a trip to Mexico City.

Return ONLY a JSON object with these keys:
- category: one of flight | ticket | accommodation | dining | excursion | transport | note
- kind: a specific place/type slug, one of: ${KINDS.join(", ")}
- title: short human label (e.g. "Pujol" or "AM19 JFK→MEX")
- venue_name, venue_address: strings or null
- starts_at_local, ends_at_local: local wall-clock time as "YYYY-MM-DDTHH:mm" or null (never include a timezone offset)
- venue_tz_guess: IANA tz string, default "America/Mexico_City" or null
- purchase_ts: when the booking was made, "YYYY-MM-DDTHH:mm" or null
- source_issued_at: when the source document was issued/sent, "YYYY-MM-DDTHH:mm" or null
- purchaser_contact: email or phone of the buyer, or null
- total_amount: number (no currency symbol) or null
- currency: 3-letter code (e.g. MXN, USD) or null
- confirmation_code: string or null
- confidence: 0..1, your confidence in the overall extraction
- notes: one short line of anything useful that didn't fit, or null

Rules:
- Pick category by what it IS: a restaurant reservation → category "dining", kind "restaurant". A museum ticket → category "ticket", kind "museum". A hotel → category "accommodation", kind "hotel". A flight → category "flight", kind "flight".
- If a field is absent, use null. Never invent values. Lower your confidence when unsure.
- Times are wall-clock at the venue. Do not convert timezones. No "Z", no offsets.`;

export function extractionUserPrompt(source: string): string {
  return `Extract from this source:\n\n"""\n${source.slice(0, 8000)}\n"""`;
}
