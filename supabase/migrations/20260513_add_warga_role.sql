-- =====================================================
-- MIGRATION: Fase 2.1 - Menambahkan Role Warga & Kolom NIK
-- =====================================================

-- 1. Hapus aturan lama yang membatasi role hanya admin & rt
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Buat aturan baru yang memasukkan 'warga'
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'rt', 'warga'));

-- 3. Tambahkan kolom nik untuk menghubungkan akun login dengan tabel warga
-- Kolom ini unik agar 1 NIK hanya bisa dipakai 1 Akun
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nik varchar(16) UNIQUE;

-- 4. Tambahkan RLS Policy agar Warga bisa membaca datanya sendiri
CREATE POLICY "Warga can read self" ON public.warga
  FOR SELECT USING (
    nik = (SELECT nik FROM public.users WHERE id = auth.uid())
  );
