'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga, User, Keluarga } from '@/types/database'
import Link from 'next/link'
import { Search, Users, ChevronRight, Home } from 'lucide-react'

export default function KeluargaPage() {
    const [keluargaList, setKeluargaList] = useState<Keluarga[]>([])
    const [profile, setProfile] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()
            setProfile(profileData)

            let query = supabase.from('warga').select('*').order('created_at', { ascending: true })

            if (profileData?.role !== 'admin') {
                query = query.eq('rt', profileData?.rt).eq('rw', profileData?.rw)
            }

            const { data: wargaData } = await query

            // Group by No. KK
            if (wargaData) {
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
                    // Sort: Kepala Keluarga first, then Istri, then others
                    const sortOrder: Record<string, number> = {
                        'Kepala Keluarga': 1,
                        'Istri': 2,
                        'Anak': 3,
                        'Orang Tua': 4,
                        'Mertua': 5,
                        'Menantu': 6,
                        'Cucu': 7,
                        'Famili Lain': 8,
                    }

                    const sortedAnggota = [...anggotaList].sort((a, b) => {
                        const orderA = sortOrder[a.hubungan_keluarga] || 99
                        const orderB = sortOrder[b.hubungan_keluarga] || 99
                        return orderA - orderB
                    })

                    const kepala = sortedAnggota.find(w => w.hubungan_keluarga === 'Kepala Keluarga') || null

                    return {
                        no_kk,
                        anggota: sortedAnggota,
                        kepala_keluarga: kepala,
                    }
                })

                setKeluargaList(keluargaArr)
            }
        }

        setLoading(false)
    }

    const filteredKeluarga = keluargaList.filter((k) => {
        const matchesSearch =
            k.no_kk.includes(searchQuery) ||
            k.kepala_keluarga?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            k.anggota.some(a => a.nama.toLowerCase().includes(searchQuery.toLowerCase()))

        return matchesSearch
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Data Keluarga</h1>
                <p className="text-gray-500 text-sm sm:text-base mt-1">
                    Daftar keluarga berdasarkan No. Kartu Keluarga
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 sm:p-3 bg-emerald-100 rounded-xl">
                            <Home className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-800">{keluargaList.length}</p>
                            <p className="text-gray-500 text-xs sm:text-sm">Total KK</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                                {keluargaList.reduce((sum, k) => sum + k.anggota.length, 0)}
                            </p>
                            <p className="text-gray-500 text-xs sm:text-sm">Total Anggota</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari No. KK atau nama kepala keluarga..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800 placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Keluarga List */}
            <div className="space-y-3 sm:space-y-4">
                {filteredKeluarga.map((keluarga) => (
                    <div
                        key={keluarga.no_kk}
                        className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 font-medium">No. Kartu Keluarga</p>
                                    <p className="text-base sm:text-lg font-bold text-gray-800 font-mono">{keluarga.no_kk}</p>
                                    {keluarga.kepala_keluarga && (
                                        <p className="text-sm text-gray-600 mt-1 truncate">
                                            <span className="text-gray-400">Kepala:</span> {keluarga.kepala_keluarga.nama}
                                        </p>
                                    )}
                                </div>
                                <div className="flex-shrink-0 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                    {keluarga.anggota.length} orang
                                </div>
                            </div>
                        </div>

                        {/* Members */}
                        <div className="divide-y divide-gray-100">
                            {keluarga.anggota.map((anggota, index) => (
                                <div key={anggota.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${anggota.hubungan_keluarga === 'Kepala Keluarga'
                                                ? 'bg-emerald-500'
                                                : anggota.hubungan_keluarga === 'Istri'
                                                    ? 'bg-pink-500'
                                                    : 'bg-blue-500'
                                                }`}>
                                                {anggota.nama.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-800 truncate">{anggota.nama}</p>
                                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${anggota.hubungan_keluarga === 'Kepala Keluarga'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : anggota.hubungan_keluarga === 'Istri'
                                                            ? 'bg-pink-100 text-pink-700'
                                                            : anggota.hubungan_keluarga === 'Anak'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {anggota.hubungan_keluarga}
                                                    </span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span className="hidden sm:inline">{anggota.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/dashboard/warga/${anggota.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <ChevronRight size={20} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredKeluarga.length === 0 && (
                    <div className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-sm border border-gray-100">
                        <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                            {searchQuery
                                ? 'Tidak ada keluarga yang sesuai'
                                : 'Belum ada data keluarga. Pastikan data warga memiliki No. KK.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
