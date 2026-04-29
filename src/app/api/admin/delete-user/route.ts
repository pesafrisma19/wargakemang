import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role key for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'User ID wajib diisi' }, { status: 400 })
        }

        // 1. Delete from users table first (profile data)
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId)

        if (dbError) {
            console.error('Delete user profile error:', dbError)
            return NextResponse.json({ error: 'Gagal menghapus profil user: ' + dbError.message }, { status: 400 })
        }

        // 2. Delete from Supabase Auth (so they can't login anymore)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
            console.error('Delete auth user error:', authError)
            return NextResponse.json({ error: 'Profil terhapus tapi gagal hapus akun auth: ' + authError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Delete user error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
