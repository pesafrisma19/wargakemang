'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerWarga } from '@/actions/auth.actions'

export default function RegisterPage() {
    const [nik, setNik] = useState('')
    const [phone, setPhone] = useState('')
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess(false)

        if (password !== confirmPassword) {
            setError('Password dan Konfirmasi Password tidak cocok.')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('Password minimal harus 6 karakter.')
            setLoading(false)
            return
        }

        try {
            const formData = new FormData()
            formData.append('nik', nik)
            formData.append('phone', phone)
            formData.append('name', name)
            formData.append('password', password)

            const result = await registerWarga(formData)

            if (result?.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                // Bersihkan form
                setNik('')
                setPhone('')
                setName('')
                setPassword('')
                setConfirmPassword('')
            }
        } catch {
            setError('Terjadi kesalahan koneksi. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 py-12 px-4 sm:px-6 lg:px-8">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Pendaftaran Warga</h1>
                    <p className="text-white/80">Akses Mandiri Layanan Desa Kemang</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Pendaftaran Berhasil!</h2>
                            <p className="text-emerald-50 mb-8">
                                Akun Warga Anda telah berhasil dibuat. Anda sekarang dapat masuk menggunakan NIK atau Nomor HP Anda.
                            </p>
                            <Link 
                                href="/login"
                                className="inline-block w-full py-3 px-4 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors"
                            >
                                Pergi ke Halaman Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                            <label className="block text-white/90 text-sm font-medium mb-2">
                                NIK (Nomor Induk Kependudukan)
                            </label>
                            <input
                                type="text"
                                value={nik}
                                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                                maxLength={16}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                                placeholder="16 Digit NIK Anda"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-white/90 text-sm font-medium mb-2">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                                placeholder="Nama sesuai KTP"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-white/90 text-sm font-medium mb-2">
                                Nomor WhatsApp
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                                placeholder="08xxxxxxxxxx"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-white/90 text-sm font-medium mb-2">
                                Buat Password Baru
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                                placeholder="Masukkan password"
                                required
                            />
                            <p className="text-white/60 text-xs mt-1.5 ml-1">Minimal 6 karakter, kombinasikan huruf dan angka.</p>
                        </div>

                        <div>
                            <label className="block text-white/90 text-sm font-medium mb-2">
                                Ulangi Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={6}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                                placeholder="Ketik ulang password di atas"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Memproses...' : 'Daftar Sekarang'}
                        </button>
                    </form>

                    <div className="mt-6 text-center border-t border-white/10 pt-6">
                        <p className="text-white/80 text-sm">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="text-white font-semibold hover:underline">
                                Masuk di sini
                            </Link>
                        </p>
                    </div>
                    </>
                    )}
                </div>
            </div>
        </div>
    )
}
