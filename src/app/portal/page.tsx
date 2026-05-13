import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export default async function PortalBeranda() {
    const supabase = await createClient()

    // Dapatkan data user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('nik, name, phone, rt, rw')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.nik) redirect('/login')

    // Dapatkan detail warga berdasarkan NIK dari profile
    const { data: warga } = await supabase
        .from('warga')
        .select('*')
        .eq('nik', profile.nik)
        .single()

    // Cari anggota keluarga lain (jika punya no_kk)
    let keluarga: any[] = []
    if (warga?.no_kk) {
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: kel } = await supabaseAdmin
            .from('warga')
            .select('nama, nik, hubungan_keluarga, tempat_lahir, tanggal_lahir, jenis_kelamin')
            .eq('no_kk', warga.no_kk)
            .neq('nik', warga.nik) // exclude diri sendiri
        
        if (kel) keluarga = kel
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Selamat Datang, {profile.name}!</h1>
                <p className="text-gray-500">Ini adalah halaman portal warga Anda. Anda dapat melihat data diri dan mengurus surat pengantar di sini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kartu Identitas Digital */}
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                    <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
                        <h2 className="font-semibold text-emerald-800">Identitas Diri</h2>
                        <span className="text-xs font-bold px-2 py-1 bg-emerald-200 text-emerald-800 rounded-full">
                            AKTIF
                        </span>
                    </div>
                    <div className="p-6">
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Induk Kependudukan (NIK)</dt>
                                <dd className="mt-1 font-mono font-medium text-gray-900">{profile.nik}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Lengkap</dt>
                                <dd className="mt-1 font-medium text-gray-900">{warga?.nama || profile.name}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tempat/Tgl Lahir</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{warga?.tempat_lahir}, {new Date(warga?.tanggal_lahir || '').toLocaleDateString('id-ID')}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Agama</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{warga?.agama}</dd>
                                </div>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat Lengkap</dt>
                                <dd className="mt-1 text-sm text-gray-900 leading-relaxed">
                                    {warga?.alamat}<br />
                                    RT {profile.rt} / RW {profile.rw}<br />
                                    Desa {warga?.desa || 'Kemang'}, Kec. {warga?.kecamatan || 'Bojongpicung'}, {warga?.kabupaten || 'Cianjur'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                {/* Anggota Keluarga */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">Anggota Keluarga</h2>
                    </div>
                    <div className="p-0">
                        {keluarga.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {keluarga.map((k, i) => (
                                    <li key={i} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-800">{k.nama}</p>
                                                <p className="text-sm text-gray-500 font-mono mt-0.5">{k.nik}</p>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {k.hubungan_keluarga}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p>Tidak ada data anggota keluarga lain dalam 1 KK.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fitur yang akan datang */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg overflow-hidden text-white p-6 sm:p-8 mt-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Fitur Surat Pengantar Mandiri</h3>
                        <p className="text-blue-100 mt-1">Segera Hadir di Fase 2.2! Anda akan bisa memohon surat pengantar langsung dari halaman ini tanpa perlu ke rumah RT.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
