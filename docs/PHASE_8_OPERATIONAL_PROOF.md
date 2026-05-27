# Phase 8 Operational Proof

## Tujuan

Phase 8 difokuskan untuk mengubah readiness dari sekadar checklist menjadi bukti operasional yang bisa dijalankan.

Targetnya:

- smoke check production benar-benar dicoba
- alert provider punya gate verifikasi
- backup rehearsal punya command standar
- gap yang tersisa terlihat jelas sebagai pekerjaan operasional, bukan dugaan

## Perubahan Yang Dikerjakan

### 1. Smoke Check Membaca `.env`

Perubahan di [scripts/smoke-check.ts](../scripts/smoke-check.ts):

- script sekarang load `.env` lewat `dotenv/config`
- `SMOKE_BASE_URL` dan `HEALTH_CHECK_TOKEN` lokal bisa langsung dipakai

Hasil terbaru:

- homepage production: pass
- login page production: pass
- register page production: pass
- health db: `401`
- health observability: `401`

Interpretasi:

route publik production sudah hidup, tetapi `HEALTH_CHECK_TOKEN` di deployment production belum cocok dengan token lokal atau belum dipasang.

### 2. Alert Provider Check

Perubahan di [scripts/alert-check.ts](../scripts/alert-check.ts):

- command baru `npm run ops:alert-check`
- mengirim synthetic alert ke `ALERT_WEBHOOK_URL`
- gagal eksplisit jika webhook belum diisi atau provider menolak request

Status saat ini:

- belum bisa dibuktikan karena `ALERT_WEBHOOK_URL` belum diisi

### 3. Backup Rehearsal Check

Perubahan di [scripts/backup-rehearsal-check.ts](../scripts/backup-rehearsal-check.ts):

- command baru `npm run ops:backup-rehearsal`
- memeriksa keberadaan `pg_dump` dan `pg_restore`
- membuat backup schema-only ke `output/backups/`
- membaca ulang dump dengan `pg_restore --list`
- jika target restore non-production disediakan, bisa menjalankan restore rehearsal eksplisit

Status saat ini:

- belum bisa dijalankan penuh karena `pg_dump` dan `pg_restore` belum tersedia di PATH mesin ini

## Checklist Untuk Naik Lagi

1. Pasang `HEALTH_CHECK_TOKEN` yang sama di deployment production.
2. Jalankan ulang `npm run smoke:check` sampai semua endpoint pass.
3. Isi `ALERT_WEBHOOK_URL`, `ALERT_MIN_SEVERITY`, dan `ALERT_COOLDOWN_MS`.
4. Jalankan `npm run ops:alert-check` sampai synthetic alert diterima provider.
5. Install PostgreSQL client tools agar `pg_dump` dan `pg_restore` tersedia.
6. Jalankan `npm run ops:backup-rehearsal`.
7. Siapkan database non-production dan jalankan restore rehearsal penuh dengan `RESTORE_REHEARSAL_DATABASE_URL`.

## Judgement Setelah Phase 8

Project sudah naik secara kualitas karena sekarang gap operasional punya gate yang bisa dijalankan.

Yang belum selesai bukan lagi code path utama, melainkan bukti eksternal:

- production health token parity
- provider alert nyata
- PostgreSQL backup tooling
- restore rehearsal ke target non-production

Ini lebih sehat daripada sebelumnya, karena kita sekarang tahu persis apa yang belum terbukti dan command apa yang dipakai untuk membuktikannya.
