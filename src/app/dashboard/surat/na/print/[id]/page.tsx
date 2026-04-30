'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Pengaturan } from '@/types/database'
import { Loader2 } from 'lucide-react'

// Utilities for formatting
const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export default function SuratNAPrint() {
    const { id } = useParams()
    const supabase = createClient()
    const [surat, setSurat] = useState<any>(null)
    const [pengaturan, setPengaturan] = useState<Pengaturan | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data: pengaturanData } = await supabase.from('pengaturan').select('*').eq('id', 1).single()
            setPengaturan(pengaturanData)

            const { data: suratData } = await supabase.from('surat').select('*, warga(*)').eq('id', id).single()
            setSurat(suratData)

            setLoading(false)

            // Auto print after a short delay for images/fonts to load
            if (suratData) {
                setTimeout(() => {
                    window.print()
                }, 1000)
            }
        }
        if (id) fetchData()
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
                    <p className="text-gray-600 font-medium">Menyiapkan Dokumen Print...</p>
                </div>
            </div>
        )
    }

    if (!surat || !pengaturan) {
        return <div className="p-8 text-center text-red-500">Data surat tidak ditemukan.</div>
    }

    const data = surat.data_surat
    // No longer strictly rely on `warga` relation since it can be manual input
    const pemohon = data.pemohon
    const isLaki = data.jenisKelamin === 'L'

    // Helper components
    const LampiranHeader = ({ no, judul, model }: { no: string, judul: string, model: string }) => (
        <div className="text-[12px] leading-tight mb-4">
            <p>LAMPIRAN {no}</p>
            <p>KEPUTUSAN DIREKTUR JENDERAL BIMBINGAN MASYARAKAT ISLAM</p>
            <p>NOMOR 473 TAHUN 2020</p>
            <p>TENTANG</p>
            <p>PETUNJUK TEKNIS PELAKSANAAN PENCATATAN PERNIKAHAN</p>
            <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
                {judul}
            </div>
            <div className="text-right">{model}</div>
        </div>
    )

    const FieldRow = ({ label, value, index, nested = false }: { label: string, value: string, index?: string, nested?: boolean }) => (
        <div className={`flex ${nested ? 'ml-4' : ''} mb-1`}>
            <div className="w-[180px] flex">
                {index && <span className="w-5">{index}.</span>}
                <span className="flex-1">{label}</span>
            </div>
            <div className="w-4">:</div>
            <div className="flex-1 font-bold">{value || '-'}</div>
        </div>
    )

    // Derived logic
    const namaKades = pengaturan.nama_kades?.toUpperCase() || ''

    return (
        <div className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white font-serif text-[14px] text-black">
            <style jsx global>{`
                @media print {
                    @page { size: 215mm 330mm; margin: 1cm 1cm 1cm 1.5cm; }
                    body { background-color: white; -webkit-print-color-adjust: exact; }
                    .page-break { break-after: page; page-break-after: always; }
                    .f4-page:last-child { break-after: auto; page-break-after: auto; }
                    .no-print { display: none; }
                }
                .f4-page {
                    width: 215mm;
                    min-height: 330mm;
                    padding: 10mm 10mm 10mm 15mm;
                    margin: 0 auto 20px auto;
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    position: relative;
                }
                @media print {
                    .f4-page {
                        box-shadow: none;
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        min-height: auto;
                    }
                }
            `}</style>

            <div className="fixed top-4 right-4 no-print flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700">Print</button>
                <button onClick={() => window.close()} className="px-4 py-2 bg-gray-600 text-white rounded shadow hover:bg-gray-700">Tutup</button>
            </div>

            {/* ==============================================
                MODEL N1 - PENGANTAR NIKAH
            =============================================== */}
            <div className="f4-page page-break flex flex-col">
                <LampiranHeader no="IV" judul="FORMULIR SURAT PENGANTAR NIKAH" model="Model N1" />
                
                <div className="mb-4 font-bold">
                    <div className="flex"><span className="w-[200px]">KANTOR DESA/KELURAHAN</span><span>: {pengaturan.nama_desa?.toUpperCase()}</span></div>
                    <div className="flex"><span className="w-[200px]">KECAMATAN</span><span>: {pengaturan.nama_kecamatan?.toUpperCase()}</span></div>
                    <div className="flex"><span className="w-[200px]">KABUPATEN/KOTA</span><span>: {pengaturan.nama_kabupaten?.toUpperCase()}</span></div>
                </div>

                <div className="text-center font-bold mb-4">
                    <p className="underline underline-offset-2">FORMULIR PENGANTAR NIKAH</p>
                    <p className="font-normal">Nomor : {data.nomorSurat}</p>
                </div>

                <p className="mb-2">Yang bertanda tangan di bawah ini menerangkan dengan sesungguhnya bahwa :</p>
                
                <div className="mb-2">
                    <FieldRow index="1" label="Nama" value={pemohon?.nama} />
                    <FieldRow index="2" label="Nomor Induk Kependudukan (NIK)" value={pemohon?.nik} />
                    <FieldRow index="3" label="Jenis Kelamin" value={isLaki ? 'Laki-laki' : 'Perempuan'} />
                    <FieldRow index="4" label="Tempat dan tanggal Lahir" value={`${pemohon?.tempatLahir}, ${formatDate(pemohon?.tanggalLahir)}`} />
                    <FieldRow index="5" label="Kewarganegaraan" value={pemohon?.kewarganegaraan === 'WNI' ? 'Indonesia' : pemohon?.kewarganegaraan} />
                    <FieldRow index="6" label="Agama" value={pemohon?.agama} />
                    <FieldRow index="7" label="Pekerjaan" value={pemohon?.pekerjaan} />
                    <FieldRow index="8" label="Alamat" value={pemohon?.alamat} />
                    
                    <div className="flex mb-1">
                        <div className="w-[180px] flex">
                            <span className="w-5">9.</span><span className="flex-1">Status Pernikahan</span>
                        </div>
                        <div className="w-4"></div>
                        <div className="flex-1"></div>
                    </div>
                    
                    <FieldRow nested label="a. Laki-laki : Jejaka, duda, atau beristri ke ......" value={isLaki ? data.statusPernikahan : ''} />
                    <FieldRow nested label="b. Perempuan : Perawan, Janda" value={!isLaki ? data.statusPernikahan : ''} />
                </div>

                <p className="mt-2 mb-2">Adalah benar anak dari pernikahan seorang pria :</p>
                <div className="mb-2">
                    <FieldRow index="1" label="Nama lengkap dan alias" value={data.ayah?.nama} />
                    <FieldRow index="2" label="Nomor Induk Kependudukan (NIK)" value={data.ayah?.nik} />
                    <FieldRow index="3" label="Tempat dan tanggal Lahir" value={`${data.ayah?.tempatLahir}, ${formatDate(data.ayah?.tanggalLahir)}`} />
                    <FieldRow index="4" label="Kewarganegaraan" value="Indonesia" />
                    <FieldRow index="5" label="Agama" value={data.ayah?.agama} />
                    <FieldRow index="6" label="Pekerjaan" value={data.ayah?.pekerjaan} />
                    <FieldRow index="7" label="Alamat" value={data.ayah?.alamat} />
                </div>

                <p className="mt-2 mb-2">dengan seorang wanita :</p>
                <div className="mb-4">
                    <FieldRow index="1" label="Nama lengkap dan alias" value={data.ibu?.nama} />
                    <FieldRow index="2" label="Nomor Induk Kependudukan (NIK)" value={data.ibu?.nik} />
                    <FieldRow index="3" label="Tempat dan tanggal Lahir" value={`${data.ibu?.tempatLahir}, ${formatDate(data.ibu?.tanggalLahir)}`} />
                    <FieldRow index="4" label="Kewarganegaraan" value="Indonesia" />
                    <FieldRow index="5" label="Agama" value={data.ibu?.agama} />
                    <FieldRow index="6" label="Pekerjaan" value={data.ibu?.pekerjaan} />
                    <FieldRow index="7" label="Alamat" value={data.ibu?.alamat} />
                </div>

                <p className="mb-8">Demikian, Surat pengantar ini dibuat dengan mengingat sumpah jabatan dan untuk dipergunakan sebagaimana mestinya.</p>

                <div className="flex justify-end mt-auto pt-8">
                    <div className="text-center w-[250px]">
                        <p>{pengaturan.nama_desa}, {formatDate(data.tanggalSurat)}</p>
                        <p className="font-bold">KEPALA DESA {pengaturan.nama_desa?.toUpperCase()}</p>
                        <div className="h-24"></div>
                        <p className="font-bold underline underline-offset-4">{namaKades}</p>
                    </div>
                </div>
            </div>

            {/* ==============================================
                MODEL N2 - PERMOHONAN KEHENDAK NIKAH
            =============================================== */}
            <div className="f4-page page-break flex flex-col">
                <LampiranHeader no="VI" judul="FORMULIR PERMOHONAN KEHENDAK NIKAH" model="Model N2" />
                
                <div className="flex justify-between mb-6">
                    <div>Perihal : Permohonan kehendak nikah</div>
                    <div>{pengaturan.nama_desa}, {formatDate(data.tanggalSurat)}</div>
                </div>

                <div className="mb-4">
                    <p>Kepada Yth.</p>
                    <p>Kepala KUA Kecamatan/PPN LN</p>
                    <p>di {pengaturan.nama_kecamatan}</p>
                </div>

                <p className="mb-2">Dengan hormat, kami mengajukan permohonan kehendak nikah untuk atas nama :</p>
                <div className="mb-4">
                    <FieldRow label="Calon suami" value={isLaki ? pemohon?.nama : data.pasangan?.nama} />
                    <FieldRow label="Calon istri" value={!isLaki ? pemohon?.nama : data.pasangan?.nama} />
                    <FieldRow label="Hari/Tanggal/Jam" value=".................................................." />
                    <FieldRow label="Tempat akad nikah" value=".................................................." />
                </div>

                <p className="mb-2">Bersama ini kami sampaikan surat-surat yang diperlukan untuk diperiksa sebagai berikut :</p>
                <div className="mb-6 ml-4 space-y-1">
                    <p>1. Surat pengantar nikah dari Desa/Kelurahan</p>
                    <p>2. Persetujuan calon mempelai</p>
                    <p>3. Fotocopi KTP</p>
                    <p>4. Fotocopi Akte Kelahiran</p>
                    <p>5. Fotocopi Kartu Keluarga</p>
                    <p>6. Paspoto 2x3 = 3 lembar berlatar belakang biru</p>
                    <p>7. ..................................................</p>
                    <p>8. ..................................................</p>
                </div>

                <p className="mb-12">Demikian permohonan ini kami sampaikan, kiranya dapat diperiksa, dihadiri, dan dicatat sesuai dengan ketentuan peraturan perundang-undangan.</p>

                <div className="flex justify-between">
                    <div className="w-[300px]">
                        <p>Diterima tanggal : ......................................</p>
                        <p>Yang menerima,</p>
                        <p>Kepala KUA/PPN Luar Negeri</p>
                        <div className="h-24"></div>
                        <p>......................................................................</p>
                    </div>
                    <div className="w-[250px] text-center">
                        <p>Wasalam</p>
                        <p>Pemohon</p>
                        <div className="h-24"></div>
                        <p className="font-bold underline">{pemohon?.nama}</p>
                    </div>
                </div>
            </div>

            {/* ==============================================
                MODEL N4 - PERSETUJUAN CALON PENGANTIN
            =============================================== */}
            <div className="f4-page page-break flex flex-col">
                <LampiranHeader no="VI" judul="FORMULIR PERSETUJUAN CALON PENGANTIN" model="Model N4" />
                
                <div className="text-center font-bold underline mb-4">SURAT PERSETUJUAN PENGANTIN</div>
                
                <p className="mb-2">Yang bertanda tangan di bawah ini :</p>
                
                <p className="font-bold mb-1">A. Calon Suami</p>
                <div className="mb-4">
                    <FieldRow index="1" label="Nama lengkap dan alias" value={isLaki ? pemohon?.nama : data.pasangan?.nama} />
                    <FieldRow index="2" label="Bin" value={isLaki ? data.ayah?.nama : data.pasangan?.binBinti} />
                    <FieldRow index="3" label="Nomor Induk Kependudukan (NIK)" value={isLaki ? pemohon?.nik : data.pasangan?.nik} />
                    <FieldRow index="4" label="Tempat dan tanggal Lahir" value={isLaki ? `${pemohon?.tempatLahir}, ${formatDate(pemohon?.tanggalLahir)}` : `${data.pasangan?.tempatLahir}, ${formatDate(data.pasangan?.tanggalLahir)}`} />
                    <FieldRow index="5" label="Kewarganegaraan" value={isLaki ? (pemohon?.kewarganegaraan === 'WNI' ? 'Indonesia' : pemohon?.kewarganegaraan) : data.pasangan?.kewarganegaraan} />
                    <FieldRow index="6" label="Agama" value={isLaki ? pemohon?.agama : data.pasangan?.agama} />
                    <FieldRow index="7" label="Pekerjaan" value={isLaki ? pemohon?.pekerjaan : data.pasangan?.pekerjaan} />
                    <FieldRow index="8" label="Alamat" value={isLaki ? pemohon?.alamat : data.pasangan?.alamat} />
                </div>

                <p className="font-bold mb-1">B. Calon Istri</p>
                <div className="mb-4">
                    <FieldRow index="1" label="Nama lengkap dan alias" value={!isLaki ? pemohon?.nama : data.pasangan?.nama} />
                    <FieldRow index="2" label="Binti" value={!isLaki ? data.ayah?.nama : data.pasangan?.binBinti} />
                    <FieldRow index="3" label="Nomor Induk Kependudukan (NIK)" value={!isLaki ? pemohon?.nik : data.pasangan?.nik} />
                    <FieldRow index="4" label="Tempat dan tanggal Lahir" value={!isLaki ? `${pemohon?.tempatLahir}, ${formatDate(pemohon?.tanggalLahir)}` : `${data.pasangan?.tempatLahir}, ${formatDate(data.pasangan?.tanggalLahir)}`} />
                    <FieldRow index="5" label="Kewarganegaraan" value={!isLaki ? (pemohon?.kewarganegaraan === 'WNI' ? 'Indonesia' : pemohon?.kewarganegaraan) : data.pasangan?.kewarganegaraan} />
                    <FieldRow index="6" label="Agama" value={!isLaki ? pemohon?.agama : data.pasangan?.agama} />
                    <FieldRow index="7" label="Pekerjaan" value={!isLaki ? pemohon?.pekerjaan : data.pasangan?.pekerjaan} />
                    <FieldRow index="8" label="Alamat" value={!isLaki ? pemohon?.alamat : data.pasangan?.alamat} />
                </div>

                <p className="mb-6 leading-relaxed">Menyatakan dengan sesungguhnya bahwa atas dasar suka rela, dengan kesadaran sendiri, tanpa ada paksaan dari siapapun juga, setuju untuk melangsungkan pernikahan.</p>
                <p className="mb-12">Demikian Surat persetujuan ini dibuat untuk digunakan seperlunya.</p>

                <div className="flex justify-between text-center">
                    <div className="w-[200px]">
                        <p>&nbsp;</p>
                        <p>Calon Suami</p>
                        <div className="h-24"></div>
                        <p className="font-bold underline">{isLaki ? pemohon?.nama : data.pasangan?.nama}</p>
                    </div>
                    <div className="w-[200px]">
                        <p>{pengaturan.nama_desa}, {formatDate(data.tanggalSurat)}</p>
                        <p>Calon Istri</p>
                        <div className="h-24"></div>
                        <p className="font-bold underline">{!isLaki ? pemohon?.nama : data.pasangan?.nama}</p>
                    </div>
                </div>
            </div>

            {/* ==============================================
                MODEL N6 - KEMATIAN SUAMI/ISTRI (Optional)
            =============================================== */}
            {data.cetakN6 && data.mantan && (
                <div className="f4-page flex flex-col">
                    <LampiranHeader no="X" judul="FORMULIR SURAT KETERANGAN KEMATIAN" model="Model N6" />
                    
                    <div className="mb-4 font-bold">
                        <div className="flex"><span className="w-[200px]">KANTOR DESA/KELURAHAN</span><span>: {pengaturan.nama_desa?.toUpperCase()}</span></div>
                        <div className="flex"><span className="w-[200px]">KECAMATAN</span><span>: {pengaturan.nama_kecamatan?.toUpperCase()}</span></div>
                        <div className="flex"><span className="w-[200px]">KABUPATEN/KOTA</span><span>: {pengaturan.nama_kabupaten?.toUpperCase()}</span></div>
                    </div>

                    <div className="text-center font-bold mb-6">
                        <p className="underline underline-offset-2">SURAT KETERANGAN KEMATIAN {isLaki ? 'ISTRI' : 'SUAMI'}</p>
                        <p className="font-normal">Nomor : {data.nomorSurat.replace('474.2', '474.3')}</p>
                    </div>

                    <p className="mb-2">Yang bertanda tangan di bawah ini menerangkan dengan sesungguhnya bahwa :</p>
                    
                    <div className="flex"><span className="w-5">A.</span><div className="flex-1">
                        <FieldRow index="1" label="Nama lengkap dan alias" value={data.mantan.nama} />
                        <FieldRow index="2" label={isLaki ? "Binti" : "Bin"} value={data.mantan.binBinti} />
                        <FieldRow index="3" label="Nomor Induk Kependudukan (NIK)" value={data.mantan.nik} />
                        <FieldRow index="4" label="Tempat dan tanggal Lahir" value={`${data.mantan.tempatLahir}, ${formatDate(data.mantan.tanggalLahir)}`} />
                        <FieldRow index="5" label="Kewarganegaraan" value="Indonesia" />
                        <FieldRow index="6" label="Agama" value={data.mantan.agama} />
                        <FieldRow index="7" label="Pekerjaan" value={data.mantan.pekerjaan} />
                        <FieldRow index="8" label="Alamat" value={data.mantan.alamat} />
                    </div></div>

                    <div className="my-2">
                        <div className="flex"><div className="w-[205px]">Telah meninggal dunia pada tanggal</div><div className="w-4">:</div><div className="flex-1 font-bold">{formatDate(data.mantan.tglMeninggal)}</div></div>
                        <div className="flex"><div className="w-[205px]">Di</div><div className="w-4">:</div><div className="flex-1 font-bold">{data.mantan.tempatMeninggal}</div></div>
                    </div>

                    <p className="mb-2">Yang bersangkutan adalah suami/istri*) dari :</p>

                    <div className="flex mb-4"><span className="w-5">B.</span><div className="flex-1">
                        <FieldRow index="1" label="Nama lengkap dan alias" value={pemohon?.nama} />
                        <FieldRow index="2" label={isLaki ? "Bin" : "Binti"} value={data.ayah?.nama} />
                        <FieldRow index="3" label="Nomor Induk Kependudukan (NIK)" value={pemohon?.nik} />
                        <FieldRow index="4" label="Tempat dan tanggal Lahir" value={`${pemohon?.tempatLahir}, ${formatDate(pemohon?.tanggalLahir)}`} />
                        <FieldRow index="5" label="Kewarganegaraan" value={pemohon?.kewarganegaraan === 'WNI' ? 'Indonesia' : pemohon?.kewarganegaraan} />
                        <FieldRow index="6" label="Agama" value={pemohon?.agama} />
                        <FieldRow index="7" label="Pekerjaan" value={pemohon?.pekerjaan} />
                        <FieldRow index="8" label="Alamat" value={pemohon?.alamat} />
                    </div></div>

                    <p className="mb-12">Demikian surat keterangan ini dibuat dengan mengingat sumpah jabatan dan untuk digunakan seperlunya.</p>

                    <div className="flex justify-end mt-auto pt-8">
                        <div className="text-center w-[250px]">
                            <p>{pengaturan.nama_desa}, {formatDate(data.tanggalSurat)}</p>
                            <p className="font-bold">KEPALA DESA {pengaturan.nama_desa?.toUpperCase()}</p>
                            <div className="h-24"></div>
                            <p className="font-bold underline underline-offset-4">{namaKades}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
