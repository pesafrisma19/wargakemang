'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">Warga Kemang</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex gap-8">
            <Link href="/" className={`text-sm font-medium transition-colors ${pathname === '/' ? 'text-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}>Beranda</Link>
            <Link href="#fitur" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Fitur</Link>
            {/* Navigasi tambahan nanti bisa diletakkan di sini */}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Masuk</Link>
            <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
