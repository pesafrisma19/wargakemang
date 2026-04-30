const fs = require('fs')

let code = fs.readFileSync('d:/project web/wargakemang/src/app/dashboard/surat/sku/page.tsx', 'utf8')

// Add Import
code = code.replace(
  "import WargaSearchSelect from '@/components/WargaSearchSelect'",
  "import WargaSearchSelect from '@/components/WargaSearchSelect'\nimport AddressForm, { AddressData, formatAddress } from '@/components/AddressForm'"
)

// Replace state
code = code.replace(
  "    const [alamatJalan, setAlamatJalan] = useState('')\n    const [rt, setRt] = useState('')\n    const [rw, setRw] = useState('')\n    const [desa, setDesa] = useState('Kemang')\n    const [kecamatan, setKecamatan] = useState('Bojongpicung')\n    const [kabupaten, setKabupaten] = useState('Cianjur')",
  "    const initialAddress: AddressData = { alamat: '', rt: '', rw: '', desa: 'Kemang', kecamatan: 'Bojongpicung', kabupaten: 'Cianjur' }\n    const [alamatWarga, setAlamatWarga] = useState<AddressData>(initialAddress)"
)

// In handleWargaSelect
code = code.replace(
  "        setAlamatJalan(warga.alamat)\n        setRt(warga.rt)\n        setRw(warga.rw)\n        setDesa(warga.desa)\n        setKecamatan(warga.kecamatan)\n        setKabupaten(warga.kabupaten)",
  "        setAlamatWarga({\n            alamat: warga.alamat || '',\n            rt: warga.rt || '',\n            rw: warga.rw || '',\n            desa: warga.desa || 'Kemang',\n            kecamatan: warga.kecamatan || 'Bojongpicung',\n            kabupaten: warga.kabupaten || 'Cianjur'\n        })"
)

// In handleClearWarga
code = code.replace(
  "            setAlamatJalan(''); setRt(''); setRw(''); setDesa('Kemang'); setKecamatan('Bojongpicung'); setKabupaten('Cianjur')",
  "            setAlamatWarga(initialAddress)"
)

// In handleSubmit
const oldBuildData = "                alamat: `${alamatJalan} RT. ${rt} RW. ${rw} Desa ${desa} Kec. ${kecamatan} Kab. ${kabupaten}`,"
code = code.replace(oldBuildData, "                alamat: formatAddress(alamatWarga),")

// Replace UI
const newUI = `<div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2">
                                <AddressForm 
                                    labelPrefix="Alamat" 
                                    value={alamatWarga} 
                                    onChange={setAlamatWarga} 
                                    inputCls={inputCls} 
                                    defaultDesa={pengaturan?.nama_desa} 
                                    defaultKecamatan={pengaturan?.nama_kecamatan} 
                                    defaultKabupaten={pengaturan?.nama_kabupaten} 
                                />
                            </div>`

code = code.replace(
    /<div className="sm:col-span-2 space-y-4 border-t border-gray-100 pt-4 mt-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/,
    newUI + '\n                    </div>\n                </div>\n            )}'
)

fs.writeFileSync('d:/project web/wargakemang/src/app/dashboard/surat/sku/page.tsx', code)
console.log('Done rewriting sku/page.tsx')
