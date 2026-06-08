# Standar Operasional Prosedur (SOP) ADORA BBC

Dokumen ini adalah panduan baku (SOP) untuk aktivitas operasional di level Production. Jika terjadi keraguan saat melakukan rilis atau menangani masalah (incident), kembali ke panduan ini.

---

## 1. SOP Deployment (Rilis Produksi)

Rilis ke tahap produksi tidak boleh dilakukan secara "asal push". Ikuti langkah-langkah berikut untuk memastikan keselamatan data dan fungsionalitas.

### Pra-Deployment
1. **Pastikan CI/CD Hijau**: Semua *Lint*, *Build*, dan *Integration Tests* (`npm run test:integration`) di branch yang akan di-*merge* sudah lulus.
2. **Cek Variabel Lingkungan (Env Vars)**: Jika ada fitur baru yang butuh secret key atau URL baru, pastikan sudah ditambahkan di panel *Environment Variables* (misalnya di Vercel/Supabase).
3. **Review Migration**: Jika rilis ini berisi perubahan skema database (`prisma/schema.prisma`), pastikan `migration.sql` sudah ter-generate dan tidak ada potensi *data-loss* (seperti `DROP TABLE` tanpa *backup*).

### Deployment
1. Lakukan penggabungan (*merge*) ke branch `main`.
2. Tunggu proses otomatis *build* di server *hosting* selesai.
3. Selama proses *build*, pastikan *database migrations* berhasil dieksekusi (biasanya dilakukan di tahap pra-build atau post-build script).

### Pasca-Deployment
1. Buka *production URL* dan pastikan tidak ada halaman *Blank White Screen* (BWS) atau *Internal Server Error* (500).
2. Periksa panel Admin **Observability Dashboard**. Pastikan tidak ada lonjakan `ERROR` atau `WARN` yang mendadak muncul beberapa menit pasca-rilis.
3. Lakukan verifikasi fungsionalitas inti (contoh: login, buka halaman statistik).

---

## 2. SOP Rollback (Penarikan Rilis)

Rollback dilakukan **jika dan hanya jika** versi baru menyebabkan kerusakan fatal di production (*system down*, data rusak, *login* gagal massal).

### Kode / Aplikasi
1. Jika *hosting* menggunakan platform seperti Vercel: Gunakan fitur **Instant Rollback** di panel *Deployments* untuk mengembalikan rilis ke versi stabil sebelumnya. Ini butuh waktu kurang dari 1 menit.
2. Jika *hosting* konvensional: Lakukan `git revert` pada komit bermasalah, lalu tekan ulang ke `main` untuk merilis versi mundur secara mulus.

### Database (Sangat Kritis)
> **Peringatan**: JANGAN pernah menggunakan perintah `prisma migrate reset` di *production*.
1. Jika *migration* baru hanya **menambahkan kolom/tabel**, biarkan saja. Aplikasi versi lama biasanya masih bisa berjalan dengan skema yang memiliki tabel tambahan.
2. Jika *migration* **menghapus atau merusak kolom (breaking change)** dan aplikasi harus di-*rollback*, Anda harus menulis *migration* mundur secara manual (Roll-forward) atau memulihkan (Restore) database dari *snapshot backup* otomatis harian.

---

## 3. SOP Incident Response (Penanganan Gangguan)

SOP ini berlaku ketika ada notifikasi gangguan (*Alert*) atau keluhan langsung dari pengguna.

### Langkah 1: Triage (Identifikasi)
1. **Buka Dashboard Observability**: Cek tab `Kejadian Operasional Terbaru`.
2. Tentukan asal masalah (*Source*): Apakah dari "auth", "prisma-slow-query", "storage", atau fitur lain?
3. Cek skala kerusakan: Apakah 1 orang pengguna yang gagal memuat halaman, atau seluruh platform tidak merespon?

### Langkah 2: Mitigasi Cepat (Stop Bleeding)
1. Jika sumbernya adalah rilis terbaru, terapkan **SOP Rollback**.
2. Jika penyebabnya adalah beban akses (serangan/spam), cek log Vercel dan pertimbangkan untuk meningkatkan *Rate Limiter* sementara, atau memblokir IP/User tertentu.
3. Jika *database down*, cek status provider database (misal: Supabase Status Page). Beritahukan ke grup pengguna (misal: grup WhatsApp orang tua) bahwa sedang ada *maintenance* darurat.

### Langkah 3: Investigasi & Perbaikan (Post-Mortem)
1. Setelah masalah ditambal (mitigasi), tarik riwayat error log untuk mencari tahu apa kode aslinya.
2. Buat *Unit Test* atau *Integration Test* yang mereplikasi kejadian kegagalan tersebut agar tidak terulang lagi (seperti yang dilakukan pada fase *Failure Path*).
3. Setelah *bug* diperbaiki, lakukan **SOP Deployment** ulang.
