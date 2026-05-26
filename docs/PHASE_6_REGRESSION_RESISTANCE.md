# Phase 6 Regression Resistance

## Tujuan

Phase 6 difokuskan untuk membuat perubahan besar makin sulit merusak flow inti tanpa ketahuan.

Target utamanya:

- ada `must-pass suite` yang jelas sebelum push/deploy
- flow publik paling penting punya baseline E2E otomatis
- verifikasi tidak lagi tersebar sebagai ritual manual

## Masalah Sebelum Phase 6

Sebelum phase ini:

- integration test sudah kuat untuk hardening server-side
- ada E2E publik, tapi belum dibingkai sebagai suite kritikal yang wajib lolos
- Playwright belum otomatis menyalakan local server
- belum ada satu command yang mewakili “kalau ini hijau, core flow paling penting relatif aman”

## Perubahan Yang Dikerjakan

### 1. Menyalakan Web Server Otomatis untuk E2E

Perubahan di [playwright.config.ts](../playwright.config.ts):

- Playwright sekarang otomatis menjalankan `npm run start`
- local server akan dipakai ulang jika sudah aktif
- timeout startup dinaikkan agar lebih tahan pada boot aplikasi

Kenapa penting:

- E2E tidak lagi bergantung pada server yang dinyalakan manual
- command test jadi lebih repeatable untuk developer lain dan CI
- jalur browser test lebih dekat ke perilaku production dibanding dev compile on demand

### 2. Menandai Core E2E sebagai `@critical`

Perubahan di:

- [tests/landing.spec.ts](../tests/landing.spec.ts)
- [tests/login.spec.ts](../tests/login.spec.ts)
- [tests/register.spec.ts](../tests/register.spec.ts)

Flow kritikal yang sekarang dijaga:

- landing page mengarahkan user ke register dan login
- login page tetap merender form dan menampilkan error invalid credentials
- registration public flow tetap bisa selesai sampai state sukses

Kenapa penting:

- flow yang paling mudah terlihat user publik sekarang punya penjaga regression yang eksplisit
- suite kritikal bisa dijalankan tanpa harus mengeksekusi seluruh E2E nanti

### 3. Menambahkan `must-pass suite`

Perubahan di [package.json](../package.json):

- `npm run test:e2e:critical`
- `npm run test:critical`

Makna command:

- `test:e2e:critical` menjalankan hanya E2E yang diberi tag `@critical`
- `test:e2e:critical` otomatis build dulu sebelum menjalankan Playwright
- `test:critical` menjalankan:
  - `npm run test:integration`
  - `npm run test:e2e:critical`

Kenapa penting:

- sekarang ada satu command yang jelas untuk validasi core regression sebelum push/deploy
- tim tidak perlu mengingat kombinasi command secara manual

## Recommended Must-Pass Gate

Untuk perubahan normal yang menyentuh logic penting, gate minimal yang saya sarankan sekarang:

1. `npm run lint`
2. `npm run test:critical`
3. `npm run build`

Untuk release penuh:

1. `npm run release:check`
2. `npm run lint`
3. `npm run test:critical`
4. `npm run build`
5. `npx prisma migrate deploy`
6. `npm run smoke:check`

## Batas Saat Ini

Phase 6 ini sudah membuat baseline regression lebih nyata, tapi belum berarti semua alur bisnis kompleks sudah punya E2E penuh.

Yang masih terbuka:

- flow admin authenticated
- flow parent authenticated
- flow player management, attendance, dan statistics secara E2E penuh

Alur itu masih layak dikerjakan nanti jika kita menambahkan seed/auth fixture yang stabil untuk browser test.

## Verifikasi Yang Dijalankan

Semua gate berikut lulus setelah perubahan:

- `npm run lint`
- `npm run test:integration`
- `npm run test:e2e:critical`
- `npm run test:critical`
- `npm run build`

## Judgement Setelah Phase 6

Setelah phase ini, project naik dari:

`tests exist, but the critical release gate is still implicit`

menjadi:

`core public flows and server hardening now have an explicit must-pass regression gate`

Itu penting karena battle-tested project bukan cuma punya test, tapi tahu test mana yang wajib hijau sebelum perubahan dianggap aman.
