# Phase 5 Release Safety

## Tujuan

Phase 5 difokuskan untuk memastikan deploy bukan momen judi.

Target utamanya:

- ada pemeriksaan env penting sebelum release
- ada smoke test pasca-deploy yang bisa dijalankan cepat
- ada checklist deploy dan rollback yang jelas
- build warning yang mengganggu sinyal production dibersihkan

## Masalah Sebelum Phase 5

Sebelum phase ini:

- release masih terlalu mengandalkan ingatan manual
- belum ada script sederhana untuk memvalidasi env production yang wajib
- belum ada smoke test standar setelah deploy
- build masih menampilkan warning `z-index is currently not supported.` yang menurunkan kualitas sinyal build

## Perubahan Yang Dikerjakan

### 1. Guard Env Production Sebelum Release

Perubahan di [src/lib/release-safety.ts](../src/lib/release-safety.ts) dan [scripts/release-check.ts](../scripts/release-check.ts):

- ditambahkan helper untuk memvalidasi env penting production
- script `npm run release:check` sekarang mengecek variabel wajib seperti:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `HEALTH_CHECK_TOKEN`

Kenapa penting:

- kesalahan konfigurasi yang paling berbahaya sekarang bisa ketahuan sebelum deploy
- release checklist tidak lagi bergantung pada ingatan operator

### 2. Smoke Test Pasca-Deploy

Perubahan di [scripts/smoke-check.ts](../scripts/smoke-check.ts) dan [package.json](../package.json):

- ditambahkan script `npm run smoke:check`
- smoke test mengecek:
  - homepage
  - login page
  - register page
  - `/api/health/db`
  - `/api/health/observability`

Input utama:

- `SMOKE_BASE_URL` atau fallback ke `NEXTAUTH_URL`
- `HEALTH_CHECK_TOKEN`

Kenapa penting:

- sesudah deploy ada cara cepat untuk validasi bahwa route inti dan health endpoint benar-benar hidup
- operator tidak perlu menebak endpoint mana yang wajib dicek manual

### 3. Environment Example Lebih Siap Production

Perubahan di [.env.example](../.env.example):

- ditambahkan `HEALTH_CHECK_TOKEN`
- ditambahkan `PRISMA_SLOW_QUERY_THRESHOLD_MS`
- ditambahkan `SMOKE_BASE_URL`

Kenapa penting:

- env contoh sekarang lebih mencerminkan kebutuhan production yang nyata
- onboarding deploy jadi lebih rapi

### 4. Warning Build `z-index is currently not supported.` Dibersihkan

Perubahan di [src/app/opengraph-image.tsx](../src/app/opengraph-image.tsx):

- properti `zIndex` di image generator `next/og` dihapus
- layering tetap aman karena urutan elemen sudah cukup untuk background dan foreground

Kenapa penting:

- build kembali lebih bersih
- warning yang tersisa jadi lebih berarti jika nanti muncul lagi

## Checklist Deploy Ringkas

Urutan aman yang sekarang saya sarankan:

1. jalankan `npm run release:check`
2. jalankan `npm run lint`
3. jalankan `npm run test:integration`
4. jalankan `npm run build`
5. apply migration dengan `npx prisma migrate deploy`
6. deploy aplikasi
7. jalankan `npm run smoke:check`

## Checklist Rollback Ringkas

Kalau sesudah deploy ada masalah:

1. jalankan `npm run smoke:check` untuk memastikan titik gagal
2. cek `/api/health/db` dan `/api/health/observability`
3. lihat `operationalEvent` untuk warning/error terbaru
4. rollback ke release stabil terakhir
5. jika masalah terkait migration, cek apakah perubahan schema bersifat backward compatible sebelum rollback app-only

## Test Yang Ditambahkan

File baru:

- [tests/integration/release-safety.test.ts](../tests/integration/release-safety.test.ts)

Cakupan baru:

- helper env release mendeteksi variabel wajib yang hilang
- normalisasi base URL untuk smoke test

Total suite integration setelah Phase 5:

- 7 test files
- 17 tests passing

## Verifikasi Yang Dijalankan

Semua gate berikut lulus setelah perubahan:

- `npm run release:check`
- `npm run lint`
- `npm run test:integration`
- `npm run build`

Catatan:

- `npm run smoke:check` disiapkan untuk environment yang sudah running dan punya base URL yang bisa diakses, jadi script ini bukan gate build lokal murni.

## Judgement Setelah Phase 5

Setelah phase ini, project naik dari:

`deployable with caution`

menjadi:

`deployable with a repeatable release safety baseline`

Ini penting karena battle-tested system bukan cuma cepat dan aman saat coding, tapi juga punya ritual deploy yang konsisten, bisa divalidasi, dan tidak bergantung pada keberuntungan operator.
