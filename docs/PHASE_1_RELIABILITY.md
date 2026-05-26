# Phase 1 Reliability

## Tujuan

Phase 1 difokuskan untuk memperkuat `failure path` yang paling mungkin menimbulkan incident nyata di production.

Target utamanya:

- jalur error tidak bocor sebagai error database/storage mentah
- route berat punya respons yang lebih tegas saat input/configuration salah
- auth tidak ikut rapuh hanya karena komponen pendukung rate limit bermasalah
- skenario gagal penting mulai dijaga dengan test

## Area Yang Dikerjakan

### 1. Login / Auth Hardening

Perubahan di [src/lib/auth.ts](../src/lib/auth.ts):

- login failure limiter sekarang `best effort`
- kegagalan baca/tulis bucket limiter tidak otomatis mematikan login flow
- password compare error dan user lookup error sekarang dipetakan ke pesan service error yang lebih aman
- login menolak akun yang sudah `isDeleted`
- pesan kredensial gagal diseragamkan menjadi `Username atau sandi tidak valid.`

Kenapa penting:

- dependency tambahan seperti rate-limit bucket tidak boleh menjatuhkan jalur login yang sebenarnya masih bisa berjalan
- production login lebih aman dari account enumeration sederhana
- error bcrypt / query auth tidak lagi berpotensi bocor sebagai pesan internal

### 2. Upload Route Hardening

Perubahan di [src/app/api/upload/route.ts](../src/app/api/upload/route.ts):

- client Supabase sekarang dibuat secara lazy dan memvalidasi env lebih dulu
- ada guard eksplisit untuk storage yang belum dikonfigurasi
- upload storage dibungkus timeout agar request tidak menggantung terlalu lama
- timeout storage dibalas dengan `503` yang lebih spesifik

Kenapa penting:

- misconfiguration production sekarang lebih cepat terdeteksi
- storage outage atau latency tinggi tidak lagi terasa seperti error generik tanpa konteks

### 3. Export Registrations Hardening

Perubahan di [src/app/api/export/registrations/route.ts](../src/app/api/export/registrations/route.ts):

- filter export sekarang divalidasi eksplisit
- unauthorized dan internal error dibalas dalam format JSON yang konsisten
- jalur error export lebih ramah untuk UI yang memanggil via `fetch`

Kenapa penting:

- route export tidak lagi diam-diam menganggap filter aneh sebagai `all`
- UI export bisa membedakan error input vs error server

### 4. PDF Report Hardening

Perubahan di [src/app/api/report/pdf/route.ts](../src/app/api/report/pdf/route.ts):

- role actor divalidasi eksplisit
- `playerId` yang kosong atau whitespace ditolak lebih awal
- akses ke laporan lebih ketat terhadap caller yang tidak valid

Kenapa penting:

- route report tidak terlalu percaya pada asumsi shape session/request
- invalid request dipotong sebelum masuk ke query utama

### 5. Attendance / Statistic Action Hardening

Perubahan di [src/actions/stats.ts](../src/actions/stats.ts):

- payload submit attendance sekarang divalidasi dengan schema
- agenda presensi diverifikasi dulu sebelum `upsert`
- payload submit statistic sekarang divalidasi dengan schema
- pemain untuk input nilai diverifikasi dulu sebelum transaksi lanjut
- beberapa skenario yang sebelumnya rawan jatuh ke foreign-key / Prisma error sekarang punya domain error yang jelas

Kenapa penting:

- battle-tested app tidak boleh mengandalkan constraint failure sebagai UX utama
- caller sekarang menerima error domain yang bisa dipahami operator/admin

## Test Yang Ditambahkan

File baru:

- [tests/integration/stats.test.ts](../tests/integration/stats.test.ts)

Cakupan baru:

- presensi gagal jika agenda tidak ditemukan
- input nilai gagal jika pemain tidak ditemukan
- input nilai gagal jika payload tidak valid

## Verifikasi Yang Dijalankan

Semua gate berikut lulus setelah perubahan:

- `npm run lint`
- `npm run test:integration`
- `npm run build`

## Yang Sudah Lebih Baik Setelah Phase 1

- error production lebih banyak berubah dari `raw infra failure` menjadi `domain-aware failure`
- route yang menyentuh service eksternal lebih sadar pada config dan timeout
- jalur submit penting tidak lagi terlalu percaya pada foreign-key failure
- auth lebih tahan terhadap masalah pada komponen pendukung

## Yang Belum Selesai Di Phase 1

Phase 1 ini kuat sebagai baseline, tapi belum berarti semua failure path sudah battle-tested.

Yang masih tersisa untuk phase lanjutan:

- test route handler untuk upload/export/report secara lebih eksplisit
- retry/backoff strategy kalau storage atau database flakey
- klasifikasi error yang lebih terstruktur lintas route/action
- observability untuk error rate per endpoint, bukan hanya log/manual check
- failure path untuk jalur UI client yang melakukan fetch langsung

## Judgement Setelah Phase 1

Setelah hardening ini, project lebih siap menghadapi error yang tidak bersahabat.
Belum sempurna, tapi sudah naik dari:

`happy-path focused`

menjadi:

`mulai production-defensive`

Itu langkah yang penting sebelum lanjut ke hardening auth/data lebih dalam dan validasi skala.
