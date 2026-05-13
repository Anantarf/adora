# Mobile Refactor Playbook

Dokumen ini adalah acuan praktis tim untuk menyamakan kualitas UX mobile di:
- Landing page
- Admin
- Registrasi
- Portal orang tua

## 1) Tujuan

1. Menyamakan standar UX mobile lintas halaman.
2. Menjaga konsistensi visual dan interaksi.
3. Mempermudah refactor bertahap, low risk, dan terukur.

## 2) Prinsip Inti

1. Mobile-first: rancang dari layar kecil, lalu scale ke tablet/desktop.
2. Konsisten fondasi, fleksibel konteks: token dan pola interaksi sama, urutan konten boleh menyesuaikan tujuan halaman.
3. Satu halaman satu prioritas utama: hindari banyak CTA utama dalam satu fold.
4. Context before action: user paham dulu, baru diminta klik.
5. Keterbacaan mengalahkan dekorasi: visual kuat boleh, tapi tidak boleh mengganggu hierarki informasi.

## 3) Standar Global Wajib

### 3.1 Layout dan Spacing

1. Padding horizontal mobile konsisten.
2. Pakai skala spacing baku (contoh: 4, 8, 12, 16, 24, 32).
3. Hindari nilai random per komponen tanpa alasan jelas.

### 3.2 Tipografi

1. Skala heading dan body konsisten.
2. Line-height nyaman dibaca.
3. Batasi variasi ukuran font agar ritme visual rapi.

### 3.3 Target Sentuh

1. Elemen interaktif minimum 44 x 44.
2. Jarak antar tombol utama cukup agar tidak salah tap.

### 3.4 Komponen Inti

1. Button, input, select, card, badge, dialog mengikuti design system yang sama.
2. Warna status konsisten makna:
- Success
- Draft
- Warning
- Error

### 3.5 State UX

1. Semua halaman punya state loading, empty, error, success.
2. Tidak ada proses tanpa feedback yang jelas.

### 3.6 Aksesibilitas

1. Kontras teks aman.
2. Focus state terlihat.
3. Label form tetap ada, tidak hanya placeholder.

### 3.7 Performa Mobile

1. Gambar hero dikompresi dan ukuran sesuai kebutuhan viewport.
2. Hindari layout shift pada image/lazy content.

## 4) Aturan Per Area

### 4.1 Landing Page

1. Urutan mobile default:
- Judul
- Subjudul
- Hero image
- CTA utama
2. Maksimal 1 CTA utama per fold.
3. Hero kuat untuk storytelling, tapi tidak menenggelamkan pesan utama.

### 4.2 Admin

1. Fokus efisiensi kerja.
2. Mobile utamakan card/list prioritas ketimbang tabel lebar.
3. Aksi cepat harus jelas dan mudah dijangkau.

### 4.3 Registrasi

1. Fokus completion rate.
2. Form panjang dipecah per langkah.
3. Error message dekat field dan mudah dipahami.
4. Tombol lanjut mudah dijangkau jempol.

### 4.4 Portal Orang Tua

1. Fokus kejelasan progres anak.
2. Ringkasan dulu, detail belakangan.
3. Gunakan bahasa non-teknis.
4. Status terbaru harus cepat terlihat.

## 5) Catatan Khusus dari Kondisi Sekarang

1. Concern valid: untuk mobile, hero image umumnya lebih natural jika tepat di bawah judul/subjudul.
2. CTA setelah hero biasanya meningkatkan clarity untuk mayoritas user.
3. Layout sekarang sudah kuat secara visual, tapi bisa naik dengan penyempurnaan urutan konten dan ritme spacing.

## 6) Checklist Audit Per Halaman

Gunakan checklist ini untuk setiap halaman mobile.

1. Prioritas utama halaman jelas.
2. Urutan konten mengikuti context before action.
3. CTA utama hanya satu di first fold.
4. Semua tap target minimum 44 x 44.
5. Tidak ada overflow horizontal yang tidak disengaja.
6. Loading, empty, error state tersedia dan konsisten.
7. Tipografi konsisten dan mudah dibaca.
8. Kontras warna aman.
9. Focus state terlihat.
10. Komponen mengikuti design system, bukan duplikasi custom.
11. Nyaman dipakai dengan satu tangan.
12. Hero image tidak mendorong konten inti terlalu jauh ke bawah.
13. Performa terasa ringan di jaringan mobile normal.

## 7) Rubrik Skor Audit

Skor per halaman:
- 0 = belum memenuhi
- 1 = memenuhi sebagian
- 2 = memenuhi

Total maksimum: 26 (13 butir x 2)

Interpretasi:
- 22-26: siap produksi
- 17-21: layak, perlu polishing kecil
- <=16: perlu refactor prioritas

## 8) Definition of Done Refactor

1. Skor audit minimal 22.
2. Tidak ada error/warning lint baru dari perubahan.
3. Tidak ada regresi fungsi utama.
4. Lolos uji manual di minimal 2 ukuran mobile.
5. Ada ringkasan perubahan singkat per halaman.

## 9) Prioritas Eksekusi

1. Registrasi
2. Portal orang tua
3. Admin mobile
4. Landing page

Alasan:
- Dampak tercepat ke conversion, trust, dan produktivitas.

## 10) Template Audit Mingguan

Salin section ini setiap minggu.

### Minggu: YYYY-MM-DD s/d YYYY-MM-DD

PIC:

Target minggu ini:
1.
2.
3.

#### Halaman: <nama halaman>

Skor total: <0-26>

Checklist:
1. Prioritas utama jelas: [ ] 0 [ ] 1 [ ] 2
2. Context before action: [ ] 0 [ ] 1 [ ] 2
3. Satu CTA utama per fold: [ ] 0 [ ] 1 [ ] 2
4. Tap target >= 44 x 44: [ ] 0 [ ] 1 [ ] 2
5. Tidak ada overflow horizontal: [ ] 0 [ ] 1 [ ] 2
6. State UX lengkap: [ ] 0 [ ] 1 [ ] 2
7. Tipografi konsisten: [ ] 0 [ ] 1 [ ] 2
8. Kontras aman: [ ] 0 [ ] 1 [ ] 2
9. Focus state jelas: [ ] 0 [ ] 1 [ ] 2
10. Patuh design system: [ ] 0 [ ] 1 [ ] 2
11. Nyaman satu tangan: [ ] 0 [ ] 1 [ ] 2
12. Hero tidak mendorong konten inti: [ ] 0 [ ] 1 [ ] 2
13. Performa mobile baik: [ ] 0 [ ] 1 [ ] 2

Temuan utama:
1.
2.
3.

Action minggu depan:
1.
2.
3.

Risiko/blocked:
1.
2.

## 11) Aturan Implementasi Refactor

1. Incremental change per halaman (hindari big bang).
2. Satu PR fokus satu area agar review jelas.
3. Wajib screenshot before/after untuk viewport mobile.
4. Wajib sanity test alur utama setelah merge.

## 12) Catatan Governance Tim

1. Jika ada pengecualian aturan, tulis alasan dan durasi pengecualian.
2. Review ulang dokumen ini setiap 2 minggu selama fase refactor aktif.
