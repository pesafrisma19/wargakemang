const fs = require('fs')

let code = fs.readFileSync('d:/project web/wargakemang/src/app/dashboard/surat/sku/page.tsx', 'utf8')

// Add Import
if (!code.includes('AddressForm')) {
    code = code.replace(
      "import WargaSearchSelect from '@/components/WargaSearchSelect'",
      "import WargaSearchSelect from '@/components/WargaSearchSelect'\nimport AddressForm, { AddressData, formatAddress } from '@/components/AddressForm'"
    )
}

// Replace state
code = code.replace(
  "    const [lokasiUsaha, setLokasiUsaha] = useState('')",
  "    const initialAddress: AddressData = { alamat: '', rt: '', rw: '', desa: 'Kemang', kecamatan: 'Bojongpicung', kabupaten: 'Cianjur' }\n    const [lokasiUsaha, setLokasiUsaha] = useState<AddressData>(initialAddress)"
)

// In handleWargaSelect
code = code.replace(
  /setLokasiUsaha\(`\$\{warga\.alamat\}[^`]*`\)/,
  "setLokasiUsaha({ alamat: warga.alamat || '', rt: warga.rt || '', rw: warga.rw || '', desa: warga.desa || 'Kemang', kecamatan: warga.kecamatan || 'Bojongpicung', kabupaten: warga.kabupaten || 'Cianjur' })"
)

// In handleClearWarga
code = code.replace(
  "setLokasiUsaha('')",
  "setLokasiUsaha(initialAddress)"
)

// In buildData
code = code.replace(
  "bidangUsaha, lokasiUsaha, lamaUsaha,",
  "bidangUsaha, lokasiUsaha: formatAddress(lokasiUsaha), lamaUsaha,"
)

// Auto-update paragrafIsi
code = code.replace(
  "setParagrafIsi(getDefaultParagrafIsiUsaha(bidangUsaha, lokasiUsaha, lamaUsaha))",
  "setParagrafIsi(getDefaultParagrafIsiUsaha(bidangUsaha, formatAddress(lokasiUsaha), lamaUsaha))"
)
code = code.replace(
  "setParagrafIsi(getDefaultParagrafIsiUsaha(bidangUsaha, lokasiUsaha, lamaUsaha))",
  "setParagrafIsi(getDefaultParagrafIsiUsaha(bidangUsaha, formatAddress(lokasiUsaha), lamaUsaha))"
)
// and the condition
code = code.replace(
  "if (!paragrafIsiEdited && (bidangUsaha || lokasiUsaha || lamaUsaha)) {",
  "if (!paragrafIsiEdited && (bidangUsaha || formatAddress(lokasiUsaha) || lamaUsaha)) {"
)

// and the auto-fill from alamatJalan
code = code.replace(
  "if (alamatJalan && rt && rw && !lokasiUsaha) {",
  "if (alamatJalan && rt && rw && !lokasiUsaha.alamat) {"
)
code = code.replace(
  /setLokasiUsaha\(`\$\{alamatJalan\}[^`]*`\)/,
  "setLokasiUsaha({ alamat: alamatJalan || '', rt: rt || '', rw: rw || '', desa: desa || 'Kemang', kecamatan: kecamatan || 'Bojongpicung', kabupaten: kabupaten || 'Cianjur' })"
)


// Replace UI
const oldUIStart = '<label className="block text-sm font-medium text-gray-600 mb-1">Lokasi Usaha</label>'
const oldUIEnd = 'className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 resize-none" />'

code = code.replace(
    /<label className="block text-sm font-medium text-gray-600 mb-1">Lokasi Usaha<\/label>\s*<textarea value=\{lokasiUsaha\} onChange=\{\(e\) => setLokasiUsaha\(e\.target\.value\)\} rows=\{2\}\s*placeholder="Contoh: Kp\. Sukamaju\.\.\."\s*className="w-full px-4 py-2\.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 resize-none" \/>/g,
    `<div className="pt-2 border-t border-gray-100 mt-2">
                                <AddressForm 
                                    labelPrefix="Lokasi Usaha" 
                                    value={lokasiUsaha} 
                                    onChange={setLokasiUsaha} 
                                    inputCls="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" 
                                    defaultDesa={pengaturan?.nama_desa} 
                                    defaultKecamatan={pengaturan?.nama_kecamatan} 
                                    defaultKabupaten={pengaturan?.nama_kabupaten} 
                                />
                            </div>`
)

fs.writeFileSync('d:/project web/wargakemang/src/app/dashboard/surat/sku/page.tsx', code)
console.log('Done rewriting sku/page.tsx')
