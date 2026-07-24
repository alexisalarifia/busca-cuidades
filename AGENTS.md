<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working on BuscaCiudades

Notes for coding agents (and humans who want the sharp edges listed). Read
[README.md](README.md) for what this is and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it fits together.

## The contract

This app is built against a written brief (kept outside the repo because it
contains live keys — on the owner's machine at
`iCloud/BuscaCiudades/LOOK_HERE_FOR_CONTEXT_LLMS/v1/infrastructure/`). Its
load-bearing rules, restated:

- **Audience of one.** Single user, single active trip. Don't build
  multi-tenant anything.
- **Where the brief is silent, choose the boring option.**
- **Minimal dependencies.** No ORM, no state library, no charting library,
  no component kit. If a dependency saves less than a day, write it by hand.
- **Build order is contractual**: M1 foundation → M2 map/importer/vault →
  M3 ingest → M4 views/export/ask/trends. Deploy after every milestone.
- **Cut line if slipping**: Trends first, then Ask chips (collapse to
  freeform). The ingest loop, map, itinerary, and export never move.

## Invariants — do not break

1. **Secrets never enter the repo.** `.env*` is gitignored (only
   `.env.example`, which holds no values, is whitelisted). Server-only keys
   (`SUPABASE_SERVICE_ROLE_KEY`, `INFERENCE_API_KEY`, `SEARCH_API_KEY`) are
   read exclusively in server code — never in a `NEXT_PUBLIC_` var, never in
   a client component.
2. **Every LLM call and every search call goes through a server route.**
3. **RLS on every table**, policy `user_id = (select auth.uid())`. New
   tables copy that pattern; run Supabase security advisors after DDL.
4. **Migrations are append-only** and live in `supabase/migrations/`,
   numbered. Whatever is applied to the live project must be committed
   there. Never edit an applied migration; add a new one.
5. **Times are stored UTC** (`timestamptz`) with an IANA `venue_tz` column,
   and **rendered in venue tz** via helpers in [lib/time.ts](lib/time.ts).
   Don't format a timestamp without a timezone.
6. **Display IDs** come from the `next_display_id()` SQL function via
   `nextDisplayId()` in [lib/display-id.ts](lib/display-id.ts) — never
   compute a sequence in JS. Kind→prefix map lives there too.
7. **Nothing writes before the user's confirming tap** in ingest flows
   (review card is the gate). Dedupe errors surface as "Already imported as
   [ID]", never a raw DB error.
8. **Design tokens**: consume `design/tokens.css` variables (via the Tailwind
   `@theme inline` bridge in `app/globals.css`). Don't hardcode colors. If
   the design track delivers a new tokens file, it replaces the current one
   verbatim — keep app styles out of it.
9. **Tabular numerals** (`.tnum`) on every timestamp and number.
10. **No analytics, no trackers, no runtime third-party fonts.**

## Sharp edges already hit (don't rediscover)

- **`useActionState` does not rebind when you swap the action function
  between renders.** The login form posts a hidden `mode` field to one
  branching action instead. Do the same for any future modal form.
- **Next 16 renamed middleware**: the file is `proxy.ts` with a default
  export, not `middleware.ts`.
- **Tailwind 4** is CSS-first: theme mapping lives in `app/globals.css`
  under `@theme inline`, not in a `tailwind.config`.
- **`lpad` truncates** beyond its length — display-ID formatting in SQL uses
  `greatest(3, length(...))` so IDs past 999 don't corrupt.
- **npm audit** reports highs inside Next's own pinned `postcss`/`sharp`;
  the suggested "fix" downgrades Next to 9.x. Ignore it; track Next
  releases instead.
- **The auth trigger function** is SECURITY DEFINER with EXECUTE revoked
  from `anon`/`authenticated` (advisor lints 0028/0029) — keep it that way
  if you touch it.
- **iCloud is not a dev directory.** The repo deliberately lives at
  `~/Projects/busca-ciudades`, not in the iCloud folder next to the brief.

## Conventions

- TypeScript strict; hand-written row types in [lib/types.ts](lib/types.ts)
  mirror the migrations — update both together.
- Server actions for form flows (auth, trip gate, settings); route handlers
  under `app/api/` for JSON pipelines and file downloads (ingest, ask,
  export — from M3/M4).
- Supabase access: `lib/supabase/server.ts` (server components/actions),
  `lib/supabase/client.ts` (client components), cookie session refreshed in
  `proxy.ts`.
- Comments only where intent isn't obvious from the code; brief-section
  references (e.g. "brief §4") are the citation style.
- Copy tone: quiet, short, no exclamation marks. Empty states are one line.
- Verify with `npm run build` before any deploy; it must be clean.

## Testing an auth-gated flow

There's no test framework (deliberate — audience of one, 48-hour build).
E2E verification is done by hand or by agent-driven browser. To exercise
authed flows without squatting the real account: create a temporary
confirmed user with the admin API (service key) — the allowlist trigger
only admits `ALLOWED_USER_EMAIL`, so that's the address to use — then
delete the user afterward (deletes cascade to trips/items). Keep any such
script out of the repo or delete it when done.
