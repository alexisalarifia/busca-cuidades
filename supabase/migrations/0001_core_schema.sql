-- Core schema per build brief §4: three tables plus a log, RLS on all.

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  city text not null default 'Mexico City',
  starts_on date not null,
  ends_on date not null,
  lodging_name text,
  lodging_address text,
  lodging_lat double precision,
  lodging_lng double precision,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('flight', 'ticket', 'accommodation', 'dining', 'excursion', 'transport', 'note')),
  kind text not null,
  display_id text not null,
  title text not null,
  notes text,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_tz text,
  lat double precision,
  lng double precision,
  address text,
  visited boolean not null default false,
  source_type text not null default 'manual' check (source_type in ('manual', 'paste', 'url', 'screenshot', 'email')),
  source_raw text,
  content_hash text,
  purchase_ts timestamptz,
  purchaser_contact text,
  total_amount numeric,
  currency text,
  confirmation_code text,
  venue_name text,
  venue_address text,
  confidence numeric,
  source_issued_at timestamptz,
  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, display_id)
);

-- Dedupe: sha256 of normalized source text, unique per trip (brief §4).
create unique index items_trip_content_hash_key
  on public.items (trip_id, content_hash)
  where content_hash is not null;

create index items_trip_id_idx on public.items (trip_id);
create index items_user_id_idx on public.items (user_id);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  storage_path text not null,
  mime text not null,
  bytes bigint not null,
  taken_at timestamptz,
  uploaded_at timestamptz not null default now(),
  caption text
);

create index attachments_trip_id_idx on public.attachments (trip_id);
create index attachments_item_id_idx on public.attachments (item_id);

create table public.ask_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  prompt text not null,
  lat double precision,
  lng double precision,
  source_count integer,
  retrieved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Rate limit query: count of rows for user in the trailing hour.
create index ask_log_user_created_idx on public.ask_log (user_id, created_at desc);

-- Display IDs: PREFIX-NNN sequenced per kind per trip. Prefix map lives in
-- lib/display-id.ts; this counter makes concurrent inserts race-safe.
create table public.display_id_counters (
  trip_id uuid not null references public.trips(id) on delete cascade,
  kind text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_n integer not null default 0,
  primary key (trip_id, kind)
);

create or replace function public.next_display_id(p_trip_id uuid, p_kind text, p_prefix text)
returns text
language sql
as $$
  insert into public.display_id_counters as c (trip_id, kind, user_id, last_n)
  values (p_trip_id, p_kind, auth.uid(), 1)
  on conflict (trip_id, kind) do update set last_n = c.last_n + 1
  returning p_prefix || '-' || lpad(last_n::text, greatest(3, length(last_n::text)), '0');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- RLS: user_id = auth.uid() on every table (brief §4).
alter table public.trips enable row level security;
alter table public.items enable row level security;
alter table public.attachments enable row level security;
alter table public.ask_log enable row level security;
alter table public.display_id_counters enable row level security;

create policy trips_own on public.trips
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy items_own on public.items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy attachments_own on public.attachments
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy ask_log_own on public.ask_log
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy display_id_counters_own on public.display_id_counters
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
