-- Move the allowed signup address out of source control.
--
-- 0003 hardcoded the email in the trigger body, which meant a personal address
-- lived in the repo (and in git history). The address now lives in a locked-down
-- config table and is set out-of-band — see docs/SETUP.md.
--
-- Fail-closed by design: if the config row is missing, the subquery is NULL,
-- `is distinct from NULL` is true for every address, and all signups are
-- rejected. A misconfigured deploy blocks signups rather than opening them.

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- No policies: RLS on with zero policies denies anon/authenticated entirely.
-- The trigger reads it as SECURITY DEFINER, which bypasses RLS.
alter table public.app_config enable row level security;

create or replace function public.enforce_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(new.email) is distinct from
     (select lower(value) from public.app_config where key = 'allowed_email')
  then
    raise exception 'signups_closed';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_signup_allowlist() from public, anon, authenticated;
