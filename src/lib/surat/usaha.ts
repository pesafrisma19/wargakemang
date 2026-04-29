import jsPDF from 'jspdf'
import { Pengaturan, Penandatangan } from '@/types/database'
import { drawKopSurat, drawTTD, loadLogo } from './kop-surat'

export interface UsahaData {
    // Nomor surat
    nomorSurat: string
    // Data warga
    nama: string
    tempatLahir: string
    tanggalLahir: string
    nik: string
    jenisKelamin: string
    kewarganegaraan: string
    pekerjaan: string
    agama: string
    alamat: string
    // Data usaha
    bidangUsaha: string
    lokasiUsaha: string
    lamaUsaha: string
    // Isi surat (semua editable)
    paragrafPembuka: string
    paragrafIsi: string
    paragrafPenutup: string
    // TTD
    penandatangan: Penandatangan
    tanggalSurat: string
}

function formatTglLahir(tgl: string): string {
    const date = new Date(tgl)
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}-${mm}-${yyyy}`
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Fungsi angka ke terbilang
function terbilang(angka: number): string {
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
    if (angka < 12) return satuan[angka]
    if (angka < 20) return satuan[angka - 10] + ' Belas'
    if (angka < 100) return satuan[Math.floor(angka / 10)] + ' Puluh' + (angka % 10 ? ' ' + satuan[angka % 10] : '')
    return String(angka)
}

export function getDefaultParagrafPembukaUsaha(pengaturan: Pengaturan): string {
    return `Kepala Desa ${capitalize(pengaturan.nama_desa)}, Kecamatan ${capitalize(pengaturan.nama_kecamatan)} Kabupaten ${capitalize(pengaturan.nama_kabupaten)} dengan ini menerangkan bahwa :`
}

export function getDefaultParagrafIsiUsaha(bidangUsaha: string, lokasiUsaha: string, lamaUsaha: string): string {
    const lamaAngka = parseInt(lamaUsaha) || 0
    const lamaTerbilang = lamaAngka > 0 ? `${lamaUsaha} (${terbilang(lamaAngka)})` : lamaUsaha

    return `Menurut keterangan dari yang bersangkutan dan data-data yang ada pada kami bahwa yang bersangkutan di atas adalah benar-benar warga kami dan benar mempunyai usaha di bidang:\n\n${bidangUsaha}\n\nDan berlokasi di ${lokasiUsaha || '...'}, dan telah berpengalaman selama ${lamaTerbilang || '...'} Tahun.`
}

export function getDefaultParagrafPenutupUsaha(): string {
    return 'Demikian Surat Keterangan ini kami buat dimohon agar pihak yang berkepentingan maklum dan mengetahuinya.'
}

export async function generateSuratUsaha(
    data: UsahaData,
    pengaturan: Pengaturan
): Promise<jsPDF> {
    const doc = new jsPDF('portrait', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - margin * 2

    // Load logo
    const logo = await loadLogo()

    // Draw Kop Surat
    let y = drawKopSurat(doc, pengaturan, logo)

    // Title
    y += 4
    doc.setFont('times', 'bold')
    doc.setFontSize(13)
    const title = 'SURAT KETERANGAN USAHA'
    doc.text(title, pageWidth / 2, y, { align: 'center' })

    // Underline title
    const titleWidth = doc.getTextWidth(title)
    doc.setLineWidth(0.5)
    doc.line(
        (pageWidth - titleWidth) / 2, y + 1,
        (pageWidth + titleWidth) / 2, y + 1
    )

    // Nomor
    y += 7
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.text(`No : ${data.nomorSurat}`, pageWidth / 2, y, { align: 'center' })

    // Opening paragraph (editable)
    y += 12
    doc.setFontSize(11)
    const openingLines = doc.splitTextToSize(data.paragrafPembuka, contentWidth)
    doc.text(openingLines, margin, y)
    y += openingLines.length * 6 + 4

    // Data fields
    const labelX = margin
    const colonX = margin + 45
    const valueX = margin + 50
    const lineHeight = 6.5

    const fields = [
        { label: 'Nama', value: data.nama },
        { label: 'NIK', value: data.nik },
        { label: 'Jenis Kelamin', value: data.jenisKelamin },
        { label: 'Tempat /Tgl Lahir', value: `${data.tempatLahir}, ${formatTglLahir(data.tanggalLahir)}` },
        { label: 'Kewarganegaraan', value: data.kewarganegaraan },
        { label: 'Pekerjaan', value: data.pekerjaan },
        { label: 'Agama', value: data.agama },
    ]

    fields.forEach((field) => {
        doc.setFont('times', 'normal')
        doc.text(field.label, labelX, y)
        doc.text(':', colonX, y)
        doc.text(field.value, valueX, y)
        y += lineHeight
    })

    // Alamat (multiline)
    doc.text('Alamat', labelX, y)
    doc.text(':', colonX, y)
    const alamatLines = doc.splitTextToSize(data.alamat, contentWidth - 50)
    doc.text(alamatLines, valueX, y)
    y += alamatLines.length * 5.5 + 4

    // Body paragraph with bidang usaha (editable)
    y += 4
    // Split paragrafIsi by newlines to handle bidang usaha numbering
    const isiParts = data.paragrafIsi.split('\n')
    isiParts.forEach((part) => {
        if (part.trim()) {
            const partLines = doc.splitTextToSize(part, contentWidth)
            doc.text(partLines, margin, y)
            y += partLines.length * 5.5
        } else {
            y += 2
        }
    })

    y += 6

    // Closing paragraph (editable)
    const closingLines = doc.splitTextToSize(data.paragrafPenutup, contentWidth)
    doc.text(closingLines, margin, y)
    y += closingLines.length * 5.5 + 16

    // TTD
    drawTTD(doc, y, pengaturan, data.penandatangan, data.tanggalSurat)

    return doc
}
