# Warga Kemang - Sistem Data Warga

Aplikasi manajemen data warga untuk keperluan RT/RW di wilayah Kemang, Kabupaten Cianjur, Jawa Barat.

## Fitur

- ✅ Login dengan nomor HP dan password
- ✅ Dashboard dengan statistik (jumlah warga, KK, dll)
- ✅ CRUD data warga (Tambah, Edit, Hapus)
- ✅ Import data dari Excel
- ✅ Export data ke Excel dan PDF
- ✅ Role-based access (Admin vs RT)
- ✅ Admin bisa lihat semua data
- ✅ RT hanya bisa lihat data RT masing-masing

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deployment**: Vercel

## Setup Development

### 1. Clone & Install

```bash
cd wargakemang-app
npm install
```

### 2. Setup Supabase

1. Buka project Supabase kamu
2. Copy **Project URL** dan **anon public key** dari Settings > API
3. Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Database

1. Buka Supabase Dashboard > SQL Editor
2. Copy isi file `supabase/schema.sql`
3. Jalankan query tersebut

### 4. Buat User Admin

Di Supabase Dashboard > Authentication > Users:

1. Klik "Add User" > "Create new user"
2. Email: `08123456789@wargakemang.local` (nomor HP + @wargakemang.local)
3. Password: password kamu
4. Klik "Create User"

Lalu update profile di SQL Editor:
```sql
UPDATE public.users 
SET name = 'Administrator', role = 'admin'
WHERE phone LIKE '%08123456789%';
```

### 5. Run Development

```bash
npm run dev
```

Buka http://localhost:3000

## Deployment ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/wargakemang.git
git push -u origin main
```

### 2. Deploy di Vercel

1. Buka https://vercel.com
2. Login dengan GitHub
3. Klik "New Project"
4. Import repository `wargakemang`
5. Tambahkan Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Klik "Deploy"

## Struktur Wilayah

- **RW 001**: RT 001-006 (6 RT)
- **RW 002**: RT 001-007 (7 RT)

## Data Warga (Field KTP)

| Field | Keterangan |
|-------|------------|
| NIK | 16 digit |
| Nama | Nama lengkap |
| Tempat, Tanggal Lahir | Input terpisah |
| Jenis Kelamin | L/P |
| Alamat | Alamat lengkap |
| Golongan Darah | A/B/AB/O (opsional) |
| Alamat Kampung | Nama kampung |
| RT/RW | Sesuai struktur |
| Desa | Input |
| Kecamatan | Input |
| Kabupaten | Cianjur (fixed) |
| Provinsi | Jawa Barat (fixed) |
| Agama | Islam/Kristen/dll |
| Status Kawin | Belum/Kawin/Cerai |
| Pekerjaan | Input |
| Kewarganegaraan | WNI/WNA |
| No. KK | 16 digit (opsional) |
| No. WA | Nomor WhatsApp (opsional) |

## License

MIT
