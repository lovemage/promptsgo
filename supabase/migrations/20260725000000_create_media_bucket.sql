-- Public media is readable by URL. Writes remain restricted to each authenticated user.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users upload own media" on storage.objects;
create policy "Authenticated users upload own media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] in ('avatars', 'banners', 'prompts', 'comments')
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

drop policy if exists "Users update own media" on storage.objects;
create policy "Users update own media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media'
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id = 'media'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists "Users delete own media" on storage.objects;
create policy "Users delete own media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
  and owner_id = (select auth.uid()::text)
);
