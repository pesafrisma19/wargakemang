'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Warga, Pengaturan, Penandatangan } from '@/types/database'
import WargaSearchSelect from '@/components/WargaSearchSelect'
import AddressForm, { AddressData, formatAddress } from '@/components/AddressForm'
import { ArrowLeft, Save, Check, AlertCircle, Search, Eye, UserPlus, Download } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type InputMode = 'search' | 'manual'

export default function SuratNAPage() {
    const supabase = createClient()
    const router = useRouter()
    
    const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null)
    const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [savedId, setSavedId] = useState<number | null>(null)
    const [error, setError] = useState('')
    const [inputMode, setInputMode] = useState<InputMode>('search')

    // Basic fields
    const [nomorSurat, setNomorSurat] = useState('')
    const [penandatangan, setPenandatangan] = useState<Penandatangan>('kades')
    const [tanggalSurat, setTanggalSurat] = useState(new Date().toISOString().split('T')[0])
    
    // Status Pernikahan & Kelamin
    const [statusPernikahan, setStatusPernikahan] = useState('Jejaka') // default
    const [jenisKelamin, setJenisKelamin] = useState('L') // default L

    // Pemohon (Warga) fields - for manual input or prefill
    const [pemohonNama, setPemohonNama] = useState('')
    const [pemohonNik, setPemohonNik] = useState('')
    const [pemohonTempatLahir, setPemohonTempatLahir] = useState('')
    const [pemohonTanggalLahir, setPemohonTanggalLahir] = useState('')
    const [pemohonKewarganegaraan, setPemohonKewarganegaraan] = useState('Indonesia')
    const [pemohonAgama, setPemohonAgama] = useState('Islam')
    const [pemohonPekerjaan, setPemohonPekerjaan] = useState('')
    const initialAddress: AddressData = { alamat: '', rt: '', rw: '', desa: '', kecamatan: '', kabupaten: '' }
    const [pemohonAlamat, setPemohonAlamat] = useState<AddressData>(initialAddress)

    // Data Pasangan
    const [pasanganNama, setPasanganNama] = useState('')
    const [pasanganBinBinti, setPasanganBinBinti] = useState('')
    const [pasanganNik, setPasanganNik] = useState('')
    const [pasanganTempatLahir, setPasanganTempatLahir] = useState('')
    const [pasanganTanggalLahir, setPasanganTanggalLahir] = useState('')
    const [pasanganAgama, setPasanganAgama] = useState('Islam')
    const [pasanganPekerjaan, setPasanganPekerjaan] = useState('')
    const [pasanganAlamat, setPasanganAlamat] = useState<AddressData>(initialAddress)
    const [pasanganKewarganegaraan, setPasanganKewarganegaraan] = useState('Indonesia')

    // Data Ayah
    const [ayahNama, setAyahNama] = useState('')
    const [ayahNik, setAyahNik] = useState('')
    const [ayahTempatLahir, setAyahTempatLahir] = useState('')
    const [ayahTanggalLahir, setAyahTanggalLahir] = useState('')
    const [ayahAgama, setAyahAgama] = useState('Islam')
    const [ayahPekerjaan, setAyahPekerjaan] = useState('')
    const [ayahAlamat, setAyahAlamat] = useState<AddressData>(initialAddress)

    // Data Ibu
    const [ibuNama, setIbuNama] = useState('')
    const [ibuNik, setIbuNik] = useState('')
    const [ibuTempatLahir, setIbuTempatLahir] = useState('')
    const [ibuTanggalLahir, setIbuTanggalLahir] = useState('')
    const [ibuAgama, setIbuAgama] = useState('Islam')
    const [ibuPekerjaan, setIbuPekerjaan] = useState('')
    const [ibuAlamat, setIbuAlamat] = useState<AddressData>(initialAddress)

    // Data N6 (Kematian)
    const [cetakN6, setCetakN6] = useState(false)
    const [mantanNama, setMantanNama] = useState('')
    const [mantanBinBinti, setMantanBinBinti] = useState('')
    const [mantanNik, setMantanNik] = useState('')
    const [mantanTempatLahir, setMantanTempatLahir] = useState('')
    const [mantanTanggalLahir, setMantanTanggalLahir] = useState('')
    const [mantanAgama, setMantanAgama] = useState('Islam')
    const [mantanPekerjaan, setMantanPekerjaan] = useState('')
    const [mantanAlamat, setMantanAlamat] = useState<AddressData>(initialAddress)
    const [mantanTglMeninggal, setMantanTglMeninggal] = useState('')
    const [mantanTempatMeninggal, setMantanTempatMeninggal] = useState('')

    useEffect(() => {
        fetchPengaturan()
        generateNomorSurat()
    }, [])

    const fetchPengaturan = async () => {
        const { data } = await supabase.from('pengaturan').select('*').eq('id', 1).single()
        setPengaturan(data)
        setLoading(false)
    }

    const generateNomorSurat = async () => {
        const year = new Date().getFullYear()
        const { count } = await supabase
            .from('surat')
            .select('*', { count: 'exact', head: true })
            .eq('jenis_surat', 'na')
            .gte('created_at', `${year}-01-01`)
        const nextNum = (count || 0) + 1
        setNomorSurat(`474.2/ ${nextNum} /Pemdes / ${year}`)
    }

    const fetchKeluargaData = async (no_kk: string) => {
        if (!no_kk) return;
        const { data } = await supabase.from('warga').select('*').eq('no_kk', no_kk)
        
        if (data && data.length > 0) {
            const ayah = data.find(w => w.hubungan_keluarga === 'KEPALA KELUARGA')
            const ibu = data.find(w => w.hubungan_keluarga === 'ISTRI')

            if (ayah) {
                setAyahNik(ayah.nik)
                setAyahTempatLahir(ayah.tempat_lahir)
                setAyahTanggalLahir(ayah.tanggal_lahir)
                setAyahAgama(ayah.agama)
                setAyahPekerjaan(ayah.pekerjaan)
                setAyahAlamat({ alamat: ayah.alamat || '', rt: ayah.rt || '', rw: ayah.rw || '', desa: ayah.desa || '', kecamatan: ayah.kecamatan || '', kabupaten: ayah.kabupaten || '' })
            }
            if (ibu) {
                setIbuNik(ibu.nik)
                setIbuTempatLahir(ibu.tempat_lahir)
                setIbuTanggalLahir(ibu.tanggal_lahir)
                setIbuAgama(ibu.agama)
                setIbuPekerjaan(ibu.pekerjaan)
                setIbuAlamat({ alamat: ibu.alamat || '', rt: ibu.rt || '', rw: ibu.rw || '', desa: ibu.desa || '', kecamatan: ibu.kecamatan || '', kabupaten: ibu.kabupaten || '' })
            }
        }
    }

    const handleSwitchMode = (mode: InputMode) => {
        setInputMode(mode)
        if (mode === 'manual') {
            setSelectedWarga(null)
        }
    }

    const handleWargaSelect = async (warga: Warga) => {
        setSelectedWarga(warga)
        setJenisKelamin(warga.jenis_kelamin)
        
        // Prefill Pemohon
        setPemohonNama(warga.nama)
        setPemohonNik(warga.nik)
        setPemohonTempatLahir(warga.tempat_lahir)
        setPemohonTanggalLahir(warga.tanggal_lahir)
        setPemohonKewarganegaraan(warga.kewarganegaraan === 'WNI' ? 'Indonesia' : (warga.kewarganegaraan || 'Indonesia'))
        setPemohonAgama(warga.agama)
        setPemohonPekerjaan(warga.pekerjaan)
        setPemohonAlamat({ alamat: warga.alamat || '', rt: warga.rt || '', rw: warga.rw || '', desa: warga.desa || '', kecamatan: warga.kecamatan || '', kabupaten: warga.kabupaten || '' })

        // Smart Gender & Status Logic
        let status = 'Jejaka/Perawan'
        if (warga.jenis_kelamin === 'L') {
            if (warga.status_kawin === 'BELUM KAWIN') status = 'Jejaka'
            else if (warga.status_kawin === 'CERAI MATI' || warga.status_kawin === 'CERAI HIDUP') status = 'Duda'
        } else {
            if (warga.status_kawin === 'BELUM KAWIN') status = 'Perawan'
            else if (warga.status_kawin === 'CERAI MATI' || warga.status_kawin === 'CERAI HIDUP') status = 'Janda'
        }
        setStatusPernikahan(status)

        // Show N6 only if Cerai Mati
        if (warga.status_kawin === 'CERAI MATI') {
            setCetakN6(true)
        } else {
            setCetakN6(false)
        }

        // Prefill parent names
        setAyahNama(warga.nama_ayah || '')
        setIbuNama(warga.nama_ibu || '')

        // Auto-fill from KK if possible
        if (warga.no_kk && warga.hubungan_keluarga === 'ANAK') {
            await fetchKeluargaData(warga.no_kk)
        }
    }

    const validateForm = (): boolean => {
        if (!pengaturan) { setError('Pengaturan desa belum diisi.'); return false }
        if (inputMode === 'search' && !selectedWarga) { setError('Warga (Pemohon) belum dipilih.'); return false }
        if (inputMode === 'manual' && (!pemohonNama || !pemohonNik)) { setError('Nama dan NIK Pemohon wajib diisi.'); return false }
        if (!pasanganNama || !ayahNama || !ibuNama) { setError('Nama pasangan, ayah, dan ibu wajib diisi.'); return false }
        if (cetakN6 && (!mantanNama || !mantanTglMeninggal)) { setError('Data mantan yang meninggal wajib diisi untuk cetak N6.'); return false }
        setError(''); return true
    }

    const buildData = () => {
        return {
            nomorSurat,
            statusPernikahan,
            cetakN6,
            jenisKelamin,
            pemohon: {
                nama: pemohonNama, nik: pemohonNik, tempatLahir: pemohonTempatLahir, 
                tanggalLahir: pemohonTanggalLahir, agama: pemohonAgama, pekerjaan: pemohonPekerjaan, 
                alamat: formatAddress(pemohonAlamat), kewarganegaraan: pemohonKewarganegaraan
            },
            pasangan: {
                nama: pasanganNama, binBinti: pasanganBinBinti, nik: pasanganNik, 
                tempatLahir: pasanganTempatLahir, tanggalLahir: pasanganTanggalLahir, 
                agama: pasanganAgama, pekerjaan: pasanganPekerjaan, alamat: formatAddress(pasanganAlamat), 
                kewarganegaraan: pasanganKewarganegaraan
            },
            ayah: {
                nama: ayahNama, nik: ayahNik, tempatLahir: ayahTempatLahir, 
                tanggalLahir: ayahTanggalLahir, agama: ayahAgama, pekerjaan: ayahPekerjaan, alamat: formatAddress(ayahAlamat)
            },
            ibu: {
                nama: ibuNama, nik: ibuNik, tempatLahir: ibuTempatLahir, 
                tanggalLahir: ibuTanggalLahir, agama: ibuAgama, pekerjaan: ibuPekerjaan, alamat: formatAddress(ibuAlamat)
            },
            mantan: cetakN6 ? {
                nama: mantanNama, binBinti: mantanBinBinti, nik: mantanNik, 
                tempatLahir: mantanTempatLahir, tanggalLahir: mantanTanggalLahir, 
                agama: mantanAgama, pekerjaan: mantanPekerjaan, alamat: formatAddress(mantanAlamat), 
                tglMeninggal: mantanTglMeninggal, tempatMeninggal: mantanTempatMeninggal
            } : null,
            penandatangan,
            tanggalSurat
        }
    }

    const handleSimpan = async () => {
        if (!validateForm()) return
        setGenerating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            
            const { data, error: insertError } = await supabase.from('surat').insert({
                nomor_surat: nomorSurat, 
                jenis_surat: 'na',
                warga_id: selectedWarga?.id || null,
                warga_nama: pemohonNama, 
                warga_nik: pemohonNik,
                data_surat: buildData(), 
                dibuat_oleh: user?.id,
            }).select().single()
            
            if (insertError) throw insertError

            setSavedId(data.id)
            setTimeout(() => setSavedId(null), 5000)
        } catch (err) { 
            console.error(err)
            setError('Gagal menyimpan ke arsip.') 
        }
        setGenerating(false)
    }

    const handlePrint = () => {
        if (!savedId) {
            setError('Silakan Simpan Arsip terlebih dahulu sebelum mencetak!')
            return
        }
        window.open(`/dashboard/surat/na/print/${savedId}`, '_blank')
    }

    if (loading) {
        return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent"></div></div>)
    }

    const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-800"
    const showDataForm = inputMode === 'manual' || selectedWarga || pemohonNama

    return (
        <div className="space-y-6 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/surat" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ArrowLeft size={22} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">💍</span>
                        Surat Keterangan Nikah (NA)
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Model N1, N2, N4, N6</p>
                </div>
            </div>

            {savedId && (
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                    <div className="flex items-center gap-2">
                        <Check size={18} />
                        <span className="text-sm font-medium">Surat berhasil disimpan ke arsip!</span>
                    </div>
                </div>
            )}
            
            {error && (<div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700"><AlertCircle size={18} /><span className="text-sm font-medium">{error}</span></div>)}

            {/* Nomor Surat & Pilih Warga */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
                <div>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Nomor Surat (N1)</h2>
                    <input type="text" value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value)} className={`${inputCls} font-mono sm:max-w-xs`} />
                </div>
                
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Data Pemohon (Warga)</h2>
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button onClick={() => handleSwitchMode('search')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${inputMode === 'search' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Search size={14} /> Cari Database
                            </button>
                            <button onClick={() => handleSwitchMode('manual')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${inputMode === 'manual' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <UserPlus size={14} /> Input Manual
                            </button>
                        </div>
                    </div>
                    {inputMode === 'search' && (<WargaSearchSelect onSelect={handleWargaSelect} selectedWarga={selectedWarga} onClear={() => setSelectedWarga(null)} />)}
                    {inputMode === 'manual' && !selectedWarga && (<p className="text-sm text-gray-500 bg-rose-50 px-3 py-2 rounded-lg">💡 Mode input manual — isi data secara lengkap di bawah.</p>)}
                </div>
                
                {inputMode === 'search' && selectedWarga && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-rose-500"><Eye size={20}/></div>
                        <div>
                            <p className="text-sm text-gray-800 font-medium">Sistem Cerdas Aktif</p>
                            <p className="text-xs text-gray-600 mt-1">Pemohon terdeteksi sebagai <b className="text-gray-900">{jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</b> dengan status <b className="text-gray-900">{selectedWarga.status_kawin}</b>.</p>
                            <p className="text-xs text-rose-700 mt-1">Surat N1 akan dicetak dengan status: <b className="uppercase">{statusPernikahan}</b></p>
                        </div>
                    </div>
                )}
            </div>

            {showDataForm && (
                <>
                    {/* Data Pemohon (Editable) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-gray-700 to-gray-800">
                            <h2 className="text-white font-semibold">Data Pemohon</h2>
                            <p className="text-gray-300 text-sm">{inputMode === 'search' ? 'Data otomatis terisi, bisa diedit jika perlu' : 'Isi data pemohon secara manual'}</p>
                        </div>
                        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label><input type="text" value={pemohonNama} onChange={(e) => setPemohonNama(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">NIK</label><input type="text" value={pemohonNik} onChange={(e) => setPemohonNik(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Kewarganegaraan</label><input type="text" value={pemohonKewarganegaraan} onChange={(e) => setPemohonKewarganegaraan(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Tempat Lahir</label><input type="text" value={pemohonTempatLahir} onChange={(e) => setPemohonTempatLahir(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Lahir</label><input type="date" value={pemohonTanggalLahir} onChange={(e) => setPemohonTanggalLahir(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Agama</label><input type="text" value={pemohonAgama} onChange={(e) => setPemohonAgama(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Pekerjaan</label><input type="text" value={pemohonPekerjaan} onChange={(e) => setPemohonPekerjaan(e.target.value)} className={inputCls} /></div>
                            
                            {inputMode === 'manual' && (
                                <>
                                    <div><label className="block text-sm font-medium text-gray-600 mb-1">Jenis Kelamin</label>
                                        <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className={`${inputCls} bg-white`}>
                                            <option value="L">Laki-laki</option>
                                            <option value="P">Perempuan</option>
                                        </select>
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-600 mb-1">Status Pernikahan (Di Surat)</label>
                                        <input type="text" value={statusPernikahan} onChange={(e) => setStatusPernikahan(e.target.value)} placeholder="Contoh: Jejaka / Perawan / Duda / Janda" className={inputCls} />
                                    </div>
                                </>
                            )}
                            
                            <div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Pemohon" value={pemohonAlamat} onChange={setPemohonAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>
                        </div>
                    </div>

                    {/* Data Calon Pasangan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-rose-500 to-pink-600">
                            <h2 className="text-white font-semibold">Data Calon {jenisKelamin === 'L' ? 'Istri' : 'Suami'}</h2>
                            <p className="text-rose-100 text-sm">Informasi pasangan yang akan dinikahi</p>
                        </div>
                        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label><input type="text" value={pasanganNama} onChange={(e) => setPasanganNama(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Bin / Binti</label><input type="text" value={pasanganBinBinti} onChange={(e) => setPasanganBinBinti(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">NIK</label><input type="text" value={pasanganNik} onChange={(e) => setPasanganNik(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Kewarganegaraan</label><input type="text" value={pasanganKewarganegaraan} onChange={(e) => setPasanganKewarganegaraan(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Tempat Lahir</label><input type="text" value={pasanganTempatLahir} onChange={(e) => setPasanganTempatLahir(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Lahir</label><input type="date" value={pasanganTanggalLahir} onChange={(e) => setPasanganTanggalLahir(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Agama</label><input type="text" value={pasanganAgama} onChange={(e) => setPasanganAgama(e.target.value)} className={inputCls} /></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Pekerjaan</label><input type="text" value={pasanganPekerjaan} onChange={(e) => setPasanganPekerjaan(e.target.value)} className={inputCls} /></div>
                            <div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Pasangan" value={pasanganAlamat} onChange={setPasanganAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>
                        </div>
                    </div>

                    {/* Data Orang Tua */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                            <h2 className="text-white font-semibold">Data Orang Tua Pemohon (Model N4)</h2>
                            <p className="text-blue-100 text-sm">Otomatis terisi jika satu KK, atau isi manual</p>
                        </div>
                        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                            {/* Ayah */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Data Ayah</h3>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Nama Ayah</label><input type="text" value={ayahNama} onChange={(e) => setAyahNama(e.target.value)} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">NIK Ayah</label><input type="text" value={ayahNik} onChange={(e) => setAyahNik(e.target.value)} className={inputCls} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="block text-sm font-medium text-gray-600 mb-1">Tmpt Lahir</label><input type="text" value={ayahTempatLahir} onChange={(e) => setAyahTempatLahir(e.target.value)} className={inputCls} /></div>
                                    <div><label className="block text-sm font-medium text-gray-600 mb-1">Tgl Lahir</label><input type="date" value={ayahTanggalLahir} onChange={(e) => setAyahTanggalLahir(e.target.value)} className={inputCls} /></div>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Agama</label><input type="text" value={ayahAgama} onChange={(e) => setAyahAgama(e.target.value)} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Pekerjaan</label><input type="text" value={ayahPekerjaan} onChange={(e) => setAyahPekerjaan(e.target.value)} className={inputCls} /></div>
                                <div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Ayah" value={ayahAlamat} onChange={setAyahAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>
                            </div>
                            
                            {/* Ibu */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">Data Ibu</h3>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Nama Ibu</label><input type="text" value={ibuNama} onChange={(e) => setIbuNama(e.target.value)} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">NIK Ibu</label><input type="text" value={ibuNik} onChange={(e) => setIbuNik(e.target.value)} className={inputCls} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="block text-sm font-medium text-gray-600 mb-1">Tmpt Lahir</label><input type="text" value={ibuTempatLahir} onChange={(e) => setIbuTempatLahir(e.target.value)} className={inputCls} /></div>
                                    <div><label className="block text-sm font-medium text-gray-600 mb-1">Tgl Lahir</label><input type="date" value={ibuTanggalLahir} onChange={(e) => setIbuTanggalLahir(e.target.value)} className={inputCls} /></div>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Agama</label><input type="text" value={ibuAgama} onChange={(e) => setIbuAgama(e.target.value)} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Pekerjaan</label><input type="text" value={ibuPekerjaan} onChange={(e) => setIbuPekerjaan(e.target.value)} className={inputCls} /></div>
                                <div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Ibu" value={ibuAlamat} onChange={setIbuAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Data Kematian N6 */}
                    <div className={`bg-white rounded-2xl shadow-sm border ${cetakN6 ? 'border-amber-200' : 'border-gray-100'} overflow-hidden transition-all`}>
                        <div className={`px-5 sm:px-6 py-4 flex items-center justify-between ${cetakN6 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gray-50'}`}>
                            <div>
                                <h2 className={`font-semibold ${cetakN6 ? 'text-white' : 'text-gray-600'}`}>Cetak Model N6 (Kematian Suami/Istri)</h2>
                                {cetakN6 && <p className="text-amber-100 text-sm">Status terdeteksi Cerai Mati, lengkapi data mantan yang meninggal</p>}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={cetakN6} onChange={(e) => setCetakN6(e.target.checked)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>
                        
                        {cetakN6 && (
                            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-amber-100 bg-amber-50/30">
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Nama Almarhum/ah</label><input type="text" value={mantanNama} onChange={(e) => setMantanNama(e.target.value)} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Bin / Binti</label><input type="text" value={mantanBinBinti} onChange={(e) => setMantanBinBinti(e.target.value)} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">NIK</label><input type="text" value={mantanNik} onChange={(e) => setMantanNik(e.target.value)} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Agama</label><input type="text" value={mantanAgama} onChange={(e) => setMantanAgama(e.target.value)} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Tempat Lahir</label><input type="text" value={mantanTempatLahir} onChange={(e) => setMantanTempatLahir(e.target.value)} className={inputCls} /></div>
                                <div><label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Lahir</label><input type="date" value={mantanTanggalLahir} onChange={(e) => setMantanTanggalLahir(e.target.value)} className={inputCls} /></div>
                                <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-600 mb-1">Pekerjaan</label><input type="text" value={mantanPekerjaan} onChange={(e) => setMantanPekerjaan(e.target.value)} className={inputCls} /></div>
                                <div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Terakhir" value={mantanAlamat} onChange={setMantanAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>
                                
                                <div className="sm:col-span-2 mt-2 border-t border-amber-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold text-amber-800 mb-1">Meninggal Pada Tanggal</label><input type="date" value={mantanTglMeninggal} onChange={(e) => setMantanTglMeninggal(e.target.value)} className={`${inputCls} border-amber-300 bg-amber-50`} /></div>
                                    <div><label className="block text-sm font-bold text-amber-800 mb-1">Meninggal Di (Tempat)</label><input type="text" value={mantanTempatMeninggal} onChange={(e) => setMantanTempatMeninggal(e.target.value)} placeholder="Contoh: RSUD Sayang Cianjur" className={`${inputCls} border-amber-300 bg-amber-50`} /></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Penandatangan */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Penandatangan & Tanggal</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Penandatangan</label>
                                <select value={penandatangan} onChange={(e) => setPenandatangan(e.target.value as Penandatangan)} className={`${inputCls} bg-white`}>
                                    <option value="kades">Kepala Desa {pengaturan?.nama_kades ? `(${pengaturan.nama_kades})` : ''}</option>
                                    <option value="sekdes">A.N Kepala Desa — Sekdes {pengaturan?.nama_sekdes ? `(${pengaturan.nama_sekdes})` : ''}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Surat</label>
                                <input type="date" value={tanggalSurat} onChange={(e) => setTanggalSurat(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button onClick={handleSimpan} disabled={generating}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50">
                            {generating ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Save size={20} />}
                            Simpan Arsip
                        </button>
                        <button onClick={handlePrint} disabled={!savedId}
                            className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 font-medium rounded-xl transition-all ${savedId ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-lg hover:shadow-rose-500/30' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            <Eye size={20} /> Cetak (N1, N2, N4, N6)
                        </button>
                        <button disabled={true}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white border-2 border-gray-200 text-gray-400 font-medium rounded-xl cursor-not-allowed">
                            <Download size={20} /> PDF via Print
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
