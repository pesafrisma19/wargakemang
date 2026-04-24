import jsPDF from 'jspdf'
import { Pengaturan } from '@/types/database'

// Load logo from public folder and convert to base64
let cachedLogo: string | null = null

export async function loadLogo(): Promise<string | null> {
    if (cachedLogo) return cachedLogo

    try {
        const response = await fetch('/logo-cianjur.png')
        const blob = await response.blob()
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                cachedLogo = reader.result as string
                resolve(cachedLogo)
            }
            reader.readAsDataURL(blob)
        })
    } catch {
        console.warn('Logo not found, generating PDF without logo')
        return null
    }
}

export function drawKopSurat(doc: jsPDF, pengaturan: Pengaturan, logoBase64: string | null) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20

    // Draw logo
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', margin, 10, 22, 22)
        } catch {
            // Skip logo if there's an error
        }
    }

    const textStartX = logoBase64 ? margin + 26 : margin
    const textWidth = pageWidth - textStartX - margin

    // Kop text
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.text(`PEMERINTAH KABUPATEN ${pengaturan.nama_kabupaten}`, textStartX + textWidth / 2, 15, { align: 'center' })

    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.text(`KECAMATAN ${pengaturan.nama_kecamatan}`, textStartX + textWidth / 2, 22, { align: 'center' })

    doc.setFontSize(16)
    doc.text(`KEPALA DESA ${pengaturan.nama_desa}`, textStartX + textWidth / 2, 30, { align: 'center' })

    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.text(pengaturan.alamat_kantor, textStartX + textWidth / 2, 35, { align: 'center' })

    // Horizontal line
    doc.setLineWidth(1)
    doc.line(margin, 38, pageWidth - margin, 38)
    doc.setLineWidth(0.3)
    doc.line(margin, 39.5, pageWidth - margin, 39.5)

    // Return the Y position after kop surat
    return 45
}

export function drawTTD(
    doc: jsPDF,
    y: number,
    pengaturan: Pengaturan,
    penandatangan: 'kades' | 'sekdes',
    tanggalSurat: string
) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const rightX = pageWidth - margin - 70

    // Format tanggal
    const formattedDate = formatTanggalIndonesia(tanggalSurat)

    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.text(`${pengaturan.nama_desa.charAt(0) + pengaturan.nama_desa.slice(1).toLowerCase()}, ${formattedDate}`, rightX, y)

    if (penandatangan === 'sekdes') {
        doc.text('A.n KEPALA DESA ' + pengaturan.nama_desa, rightX, y + 6)
        doc.text('Sekretaris Desa', rightX, y + 12)

        // Space for signature
        doc.setFont('times', 'bold')
        doc.text(pengaturan.nama_sekdes.toUpperCase(), rightX, y + 40)
    } else {
        doc.text('KEPALA DESA ' + pengaturan.nama_desa, rightX, y + 6)

        // Space for signature
        doc.setFont('times', 'bold')
        doc.text(pengaturan.nama_kades.toUpperCase(), rightX, y + 40)
    }

    // Underline name
    const namaText = penandatangan === 'sekdes'
        ? pengaturan.nama_sekdes.toUpperCase()
        : pengaturan.nama_kades.toUpperCase()
    const nameWidth = doc.getTextWidth(namaText)
    doc.setLineWidth(0.5)
    doc.line(rightX, y + 41, rightX + nameWidth, y + 41)
}

export function formatTanggalIndonesia(dateStr: string): string {
    const bulanNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    const date = new Date(dateStr)
    const day = date.getDate()
    const month = bulanNames[date.getMonth()]
    const year = date.getFullYear()

    return `${day} ${month} ${year}`
}
