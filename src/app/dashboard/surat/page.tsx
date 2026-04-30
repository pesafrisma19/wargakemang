'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SuratRecord, JENIS_SURAT_LABELS, JenisSurat, Pengaturan } from '@/types/database'
import Link from 'next/link'
import { FileText, Clock, Trash2, ChevronRight, Search, Eye, Filter, TrendingUp, CalendarDays, Award } from 'lucide-react'
import { generateSuratDomisili, DomisiliData } from '@/lib/surat/domisili'
import { generateSuratKelahiran, KelahiranData } from '@/lib/surat/kelahiran'
import { generateSuratUsaha, UsahaData } from '@/lib/surat/usaha'

const SURAT_TYPES = [
    {
        jenis: 'domisili' as const,
        label: 'Surat Keterangan Domisili',
        desc: 'Menerangkan domisili / tempat tinggal warga',
        icon: '📍',
        gradient: 'from-emerald-500 to-teal-500',
        bgLight: 'bg-emerald-50',
        borderHover: 'hover:border-emerald-300',
        textHover: 'group-hover:text-emerald-700',
        badgeBg: 'bg-emerald-100 text-emerald-700',
        available: true,
    },
    {
        jenis: 'kelahiran' as const,
        label: 'Surat Kelahiran',
        desc: 'Surat keterangan kelahiran bayi baru',
        icon: '👶',
        gradient: 'from-pink-500 to-rose-500',
        bgLight: 'bg-pink-50',
        borderHover: 'hover:border-pink-300',
        textHover: 'group-hover:text-pink-700',
        badgeBg: 'bg-pink-100 text-pink-700',
        available: true,
    },
    {
        jenis: 'sku' as const,
        label: 'Surat Keterangan Usaha',
        desc: 'Menerangkan usaha yang dimiliki warga',
        icon: '🏪',
        gradient: 'from-blue-500 to-indigo-500',
        bgLight: 'bg-blue-50',
        borderHover: 'hover:border-blue-300',
        textHover: 'group-hover:text-blue-700',
        badgeBg: 'bg-blue-100 text-blue-700',
        available: true,
    },
    {
        jenis: 'kematian' as const,
        label: 'Surat Keterangan Kematian',
        desc: 'Menerangkan kematian seorang warga',
        icon: '🕯️',
        gradient: 'from-gray-500 to-gray-600',
        bgLight: 'bg-gray-50',
        borderHover: '',
        textHover: '',
        badgeBg: 'bg-gray-100 text-gray-600',
        available: false,
    },
    {
        jenis: 'na' as const,
        label: 'Surat Ket. Nikah (NA)',
        desc: 'Menerangkan pengantar nikah (N1-N6)',
        icon: '💍',
        gradient: 'from-rose-500 to-pink-600',
        bgLight: 'bg-rose-50',
        borderHover: 'hover:border-rose-300',
        textHover: 'group-hover:text-rose-700',
        badgeBg: 'bg-rose-100 text-rose-700',
        available: true,
    },
    {
        jenis: 'sktm' as const,
        label: 'Surat Ket. Tidak Mampu',
        desc: 'Menerangkan kondisi ekonomi warga',
        icon: '💰',
        gradient: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        borderHover: '',
        textHover: '',
        badgeBg: 'bg-amber-100 text-amber-700',
        available: false,
    },
    {
        jenis: 'beda-data' as const,
        label: 'Surat Ket. Beda Data',
        desc: 'Menerangkan perbedaan data pada dokumen',
        icon: '📋',
        gradient: 'from-purple-500 to-violet-500',
        bgLight: 'bg-purple-50',
        borderHover: '',
        textHover: '',
        badgeBg: 'bg-purple-100 text-purple-700',
        available: false,
    },
]

const ICON_MAP: Record<string, string> = {
    domisili: '📍', kelahiran: '👶', sku: '🏪', kematian: '🕯️', sktm: '💰', 'beda-data': '📋', na: '💍'
}

export default function SuratPage() {
    const [riwayat, setRiwayat] = useState<SuratRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [totalSurat, setTotalSurat] = useState(0)
    const [countPerJenis, setCountPerJenis] = useState<Record<string, number>>({})
    const [bulanIni, setBulanIni] = useState(0)
    const [jenisTerbanyak, setJenisTerbanyak] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [filterJenis, setFilterJenis] = useState<string>('semua')
    const [searchQuery, setSearchQuery] = useState('')
    const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null)
    const [regenerating, setRegenerating] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchAll = async () => {
        setLoading(true)

        // Fetch pengaturan
        const { data: pData } = await supabase.from('pengaturan').select('*').eq('id', 1).single()
        setPengaturan(pData)

        // Fetch all surat
        const { data, count } = await supabase
            .from('surat')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        const allSurat = data || []
        setRiwayat(allSurat)
        setTotalSurat(count || 0)

        // Count per jenis
        const counts: Record<string, number> = {}
        allSurat.forEach(s => { counts[s.jenis_surat] = (counts[s.jenis_surat] || 0) + 1 })
        setCountPerJenis(counts)

        // Bulan ini
        const now = new Date()
        const thisMonth = allSurat.filter(s => {
            const d = new Date(s.created_at)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length
        setBulanIni(thisMonth)

        // Jenis terbanyak
        let maxJenis = '-'
        let maxCount = 0
        Object.entries(counts).forEach(([k, v]) => {
            if (v > maxCount) { maxCount = v; maxJenis = k }
        })
        setJenisTerbanyak(maxJenis !== '-' ? (JENIS_SURAT_LABELS[maxJenis as JenisSurat] || maxJenis) : '-')

        setLoading(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        await supabase.from('surat').delete().eq('id', deleteId)
        setRiwayat(riwayat.filter(s => s.id !== deleteId))
        setTotalSurat(prev => prev - 1)
        setShowDeleteModal(false)
        setDeleteId(null)
        // Recount
        fetchAll()
    }

    const handleReprint = async (surat: SuratRecord) => {
        if (!pengaturan) return
        setRegenerating(surat.id)
        try {
            if (surat.jenis_surat === 'na') {
                window.open(`/dashboard/surat/na/print/${surat.id}`, '_blank')
                setRegenerating(null)
                return
            }

            let doc
            const d = surat.data_surat as any
            if (surat.jenis_surat === 'domisili') {
                doc = await generateSuratDomisili(d as DomisiliData, pengaturan)
            } else if (surat.jenis_surat === 'kelahiran') {
                doc = await generateSuratKelahiran(d as KelahiranData, pengaturan)
            } else if (surat.jenis_surat === 'sku') {
                doc = await generateSuratUsaha(d as UsahaData, pengaturan)
            }
            if (doc) {
                window.open(doc.output('bloburl') as unknown as string, '_blank')
            }
        } catch (err) {
            console.error('Gagal regenerate PDF:', err)
        }
        setRegenerating(null)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
        })
    }

    // Filtered & searched riwayat
    const filteredRiwayat = riwayat.filter(s => {
        const matchJenis = filterJenis === 'semua' || s.jenis_surat === filterJenis
        const matchSearch = !searchQuery || 
            s.warga_nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.nomor_surat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.warga_nik?.includes(searchQuery)
        return matchJenis && matchSearch
    })

    if (loading) {
        return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div></div>)
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FileText className="w-7 h-7 text-emerald-600" />
                    Pembuatan Surat
                </h1>
                <p className="text-gray-500 mt-1">Kelola dan cetak surat-surat administrasi desa</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <TrendingUp size={20} className="text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500 truncate">Total Surat</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">{totalSurat}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <CalendarDays size={20} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500 truncate">Bulan Ini</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">{bulanIni}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Award size={20} className="text-amber-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500 truncate">Terbanyak</p>
                            <p className="text-sm sm:text-base font-bold text-gray-800 truncate">{jenisTerbanyak}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jenis Surat Grid */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pilih Jenis Surat</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {SURAT_TYPES.map((surat) => (
                        <div key={surat.jenis}>
                            {surat.available ? (
                                <Link
                                    href={`/dashboard/surat/${surat.jenis}`}
                                    className={`block bg-white rounded-2xl shadow-sm border border-gray-100 ${surat.borderHover} hover:shadow-lg transition-all group h-full`}
                                >
                                    {/* Gradient strip top */}
                                    <div className={`h-1.5 bg-gradient-to-r ${surat.gradient} rounded-t-2xl`} />
                                    <div className="p-4 sm:p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-11 h-11 ${surat.bgLight} rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                                {surat.icon}
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${surat.badgeBg}`}>
                                                {countPerJenis[surat.jenis] || 0}
                                            </span>
                                        </div>
                                        <h3 className={`font-semibold text-gray-800 text-sm sm:text-base ${surat.textHover} transition-colors leading-tight`}>
                                            {surat.label}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{surat.desc}</p>
                                        <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 group-hover:text-emerald-500 transition-colors">
                                            <span>Buat Surat</span>
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div className="bg-gray-50/80 rounded-2xl border border-gray-100 opacity-50 cursor-not-allowed h-full">
                                    <div className="h-1.5 bg-gray-200 rounded-t-2xl" />
                                    <div className="p-4 sm:p-5">
                                        <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-xl mb-3">
                                            {surat.icon}
                                        </div>
                                        <h3 className="font-semibold text-gray-400 text-sm sm:text-base leading-tight">{surat.label}</h3>
                                        <p className="text-xs text-gray-300 mt-1.5">Segera hadir</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Riwayat Surat */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-800">Riwayat Surat</h2>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{totalSurat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filterJenis}
                                    onChange={(e) => setFilterJenis(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                                >
                                    <option value="semua">Semua Jenis</option>
                                    {SURAT_TYPES.filter(s => s.available).map(s => (
                                        <option key={s.jenis} value={s.jenis}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama warga, NIK, atau nomor surat..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 placeholder-gray-400"
                        />
                    </div>
                </div>

                {filteredRiwayat.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredRiwayat.map((surat) => (
                            <div key={surat.id} className="px-5 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                                            {ICON_MAP[surat.jenis_surat] || '📄'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-800 truncate text-sm sm:text-base">
                                                {surat.warga_nama}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {JENIS_SURAT_LABELS[surat.jenis_surat] || surat.jenis_surat} • {surat.nomor_surat}
                                            </p>
                                            <p className="text-xs text-gray-300 mt-0.5">
                                                {formatDate(surat.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {/* Lihat / Print ulang */}
                                        <button
                                            onClick={() => handleReprint(surat)}
                                            disabled={regenerating === surat.id}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                                            title="Lihat & Print ulang"
                                        >
                                            {regenerating === surat.id ? (
                                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent" />
                                            ) : (
                                                <Eye size={14} />
                                            )}
                                            <span className="hidden sm:inline">Lihat</span>
                                        </button>
                                        {/* Hapus */}
                                        <button
                                            onClick={() => { setDeleteId(surat.id); setShowDeleteModal(true) }}
                                            className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                            title="Hapus riwayat"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                        <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                        <p className="font-medium">{searchQuery || filterJenis !== 'semua' ? 'Tidak ada surat ditemukan' : 'Belum ada surat yang dibuat'}</p>
                        {(searchQuery || filterJenis !== 'semua') && (
                            <button onClick={() => { setSearchQuery(''); setFilterJenis('semua') }} className="text-sm text-emerald-600 mt-2 hover:underline">
                                Reset pencarian
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Hapus Riwayat Surat</h3>
                        <p className="text-gray-600 mb-6">Hapus riwayat surat ini dari arsip? Surat yang sudah dicetak tidak akan terpengaruh.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl">Batal</button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
