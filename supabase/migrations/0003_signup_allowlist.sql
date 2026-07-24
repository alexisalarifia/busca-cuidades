-- Signup allowlist of one (brief §5): the server route checks
-- ALLOWED_USER_EMAIL, and this trigger is the backstop at the DB layer.
--
-- NOTE: this original version read the address from a placeholder. Migration
-- 0005 replaces the function body to read from public.app_config so no personal
-- address lives in source control. Applying these in order is correct; the
-- placeholder below never matches a real signup on its own.

create or replace function public.enforce_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(new.email) is distinct from 'set-in-0005@example.invalid' then
    raise exception 'signups_closed';
  end if;
  return new;
end;
$$;

create trigger enforce_signup_allowlist
  before insert on auth.users
  for each row execute function public.enforce_signup_allowlist();

-- Pin search_path on earlier functions (security advisor: mutable search_path).
alter function public.next_display_id(uuid, text, text) set search_path = '';
alter function public.set_updated_at() set search_path = '';
