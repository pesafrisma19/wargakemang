const fs = require('fs')

let code = fs.readFileSync('d:/project web/wargakemang/src/app/dashboard/surat/domisili/page.tsx', 'utf8')

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
  "            setAlamatJalan('')\n            setRt('')\n            setRw('')\n            setDesa('Kemang')\n            setKecamatan('Bojongpicung')\n            setKabupaten('Cianjur')",
  "            setAlamatWarga(initialAddress)"
)

// In handleSubmit
const oldBuildData = "                alamat: `${alamatJalan} RT. ${rt} RW. ${rw} Desa ${desa} Kec. ${kecamatan} Kab. ${kabupaten}`,"
code = code.replace(oldBuildData, "                alamat: formatAddress(alamatWarga),")

// Replace UI
const oldUIStart = '<div className="sm:col-span-2 space-y-4 border-t border-gray-100 pt-4 mt-2">'
const oldUIEnd = '</div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            )}'
const oldUI = code.substring(code.indexOf(oldUIStart), code.indexOf(oldUIEnd) + 6) // up to first closing div

const newUI = `<div className="sm:col-span-2 pt-2 border-t border-gray-100 mt-2">
                                <AddressForm 
                                    labelPrefix="Alamat" 
                                    value={alamatWarga} 
                                    onChange={setAlamatWarga} 
                                    inputCls="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" 
                                    defaultDesa={pengaturan?.nama_desa} 
                                    defaultKecamatan={pengaturan?.nama_kecamatan} 
                                    defaultKabupaten={pengaturan?.nama_kabupaten} 
                                />
                            </div>`

code = code.replace(
    /<div className="sm:col-span-2 space-y-4 border-t border-gray-100 pt-4 mt-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/,
    newUI + '\n                    </div>\n                </div>\n            )}'
)


fs.writeFileSync('d:/project web/wargakemang/src/app/dashboard/surat/domisili/page.tsx', code)
console.log('Done rewriting domisili/page.tsx')
