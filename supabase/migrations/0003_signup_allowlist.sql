-- Signup allowlist of one (brief §5): the server route checks
-- ALLOWED_USER_EMAIL, and this trigger is the backstop at the DB layer.
-- The address is intentionally hardcoded — attack surface of one.

create or replace function public.enforce_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(new.email) is distinct from 'gordon2053@gmail.com' then
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
