-- ===========================================================================
-- STORAGE ACCESS FOR THE IMAGE BUCKET
--
-- storage.objects ships with row level security on and no policies, so an
-- upload from the admin panel was refused with "new row violates row level
-- security policy" — the picture picker in both admin dialogs has never
-- worked.
--
-- Same shape as the table policies in 20260903195708_catering_schema.sql:
-- reading is open (these images are rendered to every visitor of the site),
-- writing is granted to `authenticated`, which a visitor only holds after a
-- real Supabase Auth login.
--
-- The bucket name carries a space and a capital; it is quoted here exactly as
-- it exists, and CONSTANTS.STORAGE_BUCKET must match it character for
-- character.
-- ===========================================================================

drop policy if exists "product images are readable by anyone" on storage.objects;
create policy "product images are readable by anyone"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'Product images');

drop policy if exists "signed in admins may upload product images" on storage.objects;
create policy "signed in admins may upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'Product images');

drop policy if exists "signed in admins may replace product images" on storage.objects;
create policy "signed in admins may replace product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'Product images')
  with check (bucket_id = 'Product images');

drop policy if exists "signed in admins may delete product images" on storage.objects;
create policy "signed in admins may delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'Product images');
