'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import * as XLSX from 'xlsx'
import Link from 'next/link'
import { DEFAULT_DESA, DEFAULT_KECAMATAN } from '@/types/database'

interface ImportRow {
    nik: string
    nama: string
    tempat_lahir: string
    tanggal_lahir: string
    jenis_kelamin: string
    alamat: string
    golongan_darah?: string
    rt: string
    rw: string
    desa?: string
    kecamatan?: string
    agama: string
    status_kawin: string
    pekerjaan: string
    kewarganegaraan?: string
    no_kk?: string
    no_wa?: string
}

export default function ImportPage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [previewData, setPreviewData] = useState<ImportRow[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [fileName, setFileName] = useState('')

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        setErrors([])
        setPreviewData([])

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportRow[]

                const validData: ImportRow[] = []
                const newErrors: string[] = []

                jsonData.forEach((row, index) => {
                    const rowNum = index + 2

                    if (!row.nik) {
                        newErrors.push(`Baris ${rowNum}: NIK kosong`)
                        return
                    }
                    if (!row.nama) {
                        newErrors.push(`Baris ${rowNum}: Nama kosong`)
                        return
                    }
                    if (String(row.nik).length !== 16) {
                        newErrors.push(`Baris ${rowNum}: NIK harus 16 digit`)
                        return
                    }

                    validData.push({
                        nik: String(row.nik),
                        nama: String(row.nama || '').toUpperCase(),
                        tempat_lahir: String(row.tempat_lahir || '').toUpperCase(),
                        tanggal_lahir: row.tanggal_lahir ? formatDate(row.tanggal_lahir) : '',
                        jenis_kelamin: String(row.jenis_kelamin || 'L').toUpperCase().charAt(0) === 'L' ? 'L' : 'P',
                        alamat: String(row.alamat || '').toUpperCase(),
                        golongan_darah: row.golongan_darah ? String(row.golongan_darah).toUpperCase() : '-',
                        rt: String(row.rt || '').padStart(3, '0'),
                        rw: String(row.rw || '').padStart(3, '0'),
                        desa: String(row.desa || DEFAULT_DESA),
                        kecamatan: String(row.kecamatan || DEFAULT_KECAMATAN),
                        agama: String(row.agama || 'ISLAM').toUpperCase(),
                        status_kawin: String(row.status_kawin || 'BELUM KAWIN').toUpperCase(),
                        pekerjaan: String(row.pekerjaan || '').toUpperCase(),
                        kewarganegaraan: String(row.kewarganegaraan || 'WNI'),
                        no_kk: row.no_kk ? String(row.no_kk) : null,
                        no_wa: row.no_wa ? String(row.no_wa) : null,
                    } as ImportRow)
                })

                setPreviewData(validData)
                setErrors(newErrors)
            } catch (error) {
                setErrors(['Gagal membaca file. Pastikan format file benar.'])
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const formatDate = (dateValue: string | number): string => {
        if (typeof dateValue === 'number') {
            const date = new Date((dateValue - 25569) * 86400 * 1000)
            return date.toISOString().split('T')[0]
        }
        const date = new Date(dateValue)
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
        }
        return dateValue
    }

    const handleImport = async () => {
        if (previewData.length === 0) return

        setLoading(true)

        const dataToInsert = previewData.map(row => ({
            ...row,
            desa: row.desa || DEFAULT_DESA,
            kecamatan: row.kecamatan || DEFAULT_KECAMATAN,
            kabupaten: 'CIANJUR',
            provinsi: 'JAWA BARAT',
        }))

        const { error } = await supabase.from('warga').insert(dataToInsert)

        if (error) {
            setErrors([`Gagal mengimpor data: ${error.message}`])
            setLoading(false)
            return
        }

        router.push('/dashboard/warga')
    }

    const downloadTemplate = () => {
        const template = [
            {
                nik: '3214123456789012',
                nama: 'JOHN DOE',
                tempat_lahir: 'CIANJUR',
                tanggal_lahir: '1990-01-15',
                jenis_kelamin: 'L',
                alamat: 'KP. CONTOH RT 001/001',
                golongan_darah: 'O',
                rt: '001',
                rw: '001',
                desa: 'KEMANG',
                kecamatan: 'BOJONGPICUNG',
                agama: 'ISLAM',
                status_kawin: 'KAWIN',
                pekerjaan: 'WIRASWASTA',
                kewarganegaraan: 'WNI',
                no_kk: '3214123456789000',
                no_wa: '08123456789',
            },
        ]

        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'template_import_warga.xlsx')
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4">
                <Link
                    href="/dashboard/warga"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                    <ArrowLeft size={20} className="text-gray-600 sm:w-6 sm:h-6" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Import Data</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Upload file Excel</p>
                </div>
            </div>

            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl self-start">
                        <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-800">Template Excel</h3>
                        <p className="text-blue-700 text-sm mt-1">
                            Download template untuk format data yang benar.
                        </p>
                        <button
                            onClick={downloadTemplate}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <FileSpreadsheet size={16} />
                            Download Template
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all"
                >
                    <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-600 font-medium text-sm sm:text-base">
                        Tap untuk upload file Excel
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-2">
                        Format: .xlsx, .xls
                    </p>
                    {fileName && (
                        <p className="text-emerald-600 font-medium mt-4 text-sm sm:text-base break-all">
                            {fileName}
                        </p>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                            <h3 className="font-semibold text-red-800">Terdapat {errors.length} error</h3>
                            <ul className="mt-2 space-y-1">
                                {errors.slice(0, 5).map((error, index) => (
                                    <li key={index} className="text-red-700 text-sm break-words">{error}</li>
                                ))}
                                {errors.length > 5 && (
                                    <li className="text-red-700 text-sm">...dan {errors.length - 5} error lainnya</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview */}
            {previewData.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Check className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Preview Data</h3>
                                <p className="text-gray-500 text-sm">{previewData.length} data siap diimpor</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Preview Cards */}
                    <div className="sm:hidden p-4 space-y-3 max-h-80 overflow-y-auto">
                        {previewData.slice(0, 5).map((row, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                                <p className="font-medium text-gray-800">{row.nama}</p>
                                <p className="text-sm text-gray-500 font-mono">{row.nik}</p>
                                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                    <span>RT/RW: {row.rt}/{row.rw}</span>
                                    <span>{row.jenis_kelamin === 'L' ? 'L' : 'P'}</span>
                                </div>
                            </div>
                        ))}
                        {previewData.length > 5 && (
                            <p className="text-sm text-gray-500 text-center">
                                +{previewData.length - 5} data lainnya
                            </p>
                        )}
                    </div>

                    {/* Desktop Preview Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">NIK</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">JK</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">RT/RW</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Desa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {previewData.slice(0, 10).map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{row.nik}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{row.nama}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{row.jenis_kelamin === 'L' ? 'L' : 'P'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{row.rt}/{row.rw}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{row.desa}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {previewData.length > 10 && (
                        <div className="hidden sm:block px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
                            Menampilkan 10 dari {previewData.length} data
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                        <Link
                            href="/dashboard/warga"
                            className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-center order-2 sm:order-1"
                        >
                            Batal
                        </Link>
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all order-1 sm:order-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    Mengimpor...
                                </>
                            ) : (
                                <>
                                    <Check size={20} />
                                    Import {previewData.length} Data
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
