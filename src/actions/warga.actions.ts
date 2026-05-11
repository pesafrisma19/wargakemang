'use server'

import { createClient } from '@/lib/supabase/server'
import { WargaInput } from '@/types/database'

export async function getWargaList(role: string, rt?: string | null, rw?: string | null) {
    const supabase = await createClient()

    let query = supabase.from('warga').select('*').order('created_at', { ascending: false })

    if (role === 'rt') {
        if (!rt || !rw) throw new Error('Akses ditolak: Data RT/RW tidak valid')
        query = query.eq('rt', rt).eq('rw', rw)
    }

    const { data, error } = await query

    if (error) throw new Error(`Gagal mengambil data warga: ${error.message}`)

    return data
}

export async function getWargaStats(role: string, rt?: string | null, rw?: string | null) {
    const data = await getWargaList(role, rt, rw)
    
    const totalWarga = data.length
    const totalKK = new Set(data.filter(w => w.no_kk).map(w => w.no_kk)).size
    
    let aktif = 0, meninggal = 0, pindah = 0
    data.forEach(w => {
        if (w.status_warga === 'AKTIF') aktif++
        else if (w.status_warga === 'MENINGGAL') meninggal++
        else if (w.status_warga === 'PINDAH') pindah++
    })

    return { totalWarga, totalKK, aktif, meninggal, pindah, data }
}

export async function checkNikTerdaftar(nik: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('warga')
        .select('nik, nama')
        .eq('nik', nik)
        .single()
    return data
}

export async function deleteWarga(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('warga').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return true
}
