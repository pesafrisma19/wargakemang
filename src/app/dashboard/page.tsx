import { createClient } from '@/lib/supabase/server'
import { Users, FileText, Activity, UserMinus, Clock } from 'lucide-react'
import Link from 'next/link'

// Helper for relative time
function getRelativeTime(dateString: string): string {
    const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    
    if (Math.abs(diffInDays) < 1) {
        const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
        if (Math.abs(diffInHours) < 1) {
            const diffInMinutes = Math.round(diffInMs / (1000 * 60));
            return rtf.format(diffInMinutes, 'minute');
        }
        return rtf.format(diffInHours, 'hour');
    }
    return rtf.format(diffInDays, 'day');
}

// Helper to calculate age
function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

export default async function DashboardPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get user profile
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

    // Build query based on user role
    let query = supabase.from('warga').select('*', { count: 'exact' }).order('created_at', { ascending: false })

    if (profile?.role !== 'admin') {
        query = query.eq('rt', profile?.rt).eq('rw', profile?.rw)
    }

    const { data: wargaData, count: totalWarga } = await query

    // Calculate demographics
    const totalKK = new Set(wargaData?.filter(w => w.no_kk).map(w => w.no_kk)).size
    const totalLakiLaki = wargaData?.filter(w => w.jenis_kelamin === 'L').length || 0
    const totalPerempuan = wargaData?.filter(w => w.jenis_kelamin === 'P').length || 0
    
    const pctLaki = totalWarga ? Math.round((totalLakiLaki / totalWarga) * 100) : 0;
    const pctPerempuan = totalWarga ? 100 - pctLaki : 0;

    let balita = 0, remaja = 0, dewasa = 0, lansia = 0;
    let aktif = 0, meninggal = 0, pindah = 0;

    wargaData?.forEach(w => {
        // Usia
        const age = calculateAge(w.tanggal_lahir);
        if (age <= 5) balita++;
        else if (age <= 17) remaja++;
        else if (age <= 59) dewasa++;
        else lansia++;

        // Status
        if (w.status_warga === 'AKTIF') aktif++;
        else if (w.status_warga === 'MENINGGAL') meninggal++;
        else if (w.status_warga === 'PINDAH') pindah++;
    });

    const maxAgeGroup = Math.max(balita, remaja, dewasa, lansia) || 1;

    const stats = [
        {
            title: 'Total Warga',
            value: totalWarga || 0,
            icon: Users,
            color: '#3b82f6',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Total KK',
            value: totalKK,
            icon: FileText,
            color: '#10b981',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'Warga Aktif',
            value: aktif,
            icon: Activity,
            color: '#0d9488',
            bgColor: 'bg-teal-50',
        },
        {
            title: 'Pindah/Meninggal',
            value: pindah + meninggal,
            icon: UserMinus,
            color: '#d97706',
            bgColor: 'bg-amber-50',
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500 mt-1">
                        {profile?.role === 'admin'
                            ? 'Selamat datang, Administrator'
                            : `Selamat datang, RT ${profile?.rt} / RW ${profile?.rw}`}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                            </div>
                            <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                                <stat.icon className="w-7 h-7" style={{ color: stat.color }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Demographics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                
                {/* Gender Ratio */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
                    <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider">Rasio Gender</h3>
                    
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <p className="text-3xl font-bold text-blue-600">{pctLaki}%</p>
                            <p className="text-sm text-gray-500 font-medium">Laki-laki ({totalLakiLaki})</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-pink-500">{pctPerempuan}%</p>
                            <p className="text-sm text-gray-500 font-medium">Perempuan ({totalPerempuan})</p>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-5 w-full bg-gray-100 rounded-full flex overflow-hidden shadow-inner">
                        <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${pctLaki}%` }}></div>
                        <div className="bg-pink-400 h-full transition-all duration-1000" style={{ width: `${pctPerempuan}%` }}></div>
                    </div>
                </div>

                {/* Age Categories */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider">Kategori Usia Warga</h3>
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-24 text-sm text-gray-700 font-semibold">Balita (0-5)</div>
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${(balita / maxAgeGroup) * 100}%` }}></div>
                            </div>
                            <div className="w-12 text-right text-sm font-bold text-gray-800">{balita}</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-24 text-sm text-gray-700 font-semibold">Remaja (6-17)</div>
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-teal-400 rounded-full transition-all duration-1000" style={{ width: `${(remaja / maxAgeGroup) * 100}%` }}></div>
                            </div>
                            <div className="w-12 text-right text-sm font-bold text-gray-800">{remaja}</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-24 text-sm text-gray-700 font-semibold">Dewasa (18-59)</div>
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${(dewasa / maxAgeGroup) * 100}%` }}></div>
                            </div>
                            <div className="w-12 text-right text-sm font-bold text-gray-800">{dewasa}</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-24 text-sm text-gray-700 font-semibold">Lansia (60+)</div>
                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${(lansia / maxAgeGroup) * 100}%` }}></div>
                            </div>
                            <div className="w-12 text-right text-sm font-bold text-gray-800">{lansia}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Warga Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800">Warga Baru Ditambahkan</h2>
                        <Link
                            href="/dashboard/warga"
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-bold"
                        >
                            Lihat Semua →
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & NIK</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">RT/RW</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {wargaData?.slice(0, 5).map((warga) => (
                                <tr key={warga.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-gray-800">{warga.nama}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{warga.nik}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                            {warga.rt}/{warga.rw}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {warga.status_warga === 'AKTIF' && (
                                            <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                Aktif
                                            </span>
                                        )}
                                        {warga.status_warga === 'PINDAH' && (
                                            <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                Pindah
                                            </span>
                                        )}
                                        {warga.status_warga === 'MENINGGAL' && (
                                            <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                Meninggal
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-gray-500">
                                            <Clock size={14} />
                                            <span className="text-sm font-medium">{getRelativeTime(warga.created_at)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!wargaData || wargaData.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada data warga.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
