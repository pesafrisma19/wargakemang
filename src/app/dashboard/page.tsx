import { createClient } from '@/lib/supabase/server'
import { Users, FileText, UserCheck, UserX } from 'lucide-react'
import Link from 'next/link'

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
    let query = supabase.from('warga').select('*', { count: 'exact' })

    if (profile?.role !== 'admin') {
        query = query.eq('rt', profile?.rt).eq('rw', profile?.rw)
    }

    const { data: wargaData, count: totalWarga } = await query

    // Calculate statistics
    const totalKK = new Set(wargaData?.filter(w => w.no_kk).map(w => w.no_kk)).size
    const totalLakiLaki = wargaData?.filter(w => w.jenis_kelamin === 'L').length || 0
    const totalPerempuan = wargaData?.filter(w => w.jenis_kelamin === 'P').length || 0

    const stats = [
        {
            title: 'Total Warga',
            value: totalWarga || 0,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Total KK',
            value: totalKK,
            icon: FileText,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'Laki-laki',
            value: totalLakiLaki,
            icon: UserCheck,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Perempuan',
            value: totalPerempuan,
            icon: UserX,
            color: 'from-pink-500 to-pink-600',
            bgColor: 'bg-pink-50',
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
                <Link
                    href="/dashboard/warga/tambah"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                >
                    <Users size={20} />
                    Tambah Warga
                </Link>
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
                                <stat.icon className={`w-7 h-7 bg-gradient-to-r ${stat.color} bg-clip-text`} style={{ color: stat.color.includes('blue') ? '#3b82f6' : stat.color.includes('emerald') ? '#10b981' : stat.color.includes('purple') ? '#8b5cf6' : '#ec4899' }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Warga */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">Data Warga Terbaru</h2>
                        <Link
                            href="/dashboard/warga"
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                            Lihat Semua →
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIK</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RT/RW</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No. KK</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {wargaData?.slice(0, 5).map((warga) => (
                                <tr key={warga.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{warga.nik}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{warga.nama}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{warga.rt}/{warga.rw}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{warga.no_kk || '-'}</td>
                                </tr>
                            ))}
                            {(!wargaData || wargaData.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada data warga. <Link href="/dashboard/warga/tambah" className="text-emerald-600 hover:underline">Tambah sekarang</Link>
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
