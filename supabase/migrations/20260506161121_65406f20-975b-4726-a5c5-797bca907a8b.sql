
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media file" on storage.objects for select
  using (bucket_id = 'media' and (storage.foldername(name))[1] is not null);
