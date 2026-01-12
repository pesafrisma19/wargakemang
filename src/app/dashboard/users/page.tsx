'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Edit, Trash2, Key, Users, Shield, ShieldCheck } from 'lucide-react'

export default function KelolaUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<User | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [resetPasswordId, setResetPasswordId] = useState<string | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            // Get current user profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profileData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                setProfile(profileData)

                // Only admin can access this page
                if (profileData?.role !== 'admin') {
                    router.push('/dashboard')
                    return
                }
            }

            // Fetch all users
            const { data: usersData } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            setUsers(usersData || [])
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleDelete = async (userId: string) => {
        setActionLoading(true)
        try {
            // Delete from users table (auth user will remain but can't access)
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId)

            if (error) throw error

            setUsers(users.filter(u => u.id !== userId))
            setDeleteConfirm(null)
        } catch (err: any) {
            alert('Gagal menghapus user: ' + err.message)
        }
        setActionLoading(false)
    }

    const handleResetPassword = async (userId: string) => {
        if (!newPassword || newPassword.length < 6) {
            alert('Password minimal 6 karakter')
            return
        }

        setActionLoading(true)
        try {
            // Call Supabase Admin API to reset password
            const response = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newPassword })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            alert('Password berhasil direset!')
            setResetPasswordId(null)
            setNewPassword('')
        } catch (err: any) {
            alert('Gagal reset password: ' + err.message)
        }
        setActionLoading(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        )
    }

    if (profile?.role !== 'admin') {
        return null
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                        <ArrowLeft size={20} className="text-gray-600 sm:w-6 sm:h-6" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Kelola Users</h1>
                        <p className="text-gray-500 text-sm sm:text-base">Kelola akun admin dan RT</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/users/tambah"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                >
                    <UserPlus size={20} />
                    <span>Tambah User</span>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <ShieldCheck size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">
                                {users.filter(u => u.role === 'admin').length}
                            </p>
                            <p className="text-sm text-gray-500">Admin</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Users size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">
                                {users.filter(u => u.role === 'rt').length}
                            </p>
                            <p className="text-sm text-gray-500">RT/RW</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Nama</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">No. HP</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Role</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">RT/RW</th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-800">{user.name}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{user.phone}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {user.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                                            {user.role === 'admin' ? 'Admin' : 'RT'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {user.role === 'rt' ? `${user.rt}/${user.rw}` : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setResetPasswordId(user.id)}
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Reset Password"
                                            >
                                                <Key size={16} />
                                            </button>
                                            <Link
                                                href={`/dashboard/users/${user.id}/edit`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                            {user.id !== profile?.id && (
                                                <button
                                                    onClick={() => setDeleteConfirm(user.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Belum ada user terdaftar</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus User?</h3>
                        <p className="text-gray-600 mb-6">
                            User yang dihapus tidak akan bisa login lagi.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50"
                            >
                                {actionLoading ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPasswordId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Reset Password</h3>
                        <p className="text-gray-600 mb-4">
                            Masukkan password baru untuk user ini.
                        </p>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Password baru (min 6 karakter)"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4 text-gray-900 bg-white"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setResetPasswordId(null); setNewPassword('') }}
                                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleResetPassword(resetPasswordId)}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50"
                            >
                                {actionLoading ? 'Menyimpan...' : 'Reset'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
