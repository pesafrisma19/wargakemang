import jsPDF from 'jspdf'
import { Pengaturan } from '@/types/database'
import { formatTanggalIndonesia } from './kop-surat'

export interface KelahiranData {
    nomorSurat: string
    // Data Kelahiran
    hariLahir: string
    tanggalLahir: string
    tempatLahir: string
    jenisKelaminAnak: string
    anakKe: string
    namaAnak: string
    // Data Ibu
    namaIbu: string
    umurIbu: string
    agamaIbu: string
    // Data Ayah
    namaAyah: string
    umurAyah: string
    agamaAyah: string
    pekerjaanAyah: string
    wargaNegaraAyah: string
    alamatAyah: string
    // Pelapor
    namaPelapor: string
    hubunganPelapor: string
    // Paragraf
    paragrafPenutup: string
    // TTD
    penandatangan: 'kades' | 'sekdes'
    tanggalSurat: string
}

function formatTglLahirDMY(tgl: string): string {
    const date = new Date(tgl)
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}-${mm}-${yyyy}`
}

export function getDefaultParagrafPenutupKelahiran(): string {
    return 'Surat Keterangan ini dibuat atas dasar yang sebenarnya.'
}

export async function generateSuratKelahiran(
    data: KelahiranData,
    pengaturan: Pengaturan
): Promise<jsPDF> {
    // F4 landscape: 330mm x 215.9mm
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [215.9, 330.2],
    })

    // Certificate dimensions (1/3 of F4 landscape width)
    const certW = 110
    const certH = 211.9
    const certX = 2
    const certY = 2

    // Colors (from the sample image)
    const bgColor: [number, number, number] = [180, 216, 120]     // lime green bg
    const borderColor: [number, number, number] = [90, 140, 40]   // darker green border

    // Draw border
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(2)
    doc.setFillColor(...bgColor)
    doc.roundedRect(certX, certY, certW, certH, 2, 2, 'FD')

    // Inner border line
    doc.setLineWidth(0.5)
    doc.roundedRect(certX + 3, certY + 3, certW - 6, certH - 6, 1, 1, 'S')

    // Content area
    const mx = certX + 8  // left margin
    const contentW = certW - 16
    const centerX = certX + certW / 2
    let y = certY + 14

    // Title
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    const title = 'SURAT KELAHIRAN'
    doc.text(title, centerX, y, { align: 'center' })

    // Underline title
    const titleW = doc.getTextWidth(title)
    doc.setLineWidth(0.5)
    doc.setDrawColor(0, 0, 0)
    doc.line(centerX - titleW / 2, y + 1, centerX + titleW / 2, y + 1)

    // Nomor
    y += 6
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.text(`NO : ${data.nomorSurat}`, centerX, y, { align: 'center' })

    // Opening
    y += 8
    doc.setFontSize(9)
    const openingText = 'Yang bertandatangan di bawah ini, menerangkan bahwa pada :'
    const openingLines = doc.splitTextToSize(openingText, contentW)
    doc.text(openingLines, mx, y)
    y += openingLines.length * 4.5 + 3

    // Data kelahiran
    const labelX = mx
    const colonX = mx + 28
    const valueX = mx + 32
    const lh = 5 // line height

    const kelahiranFields = [
        { label: 'Hari', value: data.hariLahir },
        { label: 'Tanggal', value: formatTglLahirDMY(data.tanggalLahir) },
        { label: 'Di', value: data.tempatLahir },
    ]

    kelahiranFields.forEach(f => {
        doc.text(f.label, labelX, y)
        doc.text(':', colonX, y)
        doc.text(f.value || '-', valueX, y)
        y += lh
    })

    // Telah lahir seorang anak
    y += 2
    doc.text(`Telah lahir seorang anak   : ${data.jenisKelaminAnak}`, mx, y)
    y += lh + 2

    // Anak ke & Nama
    doc.text('Anak ke', labelX, y)
    doc.text(':', colonX, y)
    doc.text(data.anakKe, valueX, y)
    y += lh

    doc.text('Bernama', labelX, y)
    doc.text(':', colonX, y)
    doc.setFont('times', 'bold')
    doc.text(data.namaAnak, valueX, y)
    doc.setFont('times', 'normal')
    y += lh + 3

    // Data Ibu
    doc.text('Dari  seorang Ibu :', mx, y)
    y += lh + 1

    const ibuFields = [
        { label: 'Nama', value: data.namaIbu },
        { label: 'Umur', value: data.umurIbu ? `${data.umurIbu} Tahun` : '-' },
        { label: 'Agama', value: data.agamaIbu },
    ]

    ibuFields.forEach(f => {
        doc.text(f.label, labelX, y)
        doc.text(':', colonX, y)
        doc.text(f.value, valueX, y)
        y += lh
    })

    // Istri dari
    y += 2
    doc.text('Istri dari :', mx, y)
    y += lh + 1

    const ayahFields = [
        { label: 'Nama', value: data.namaAyah },
        { label: 'Umur', value: data.umurAyah ? `${data.umurAyah} Tahun` : '-' },
        { label: 'Agama', value: data.agamaAyah },
        { label: 'Pekerjaan', value: data.pekerjaanAyah },
        { label: 'Warga Negara', value: data.wargaNegaraAyah },
    ]

    ayahFields.forEach(f => {
        doc.text(f.label, labelX, y)
        doc.text(':', colonX, y)
        doc.text(f.value, valueX, y)
        y += lh
    })

    // Alamat (multiline)
    doc.text('Alamat', labelX, y)
    doc.text(':', colonX, y)
    const alamatLines = doc.splitTextToSize(data.alamatAyah, contentW - 34)
    doc.text(alamatLines, valueX, y)
    y += alamatLines.length * 4.5 + 4

    // Paragraf penutup
    const penutupLines = doc.splitTextToSize(data.paragrafPenutup, contentW)
    doc.text(penutupLines, mx, y)
    y += penutupLines.length * 4.5 + 3

    // Pelapor
    doc.text('Nama yang melaporkan', labelX, y)
    doc.text(':', colonX + 13, y)
    doc.text(data.namaPelapor, valueX + 13, y)
    y += lh
    doc.text('Hubungan dengan anak', labelX, y)
    doc.text(':', colonX + 13, y)
    doc.text(data.hubunganPelapor, valueX + 13, y)
    y += lh + 5

    // TTD
    const formattedDate = formatTanggalIndonesia(data.tanggalSurat)
    const desaCapitalized = pengaturan.nama_desa.charAt(0) + pengaturan.nama_desa.slice(1).toLowerCase()

    doc.text(`${desaCapitalized}, ${formattedDate}`, centerX, y, { align: 'center' })
    y += 5

    if (data.penandatangan === 'sekdes') {
        doc.text(`A.n Kepala Desa ${desaCapitalized}`, centerX, y, { align: 'center' })
        y += 4.5
        doc.text('Sekretaris Desa', centerX, y, { align: 'center' })
        y += 20
        doc.setFont('times', 'bold')
        doc.text(pengaturan.nama_sekdes.toUpperCase(), centerX, y, { align: 'center' })
    } else {
        doc.text(`Kepala Desa ${desaCapitalized}`, centerX, y, { align: 'center' })
        y += 20
        doc.setFont('times', 'bold')
        doc.text(pengaturan.nama_kades.toUpperCase(), centerX, y, { align: 'center' })
    }

    return doc
}
