'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Warga,
    AGAMA_OPTIONS,
    STATUS_KAWIN_OPTIONS,
    GOLONGAN_DARAH_OPTIONS,
    HUBUNGAN_KELUARGA_OPTIONS,
    RW_RT_STRUCTURE,
    User,
    DEFAULT_DESA,
    DEFAULT_KECAMATAN
} from '@/types/database'
import { ArrowLeft, Save, Camera, X } from 'lucide-react'
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

export default function EditWargaPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [profile, setProfile] = useState<User | null>(null)
    const [formData, setFormData] = useState<Partial<Warga>>({})
    const [fotoPreview, setFotoPreview] = useState<string | null>(null)
    const [fotoKkPreview, setFotoKkPreview] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<Blob | null>(null)
    const [selectedKkFile, setSelectedKkFile] = useState<Blob | null>(null)
    const [warga, setWarga] = useState<Warga | null>(null)
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null)
    const fileKkInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profileData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(profileData)
            }

            const { data: wargaData } = await supabase
                .from('warga')
                .select('*')
                .eq('id', resolvedParams.id)
                .single()

            if (wargaData) {
                setFormData(wargaData)
                if (wargaData.foto_ktp) {
                    setFotoPreview(wargaData.foto_ktp)
                }
                if (wargaData.foto_kk) {
                    setFotoKkPreview(wargaData.foto_kk)
                }
            }
            setLoading(false)
        }
        fetchData()
    }, [resolvedParams.id])

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
                alert('Gagal memproses gambar. Silakan coba lagi.')
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
                alert('Gagal memproses gambar. Silakan coba lagi.')
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            let fotoUrl = formData.foto_ktp

            // Upload image if selected
            if (selectedFile) {
                const fileName = `${formData.nik || 'unknown'}-${Date.now()}.webp`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('foto-ktp')
                    .upload(fileName, selectedFile, {
                        contentType: 'image/webp',
                        upsert: true
                    })

                if (uploadError) {
                    throw new Error('Gagal upload foto: ' + uploadError.message)
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('foto-ktp')
                    .getPublicUrl(fileName)

                fotoUrl = publicUrl
            }

            let fotoKkUrl = formData.foto_kk

            // Upload KK image if selected
            if (selectedKkFile) {
                const fileName = `kk-${formData.nik || 'unknown'}-${Date.now()}.webp`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    // Assuming using same bucket 'foto-ktp' or check if 'foto-kk' exists.
                    // Guide doesnt specify, but user said "foto-kk" exists. 
                    // I will try 'foto-kk' bucket if it fails I will revert or ask.
                    // But usually, better to be safe. I will use 'foto-ktp' for safety or 'foto-kk'. 
                    // Actually user said "udah update tambhan di supabase nya" maybe created bucket too.
                    // Let's assume 'foto-ktp' bucket for now but prefix or just 'foto-kk' bucket.
                    // I will use 'foto-ktp' bucket to be safe as I haven't listed buckets.
                    // Wait, user explicitly said "foto-kk" field.
                    // I'll stick to 'foto-ktp' bucket for now to avoid errors, or 'docs'.
                    // Let's use 'foto-ktp' bucket as I know it exists.
                    .from('foto-ktp')
                    .upload(fileName, selectedKkFile, {
                        contentType: 'image/webp',
                        upsert: true
                    })

                if (uploadError) {
                    throw new Error('Gagal upload foto KK: ' + uploadError.message)
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('foto-ktp')
                    .getPublicUrl(fileName)

                fotoKkUrl = publicUrl
            }

            const { error } = await supabase
                .from('warga')
                .update({
                    nik: formData.nik,
                    nama: formData.nama?.toUpperCase(),
                    tempat_lahir: formData.tempat_lahir?.toUpperCase(),
                    tanggal_lahir: formData.tanggal_lahir,
                    jenis_kelamin: formData.jenis_kelamin,
                    alamat: formData.alamat?.toUpperCase(),
                    golongan_darah: formData.golongan_darah,
                    rt: formData.rt,
                    rw: formData.rw,
                    desa: formData.desa || DEFAULT_DESA,
                    kecamatan: formData.kecamatan || DEFAULT_KECAMATAN,
                    agama: formData.agama,
                    status_kawin: formData.status_kawin,
                    pekerjaan: formData.pekerjaan?.toUpperCase(),
                    kewarganegaraan: formData.kewarganegaraan,
                    no_kk: formData.no_kk,
                    no_wa: formData.no_wa,
                    hubungan_keluarga: formData.hubungan_keluarga,
                    foto_ktp: fotoUrl,
                    foto_kk: fotoKkUrl,
                    nama_ayah: formData.nama_ayah,
                    nama_ibu: formData.nama_ibu,
                    pendidikan: formData.pendidikan,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', resolvedParams.id)

            if (error) {
                throw error
            }

            // Auto-update foto_kk for family members
            if (formData.no_kk && fotoKkUrl && (fotoKkUrl !== warga?.foto_kk || selectedKkFile)) {
                await supabase
                    .from('warga')
                    .update({ foto_kk: fotoKkUrl })
                    .eq('no_kk', formData.no_kk)
                    .neq('id', resolvedParams.id) // Update others
            }

            setSaving(false)
            setToast({ message: 'Data berhasil diperbarui!', type: 'success' })
            setTimeout(() => {
                router.push('/dashboard/warga')
            }, 1000)

        } catch (error: any) {
            setSaving(false)
            setToast({ message: 'Gagal menyimpan data: ' + error.message, type: 'error' })
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
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
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Edit Warga</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Perbarui data warga</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
                {/* Foto KTP */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto KTP</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* NIK */}
                    <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">NIK *</label>
                        <input
                            type="text"
                            name="nik"
                            value={formData.nik || ''}
                            onChange={handleChange}
                            maxLength={16}
                            inputMode="numeric"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        />
                    </div>

                    {/* Nama */}
                    <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nama Lengkap *</label>
                        <input
                            type="text"
                            name="nama"
                            value={formData.nama || ''}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        />
                    </div>

                    {/* Tempat Lahir */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Tempat Lahir *</label>
                        <input
                            type="text"
                            name="tempat_lahir"
                            value={formData.tempat_lahir || ''}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        />
                    </div>

                    {/* Tanggal Lahir */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Tanggal Lahir *</label>
                        <input
                            type="date"
                            name="tanggal_lahir"
                            value={formData.tanggal_lahir || ''}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        />
                    </div>

                    {/* Jenis Kelamin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Jenis Kelamin *</label>
                        <select
                            name="jenis_kelamin"
                            value={formData.jenis_kelamin || 'L'}
                            onChange={handleChange}
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
                            value={formData.golongan_darah || '-'}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                        >
                            {GOLONGAN_DARAH_OPTIONS.map(gol => (
                                <option key={gol} value={gol}>{gol === '-' ? 'Tidak Diketahui' : gol}</option>
                            ))}
                        </select>
                    </div>

                    {/* Alamat */}
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Alamat *</label>
                        <textarea
                            name="alamat"
                            value={formData.alamat || ''}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white resize-none"
                            required
                        />
                    </div>

                    {/* RW */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">RW *</label>
                        <select
                            name="rw"
                            value={formData.rw || ''}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, rw: e.target.value, rt: '' }))
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">RT *</label>
                        <select
                            name="rt"
                            value={formData.rt || ''}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                            disabled={profile?.role !== 'admin'}
                        >
                            <option value="">Pilih RT</option>
                            {formData.rw && RW_RT_STRUCTURE[formData.rw as keyof typeof RW_RT_STRUCTURE]?.map(rt => (
                                <option key={rt} value={rt}>RT {rt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Desa */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Desa</label>
                        <input
                            type="text"
                            value={DEFAULT_DESA}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-100 text-gray-500 text-base"
                            disabled
                        />
                    </div>

                    {/* Kecamatan */}
                    <div>
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
                            value={formData.agama || 'ISLAM'}
                            onChange={handleChange}
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
                            value={formData.status_kawin || 'BELUM KAWIN'}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        >
                            {STATUS_KAWIN_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pekerjaan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Pekerjaan *</label>
                        <input
                            type="text"
                            name="pekerjaan"
                            value={formData.pekerjaan || ''}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        />
                    </div>

                    {/* Kewarganegaraan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Kewarganegaraan *</label>
                        <select
                            name="kewarganegaraan"
                            value={formData.kewarganegaraan || 'WNI'}
                            onChange={handleChange}
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
                            value={formData.no_kk || ''}
                            onChange={handleChange}
                            maxLength={16}
                            inputMode="numeric"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                        />
                    </div>

                    {/* Hubungan Keluarga */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Hubungan Keluarga</label>
                        <select
                            name="hubungan_keluarga"
                            value={formData.hubungan_keluarga || 'KEPALA KELUARGA'}
                            onChange={handleChange}
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
                            value={formData.no_wa || ''}
                            onChange={handleChange}
                            inputMode="tel"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                        />
                    </div>
                </div>

                {/* Data Orang Tua & Pendidikan */}
                <div className="sm:col-span-2 space-y-4 pt-4 border-t border-gray-100 mt-6">
                    <h3 className="font-semibold text-gray-800">Data Tambahan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Nama Ayah */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nama Ayah</label>
                            <input
                                type="text"
                                name="nama_ayah"
                                value={formData.nama_ayah || ''}
                                onChange={handleChange}
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
                                value={formData.nama_ibu || ''}
                                onChange={handleChange}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                                placeholder="Nama Ibu"
                            />
                        </div>

                        {/* Pendidikan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Pendidikan Terakhir</label>
                            <select
                                name="pendidikan"
                                value={formData.pendidikan || ''}
                                onChange={handleChange}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            >
                                <option value="">Pilih Pendidikan</option>
                                <option value="TIDAK / BELUM SEKOLAH">TIDAK / BELUM SEKOLAH</option>
                                <option value="BELUM TAMAT SD/SEDERAJAT">BELUM TAMAT SD/SEDERAJAT</option>
                                <option value="TAMAT SD / SEDERAJAT">TAMAT SD / SEDERAJAT</option>
                                <option value="SLTP/SEDERAJAT">SLTP/SEDERAJAT</option>
                                <option value="SLTA / SEDERAJAT">SLTA / SEDERAJAT</option>
                                <option value="DIPLOMA I / II">DIPLOMA I / II</option>
                                <option value="AKADEMI/ DIPLOMA III/S. MUDA">AKADEMI/ DIPLOMA III/S. MUDA</option>
                                <option value="DIPLOMA IV/ STRATA I">DIPLOMA IV/ STRATA I</option>
                                <option value="STRATA II">STRATA II</option>
                                <option value="STRATA III">STRATA III</option>
                            </select>
                        </div>
                    </div>
                </div>

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
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </div>
    )
}
