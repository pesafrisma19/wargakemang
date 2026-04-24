import jsPDF from 'jspdf'
import { Pengaturan, Penandatangan } from '@/types/database'
import { drawKopSurat, drawTTD, loadLogo } from './kop-surat'

export interface DomisiliData {
    // Nomor surat
    nomorSurat: string
    // Data warga
    nama: string
    tempatLahir: string
    tanggalLahir: string
    nik: string
    statusKawin: string
    jenisKelamin: string
    kewarganegaraan: string
    pekerjaan: string
    agama: string
    alamat: string
    // Isi surat
    keperluan: string
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

export async function generateSuratDomisili(
    data: DomisiliData,
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
    const title = 'SURAT KETERANGAN DOMISILI'
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

    // Opening paragraph
    y += 12
    doc.setFontSize(11)
    const openingText = `Kepala Desa ${capitalize(pengaturan.nama_desa)}, Kecamatan ${capitalize(pengaturan.nama_kecamatan)} Kabupaten ${capitalize(pengaturan.nama_kabupaten)} dengan ini menerangkan bahwa :`
    const openingLines = doc.splitTextToSize(openingText, contentWidth)
    doc.text(openingLines, margin, y)
    y += openingLines.length * 6 + 4

    // Data fields
    const labelX = margin
    const colonX = margin + 45
    const valueX = margin + 50
    const lineHeight = 6.5

    const fields = [
        { label: 'Nama', value: data.nama },
        { label: 'Tempat /Tgl Lahir', value: `${data.tempatLahir}, ${formatTglLahir(data.tanggalLahir)}` },
        { label: 'NIK', value: data.nik },
        { label: 'Status Perkawinan', value: data.statusKawin },
        { label: 'Jenis Kelamin', value: data.jenisKelamin },
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

    // Body paragraph
    y += 4
    const bodyText = `Menerangkan bahwa nama tersebut di atas adalah benar-benar warga kami, dan sampai sekarang masih berdomisili seperti yang tertera di atas, dan telah meminta surat keterangan kepada kami untuk melengkapi persyaratan ${data.keperluan}.`
    const bodyLines = doc.splitTextToSize(bodyText, contentWidth)
    doc.text(bodyLines, margin, y)
    y += bodyLines.length * 5.5 + 6

    // Closing paragraph
    const closingText = 'Demikian surat keterangan ini kami buat dengan sebenar-benarnya, agar pihak yang berkepentingan maklum dan mengetahuinya.'
    const closingLines = doc.splitTextToSize(closingText, contentWidth)
    doc.text(closingLines, margin, y)
    y += closingLines.length * 5.5 + 16

    // TTD
    drawTTD(doc, y, pengaturan, data.penandatangan, data.tanggalSurat)

    return doc
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
