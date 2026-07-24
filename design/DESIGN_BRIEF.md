# BuscaCiudades — Design Brief (start here)

You are the **design track** for BuscaCiudades. The app is **fully built and
functional** (all four milestones, deployed at
https://busca-ciudades.vercel.app). Your job is **visual/interaction design
only** — do not change functionality, routes, data, or API behavior. This
file merges three inputs into your single starting point: the engineering
handoff, the design-system recommendation, and the reference set.

---

## What the user has asked you to keep in mind

1. **Modern, minimal, warm — never tacky.** This is the whole mandate. When in
   doubt, remove.
2. **Design only.** Function is done and tested. Restyle; don't refactor logic.
3. **Be token-efficient.** Don't regenerate whole screens to change one thing.
   Work **template by template**, and for each, **offer options** (2–3
   variants) rather than one-shotting. **Preserve prior tweaks** — keep
   superseded versions available (a `design/variants/` folder, comments, or
   git history) rather than overwriting, so no work is lost and you never
   re-derive from scratch. Old/obsolete edits stay recoverable.
4. **Document as you go**, for both humans and future LLMs.

---

## The one seam you style through (read this first)

The app reads design entirely from CSS custom properties bridged into
Tailwind. You almost never touch component files:

- **`design/tokens.css`** — currently the brief's §14 fallback tokens.
  **Replace/extend this file and the whole app re-skins.** Keep existing
  variable names or add new ones; the map lives in `app/globals.css` under
  `@theme inline`.
- Components use Tailwind classes (`bg-paper`, `text-ink`, `bg-accent`,
  `text-flight`, …) that resolve from those tokens. Only two files read
  `var(--c-*)` inline — `components/map-view.tsx` (pins) and
  `components/item-card.tsx` (card spines) — touch them only if you change
  the category-color mechanism.

Current tokens to evolve (not replace blindly — the accent already matches the
recommended Barragán magenta):

```
--paper #FAF7F2   --ink #1A1A1A   --accent #E4007C (rosa mexicano)
--c-flight --c-accommodation --c-dining --c-excursion
  --c-ticket --c-transport --c-note      (category colors)
--shadow-hard  --radius  --motion
```

**Fonts:** the brief (§5/§14) requires **self-hosted Archivo** (no runtime
third-party fonts, no trackers). Archivo is a clean grotesque and satisfies
the "one grotesque" recommendation below — use it rather than Inter/Söhne.
`.tnum` (tabular numerals) is already applied to every number/time — keep it.

---

## Visual thesis (from the design-system recommendation)

North star image: **Casa Gilardi color planes** (Barragán) — a calm plaster
field, one corridor of intense color, light as material. Check every color,
spacing, and light/shadow decision against it. Framed as *choose X over Y*:

- **Color:** warm plaster neutral base doing ~90% of the work + **one or two**
  saturated accents (the rosa mexicano / an ochre or clay) for emphasis and
  wayfinding. Large quiet areas + one loud accent **over** an evenly colorful
  UI. Validate accent contrast on the actual plaster background — **WCAG 2.2
  AA** (≥4.5:1 body, ≥3:1 large/UI). Reserve pink for fills, not small text,
  if it fails. Reject gradients-as-identity and neon.
- **Type:** one grotesque (**Archivo**, per the brief), a modular scale (one
  ratio, e.g. 1.25), 2–3 weights, comfortable measure (~45–75 chars),
  line-height ~1.5. Restraint is the aesthetic (Vignelli). One optional
  display treatment for the app name only — never body.
- **Grid & space:** 8pt spacing system, one column grid, align everything.
  Fewer larger spacing steps **over** ad-hoc pixels. Whitespace is the
  Barragán courtyard that lets the accent breathe.
- **Icons/wayfinding:** one geometrically consistent pictogram family (one
  stroke weight, one grid) for nav, categories, and map markers — icon + short
  label. Inspired by the CDMX Metro / Lance Wyman logic but **original**:
  actual Metro glyphs and Wyman marks are protected — private reference only,
  never shipped.
- **Motion:** small, fast, purposeful (~150–250ms), eased curves, respects
  `prefers-reduced-motion`. Orient, don't entertain. No bouncy parallax.
- **Structure:** atomic, token-driven (Frost). Borrow Material/Apple-HIG
  *structure* (tokens, states, elevation semantics) under a distinct Barragán
  voice.
- **Accessibility (non-negotiable):** WCAG 2.2 AA contrast, ≥44×44pt touch
  targets, visible focus, dynamic type.

*Anti-tacky guardrail (Rams):* one accent doing a lot over many doing a
little; content and hierarchy over ornament; consistency over per-screen
novelty.

---

## Screens & components to design (all built, working)

Design the shared atoms first — two of them cover most screens.

- **`components/item-card.tsx`** — the atom on Today + Itinerary (category
  color spine, display ID, time, quick actions). Design once, two screens move.
- **The review card** inside `components/ingest-button.tsx` — the "peak
  moment": paste/URL → editable card → three toggles → Add to trip.
- **Pins** in `components/map-view.tsx` — inline SVG teardrops + per-category
  glyph; visited = filled + check. The place for your pictogram family.

| Route / surface | File |
|---|---|
| Landing + Trends | `app/page.tsx`, `components/login-form.tsx`, `components/trends-module.tsx` |
| Trip gate (the "ritual") | `components/trip-gate-form.tsx` |
| Today | `app/(tabs)/today/page.tsx` + item-card |
| Map | `components/map-view.tsx` |
| Itinerary | `app/(tabs)/itinerary/page.tsx` |
| Ask | `components/ask-client.tsx` |
| Vault | `components/vault-grid.tsx` |
| Settings | `app/(tabs)/settings/page.tsx` |
| **Trip book** (print → PDF; most design-hungry — wants a city-motif cover) | `app/trip-book/page.tsx` + `print.css` |
| Tab bar + "+" | `components/tab-bar.tsx`, `components/ingest-button.tsx` |

Full architecture, setup, and conventions: repo `README.md`,
`docs/ARCHITECTURE.md`, `AGENTS.md`. Deeper handoff:
`DESIGN_HANDOFF_from_claude_code.md` (repo root context).

---

## Suggested working method (token-efficient, versioned)

1. Land the token system in `design/tokens.css` first (palette, type scale,
   spacing, radius, elevation) — this moves everything at once.
2. Then go screen by screen, atoms first. For each, present **2–3 options**;
   once the user picks, save the alternates under `design/variants/<screen>/`
   (or keep them in git history) so nothing is lost.
3. Keep a short `design/CHANGELOG.md` of decisions so the next session doesn't
   re-litigate settled choices.

---

## Private reference (do NOT ship these images)

Curated Wikimedia Commons set — reference only; CC-BY/CC-BY-SA reuse outside
private reference needs attribution. North star is #4.

**Barragán:** Casa Barragán facade
(commons.wikimedia.org/wiki/File:Luis_Barragan_House_exterior_01.jpg) ·
roof terrace (…Luis_Barragan_House_Roof1.jpg) ·
**Casa Gilardi color planes — north star** (…File:Casa_gilardi.jpg) ·
Cuadra San Cristóbal pink walls
(…File:Cuadra_San_Cristobal,_Mexico_City.jpg).
**CDMX Metro (pictogram *logic* only, never the glyphs):** Mixiuhca glyph
(…File:MixiuhcaMetroGlyph.JPG) · Insurgentes signage
(…File:InsurgentesMetroDF1.JPG).
**Streetscapes (Roma / Condesa / Centro):** Colonia Roma
(…File:Colonia_roma.JPG) · Calle Ámsterdam, Condesa · Centro Histórico.

Full list with licenses/authors: `buscaciudades-handoff/reference/SOURCES.txt`
(in the user's iCloud handoff folder, not the repo).

Authorities behind the thesis: Rams · Barragán · Albers · Müller-Brockmann ·
Vignelli · Lance Wyman · Lupton · Frost · WCAG 2.2 · Apple HIG · Material ·
Disney animation principles.
