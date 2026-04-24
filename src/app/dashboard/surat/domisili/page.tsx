'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga, Pengaturan, Penandatangan } from '@/types/database'
import WargaSearchSelect from '@/components/WargaSearchSelect'
import { generateSuratDomisili, DomisiliData } from '@/lib/surat/domisili'
import { ArrowLeft, FileText, Printer, Save, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function SuratDomisiliPage() {
    const supabase = createClient()
    const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null)
    const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    // Editable form fields
    const [nomorSurat, setNomorSurat] = useState('')
    const [nama, setNama] = useState('')
    const [tempatLahir, setTempatLahir] = useState('')
    const [tanggalLahir, setTanggalLahir] = useState('')
    const [nik, setNik] = useState('')
    const [statusKawin, setStatusKawin] = useState('')
    const [jenisKelamin, setJenisKelamin] = useState('')
    const [kewarganegaraan, setKewarganegaraan] = useState('WNI')
    const [pekerjaan, setPekerjaan] = useState('')
    const [agama, setAgama] = useState('')
    const [alamat, setAlamat] = useState('')
    const [keperluan, setKeperluan] = useState('')
    const [penandatangan, setPenandatangan] = useState<Penandatangan>('kades')
    const [tanggalSurat, setTanggalSurat] = useState(
        new Date().toISOString().split('T')[0]
    )

    useEffect(() => {
        fetchPengaturan()
        generateNomorSurat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchPengaturan = async () => {
        const { data } = await supabase
            .from('pengaturan')
            .select('*')
            .eq('id', 1)
            .single()
        setPengaturan(data)
        setLoading(false)
    }

    const generateNomorSurat = async () => {
        const year = new Date().getFullYear()
        // Count existing domisili letters this year
        const { count } = await supabase
            .from('surat')
            .select('*', { count: 'exact', head: true })
            .eq('jenis_surat', 'domisili')
            .gte('created_at', `${year}-01-01`)

        const nextNum = (count || 0) + 1
        setNomorSurat(`474.4 / ${nextNum} /Pemdes/ ${year}`)
    }

    const handleWargaSelect = (warga: Warga) => {
        setSelectedWarga(warga)
        // Auto-fill editable fields
        setNama(warga.nama)
        setTempatLahir(warga.tempat_lahir)
        setTanggalLahir(warga.tanggal_lahir)
        setNik(warga.nik)
        setStatusKawin(warga.status_kawin)
        setJenisKelamin(warga.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan')
        setKewarganegaraan(warga.kewarganegaraan || 'WNI')
        setPekerjaan(warga.pekerjaan)
        setAgama(warga.agama)

        // Build full address
        const fullAlamat = `${warga.alamat} RT. ${warga.rt} RW. ${warga.rw} Desa ${warga.desa}\nKecamatan ${warga.kecamatan}, Kabupaten ${warga.kabupaten}`
        setAlamat(fullAlamat)
    }

    const handleClearWarga = () => {
        setSelectedWarga(null)
        setNama('')
        setTempatLahir('')
        setTanggalLahir('')
        setNik('')
        setStatusKawin('')
        setJenisKelamin('')
        setKewarganegaraan('WNI')
        setPekerjaan('')
        setAgama('')
        setAlamat('')
    }

    const handleGeneratePDF = async (saveToHistory: boolean) => {
        if (!pengaturan) {
            setError('Pengaturan desa belum diisi. Silakan isi di halaman Pengaturan.')
            return
        }
        if (!nama || !nik) {
            setError('Data warga belum lengkap. Pilih warga terlebih dahulu.')
            return
        }
        if (!keperluan) {
            setError('Keperluan surat belum diisi.')
            return
        }

        setGenerating(true)
        setError('')

        try {
            const data: DomisiliData = {
                nomorSurat,
                nama,
                tempatLahir,
                tanggalLahir,
                nik,
                statusKawin,
                jenisKelamin,
                kewarganegaraan,
                pekerjaan,
                agama,
                alamat,
                keperluan,
                penandatangan,
                tanggalSurat,
            }

            const doc = await generateSuratDomisili(data, pengaturan)

            // Save to history if requested
            if (saveToHistory) {
                const { data: { user } } = await supabase.auth.getUser()
                await supabase.from('surat').insert({
                    nomor_surat: nomorSurat,
                    jenis_surat: 'domisili',
                    warga_id: selectedWarga?.id || null,
                    warga_nama: nama,
                    warga_nik: nik,
                    data_surat: data,
                    dibuat_oleh: user?.id,
                })
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            }

            // Download PDF
            doc.save(`Surat_Domisili_${nama.replace(/\s+/g, '_')}.pdf`)
        } catch (err) {
            console.error(err)
            setError('Gagal membuat PDF. Silakan coba lagi.')
        }

        setGenerating(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/surat"
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <ArrowLeft size={22} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">📍</span>
                        Surat Keterangan Domisili
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Menerangkan domisili/tempat tinggal warga</p>
                </div>
            </div>

            {/* Warning if settings not configured */}
            {pengaturan && (!pengaturan.nama_kades && !pengaturan.nama_sekdes) && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                    <AlertCircle size={18} />
                    <span className="text-sm">
                        Nama Kepala Desa / Sekdes belum diisi.{' '}
                        <Link href="/dashboard/pengaturan" className="font-semibold underline">
                            Isi di Pengaturan
                        </Link>
                    </span>
                </div>
            )}

            {/* Success / Error */}
            {saved && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                    <Check size={18} />
                    <span className="text-sm font-medium">Surat berhasil disimpan ke arsip!</span>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Step 1: Nomor Surat */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Nomor Surat</h2>
                <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800 font-mono"
                    placeholder="474.4 / 1 /Pemdes/ 2026"
                />
            </div>

            {/* Step 2: Pilih Warga */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Pilih Data Warga
                </h2>
                <WargaSearchSelect
                    onSelect={handleWargaSelect}
                    selectedWarga={selectedWarga}
                    onClear={handleClearWarga}
                />
            </div>

            {/* Step 3: Data Warga (Editable) */}
            {(selectedWarga || nama) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600">
                        <h2 className="text-white font-semibold">Data Warga</h2>
                        <p className="text-emerald-100 text-sm">Data otomatis terisi, bisa diedit jika perlu</p>
                    </div>
                    <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nama</label>
                            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tempat Lahir</label>
                            <input type="text" value={tempatLahir} onChange={(e) => setTempatLahir(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Lahir</label>
                            <input type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">NIK</label>
                            <input type="text" value={nik} onChange={(e) => setNik(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 font-mono" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Status Perkawinan</label>
                            <input type="text" value={statusKawin} onChange={(e) => setStatusKawin(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Jenis Kelamin</label>
                            <input type="text" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Kewarganegaraan</label>
                            <input type="text" value={kewarganegaraan} onChange={(e) => setKewarganegaraan(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Pekerjaan</label>
                            <input type="text" value={pekerjaan} onChange={(e) => setPekerjaan(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Agama</label>
                            <input type="text" value={agama} onChange={(e) => setAgama(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Alamat Lengkap</label>
                            <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 resize-none" />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Isi Surat */}
            {(selectedWarga || nama) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Isi Surat</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Keperluan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={keperluan}
                            onChange={(e) => setKeperluan(e.target.value)}
                            placeholder="Contoh: membuat Kartu Keluarga, melamar pekerjaan, dll"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-800 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">
                            Akan tertulis: &quot;...melengkapi persyaratan <span className="font-medium text-gray-600">{keperluan || '...'}</span>&quot;
                        </p>
                    </div>
                </div>
            )}

            {/* Step 5: Penandatangan & Tanggal */}
            {(selectedWarga || nama) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Penandatangan & Tanggal</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Penandatangan</label>
                            <select
                                value={penandatangan}
                                onChange={(e) => setPenandatangan(e.target.value as Penandatangan)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 bg-white"
                            >
                                <option value="kades">
                                    Kepala Desa {pengaturan?.nama_kades ? `(${pengaturan.nama_kades})` : ''}
                                </option>
                                <option value="sekdes">
                                    A.N Kepala Desa — Sekdes {pengaturan?.nama_sekdes ? `(${pengaturan.nama_sekdes})` : ''}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Surat</label>
                            <input
                                type="date"
                                value={tanggalSurat}
                                onChange={(e) => setTanggalSurat(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {(selectedWarga || nama) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => handleGeneratePDF(true)}
                        disabled={generating}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
                    >
                        {generating ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                            <Save size={20} />
                        )}
                        Simpan & Cetak PDF
                    </button>
                    <button
                        onClick={() => handleGeneratePDF(false)}
                        disabled={generating}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        <Printer size={20} />
                        Cetak PDF Saja
                    </button>
                </div>
            )}
        </div>
    )
}
