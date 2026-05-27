# ADORA Basketball Club

Sistem manajemen klub basket untuk ADORA Basketball Club. Proyek ini mencakup landing page publik, formulir pendaftaran, portal orang tua, dan dashboard admin untuk operasional klub.

## Cakupan Fitur

- Landing page klub dengan program latihan, homebase, galeri, dan CTA pendaftaran.
- Form pendaftaran online untuk calon pemain baru.
- Dashboard admin untuk pemain, kelompok, jadwal, absensi, statistik, sertifikat, audit log, pengaturan, dan akun pengguna.
- Parent portal untuk melihat evaluasi, kehadiran, sertifikat, dan unduh rapor PDF.
- Upload asset rapor dan generator PDF berbasis data evaluasi pemain.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- PostgreSQL
- Prisma ORM
- NextAuth
- Tailwind CSS 4
- React Query
- Zod + React Hook Form
- Playwright + Vitest

## Struktur Singkat

```text
src/
  app/                 route App Router
  actions/             server actions
  components/          UI dan feature components
  hooks/               react-query hooks dan utilitas client
  lib/                 auth, prisma, pdf, constants, helpers
prisma/
  migrations/          riwayat migrasi database
  seed.ts              seed data awal
tests/
  integration/         test Vitest
  *.spec.ts            test Playwright
public/
  assets statis publik
```

## Menjalankan Project

### Prasyarat

- Node.js 20 atau lebih baru
- npm
- PostgreSQL atau Supabase Postgres

### Instalasi

```bash
npm install
```

### Environment

Salin `.env.example` menjadi `.env`, lalu isi nilainya sesuai environment Anda.

```bash
copy .env.example .env
```

Variable yang dipakai:

- `DATABASE_URL`: koneksi aplikasi/runtime
- `DIRECT_URL`: koneksi direct untuk Prisma CLI dan migration
- `SUPABASE_URL`: URL project Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: URL publik Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: service role key untuk upload asset
- `NEXTAUTH_SECRET`: secret NextAuth
- `NEXTAUTH_URL`: base URL aplikasi, untuk production gunakan `https://adorabbc.com`
- `DEFAULT_RESET_PASSWORD`: password default reset akun
- `HEALTH_CHECK_TOKEN`: token untuk endpoint health check
- `PRISMA_SLOW_QUERY_THRESHOLD_MS`: threshold slow query observability dalam milidetik
- `SMOKE_BASE_URL`: URL yang dipakai smoke test, untuk production gunakan `https://adorabbc.com`

### Setup Database

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

Untuk development lokal yang membuat migrasi baru:

```bash
npx prisma migrate dev
```

### Menjalankan App

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Script Penting

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:integration
npm run test:e2e
npm run seed
npm run repair:group-meta:dry
npm run repair:group-meta
```

## Kualitas Repo

Kondisi repo sekarang sudah lebih rapi:

- file eksperimen lokal di root sudah dibuang
- artefak hasil Playwright di `output/` tidak lagi disimpan di git
- lint sudah bersih
- integration test aktif dan terpisah dari Playwright
- Prisma migration untuk shared rate limit sudah ada dan dipakai repo

## Catatan Pengembangan

- Untuk operasi Prisma CLI, repo ini memprioritaskan `DIRECT_URL` lewat `prisma.config.ts`.
- Asset PDF template yang memang dipakai aplikasi disimpan di `public/`.
- Folder seperti `.next/`, `playwright-report/`, `test-results/`, dan `output/` dianggap artefak lokal dan tidak perlu di-commit.

## Verifikasi Disarankan

Sebelum push perubahan besar:

```bash
npm run lint
npm run test:integration
```

Kalau ada perubahan alur UI penting, lanjutkan dengan:

```bash
npm run test:e2e
```
