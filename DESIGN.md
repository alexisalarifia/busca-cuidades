---
name: BuscaCiudades
description: A map-first travel instrument — real satellite terrain under quiet editorial chrome, one live blue for everything actionable.
colors:
  white: "#FFFFFF"
  ink: "#141414"
  ink-muted: "#75726C"
  stone: "#F4F3F0"
  hairline: "rgba(20,20,20,0.14)"
  live: "#2B3FD6"
  c-flight: "#41527A"
  c-accommodation: "#9A5B2E"
  c-dining: "#2E8557"
  c-excursion: "#C99017"
  c-ticket: "#2F6B52"
  c-transport: "#55606B"
  c-note: "#6E6A64"
typography:
  display:
    fontFamily: "-apple-system, 'Helvetica Neue', Helvetica, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 300
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, 'Helvetica Neue', Helvetica, system-ui, sans-serif"
    fontSize: "27px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.022em"
  title:
    fontFamily: "-apple-system, 'Helvetica Neue', Helvetica, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "-apple-system, 'Helvetica Neue', Helvetica, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, 'Helvetica Neue', Helvetica, system-ui, sans-serif"
    fontSize: "9px"
    fontWeight: 600
    letterSpacing: "0.18em"
  micro:
    fontFamily: "-apple-system, 'Helvetica Neue', Helvetica, system-ui, sans-serif"
    fontSize: "8px"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  none: "0px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.live}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  fab:
    backgroundColor: "{colors.live}"
    textColor: "{colors.white}"
    rounded: "{rounded.full}"
    size: "52px"
  plate:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
---

<!--
DIRECTION CONTRACT (impeccable new-work; seed keys 93a8667d → ac3dc3b9;
user-selected and then user-evolved across three rounds. Rejected: analog
costume worlds (security print, split-flap, survey sheet); achromatic
Ivory; next-location-framed map camera).

THESIS: The map is home — real satellite terrain of wherever the owner is
standing, under quiet editorial chrome. Hierarchy in the chrome is type
scale and space; color belongs to the world (imagery), to data (category
pins), and to exactly one live blue that marks everything actionable.
OWN-WORLD: photographic terrain ground; square white plates with hairline
borders floating over it; one grotesque; glyph pins ringed in white; live
blue #2B3FD6.
STORY: The owner opens the app, sees where they are and what's saved around
them, asks about it, and the one upcoming thing waits quietly in a calendar
box under the date.
FIRST VIEWPORT (Map home): masthead plates top; upcoming box + ETA row
under the day chip; glyph pins and the you-ring on terrain; console below
with "You're in [neighborhood]", the Ask field, and chips; blue "+"
straddling the console edge.
FORM: user-directed fusion — Ivory chrome (round-two pick) over satellite
terrain with a committed live color.

Values verified on iPhone 17 Pro simulator against approved samples
(scratchpad samples g/h). Re-run /impeccable document after the app is
re-skinned to carbonize build adjustments.
-->

# Design System: BuscaCiudades

## Overview

**Creative North Star: "The Satellite Console"**

BuscaCiudades opens on the world itself: real satellite terrain, centered
on the owner, with everything they've saved pinned to it in an obvious
glyph language. The interface is a set of quiet white plates — square,
hairline-bordered, editorially typeset — floating over that photography.
Nothing decorative competes with the imagery; the chrome's job is to be
instantly legible against any ground the planet provides.

One blue (#2B3FD6) is the live layer: the next thing, the "+", the Ask
affordance, the active tab, engaged toggles, the you-dot. Category hues
exist only as data on pins. Everything else is ink on white.

The camera never leaves the owner by default. The upcoming item is
represented, not framed: it arrives as a banner and settles into a small
calendar box under the date chip. With nothing upcoming, the console
invites inquiry about what's around. City-agnostic by construction — the
imagery, neighborhoods, and pins are data; the system never ships
city-specific material.

**Key Characteristics:**
- Photographic terrain ground; white plates carry all text
- One grotesque; scale and space are the chrome's only emphasis
- Live blue = actionable, always and only
- Glyph pins (bed, cup, columns, book…) — never letters or abstract dots
- Tabular numerals on every number; square corners; circles only for
  pins, dots, and the "+"

## Colors

Imagery does the atmospheric work; the applied palette is small and rigid.

### Primary
- **Live blue** (#2B3FD6): everything actionable or current — next pin and
  upcoming box accents, "+", Ask arrow, active tab, engaged toggle, you-dot,
  day-thread line. Never a resting decoration.

### Neutral
- **White** (#FFFFFF): plate ground; pin rings and casings.
- **Ink** (#141414): primary text on plates.
- **Muted ink** (#75726C): secondary text; 4.8:1 on white, AA at all sizes.
- **Hairline** (rgba(20,20,20,.14)): plate borders, dividers, chip strokes.
- **Stone** (#F4F3F0): non-map surfaces' quiet ground (settings, print).

### Category hues (data only)
On pin heads with white glyphs, and as dots/labels on list surfaces:
flight #41527A · accommodation #9A5B2E · dining #2E8557 · excursion
#C99017 (dark glyph) · ticket/culture #2F6B52 · transport #55606B ·
note #6E6A64.

### Named Rules
**The Live-Blue Rule.** Blue means "this is live or actionable" — one
meaning, everywhere. A blue element that merely decorates is a defect.

**The Plate Rule.** Text never sits raw on imagery except neighborhood
names (white, tracked caps, soft shadow). Everything else earns a white
plate with a hairline border.

## Typography

**Font:** system grotesque (-apple-system / Helvetica Neue), one family.
**Numerals:** tabular everywhere (`.tnum`), no exceptions.

### Hierarchy
- **Display** (300, 40px): day headers on list surfaces only.
- **Headline** (400, 27px): the next item's title on list surfaces.
- **Title** (500, 19px): console headers ("You're in Juárez"), item titles.
- **Body** (400, 11.5–13.5px, 1.5): addresses, metadata, Ask field.
- **Label** (600, 9px, 0.16–0.22em, uppercase): plate labels, chips, tabs,
  neighborhood names, field labels.
- **Micro** (600, 8px, 0.12em): pin tags and map micro-annotations only.

### Named Rules
**The Sunlight Floor.** Glance-critical text (times, codes, ETAs, the
upcoming box) never drops below weight 500 at small sizes; weight 300
exists only at display scale.

**The Tense Rule** (list surfaces). Past thins to muted ink, present sits
at headline scale, future at default. Never reorder, never hide the past.

## Layout

- **Map home anatomy:** wordmark plate top-left; right stack top-down:
  day chip → upcoming box (calendar glyph + time · name · ID/code line) →
  ETA row when the distance toggle is on (walk · bike · car, icon + tabular
  minutes). Map controls (layers / distance / locate) stack on the right
  edge at mid-height. Console at bottom: grabber, "You're in
  [neighborhood]" + saved-count, Ask field with arrow, chip row. The blue
  "+" (52px) straddles the console's top edge, right-aligned.
- **Camera doctrine:** default frame centers the owner at street scale.
  The next location is never auto-framed; it lives in the upcoming box.
  No upcoming item → the console's Ask leads.
- **Entry anatomy (list surfaces):** fixed 52px tabular time column ·
  title · ID top-right · address beneath · labeled fact pairs · category
  dot + label. Identical on Today, Plan, pin cards, review card, trip book.
- 4px base grid; 16/24px steps; 24px gutters on list surfaces, 14px map
  margins; touch targets ≥44pt; thumb actions in the bottom third.

**The Answer-First Rule.** Each screen answers its question in the first
viewport at arm's length: the map answers "where am I and what's around";
the upcoming box answers "what's next"; Today answers "how does the day
run."

## Elevation & Depth

The imagery is deep; the chrome is flat. Plates carry one soft neutral
shadow (`0 3px 10px -4px rgba(15,18,15,.4)`) to separate from photography;
the "+" and sheets carry `0 10px 24px -8px rgba(15,18,15,.6)`. No colored
shadows, no glows, no glass.

## Shapes

Square plates, radius 0. Circles are reserved for meaning: pin heads, the
you-dot and its ring, the "+", the Ask arrow button. Pin heads are 34px
(44px for the next item) with 2px white rings; visited pins invert to
white heads with the category color as glyph and ring.

## Components

### Map pins
Category-colored circular head, white ring, white stroke glyph (1.8px,
24 viewBox): bed, cup, columns, open book, cocktail, plane, bus… Never a
letter, never an unlabeled dot. **No text rides the map pin** — no ID
plates, no name tags (owner ruling, 24 Jul 2026: display IDs stay off the
map). The glyph + category color is the whole schema; name, ID, and facts
appear on tap in the pin card. Visited inverts the head (white ground,
category-colored glyph and ring). Next-up pin is blue, 44px, blue-outlined.

### The upcoming box
White plate under the day chip: calendar glyph (live blue), "11:00 · Casa
Barragán" at 10px/600, ID + reservation code in micro beneath. Arrives as
a full-width top banner when an item becomes next, then settles here.

### Map controls
38px square plates, right edge: layers (satellite/plan), distance toggle
(reveals the ETA row), locate. Engaged state fills live blue with white
glyph.

### The console
White sheet, hairline top, grabber. No pronouns anywhere in its copy
(owner ruling). Anatomy, top down:
1. Kicker "NEIGHBORHOOD" (label size, live blue) over the neighborhood
   name at headline scale.
2. One or two known-for lines — tiny, concrete, em-dash led (dash in
   live blue): what this place is loved for, not guidebook prose.
3. Saved-places row between hairlines: an overlapping mini-stack of the
   category glyph heads present nearby + "See N saved places →" in live
   blue. This is a primary link, not a status count. Hidden when N=0.
4. Ask field: "Ask about [neighborhood]…", blue-ringed arrow button.
5. Suggestion chips: pill-shaped (999px — the one non-circle rounded
   form, reserved for ask-chips), live-blue text and 1.5px blue-tinted
   stroke, wrapping: "Best cafés near me" · "Best restaurants near me" ·
   "People's forum" (the Reddit-grounded chip's public name).

### Buttons
Primary = full-width live-blue bar, white text, square ("Add to trip").
Quiet actions are plain ink text. Press: opacity .85, 180ms ease-out.

### The review card
Full-screen white sheet using the entry anatomy, every field editable,
three quiet toggles, one blue "Add to trip" bar. Nothing else on the sheet
gets emphasis.

### Motion
180ms ease-out; `prefers-reduced-motion` respected. Two authored moments:
the banner→box settle of a new next item, and on commit the review card
receding as the new pin drops on the map. No ambient motion.

## Do's and Don'ts

### Do:
- **Do** keep the camera on the owner by default; represent the next item
  in the upcoming box, never by moving the map.
- **Do** use the glyph vocabulary for every pin, identically on map,
  lists, and the trip book.
- **Do** put all seven category hues through the same mapping everywhere.
- **Do** set every number tabular; ETAs read icon + minutes, in
  walk/bike/car order.
- **Do** design empty, offline, and error states as one quiet line.

### Don't:
- **Don't** let blue rest — if it isn't actionable or current, it isn't
  blue.
- **Don't** put raw text on imagery (neighborhood names excepted, as
  specified), or tint plates with category color.
- **Don't** use badges, pills-as-status, gamification, gradients, colored
  shadows, or glass.
- **Don't** frame the next location by default, auto-zoom away from the
  owner, or read location without an explicit tap.
- **Don't** ship city-specific visual material; the city is data.
