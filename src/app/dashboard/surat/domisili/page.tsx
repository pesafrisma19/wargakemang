'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga, Pengaturan, Penandatangan } from '@/types/database'
import WargaSearchSelect from '@/components/WargaSearchSelect'
import {
    generateSuratDomisili,
    DomisiliData,
    getDefaultParagrafPembuka,
    getDefaultParagrafIsi,
    getDefaultParagrafPenutup,
} from '@/lib/surat/domisili'
import { ArrowLeft, Save, Printer, Check, AlertCircle, UserPlus, Search, RotateCcw, Download, Eye } from 'lucide-react'
import Link from 'next/link'

type InputMode = 'search' | 'manual'

export default function SuratDomisiliPage() {
    const supabase = createClient()
    const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null)
    const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')
    const [inputMode, setInputMode] = useState<InputMode>('search')

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

    // Alamat fields
    const [alamatJalan, setAlamatJalan] = useState('')
    const [rt, setRt] = useState('')
    const [rw, setRw] = useState('')
    const [desa, setDesa] = useState('Kemang')
    const [kecamatan, setKecamatan] = useState('Bojongpicung')
    const [kabupaten, setKabupaten] = useState('Cianjur')

    // Editable paragraphs
    const [paragrafPembuka, setParagrafPembuka] = useState('')
    const [paragrafIsi, setParagrafIsi] = useState('')
    const [paragrafPenutup, setParagrafPenutup] = useState('')
    const [keperluan, setKeperluan] = useState('')

    // TTD
    const [penandatangan, setPenandatangan] = useState<Penandatangan>('kades')
    const [tanggalSurat, setTanggalSurat] = useState(
        new Date().toISOString().split('T')[0]
    )

    // Track if user manually edited paragraphs
    const [paragrafIsiEdited, setParagrafIsiEdited] = useState(false)

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
        if (data) {
            setParagrafPembuka(getDefaultParagrafPembuka(data))
            setParagrafPenutup(getDefaultParagrafPenutup())
        }
        setLoading(false)
    }

    const generateNomorSurat = async () => {
        const year = new Date().getFullYear()
        const { count } = await supabase
            .from('surat')
            .select('*', { count: 'exact', head: true })
            .eq('jenis_surat', 'domisili')
            .gte('created_at', `${year}-01-01`)
        const nextNum = (count || 0) + 1
        setNomorSurat(`474.4 / ${nextNum} /Pemdes/ ${year}`)
    }

    // When keperluan changes, auto-update paragrafIsi (unless user manually edited it)
    useEffect(() => {
        if (!paragrafIsiEdited && keperluan) {
            setParagrafIsi(getDefaultParagrafIsi(keperluan))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keperluan])

    const handleWargaSelect = (warga: Warga) => {
        setSelectedWarga(warga)
        setNama(warga.nama)
        setTempatLahir(warga.tempat_lahir)
        setTanggalLahir(warga.tanggal_lahir)
        setNik(warga.nik)
        setStatusKawin(warga.status_kawin)
        setJenisKelamin(warga.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan')
        setKewarganegaraan(warga.kewarganegaraan || 'WNI')
        setPekerjaan(warga.pekerjaan)
        setAgama(warga.agama)
        setAlamatJalan(warga.alamat)
        setRt(warga.rt)
        setRw(warga.rw)
        setDesa(warga.desa)
        setKecamatan(warga.kecamatan)
        setKabupaten(warga.kabupaten)
    }

    const handleClearWarga = () => {
        setSelectedWarga(null)
        if (inputMode === 'search') {
            setNama('')
            setTempatLahir('')
            setTanggalLahir('')
            setNik('')
            setStatusKawin('')
            setJenisKelamin('')
            setKewarganegaraan('WNI')
            setPekerjaan('')
            setAgama('')
            setAlamatJalan('')
            setRt('')
            setRw('')
            setDesa('Kemang')
            setKecamatan('Bojongpicung')
            setKabupaten('Cianjur')
        }
    }

    const handleSwitchMode = (mode: InputMode) => {
        setInputMode(mode)
        setSelectedWarga(null)
        // Don't clear manual fields when switching
    }

    const showDataForm = inputMode === 'manual' || selectedWarga || nama

    const resetParagrafIsi = () => {
        setParagrafIsi(getDefaultParagrafIsi(keperluan))
        setParagrafIsiEdited(false)
    }

    // Validate form before any action
    const validateForm = (): boolean => {
        if (!pengaturan) {
            setError('Pengaturan desa belum diisi. Silakan isi di halaman Pengaturan.')
            return false
        }
        if (!nama || !nik) {
            setError('Nama dan NIK wajib diisi.')
            return false
        }
        if (!paragrafIsi) {
            setError('Isi surat belum diisi.')
            return false
        }
        setError('')
        return true
    }

    // Build data object from form
    const buildData = (): DomisiliData => {
        const fullAlamat = `${alamatJalan} RT. ${rt} RW. ${rw} Desa ${desa}\nKecamatan ${kecamatan}, Kabupaten ${kabupaten}`
        return {
            nomorSurat, nama, tempatLahir, tanggalLahir, nik,
            statusKawin, jenisKelamin, kewarganegaraan, pekerjaan,
            agama, alamat: fullAlamat, paragrafPembuka, paragrafIsi, paragrafPenutup,
            penandatangan, tanggalSurat,
        }
    }

    // 1. SIMPAN - save to archive only
    const handleSimpan = async () => {
        if (!validateForm()) return
        setGenerating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('surat').insert({
                nomor_surat: nomorSurat,
                jenis_surat: 'domisili',
                warga_id: selectedWarga?.id || null,
                warga_nama: nama,
                warga_nik: nik,
                data_surat: buildData(),
                dibuat_oleh: user?.id,
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            console.error(err)
            setError('Gagal menyimpan ke arsip.')
        }
        setGenerating(false)
    }

    // 2. PRINT - preview & print (opens in new tab)
    const handlePrint = async () => {
        if (!validateForm() || !pengaturan) return
        setGenerating(true)
        try {
            const doc = await generateSuratDomisili(buildData(), pengaturan)
            // Open PDF in new tab for preview/print
            const blobUrl = doc.output('bloburl')
            window.open(blobUrl as unknown as string, '_blank')
        } catch (err) {
            console.error(err)
            setError('Gagal membuat preview PDF.')
        }
        setGenerating(false)
    }

    // 3. DOWNLOAD - save as PDF file
    const handleDownload = async () => {
        if (!validateForm() || !pengaturan) return
        setGenerating(true)
        try {
            const doc = await generateSuratDomisili(buildData(), pengaturan)
            doc.save(`Surat_Domisili_${nama.replace(/\s+/g, '_')}.pdf`)
        } catch (err) {
            console.error(err)
            setError('Gagal mendownload PDF.')
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
                <Link href="/dashboard/surat" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
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
                        <Link href="/dashboard/pengaturan" className="font-semibold underline">Isi di Pengaturan</Link>
                    </span>
                </div>
            )}

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

            {/* Step 2: Pilih / Input Warga */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Data Warga</h2>
                    {/* Toggle: Search DB / Input Manual */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => handleSwitchMode('search')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                inputMode === 'search'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Search size={14} />
                            Cari Database
                        </button>
                        <button
                            onClick={() => handleSwitchMode('manual')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                inputMode === 'manual'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <UserPlus size={14} />
                            Input Manual
                        </button>
                    </div>
                </div>

                {inputMode === 'search' && (
                    <WargaSearchSelect
                        onSelect={handleWargaSelect}
                        selectedWarga={selectedWarga}
                        onClear={handleClearWarga}
                    />
                )}

                {inputMode === 'manual' && !selectedWarga && (
                    <p className="text-sm text-gray-500 mb-3 bg-blue-50 px-3 py-2 rounded-lg">
                        💡 Mode input manual — isi data warga langsung tanpa perlu ada di database.
                    </p>
                )}
            </div>

            {/* Step 3: Data Warga (Editable) */}
            {showDataForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600">
                        <h2 className="text-white font-semibold">Data Warga</h2>
                        <p className="text-emerald-100 text-sm">
                            {inputMode === 'search' ? 'Data otomatis terisi, bisa diedit jika perlu' : 'Isi data warga secara manual'}
                        </p>
                    </div>
                    <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Nama <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                                placeholder="Nama lengkap"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tempat Lahir</label>
                            <input type="text" value={tempatLahir} onChange={(e) => setTempatLahir(e.target.value)}
                                placeholder="Contoh: Cianjur"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Lahir</label>
                            <input type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                NIK <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={nik} onChange={(e) => setNik(e.target.value)}
                                placeholder="16 digit NIK"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 font-mono" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Status Perkawinan</label>
                            <input type="text" value={statusKawin} onChange={(e) => setStatusKawin(e.target.value)}
                                placeholder="Kawin / Belum Kawin"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Jenis Kelamin</label>
                            <input type="text" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)}
                                placeholder="Laki-laki / Perempuan"
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
                                placeholder="Contoh: Petani"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Agama</label>
                            <input type="text" value={agama} onChange={(e) => setAgama(e.target.value)}
                                placeholder="Contoh: Islam"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                        </div>
                        <div className="sm:col-span-2 space-y-4 border-t border-gray-100 pt-4 mt-2">
                            <h3 className="font-medium text-gray-700">Alamat Lengkap</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Kampung / Jalan</label>
                                <textarea value={alamatJalan} onChange={(e) => setAlamatJalan(e.target.value)} rows={2}
                                    placeholder="Kp. Pasir ..."
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">RT</label>
                                    <input type="text" value={rt} onChange={(e) => setRt(e.target.value)} placeholder="001" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">RW</label>
                                    <input type="text" value={rw} onChange={(e) => setRw(e.target.value)} placeholder="001" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Desa</label>
                                    <input type="text" value={desa} onChange={(e) => setDesa(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Kecamatan</label>
                                    <input type="text" value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Kabupaten</label>
                                <input type="text" value={kabupaten} onChange={(e) => setKabupaten(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Isi Surat (Editable Paragraphs) */}
            {showDataForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                        <h2 className="text-white font-semibold">Isi Surat</h2>
                        <p className="text-blue-100 text-sm">Kata-kata surat bisa diedit langsung di bawah ini</p>
                    </div>
                    <div className="p-5 sm:p-6 space-y-4">
                        {/* Keperluan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Keperluan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={keperluan}
                                onChange={(e) => setKeperluan(e.target.value)}
                                placeholder="Contoh: membuat Kartu Keluarga, melamar pekerjaan"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-800 placeholder-gray-400"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Otomatis mengisi paragraf isi di bawah. Atau edit langsung paragrafnya.
                            </p>
                        </div>

                        {/* Paragraf Pembuka */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Paragraf Pembuka</label>
                            <textarea
                                value={paragrafPembuka}
                                onChange={(e) => setParagrafPembuka(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none text-sm leading-relaxed"
                            />
                        </div>

                        {/* Paragraf Isi */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-600">Paragraf Isi (Menerangkan)</label>
                                {paragrafIsiEdited && (
                                    <button
                                        onClick={resetParagrafIsi}
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                        title="Reset ke template default"
                                    >
                                        <RotateCcw size={12} />
                                        Reset
                                    </button>
                                )}
                            </div>
                            <textarea
                                value={paragrafIsi}
                                onChange={(e) => {
                                    setParagrafIsi(e.target.value)
                                    setParagrafIsiEdited(true)
                                }}
                                rows={4}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none text-sm leading-relaxed"
                            />
                        </div>

                        {/* Paragraf Penutup */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Paragraf Penutup</label>
                            <textarea
                                value={paragrafPenutup}
                                onChange={(e) => setParagrafPenutup(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 resize-none text-sm leading-relaxed"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 5: Penandatangan & Tanggal */}
            {showDataForm && (
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
            {showDataForm && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Simpan ke Arsip */}
                    <button
                        onClick={handleSimpan}
                        disabled={generating}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
                    >
                        {generating ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                            <Save size={20} />
                        )}
                        Simpan Arsip
                    </button>
                    {/* Preview & Print */}
                    <button
                        onClick={handlePrint}
                        disabled={generating}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                    >
                        <Eye size={20} />
                        Preview & Print
                    </button>
                    {/* Download PDF */}
                    <button
                        onClick={handleDownload}
                        disabled={generating}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        <Download size={20} />
                        Download PDF
                    </button>
                </div>
            )}
        </div>
    )
}
