'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Warga,
    AGAMA_OPTIONS,
    STATUS_KAWIN_OPTIONS,
    GOLONGAN_DARAH_OPTIONS,
    RW_RT_STRUCTURE,
    User,
    Agama,
    StatusKawin,
    GolonganDarah,
    JenisKelamin
} from '@/types/database'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function EditWargaPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<User | null>(null)
    const [formData, setFormData] = useState<Partial<Warga>>({})

    useEffect(() => {
        const fetchData = async () => {
            // Get profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profileData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(profileData)
            }

            // Get warga data
            const { data: wargaData } = await supabase
                .from('warga')
                .select('*')
                .eq('id', resolvedParams.id)
                .single()

            if (wargaData) {
                setFormData(wargaData)
            }
            setLoading(false)
        }
        fetchData()
    }, [resolvedParams.id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const { error } = await supabase
            .from('warga')
            .update({
                nik: formData.nik,
                nama: formData.nama,
                tempat_lahir: formData.tempat_lahir,
                tanggal_lahir: formData.tanggal_lahir,
                jenis_kelamin: formData.jenis_kelamin,
                alamat: formData.alamat,
                golongan_darah: formData.golongan_darah,
                alamat_kampung: formData.alamat_kampung,
                rt: formData.rt,
                rw: formData.rw,
                desa: formData.desa,
                kecamatan: formData.kecamatan,
                agama: formData.agama,
                status_kawin: formData.status_kawin,
                pekerjaan: formData.pekerjaan,
                kewarganegaraan: formData.kewarganegaraan,
                no_kk: formData.no_kk,
                no_wa: formData.no_wa,
                updated_at: new Date().toISOString(),
            })
            .eq('id', resolvedParams.id)

        if (error) {
            alert('Gagal menyimpan data: ' + error.message)
            setSaving(false)
            return
        }

        router.push('/dashboard/warga')
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/warga"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Edit Warga</h1>
                    <p className="text-gray-500 mt-1">Perbarui data warga</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* NIK */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">NIK *</label>
                        <input
                            type="text"
                            name="nik"
                            value={formData.nik || ''}
                            onChange={handleChange}
                            maxLength={16}
                            pattern="[0-9]{16}"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* Nama */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                        <input
                            type="text"
                            name="nama"
                            value={formData.nama || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* Tempat Lahir */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tempat Lahir *</label>
                        <input
                            type="text"
                            name="tempat_lahir"
                            value={formData.tempat_lahir || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* Tanggal Lahir */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir *</label>
                        <input
                            type="date"
                            name="tanggal_lahir"
                            value={formData.tanggal_lahir || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* Jenis Kelamin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin *</label>
                        <select
                            name="jenis_kelamin"
                            value={formData.jenis_kelamin || 'L'}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        >
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
                    </div>

                    {/* Golongan Darah */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Golongan Darah</label>
                        <select
                            name="golongan_darah"
                            value={formData.golongan_darah || '-'}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {GOLONGAN_DARAH_OPTIONS.map(gol => (
                                <option key={gol} value={gol}>{gol === '-' ? 'Tidak Diketahui' : gol}</option>
                            ))}
                        </select>
                    </div>

                    {/* Alamat */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alamat *</label>
                        <textarea
                            name="alamat"
                            value={formData.alamat || ''}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* Alamat Kampung */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Kampung *</label>
                        <input
                            type="text"
                            name="alamat_kampung"
                            value={formData.alamat_kampung || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* RW */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">RW *</label>
                        <select
                            name="rw"
                            value={formData.rw || ''}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, rw: e.target.value, rt: '' }))
                            }}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">RT *</label>
                        <select
                            name="rt"
                            value={formData.rt || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Desa *</label>
                        <input
                            type="text"
                            name="desa"
                            value={formData.desa || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* Kecamatan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kecamatan *</label>
                        <input
                            type="text"
                            name="kecamatan"
                            value={formData.kecamatan || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* Kabupaten - Fixed */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kabupaten</label>
                        <input
                            type="text"
                            value="Cianjur"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            disabled
                        />
                    </div>

                    {/* Provinsi - Fixed */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Provinsi</label>
                        <input
                            type="text"
                            value="Jawa Barat"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                            disabled
                        />
                    </div>

                    {/* Agama */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agama *</label>
                        <select
                            name="agama"
                            value={formData.agama || 'Islam'}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        >
                            {AGAMA_OPTIONS.map(agama => (
                                <option key={agama} value={agama}>{agama}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Kawin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status Kawin *</label>
                        <select
                            name="status_kawin"
                            value={formData.status_kawin || 'Belum Kawin'}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        >
                            {STATUS_KAWIN_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pekerjaan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pekerjaan *</label>
                        <input
                            type="text"
                            name="pekerjaan"
                            value={formData.pekerjaan || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>

                    {/* Kewarganegaraan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kewarganegaraan *</label>
                        <select
                            name="kewarganegaraan"
                            value={formData.kewarganegaraan || 'WNI'}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        >
                            <option value="WNI">WNI</option>
                            <option value="WNA">WNA</option>
                        </select>
                    </div>

                    {/* No KK */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">No. Kartu Keluarga</label>
                        <input
                            type="text"
                            name="no_kk"
                            value={formData.no_kk || ''}
                            onChange={handleChange}
                            maxLength={16}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* No WA */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">No. WhatsApp</label>
                        <input
                            type="tel"
                            name="no_wa"
                            value={formData.no_wa || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                    <Link
                        href="/dashboard/warga"
                        className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                        <Save size={20} />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </div>
    )
}
