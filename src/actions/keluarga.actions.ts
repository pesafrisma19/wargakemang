'use server'

import { createClient } from '@/lib/supabase/server'
import { Warga, Keluarga } from '@/types/database'
import { getWargaList } from './warga.actions'

export async function getKeluargaList(role: string, rt?: string | null, rw?: string | null): Promise<Keluarga[]> {
    const wargaData = await getWargaList(role, rt, rw)

    if (!wargaData || wargaData.length === 0) return []

    // Group by No. KK
    const grouped = wargaData.reduce((acc, warga) => {
        if (warga.no_kk) {
            if (!acc[warga.no_kk]) {
                acc[warga.no_kk] = []
            }
            acc[warga.no_kk].push(warga)
        }
        return acc
    }, {} as Record<string, Warga[]>)

    // Convert to Keluarga array and sort members
    const keluargaArr: Keluarga[] = Object.keys(grouped).map((no_kk) => {
        const anggotaList = grouped[no_kk]
        // Sort: KEPALA KELUARGA first, then ISTRI, then others
        const sortOrder: Record<string, number> = {
            'KEPALA KELUARGA': 1,
            'ISTRI': 2,
            'ANAK': 3,
            'ORANG TUA': 4,
            'MERTUA': 5,
            'MENANTU': 6,
            'CUCU': 7,
            'FAMILI LAIN': 8,
        }

        const sortedAnggota = [...anggotaList].sort((a, b) => {
            const orderA = sortOrder[a.hubungan_keluarga] || 99
            const orderB = sortOrder[b.hubungan_keluarga] || 99
            return orderA - orderB
        })

        const kepala = sortedAnggota.find(w => w.hubungan_keluarga === 'KEPALA KELUARGA') || null

        return {
            no_kk,
            anggota: sortedAnggota,
            kepala_keluarga: kepala,
        }
    })

    return keluargaArr
}
