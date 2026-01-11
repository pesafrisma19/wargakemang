'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileSpreadsheet, Check, X, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import Link from 'next/link'

interface ImportRow {
    nik: string
    nama: string
    tempat_lahir: string
    tanggal_lahir: string
    jenis_kelamin: string
    alamat: string
    golongan_darah?: string
    alamat_kampung: string
    rt: string
    rw: string
    desa: string
    kecamatan: string
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

                // Validate and clean data
                const validData: ImportRow[] = []
                const newErrors: string[] = []

                jsonData.forEach((row, index) => {
                    const rowNum = index + 2 // Excel row number (1-indexed + header)

                    // Check required fields
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
                        nama: String(row.nama || ''),
                        tempat_lahir: String(row.tempat_lahir || ''),
                        tanggal_lahir: row.tanggal_lahir ? formatDate(row.tanggal_lahir) : '',
                        jenis_kelamin: String(row.jenis_kelamin || 'L').toUpperCase().charAt(0) === 'L' ? 'L' : 'P',
                        alamat: String(row.alamat || ''),
                        golongan_darah: row.golongan_darah ? String(row.golongan_darah).toUpperCase() : '-',
                        alamat_kampung: String(row.alamat_kampung || ''),
                        rt: String(row.rt || '').padStart(3, '0'),
                        rw: String(row.rw || '').padStart(3, '0'),
                        desa: String(row.desa || ''),
                        kecamatan: String(row.kecamatan || ''),
                        agama: String(row.agama || 'Islam'),
                        status_kawin: String(row.status_kawin || 'Belum Kawin'),
                        pekerjaan: String(row.pekerjaan || ''),
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
            // Excel serial number
            const date = new Date((dateValue - 25569) * 86400 * 1000)
            return date.toISOString().split('T')[0]
        }
        // Try to parse string date
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
            kabupaten: 'Cianjur',
            provinsi: 'Jawa Barat',
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
                nama: 'John Doe',
                tempat_lahir: 'Cianjur',
                tanggal_lahir: '1990-01-15',
                jenis_kelamin: 'L',
                alamat: 'Jl. Contoh No. 123',
                golongan_darah: 'O',
                alamat_kampung: 'Kampung Contoh',
                rt: '001',
                rw: '001',
                desa: 'Desa Contoh',
                kecamatan: 'Kecamatan Contoh',
                agama: 'Islam',
                status_kawin: 'Kawin',
                pekerjaan: 'Wiraswasta',
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Import Data Warga</h1>
                <p className="text-gray-500 mt-1">Upload file Excel untuk menambahkan data warga secara massal</p>
            </div>

            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-800">Template Excel</h3>
                        <p className="text-blue-700 text-sm mt-1">
                            Download template Excel untuk memastikan format data sesuai dengan sistem.
                        </p>
                        <button
                            onClick={downloadTemplate}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FileSpreadsheet size={18} />
                            Download Template
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all"
                >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                        Klik untuk upload atau drag & drop file Excel
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        Format yang didukung: .xlsx, .xls
                    </p>
                    {fileName && (
                        <p className="text-emerald-600 font-medium mt-4">
                            File terpilih: {fileName}
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
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800">Terdapat {errors.length} error</h3>
                            <ul className="mt-2 space-y-1">
                                {errors.slice(0, 5).map((error, index) => (
                                    <li key={index} className="text-red-700 text-sm">{error}</li>
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
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
                    </div>

                    <div className="overflow-x-auto">
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
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
                            Menampilkan 10 dari {previewData.length} data
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
                        <Link
                            href="/dashboard/warga"
                            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Batal
                        </Link>
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
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
