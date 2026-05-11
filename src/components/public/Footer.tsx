import Link from 'next/link'
import { Users } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Warga Kemang</span>
            </Link>
            <p className="text-gray-500 max-w-sm mb-6">
              Sistem pendataan dan administrasi warga digital yang dirancang untuk mempermudah layanan kepada masyarakat.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Layanan</h4>
            <ul className="space-y-3">
              <li><Link href="/login" className="text-gray-500 hover:text-emerald-600 transition">Portal Warga</Link></li>
              <li><Link href="/login" className="text-gray-500 hover:text-emerald-600 transition">Dashboard Admin</Link></li>
              <li><Link href="#fitur" className="text-gray-500 hover:text-emerald-600 transition">Cek Surat</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Kontak</h4>
            <ul className="space-y-3">
              <li className="text-gray-500">Desa Kemang, Kec. Bojongpicung</li>
              <li className="text-gray-500">Kabupaten Cianjur, Jawa Barat</li>
              <li className="text-gray-500">kades.kemang@example.com</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Pemerintah Desa Kemang. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
