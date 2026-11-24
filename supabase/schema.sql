-- ============================================================================
-- URBOOTH — SUPABASE SCHEMA (Jalankan di Supabase Dashboard → SQL Editor)
-- ============================================================================

-- 1. Tabel katalog frame (admin tambah / ON-OFF / ubah expiry -> langsung sync ke semua user)
create table if not exists public.frames (
  id text primary key,
  data jsonb not null,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  expires_at text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.frames enable row level security;

-- Pengunjung biasa boleh membaca daftar frame
drop policy if exists "Public can read frames" on public.frames;
create policy "Public can read frames"
  on public.frames for select
  using (true);

-- Admin panel dapat menambah/mengubah/menghapus frame
drop policy if exists "Allow insert frames" on public.frames;
create policy "Allow insert frames"
  on public.frames for insert
  with check (true);

drop policy if exists "Allow update frames" on public.frames;
create policy "Allow update frames"
  on public.frames for update
  using (true)
  with check (true);

drop policy if exists "Allow delete frames" on public.frames;
create policy "Allow delete frames"
  on public.frames for delete
  using (true);

-- 2. Bucket Storage publik:
--    a) urbooth-frames  : menyimpan gambar frame yang diupload Admin
--    b) urbooth-results : menyimpan hasil foto/video QR (berlaku 24 jam)
insert into storage.buckets (id, name, public)
values
  ('urbooth-frames', 'urbooth-frames', true),
  ('urbooth-results', 'urbooth-results', true)
on conflict (id) do nothing;

-- Policy baca & upload publik untuk kedua bucket
drop policy if exists "Public read urbooth buckets" on storage.objects;
create policy "Public read urbooth buckets"
  on storage.objects for select
  using (bucket_id in ('urbooth-frames', 'urbooth-results'));

drop policy if exists "Public upload urbooth buckets" on storage.objects;
create policy "Public upload urbooth buckets"
  on storage.objects for insert
  with check (bucket_id in ('urbooth-frames', 'urbooth-results'));

drop policy if exists "Public update urbooth buckets" on storage.objects;
create policy "Public update urbooth buckets"
  on storage.objects for update
  using (bucket_id in ('urbooth-frames', 'urbooth-results'));

-- 3. Tabel Saran & Kritik dari pengunjung (muncul di Admin Panel)
create table if not exists public.feedbacks (
  id text primary key,
  name text not null default 'Anonim',
  category text not null default 'Saran',
  message text not null,
  rating integer not null default 5,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.feedbacks enable row level security;

drop policy if exists "Public insert feedbacks" on public.feedbacks;
create policy "Public insert feedbacks"
  on public.feedbacks for insert
  with check (true);

drop policy if exists "Admin read feedbacks" on public.feedbacks;
create policy "Admin read feedbacks"
  on public.feedbacks for select
  using (true);

drop policy if exists "Admin update feedbacks" on public.feedbacks;
create policy "Admin update feedbacks"
  on public.feedbacks for update
  using (true)
  with check (true);

drop policy if exists "Admin delete feedbacks" on public.feedbacks;
create policy "Admin delete feedbacks"
  on public.feedbacks for delete
  using (true);
