-- SAIL registration profile-photo uploads.
-- Run this once in Supabase Dashboard -> SQL Editor.
--
-- The registration page crops photos to a square 800x800 JPG, uploads them
-- with the publishable key, then stores the resulting public URL in
-- public.lab_members.image_url.
-- Public buckets allow direct image display on the static Team page, while the
-- INSERT policy below is still required before browsers can upload files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-photos',
  'member-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow pending member photo uploads" on storage.objects;

create policy "Allow pending member photo uploads"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'member-photos'
  and (storage.foldername(name))[1] = 'pending'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
