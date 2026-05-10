# ADORA Basketball Club (Adora BBC)

Sistem Informasi Manajemen Terpadu untuk Adora Basketball Club, klub bola basket terdepan di Depok. Aplikasi ini mencakup *Landing Page* publik, *Parent Portal* untuk orang tua pemain, serta *Admin Dashboard* untuk manajemen operasional klub secara menyeluruh.

## 🌟 Fitur Utama

### 1. Landing Page & Registrasi Online
- Profil klub, program pembinaan, dan informasi jadwal latihan.
- Formulir pendaftaran pemain baru secara online.
- Galeri foto dinamis dan informasi turnamen (ASBC & ABCC).

### 2. Admin Dashboard (Manajemen Klub)
- **Manajemen Pemain:** Pencatatan data pemain, kelompok latihan, dan fitur *Batch Upload* data via Excel.
- **Jadwal & Absensi:** Kalender jadwal latihan (*Event Calendar*) dan pencatatan absensi yang terintegrasi.
- **Evaluasi & Rapor:** Pencatatan metrik performa pemain secara berkala dan generator Rapor Evaluasi otomatis berformat PDF.
- **Sistem Audit:** Log aktivitas (*Audit Trail*) untuk memantau perubahan data penting oleh admin.

### 3. Parent Portal
- Orang tua dapat melihat jadwal latihan anak secara langsung.
- Memantau rekap kehadiran dan tren statistik evaluasi pelatih.

## 🛠️ Tech Stack

Proyek ini dibangun menggunakan arsitektur modern berstandar *Enterprise*:

- **Framework:** Next.js 16 (App Router)
- **Bahasa:** TypeScript
- **Database & ORM:** PostgreSQL dengan Prisma ORM
- **Styling:** Tailwind CSS 4 & Shadcn UI (Radix Primitives)
- **State Management (Client):** React Query (@tanstack/react-query)
- **Validasi Form:** Zod & React-Hook-Form
- **Lainnya:** Sharp (Image Compression), jsPDF (PDF Generation)

## 🚀 Panduan Instalasi (Development)

### Prasyarat
- Node.js versi 20+
- npm atau pnpm
- Database PostgreSQL (Lokal atau Cloud seperti Neon/Supabase)

### Langkah-langkah

1. **Clone repositori**
   ```bash
   git clone <repo-url>
   cd adora-bc
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Buat file `.env` di *root* direktori dan sesuaikan dengan contoh `.env.example` (jika ada):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/adorabc?schema=public"
   ```

4. **Setup Database (Prisma)**
   Jalankan migrasi database dan *seeding* data awal:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

## 🧹 Maintenance & Code Quality

Proyek ini menggunakan prinsip *Declarative UI* dan secara rutin diaudit untuk memastikan kode tetap *lean* dan bebas *technical debt*. 
- **Tidak ada file usang (Orphaned files)**
- **Aset gambar dioptimasi** (Gunakan `node compress.mjs` di direktori root untuk otomatisasi kompresi batch).
- **Virtualisasi/Memoization** diterapkan pada tabel data padat untuk mencegah *bottleneck* re-render (contoh: di `StatisticsPage`).

---
*© 2026 Adora Basketball Club. All rights reserved.*
