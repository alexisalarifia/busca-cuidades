# Ingest pipeline

The core product loop (brief §7): a pasted booking or a URL becomes a
structured, editable review card that, on one tap, fans out into an itinerary
item + map pin + calendar file. This doc is the reference for how it works and
how to change it.

## Flow

```
"+" sheet (components/ingest-button.tsx)
  │  paste text  OR  paste URL
  ▼
POST /api/ingest  (app/api/ingest/route.ts) — extraction only, writes nothing
  │  1. URL → fetchReadable() strips HTML to text; paste → used as-is
  │  2. contentHash() = sha256 of normalized text
  │  3. dedupe: if an item in this trip already has that hash →
  │       { duplicate: true, display_id }   (short-circuits before any model call)
  │  4. chat() extraction, strict JSON, zod-validated (lib/extraction.ts)
  │       fails validation → retry once, feeding the error back
  │       still fails → { manual: true, source_raw }  (never a dead end)
  │  5. geocode(venue_address | venue_name+"Mexico City")
  ▼
Review card (same component) — every field editable; low-confidence geocode
  and unlocated addresses are flagged; three toggles (itinerary / pin /
  calendar) default on
  │  one tap: "Add to trip"
  ▼
POST /api/commit (app/api/commit/route.ts)
  │  assigns display_id via next_display_id() RPC
  │  converts local wall-clock times → UTC using venue_tz
  │  inserts the item (pin toggle off → no coords; itinerary off → no time)
  ▼
GET /api/ics/[id] — the item's .ics downloads if the calendar toggle was on
```

Nothing is written to the database until the confirming tap — `/api/ingest`
is pure extraction (brief §7 step 5).

## The extraction contract

Defined once in [lib/extraction.ts](../lib/extraction.ts): the zod schema, the
system prompt, and the user-prompt builder. The model returns **local
wall-clock** times as `"YYYY-MM-DDTHH:mm"` strings with no timezone; the
commit route converts them to UTC with the item's `venue_tz` (default
`America/Mexico_City`). This keeps timezone logic in one place
([lib/time.ts](../lib/time.ts)) and out of the prompt.

To add or change an extracted field: update the zod schema, the prompt's key
list, the `items` columns (a new migration), the review-card form, and the
commit route's insert. They must stay in lockstep.

## Model choice

Set in `.env.local` and on Vercel:

- `INFERENCE_MODEL` — `accounts/fireworks/models/gpt-oss-120b`. Chosen at
  build time by querying Fireworks' live catalog: it's the cheapest
  chat-capable model there that reliably returns strict JSON for booking
  extraction (verified against a real-style Spanish reservation email — it
  correctly inferred category/kind, parsed the date, and captured the
  confirmation code and amount). ~450 tokens per extraction, i.e. a fraction
  of a cent.
- `INFERENCE_MODEL_ESCALATE` — `accounts/fireworks/models/glm-5p2`. The
  larger model reserved for escalating low-confidence parses. The seam exists
  in [lib/llm.ts](../lib/llm.ts) (`chat({ escalate: true })`); wire it into
  the retry branch of `/api/ingest` if real bookings show the default model
  struggling on a class of inputs.

Both are config, not code. Re-check the catalog with
`GET {INFERENCE_BASE_URL}/models` (Bearer `INFERENCE_API_KEY`) before assuming
a model name still exists — Fireworks rotates its hosted set.

## The `.ics` generator

[lib/ics.ts](../lib/ics.ts), hand-written (~80 lines, no dependency per brief
§2). RFC 5545 with escaping and 75-octet line folding. One `VALARM` per event:
`-PT45M` default, `-PT3H` for flights (`category === "flight"`). Times are
emitted as UTC (`...Z`). Reused by the per-item route today and by
Today/Itinerary "Add to Calendar" and the export `trip.ics` (M4).

## Failure handling — never a dead end

- **Bad/empty URL fetch** → 422 with a readable message; the sheet stays open.
- **Model returns invalid JSON twice** → the card opens in manual mode with
  the raw source in notes, all fields blank and editable.
- **Model returns valid JSON for junk input** → a low-confidence note item
  (e.g. "No booking found", 20% sure); the user edits or backs out. Nothing
  is committed without the tap.
- **Duplicate paste** → "Already imported as [DISPLAY_ID]", no model call.
- **Commit hits the dedupe index** (race) → 409 surfaced as "Already
  imported", never a raw DB error.
