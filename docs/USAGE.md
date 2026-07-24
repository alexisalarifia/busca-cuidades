# Using BuscaCiudades

A screen-by-screen guide. Features marked with a milestone (M2–M4) aren't
live yet; everything else works today.

## Signing in

The landing page has the login form and, below it, the "Top things to do in
Mexico City" module (M4 — currently a placeholder frame). Only the allowed
email can create the account or sign in; anyone else sees "Signups are
closed." First signup sends a confirmation email — tap the link, then sign
in. The session persists; your phone's lock is the second factor.

## The trip gate

On first login (and after archiving a trip) you get one screen with three
groups — about ninety seconds:

1. **When** — trip name and first/last day.
2. **Where you're staying** — lodging name + address. The address is
   geocoded and becomes your `HTL-001` pin on the map automatically.
3. **Flight, if you have it** — quick fields (flight number, airports,
   departure time) create a `FLT-001` itinerary item. Pasting a full
   confirmation email arrives with M3 — if the flight doesn't depart from
   Mexico City, edit its time zone later.

Everything is optional except the dates. **Start the trip** creates the trip
and drops you on Today.

## Tabs

The bottom bar: **Today · Map · Itinerary · Ask · Vault**. The pink **+**
button floats above the bar on every tab — ingest is an act, not a place.

### Today

Date header plus chronological cards for the current day, times shown in the
venue's time zone, each with its display ID. Quick actions (mark visited,
Add to Calendar, open pin) arrive with M4's full version.

### Map (M2)

Category-colored pins with icon glyphs; visited = filled, planned = outline.
Tap a pin for its card (title, ID, time, notes, photo count, visited toggle,
directions handoff to Apple/Google Maps). Long-press to drop a manual pin —
choose a kind, the display ID assigns itself. Layer toggles: saved /
visited / AI suggestions.

### Itinerary (M4)

Grouped by day across the trip range. Each timed item has **Add to
Calendar** — an `.ics` with a built-in alert (45 minutes before, 3 hours for
flights). Empty days get one quiet line.

### Ask (M4)

The grounded concierge. Chips with fill-in slots — "Top rated {restaurants}
near me", "Propose a {morning} in {Roma Norte} prioritizing {food}", "One
thing Reddit says I shouldn't miss in {Coyoacán}" — plus a freeform box.
Every answer comes from live search fed to the model and shows its source
count and retrieval date. Answers can drop suggestion pins (dashed, on the
map's AI layer); **Save** on any pin promotes it to a real itinerary item.
Location is read only when you explicitly tap the location chip, never in
the background. Rate-limited server-side; the counter is in Settings.

### Vault (M2)

Private photo/document grid. Upload from the camera roll; each entry shows
when it was taken (EXIF, when present) and uploaded, an optional caption,
and can link to an itinerary item. Originals are downloadable. The bucket is
private — everything is served via short-lived signed URLs.

## The + button — adding to the trip (M3)

Tap **+** anywhere → paste a booking email or a URL → the app extracts the
details into a **review card** where every field is editable. Three toggles
(itinerary / pin / calendar file) default on where applicable. Nothing is
saved until you tap **Add to trip** — that one tap creates the item, the
pin, and offers the `.ics`. Pasting the same booking twice gets you "Already
imported as [ID]", not a duplicate.

## Settings

Gear icon on the Today header: signed-in email, Ask usage this hour,
**Export trip** (M4 — ZIP with `items.json`, `trip.ics`, original photos,
and a README; plus the print-styled trip book at `/trip-book`), **Archive
this trip** (ends the trip, returns to the gate for the next one), and
**Sign out**.

## Offline

The app shell is cached; from M4 the active trip snapshots to the device so
Today, Itinerary, and Map render read-only in airplane mode with a quiet
banner. Changes require a connection — the server is the source of truth.

## Installing on the iPhone

Open the production URL in Safari → share sheet → **Add to Home Screen**.
The app runs full-screen with its own icon, indistinguishable from a native
app on the home screen.
