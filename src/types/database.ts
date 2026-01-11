// Database Types for Warga Kemang

export type UserRole = 'admin' | 'rt';

export type JenisKelamin = 'L' | 'P';

export type GolonganDarah = 'A' | 'B' | 'AB' | 'O' | '-';

export type StatusKawin = 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';

export type Agama = 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  rt: string | null;
  rw: string | null;
  created_at: string;
}

export interface Warga {
  id: string;
  nik: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: JenisKelamin;
  alamat: string;
  golongan_darah: GolonganDarah | null;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  agama: Agama;
  status_kawin: StatusKawin;
  pekerjaan: string;
  kewarganegaraan: string;
  no_kk: string | null;
  no_wa: string | null;
  created_at: string;
  updated_at: string;
}

export interface WargaInput {
  nik: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: JenisKelamin;
  alamat: string;
  golongan_darah?: GolonganDarah | null;
  rt: string;
  rw: string;
  desa?: string;
  kecamatan?: string;
  agama: Agama;
  status_kawin: StatusKawin;
  pekerjaan: string;
  kewarganegaraan?: string;
  no_kk?: string | null;
  no_wa?: string | null;
}

export interface DashboardStats {
  totalWarga: number;
  totalKK: number;
  totalLakiLaki: number;
  totalPerempuan: number;
}

// RW/RT Structure
export const RW_RT_STRUCTURE = {
  '001': ['001', '002', '003', '004', '005', '006'],
  '002': ['001', '002', '003', '004', '005', '006', '007'],
} as const;

export const AGAMA_OPTIONS: Agama[] = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];

export const STATUS_KAWIN_OPTIONS: StatusKawin[] = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];

export const GOLONGAN_DARAH_OPTIONS: GolonganDarah[] = ['A', 'B', 'AB', 'O', '-'];

// Default values
export const DEFAULT_DESA = 'Kemang';
export const DEFAULT_KECAMATAN = 'Bojongpicung';
export const DEFAULT_KABUPATEN = 'Cianjur';
export const DEFAULT_PROVINSI = 'Jawa Barat';
