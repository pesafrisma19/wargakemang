'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, RW_RT_STRUCTURE } from '@/types/database'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function TambahUserPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [profile, setProfile] = useState<User | null>(null)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        role: 'rt' as 'admin' | 'rt',
        rt: '',
        rw: '',
    })

    useEffect(() => {
        const checkAuth = async () => {
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
            setCheckingAuth(false)
        }
        checkAuth()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validate RT/RW for RT role
            if (formData.role === 'rt' && (!formData.rt || !formData.rw)) {
                alert('RT dan RW wajib diisi untuk role RT')
                setLoading(false)
                return
            }

            // Call API to create user
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone.replace(/\D/g, ''),
                    password: formData.password,
                    role: formData.role,
                    rt: formData.role === 'rt' ? formData.rt : null,
                    rw: formData.role === 'rt' ? formData.rw : null,
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            router.push('/dashboard/users')
        } catch (err: any) {
            alert('Gagal membuat user: ' + err.message)
        }
        setLoading(false)
    }

    if (checkingAuth) {
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
            <div className="flex items-center gap-3 sm:gap-4">
                <Link
                    href="/dashboard/users"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                    <ArrowLeft size={20} className="text-gray-600 sm:w-6 sm:h-6" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Tambah User</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Daftarkan admin atau RT baru</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Nama */}
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nama *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            placeholder="Nama lengkap"
                            required
                        />
                    </div>

                    {/* No HP */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nomor HP *</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            placeholder="08xxxxxxxxxx"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Akan digunakan untuk login</p>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Password *</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            placeholder="Minimal 6 karakter"
                            minLength={6}
                            required
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Role *</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'rt', rt: '', rw: '' })}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                            required
                        >
                            <option value="rt">RT (Akses terbatas)</option>
                            <option value="admin">Admin (Akses penuh)</option>
                        </select>
                    </div>

                    {/* RW - only show for RT role */}
                    {formData.role === 'rt' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">RW *</label>
                            <select
                                value={formData.rw}
                                onChange={(e) => setFormData({ ...formData, rw: e.target.value, rt: '' })}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                                required
                            >
                                <option value="">Pilih RW</option>
                                {Object.keys(RW_RT_STRUCTURE).map(rw => (
                                    <option key={rw} value={rw}>RW {rw}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* RT - only show for RT role */}
                    {formData.role === 'rt' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">RT *</label>
                            <select
                                value={formData.rt}
                                onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 bg-white"
                                required
                                disabled={!formData.rw}
                            >
                                <option value="">Pilih RT</option>
                                {formData.rw && RW_RT_STRUCTURE[formData.rw as keyof typeof RW_RT_STRUCTURE]?.map(rt => (
                                    <option key={rt} value={rt}>RT {rt}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                {formData.role === 'rt' && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-sm text-amber-800">
                            <strong>Catatan:</strong> User dengan role RT hanya bisa melihat dan mengelola data warga di RT/RW yang dipilih.
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
                    <Link
                        href="/dashboard/users"
                        className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-center order-2 sm:order-1"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all order-1 sm:order-2"
                    >
                        <UserPlus size={20} />
                        {loading ? 'Menyimpan...' : 'Tambah User'}
                    </button>
                </div>
            </form>
        </div>
    )
}
