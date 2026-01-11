-- STEP 5: Create Users (Run AFTER creating auth users)
-- =====================================================
-- 
-- CARA BUAT USER:
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Klik "Add User" > "Create new user"
-- 3. Email: nomor_hp@wargakemang.local (contoh: 08123456789@wargakemang.local)
-- 4. Password: password yang diinginkan
-- 5. Klik "Create User"
-- 6. Copy UUID user dari kolom "User UID"
-- 7. Jalankan query INSERT di bawah dengan UUID tersebut

-- Contoh: Buat Admin
-- Ganti 'UUID-DARI-AUTH-USERS' dengan UUID yang di-copy dari tabel auth users
/*
INSERT INTO public.users (id, phone, name, role, rt, rw) VALUES
  ('UUID-DARI-AUTH-USERS', '08123456789@wargakemang.local', 'Administrator', 'admin', null, null);
*/

-- Contoh: Buat Ketua RT 001 RW 001
/*
INSERT INTO public.users (id, phone, name, role, rt, rw) VALUES
  ('UUID-DARI-AUTH-USERS', '08111111111@wargakemang.local', 'Ketua RT 001 RW 001', 'rt', '001', '001');
*/

-- =====================================================
-- TEMPLATE UNTUK SEMUA RT
-- =====================================================

-- RW 001 (6 RT)
-- INSERT INTO public.users (id, phone, name, role, rt, rw) VALUES
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 001 RW 001', 'rt', '001', '001'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 002 RW 001', 'rt', '002', '001'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 003 RW 001', 'rt', '003', '001'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 004 RW 001', 'rt', '004', '001'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 005 RW 001', 'rt', '005', '001'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 006 RW 001', 'rt', '006', '001');

-- RW 002 (7 RT)
-- INSERT INTO public.users (id, phone, name, role, rt, rw) VALUES
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 001 RW 002', 'rt', '001', '002'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 002 RW 002', 'rt', '002', '002'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 003 RW 002', 'rt', '003', '002'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 004 RW 002', 'rt', '004', '002'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 005 RW 002', 'rt', '005', '002'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 006 RW 002', 'rt', '006', '002'),
--   ('uuid-here', '08...@wargakemang.local', 'Ketua RT 007 RW 002', 'rt', '007', '002');
