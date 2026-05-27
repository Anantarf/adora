# Phase 7 Battle-Tested Hardening

## Tujuan

Phase 7 difokuskan untuk menutup gap yang tersisa antara `production-mature` dan `battle-tested baseline`.

Target utamanya:

- alert observability bisa keluar dari database ke channel eksternal
- authenticated flow paling penting ikut masuk regression gate
- limiter yang masih process-local dipindahkan ke shared path
- runbook operasional inti tidak lagi hanya hidup di chat

## Perubahan Yang Dikerjakan

### 1. External Alerting Dengan Cooldown

Perubahan di [src/lib/operational-alerts.ts](../src/lib/operational-alerts.ts) dan [src/lib/observability.ts](../src/lib/observability.ts):

- event `WARN` atau `ERROR` sekarang bisa dikirim ke `ALERT_WEBHOOK_URL`
- severity minimum bisa diatur lewat `ALERT_MIN_SEVERITY`
- alert dideduplikasi dengan cooldown lewat `ALERT_COOLDOWN_MS`
- cooldown memakai shared limiter database, jadi tetap konsisten di multi-instance

Kenapa penting:

- observability sekarang bukan cuma menyimpan bukti masalah, tapi bisa mendorong notifikasi keluar
- webhook tidak gampang spam saat error berulang dalam burst yang sama

### 2. Proxy API Rate Limit Tidak Lagi Process-Local

Perubahan di [src/proxy.ts](../src/proxy.ts):

- limiter API global tidak lagi memakai `LRUCache` per process
- limiter sekarang memakai bucket shared di database
- kalau limiter sedang gagal diakses, proxy fail-open dan mencatat error ke console, bukan memutus semua request API

Kenapa penting:

- perilaku limiter sekarang konsisten pada deployment multi-instance
- blast radius lebih kecil saat komponen limiter sendiri bermasalah

### 3. Authenticated E2E Masuk Critical Gate

Perubahan di:

- [tests/auth-admin.spec.ts](../tests/auth-admin.spec.ts)
- [tests/auth-parent.spec.ts](../tests/auth-parent.spec.ts)
- [tests/helpers/auth.ts](../tests/helpers/auth.ts)

Flow baru yang dijaga:

- admin seed dapat login dan mencapai dashboard
- parent seed dapat login dan mencapai portal keluarga

Catatan:

- flow ini aktif penuh jika `E2E_ADMIN_*` dan `E2E_PARENT_*` diisi
- pada environment lokal yang belum punya akun seed khusus, test akan di-skip agar gate dasar tetap stabil

Kenapa penting:

- regression gate sekarang tidak hanya menjaga flow publik
- jalur auth production yang paling penting punya bukti browser-level bahwa redirect dan landing role-based masih sehat

### 4. Release Safety Sekarang Paham Env Alerting

Perubahan di:

- [src/lib/release-safety.ts](../src/lib/release-safety.ts)
- [tests/integration/release-safety.test.ts](../tests/integration/release-safety.test.ts)
- [.env.example](../.env.example)
- [README.md](../README.md)

Env baru yang dikenali sebagai `recommended`:

- `ALERT_WEBHOOK_URL`
- `ALERT_MIN_SEVERITY`
- `ALERT_COOLDOWN_MS`

Kenapa penting:

- release checklist sekarang ikut mendorong kesiapan alerting, tanpa menjadikannya blocker untuk local development

## Dokumen Operasional Baru

Phase ini juga menambahkan dua runbook:

- [Backup And Restore](./BACKUP_AND_RESTORE.md)
- [Alerting And Incident Response](./ALERTING_AND_INCIDENT_RESPONSE.md)

Tujuannya agar sisi operasional tidak tercecer dari repo.

## Judgement Setelah Phase 7

Setelah phase ini, project naik dari:

`production-mature with good internal telemetry`

menjadi:

`closer to battle-tested because auth regression, shared protection, and operator runbooks now exist in one place`

Project ini tetap belum identik dengan sistem enterprise penuh, tapi gap yang tersisa sekarang makin sempit dan lebih banyak berada di area deployment nyata, bukan lagi di blind spot dasar codebase.
