-- Private storage bucket for the Vault (brief §5). All object paths are
-- prefixed with the owner's user id: {user_id}/{filename}. Access from the
-- app is via short-lived signed URLs.

insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

create policy vault_select on storage.objects
  for select to authenticated
  using (bucket_id = 'vault' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy vault_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vault' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy vault_update on storage.objects
  for update to authenticated
  using (bucket_id = 'vault' and (select auth.uid())::text = (storage.foldername(name))[1])
  with check (bucket_id = 'vault' and (select auth.uid())::text = (storage.foldername(name))[1]);

create policy vault_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'vault' and (select auth.uid())::text = (storage.foldername(name))[1]);
