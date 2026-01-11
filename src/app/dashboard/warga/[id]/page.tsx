'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga } from '@/types/database'
import { ArrowLeft, Edit, User, MapPin, Phone, Calendar, Briefcase, Heart, Users, CreditCard, Image } from 'lucide-react'
import Link from 'next/link'

export default function DetailWargaPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [warga, setWarga] = useState<Warga | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await supabase
                .from('warga')
                .select('*')
                .eq('id', resolvedParams.id)
                .single()

            setWarga(data)
            setLoading(false)
        }
        fetchData()
    }, [resolvedParams.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    if (!warga) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Data warga tidak ditemukan</p>
                <Link href="/dashboard/warga" className="text-emerald-600 hover:underline mt-2 inline-block">
                    Kembali ke daftar warga
                </Link>
            </div>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link
                        href="/dashboard/warga"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                        <ArrowLeft size={20} className="text-gray-600 sm:w-6 sm:h-6" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Detail Warga</h1>
                        <p className="text-gray-500 text-sm sm:text-base">Informasi lengkap warga</p>
                    </div>
                </div>
                <Link
                    href={`/dashboard/warga/${warga.id}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <Edit size={18} />
                    <span className="hidden sm:inline">Edit</span>
                </Link>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Main Info Card */}
                <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={32} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{warga.nama}</h2>
                            <p className="text-gray-500 font-mono text-sm sm:text-base">{warga.nik}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${warga.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                                    }`}>
                                    {warga.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    RT {warga.rt} / RW {warga.rw}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Calendar size={18} className="text-emerald-500" />
                                Data Pribadi
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tempat Lahir</span>
                                    <span className="text-gray-800 font-medium">{warga.tempat_lahir}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tanggal Lahir</span>
                                    <span className="text-gray-800 font-medium">{formatDate(warga.tanggal_lahir)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Agama</span>
                                    <span className="text-gray-800 font-medium">{warga.agama}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Golongan Darah</span>
                                    <span className="text-gray-800 font-medium">{warga.golongan_darah || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Kewarganegaraan</span>
                                    <span className="text-gray-800 font-medium">{warga.kewarganegaraan}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Heart size={18} className="text-pink-500" />
                                Status
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status Kawin</span>
                                    <span className="text-gray-800 font-medium">{warga.status_kawin}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pekerjaan</span>
                                    <span className="text-gray-800 font-medium">{warga.pekerjaan}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Hubungan Keluarga</span>
                                    <span className="text-gray-800 font-medium">{warga.hubungan_keluarga || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Address Info */}
                        <div className="sm:col-span-2 space-y-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <MapPin size={18} className="text-orange-500" />
                                Alamat
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 text-sm">
                                <p className="text-gray-800 font-medium">{warga.alamat}</p>
                                <p className="text-gray-600 mt-1">
                                    RT {warga.rt} / RW {warga.rw}, Desa {warga.desa},
                                    Kec. {warga.kecamatan}, {warga.kabupaten}, {warga.provinsi}
                                </p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="sm:col-span-2 space-y-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Phone size={18} className="text-green-500" />
                                Kontak & Keluarga
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">No. WhatsApp</p>
                                    <p className="text-gray-800 font-medium mt-1">{warga.no_wa || '-'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">No. Kartu Keluarga</p>
                                    <p className="text-gray-800 font-mono font-medium mt-1">{warga.no_kk || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Photo Card */}
                <div className="space-y-4">
                    {/* Foto KTP */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <Image size={18} className="text-purple-500" />
                            Foto KTP
                        </h3>
                        {warga.foto_ktp ? (
                            <img
                                src={warga.foto_ktp}
                                alt="Foto KTP"
                                className="w-full rounded-lg border border-gray-200"
                            />
                        ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                <span className="text-sm">Tidak ada foto</span>
                            </div>
                        )}
                    </div>

                    {/* Timestamps */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Riwayat Data</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide">Dibuat</p>
                                <p className="text-gray-800">{formatDate(warga.created_at)}</p>
                            </div>
                            {warga.updated_at && (
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Terakhir Diubah</p>
                                    <p className="text-gray-800">{formatDate(warga.updated_at)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
