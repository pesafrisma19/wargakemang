'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga, User, Keluarga } from '@/types/database'
import Link from 'next/link'
import { Search, Users, ChevronRight, Home, Copy, Check } from 'lucide-react'

export default function KeluargaPage() {
    const [keluargaList, setKeluargaList] = useState<Keluarga[]>([])
    const [profile, setProfile] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

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

                setKeluargaList(keluargaArr)
            }
        }

        setLoading(false)
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        }).catch(err => {
            console.error('Failed to copy: ', err)
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const filteredKeluarga = keluargaList.filter((k) => {
        const matchesSearch =
            k.no_kk.includes(searchQuery) ||
            k.kepala_keluarga?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            k.anggota.some(a => a.nama.toLowerCase().includes(searchQuery.toLowerCase()))

        return matchesSearch
    })

    const totalPages = Math.ceil(filteredKeluarga.length / itemsPerPage)
    const paginatedKeluarga = filteredKeluarga.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-20">
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
                {paginatedKeluarga.map((keluarga) => (
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
                            {keluarga.anggota.map((anggota, index) => {
                                const isExpanded = expandedId === anggota.id
                                const isCopied = copiedId === anggota.id
                                return (
                                    <div key={anggota.id} className="transition-all duration-200">
                                        <div
                                            className={`p-4 sm:px-6 hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50/80' : ''}`}
                                            onClick={() => toggleExpand(anggota.id)}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${anggota.hubungan_keluarga === 'KEPALA KELUARGA'
                                                        ? 'bg-emerald-500'
                                                        : anggota.hubungan_keluarga === 'ISTRI'
                                                            ? 'bg-pink-500'
                                                            : 'bg-blue-500'
                                                        }`}>
                                                        {anggota.nama.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-800 truncate">{anggota.nama}</p>
                                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${anggota.hubungan_keluarga === 'KEPALA KELUARGA'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : anggota.hubungan_keluarga === 'ISTRI'
                                                                    ? 'bg-pink-100 text-pink-700'
                                                                    : anggota.hubungan_keluarga === 'ANAK'
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
                                                <div className={`p-2 text-gray-400 rounded-lg transition-transform duration-200 ${isExpanded ? 'rotate-90 text-emerald-600' : ''}`}>
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>

                                            {/* Detailed View */}
                                            {isExpanded && (
                                                <div className="mt-4 pt-4 border-t border-gray-200/60 animate-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                        {/* Left Column */}
                                                        <div className="space-y-4">
                                                            {/* NIK with Copy */}
                                                            <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between shadow-sm">
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase mb-0.5">NIK</p>
                                                                    <p className="font-mono font-medium text-gray-800">{anggota.nik}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => copyToClipboard(anggota.nik, anggota.id)}
                                                                    className={`p-1.5 rounded-md transition-colors ${isCopied
                                                                        ? 'bg-emerald-50 text-emerald-600'
                                                                        : 'hover:bg-gray-50 text-gray-400 hover:text-emerald-600'
                                                                        }`}
                                                                    title={isCopied ? "Tersalin!" : "Salin NIK"}
                                                                >
                                                                    {isCopied ? (
                                                                        <Check size={16} />
                                                                    ) : (
                                                                        <Copy size={16} />
                                                                    )}
                                                                </button>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Tempat Lahir</span>
                                                                    <span className="text-gray-800 font-medium">{anggota.tempat_lahir}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Tanggal Lahir</span>
                                                                    <span className="text-gray-800 font-medium">{formatDate(anggota.tanggal_lahir)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Agama</span>
                                                                    <span className="text-gray-800 font-medium">{anggota.agama}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Pendidikan</span>
                                                                    <span className="text-gray-800 font-medium">{anggota.pendidikan || '-'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right Column */}
                                                        <div className="space-y-4">
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Pekerjaan</span>
                                                                    <span className="text-gray-800 font-medium">{anggota.pekerjaan}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Status Kawin</span>
                                                                    <span className="text-gray-800 font-medium">{anggota.status_kawin}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Kewarganegaraan</span>
                                                                    <span className="text-gray-800 font-medium">{anggota.kewarganegaraan}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm border-t border-gray-100 pt-3 mt-3">
                                                                    <span className="text-gray-500">Nama Ayah</span>
                                                                    <span className="text-gray-800 font-medium">{anggota.nama_ayah || '-'}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Nama Ibu</span>
                                                                    <span className="text-gray-800 font-medium">{anggota.nama_ibu || '-'}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex justify-end pt-2">
                                                                <Link
                                                                    href={`/dashboard/warga/${anggota.id}/edit`}
                                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                                                >
                                                                    Edit Data
                                                                    <ChevronRight size={14} />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div className="text-sm text-gray-500 text-center sm:text-left order-2 sm:order-1">
                        Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredKeluarga.length)} dari {filteredKeluarga.length} keluarga
                    </div>
                    <div className="flex gap-2 order-1 sm:order-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm bg-white text-emerald-700 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 transition-colors"
                        >
                            Sebelumnya
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm bg-white text-emerald-700 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-50 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 transition-colors"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
