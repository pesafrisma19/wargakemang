'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    WargaInput,
    AGAMA_OPTIONS,
    STATUS_KAWIN_OPTIONS,
    GOLONGAN_DARAH_OPTIONS,
    RW_RT_STRUCTURE,
    User,
    DEFAULT_DESA,
    DEFAULT_KECAMATAN
} from '@/types/database'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function TambahWargaPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [profile, setProfile] = useState<User | null>(null)
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
        agama: 'Islam',
        status_kawin: 'Belum Kawin',
        pekerjaan: '',
        kewarganegaraan: 'WNI',
        no_kk: '',
        no_wa: '',
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

                // Pre-fill RT/RW for non-admin users
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.from('warga').insert([{
            ...formData,
            desa: formData.desa || DEFAULT_DESA,
            kecamatan: formData.kecamatan || DEFAULT_KECAMATAN,
            kabupaten: 'Cianjur',
            provinsi: 'Jawa Barat',
        }])

        if (error) {
            alert('Gagal menyimpan data: ' + error.message)
            setLoading(false)
            return
        }

        router.push('/dashboard/warga')
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
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
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Tambah Warga</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Isi data warga sesuai KTP</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* NIK */}
                    <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">NIK *</label>
                        <input
                            type="text"
                            name="nik"
                            value={formData.nik}
                            onChange={handleChange}
                            maxLength={16}
                            inputMode="numeric"
                            pattern="[0-9]{16}"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
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
                            value={formData.nama}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
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
                            value={formData.tempat_lahir}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
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
                            value={formData.tanggal_lahir}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                            required
                        />
                    </div>

                    {/* Jenis Kelamin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Jenis Kelamin *</label>
                        <select
                            name="jenis_kelamin"
                            value={formData.jenis_kelamin}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white"
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
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white"
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
                            value={formData.alamat}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base resize-none"
                            placeholder="Alamat lengkap (Kampung/Jalan, No. Rumah)"
                            required
                        />
                    </div>

                    {/* RW */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">RW *</label>
                        <select
                            name="rw"
                            value={formData.rw}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, rw: e.target.value, rt: '' }))
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white"
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
                            value={formData.rt}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white"
                            required
                            disabled={profile?.role !== 'admin' || !formData.rw}
                        >
                            <option value="">Pilih RT</option>
                            {formData.rw && RW_RT_STRUCTURE[formData.rw as keyof typeof RW_RT_STRUCTURE]?.map(rt => (
                                <option key={rt} value={rt}>RT {rt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Desa - Default Kemang */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Desa</label>
                        <input
                            type="text"
                            name="desa"
                            value={formData.desa}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50 text-gray-600 text-base"
                            placeholder="Kemang"
                        />
                    </div>

                    {/* Kecamatan - Default Bojongpicung */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Kecamatan</label>
                        <input
                            type="text"
                            name="kecamatan"
                            value={formData.kecamatan}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50 text-gray-600 text-base"
                            placeholder="Bojongpicung"
                        />
                    </div>

                    {/* Kabupaten - Fixed */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Kabupaten</label>
                        <input
                            type="text"
                            value="Cianjur"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-100 text-gray-500 text-base"
                            disabled
                        />
                    </div>

                    {/* Provinsi - Fixed */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Provinsi</label>
                        <input
                            type="text"
                            value="Jawa Barat"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-gray-100 text-gray-500 text-base"
                            disabled
                        />
                    </div>

                    {/* Agama */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Agama *</label>
                        <select
                            name="agama"
                            value={formData.agama}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white"
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
                            value={formData.status_kawin}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white"
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
                            value={formData.pekerjaan}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                            placeholder="Pekerjaan"
                            required
                        />
                    </div>

                    {/* Kewarganegaraan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Kewarganegaraan *</label>
                        <select
                            name="kewarganegaraan"
                            value={formData.kewarganegaraan}
                            onChange={handleChange}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white"
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
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                            placeholder="16 digit No. KK (opsional)"
                        />
                    </div>

                    {/* No WA */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">No. WhatsApp</label>
                        <input
                            type="tel"
                            name="no_wa"
                            value={formData.no_wa || ''}
                            onChange={handleChange}
                            inputMode="tel"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                            placeholder="08xxxxxxxxxx (opsional)"
                        />
                    </div>
                </div>

                {/* Submit Button - Fixed at bottom on mobile */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
                    <Link
                        href="/dashboard/warga"
                        className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-center order-2 sm:order-1"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all order-1 sm:order-2"
                    >
                        <Save size={20} />
                        {loading ? 'Menyimpan...' : 'Simpan Data'}
                    </button>
                </div>
            </form>
        </div>
    )
}
