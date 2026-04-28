import re

with open('src/app/dashboard/warga/tambah/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. State changes
state_replacement = """    const [isUpdateMode, setIsUpdateMode] = useState(false)
    const [existingId, setExistingId] = useState<string | null>(null)
    const [bulkData, setBulkData] = useState<{ formData: WargaInput, isUpdateMode: boolean, existingId: string | null }[] | null>(null)"""
code = re.sub(r'const \[isUpdateMode, setIsUpdateMode\] = useState\(false\)\n\s*const \[existingId, setExistingId\] = useState<string \| null>\(null\)', state_replacement, code)

# 2. handleScanKtp change
old_scan = r"const data = result\.data\n\n            // Check if NIK exists[\s\S]*?\} catch \(err\) \{\n                // Ignore compress error\n            \}"
new_scan = """const data = result.data

            if (data.data_warga && Array.isArray(data.data_warga)) {
                const processed = await Promise.all(data.data_warga.map(async (wargaData: any) => {
                    let existingWarga = null;
                    if (wargaData.nik) {
                        const { data: dbData } = await supabase.from('warga').select('*').eq('nik', wargaData.nik).single()
                        if (dbData) existingWarga = dbData
                    }

                    if (existingWarga) {
                        return {
                            isUpdateMode: true,
                            existingId: existingWarga.id,
                            formData: {
                                ...wargaData,
                                nik: existingWarga.nik,
                                nama: existingWarga.nama,
                                tempat_lahir: existingWarga.tempat_lahir,
                                tanggal_lahir: existingWarga.tanggal_lahir,
                                jenis_kelamin: existingWarga.jenis_kelamin,
                                alamat: existingWarga.alamat,
                                golongan_darah: existingWarga.golongan_darah || wargaData.golongan_darah || '-',
                                rt: existingWarga.rt,
                                rw: existingWarga.rw,
                                desa: existingWarga.desa,
                                kecamatan: existingWarga.kecamatan,
                                agama: existingWarga.agama,
                                status_kawin: existingWarga.status_kawin,
                                pekerjaan: existingWarga.pekerjaan,
                                kewarganegaraan: existingWarga.kewarganegaraan,
                                no_kk: existingWarga.no_kk || data.no_kk || wargaData.no_kk || formData.no_kk,
                                pendidikan: existingWarga.pendidikan || wargaData.pendidikan,
                                nama_ayah: existingWarga.nama_ayah || wargaData.nama_ayah,
                                nama_ibu: existingWarga.nama_ibu || wargaData.nama_ibu,
                                foto_ktp: existingWarga.foto_ktp,
                                foto_kk: existingWarga.foto_kk,
                            }
                        }
                    } else {
                        return {
                            isUpdateMode: false,
                            existingId: null,
                            formData: {
                                ...formData,
                                ...wargaData,
                                no_kk: data.no_kk || wargaData.no_kk || formData.no_kk,
                                alamat: data.alamat || wargaData.alamat || formData.alamat,
                                rt: data.rt || wargaData.rt || formData.rt,
                                rw: data.rw || wargaData.rw || formData.rw,
                                desa: data.desa || wargaData.desa || formData.desa,
                                kecamatan: data.kecamatan || wargaData.kecamatan || formData.kecamatan,
                            }
                        }
                    }
                }))
                
                setBulkData(processed)
                setToast({ message: `Berhasil mengekstrak ${processed.length} warga! Silakan periksa kembali.`, type: 'success' })
            } else {
                // Fallback if not an array (though it should be)
                setToast({ message: 'Format data tidak sesuai.', type: 'error' })
            }

            try {
                const { blob, dataUrl } = await compressImage(file)
                if (data.jenis_dokumen === 'KK') {
                    setSelectedKkFile(blob)
                    setFotoKkPreview(dataUrl)
                } else {
                    setSelectedFile(blob)
                    setFotoPreview(dataUrl)
                }
            } catch (err) {}"""
code = re.sub(old_scan, new_scan, code)

# 3. handleSubmit change
old_submit = r"const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?setSaving\(false\)\n            setToast\(\{ message: isUpdateMode \? 'Data warga berhasil diupdate!' : 'Data warga berhasil ditambahkan!', type: 'success' \}\)\n            setTimeout\(\(\) => \{\n                router\.push\('\/dashboard\/warga'\)\n            \}, 1000\)\n\n        \} catch \(error: any\) \{"

new_submit = """const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const dataToProcess = bulkData || [{ formData, isUpdateMode, existingId }];
            
            // Check NIK first if NOT in update mode
            for (const item of dataToProcess) {
                if (!item.isUpdateMode) {
                    const { data: existing } = await supabase
                        .from('warga')
                        .select('nik, nama')
                        .eq('nik', item.formData.nik)
                        .single()

                    if (existing) {
                        setToast({ message: `NIK ${item.formData.nik} sudah terdaftar atas nama: ${existing.nama}`, type: 'error' })
                        setSaving(false)
                        return
                    }
                }
            }

            let fotoUrl = null
            if (selectedFile) {
                const fileName = `${dataToProcess[0].formData.nik}-${Date.now()}.webp`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('foto-ktp')
                    .upload(fileName, selectedFile, { contentType: 'image/webp', upsert: true })

                if (uploadError) throw new Error('Gagal upload foto: ' + uploadError.message)
                const { data: { publicUrl } } = supabase.storage.from('foto-ktp').getPublicUrl(fileName)
                fotoUrl = publicUrl
            }

            let fotoKkUrl = dataToProcess[0].formData.foto_kk || null
            if (selectedKkFile) {
                const fileName = `kk-${dataToProcess[0].formData.nik || 'unknown'}-${Date.now()}.webp`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('foto-ktp')
                    .upload(fileName, selectedKkFile, { contentType: 'image/webp', upsert: true })

                if (uploadError) throw new Error('Gagal upload foto KK: ' + uploadError.message)
                const { data: { publicUrl } } = supabase.storage.from('foto-ktp').getPublicUrl(fileName)
                fotoKkUrl = publicUrl
            }

            for (const item of dataToProcess) {
                const payload = {
                    ...item.formData,
                    nama: item.formData.nama.toUpperCase(),
                    tempat_lahir: item.formData.tempat_lahir.toUpperCase(),
                    alamat: item.formData.alamat.toUpperCase(),
                    pekerjaan: item.formData.pekerjaan.toUpperCase(),
                    desa: item.formData.desa || DEFAULT_DESA,
                    kecamatan: item.formData.kecamatan || DEFAULT_KECAMATAN,
                    kabupaten: 'CIANJUR',
                    provinsi: 'JAWA BARAT',
                    foto_ktp: fotoUrl || item.formData.foto_ktp,
                    foto_kk: fotoKkUrl || item.formData.foto_kk,
                }

                if (item.isUpdateMode && item.existingId) {
                    const { error } = await supabase.from('warga').update(payload).eq('id', item.existingId)
                    if (error) throw error
                } else {
                    const { error } = await supabase.from('warga').insert([payload])
                    if (error) throw error
                }
            }

            // Auto-update foto_kk for family members (only use the first item's KK info)
            if (dataToProcess[0].formData.no_kk && (fotoKkUrl || dataToProcess[0].formData.foto_kk)) {
                await supabase
                    .from('warga')
                    .update({ foto_kk: fotoKkUrl || dataToProcess[0].formData.foto_kk })
                    .eq('no_kk', dataToProcess[0].formData.no_kk)
                    // don't exclude nik since we might just want to update all of them safely
            }

            setSaving(false)
            setToast({ message: bulkData ? `Berhasil menyimpan ${bulkData.length} data warga!` : (isUpdateMode ? 'Data warga berhasil diupdate!' : 'Data warga berhasil ditambahkan!'), type: 'success' })
            setTimeout(() => {
                router.push('/dashboard/warga')
            }, 1000)

        } catch (error: any) {"""

code = re.sub(old_submit, new_submit, code)

# 4. Wrap JSX in map
start_jsx = r'<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">'
end_jsx = r'</div>\n                </div>\n\n\n                \{\/\* Submit Button \*\/\}'

# Find the block
match = re.search(start_jsx + r'[\s\S]*?' + end_jsx, code)
if match:
    jsx_block = match.group(0)
    # Remove the end_jsx part from jsx_block for easier appending later
    jsx_block = jsx_block[:-len('</div>\n                </div>\n\n\n                {/* Submit Button */}')]
    
    # Replace formData. with currentFormData.
    jsx_block = jsx_block.replace('formData.', 'currentFormData.')
    # Replace handleChange with handleCurrentChange
    jsx_block = jsx_block.replace('onChange={handleChange}', 'onChange={handleCurrentChange}')
    # Specific fix for rw change
    jsx_block = jsx_block.replace('setFormData(prev => ({ ...prev, rw: e.target.value, rt: \'\' }))', """if (bulkData) {
                                    const newBulk = [...bulkData];
                                    newBulk[index].formData.rw = e.target.value;
                                    newBulk[index].formData.rt = '';
                                    setBulkData(newBulk);
                                } else {
                                    setFormData(prev => ({ ...prev, rw: e.target.value, rt: '' }))
                                }""")

    wrapper = f"""{{(bulkData || [{{ formData, isUpdateMode, existingId: null }}]).map((item, index) => {{
                    const currentFormData = item.formData;
                    const handleCurrentChange = (e: any) => {{
                        if (bulkData) {{
                            const newBulk = [...bulkData];
                            (newBulk[index].formData as any)[e.target.name] = e.target.value;
                            setBulkData(newBulk);
                        }} else {{
                            setFormData(prev => ({{ ...prev, [e.target.name]: e.target.value }}));
                        }}
                    }};
                    const isUpdate = item.isUpdateMode;

                    return (
                        <div key={{index}} className={{bulkData ? "p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-200 mb-6 relative" : ""}}>
                            {{bulkData && (
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                                    <h3 className="font-bold text-lg text-gray-800">Warga #{{index + 1}} - {{currentFormData.nama || 'Tanpa Nama'}}</h3>
                                    <div className="flex items-center gap-2">
                                        {{isUpdate && <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Update Data</span>}}
                                        <button type="button" onClick={{() => setBulkData(bulkData.filter((_, i) => i !== index))}} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 text-sm font-medium"><X size={{16}} /> Hapus</button>
                                    </div>
                                </div>
                            )}}

                            {jsx_block}
                            </div>
                        </div>
                    );
                }})}}
                
                {{/* Submit Button */}}"""
                
    code = code[:match.start()] + wrapper + code[match.end() - len('                {/* Submit Button */}'):]
    
# Change submit button text
code = code.replace("{saving ? 'Menyimpan...' : isUpdateMode ? 'Update Data Warga' : 'Simpan Data'}", "{saving ? 'Menyimpan...' : bulkData ? 'Simpan Semua Warga' : (isUpdateMode ? 'Update Data Warga' : 'Simpan Data')}")

# Save
with open('src/app/dashboard/warga/tambah/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Refactoring complete.")
