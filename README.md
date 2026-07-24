# BuscaCiudades

A single-user, trip-scoped travel companion for Mexico City, built as an
installable web app (PWA). One person's trip, optimized ruthlessly for that
person: paste a booking email or URL → an LLM extracts the details → an
editable review card → one tap creates an itinerary item, a map pin, and a
calendar file with an alert.

**Audience of one.** There is exactly one allowed account. This is not a
multi-tenant product, and much of the design (allowlist trigger, no user
management, personal exports) follows from that.

## Status

| Milestone | Scope | State |
|---|---|---|
| M1 | Scaffold, schema + RLS, auth + allowlist, trip gate, tab shell, PWA | ✅ shipped |
| M2 | Mapbox map, manual pins, visited states, Google Maps list importer, photo Vault | ✅ shipped |
| M3 | Ingest pipeline: paste/URL → extraction → review card → item + pin + .ics | ✅ shipped |
| M4 | Today & Itinerary views, export ZIP, Ask concierge, Trends module | ✅ shipped |

## Quick start

```bash
git clone git@github.com:alexisalarifia/busca-ciudades.git
cd busca-ciudades
npm install
cp .env.example .env.local   # then fill in every value — see docs/SETUP.md
npm run dev
```

Open http://localhost:3000. Full environment/provisioning instructions
(Supabase project, migrations, Mapbox, Fireworks, Tavily, Vercel) are in
[docs/SETUP.md](docs/SETUP.md).

## Stack

- **Next.js** (App Router, TypeScript strict) on **Vercel**
- **Supabase** — email+password auth, Postgres with row-level security, one
  private storage bucket (`vault`)
- **Mapbox GL JS** + Mapbox Geocoding v6
- **LLM** — OpenAI-compatible chat completions (Fireworks, `gpt-oss-120b`
  for extraction with a `glm-5p2` escalation seam for low-confidence
  parses), wrapped in one thin module (`lib/llm.ts`) so swapping providers
  or escalating is a config change
- **Tavily** search, called from server routes only
- **Tailwind CSS 4** consuming design tokens from `design/tokens.css`

Deliberately minimal dependencies: no ORM, no state library, no charting
library, no component kit. If a dependency saves less than a day, we write it
ourselves (e.g. the `.ics` generator).

## Environment

All keys live in `.env.local` (gitignored). `.env.example` lists every
variable. Server-only secrets — `SUPABASE_SERVICE_ROLE_KEY`,
`INFERENCE_API_KEY`, `SEARCH_API_KEY` — are never prefixed `NEXT_PUBLIC_`
and never reach the client; every model call and every search call goes
through a server route.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project + public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key (never shipped to client) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token (map + geocoding) |
| `INFERENCE_BASE_URL` / `INFERENCE_API_KEY` / `INFERENCE_MODEL` | OpenAI-compatible LLM endpoint |
| `SEARCH_API_KEY` | Tavily key (grounds Ask + Trends) |
| `ALLOWED_USER_EMAIL` | The only email allowed to register or sign in |
| `ASK_RATE_LIMIT_PER_HOUR` | Server-enforced Ask tab rate limit |

## Repository map

```
app/
  page.tsx               Logged-out landing + Trends module frame
  auth/actions.ts        Sign in / sign up (allowlist) / sign out
  trip-gate/             First-login ritual: dates, lodging, flight
  (tabs)/                Authenticated shell: today, map, itinerary,
                         ask, vault, settings + tab bar and "+"
  manifest.ts            PWA manifest
components/              Client components (forms, tab bar, ingest sheet,
                         map view, vault grid, place importer)
lib/                     supabase clients, types, geocode, display-id,
                         time helpers, trip helper, hash, exif,
                         import-places (KML/GeoJSON/CSV parsers)
supabase/migrations/     Schema, RLS, allowlist trigger, storage bucket —
                         source of truth for the database
design/tokens.css        Design tokens (fallback set until the design
                         track delivers; consumed verbatim)
public/sw.js             Service worker (shell cache)
scripts/make-icons.mjs   Regenerates PWA icons from the inline SVG
docs/                    Architecture, setup, and usage guides
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, data model,
  data flows, security model, key decisions
- [docs/INGEST.md](docs/INGEST.md) — the ingest pipeline in detail: the
  extraction contract, model choice, `.ics` generator, failure handling
- [docs/SETUP.md](docs/SETUP.md) — zero-to-running: provisioning, env,
  migrations, deploy
- [docs/USAGE.md](docs/USAGE.md) — how to actually use the app, screen by
  screen
- [AGENTS.md](AGENTS.md) — working notes for LLM coding agents (and humans
  who want the sharp edges listed)
- [design/DESIGN_BRIEF.md](design/DESIGN_BRIEF.md) — starting point for the
  design track: the token seam, visual thesis, screens, and working method

## Security posture

- Signups rejected for any email except `ALLOWED_USER_EMAIL` — enforced in
  the server action **and** by a database trigger on `auth.users`.
- Row-level security on every table: `user_id = auth.uid()`.
- The `vault` storage bucket is private; access is via short-lived signed
  URLs only.
- No analytics, no trackers, no runtime third-party fonts.
- Secrets never enter the repo: `.env*` is gitignored (except `.env.example`,
  which contains no values).
