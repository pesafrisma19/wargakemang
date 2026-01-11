-- Warga Kemang Database Schema (UPDATED)
-- Run this in Supabase SQL Editor

-- JIKA SUDAH ADA TABEL SEBELUMNYA, HAPUS DULU:
-- DROP TABLE IF EXISTS public.warga;
-- DROP TABLE IF EXISTS public.users;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table for RT/Admin accounts
create table if not exists public.users (
  id uuid primary key,
  phone varchar(100) not null,
  name varchar(100) not null default 'User',
  role varchar(10) not null default 'rt' check (role in ('admin', 'rt')),
  rt varchar(3),
  rw varchar(3),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create warga table (UPDATED - removed alamat_kampung, added defaults)
create table if not exists public.warga (
  id uuid default uuid_generate_v4() primary key,
  nik varchar(16) not null unique,
  nama varchar(100) not null,
  tempat_lahir varchar(50) not null,
  tanggal_lahir date not null,
  jenis_kelamin varchar(1) not null check (jenis_kelamin in ('L', 'P')),
  alamat text not null,
  golongan_darah varchar(3) default '-',
  rt varchar(3) not null,
  rw varchar(3) not null,
  desa varchar(50) not null default 'Kemang',
  kecamatan varchar(50) not null default 'Bojongpicung',
  kabupaten varchar(50) not null default 'Cianjur',
  provinsi varchar(50) not null default 'Jawa Barat',
  agama varchar(20) not null,
  status_kawin varchar(20) not null,
  pekerjaan varchar(50) not null,
  kewarganegaraan varchar(5) not null default 'WNI',
  no_kk varchar(16),
  no_wa varchar(20),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists idx_warga_rt_rw on public.warga(rt, rw);
create index if not exists idx_warga_nik on public.warga(nik);
create index if not exists idx_warga_no_kk on public.warga(no_kk);

-- Enable RLS
alter table public.users enable row level security;
alter table public.warga enable row level security;

-- Policies for users table
create policy "Anyone can read users" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Enable insert for authenticated users" on public.users
  for insert with check (auth.uid() = id);

-- Admin policies for warga
create policy "Admin can select all warga" on public.warga
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admin can insert warga" on public.warga
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admin can update warga" on public.warga
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admin can delete warga" on public.warga
  for delete using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- RT policies
create policy "RT can select own warga" on public.warga
  for select using (
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role = 'rt' 
      and users.rt = warga.rt 
      and users.rw = warga.rw
    )
  );

create policy "RT can insert own warga" on public.warga
  for insert with check (
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role = 'rt' 
      and users.rt = warga.rt 
      and users.rw = warga.rw
    )
  );

create policy "RT can update own warga" on public.warga
  for update using (
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role = 'rt' 
      and users.rt = warga.rt 
      and users.rw = warga.rw
    )
  );

create policy "RT can delete own warga" on public.warga
  for delete using (
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role = 'rt' 
      and users.rt = warga.rt 
      and users.rw = warga.rw
    )
  );
