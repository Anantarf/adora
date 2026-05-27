# Alerting And Incident Response

## Tujuan

Dokumen ini merangkum cara memakai observability ADORA BBC sebagai sistem operasional nyata, bukan hanya tabel log.

## Sumber Sinyal Saat Ini

Repo sekarang sudah punya:

- `operationalEvent` untuk warning dan error penting
- `webVitalEvent` untuk metrik client real-user
- `/api/health/db`
- `/api/health/observability`
- optional external webhook alert lewat `ALERT_WEBHOOK_URL`

## Env Yang Relevan

- `HEALTH_CHECK_TOKEN`
- `PRISMA_SLOW_QUERY_THRESHOLD_MS`
- `ALERT_WEBHOOK_URL`
- `ALERT_MIN_SEVERITY`
- `ALERT_COOLDOWN_MS`

## Rekomendasi Default

Untuk baseline production yang aman:

- `ALERT_MIN_SEVERITY="ERROR"`
- `ALERT_COOLDOWN_MS="300000"`
- health endpoint dipantau dari uptime monitor eksternal
- jalankan `npm run ops:alert-check` setelah `ALERT_WEBHOOK_URL` diisi untuk membuktikan provider menerima alert

Kalau tim sudah siap menerima warning operasional lebih ramai:

- ubah `ALERT_MIN_SEVERITY` ke `WARN`

## Payload Alert

Webhook alert membawa data berikut:

- nama aplikasi
- environment
- waktu kejadian
- severity
- source
- message
- status code bila ada
- duration bila ada
- fingerprint
- metadata
- app URL

## Verifikasi Provider

Gunakan:

```bash
npm run ops:alert-check
```

Gate ini mengirim synthetic alert ke `ALERT_WEBHOOK_URL`.
Jika provider menerima request, script akan lulus.
Jika URL belum diisi atau provider menolak request, script akan gagal.

## Cara Membaca Sinyal

### Error Lonjakan Mendadak

Lihat:

- source apa yang naik
- status code dominan
- apakah fingerprint sama berulang

Biasanya ini menandakan satu jalur rusak, bukan sistem acak.

### Warning Berulang

Kalau `WARN` sering muncul dari source yang sama, cek apakah:

- request abuse sedang meningkat
- ada dependency lambat
- ada jalur user yang masih mengarah ke konfigurasi lama

### Web Vitals Buruk

Kalau `badWebVitals` naik:

- cek halaman mana yang paling sering muncul
- bandingkan dengan deploy terakhir
- prioritaskan rute publik dan rute yang revenue atau conversion critical

## Response Flow Singkat

Saat alert masuk:

1. cek timestamp dan source
2. buka `/api/health/db` dan `/api/health/observability`
3. lihat event terbaru di `operationalEvent`
4. cek apakah incident terbatas pada satu flow atau seluruh aplikasi
5. putuskan mitigasi:
   - rollback
   - matikan fitur sementara
   - throttle traffic
   - pulihkan data

## Ambang Yang Layak Dipantau

Minimal threshold yang layak dijadikan alert eksternal:

- health endpoint gagal
- error event spike dari source yang sama
- slow query berat berulang
- upload gagal beruntun
- login failure spike yang mengarah ke abuse

## Residual Risk Yang Masih Harus Diingat

- webhook alert sendiri bisa gagal atau timeout
- alerting belum menggantikan dashboard dan review manual
- kalau `ALERT_WEBHOOK_URL` belum diisi, observability tetap jalan tetapi hanya internal

## Verdict Operasional

Dengan phase ini, observability ADORA BBC sudah layak dipakai sebagai baseline operasional.

Yang masih perlu dijaga manusia:

- triage discipline
- backup rehearsal
- review berkala threshold alert
- pengecekan pasca-deploy melalui smoke test
