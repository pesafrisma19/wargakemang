const fs = require('fs')

let code = fs.readFileSync('d:/project web/wargakemang/src/app/dashboard/surat/na/page.tsx', 'utf8')

// 1. Add Import
code = code.replace(
  "import WargaSearchSelect from '@/components/WargaSearchSelect'",
  "import WargaSearchSelect from '@/components/WargaSearchSelect'\nimport AddressForm, { AddressData, formatAddress } from '@/components/AddressForm'"
)

// 2. Change state variables
code = code.replace(
  "    const [pemohonAlamat, setPemohonAlamat] = useState('')",
  "    const initialAddress: AddressData = { alamat: '', rt: '', rw: '', desa: '', kecamatan: '', kabupaten: '' }\n    const [pemohonAlamat, setPemohonAlamat] = useState<AddressData>(initialAddress)"
)
code = code.replace("    const [pasanganAlamat, setPasanganAlamat] = useState('')", "    const [pasanganAlamat, setPasanganAlamat] = useState<AddressData>(initialAddress)")
code = code.replace("    const [ayahAlamat, setAyahAlamat] = useState('')", "    const [ayahAlamat, setAyahAlamat] = useState<AddressData>(initialAddress)")
code = code.replace("    const [ibuAlamat, setIbuAlamat] = useState('')", "    const [ibuAlamat, setIbuAlamat] = useState<AddressData>(initialAddress)")
code = code.replace("    const [mantanAlamat, setMantanAlamat] = useState('')", "    const [mantanAlamat, setMantanAlamat] = useState<AddressData>(initialAddress)")

// 3. handleWargaSelect population (Ayah, Ibu)
code = code.replace(
  /setAyahAlamat\(`\$\{ayah\.alamat\}[^`]*`\)/,
  `setAyahAlamat({ alamat: ayah.alamat || '', rt: ayah.rt || '', rw: ayah.rw || '', desa: ayah.desa || '', kecamatan: ayah.kecamatan || '', kabupaten: ayah.kabupaten || '' })`
)
code = code.replace(
  /setIbuAlamat\(`\$\{ibu\.alamat\}[^`]*`\)/,
  `setIbuAlamat({ alamat: ibu.alamat || '', rt: ibu.rt || '', rw: ibu.rw || '', desa: ibu.desa || '', kecamatan: ibu.kecamatan || '', kabupaten: ibu.kabupaten || '' })`
)
code = code.replace(
  /setPemohonAlamat\(`\$\{warga\.alamat\}[^`]*`\)/,
  `setPemohonAlamat({ alamat: warga.alamat || '', rt: warga.rt || '', rw: warga.rw || '', desa: warga.desa || '', kecamatan: warga.kecamatan || '', kabupaten: warga.kabupaten || '' })`
)

// 4. Clear forms
code = code.replace(
  /setPemohonAlamat\(''\)\n\s+setPasanganAlamat\(''\)\n\s+setAyahAlamat\(''\)\n\s+setIbuAlamat\(''\)\n\s+setMantanAlamat\(''\)/,
  `setPemohonAlamat(initialAddress)\n            setPasanganAlamat(initialAddress)\n            setAyahAlamat(initialAddress)\n            setIbuAlamat(initialAddress)\n            setMantanAlamat(initialAddress)`
)
// Or fallback single lines
code = code.replace("setPemohonAlamat('')", "setPemohonAlamat(initialAddress)")
code = code.replace("setPasanganAlamat('')", "setPasanganAlamat(initialAddress)")
code = code.replace("setAyahAlamat('')", "setAyahAlamat(initialAddress)")
code = code.replace("setIbuAlamat('')", "setIbuAlamat(initialAddress)")
code = code.replace("setMantanAlamat('')", "setMantanAlamat(initialAddress)")

// 5. Submit formatting
code = code.replace("alamat: pemohonAlamat, kewarganegaraan: pemohonKewarganegaraan", "alamat: formatAddress(pemohonAlamat), kewarganegaraan: pemohonKewarganegaraan")
code = code.replace("alamat: pasanganAlamat, ", "alamat: formatAddress(pasanganAlamat), ")
code = code.replace("alamat: ayahAlamat", "alamat: formatAddress(ayahAlamat)")
code = code.replace("alamat: ibuAlamat", "alamat: formatAddress(ibuAlamat)")
code = code.replace("alamat: mantanAlamat, ", "alamat: formatAddress(mantanAlamat), ")

// 6. Replace UI
const pemohonAlamatUI = `<div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-600 mb-1">Alamat Lengkap</label><textarea value={pemohonAlamat} onChange={(e) => setPemohonAlamat(e.target.value)} rows={2} className={\`\${inputCls} resize-none\`} /></div>`
const pasanganAlamatUI = `<div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-600 mb-1">Alamat / Tempat Tinggal</label><textarea value={pasanganAlamat} onChange={(e) => setPasanganAlamat(e.target.value)} rows={2} className={\`\${inputCls} resize-none\`} /></div>`
const ayahAlamatUI = `<div><label className="block text-sm font-medium text-gray-600 mb-1">Alamat</label><textarea value={ayahAlamat} onChange={(e) => setAyahAlamat(e.target.value)} rows={2} className={\`\${inputCls} resize-none\`} /></div>`
const ibuAlamatUI = `<div><label className="block text-sm font-medium text-gray-600 mb-1">Alamat</label><textarea value={ibuAlamat} onChange={(e) => setIbuAlamat(e.target.value)} rows={2} className={\`\${inputCls} resize-none\`} /></div>`
const mantanAlamatUI = `<div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-600 mb-1">Alamat Terakhir</label><textarea value={mantanAlamat} onChange={(e) => setMantanAlamat(e.target.value)} rows={2} className={\`\${inputCls} resize-none\`} /></div>`

code = code.replace(
    pemohonAlamatUI,
    `<div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Pemohon" value={pemohonAlamat} onChange={setPemohonAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>`
)
code = code.replace(
    pasanganAlamatUI,
    `<div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Pasangan" value={pasanganAlamat} onChange={setPasanganAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>`
)
code = code.replace(
    ayahAlamatUI,
    `<div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Ayah" value={ayahAlamat} onChange={setAyahAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>`
)
code = code.replace(
    ibuAlamatUI,
    `<div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Ibu" value={ibuAlamat} onChange={setIbuAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>`
)
code = code.replace(
    mantanAlamatUI,
    `<div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2"><AddressForm labelPrefix="Alamat Terakhir" value={mantanAlamat} onChange={setMantanAlamat} inputCls={inputCls} defaultDesa={pengaturan?.nama_desa} defaultKecamatan={pengaturan?.nama_kecamatan} defaultKabupaten={pengaturan?.nama_kabupaten} /></div>`
)

fs.writeFileSync('d:/project web/wargakemang/src/app/dashboard/surat/na/page.tsx', code)
console.log('Done rewriting na/page.tsx')
