'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pengaturan } from '@/types/database'
import { Settings, Save, Check, AlertCircle } from 'lucide-react'

export default function PengaturanPage() {
    const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    useEffect(() => {
        fetchPengaturan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchPengaturan = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('pengaturan')
            .select('*')
            .eq('id', 1)
            .single()

        if (error && error.code === 'PGRST116') {
            // Row doesn't exist, insert default
            const { data: newData } = await supabase
                .from('pengaturan')
                .insert({ id: 1 })
                .select()
                .single()
            setPengaturan(newData)
        } else {
            setPengaturan(data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!pengaturan) return

        setSaving(true)
        setError('')
        setSuccess(false)

        const { error: updateError } = await supabase
            .from('pengaturan')
            .update({
                nama_desa: pengaturan.nama_desa,
                nama_kecamatan: pengaturan.nama_kecamatan,
                nama_kabupaten: pengaturan.nama_kabupaten,
                nama_provinsi: pengaturan.nama_provinsi,
                alamat_kantor: pengaturan.alamat_kantor,
                kode_pos: pengaturan.kode_pos,
                nama_kades: pengaturan.nama_kades,
                nama_sekdes: pengaturan.nama_sekdes,
                updated_at: new Date().toISOString(),
            })
            .eq('id', 1)

        if (updateError) {
            setError('Gagal menyimpan pengaturan: ' + updateError.message)
        } else {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }

        setSaving(false)
    }

    const updateField = (field: keyof Pengaturan, value: string) => {
        if (!pengaturan) return
        setPengaturan({ ...pengaturan, [field]: value })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Settings className="w-7 h-7 text-emerald-600" />
                    Pengaturan
                </h1>
                <p className="text-gray-500 mt-1">Pengaturan data desa dan pejabat penandatangan surat</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                    <Check size={18} />
                    <span className="text-sm font-medium">Pengaturan berhasil disimpan!</span>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Pejabat Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600">
                    <h2 className="text-lg font-semibold text-white">Pejabat Penandatangan</h2>
                    <p className="text-emerald-100 text-sm">Data pejabat yang menandatangani surat</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nama Kepala Desa <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={pengaturan?.nama_kades || ''}
                            onChange={(e) => updateField('nama_kades', e.target.value)}
                            placeholder="Contoh: DADAN R. SUBARNA"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800 placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nama Sekretaris Desa <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={pengaturan?.nama_sekdes || ''}
                            onChange={(e) => updateField('nama_sekdes', e.target.value)}
                            placeholder="Contoh: ASEP SUNANDAR"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800 placeholder-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Data Desa Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                    <h2 className="text-lg font-semibold text-white">Data Desa</h2>
                    <p className="text-blue-100 text-sm">Identitas desa untuk kop surat</p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Desa</label>
                        <input
                            type="text"
                            value={pengaturan?.nama_desa || ''}
                            onChange={(e) => updateField('nama_desa', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Kecamatan</label>
                        <input
                            type="text"
                            value={pengaturan?.nama_kecamatan || ''}
                            onChange={(e) => updateField('nama_kecamatan', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Kabupaten</label>
                        <input
                            type="text"
                            value={pengaturan?.nama_kabupaten || ''}
                            onChange={(e) => updateField('nama_kabupaten', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Provinsi</label>
                        <input
                            type="text"
                            value={pengaturan?.nama_provinsi || ''}
                            onChange={(e) => updateField('nama_provinsi', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Kantor Desa</label>
                        <input
                            type="text"
                            value={pengaturan?.alamat_kantor || ''}
                            onChange={(e) => updateField('alamat_kantor', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode Pos</label>
                        <input
                            type="text"
                            value={pengaturan?.kode_pos || ''}
                            onChange={(e) => updateField('kode_pos', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                        <Save size={20} />
                    )}
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
            </div>
        </div>
    )
}
