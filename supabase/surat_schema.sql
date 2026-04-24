-- =====================================================
-- SURAT & PENGATURAN SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Pengaturan Desa (singleton row for settings)
create table if not exists public.pengaturan (
  id int primary key default 1 check (id = 1),
  nama_desa varchar(100) not null default 'KEMANG',
  nama_kecamatan varchar(100) not null default 'BOJONGPICUNG',
  nama_kabupaten varchar(100) not null default 'CIANJUR',
  nama_provinsi varchar(100) not null default 'JAWA BARAT',
  alamat_kantor text not null default 'JL.Entang-Adjli No.53 Desa Kemang-Bojongpicung-Cianjur Kode Pos 43283',
  kode_pos varchar(10) default '43283',
  nama_kades varchar(100) not null default '',
  nama_sekdes varchar(100) not null default '',
  updated_at timestamp with time zone default now()
);

-- Insert default row
insert into public.pengaturan (id) values (1) on conflict (id) do nothing;

-- Riwayat Surat (letter history/archive)
create table if not exists public.surat (
  id uuid default uuid_generate_v4() primary key,
  nomor_surat varchar(100) not null,
  jenis_surat varchar(30) not null,
  warga_id uuid references public.warga(id) on delete set null,
  warga_nama varchar(100) not null,
  warga_nik varchar(16) not null,
  data_surat jsonb not null default '{}',
  dibuat_oleh uuid references public.users(id),
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_surat_jenis on public.surat(jenis_surat);
create index if not exists idx_surat_created on public.surat(created_at desc);
create index if not exists idx_surat_warga on public.surat(warga_id);

-- Enable RLS
alter table public.pengaturan enable row level security;
alter table public.surat enable row level security;

-- Pengaturan policies (admin only)
create policy "Admin can read pengaturan" on public.pengaturan
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admin can update pengaturan" on public.pengaturan
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admin can insert pengaturan" on public.pengaturan
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Surat policies (admin only)
create policy "Admin can read surat" on public.surat
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admin can insert surat" on public.surat
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admin can delete surat" on public.surat
  for delete using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );
