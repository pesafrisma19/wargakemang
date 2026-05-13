'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// We might need admin client just to check if NIK exists in public.warga
// because public.warga RLS only allows Admin/RT to SELECT. A guest cannot SELECT public.warga!
export async function registerWarga(formData: FormData) {
    const nik = (formData.get('nik') as string).replace(/\D/g, '')
    let phone = (formData.get('phone') as string).replace(/\D/g, '')
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    // Normalisasi Nomor HP: Jika berawalan 0, ubah menjadi 62 (Standar Internasional/WhatsApp)
    if (phone.length < 15 && phone.startsWith('0')) {
        phone = '62' + phone.substring(1)
    }

    if (!nik || !phone || !password || !name) {
        return { error: 'Semua field wajib diisi' }
    }

    if (nik.length !== 16) {
        return { error: 'NIK harus 16 digit' }
    }

    if (password.length < 6) {
        return { error: 'Password minimal 6 karakter' }
    }

    // Initialize Admin client to bypass RLS for checking NIK
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

    // 1. Cek apakah NIK terdaftar di desa
    const { data: wargaData } = await supabaseAdmin
        .from('warga')
        .select('id, nama, rt, rw')
        .eq('nik', nik)
        .single()

    if (!wargaData) {
        return { error: 'NIK tidak terdaftar dalam data warga desa. Silakan hubungi RT.' }
    }

    // 2. Cek apakah NIK ini sudah pernah didaftarkan
    const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('nik', nik)
        .single()

    if (existingUser) {
        return { error: 'NIK ini sudah memiliki akun.' }
    }

    // 3. Buat email dari nomor HP (Keseragaman dengan Admin/RT)
    // Walaupun Warga login pakai NIK, kita akan secara cerdas mengkonversi NIK-nya kembali ke nomor HP saat login
    const email = `${phone}@wargakemang.local`

    // Cek apakah nomor HP sudah dipakai
    const { data: existingPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single()
        
    if (existingPhone) {
        return { error: 'Nomor HP ini sudah dipakai untuk pendaftaran lain.' }
    }

    // 4. Register ke Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })

    if (authError) {
        return { error: 'Gagal membuat akun: ' + authError.message }
    }

    // 5. Masukkan profil ke tabel users
    if (authData.user) {
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                nik: nik,
                phone: phone,
                name: name,
                role: 'warga',
                rt: wargaData.rt,
                rw: wargaData.rw
            })

        if (profileError) {
            // Rollback auth user
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            return { error: 'Gagal menyimpan profil akun: ' + profileError.message }
        }
    }

    return { success: true }
}
