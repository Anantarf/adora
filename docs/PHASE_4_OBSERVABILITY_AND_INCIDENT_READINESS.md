# Phase 4 Observability And Incident Readiness

## Tujuan

Phase 4 difokuskan untuk menjawab pertanyaan operasional paling penting:

- kalau ada masalah, sinyalnya muncul di mana
- bagaimana membedakan warning vs error sistem
- bagaimana melihat ringkasan masalah tanpa menelusuri console manual satu per satu

Target phase ini bukan sekadar menambah log, tapi membuat incident lebih cepat dideteksi dan lebih cepat didiagnosis.

## Masalah Sebelum Phase 4

Sebelum perubahan ini:

- banyak titik error masih langsung `console.error`
- format log belum konsisten antar route/action
- tidak ada penyimpanan terstruktur untuk event operasional penting
- slow query warning hanya muncul di console
- tidak ada snapshot terpusat untuk melihat error event, warning, dan web vitals buruk dalam satu jendela waktu

Akibatnya, project sudah cukup production-capable, tapi incident analysis masih terlalu bergantung pada log mentah dan pengecekan manual.

## Perubahan Yang Dikerjakan

### 1. Menambahkan Storage Khusus untuk Event Operasional

Perubahan di [prisma/schema.prisma](../prisma/schema.prisma) dan migration [20260527043000_add_operational_event](../prisma/migrations/20260527043000_add_operational_event/migration.sql):

- ditambahkan model `operationalEvent`
- event menyimpan:
  - `severity`
  - `source`
  - `message`
  - `statusCode`
  - `durationMs`
  - `fingerprint`
  - `metadata`
  - `createdAt`

Kenapa penting:

- error/warning penting sekarang tidak hanya lewat console
- observability punya storage yang terpisah dari audit log bisnis
- query operasional jadi lebih mudah dan tidak tercampur dengan CRUD history user

### 2. Menambahkan Helper Observability Terpusat

Perubahan di [src/lib/observability.ts](../src/lib/observability.ts):

- ditambahkan helper:
  - `recordOperationalEvent`
  - `recordOperationalWarning`
  - `recordOperationalError`
- helper melakukan normalisasi source, message, fingerprint, dan metadata
- kegagalan menyimpan observability event tidak mematikan flow utama

Kenapa penting:

- route/action tidak perlu menulis pola logging manual yang berbeda-beda
- severity dan source jadi lebih konsisten lintas fitur

### 3. Slow Query Prisma Sekarang Bisa Dipantau Secara Persisten

Perubahan di [src/lib/prisma.ts](../src/lib/prisma.ts):

- listener slow query tetap aktif lewat `PRISMA_SLOW_QUERY_THRESHOLD_MS`
- sekarang slow query juga disimpan ke `operationalEvent`
- query pada tabel `OperationalEvent` sendiri diabaikan agar tidak memicu loop logging

Kenapa penting:

- slow query tidak lagi hilang setelah console tertutup
- ada jejak yang bisa dianalisis untuk insiden performa nyata

### 4. Titik Failure Penting Sekarang Mengirim Event Operasional

Perubahan di:

- [src/lib/auth.ts](../src/lib/auth.ts)
- [src/app/api/upload/route.ts](../src/app/api/upload/route.ts)
- [src/app/api/export/registrations/route.ts](../src/app/api/export/registrations/route.ts)
- [src/app/api/analytics/web-vitals/route.ts](../src/app/api/analytics/web-vitals/route.ts)
- [src/app/api/health/db/route.ts](../src/app/api/health/db/route.ts)

Yang sekarang dicatat secara terstruktur:

- lockout login dan kegagalan limiter auth
- error lookup/compare auth yang sifatnya sistem
- upload rate-limit, timeout storage, storage misconfiguration, dan upload failure umum
- export registrations yang diblok karena dataset terlalu besar
- error persist web vitals
- database health check failure

Kenapa penting:

- warning dan error yang paling dekat ke incident sekarang punya jejak konsisten
- operator tidak perlu menebak konteks hanya dari message console

### 5. Snapshot Observability untuk Admin dan Health Ops

Perubahan di:

- [src/lib/observability-snapshot.ts](../src/lib/observability-snapshot.ts)
- [src/actions/observability.ts](../src/actions/observability.ts)
- [src/app/api/health/observability/route.ts](../src/app/api/health/observability/route.ts)

Kemampuan baru:

- agregasi event operasional per `source` dan `severity`
- daftar event warning/error terbaru
- ringkasan web vitals buruk per metric/rating
- endpoint health observability yang bisa dipanggil secara token-protected untuk monitoring eksternal

Kenapa penting:

- sekarang ada cara standar untuk melihat “apa yang rusak” dalam jendela waktu tertentu
- health checking tidak lagi terbatas pada `db up/down`, tapi bisa memberi konteks kualitas sistem

## Test Yang Ditambahkan

File baru:

- [tests/integration/observability.test.ts](../tests/integration/observability.test.ts)

Cakupan baru:

- snapshot observability menggabungkan event operasional dan web vitals dengan benar
- clamp window snapshot tetap berada di batas aman

Total suite integration setelah Phase 4:

- 6 test files
- 15 tests passing

## Verifikasi Yang Dijalankan

Semua gate berikut lulus setelah perubahan:

- `npx prisma generate`
- `npx prisma migrate deploy`
- `npm run lint`
- `npm run test:integration`
- `npm run build`

## Yang Sudah Lebih Baik Setelah Phase 4

- observability tidak lagi tersebar sebagai console log mentah
- project sekarang punya event store operasional yang bisa di-query
- slow query dan beberapa failure penting tidak lagi bersifat ephemeral
- ada snapshot siap pakai untuk triage insiden
- health monitoring sekarang bisa membawa konteks, bukan hanya status database

## Batas Yang Masih Perlu Diingat

Phase 4 ini sudah kuat sebagai baseline observability, tapi belum berarti seluruh operasi sudah mature penuh.

Yang masih bisa dikembangkan di fase berikutnya:

- dashboard admin khusus observability jika nanti dibutuhkan UI visual
- alerting eksternal ke provider seperti email, webhook, atau observability platform
- sampling atau retention policy jika volume event operasional mulai tinggi
- korelasi request ID lintas route bila traffic dan kompleksitas naik lebih jauh

## Judgement Setelah Phase 4

Setelah phase ini, project naik dari:

`issues can be discovered if someone manually reads logs`

menjadi:

`important issues leave structured signals that can be triaged intentionally`

Itu pergeseran besar, karena battle-tested system tidak hanya kuat saat jalan normal, tapi juga cepat memberi tahu saat ada sesuatu yang mulai rusak.
