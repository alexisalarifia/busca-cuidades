# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person — the owner — travelling to a city and living out of their phone
while there. Literally one account: the signup path and a database trigger
both reject any address except `ALLOWED_USER_EMAIL`. There is no second role,
no sharing, no collaboration, no multi-tenancy.

The two scenes that dominate real use, confirmed by the owner:

1. **On foot, mid-trip, one-handed.** Walking the city, phone in one hand,
   bright daylight, unreliable data. Wants to know what is next and where it
   is without stopping.
2. **In transit — metro, taxi, airport.** Retrieving exactly one fact under
   bad conditions: the confirmation code, the address to show a driver, the
   gate time.

Planning at a desk before the trip and ingesting bookings in the evening both
happen, but they are not the scenes to optimize against.

A second person may eventually be shown the trip book or the landing page.
Nothing is built for them, but neither should embarrass the owner when shown.

## Product Purpose

Collapse the scattered debris of a trip — booking emails, confirmation URLs,
saved Google Maps pins, photos — into one trip-scoped record that answers
"what's next, where is it, and what's the code" instantly.

The core loop: paste a booking email or a URL → an LLM extracts structured
fields → an editable review card → **one tap** creates an itinerary item, a
map pin, and a calendar file with a native alert.

Success is that during the trip the owner opens nothing else, and after the
trip the export is a complete, honest archive of where they went.

## Positioning

Three mechanisms a neighboring travel app could not truthfully copy:

- **One tap fans out to three effects.** The confirming tap on the review card
  simultaneously creates the itinerary item, the map pin, and the `.ics` with
  its alarm. Competitors make these three separate acts in three products.
- **Everything carries a display ID.** `MUS-003`, `REST-014`, `FLT-001` —
  a per-kind, per-trip sequence issued by the database. The same ID appears on
  the card, the pin, the calendar block, and the exported book. It is the
  product's spine, not decoration.
- **Audience of one, so nothing is generalized.** No onboarding funnel, no
  settings for other people's preferences, no account management. Every screen
  can assume it knows exactly whose trip this is.

Positioned against: general note apps (no structure), calendar apps (no place),
Google Maps lists (no time), and trip apps that want an account and a network.

## Operating Context

- **Installable web app (PWA)**, added to the iPhone home screen, opened
  full-screen. iPhone width is the design target; it is not a native app and
  should not imitate one.
- **One active trip at a time.** A trip gate runs on first login and after each
  archive: dates, lodging (geocoded into an `HTL` pin), flight. Roughly ninety
  seconds — the brief calls it "a ritual, not a form."
- **The map is home** (owner ruling, 24 Jul 2026, supersedes the Today-first
  shell): the app opens to the map — "a satellite for everything around you."
  All imported and created pins are the ground layer; the day's itinerary is
  incorporated on the map as the current thread through it; Ask is reachable
  in that context, so the owner can ask personalized questions about what is
  around them without leaving the view. Today/Itinerary, Ask, Vault, and
  Settings remain as surfaces, but they support the map rather than compete
  with it. Not yet implemented in the shell — the code still opens to Today.
- **Ingest is an act, not a place** — a persistent "+" floats above the tab
  bar on every surface.
- **Times are stored UTC and rendered in the venue's timezone.** Every item
  carries an IANA `venue_tz`. A timestamp is never shown without one.
- **Three traceability timestamps** ride every item and every export row:
  when the source document was issued, when it entered the app, when the event
  happens.
- **Offline is expected, not exceptional.** The active trip snapshots to the
  device; Today, Itinerary, and Map render read-only in airplane mode behind
  one quiet banner.
- **Trip end** offers archive + export, then reopens the gate for the next trip.

## Capabilities and Constraints

Shipped and working (all four milestones):

- Ingest pipeline — paste/URL → server extraction → review card → commit.
  Nothing is written before the confirming tap; `/api/commit` is the only
  write path. Duplicate pastes surface "Already imported as [ID]".
- Mapbox map with category-colored pins, visited states, layer toggles, and
  long-press manual pins.
- Google Maps list importer (CSV / KML / GeoJSON).
- Today and Itinerary views; per-item `.ics` with alarms (45 min default,
  3 h for flights).
- Ask — a grounded concierge. Every answer runs live search server-side and
  returns with a source count and retrieval date. Rate-limited server-side.
  No fake typing animation: skeleton, then the complete answer.
- Private photo/document Vault (private bucket, short-lived signed URLs).
- Export ZIP — `items.json`, `trip.ics`, original photos with EXIF intact,
  a README — plus `/trip-book`, a print-styled route the owner prints to PDF
  through the Safari share sheet.

Technical constraints that bind design:

- **Next.js App Router (v16), React 19, Tailwind CSS 4, TypeScript strict.**
  Tailwind 4 is CSS-first: the theme map lives in `app/globals.css` under
  `@theme inline`, not a config file.
- **The whole app re-skins through one seam**: `design/tokens.css`. Components
  consume Tailwind classes that resolve from those custom properties. Only
  `components/map-view.tsx` and `components/item-card.tsx` read `var(--c-*)`
  inline.
- **Minimal dependencies, deliberately.** No ORM, no state library, no charting
  library, no component kit. Anything saving less than a day gets written by
  hand. A visual system that needs a component library cannot ship here.
- **No runtime third-party fonts, no analytics, no trackers.** Any typeface
  must be self-hosted and licensed for it.
- **Category is functional data**, not styling: seven categories (flight,
  accommodation, dining, excursion, ticket, transport, note) must be readable
  at a glance on pins, card edges, and calendar blocks.
- **No test framework** (deliberate — audience of one). Verification is
  `npm run build` plus hand/agent-driven browser checks.

Explicitly undecided, and not to be invented:

- Whether the app ever supports more than one active trip. Assume not.
- Whether dark mode ships. The previous brief said light-only at launch; that
  ruling is released and open, and the confirmed usage scenes (bright street,
  dark metro) argue both sides.

## Brand Commitments

- **Name: BuscaCiudades.** Kept.
- **Voice: quiet, short, active, sentence case.** No exclamation marks, no
  emoji, no confetti, no streaks, no badges, no nag states. A control says what
  happens — "Add to trip", "Mark visited", "Export trip" — and keeps that name
  through the entire flow. Errors state what happened and how to fix it; they
  never apologize and are never vague. Empty states are one line plus one
  action, never mood pieces.
- **Tabular numerals on every number and timestamp.** Already implemented as a
  `.tnum` class; the behavior is binding regardless of typeface.
- **Display IDs are a designed element**, carried identically across pins,
  cards, calendar blocks, and the trip book.

**Released as of this session** — the owner is starting the visual system
fresh and nothing from the earlier Claude Design prototype carries over. The
following were rulings in the previous brief and are **no longer binding**:
the Barragán / Casa Gilardi north star, rosa mexicano `#E4007C` as the accent,
warm plaster `#FAF7F2` as the ground, the Lance Wyman / CDMX Metro pictogram
lineage, hard offset shadows, Archivo as the typeface, and light-mode-only.
The current `design/tokens.css` is scaffolding, not incumbent authority.

**One answer supersedes that whole thesis:** the visual system must survive a
city swap. Mexico City is instance one, not the subject. Identity therefore
cannot be built out of CDMX-specific material — no Mexican architecture, no
Metro glyph lineage, no rosa mexicano as the load-bearing accent. The token
system keeps a per-city seam (`city`, `palette`, `motif`, glyph accents,
prompt seeds); the identity must live above it.

## Evidence on Hand

Real, in hand:

- **Real place data** — the owner's own Google Maps list exports at
  `iCloud/BuscaCiudades/buscaciudades-handoff/maps-lists/` (~30 CSVs including
  `CDMX.csv`, `PLACES 4 TRIP.csv`, `MUSEUMS.csv`, `Favorite places.csv`).
  Use these for realistic content; do not invent place names.
- **A working deployment** at `https://busca-ciudades.vercel.app`, and a full
  local app to design against.
- **The build brief** at
  `iCloud/BuscaCiudades/LOOK_HERE_FOR_CONTEXT_LLMS/v1/infrastructure/` — the
  functional contract. It is kept out of the repo because it contains live
  keys. Its product rulings stand; its §14 token block does not.
- **A private reference image set** at
  `iCloud/BuscaCiudades/LOOK_HERE_FOR_CONTEXT_LLMS/images/` — Barragán
  interiors, CDMX streetscapes, Metro signage. Licensed for private reference
  only. **Never ship these images**; the Metro glyphs and Wyman marks are
  protected identity.

Absences that must not be fabricated: there are no users besides the owner,
no testimonials, no usage metrics, no press, no pricing, no company. Nothing
should imply any of these exist.

## Product Principles

1. **One tap does the work of three.** Every flow is measured by how much it
   collapses. Adding a step is a regression.
2. **The street is the test.** If it cannot be read one-handed, in sunlight,
   while walking, it does not work — no matter how it looks on a desktop.
3. **Nothing writes before the confirming tap.** The review card is the gate.
   Trust in the ingest loop is the whole product.
4. **Every fact carries its provenance.** Source, ingestion time, event time,
   timezone, and source count are shown as ordinary content, never as fine
   print, and never faked.
5. **Silence is the default state.** The app volunteers little, decorates
   nothing, and earns attention only when something is actually next.
6. **The map is the situation.** The home view is the satellite: everything
   saved, everything planned, and everything askable, oriented around where
   the owner is standing right now.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast, verified on the actual background — not assumed.
- Touch targets ≥ 44×44 pt; the primary scene is one-handed and in motion.
- Visible focus states; `prefers-reduced-motion` respected.
- Must remain legible in direct sunlight and readable at large dynamic type
  sizes.
