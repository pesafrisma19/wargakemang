'use server'

import { createClient } from '@/lib/supabase/server'
import { User } from '@/types/database'

export async function getUsersList(): Promise<User[]> {
    const supabase = await createClient()

    // Cek auth, pastikan admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
        throw new Error('Hanya admin yang dapat melihat daftar user')
    }

    const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return usersData || []
}
