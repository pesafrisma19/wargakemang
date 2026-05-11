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

import { getWargaStats } from '@/actions/warga.actions'

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

    // Ambil data warga dari actions
    const { totalWarga, totalKK, aktif, meninggal, pindah, data: wargaData } = await getWargaStats(
        profile?.role || '', 
        profile?.rt, 
        profile?.rw
    )

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
