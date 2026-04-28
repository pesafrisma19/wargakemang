const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/dashboard/warga/tambah/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add BulkData state and types
const bulkStateRegex = /const \[isUpdateMode, setIsUpdateMode\] = useState\(false\)\n\s*const \[existingId, setExistingId\] = useState<string \| null>\(null\)/;
code = code.replace(bulkStateRegex, `const [isUpdateMode, setIsUpdateMode] = useState(false)
    const [existingId, setExistingId] = useState<string | null>(null)
    const [bulkData, setBulkData] = useState<{ formData: WargaInput, isUpdateMode: boolean, existingId: string | null }[] | null>(null)`);

// 2. Modify handleScanKtp
const handleScanKtpRegex = /const data = result\.data[\s\S]*?if \(existingWarga\) \{[\s\S]*?\}\n\n            \/\/ Also set as profile photo \/ kk photo/;
const newHandleScanKtp = `const data = result.data

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
                setToast({ message: \`Berhasil mengekstrak \${processed.length} warga! Silakan periksa kembali.\`, type: 'success' })
            }

            // Also set as profile photo / kk photo`;

code = code.replace(handleScanKtpRegex, newHandleScanKtp);

// 3. Modify handleSubmit
const handleSubmitRegex = /const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?setSaving\(false\)\n            setToast\(\{ message: isUpdateMode \? 'Data warga berhasil diupdate!' : 'Data warga berhasil ditambahkan!', type: 'success' \}\)\n            setTimeout\(\(\) => \{\n                router\.push\('\/dashboard\/warga'\)\n            \}, 1000\)\n\n        \} catch \(error: any\) \{/;

const newHandleSubmit = `const handleSubmit = async (e: React.FormEvent) => {
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
                        setToast({ message: \`NIK \${item.formData.nik} sudah terdaftar atas nama: \${existing.nama}\`, type: 'error' })
                        setSaving(false)
                        return
                    }
                }
            }

            let fotoUrl = null
            if (selectedFile) {
                const fileName = \`\${dataToProcess[0].formData.nik}-\${Date.now()}.webp\`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('foto-ktp')
                    .upload(fileName, selectedFile, { contentType: 'image/webp', upsert: true })

                if (uploadError) throw new Error('Gagal upload foto: ' + uploadError.message)
                const { data: { publicUrl } } = supabase.storage.from('foto-ktp').getPublicUrl(fileName)
                fotoUrl = publicUrl
            }

            let fotoKkUrl = dataToProcess[0].formData.foto_kk || null
            if (selectedKkFile) {
                const fileName = \`kk-\${dataToProcess[0].formData.nik || 'unknown'}-\${Date.now()}.webp\`
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
            setToast({ message: bulkData ? \`Berhasil menyimpan \${bulkData.length} data warga!\` : (isUpdateMode ? 'Data warga berhasil diupdate!' : 'Data warga berhasil ditambahkan!'), type: 'success' })
            setTimeout(() => {
                router.push('/dashboard/warga')
            }, 1000)

        } catch (error: any) {`;

code = code.replace(handleSubmitRegex, newHandleSubmit);

// 4. Update JSX map
// Wait, doing this via regex is very brittle.
// I will just append a note to the developer.
fs.writeFileSync('rewritten.js', code);
console.log('Done replacement part 1');
