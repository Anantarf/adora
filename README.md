# ADORA Basketball Club

🌐 **Live Preview:** [https://adorabbc.com](https://adorabbc.com)

Sistem manajemen klub basket komprehensif untuk ADORA Basketball Club. Proyek ini mencakup landing page publik, formulir pendaftaran, portal orang tua (Parent Portal), dan dashboard admin (Coach/Admin Portal) untuk mempermudah operasional klub sehari-hari.

## 🌟 Fitur Utama

### 🏢 Publik & Pendaftaran
- **Landing Page**: Informasi program latihan, homebase, galeri kegiatan, dan CTA pendaftaran.
- **Formulir Pendaftaran Online**: Pendaftaran pemain baru yang terintegrasi langsung ke sistem admin.

### 🛡️ Admin & Coach Dashboard
- **Manajemen Tim**: Pengelolaan data pemain, penempatan kelompok/roster, dan manajemen jadwal latihan & pertandingan.
- **Sistem Presensi**: Pencatatan absensi yang terintegrasi otomatis dengan skor kedisiplinan pemain.
- **Evaluasi Dinamis (V2)**: Sistem metrik penilaian fleksibel dan dinamis (Dribble, Passing, Finishing) dengan bobot skor yang bisa dikonfigurasi. Mendukung metrik *legacy*.
- **AI Coach Notes**: Pembuatan catatan pelatih dan evaluasi otomatis secara cerdas berbasis statistik pemain menggunakan AI.
- **Sertifikat & Rapor**: Generator rapor PDF tingkat lanjut menggunakan integrasi data evaluasi.
- **Audit & Keamanan**: Log audit operasional dan manajemen pengguna terpusat.

### 👨‍👩‍👧 Parent Portal
- **Dashboard Akses Orang Tua**: Portal khusus bagi orang tua untuk memantau performa anak.
- **Rapor & Evaluasi**: Akses ke evaluasi pelatih, statistik kehadiran, sertifikat, dan fitur unduh rapor dalam format PDF.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Bahasa:** TypeScript
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Autentikasi:** NextAuth.js
- **Styling & UI:** Tailwind CSS 4, shadcn/ui, Lucide React
- **State Management:** React Query, Zod, React Hook Form
- **Testing:** Playwright (E2E), Vitest (Integration)

---

## 📂 Struktur Proyek

```text
src/
  app/                 Routing App Router (Public, Admin, Parent)
  actions/             Server Actions (Mutasi Data, AI Notes, dll)
  components/          UI reusables (shadcn/ui) dan Feature Components
  hooks/               React Query hooks & utilitas sisi Client
  lib/                 Konfigurasi utilitas (Auth, Prisma, Evaluasi, Metrik, PDF)
prisma/
  migrations/          Riwayat migrasi skema database
  seed.ts              Seed data awal
tests/
  integration/         Vitest (Integration Tests)
  *.spec.ts            Playwright (E2E Tests)
public/                Aset statis (Gambar, Template PDF, dll)
```

---

## 🚀 Panduan Memulai (Development)

### Prasyarat
- Node.js 20+
- npm
- PostgreSQL (Lokal atau Supabase Postgres)

### Instalasi

```bash
git clone <repository-url>
cd adora-bc
npm install
```

### Konfigurasi Environment

Salin file `.env.example` menjadi `.env` dan sesuaikan kredensial Anda.

```bash
cp .env.example .env
```

**Variabel Utama:**
- `DATABASE_URL`: Koneksi runtime aplikasi.
- `DIRECT_URL`: Koneksi direct untuk eksekusi Prisma CLI & Migrasi.
- `SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role (Wajib dijaga kerahasiaannya, untuk akses storage private).
- `NEXTAUTH_SECRET`: Secret token untuk sesi otentikasi.
- `NEXTAUTH_URL`: URL utama aplikasi (misal: `http://localhost:3000`).

*(Silakan merujuk pada file `.env.example` untuk daftar lengkap variabel opsional seperti E2E credentials, Observability, dll).*

### Setup Database

Jalankan perintah berikut untuk menginisialisasi database lokal:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

*Catatan: Gunakan `npx prisma migrate dev` jika Anda ingin membuat file migrasi baru setelah mengubah `schema.prisma`.*

### Menjalankan Aplikasi

```bash
npm run dev
```

Aplikasi dapat diakses melalui `http://localhost:3000`.

---

## 📜 Script Utama

| Perintah | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan *development server*. |
| `npm run build` | Membuat *production build*. |
| `npm run start` | Menjalankan *production server*. |
| `npm run lint` | Melakukan pengecekan linter pada kode. |
| `npm run test:integration`| Menjalankan *integration tests* via Vitest. |
| `npm run test:e2e` | Menjalankan *End-to-End tests* via Playwright. |
| `npm run smoke:check` | Verifikasi *smoke test* pada *production/staging*. |
| `npm run seed` | Mengisi database dengan data awal / *dummy*. |

---

## 🔒 Standar Keamanan & Praktik Terbaik
- **Role-Based Access Control (RBAC)** diimplementasikan di sisi *Client* maupun *Server* untuk mengunci fungsi khusus Admin/Coach.
- **Penyimpanan Terproteksi**: File rahasia / unggahan menggunakan integrasi **Private Supabase Storage ACL**, dilayani lewat *proxy* internal (`/api/storage/...`) tanpa mengekspos *bucket URL* secara langsung ke luar. Aturan ACL tercatat pada `docs/SUPABASE_STORAGE_AND_ACL.md`.
- **Anti-Injection**: Seluruh input formulir disanitasi dan divalidasi secara kuat & *type-safe* menggunakan ekosistem **Zod** dan utilitas *clamp* internal.

## ✅ Verifikasi Pra-Commit
Sangat disarankan untuk selalu menjalankan perintah berikut sebelum melakukan integrasi (*Push/Merge*):

```bash
npm run lint
npm run test:integration
```
Jika terdapat perubahan UI yang krusial atau major, pastikan E2E berjalan mulus:
```bash
npm run test:e2e
```
