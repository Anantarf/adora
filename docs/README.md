# Docs

Dokumentasi internal proyek disimpan di folder ini agar keputusan teknis, evaluasi production, dan checklist operasional tidak tercecer di chat.

## Daftar Dokumen

- [Production Judgment](./PRODUCTION_JUDGMENT.md)
  Penilaian jujur terhadap kesiapan production proyek, red flags yang masih mungkin tersembunyi, dan checklist kerja bareng agentic AI.
- [Phase 1 Reliability](./PHASE_1_RELIABILITY.md)
  Ringkasan eksekusi Phase 1 untuk hardening failure path, termasuk perubahan teknis, test baru, dan sisa risiko.
- [Phase 2 Data And Auth](./PHASE_2_DATA_AND_AUTH.md)
  Ringkasan hardening invariant data dan authorization boundary, termasuk guard domain, validasi target relasi, dan test baru.
- [Phase 3 Scale And Performance](./PHASE_3_SCALE_AND_PERFORMANCE.md)
  Ringkasan optimasi pagination/search server-side pada halaman admin yang paling rawan membengkak, lengkap dengan batas operasional dan test skala dasar.
- [Phase 4 Observability And Incident Readiness](./PHASE_4_OBSERVABILITY_AND_INCIDENT_READINESS.md)
  Ringkasan penambahan event store operasional, snapshot observability, slow query persistence, dan health endpoint yang lebih siap dipakai saat incident.
- [Phase 5 Release Safety](./PHASE_5_RELEASE_SAFETY.md)
  Ringkasan guard env production, smoke test pasca-deploy, checklist release/rollback, dan cleanup warning build yang mengganggu sinyal produksi.
- [Phase 6 Regression Resistance](./PHASE_6_REGRESSION_RESISTANCE.md)
  Ringkasan must-pass suite, tagging E2E kritikal, auto web server Playwright, dan baseline regression gate sebelum push atau deploy.
- [Phase 7 Battle-Tested Hardening](./PHASE_7_BATTLE_TESTED_HARDENING.md)
  Ringkasan alert eksternal, authenticated critical E2E, limiter shared di proxy, dan penguatan runbook operasional.
- [Backup And Restore](./BACKUP_AND_RESTORE.md)
  Runbook minimum untuk logical backup, restore rehearsal, dan verifikasi pasca-pemulihan database.
- [Alerting And Incident Response](./ALERTING_AND_INCIDENT_RESPONSE.md)
  Panduan memakai operational events, webhook alert, dan health endpoint sebagai response baseline saat incident.

## Aturan Singkat

- Gunakan dokumen di folder ini untuk keputusan yang sifatnya lintas fitur atau penting untuk maintainability.
- Simpan review, checklist, dan postmortem dalam format Markdown yang ringkas tapi bisa dipakai ulang.
- Anggap dokumen di sini sebagai referensi kerja, bukan arsip pasif.
