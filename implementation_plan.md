# Restructuring Warga Kemang: Public + Admin Dashboard + Member Portal

## Situasi Saat Ini

Saat ini semua route langsung redirect ke `/login`, dan hanya ada satu area: **Dashboard Admin/RT** (`/dashboard/*`). Tidak ada halaman publik dan tidak ada portal khusus warga.

### Struktur Saat Ini
```
src/app/
├── page.tsx            → redirect ke /login
├── login/              → halaman login admin/RT
├── dashboard/          → SEMUA fitur admin (layout + sidebar)
│   ├── warga/
│   ├── keluarga/
│   ├── surat/
│   ├── import/
│   ├── pengaturan/
│   └── users/
└── api/
```

**Masalah:** Semua tercampur dalam satu folder `dashboard/`. Tidak ada pemisahan jelas antara area publik, admin, dan warga biasa.

---

## Proposed Structure (Rencana Folder Baru)

```
src/
├── app/
│   │
│   │── (public)/                    ← 🌍 HALAMAN PUBLIK (tanpa login)
│   │   ├── layout.tsx               ← Layout publik (navbar + footer)
│   │   ├── page.tsx                 ← Landing page / beranda
│   │   ├── profil-desa/
│   │   │   └── page.tsx             ← Info Desa Kemang
│   │   ├── pengumuman/
│   │   │   └── page.tsx             ← Pengumuman warga
│   │   └── kontak/
│   │       └── page.tsx             ← Kontak & lokasi desa
│   │
│   ├── (auth)/                      ← 🔐 HALAMAN LOGIN/REGISTER
│   │   ├── layout.tsx               ← Layout minimal (centered)
│   │   ├── login/
│   │   │   └── page.tsx             ← Login (Admin/RT/Warga)
│   │   └── register/
│   │       └── page.tsx             ← Register warga (by NIK)
│   │
│   ├── dashboard/                   ← 👨‍💼 DASHBOARD ADMIN/RT (existing)
│   │   ├── layout.tsx               ← Layout admin (sidebar existing)
│   │   ├── page.tsx                 ← Dashboard stats admin
│   │   ├── warga/                   ← Kelola semua data warga
│   │   ├── keluarga/                ← Data keluarga
│   │   ├── surat/                   ← Buat surat
│   │   ├── import/                  ← Import data
│   │   ├── pengaturan/              ← Pengaturan desa
│   │   └── users/                   ← Kelola akun users
│   │
│   ├── portal/                      ← 👤 DASHBOARD WARGA/MEMBER
│   │   ├── layout.tsx               ← Layout portal (sidebar berbeda, warna biru)
│   │   ├── page.tsx                 ← Beranda portal warga
│   │   ├── profil/
│   │   │   └── page.tsx             ← Lihat & edit data diri
│   │   ├── keluarga/
│   │   │   └── page.tsx             ← Lihat data keluarga
│   │   ├── surat/
│   │   │   └── page.tsx             ← Riwayat & ajukan surat
│   │   └── pengaturan/
│   │       └── page.tsx             ← Ubah password, no WA
│   │
│   └── api/                         ← API routes (existing + new)
│       ├── admin/
│       ├── ocr/
│       └── portal/                  ← API khusus portal warga
│
├── components/
│   ├── public/                      ← 🌍 Komponen halaman publik
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── HeroSection.tsx
│   │
│   ├── dashboard/                   ← 👨‍💼 Komponen dashboard admin
│   │   ├── Sidebar.tsx              ← (pindah dari root components)
│   │   └── AdminHeader.tsx
│   │
│   ├── portal/                      ← 👤 Komponen portal warga
│   │   ├── PortalSidebar.tsx
│   │   └── PortalHeader.tsx
│   │
│   ├── shared/                      ← 🔄 Komponen dipakai bersama
│   │   ├── AddressForm.tsx          ← (pindah dari root)
│   │   ├── WargaSearchSelect.tsx    ← (pindah dari root)
│   │   └── Toast.tsx                ← (pindah dari ui/)
│   │
│   └── ui/                          ← UI primitif (button, input, dll)
│
├── lib/
│   ├── supabase/
│   ├── surat/
│   └── auth/                        ← Helper auth baru
│       └── roles.ts                 ← Role checking utilities
│
└── types/
    └── database.ts                  ← Update: tambah role 'warga'
```

---

## User Review Required

> [!IMPORTANT]
> **Role "warga" baru di database.** Saat ini `users.role` hanya `admin` | `rt`. Kita perlu tambahkan role `warga` untuk warga biasa yang login ke portal. Ini butuh migrasi SQL di Supabase.

> [!WARNING]
> **Login flow berubah.** Setelah login:
> - Role `admin` / `rt` → redirect ke `/dashboard`
> - Role `warga` → redirect ke `/portal`
>
> Login page tetap satu (`/login`), tapi routing berubah berdasarkan role.

> [!IMPORTANT]
> **Halaman publik tanpa login.** Root `/` tidak lagi redirect ke `/login`, melainkan menampilkan landing page yang bisa diakses siapa saja. Link login ada di navbar.

---

## Open Questions

> [!IMPORTANT]
> **1. Fitur apa saja yang ingin ada di halaman publik?**
> Saya mengusulkan:
> - **Beranda** — Landing page dengan info desa, statistik singkat
> - **Profil Desa** — Visi misi, sejarah, struktur organisasi
> - **Pengumuman** — Berita / pengumuman dari desa
> - **Kontak** — Alamat, peta, nomor telepon
>
> Apakah ada yang mau ditambah/kurangi?

> [!IMPORTANT]
> **2. Fitur apa di portal warga (member dashboard)?**
> Saya mengusulkan:
> - **Beranda** — Ringkasan data diri, notifikasi
> - **Profil Saya** — Lihat data KTP/KK sendiri (read-only atau bisa edit?)
> - **Data Keluarga** — Lihat anggota keluarga se-KK
> - **Surat Saya** — Riwayat surat yang pernah dibuat + ajukan surat baru
> - **Pengaturan** — Ubah password, update no WA
>
> Apakah warga bisa **edit** data diri sendiri, atau hanya **lihat** saja?

> [!IMPORTANT]
> **3. Cara registrasi warga?**
> Opsi yang diusulkan:
> - **A.** Warga daftar sendiri pakai NIK → sistem verifikasi NIK ada di database → buat akun
> - **B.** Admin yang buatkan akun warga
> - **C.** Keduanya (warga bisa daftar, admin juga bisa buatkan)
>
> Pilih mana?

> [!IMPORTANT]
> **4. Apakah mau langsung implementasi semua sekaligus, atau bertahap?**
> Saya rekomendasikan **bertahap**:
> - **Fase 1:** Restructure folder + Halaman publik (landing page) + pindahkan komponen
> - **Fase 2:** Portal warga (login warga + dashboard member)
> - **Fase 3:** Fitur tambahan (pengumuman, ajukan surat, dll)

---

## Proposed Changes

### 1. Database & Auth

#### [MODIFY] [database.ts](file:///d:/project%20web/wargakemang/src/types/database.ts)
- Tambah `'warga'` ke `UserRole` type: `'admin' | 'rt' | 'warga'`

#### [NEW] [add-warga-role.sql](file:///d:/project%20web/wargakemang/supabase/migrations/add-warga-role.sql)
- Migrasi SQL untuk update constraint `users.role` agar menerima `'warga'`
- Tambah RLS policy: warga hanya bisa SELECT data diri sendiri (match by NIK)

#### [MODIFY] [middleware.ts](file:///d:/project%20web/wargakemang/src/lib/supabase/middleware.ts)
- Update routing logic:
  - `/dashboard/*` → hanya untuk `admin` dan `rt`
  - `/portal/*` → hanya untuk `warga`
  - `/(public)/*` → akses bebas tanpa login

#### [NEW] [roles.ts](file:///d:/project%20web/wargakemang/src/lib/auth/roles.ts)
- Utility functions: `isAdmin()`, `isRT()`, `isWarga()`
- Redirect helper berdasarkan role

---

### 2. Halaman Publik `(public)/`

#### [NEW] [(public)/layout.tsx](file:///d:/project%20web/wargakemang/src/app/(public)/layout.tsx)
- Layout dengan Navbar publik (logo, menu, tombol Login) + Footer

#### [NEW] [(public)/page.tsx](file:///d:/project%20web/wargakemang/src/app/(public)/page.tsx)
- Landing page: Hero section, statistik singkat desa, fitur highlights
- Design modern: gradient, glassmorphism, animasi

#### [NEW] [Navbar.tsx](file:///d:/project%20web/wargakemang/src/components/public/Navbar.tsx)
- Responsive navbar publik

#### [NEW] [Footer.tsx](file:///d:/project%20web/wargakemang/src/components/public/Footer.tsx)
- Footer dengan info desa

---

### 3. Portal Warga `/portal`

#### [NEW] [portal/layout.tsx](file:///d:/project%20web/wargakemang/src/app/portal/layout.tsx)
- Layout portal warga dengan sidebar berbeda (warna biru/indigo, bukan hijau)
- Auth check: hanya role `warga`

#### [NEW] [portal/page.tsx](file:///d:/project%20web/wargakemang/src/app/portal/page.tsx)
- Dashboard member: data diri ringkas, surat terbaru, notifikasi

#### [NEW] [PortalSidebar.tsx](file:///d:/project%20web/wargakemang/src/components/portal/PortalSidebar.tsx)
- Sidebar khusus warga (menu: Beranda, Profil, Keluarga, Surat, Pengaturan)

---

### 4. Reorganisasi Komponen

#### [MOVE] Sidebar.tsx → `components/dashboard/Sidebar.tsx`
#### [MOVE] AddressForm.tsx → `components/shared/AddressForm.tsx`
#### [MOVE] WargaSearchSelect.tsx → `components/shared/WargaSearchSelect.tsx`
#### [MOVE] Toast.tsx → `components/shared/Toast.tsx`

- Update semua import path yang mereferensi komponen yang dipindah

---

### 5. Update Login & Auth Flow

#### [MODIFY] [login/page.tsx](file:///d:/project%20web/wargakemang/src/app/login/page.tsx)
- Pindah ke `(auth)/login/page.tsx`
- Setelah login, redirect berdasarkan role (`/dashboard` vs `/portal`)

#### [MODIFY] [page.tsx](file:///d:/project%20web/wargakemang/src/app/page.tsx)
- Ubah dari redirect `/login` menjadi render landing page (atau forward ke `(public)`)

---

## Verification Plan

### Automated Tests
1. `npm run build` — pastikan semua import path benar setelah reorganisasi
2. Test routing:
   - `/` → tampilkan landing page (tanpa login)
   - `/login` → halaman login
   - `/dashboard` → redirect ke `/login` jika belum login
   - `/portal` → redirect ke `/login` jika belum login
   - Admin login → redirect ke `/dashboard`
   - Warga login → redirect ke `/portal`

### Manual Verification
- Browse semua halaman publik tanpa login
- Login sebagai admin → cek dashboard admin berfungsi seperti semula
- Login sebagai warga → cek portal warga tampil dengan benar
