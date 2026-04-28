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

    // Use Gemini 1.5 Flash (fastest and cheapest for text extraction)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Anda adalah sistem OCR KTP dan KK Indonesia yang sangat akurat.
      Ekstrak data dari gambar KTP atau Kartu Keluarga yang diberikan dan kembalikan HANYA dalam format JSON.
      Jangan berikan teks tambahan apapun selain JSON.
      Pastikan membaca dengan teliti meskipun gambar agak buram atau ada pantulan cahaya.

      Jika ini adalah KTP, format JSON yang diharapkan:
      {
        "jenis_dokumen": "KTP",
        "nik": "string (16 digit)",
        "nama": "string (HURUF KAPITAL SEMUA)",
        "tempat_lahir": "string (HURUF KAPITAL SEMUA)",
        "tanggal_lahir": "string format YYYY-MM-DD",
        "jenis_kelamin": "L" atau "P",
        "golongan_darah": "A" / "B" / "AB" / "O" / "-",
        "alamat": "string jalan/kampung tanpa RT/RW/Desa",
        "rt": "string (3 digit, misal 001)",
        "rw": "string (3 digit, misal 002)",
        "desa": "string nama desa/kelurahan",
        "kecamatan": "string nama kecamatan",
        "agama": "ISLAM" / "KRISTEN" / "KATOLIK" / "HINDU" / "BUDDHA" / "KONGHUCU",
        "status_kawin": "BELUM KAWIN" / "KAWIN" / "CERAI HIDUP" / "CERAI MATI",
        "pekerjaan": "string",
        "kewarganegaraan": "WNI" atau "WNA"
      }

      Jika NIK tidak terbaca 16 digit, usahakan membaca seakurat mungkin angka yang ada.
      Untuk jenis_kelamin, jika tertulis "LAKI-LAKI" kembalikan "L", jika "PEREMPUAN" kembalikan "P".
      Untuk tanggal lahir, konversi dari DD-MM-YYYY menjadi format YYYY-MM-DD agar mudah disimpan di database.
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
