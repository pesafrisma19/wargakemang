'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga, User } from '@/types/database'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, FileSpreadsheet, FileText, MoreVertical, X, Eye } from 'lucide-react'
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
    const [showExportMenu, setShowExportMenu] = useState(false)
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

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const totalPages = Math.ceil(filteredWarga.length / itemsPerPage)

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, filterRT, filterRW])

    const paginatedWarga = filteredWarga.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

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
        setShowExportMenu(false)
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
        setShowExportMenu(false)
    }

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
            <div className="flex flex-col gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Data Warga</h1>
                    <p className="text-gray-500 text-sm sm:text-base mt-1">
                        {profile?.role === 'admin'
                            ? 'Menampilkan semua data warga'
                            : `Data warga RT ${profile?.rt} / RW ${profile?.rw}`}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    {/* Export Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg sm:rounded-xl hover:bg-gray-200 transition-colors text-sm sm:text-base"
                        >
                            <FileSpreadsheet size={18} />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        {showExportMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                                    <button
                                        onClick={exportToExcel}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
                                    >
                                        <FileSpreadsheet size={16} className="text-green-600" />
                                        Export Excel
                                    </button>
                                    <button
                                        onClick={exportToPDF}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl"
                                    >
                                        <FileText size={16} className="text-red-600" />
                                        Export PDF
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <Link
                        href="/dashboard/warga/tambah"
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-lg sm:rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
                    >
                        <Plus size={18} />
                        <span>Tambah</span>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="sm:col-span-2 lg:col-span-2 relative">
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama, NIK, atau No. KK..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800 placeholder-gray-400"
                        />
                    </div>
                    {profile?.role === 'admin' && (
                        <>
                            <select
                                value={filterRW}
                                onChange={(e) => setFilterRW(e.target.value)}
                                className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white text-gray-800"
                            >
                                <option value="">Semua RW</option>
                                <option value="001">RW 001</option>
                                <option value="002">RW 002</option>
                            </select>
                            <select
                                value={filterRT}
                                onChange={(e) => setFilterRT(e.target.value)}
                                className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white text-gray-800"
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

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
                {filteredWarga.map((w) => (
                    <div key={w.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 truncate">{w.nama}</h3>
                                <p className="text-sm text-gray-500 font-mono mt-0.5">{w.nik}</p>
                            </div>
                            <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${w.jenis_kelamin === 'L'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-pink-100 text-pink-800'
                                }`}>
                                {w.jenis_kelamin === 'L' ? 'L' : 'P'}
                            </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-400">RT/RW:</span>
                                <span className="ml-1 text-gray-700">{w.rt}/{w.rw}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">No. KK:</span>
                                <span className="ml-1 text-gray-700 font-mono text-xs">{w.no_kk || '-'}</span>
                            </div>
                            {w.no_wa && (
                                <div className="col-span-2">
                                    <span className="text-gray-400">WA:</span>
                                    <span className="ml-1 text-gray-700">{w.no_wa}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                            <Link
                                href={`/dashboard/warga/${w.id}`}
                                className="flex-1 flex items-center justify-center gap-1 py-2 text-emerald-600 bg-emerald-50 rounded-lg text-sm font-medium"
                            >
                                <Eye size={16} />
                                Lihat
                            </Link>
                            <Link
                                href={`/dashboard/warga/${w.id}/edit`}
                                className="flex-1 flex items-center justify-center gap-1 py-2 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium"
                            >
                                <Edit size={16} />
                                Edit
                            </Link>
                            <button
                                onClick={() => {
                                    setDeleteId(w.id)
                                    setShowDeleteModal(true)
                                }}
                                className="flex-1 flex items-center justify-center gap-1 py-2 text-red-600 bg-red-50 rounded-lg text-sm font-medium"
                            >
                                <Trash2 size={16} />
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}

                {filteredWarga.length === 0 && (
                    <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                        {searchQuery || filterRT || filterRW
                            ? 'Tidak ada data yang sesuai'
                            : 'Belum ada data warga'}
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Table - Gunakan paginatedWarga */}
                <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">No</th>
                                    <th className="px-4 py-3">NIK</th>
                                    <th className="px-4 py-3">Nama</th>
                                    <th className="px-4 py-3">L/P</th>
                                    <th className="px-4 py-3">Alamat</th>
                                    <th className="px-4 py-3 text-center">RT/RW</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedWarga.length > 0 ? (
                                    paginatedWarga.map((w, index) => (
                                        <tr key={w.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-3 text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td className="px-4 py-3 font-mono text-gray-600">{w.nik}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{w.nama}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${w.jenis_kelamin === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                                                    }`}>
                                                    {w.jenis_kelamin}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={w.alamat}>
                                                {w.alamat}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                    {w.rt}/{w.rw}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/dashboard/warga/${w.id}`}
                                                        className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-md transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/warga/${w.id}/edit`}
                                                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setDeleteId(w.id)
                                                            setShowDeleteModal(true)
                                                        }}
                                                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                            Tidak ada data warga ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                            <div className="text-sm text-gray-500">
                                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredWarga.length)} dari {filteredWarga.length} data
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile List - Gunakan paginatedWarga */}
                <div className="space-y-3 sm:hidden">
                    {paginatedWarga.length > 0 ? (
                        paginatedWarga.map((w) => (
                            <div key={w.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
                                <div>
                                    <div className="font-semibold text-gray-800">{w.nama}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">{w.nik}</div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${w.jenis_kelamin === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                                            }`}>
                                            {w.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                            RT {w.rt}/{w.rw}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/dashboard/warga/${w.id}`}
                                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                    >
                                        <Eye size={18} />
                                    </Link>
                                    <Link
                                        href={`/dashboard/warga/${w.id}/edit`}
                                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        <Edit size={18} />
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                            Tidak ada data warga ditemukan
                        </div>
                    )}

                    {/* Pagination Controls Mobile */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-4 pb-8">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm bg-white border rounded-lg shadow-sm disabled:opacity-50"
                            >
                                ←
                            </button>
                            <span className="px-4 py-2 text-sm bg-white border rounded-lg shadow-sm flex items-center">
                                Hal {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm bg-white border rounded-lg shadow-sm disabled:opacity-50"
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile footer stats */}
                <div className="sm:hidden bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 text-center">
                        Total: <span className="font-semibold text-gray-700">{filteredWarga.length}</span> dari {warga.length} warga
                    </p>
                </div>

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Konfirmasi Hapus</h3>
                            <p className="text-gray-600 mb-6">
                                Apakah Anda yakin ingin menghapus data warga ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
