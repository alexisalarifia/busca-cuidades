# Setup — zero to running

Everything needed to run BuscaCiudades locally and deploy it. Written so a
future rebuild (or another machine, or another agent) can follow it without
this repo's history.

## Prerequisites

- Node 20+ and npm
- A Supabase project (free tier is fine)
- A Mapbox account (public token)
- A Fireworks (or other OpenAI-compatible) API key — used from M3
- A Tavily API key — used from M4
- Vercel account for deployment

## 1. Clone and install

```bash
git clone git@github.com:alexisalarifia/busca-cuidades.git
cd busca-cuidades
npm install
```

## 2. Environment

```bash
cp .env.example .env.local
```

Fill in every value. Where each one comes from:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` key. **Server-only. Never expose, never commit.** |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox dashboard → Access tokens → a public (`pk.`) token |
| `INFERENCE_BASE_URL` | `https://api.fireworks.ai/inference/v1` (or any OpenAI-compatible endpoint) |
| `INFERENCE_API_KEY` | Fireworks dashboard → API keys |
| `INFERENCE_MODEL` | Chosen at M3 from the provider's live catalog; leave `""` until then |
| `SEARCH_API_KEY` | Tavily dashboard |
| `ALLOWED_USER_EMAIL` | The one email allowed to hold the account |
| `ASK_RATE_LIMIT_PER_HOUR` | `5` unless you have a reason |

## 3. Database

Migrations live in `supabase/migrations/` and are plain SQL, numbered in
order. Apply them in sequence to a fresh project — via the Supabase SQL
editor (paste each file), the Supabase CLI (`supabase db push`), or the
Supabase MCP server if an agent is doing it.

What they create, in order:

1. `0001_core_schema.sql` — tables (`trips`, `items`, `attachments`,
   `ask_log`, `display_id_counters`), indexes, the `next_display_id()`
   function, `updated_at` trigger, RLS policies on everything.
2. `0002_storage_vault.sql` — the private `vault` storage bucket and its
   per-user object policies.
3. `0003_signup_allowlist.sql` — the `before insert` trigger on `auth.users`
   that rejects any email except the allowed one. **The email is hardcoded
   in this file** (an allowlist of one); edit it if the allowed user ever
   changes, and keep it in sync with `ALLOWED_USER_EMAIL`.
4. `0004_revoke_trigger_execute.sql` — revokes client-role EXECUTE on the
   trigger function (security lint).

No other Supabase configuration is required; email+password auth works out
of the box. Note the default Supabase auth flow sends a confirmation email
on signup — the single user confirms once.

## 4. Run

```bash
npm run dev
```

http://localhost:3000 → sign up with the allowed email (first time only),
confirm via the email link, sign in, and the trip gate takes over.

`npm run build` must pass clean before any deploy.

## 5. Deploy (Vercel)

```bash
npx vercel link      # once, to connect the repo/project
npx vercel env add   # add every variable from .env.local (all environments)
npx vercel --prod
```

Or through the Vercel dashboard: import the GitHub repo, paste the env vars,
deploy. Nothing project-specific beyond the env vars — it's a stock Next.js
build.

After the first deploy:

1. Open the production URL in Safari on the iPhone.
2. Share sheet → **Add to Home Screen**. The app opens full-screen
   standalone with its own icon.

## 6. Icons (only if the design changes)

```bash
node scripts/make-icons.mjs
```

Regenerates `public/icons/*` and the `app/icon.png` / `app/apple-icon.png`
files from the inline SVG in that script.

## Troubleshooting

- **"Signups are closed."** — the email doesn't match `ALLOWED_USER_EMAIL`
  (server action) or the hardcoded address in migration `0003` (DB trigger).
  Both must agree.
- **Trip gate loops back to itself** — the signed-in user has no `active`
  trip; complete the gate form. Archiving the trip from Settings returns you
  to the gate by design.
- **Geocoding returns nothing** — check the Mapbox token and that the query
  includes enough of an address; the app biases results toward Mexico City.
- **Dev server works but production 500s** — almost always a missing env var
  on Vercel; compare against `.env.example`.
