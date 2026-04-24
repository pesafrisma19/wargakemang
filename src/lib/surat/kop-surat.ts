import jsPDF from 'jspdf'
import { Pengaturan } from '@/types/database'

// Load logo from public folder and convert to base64
let cachedLogo: string | null = null

export async function loadLogo(): Promise<string | null> {
    if (cachedLogo) return cachedLogo

    try {
        // Use Image element approach - more reliable than fetch+FileReader
        return new Promise((resolve) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.naturalWidth
                canvas.height = img.naturalHeight
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.drawImage(img, 0, 0)
                    cachedLogo = canvas.toDataURL('image/png')
                    resolve(cachedLogo)
                } else {
                    resolve(null)
                }
            }
            img.onerror = () => {
                console.warn('Logo not found at /logo-cianjur.png')
                resolve(null)
            }
            // Use window.location.origin to build absolute URL
            img.src = `${window.location.origin}/logo-cianjur.jpg`
        })
    } catch {
        console.warn('Error loading logo')
        return null
    }
}

export function drawKopSurat(doc: jsPDF, pengaturan: Pengaturan, logoBase64: string | null) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const centerX = pageWidth / 2

    // Draw logo on the left
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'JPEG', margin, 8, 22, 22)
        } catch (e) {
            console.warn('Failed to add logo to PDF:', e)
        }
    }

    // Kop text - always centered on full page width for proper alignment
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.text(`PEMERINTAH KABUPATEN ${pengaturan.nama_kabupaten}`, centerX, 14, { align: 'center' })

    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.text(`KECAMATAN ${pengaturan.nama_kecamatan}`, centerX, 21, { align: 'center' })

    doc.setFontSize(16)
    doc.text(`KEPALA DESA ${pengaturan.nama_desa}`, centerX, 29, { align: 'center' })

    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.text(pengaturan.alamat_kantor, centerX, 34, { align: 'center' })

    // Horizontal line (double line like the sample)
    doc.setLineWidth(1)
    doc.line(margin, 37, pageWidth - margin, 37)
    doc.setLineWidth(0.3)
    doc.line(margin, 39, pageWidth - margin, 39)

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
    const desaCapitalized = pengaturan.nama_desa.charAt(0) + pengaturan.nama_desa.slice(1).toLowerCase()

    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.text(`${desaCapitalized}, ${formattedDate}`, rightX, y)

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
    if (namaText) {
        const nameWidth = doc.getTextWidth(namaText)
        doc.setLineWidth(0.5)
        doc.line(rightX, y + 41, rightX + nameWidth, y + 41)
    }
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
