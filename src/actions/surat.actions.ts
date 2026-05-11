'use server'

import { createClient } from '@/lib/supabase/server'
import { SuratRecord, Pengaturan, JenisSurat, JENIS_SURAT_LABELS } from '@/types/database'

export async function getSuratData() {
    const supabase = await createClient()

    // Fetch pengaturan
    const { data: pengaturan } = await supabase.from('pengaturan').select('*').eq('id', 1).single()

    // Fetch all surat
    const { data: allSurat, count } = await supabase
        .from('surat')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    const data = allSurat || []
    
    // Count per jenis
    const counts: Record<string, number> = {}
    data.forEach(s => { counts[s.jenis_surat] = (counts[s.jenis_surat] || 0) + 1 })

    // Bulan ini
    const now = new Date()
    const bulanIni = data.filter(s => {
        const d = new Date(s.created_at)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length

    // Jenis terbanyak
    let maxJenis = '-'
    let maxCount = 0
    Object.entries(counts).forEach(([k, v]) => {
        if (v > maxCount) { maxCount = v; maxJenis = k }
    })
    const jenisTerbanyak = maxJenis !== '-' ? (JENIS_SURAT_LABELS[maxJenis as JenisSurat] || maxJenis) : '-'

    return {
        pengaturan,
        riwayat: data,
        totalSurat: count || 0,
        countPerJenis: counts,
        bulanIni,
        jenisTerbanyak
    }
}

export async function deleteSurat(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('surat').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return true
}
