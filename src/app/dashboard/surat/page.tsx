'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SuratRecord, JENIS_SURAT_LABELS } from '@/types/database'
import Link from 'next/link'
import { FileText, MapPin, Clock, Trash2, ChevronRight } from 'lucide-react'

const SURAT_TYPES = [
    {
        jenis: 'domisili' as const,
        label: 'Surat Keterangan Domisili',
        desc: 'Menerangkan domisili/tempat tinggal warga',
        icon: '📍',
        color: 'from-emerald-500 to-teal-500',
        bgLight: 'bg-emerald-50',
        available: true,
    },
    {
        jenis: 'kematian' as const,
        label: 'Surat Keterangan Kematian',
        desc: 'Menerangkan kematian seorang warga',
        icon: '🕯️',
        color: 'from-gray-500 to-gray-600',
        bgLight: 'bg-gray-50',
        available: false,
    },
    {
        jenis: 'kelahiran' as const,
        label: 'Surat Keterangan Kelahiran',
        desc: 'Menerangkan kelahiran bayi',
        icon: '👶',
        color: 'from-pink-500 to-rose-500',
        bgLight: 'bg-pink-50',
        available: false,
    },
    {
        jenis: 'sku' as const,
        label: 'Surat Keterangan Usaha',
        desc: 'Menerangkan usaha yang dimiliki warga',
        icon: '🏪',
        color: 'from-blue-500 to-indigo-500',
        bgLight: 'bg-blue-50',
        available: false,
    },
    {
        jenis: 'sktm' as const,
        label: 'Surat Keterangan Tidak Mampu',
        desc: 'Menerangkan kondisi ekonomi warga',
        icon: '💰',
        color: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        available: false,
    },
    {
        jenis: 'beda-data' as const,
        label: 'Surat Keterangan Beda Data',
        desc: 'Menerangkan perbedaan data pada dokumen',
        icon: '📋',
        color: 'from-purple-500 to-violet-500',
        bgLight: 'bg-purple-50',
        available: false,
    },
]

export default function SuratPage() {
    const [riwayat, setRiwayat] = useState<SuratRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [totalSurat, setTotalSurat] = useState(0)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchRiwayat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchRiwayat = async () => {
        setLoading(true)
        const { data, count } = await supabase
            .from('surat')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(10)

        setRiwayat(data || [])
        setTotalSurat(count || 0)
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        await supabase.from('surat').delete().eq('id', deleteId)
        setRiwayat(riwayat.filter(s => s.id !== deleteId))
        setTotalSurat(prev => prev - 1)
        setShowDeleteModal(false)
        setDeleteId(null)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FileText className="w-7 h-7 text-emerald-600" />
                    Pembuatan Surat
                </h1>
                <p className="text-gray-500 mt-1">
                    Pilih jenis surat untuk membuat surat baru • Total surat tercetak: <span className="font-semibold text-emerald-600">{totalSurat}</span>
                </p>
            </div>

            {/* Jenis Surat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SURAT_TYPES.map((surat) => (
                    <div key={surat.jenis} className="relative">
                        {surat.available ? (
                            <Link
                                href={`/dashboard/surat/${surat.jenis}`}
                                className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 ${surat.bgLight} rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                        {surat.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                                            {surat.label}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">{surat.desc}</p>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-400 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-1" />
                                </div>
                            </Link>
                        ) : (
                            <div className="bg-white/60 rounded-2xl p-5 shadow-sm border border-gray-100 opacity-60 cursor-not-allowed">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                                        {surat.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-500">{surat.label}</h3>
                                        <p className="text-sm text-gray-400 mt-1">Segera hadir</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Riwayat Surat */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-800">Riwayat Surat</h2>
                    </div>
                    <span className="text-sm text-gray-500">{totalSurat} surat</span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : riwayat.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {riwayat.map((surat) => (
                            <div key={surat.id} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <MapPin size={18} className="text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-800 truncate">
                                            {JENIS_SURAT_LABELS[surat.jenis_surat] || surat.jenis_surat}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {surat.warga_nama} • {surat.nomor_surat}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-xs text-gray-400 hidden sm:block">
                                        {formatDate(surat.created_at)}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setDeleteId(surat.id)
                                            setShowDeleteModal(true)
                                        }}
                                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                                        title="Hapus riwayat"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-500">
                        <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                        <p>Belum ada surat yang dibuat</p>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Hapus Riwayat Surat</h3>
                        <p className="text-gray-600 mb-6">Hapus riwayat surat ini dari arsip?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
