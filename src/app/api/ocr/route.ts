import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API Key Gemini belum dikonfigurasi di server.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    // Convert File to Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Use Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Anda adalah sistem OCR KTP dan KK Indonesia yang sangat akurat.
      Ekstrak data dari gambar KTP atau Kartu Keluarga yang diberikan dan kembalikan HANYA dalam format JSON.
      Jangan berikan teks tambahan apapun selain JSON.
      Pastikan membaca dengan teliti meskipun gambar agak buram atau ada pantulan cahaya.

      Format JSON yang diharapkan HANYA SEPERTI INI:
      {
        "jenis_dokumen": "KTP" atau "KK",
        "no_kk": "string (16 digit) jika dokumen adalah KK, jika KTP kosongkan",
        "alamat": "string jalan/kampung tanpa RT/RW/Desa (ambil dari kop jika KK, dari baris alamat jika KTP)",
        "rt": "string (3 digit, misal 001)",
        "rw": "string (3 digit, misal 002)",
        "desa": "string nama desa/kelurahan",
        "kecamatan": "string nama kecamatan",
        "data_warga": [
          {
            "nik": "string (16 digit)",
            "nama": "string (HURUF KAPITAL SEMUA)",
            "tempat_lahir": "string (HURUF KAPITAL SEMUA)",
            "tanggal_lahir": "string format YYYY-MM-DD",
            "jenis_kelamin": "L" atau "P",
            "golongan_darah": "A" / "B" / "AB" / "O" / "-",
            "agama": "ISLAM" / "KRISTEN" / "KATOLIK" / "HINDU" / "BUDDHA" / "KONGHUCU",
            "status_kawin": "BELUM KAWIN" / "KAWIN" / "CERAI HIDUP" / "CERAI MATI",
            "pekerjaan": "string",
            "kewarganegaraan": "WNI" atau "WNA",
            "pendidikan": "string (jika ada di KK, jika KTP kosongkan)",
            "nama_ayah": "string (jika ada di KK, jika KTP kosongkan)",
            "nama_ibu": "string (jika ada di KK, jika KTP kosongkan)",
            "hubungan_keluarga": "KEPALA KELUARGA / ISTERI / ANAK / FAMILI LAIN dll (jika di KTP kosongkan)"
          }
        ]
      }

      PERATURAN KHUSUS UNTUK KK (Kartu Keluarga):
      - Jika dokumen adalah Kartu Keluarga, ekstrak Nomor KK, Alamat, RT, RW, Desa, Kecamatan yang ada di bagian atas (Header/Kop KK).
      - Untuk data individu, ekstrak SEMUA ORANG yang ada di dalam tabel secara berurutan.
      - Urutkan sesuai dengan nomor urut baris di tabel KK (misal No 1, lalu No 2, dst).
      - Masukkan semua orang tersebut ke dalam array "data_warga".

      PERATURAN KHUSUS UNTUK KTP:
      - Jika dokumen adalah KTP, array "data_warga" hanya akan berisi 1 objek (1 orang).
      - Data alamat untuk JSON utama diambil langsung dari KTP tersebut.

      PERATURAN UMUM:
      - Jika NIK atau No KK tidak terbaca 16 digit, usahakan membaca seakurat mungkin angka yang ada.
      - Untuk jenis_kelamin, jika tertulis "LAKI-LAKI" kembalikan "L", jika "PEREMPUAN" kembalikan "P".
      - Untuk tanggal lahir, konversi dari DD-MM-YYYY menjadi format YYYY-MM-DD agar mudah disimpan di database.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type,
        },
      },
    ]);

    const responseText = result.response.text();
    
    // Clean up the response in case Gemini wraps it in markdown code blocks
    const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsedData = JSON.parse(cleanedText);
      return NextResponse.json({ success: true, data: parsedData });
    } catch (parseError) {
      console.error('Gagal parsing JSON dari Gemini:', responseText);
      return NextResponse.json(
        { error: 'Gagal membaca data dari gambar. Gambar mungkin terlalu buram.' },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server saat memproses gambar.' },
      { status: 500 }
    );
  }
}
