'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga, Pengaturan, Penandatangan } from '@/types/database'
import WargaSearchSelect from '@/components/WargaSearchSelect'
import {
    generateSuratKelahiran,
    KelahiranData,
    getDefaultParagrafPenutupKelahiran,
} from '@/lib/surat/kelahiran'
import { ArrowLeft, Save, Check, AlertCircle, UserPlus, Search, Download, Eye } from 'lucide-react'
import Link from 'next/link'

type InputMode = 'search' | 'manual'

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const HUBUNGAN_OPTIONS = ['Ayah Kandung', 'Ibu Kandung', 'Saudara', 'Famili Lain']

function calculateAge(birthDate: string): number {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
}

function getDayName(dateStr: string): string {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    return days[new Date(dateStr).getDay()]
}

export default function SuratKelahiranPage() {
    const supabase = createClient()
    const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    // Input modes for each person
    const [anakMode, setAnakMode] = useState<InputMode>('manual')
    const [ibuMode, setIbuMode] = useState<InputMode>('manual')
    const [ayahMode, setAyahMode] = useState<InputMode>('manual')

    // Selected warga refs (for DB mode)
    const [selectedAnak, setSelectedAnak] = useState<Warga | null>(null)
    const [selectedIbu, setSelectedIbu] = useState<Warga | null>(null)
    const [selectedAyah, setSelectedAyah] = useState<Warga | null>(null)

    // Nomor surat
    const [nomorSurat, setNomorSurat] = useState('')

    // Data kelahiran
    const [hariLahir, setHariLahir] = useState('')
    const [tanggalLahir, setTanggalLahir] = useState('')
    const [tempatLahir, setTempatLahir] = useState('')
    const [jenisKelaminAnak, setJenisKelaminAnak] = useState('')
    const [anakKe, setAnakKe] = useState('')
    const [namaAnak, setNamaAnak] = useState('')

    // Data Ibu
    const [namaIbu, setNamaIbu] = useState('')
    const [umurIbu, setUmurIbu] = useState('')
    const [agamaIbu, setAgamaIbu] = useState('')

    // Data Ayah
    const [namaAyah, setNamaAyah] = useState('')
    const [umurAyah, setUmurAyah] = useState('')
    const [agamaAyah, setAgamaAyah] = useState('')
    const [pekerjaanAyah, setPekerjaanAyah] = useState('')
    const [wargaNegaraAyah, setWargaNegaraAyah] = useState('INDONESIA')
    const [alamatAyah, setAlamatAyah] = useState('')

    // Pelapor
    const [namaPelapor, setNamaPelapor] = useState('')
    const [hubunganPelapor, setHubunganPelapor] = useState('Ayah Kandung')

    // Paragraf & TTD
    const [paragrafPenutup, setParagrafPenutup] = useState('')
    const [penandatangan, setPenandatangan] = useState<Penandatangan>('kades')
    const [tanggalSurat, setTanggalSurat] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchPengaturan()
        generateNomorSurat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Auto-fill hari when tanggalLahir changes
    useEffect(() => {
        if (tanggalLahir) setHariLahir(getDayName(tanggalLahir))
    }, [tanggalLahir])

    const fetchPengaturan = async () => {
        const { data } = await supabase.from('pengaturan').select('*').eq('id', 1).single()
        setPengaturan(data)
        setParagrafPenutup(getDefaultParagrafPenutupKelahiran())
        setLoading(false)
    }

    const generateNomorSurat = async () => {
        const year = new Date().getFullYear()
        const { count } = await supabase
            .from('surat')
            .select('*', { count: 'exact', head: true })
            .eq('jenis_surat', 'kelahiran')
            .gte('created_at', `${year}-01-01`)
        setNomorSurat(`474.1/ ${(count || 0) + 1} /Pemdes/${year}`)
    }

    // Handlers for selecting warga from DB
    const handleAnakSelect = (w: Warga) => {
        setSelectedAnak(w)
        setNamaAnak(w.nama)
        setTanggalLahir(w.tanggal_lahir)
        setTempatLahir(w.tempat_lahir)
        setJenisKelaminAnak(w.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan')
        setHariLahir(getDayName(w.tanggal_lahir))
        // Auto-fill parent names if available
        if (w.nama_ibu) { setNamaIbu(w.nama_ibu) }
        if (w.nama_ayah) { setNamaAyah(w.nama_ayah); setNamaPelapor(w.nama_ayah) }
    }

    const handleIbuSelect = (w: Warga) => {
        setSelectedIbu(w)
        setNamaIbu(w.nama)
        setUmurIbu(String(calculateAge(w.tanggal_lahir)))
        setAgamaIbu(w.agama)
    }

    const handleAyahSelect = (w: Warga) => {
        setSelectedAyah(w)
        setNamaAyah(w.nama)
        setUmurAyah(String(calculateAge(w.tanggal_lahir)))
        setAgamaAyah(w.agama)
        setPekerjaanAyah(w.pekerjaan)
        setWargaNegaraAyah(w.kewarganegaraan || 'INDONESIA')
        setAlamatAyah(`${w.alamat} RT. ${w.rt} RW. ${w.rw}\nDesa ${w.desa} Kec. ${w.kecamatan} Kab. ${w.kabupaten}`)
        setNamaPelapor(w.nama)
    }

    const validateForm = (): boolean => {
        if (!pengaturan) { setError('Pengaturan desa belum diisi.'); return false }
        if (!namaAnak) { setError('Nama anak wajib diisi.'); return false }
        if (!tanggalLahir) { setError('Tanggal lahir wajib diisi.'); return false }
        if (!namaIbu) { setError('Nama ibu wajib diisi.'); return false }
        if (!namaAyah) { setError('Nama ayah wajib diisi.'); return false }
        setError('')
        return true
    }

    const buildData = (): KelahiranData => ({
        nomorSurat, hariLahir, tanggalLahir, tempatLahir,
        jenisKelaminAnak, anakKe, namaAnak,
        namaIbu, umurIbu, agamaIbu,
        namaAyah, umurAyah, agamaAyah, pekerjaanAyah, wargaNegaraAyah, alamatAyah,
        namaPelapor, hubunganPelapor, paragrafPenutup,
        penandatangan, tanggalSurat,
    })

    const handleSimpan = async () => {
        if (!validateForm()) return
        setGenerating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('surat').insert({
                nomor_surat: nomorSurat,
                jenis_surat: 'kelahiran',
                warga_id: selectedAnak?.id || null,
                warga_nama: namaAnak,
                warga_nik: selectedAnak?.nik || '-',
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

    const handlePrint = async () => {
        if (!validateForm() || !pengaturan) return
        setGenerating(true)
        try {
            const doc = await generateSuratKelahiran(buildData(), pengaturan)
            const blobUrl = doc.output('bloburl')
            window.open(blobUrl as unknown as string, '_blank')
        } catch (err) { console.error(err); setError('Gagal membuat preview.') }
        setGenerating(false)
    }

    const handleDownload = async () => {
        if (!validateForm() || !pengaturan) return
        setGenerating(true)
        try {
            const doc = await generateSuratKelahiran(buildData(), pengaturan)
            doc.save(`Surat_Kelahiran_${namaAnak.replace(/\s+/g, '_')}.pdf`)
        } catch (err) { console.error(err); setError('Gagal download PDF.') }
        setGenerating(false)
    }

    // Toggle button component
    const ModeToggle = ({ mode, onChange }: { mode: InputMode; onChange: (m: InputMode) => void }) => (
        <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => onChange('search')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'search' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
                <Search size={13} /> Cari DB
            </button>
            <button onClick={() => onChange('manual')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'manual' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>
                <UserPlus size={13} /> Manual
            </button>
        </div>
    )

    const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm"

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="space-y-5 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/surat" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ArrowLeft size={22} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">👶</span> Surat Kelahiran
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">F4 Landscape • 1/3 halaman • Background hijau</p>
                </div>
            </div>

            {/* Messages */}
            {saved && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                    <Check size={18} /><span className="text-sm font-medium">Surat berhasil disimpan ke arsip!</span>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={18} /><span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Nomor Surat */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Nomor Surat</h2>
                <input type="text" value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value)}
                    className={`${inputClass} font-mono`} placeholder="474.1/ 1 /Pemdes/2026" />
            </div>

            {/* Data Kelahiran */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-semibold">👶 Data Kelahiran</h2>
                        <p className="text-pink-100 text-xs">Data anak yang lahir</p>
                    </div>
                    <ModeToggle mode={anakMode} onChange={(m) => { setAnakMode(m); setSelectedAnak(null) }} />
                </div>
                <div className="p-5 space-y-4">
                    {anakMode === 'search' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Cari data anak di database</label>
                            <WargaSearchSelect onSelect={handleAnakSelect} selectedWarga={selectedAnak}
                                onClear={() => setSelectedAnak(null)} />
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Hari Lahir</label>
                            <select value={hariLahir} onChange={(e) => setHariLahir(e.target.value)} className={`${inputClass} bg-white`}>
                                <option value="">Pilih hari</option>
                                {HARI_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Lahir *</label>
                            <input type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tempat Lahir</label>
                            <input type="text" value={tempatLahir} onChange={(e) => setTempatLahir(e.target.value)} className={inputClass} placeholder="Cianjur" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Kelamin Anak</label>
                            <select value={jenisKelaminAnak} onChange={(e) => setJenisKelaminAnak(e.target.value)} className={`${inputClass} bg-white`}>
                                <option value="">Pilih</option>
                                <option value="Laki-Laki">Laki-Laki</option>
                                <option value="Perempuan">Perempuan</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Anak Ke-</label>
                            <input type="text" value={anakKe} onChange={(e) => setAnakKe(e.target.value)} className={inputClass} placeholder='1 ( Satu )' />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nama Anak *</label>
                            <input type="text" value={namaAnak} onChange={(e) => setNamaAnak(e.target.value)} className={inputClass} placeholder="Nama lengkap" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Ibu */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-semibold">👩 Data Ibu</h2>
                        <p className="text-purple-100 text-xs">Data ibu kandung</p>
                    </div>
                    <ModeToggle mode={ibuMode} onChange={(m) => { setIbuMode(m); setSelectedIbu(null) }} />
                </div>
                <div className="p-5 space-y-4">
                    {ibuMode === 'search' && (
                        <WargaSearchSelect onSelect={handleIbuSelect} selectedWarga={selectedIbu}
                            onClear={() => setSelectedIbu(null)} />
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nama Ibu *</label>
                            <input type="text" value={namaIbu} onChange={(e) => setNamaIbu(e.target.value)} className={inputClass} placeholder="Nama lengkap ibu" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Umur</label>
                            <input type="text" value={umurIbu} onChange={(e) => setUmurIbu(e.target.value)} className={inputClass} placeholder="Tahun" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Agama</label>
                            <input type="text" value={agamaIbu} onChange={(e) => setAgamaIbu(e.target.value)} className={inputClass} placeholder="Islam" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Ayah */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-semibold">👨 Data Ayah</h2>
                        <p className="text-blue-100 text-xs">Data ayah kandung (suami)</p>
                    </div>
                    <ModeToggle mode={ayahMode} onChange={(m) => { setAyahMode(m); setSelectedAyah(null) }} />
                </div>
                <div className="p-5 space-y-4">
                    {ayahMode === 'search' && (
                        <WargaSearchSelect onSelect={handleAyahSelect} selectedWarga={selectedAyah}
                            onClear={() => setSelectedAyah(null)} />
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nama Ayah *</label>
                            <input type="text" value={namaAyah} onChange={(e) => setNamaAyah(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Umur</label>
                            <input type="text" value={umurAyah} onChange={(e) => setUmurAyah(e.target.value)} className={inputClass} placeholder="Tahun" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Agama</label>
                            <input type="text" value={agamaAyah} onChange={(e) => setAgamaAyah(e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Pekerjaan</label>
                            <input type="text" value={pekerjaanAyah} onChange={(e) => setPekerjaanAyah(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Warga Negara</label>
                            <input type="text" value={wargaNegaraAyah} onChange={(e) => setWargaNegaraAyah(e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Alamat Lengkap</label>
                        <textarea value={alamatAyah} onChange={(e) => setAlamatAyah(e.target.value)} rows={2}
                            className={`${inputClass} resize-none`} placeholder="Kp. ... RT. ... RW. ...&#10;Desa Kemang Kec. Bojongpicung Kab. Cianjur" />
                    </div>
                </div>
            </div>

            {/* Pelapor & Penutup */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pelapor & Isi Surat</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nama Pelapor</label>
                        <input type="text" value={namaPelapor} onChange={(e) => setNamaPelapor(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hubungan dengan Anak</label>
                        <select value={hubunganPelapor} onChange={(e) => setHubunganPelapor(e.target.value)} className={`${inputClass} bg-white`}>
                            {HUBUNGAN_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Paragraf Penutup</label>
                    <textarea value={paragrafPenutup} onChange={(e) => setParagrafPenutup(e.target.value)} rows={2}
                        className={`${inputClass} resize-none`} />
                </div>
            </div>

            {/* TTD */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Penandatangan & Tanggal</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Penandatangan</label>
                        <select value={penandatangan} onChange={(e) => setPenandatangan(e.target.value as Penandatangan)}
                            className={`${inputClass} bg-white`}>
                            <option value="kades">Kepala Desa {pengaturan?.nama_kades ? `(${pengaturan.nama_kades})` : ''}</option>
                            <option value="sekdes">A.N Kepala Desa — Sekdes {pengaturan?.nama_sekdes ? `(${pengaturan.nama_sekdes})` : ''}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Surat</label>
                        <input type="date" value={tanggalSurat} onChange={(e) => setTanggalSurat(e.target.value)} className={inputClass} />
                    </div>
                </div>
            </div>

            {/* 3 Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={handleSimpan} disabled={generating}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50">
                    {generating ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Save size={20} />}
                    Simpan Arsip
                </button>
                <button onClick={handlePrint} disabled={generating}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50">
                    <Eye size={20} /> Preview & Print
                </button>
                <button onClick={handleDownload} disabled={generating}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50">
                    <Download size={20} /> Download PDF
                </button>
            </div>
        </div>
    )
}
