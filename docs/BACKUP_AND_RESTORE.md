# Backup And Restore

## Tujuan

Dokumen ini jadi runbook minimum untuk memastikan database production bisa dicadangkan, diverifikasi, dan dipulihkan tanpa improvisasi saat incident.

## Prinsip

- backup harus rutin, bukan reaktif
- restore harus pernah diuji, bukan hanya diasumsikan bisa
- backup yang tidak pernah diverifikasi belum bisa dianggap aman

## Minimum Yang Saya Sarankan

Untuk stack ADORA BBC berbasis Supabase Postgres:

1. Aktifkan backup otomatis yang disediakan provider.
2. Simpan salinan logical backup berkala untuk titik pemulihan yang bisa dipegang operator.
3. Lakukan restore rehearsal ke database non-production secara berkala.

## Data Yang Harus Dianggap Kritis

- data pengguna admin dan parent
- data pemain
- attendance
- statistics dan history
- certificates metadata
- club settings
- operational event dan web vitals jika dipakai untuk investigasi

## Sumber Koneksi

Gunakan `DIRECT_URL` untuk tooling backup atau restore yang butuh koneksi Postgres langsung.

Hindari memakai `DATABASE_URL` pooler untuk operasi dump/restore berat.

## Contoh Backup Logical

Gate repo yang bisa dijalankan:

```bash
npm run ops:backup-rehearsal
```

Script ini akan:

- memastikan `pg_dump` dan `pg_restore` tersedia
- membuat backup schema-only ke `output/backups/`
- membaca ulang dump dengan `pg_restore --list`
- menjalankan restore ke target non-production jika `RESTORE_REHEARSAL_DATABASE_URL` dan konfirmasi eksplisit diisi

Dengan `pg_dump`:

```powershell
pg_dump --dbname="$env:DIRECT_URL" --format=custom --file="backup-adora-$(Get-Date -Format yyyyMMdd-HHmmss).dump"
```

Alternatif plain SQL:

```powershell
pg_dump --dbname="$env:DIRECT_URL" --format=plain --file="backup-adora-$(Get-Date -Format yyyyMMdd-HHmmss).sql"
```

## Contoh Restore Rehearsal

Buat database target non-production, lalu jalankan:

```env
RESTORE_REHEARSAL_DATABASE_URL="postgresql://user:password@host:5432/postgres"
RESTORE_REHEARSAL_CONFIRM="I_UNDERSTAND_THIS_TARGET_WILL_BE_CLEANED"
```

```powershell
pg_restore --clean --if-exists --no-owner --dbname="postgresql://user:password@host:5432/postgres" "backup-adora-20260527-120000.dump"
```

Kalau format backup berupa SQL plain:

```powershell
psql "postgresql://user:password@host:5432/postgres" -f "backup-adora-20260527-120000.sql"
```

## Verifikasi Setelah Restore

Minimal cek hal berikut:

1. `npx prisma migrate status`
2. `npm run release:check`
3. `npm run smoke:check`
4. login admin dan parent
5. akses route berat seperti `/dashboard`, `/parent`, dan report PDF

## Jadwal Yang Disarankan

- backup otomatis provider: harian
- logical backup manual atau terjadwal: harian atau mingguan, tergantung frekuensi perubahan data
- restore rehearsal: minimal bulanan

## Hal Yang Mudah Kelewat

- backup ada, tapi retention terlalu pendek
- restore belum pernah diuji
- backup sukses, tapi tidak ada notifikasi kalau gagal
- file backup tidak dienkripsi atau lokasinya terlalu longgar
- operator tidak tahu versi schema saat backup diambil

## Checklist Singkat Saat Incident

Kalau butuh restore:

1. hentikan perubahan yang berisiko memperparah data
2. identifikasi titik waktu aman yang mau dipulihkan
3. putuskan restore penuh atau pemulihan selektif
4. restore ke database staging dulu jika waktu memungkinkan
5. verifikasi smoke dan login dasar
6. baru arahkan traffic kembali
