import Link from 'next/link'
import { Users, FileText, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 py-20 lg:py-32">
        <div className="absolute inset-0">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-6">
            Sistem Informasi Warga Kemang
          </h1>
          <p className="text-xl text-emerald-50 mb-10 max-w-3xl mx-auto">
            Platform digital terpadu untuk pelayanan dan pendataan warga Desa Kemang. 
            Mewujudkan desa yang tertib administrasi dan responsif terhadap kebutuhan masyarakat.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login" className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg flex items-center justify-center gap-2">
              Masuk Portal <ArrowRight size={20} />
            </Link>
            <Link href="#fitur" className="px-8 py-4 bg-emerald-700/50 text-white rounded-xl font-bold hover:bg-emerald-700/70 border border-emerald-400/30 transition flex items-center justify-center">
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Layanan Unggulan Kami</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Sistem yang dirancang khusus untuk mempermudah urusan administrasi tingkat RT, RW, hingga Pemerintah Desa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pendataan Warga</h3>
              <p className="text-gray-600">Database kependudukan yang terstruktur, akurat, dan mudah dikelola oleh pengurus RT/RW.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Layanan Surat</h3>
              <p className="text-gray-600">Pembuatan surat pengantar RT/RW, surat domisili, hingga keterangan usaha dengan cepat.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Statistik Demografi</h3>
              <p className="text-gray-600">Pemantauan visual rasio jenis kelamin, usia, dan statistik penduduk secara realtime.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
