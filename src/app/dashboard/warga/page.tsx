'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga, User } from '@/types/database'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Download, FileSpreadsheet, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function WargaPage() {
    const [warga, setWarga] = useState<Warga[]>([])
    const [profile, setProfile] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRT, setFilterRT] = useState('')
    const [filterRW, setFilterRW] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)

        // Get current user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()
            setProfile(profileData)

            // Fetch warga based on role
            let query = supabase.from('warga').select('*').order('created_at', { ascending: false })

            if (profileData?.role !== 'admin') {
                query = query.eq('rt', profileData?.rt).eq('rw', profileData?.rw)
            }

            const { data } = await query
            setWarga(data || [])
        }

        setLoading(false)
    }

    const filteredWarga = warga.filter((w) => {
        const matchesSearch =
            w.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.nik.includes(searchQuery) ||
            w.no_kk?.includes(searchQuery)

        const matchesRT = !filterRT || w.rt === filterRT
        const matchesRW = !filterRW || w.rw === filterRW

        return matchesSearch && matchesRT && matchesRW
    })

    const handleDelete = async () => {
        if (!deleteId) return

        await supabase.from('warga').delete().eq('id', deleteId)
        setWarga(warga.filter(w => w.id !== deleteId))
        setShowDeleteModal(false)
        setDeleteId(null)
    }

    const exportToExcel = () => {
        const exportData = filteredWarga.map((w, index) => ({
            'No': index + 1,
            'NIK': w.nik,
            'Nama': w.nama,
            'Tempat Lahir': w.tempat_lahir,
            'Tanggal Lahir': w.tanggal_lahir,
            'Jenis Kelamin': w.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
            'Alamat': w.alamat,
            'Alamat Kampung': w.alamat_kampung,
            'RT': w.rt,
            'RW': w.rw,
            'Desa': w.desa,
            'Kecamatan': w.kecamatan,
            'Kabupaten': w.kabupaten,
            'Provinsi': w.provinsi,
            'Agama': w.agama,
            'Status Kawin': w.status_kawin,
            'Pekerjaan': w.pekerjaan,
            'Kewarganegaraan': w.kewarganegaraan,
            'Golongan Darah': w.golongan_darah || '-',
            'No. KK': w.no_kk || '-',
            'No. WA': w.no_wa || '-',
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Data Warga')
        XLSX.writeFile(wb, `data_warga_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const exportToPDF = () => {
        const doc = new jsPDF('landscape')

        doc.setFontSize(16)
        doc.text('Data Warga Kemang', 14, 15)
        doc.setFontSize(10)
        doc.text(`Diekspor: ${new Date().toLocaleDateString('id-ID')}`, 14, 22)

        const tableData = filteredWarga.map((w, index) => [
            index + 1,
            w.nik,
            w.nama,
            w.jenis_kelamin === 'L' ? 'L' : 'P',
            `${w.rt}/${w.rw}`,
            w.no_kk || '-',
            w.no_wa || '-',
        ])

        autoTable(doc, {
            head: [['No', 'NIK', 'Nama', 'JK', 'RT/RW', 'No. KK', 'No. WA']],
            body: tableData,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [16, 185, 129] },
        })

        doc.save(`data_warga_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Data Warga</h1>
                    <p className="text-gray-500 mt-1">
                        {profile?.role === 'admin'
                            ? 'Menampilkan semua data warga'
                            : `Data warga RT ${profile?.rt} / RW ${profile?.rw}`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={exportToExcel}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-medium rounded-xl hover:bg-green-100 transition-colors"
                    >
                        <FileSpreadsheet size={18} />
                        Export Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <FileText size={18} />
                        Export PDF
                    </button>
                    <Link
                        href="/dashboard/warga/tambah"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                    >
                        <Plus size={18} />
                        Tambah Warga
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama, NIK, atau No. KK..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    {profile?.role === 'admin' && (
                        <>
                            <select
                                value={filterRW}
                                onChange={(e) => setFilterRW(e.target.value)}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Semua RW</option>
                                <option value="001">RW 001</option>
                                <option value="002">RW 002</option>
                            </select>
                            <select
                                value={filterRT}
                                onChange={(e) => setFilterRT(e.target.value)}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Semua RT</option>
                                {['001', '002', '003', '004', '005', '006', '007'].map(rt => (
                                    <option key={rt} value={rt}>RT {rt}</option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">NIK</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Jenis Kelamin</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">RT/RW</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">No. KK</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">No. WA</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredWarga.map((w) => (
                                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{w.nik}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{w.nama}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${w.jenis_kelamin === 'L'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-pink-100 text-pink-800'
                                            }`}>
                                            {w.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{w.rt}/{w.rw}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{w.no_kk || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{w.no_wa || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                href={`/dashboard/warga/${w.id}/edit`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setDeleteId(w.id)
                                                    setShowDeleteModal(true)
                                                }}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredWarga.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        {searchQuery || filterRT || filterRW
                                            ? 'Tidak ada data yang sesuai dengan filter'
                                            : 'Belum ada data warga'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination info */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Menampilkan {filteredWarga.length} dari {warga.length} data warga
                    </p>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Konfirmasi Hapus</h3>
                        <p className="text-gray-600 mb-6">
                            Apakah Anda yakin ingin menghapus data warga ini? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
