-- =====================================================
-- SECURITY FIX: Mencegah user mengubah role sendiri
-- Jalankan di Supabase SQL Editor
-- =====================================================

-- 1. Buat fungsi trigger yang mengunci kolom 'role'
CREATE OR REPLACE FUNCTION protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika kolom role berubah, cek apakah yang mengubah adalah admin
  IF NEW.role <> OLD.role THEN
    -- Hanya izinkan jika request datang dari service_role (server-side API)
    -- atau user yang mengubah adalah admin
    IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) THEN
      -- Kembalikan role ke nilai lama (tolak perubahan)
      NEW.role := OLD.role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Pasang trigger di tabel users
DROP TRIGGER IF EXISTS trigger_protect_user_role ON public.users;
CREATE TRIGGER trigger_protect_user_role
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION protect_user_role();
