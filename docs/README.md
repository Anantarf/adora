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

## Aturan Singkat

- Gunakan dokumen di folder ini untuk keputusan yang sifatnya lintas fitur atau penting untuk maintainability.
- Simpan review, checklist, dan postmortem dalam format Markdown yang ringkas tapi bisa dipakai ulang.
- Anggap dokumen di sini sebagai referensi kerja, bukan arsip pasif.
