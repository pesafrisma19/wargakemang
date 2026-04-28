'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    WargaInput,
    AGAMA_OPTIONS,
    STATUS_KAWIN_OPTIONS,
    GOLONGAN_DARAH_OPTIONS,
    HUBUNGAN_KELUARGA_OPTIONS,
    RW_RT_STRUCTURE,
    User,
    DEFAULT_DESA,
    DEFAULT_KECAMATAN
} from '@/types/database'
import { ArrowLeft, Save, Camera, X, ScanLine, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Toast, { ToastType } from '@/components/ui/Toast'

// Helper function to compress image
const compressImage = (file: File): Promise<{ blob: Blob, dataUrl: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                // Calculate new dimensions (max width 1024px to keep it small but readable)
                const MAX_WIDTH = 1024
                let width = img.width
                let height = img.height

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width
                    width = MAX_WIDTH
                }

                canvas.width = width
                canvas.height = height
                ctx.drawImage(img, 0, 0, width, height)

                // Convert to WebP
                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create preview URL
                        const dataUrl = canvas.toDataURL('image/webp', 0.8)
                        resolve({ blob, dataUrl })
                    } else {
                        reject(new Error('Canvas to Blob failed'))
                    }
                }, 'image/webp', 0.8) // Quality 0.8
            }
            img.onerror = (err) => reject(err)
        }
        reader.onerror = (err) => reject(err)
    })
}

export default function TambahWargaPage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
        const [isUpdateMode, setIsUpdateMode] = useState(false)
    const [existingId, setExistingId] = useState<string | null>(null)
    const [bulkData, setBulkData] = useState<{ formData: WargaInput, isUpdateMode: boolean, existingId: string | null }[] | null>(null)
    const scanInputRef = useRef<HTMLInputElement>(null)
    const [profile, setProfile] = useState<User | null>(null)
    const [fotoPreview, setFotoPreview] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<Blob | null>(null)
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
    const [fotoKkPreview, setFotoKkPreview] = useState<string | null>(null)
    const [selectedKkFile, setSelectedKkFile] = useState<Blob | null>(null)
    const fileKkInputRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState<WargaInput>({
        nik: '',
        nama: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        jenis_kelamin: 'L',
        alamat: '',
        golongan_darah: '-',
        rt: '',
        rw: '',
        desa: DEFAULT_DESA,
        kecamatan: DEFAULT_KECAMATAN,
        agama: 'ISLAM',
        status_kawin: 'BELUM KAWIN',
        pekerjaan: '',
        kewarganegaraan: 'WNI',
        no_kk: '',
        no_wa: '',
        hubungan_keluarga: 'KEPALA KELUARGA',
        foto_ktp: null,
        foto_kk: null,
        nama_ayah: '',
        nama_ibu: '',
        pendidikan: '',
        status_warga: 'AKTIF',
        disabilitas: 'Tidak Ada',
        catatan: '',
    })

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(data)

                if (data?.role !== 'admin' && data?.rt && data?.rw) {
                    setFormData(prev => ({
                        ...prev,
                        rt: data.rt,
                        rw: data.rw,
                    }))
                }
            }
        }
        fetchProfile()
    }, [])

    const handleScanKtp = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsScanning(true)
        setToast({ message: 'Sedang membaca KTP...', type: 'info' })

        try {
            const uploadFormData = new FormData()
            uploadFormData.append('image', file)

            const response = await fetch('/api/ocr', {
                method: 'POST',
                body: uploadFormData,
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Gagal membaca KTP')
            }

            const data = result.data

            if (data.data_warga && Array.isArray(data.data_warga)) {
                const processed = await Promise.all(data.data_warga.map(async (wargaData: any) => {
                    let existingWarga = null;
                    if (wargaData.nik) {
                        const { data: dbData } = await supabase.from('warga').select('*').eq('nik', wargaData.nik).single()
                        if (dbData) existingWarga = dbData
                    }

                    if (existingWarga) {
                        return {
                            isUpdateMode: true,
                            existingId: existingWarga.id,
                            formData: {
                                ...wargaData,
                                nik: existingWarga.nik,
                                nama: existingWarga.nama,
                                tempat_lahir: existingWarga.tempat_lahir,
                                tanggal_lahir: existingWarga.tanggal_lahir,
                                jenis_kelamin: existingWarga.jenis_kelamin,
                                alamat: existingWarga.alamat,
                                golongan_darah: existingWarga.golongan_darah || wargaData.golongan_darah || '-',
                                rt: existingWarga.rt,
                                rw: existingWarga.rw,
                                desa: existingWarga.desa,
                                kecamatan: existingWarga.kecamatan,
                                agama: existingWarga.agama,
                                status_kawin: existingWarga.status_kawin,
                                pekerjaan: existingWarga.pekerjaan,
                                kewarganegaraan: existingWarga.kewarganegaraan,
                                no_kk: existingWarga.no_kk || data.no_kk || wargaData.no_kk || formData.no_kk,
                                pendidikan: existingWarga.pendidikan || wargaData.pendidikan,
                                nama_ayah: existingWarga.nama_ayah || wargaData.nama_ayah,
                                nama_ibu: existingWarga.nama_ibu || wargaData.nama_ibu,
                                foto_ktp: existingWarga.foto_ktp,
                                foto_kk: existingWarga.foto_kk,
                            }
                        }
                    } else {
                        return {
                            isUpdateMode: false,
                            existingId: null,
                            formData: {
                                ...formData,
                                ...wargaData,
                                no_kk: data.no_kk || wargaData.no_kk || formData.no_kk,
                                alamat: data.alamat || wargaData.alamat || formData.alamat,
                                rt: data.rt || wargaData.rt || formData.rt,
                                rw: data.rw || wargaData.rw || formData.rw,
                                desa: data.desa || wargaData.desa || formData.desa,
                                kecamatan: data.kecamatan || wargaData.kecamatan || formData.kecamatan,
                            }
                        }
                    }
                }))
                
                setBulkData(processed)
                setToast({ message: `Berhasil mengekstrak ${processed.length} warga! Silakan periksa kembali.`, type: 'success' })
            } else {
                // Fallback if not an array (though it should be)
                setToast({ message: 'Format data tidak sesuai.', type: 'error' })
            }

            try {
                const { blob, dataUrl } = await compressImage(file)
                if (data.jenis_dokumen === 'KK') {
                    setSelectedKkFile(blob)
                    setFotoKkPreview(dataUrl)
                } else {
                    setSelectedFile(blob)
                    setFotoPreview(dataUrl)
                }
            } catch (err) {}

        } catch (error: any) {
            setToast({ message: error.message, type: 'error' })
        } finally {
            setIsScanning(false)
            if (scanInputRef.current) {
                scanInputRef.current.value = ''
            }
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                setUploading(true)
                // Compress and convert to WebP
                const { blob, dataUrl } = await compressImage(file)
                setSelectedFile(blob)
                setFotoPreview(dataUrl)
                setUploading(false)
            } catch (error) {
                console.error('Error compressing image:', error)
                setToast({ message: 'Gagal memproses gambar. Silakan coba lagi.', type: 'error' })
                setUploading(false)
            }
        }
    }

    const handleKkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                setUploading(true)
                // Compress and convert to WebP
                const { blob, dataUrl } = await compressImage(file)
                setSelectedKkFile(blob)
                setFotoKkPreview(dataUrl)
                setUploading(false)
            } catch (error) {
                console.error('Error compressing image:', error)
                setToast({ message: 'Gagal memproses gambar. Silakan coba lagi.', type: 'error' })
                setUploading(false)
            }
        }
    }

    const removeFoto = () => {
        setFotoPreview(null)
        setSelectedFile(null)
        setFormData(prev => ({ ...prev, foto_ktp: null }))
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeFotoKk = () => {
        setFotoKkPreview(null)
        setSelectedKkFile(null)
        setFormData(prev => ({ ...prev, foto_kk: null }))
        if (fileKkInputRef.current) {
            fileKkInputRef.current.value = ''
        }
    }

    const handleKkBlur = async () => {
        if (!formData.no_kk) return

        try {
            const { data: existing } = await supabase
                .from('warga')
                .select('foto_kk')
                .eq('no_kk', formData.no_kk)
                .not('foto_kk', 'is', null)
                .limit(1)
                .single()

            if (existing?.foto_kk) {
                setFotoKkPreview(existing.foto_kk)
                setFormData(prev => ({ ...prev, foto_kk: existing.foto_kk }))
                setToast({ message: 'Foto KK ditemukan dari anggota keluarga lain', type: 'info' })
            }
        } catch (error) {
            // Ignore error if not found
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const dataToProcess = bulkData || [{ formData, isUpdateMode, existingId }];
            
            // Check NIK first if NOT in update mode
            for (const item of dataToProcess) {
                if (!item.isUpdateMode) {
                    const { data: existing } = await supabase
                        .from('warga')
                        .select('nik, nama')
                        .eq('nik', item.formData.nik)
                        .single()

                    if (existing) {
                        setToast({ message: `NIK ${item.formData.nik} sudah terdaftar atas nama: ${existing.nama}`, type: 'error' })
                        setSaving(false)
                        return
                    }
                }
            }

            let fotoUrl = null
            if (selectedFile) {
                const fileName = `${dataToProcess[0].formData.nik}-${Date.now()}.webp`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('foto-ktp')
                    .upload(fileName, selectedFile, { contentType: 'image/webp', upsert: true })

                if (uploadError) throw new Error('Gagal upload foto: ' + uploadError.message)
                const { data: { publicUrl } } = supabase.storage.from('foto-ktp').getPublicUrl(fileName)
                fotoUrl = publicUrl
            }

            let fotoKkUrl = dataToProcess[0].formData.foto_kk || null
            if (selectedKkFile) {
                const fileName = `kk-${dataToProcess[0].formData.nik || 'unknown'}-${Date.now()}.webp`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('foto-ktp')
                    .upload(fileName, selectedKkFile, { contentType: 'image/webp', upsert: true })

                if (uploadError) throw new Error('Gagal upload foto KK: ' + uploadError.message)
                const { data: { publicUrl } } = supabase.storage.from('foto-ktp').getPublicUrl(fileName)
                fotoKkUrl = publicUrl
            }

            for (const item of dataToProcess) {
                const payload = {
                    ...item.formData,
                    nama: item.formData.nama.toUpperCase(),
                    tempat_lahir: item.formData.tempat_lahir.toUpperCase(),
                    alamat: item.formData.alamat.toUpperCase(),
                    pekerjaan: item.formData.pekerjaan.toUpperCase(),
                    desa: item.formData.desa || DEFAULT_DESA,
                    kecamatan: item.formData.kecamatan || DEFAULT_KECAMATAN,
                    kabupaten: 'CIANJUR',
                    provinsi: 'JAWA BARAT',
                    foto_ktp: fotoUrl || item.formData.foto_ktp,
                    foto_kk: fotoKkUrl || item.formData.foto_kk,
                }

                if (item.isUpdateMode && item.existingId) {
                    const { error } = await supabase.from('warga').update(payload).eq('id', item.existingId)
                    if (error) throw error
                } else {
                    const { error } = await supabase.from('warga').insert([payload])
                    if (error) throw error
                }
            }

            // Auto-update foto_kk for family members (only use the first item's KK info)
            if (dataToProcess[0].formData.no_kk && (fotoKkUrl || dataToProcess[0].formData.foto_kk)) {
                await supabase
                    .from('warga')
                    .update({ foto_kk: fotoKkUrl || dataToProcess[0].formData.foto_kk })
                    .eq('no_kk', dataToProcess[0].formData.no_kk)
                    // don't exclude nik since we might just want to update all of them safely
            }

            setSaving(false)
            setToast({ message: bulkData ? `Berhasil menyimpan ${bulkData.length} data warga!` : (isUpdateMode ? 'Data warga berhasil diupdate!' : 'Data warga berhasil ditambahkan!'), type: 'success' })
            setTimeout(() => {
                router.push('/dashboard/warga')
            }, 1000)

        } catch (error: any) {
            setSaving(false)
            setToast({ message: 'Gagal menambah data: ' + error.message, type: 'error' })
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4">
                <Link
                    href="/dashboard/warga"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                    <ArrowLeft size={20} className="text-gray-600 sm:w-6 sm:h-6" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Tambah Warga</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Isi data warga sesuai KTP</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
                
                {/* Auto-Fill Banner */}
                <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                            <ScanLine size={18} className="text-blue-600" />
                            Auto-fill dengan AI
                        </h3>
                        <p className="text-xs text-blue-700 mt-1">Upload foto KTP, AI akan otomatis mengisi semua data di bawah ini.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => !isScanning && scanInputRef.current?.click()}
                        disabled={isScanning}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isScanning ? (
                            <><Loader2 size={16} className="animate-spin" /> Sedang Membaca...</>
                        ) : (
                            <><Camera size={16} /> Scan KTP Sekarang</>
                        )}
                    </button>
                    <input
                        ref={scanInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScanKtp}
                        className="hidden"
                    />
                </div>

                {/* Foto KTP */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto KTP (Opsional)</label>
                    <div className="flex items-start gap-4">
                        {fotoPreview ? (
                            <div className="relative">
                                <img
                                    src={fotoPreview}
                                    alt="Foto KTP"
                                    className="w-32 h-20 sm:w-48 sm:h-28 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={removeFoto}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-32 h-20 sm:w-48 sm:h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors disabled:opacity-50"
                            >
                                <Camera size={24} />
                                <span className="text-xs mt-1">{uploading ? 'Processing...' : 'Upload Foto'}</span>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-400 hidden sm:block">
                            Format: JPG, PNG (Auto convert ke WebP)<br />
                            Maks. 2MB
                        </p>
                    </div>
                </div>

                {/* Foto KK */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto KK</label>
                    <div className="flex items-start gap-4">
                        {fotoKkPreview ? (
                            <div className="relative">
                                <img
                                    src={fotoKkPreview}
                                    alt="Foto KK"
                                    className="w-32 h-20 sm:w-48 sm:h-28 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={removeFotoKk}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => !uploading && fileKkInputRef.current?.click()}
                                disabled={uploading}
                                className="w-32 h-20 sm:w-48 sm:h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors disabled:opacity-50"
                            >
                                <Camera size={24} />
                                <span className="text-xs mt-1">{uploading ? 'Processing...' : 'Upload Foto KK'}</span>
                            </button>
                        )}
                        <input
                            ref={fileKkInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleKkFileChange}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-400 hidden sm:block">
                            Otomatis update ke seluruh anggota keluarga<br />
                            Format: JPG, PNG (Auto convert ke WebP)
                        </p>
                    </div>
                </div>

                {(bulkData || [{ formData, isUpdateMode, existingId: null }]).map((item, index) => {
                    const currentFormData = item.formData;
                    const handleCurrentChange = (e: any) => {
                        const { name, value } = e.target;
                        if (bulkData) {
                            const newBulk = [...bulkData];
                            (newBulk[index].formData as any)[name] = value;
                            
                            // Auto-sync address fields if editing the first person (Kepala Keluarga)
                            if (index === 0 && ['alamat', 'rt', 'rw', 'desa', 'kecamatan'].includes(name)) {
                                for (let i = 1; i < newBulk.length; i++) {
                                    (newBulk[i].formData as any)[name] = value;
                                    if (name === 'rw') newBulk[i].formData.rt = '';
                                }
                            }
                            
                            if (name === 'rw') newBulk[index].formData.rt = '';
                            setBulkData(newBulk);
                        } else {
                            setFormData(prev => ({ ...prev, [name]: value }));
                            if (name === 'rw') setFormData(prev => ({ ...prev, rt: '' }));
                        }
                    };
                    const isUpdate = item.isUpdateMode;

                    return (
                        <div key={index} className={bulkData ? "p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-200 mb-6 relative" : ""}>
                            {bulkData && (
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                                    <h3 className="font-bold text-lg text-gray-800">Warga #{index + 1} - {currentFormData.nama || 'Tanpa Nama'}</h3>
                                    <div className="flex items-center gap-2">
                                        {isUpdate && <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Update Data</span>}
                                        <button type="button" onClick={() => setBulkData(bulkData.filter((_, i) => i !== index))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 text-sm font-medium"><X size={16} /> Hapus</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* NIK */}
                    <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">NIK *</label>
                        <input
                            type="text"
                            name="nik"
                            value={currentFormData.nik}
                            onChange={handleCurrentChange}
                            maxLength={16}
                            inputMode="numeric"
                            pattern="[0-9]{16}"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            placeholder="16 digit NIK"
                            required
                        />
                    </div>

                    {/* Nama */}
                    <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nama Lengkap *</label>
                        <input
                            type="text"
                            name="nama"
                            value={currentFormData.nama}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            placeholder="Nama sesuai KTP"
                            required
                        />
                    </div>

                    {/* Tempat Lahir */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Tempat Lahir *</label>
                        <input
                            type="text"
                            name="tempat_lahir"
                            value={currentFormData.tempat_lahir}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            placeholder="Kota/Kabupaten"
                            required
                        />
                    </div>

                    {/* Tanggal Lahir */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Tanggal Lahir *</label>
                        <input
                            type="date"
                            name="tanggal_lahir"
                            value={currentFormData.tanggal_lahir}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        />
                    </div>

                    {/* Jenis Kelamin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Jenis Kelamin *</label>
                        <select
                            name="jenis_kelamin"
                            value={currentFormData.jenis_kelamin}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        >
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
                    </div>

                    {/* Golongan Darah */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Golongan Darah</label>
                        <select
                            name="golongan_darah"
                            value={currentFormData.golongan_darah || '-'}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                        >
                            {GOLONGAN_DARAH_OPTIONS.map(gol => (
                                <option key={gol} value={gol}>{gol === '-' ? 'Tidak Diketahui' : gol}</option>
                            ))}
                        </select>
                    </div>

                    {/* Alamat */}
                    <div className={index > 0 ? "hidden" : "sm:col-span-2"}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Alamat *</label>
                        <textarea
                            name="alamat"
                            value={currentFormData.alamat}
                            onChange={handleCurrentChange}
                            rows={2}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white resize-none"
                            placeholder="Alamat lengkap (Kampung/Jalan, No. Rumah)"
                            required
                        />
                    </div>

                    {/* RW */}
                    <div className={index > 0 ? "hidden" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">RW *</label>
                        <select
                            name="rw"
                            value={currentFormData.rw}
                            onChange={(e) => {
                                if (bulkData) {
                                    const newBulk = [...bulkData];
                                    newBulk[index].formData.rw = e.target.value;
                                    newBulk[index].formData.rt = '';
                                    setBulkData(newBulk);
                                } else {
                                    setFormData(prev => ({ ...prev, rw: e.target.value, rt: '' }))
                                }
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                            disabled={profile?.role !== 'admin'}
                        >
                            <option value="">Pilih RW</option>
                            {Object.keys(RW_RT_STRUCTURE).map(rw => (
                                <option key={rw} value={rw}>RW {rw}</option>
                            ))}
                        </select>
                    </div>

                    {/* RT */}
                    <div className={index > 0 ? "hidden" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">RT *</label>
                        <select
                            name="rt"
                            value={currentFormData.rt}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                            disabled={profile?.role !== 'admin' || !currentFormData.rw}
                        >
                            <option value="">Pilih RT</option>
                            {currentFormData.rw && RW_RT_STRUCTURE[currentFormData.rw as keyof typeof RW_RT_STRUCTURE]?.map(rt => (
                                <option key={rt} value={rt}>RT {rt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Desa */}
                    <div className={index > 0 ? "hidden" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Desa</label>
                        <input
                            type="text"
                            value={DEFAULT_DESA}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-100 text-gray-500 text-base"
                            disabled
                        />
                    </div>

                    {/* Kecamatan */}
                    <div className={index > 0 ? "hidden" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Kecamatan</label>
                        <input
                            type="text"
                            value={DEFAULT_KECAMATAN}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-100 text-gray-500 text-base"
                            disabled
                        />
                    </div>

                    {/* Agama */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Agama *</label>
                        <select
                            name="agama"
                            value={currentFormData.agama}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        >
                            {AGAMA_OPTIONS.map(agama => (
                                <option key={agama} value={agama}>{agama}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Kawin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Status Kawin *</label>
                        <select
                            name="status_kawin"
                            value={currentFormData.status_kawin}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        >
                            {STATUS_KAWIN_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pendidikan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Pendidikan Terakhir *</label>
                        <select
                            name="pendidikan"
                            value={currentFormData.pendidikan || ''}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                        >
                            <option value="">Pilih Pendidikan</option>
                            <option value="TIDAK/BELUM SEKOLAH">TIDAK/BELUM SEKOLAH</option>
                            <option value="BELUM TAMAT SD/SEDERAJAT">BELUM TAMAT SD/SEDERAJAT</option>
                            <option value="TAMAT SD/SEDERAJAT">TAMAT SD/SEDERAJAT</option>
                            <option value="SLTP/SEDERAJAT">SLTP/SEDERAJAT</option>
                            <option value="SLTA/SEDERAJAT">SLTA/SEDERAJAT</option>
                            <option value="DIPLOMA I/II">DIPLOMA I/II</option>
                            <option value="AKADEMI/DIPLOMA III/S. MUDA">AKADEMI/DIPLOMA III/S. MUDA</option>
                            <option value="DIPLOMA IV/STRATA I">DIPLOMA IV/STRATA I</option>
                            <option value="STRATA II">STRATA II</option>
                            <option value="STRATA III">STRATA III</option>
                        </select>
                    </div>

                    {/* Pekerjaan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Pekerjaan *</label>
                        <input
                            type="text"
                            name="pekerjaan"
                            value={currentFormData.pekerjaan}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            placeholder="Pekerjaan"
                            required
                        />
                    </div>

                    {/* Kewarganegaraan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Kewarganegaraan *</label>
                        <select
                            name="kewarganegaraan"
                            value={currentFormData.kewarganegaraan}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        >
                            <option value="WNI">WNI</option>
                            <option value="WNA">WNA</option>
                        </select>
                    </div>

                    {/* No KK */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">No. Kartu Keluarga</label>
                        <input
                            type="text"
                            name="no_kk"
                            value={currentFormData.no_kk || ''}
                            onChange={handleCurrentChange}
                            onBlur={handleKkBlur}
                            maxLength={16}
                            inputMode="numeric"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            placeholder="16 digit No. KK"
                        />
                    </div>

                    {/* Hubungan Keluarga */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Hubungan Keluarga</label>
                        <select
                            name="hubungan_keluarga"
                            value={currentFormData.hubungan_keluarga}
                            onChange={handleCurrentChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                        >
                            {HUBUNGAN_KELUARGA_OPTIONS.map(hub => (
                                <option key={hub} value={hub}>{hub}</option>
                            ))}
                        </select>
                    </div>

                    {/* No WA */}
                    <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">No. WhatsApp</label>
                        <input
                            type="tel"
                            name="no_wa"
                            value={currentFormData.no_wa || ''}
                            onChange={handleCurrentChange}
                            inputMode="tel"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            placeholder="08xxxxxxxxxx"
                        />
                    </div>
                </div>

                {/* Data Orang Tua & Pendidikan */}
                <div className="sm:col-span-2 space-y-4 pt-4 border-t border-gray-100 mt-6 md:col-span-2">
                    <h3 className="font-semibold text-gray-800">Data Tambahan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Nama Ayah */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nama Ayah</label>
                            <input
                                type="text"
                                name="nama_ayah"
                                value={currentFormData.nama_ayah}
                                onChange={handleCurrentChange}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                                placeholder="Nama Ayah"
                            />
                        </div>

                        {/* Nama Ibu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nama Ibu</label>
                            <input
                                type="text"
                                name="nama_ibu"
                                value={currentFormData.nama_ibu}
                                onChange={handleCurrentChange}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                                placeholder="Nama Ibu"
                            />
                        </div>

                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
                        {/* Status Warga */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Status Warga *</label>
                            <select
                                name="status_warga"
                                value={currentFormData.status_warga || 'AKTIF'}
                                onChange={handleCurrentChange}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                                required
                            >
                                <option value="AKTIF">HIDUP</option>
                                <option value="MENINGGAL">MENINGGAL</option>
                                <option value="PINDAH">PINDAH</option>
                            </select>
                        </div>

                        {/* Disabilitas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Penyandang Disabilitas</label>
                            <select
                                name="disabilitas"
                                value={currentFormData.disabilitas || 'Tidak Ada'}
                                onChange={handleCurrentChange}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            >
                                <option value="Tidak Ada">Tidak Ada</option>
                                <option value="Cacat Fisik">Cacat Fisik</option>
                                <option value="Cacat Netra/Buta">Cacat Netra/Buta</option>
                                <option value="Cacat Rungu/Wicara">Cacat Rungu/Wicara</option>
                                <option value="Cacat Mental/Jiwa">Cacat Mental/Jiwa</option>
                                <option value="Cacat Fisik dan Mental">Cacat Fisik dan Mental</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>

                        {/* Catatan */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Catatan (Opsional)</label>
                            <textarea
                                name="catatan"
                                value={currentFormData.catatan || ''}
                                onChange={handleCurrentChange}
                                rows={2}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white resize-none"
                                placeholder="Catatan tambahan (bila ada)..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    })}

    {/* Submit Button */}
    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
                    <Link
                        href="/dashboard/warga"
                        className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-center order-2 sm:order-1"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all order-1 sm:order-2"
                    >
                        <Save size={20} />
                        {saving ? 'Menyimpan...' : bulkData ? 'Simpan Semua Warga' : (isUpdateMode ? 'Update Data Warga' : 'Simpan Data')}
                    </button>
                </div>
            </form >
        </div >
    )
}
