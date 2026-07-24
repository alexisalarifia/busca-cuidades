-- Security advisor 0028/0029: keep the SECURITY DEFINER trigger function
-- out of the exposed RPC surface entirely.
revoke execute on function public.enforce_signup_allowlist() from public, anon, authenticated;
