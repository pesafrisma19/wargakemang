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
        const { name, phone, password, role, rt, rw } = await request.json()

        // Validate required fields
        if (!name || !phone || !password || !role) {
            return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
        }

        if (role === 'rt' && (!rt || !rw)) {
            return NextResponse.json({ error: 'RT dan RW wajib diisi untuk role RT' }, { status: 400 })
        }

        // Create email from phone
        const email = `${phone.replace(/\D/g, '')}@wargakemang.local`

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('phone', phone)
            .single()

        if (existingUser) {
            return NextResponse.json({ error: 'Nomor HP sudah terdaftar' }, { status: 400 })
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        })

        if (authError) {
            console.error('Auth error:', authError)
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        // Create user profile in users table
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                name,
                phone,
                role,
                rt: role === 'rt' ? rt : null,
                rw: role === 'rt' ? rw : null,
            })

        if (profileError) {
            // Rollback: delete auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            console.error('Profile error:', profileError)
            return NextResponse.json({ error: profileError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, userId: authData.user.id })
    } catch (err: any) {
        console.error('Create user error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
