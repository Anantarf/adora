# Audit UI Admin ADORA

Tanggal audit: 2026-06-02

Tujuan catatan ini:
- menilai keterbacaan UI admin
- menilai konsistensi layout antar halaman
- mencari alur yang terlalu panjang atau kurang ramah pakai
- memberi arahan revisi yang realistis untuk konteks MVP internal

Konteks produk yang dipakai untuk merevisi audit ini:
- produk masih tahap awal / MVP
- dipakai internal
- jumlah admin sedikit
- admin cenderung saling kenal
- efisiensi kerja lapangan lebih penting daripada kesempurnaan produk mature
- kemudahan pakai di HP penting
- budget develop harus hemat

Implikasi dari konteks ini:
- tidak semua kritik "produk matang" cocok diterapkan
- tidak semua halaman harus dipecah jadi multi-step flow
- tidak semua instruksi teks adalah kegagalan UX
- desain boleh punya rasa komunitas / identitas klub

Catatan penting:
- audit ini tetap kritis
- tapi arah revisinya sengaja disesuaikan untuk MVP
- fokus utamanya adalah `perbaiki yang paling mengganggu kerja`, bukan redesign besar

## Ringkasan Revisi Posisi Audit

Setelah mempertimbangkan konteks MVP internal, posisi audit saya berubah seperti ini:

- saya `tidak menyarankan` memecah halaman padat seperti `Kelompok Latihan` dan `Input Penilaian` menjadi banyak halaman
- saya `tidak menyarankan` mengubah `Pendaftar Baru` menjadi Kanban
- saya `tidak menyarankan` membuat admin panel terlalu dingin atau terlalu korporat
- saya `tidak menyarankan` menghapus semua teks instruksi onboarding

Yang tetap saya pertahankan:
- halaman padat boleh, tapi hirarki visualnya harus jelas
- branding boleh kuat, tapi jangan mengorbankan konteks kerja
- tabel boleh dipertahankan, tapi next action harus lebih jelas
- instruksi onboarding boleh ada, tapi jangan jadi beban baca utama
- detail finishing tetap penting untuk trust

## Prinsip Audit untuk MVP Ini

### Prinsip 1
- utamakan `speed of use` untuk operator yang sering mengulang pekerjaan

### Prinsip 2
- utamakan `clarity` daripada eksplorasi desain yang terlalu artistik

### Prinsip 3
- perbaiki `hirarki`, `prioritas`, dan `keterbacaan` dulu
- jangan langsung loncat ke redesign arsitektur UI

### Prinsip 4
- kalau solusi baru menambah effort develop besar, anggap itu bukan prioritas MVP kecuali benar-benar memecahkan masalah utama

## Prioritas Besar

### P1
- rapikan hirarki visual halaman padat
- buat shell admin sedikit lebih membantu orientasi
- perjelas tindakan utama di halaman operasional

### P2
- samakan ritme visual antar halaman admin
- ringkas instruksi yang terlalu panjang tanpa menghilangkannya
- kurangi noise visual yang tidak membantu keputusan user

### P3
- bersihkan detail trust seperti encoding rusak dan fallback visual yang kasar

## Audit Global

### 1. Shell admin belum cukup membantu orientasi, tapi belum perlu dirombak total
Referensi:
- `src/app/(admin)/layout.tsx`

Temuan:
- top bar global lebih berfungsi sebagai branding area daripada context area
- judul halaman aktif masih bergantung pada body masing-masing page
- tidak ada slot yang jelas untuk aksi cepat atau status kecil

Yang perlu dikoreksi dari audit lama:
- saya tidak lagi menganggap breadcrumb wajib
- untuk tim admin kecil, breadcrumb memang bukan kebutuhan utama

Masalah yang tetap valid:
- brand besar di top bar global masih mengambil ruang kerja yang cukup mahal
- shell belum cukup membantu user tahu konteks halaman tanpa turun ke body

Ideal revisi MVP:
- top bar tetap sederhana
- tampilkan judul halaman aktif atau label konteks pendek
- branding dipertahankan, tapi tidak perlu dominan di semua halaman

Prioritas:
- sedang

### 2. Konsistensi visual admin masih pecah
Temuan:
- dashboard lebih presentasional
- halaman data lebih utilitarian
- settings terasa seperti panel teknis
- ritme antar halaman belum seragam

Kenapa ini tetap penting walau MVP:
- user internal tetap butuh halaman yang mudah diprediksi
- inconsistency menaikkan waktu adaptasi saat pindah tugas

Yang tidak perlu dilakukan sekarang:
- redesign total semua halaman agar seragam sempurna

Yang cukup dilakukan:
- samakan pola dasar:
  - page header
  - action/filter row
  - content surface
  - empty state

Prioritas:
- sedang

## Audit Per Halaman

### Shell Admin
Referensi:
- `src/app/(admin)/layout.tsx`

Masalah:
- header global terlalu fokus ke brand
- shell belum cukup memberi konteks kerja
- footer global memberi nilai kecil untuk admin workflow

Yang masih bisa dipertahankan:
- identitas klub
- kesan komunitas / sport club

Revisi yang masuk akal:
- kecilkan dominasi brand di top bar
- tampilkan label halaman aktif
- footer boleh dipertahankan kalau tidak mengganggu, tapi bukan prioritas

Prioritas:
- sedang

### Dashboard Utama
Referensi:
- `src/app/(admin)/dashboard/page.tsx`
- `src/components/features/dashboard/MetricCards.tsx`

Posisi revisi audit:
- saya tidak lagi menganggap dashboard harus terasa seperti panel enterprise
- sentuhan ramah dan identitas klub justru wajar untuk konteks ADORA

Yang tetap bermasalah:
- greeting masih terlalu dominan untuk halaman kerja
- emoji rusak menurunkan trust
- metric cards masih lebih menonjolkan style daripada prioritas tindakan

Masalah utama dashboard sekarang:
- belum cukup menekankan "apa yang perlu diperhatikan hari ini"

Ideal revisi MVP:
- sapaan tetap ada, tapi lebih ringkas
- rapikan encoding
- urutkan konten berdasarkan urgensi:
  - masalah / alert
  - tugas tertunda
  - pendaftar baru
  - agenda mendatang
  - baru metrik umum

Prioritas:
- sedang

### Kelompok Latihan / Pemain
Referensi:
- `src/app/(admin)/dashboard/players/page.tsx`

Posisi revisi audit:
- saya setuju halaman ini memang pantas menjadi `single-screen workstation`
- untuk operator aktif, pindah halaman justru bisa memperlambat kerja

Jadi kritik lama yang perlu direvisi:
- masalah utamanya bukan "terlalu banyak hal dalam satu halaman"
- masalah utamanya adalah `hirarki visual dan prioritas aksinya belum cukup rapi`

Yang tetap bermasalah:
- terlalu banyak mode berada pada level visual yang mirip
- aksi grup dan aksi pemain sama-sama menonjol
- toggle `database/grid` menambah keputusan, tapi value-nya belum tentu besar
- mobile master-detail masih terasa adaptasi dari desktop, bukan flow mobile yang matang

Yang sebaiknya dipertahankan:
- filter, search, dan workspace pemain dalam satu layar
- konsep panel kiri grup + panel kanan pemain

Yang sebaiknya dirapikan:
- tonjolkan satu aksi utama: `Tambah Pemain`
- aksi sekunder seperti edit/hapus grup dibuat lebih tenang
- evaluasi apakah `grid view` benar-benar dipakai atau hanya nice-to-have
- rapikan density agar scan lebih cepat

Kesimpulan halaman ini:
- jangan dipecah
- tapi wajib diringankan secara visual

Prioritas:
- sangat tinggi

### Pendaftar Baru
Referensi:
- `src/components/features/dashboard/RegistrationsTable.tsx`
- `src/app/(admin)/dashboard/registrations/page.tsx`

Posisi revisi audit:
- saya setuju tabel lebih aman daripada Kanban untuk MVP
- saya tidak mendorong pindah ke board model sekarang

Yang dulu terlalu keras:
- saya tidak lagi menganggap format tabel ini salah arah

Yang tetap bermasalah:
- tabel masih terasa seperti daftar mentah + tombol WA
- instruksi di atas masih perlu dibaca cukup banyak
- status dan langkah berikutnya belum cukup terasa sebagai workflow

Yang bisa dipertahankan:
- tabel
- CTA WhatsApp
- struktur mobile card

Yang perlu diperbaiki:
- buat status lebih operasional
- buat next action lebih jelas per row
- ringkas blok instruksi, atau pecah jadi poin singkat

Contoh arah revisi:
- bukan Kanban
- tapi tabel dengan kolom atau badge:
  - status sekarang
  - aksi selanjutnya
  - progress komunikasi

Prioritas:
- tinggi

### Pengaturan
Referensi:
- `src/app/(admin)/dashboard/settings/page.tsx`

Masalah:
- halaman panjang
- loop unggah dan simpan masih repetitif
- user harus berpindah fokus dari preview ke upload ke save berkali-kali

Yang perlu dikoreksi dari audit lama:
- untuk MVP, granular control seperti ini memang bisa diterima
- tidak harus langsung dibangun jadi settings panel kompleks

Yang tetap bisa diperbaiki tanpa biaya besar:
- lebih rapikan pengelompokan section
- perjelas mana yang sudah tersimpan dan mana yang belum
- samakan pola aksi simpan

Prioritas:
- sedang

### Manajemen Akun
Referensi:
- `src/app/(admin)/dashboard/users/page.tsx`

Penilaian:
- ini salah satu halaman yang paling waras untuk konteks MVP
- cukup fokus
- search, role filter, list, dan pagination masih mudah dipahami

Yang masih bisa ditingkatkan:
- ringkas empty state
- tambah sedikit konteks operasional bila perlu
- pastikan action penting tetap jelas di mobile

Kesimpulan:
- jadikan halaman ini baseline consistency

Prioritas:
- rendah sampai sedang

### Agenda Klub
Referensi:
- `src/app/(admin)/dashboard/schedule/page.tsx`

Penilaian:
- struktur dasarnya sudah cukup masuk akal
- form, kalender, dan daftar mendatang masih bisa diterima dalam satu halaman

Yang tetap perlu dikritik:
- aksi edit/hapus terlalu mengandalkan hover
- di konteks admin, aksi penting jangan terlalu tersembunyi

Yang tidak perlu dilakukan sekarang:
- memecah page ini jadi modul terpisah

Yang cukup dilakukan:
- buat aksi row lebih eksplisit
- pastikan mobile dan touch interaction tetap aman

Prioritas:
- sedang

### Input Penilaian
Referensi:
- `src/app/(admin)/dashboard/statistics/page.tsx`

Posisi revisi audit:
- saya setuju ini juga pantas menjadi halaman kerja padat
- untuk input banyak pemain, tabel besar masih masuk akal

Jadi kritik lama yang direvisi:
- saya tidak menyarankan memecah page ini menjadi alur panjang

Yang tetap bermasalah:
- density visual masih berat
- banyak elemen kecil bersaing sekaligus
- mobile card version sangat informatif tapi juga cepat melelahkan
- masih ada karakter rusak

Yang sebaiknya dipertahankan:
- periode + group filter di atas
- tabel desktop untuk speed kerja

Yang sebaiknya dirapikan:
- kurangi noise visual
- perjelas hirarki antara kontrol, ringkasan, dan tabel
- rapikan tampilan mobile agar tidak terasa seperti miniatur desktop

Prioritas:
- tinggi

## Teks Instruksi

Posisi revisi audit:
- saya setuju teks instruksi bisa berguna sebagai built-in onboarding
- untuk organisasi semi-formal, ini bukan dosa UX

Yang tetap perlu dijaga:
- instruksi jangan menjadi pengganti flow yang jelas
- instruksi panjang sebaiknya tidak menjadi blok utama yang harus dibaca sebelum user bertindak

Rekomendasi MVP:
- pertahankan instruksi
- ringkas menjadi poin pendek
- tempatkan sebagai helper, bukan pusat perhatian

## Masalah Keterbacaan

Temuan umum:
- terlalu banyak uppercase + tracking lebar untuk label kecil
- beberapa teks terlalu kecil untuk layar HP
- badge dan dekorasi kadang lebih menonjol daripada isi data

Masalah ini tetap valid walau MVP:
- operator yang sering pakai sistem butuh scan cepat
- keterbacaan buruk memperlambat kerja walau user sudah hafal sistem

Rekomendasi:
- simpan uppercase kuat untuk heading penting
- kecilkan jumlah badge mencolok
- prioritaskan keterbacaan nama, angka, status, dan CTA

## Masalah Trust dan Finishing

Hal yang tetap tidak bisa dibela dengan alasan MVP:
- karakter rusak
- fallback simbol rusak
- detail visual yang terlihat belum selesai

Kenapa ini tetap penting:
- admin panel internal tetap harus terasa dapat dipercaya
- detail seperti ini kecil tapi mengurangi kesan matang

Prioritas:
- sedang

## Rekomendasi Besok

Urutan kerja paling masuk akal:

1. rapikan `Kelompok Latihan`
- pertahankan single-screen
- perjelas hirarki
- evaluasi toggle `grid`
- tenangkan aksi sekunder

2. rapikan `Input Penilaian`
- pertahankan model tabel
- kurangi kepadatan visual
- perjelas hierarki kontrol dan data

3. rapikan `Pendaftar Baru`
- tetap tabel
- perjelas status dan langkah berikutnya
- ringkas instruksi

4. rapikan `Shell Admin`
- tambahkan konteks halaman ringan
- kecilkan dominasi brand di top bar

5. bersihkan finishing
- encoding rusak
- fallback simbol
- label kecil yang terlalu agresif

## Halaman Acuan

Kalau harus memilih baseline paling waras untuk konteks MVP:
- `Users Management`
- `Agenda Klub`

Kalau harus memilih halaman paling penting untuk dirapikan dulu:
- `Kelompok Latihan`
- `Input Penilaian`
- `Pendaftar Baru`

## Penutup

Dengan konteks MVP internal, banyak keputusan yang awalnya terlihat "kurang ideal" ternyata masih bisa dibela:
- halaman padat
- tabel tradisional
- instruksi onboarding
- identitas klub yang kuat

Jadi fokus revisi besok sebaiknya bukan:
- bikin sistem lebih canggih
- pecah halaman jadi lebih banyak
- mengejar standar admin enterprise

Fokus revisi besok sebaiknya:
- membuat halaman yang sudah ada jadi lebih ringan dibaca
- lebih cepat discan
- lebih jelas prioritas aksinya
- tetap hemat effort develop

Kesimpulan akhirnya:

Produk ini tidak perlu menjadi admin panel korporat.
Produk ini perlu menjadi tool internal yang cepat, jelas, dan cukup rapi untuk dipakai tiap hari tanpa bikin operator capek.

## Rencana Revisi Detail

Bagian ini sengaja lebih konkret supaya kebayang apa yang kemungkinan benar-benar diubah di UI, bukan hanya arah besarnya.

### P1. Kelompok Latihan

Tujuan:
- tetap single-screen
- lebih cepat discan
- mengurangi rasa penuh dan campur aduk

Perubahan yang kemungkinan dilakukan:

#### Header halaman
- perkecil hero/header halaman
- buat heading lebih ringkas
- ringkas subteks penjelasan
- tambahkan satu area aksi utama yang jelas: `Tambah Pemain`

#### Kartu statistik atas
- pertahankan dua kartu ringkasan
- kecilkan dominasi visual kartu
- buat lebih kompak supaya tidak mengambil terlalu banyak tinggi layar

#### Panel kiri daftar kelompok
- pertahankan panel kiri sebagai navigator utama
- rapikan urutan:
  - header + tombol tambah kelompok
  - search kelompok
  - filter kategori
  - list kelompok
- kecilkan noise pada card kelompok
- tonjolkan:
  - nama kelompok
  - jumlah pemain
  - satu deskripsi singkat
- kurangi aksen visual yang tidak menambah informasi

#### Panel kanan workspace pemain
- pertahankan struktur detail grup + list pemain
- tapi bagi jadi blok yang lebih tegas:
  - baris identitas grup
  - baris aksi grup
  - baris search dan mode tampilan
  - area daftar pemain

#### Aksi grup
- `Tambah Pemain` dijadikan aksi paling dominan
- `Ubah Grup` dan `Hapus Grup` dibuat lebih tenang
- kalau perlu, edit/hapus grup dipindah ke menu overflow atau dropdown kecil

#### Toggle mode tabel/grid
- evaluasi apakah `grid view` benar-benar dipakai
- kalau tidak penting, hapus saja
- kalau tetap dipakai, tampilan toggle dibuat lebih ringan dan lebih jelas kapan perlu dipakai

#### Tampilan tabel pemain
- fokus pada scan cepat
- kolom tetap dipertahankan, tapi visual diringankan:
  - kurangi badge yang terlalu ramai
  - rapikan penekanan warna
  - buat kolom aksi lebih jelas
- mungkin sederhanakan beberapa kolom sekunder kalau ternyata jarang dipakai

#### Tampilan mobile
- pertahankan konsep master-detail
- rapikan transisi mental:
  - daftar kelompok
  - masuk ke daftar pemain
  - tombol kembali lebih jelas
- kurangi rasa “desktop yang dipaksa mengecil”

#### Target hasil
- halaman tetap powerful
- tetapi user langsung tahu:
  - sekarang lagi lihat grup apa
  - aksi utama apa
  - daftar pemain ada di mana
  - mana aksi grup dan mana aksi pemain

### P1. Input Penilaian

Tujuan:
- tetap cepat untuk input massal
- tetap berbasis tabel
- lebih ringan secara visual

Perubahan yang kemungkinan dilakukan:

#### Header halaman
- ringkas area heading
- pertahankan tombol tambah periode
- buat tone halaman lebih utilitarian

#### Bar kontrol atas
- pertahankan:
  - pilih periode
  - filter kelompok
  - aksi periode
- rapikan layout supaya:
  - period selector jadi fokus pertama
  - aksi aktifkan/hapus periode tidak terlalu berisik

#### Ringkasan periode
- pertahankan summary `selesai / draft / total`
- visual dibuat lebih seperti toolbar status daripada card display

#### Tabel desktop
- tetap jadi pusat kerja utama
- kemungkinan perbaikan:
  - spacing tabel diringkas
  - header tabel lebih mudah dibaca
  - kolom yang paling penting lebih ditekankan
  - badge status dibuat lebih konsisten
  - aksi rapor PDF dan input nilai dirapikan agar tidak saling rebut perhatian

#### Mobile cards
- tetap ada, karena mobile penting
- tapi kartu dibuat lebih ringkas:
  - jangan semua informasi terlihat sama penting
  - pisahkan info inti dan info sekunder
- kemungkinan urutan mobile:
  - nama pemain
  - status
  - skor ringkas
  - aksi

#### Group section
- pertahankan pengelompokan berdasarkan grup
- header grup dibuat lebih clean
- kurangi rasa fragmentasi antar section

#### Target hasil
- halaman tetap cocok untuk admin yang input banyak pemain
- tetapi tidak terasa seperti spreadsheet mentah yang ditempel ke card UI

### P1. Pendaftar Baru

Tujuan:
- tetap tabel
- tetap aman di mobile
- lebih jelas workflow-nya

Perubahan yang kemungkinan dilakukan:

#### Header halaman
- ringkas heading dan subteks
- pertahankan tombol export
- buat CTA export tidak lebih dominan dari pekerjaan utama

#### Blok instruksi
- jangan dihapus total
- ubah jadi versi yang lebih pendek
- kemungkinan format:
  - 3 poin singkat
  - atau “cara kerja cepat”
- hindari paragraf panjang

#### Tabel desktop
- pertahankan format tabel
- tambahkan kejelasan operasional:
  - status sekarang
  - langkah berikutnya
- jika belum mau nambah kolom baru, minimal action area dibuat lebih eksplisit

#### Mobile cards
- pertahankan card layout
- buat CTA utama lebih jelas
- mungkin urutkan:
  - nama pemain
  - homebase / kelompok usia
  - tanggal masuk
  - status
  - tombol aksi

#### Status
- evaluasi label status yang sekarang
- kemungkinan dirapikan agar lebih operasional, misalnya:
  - baru masuk
  - sudah dihubungi
  - menunggu bayar
  - selesai

#### Action area
- tombol WA dipertahankan
- tapi action sekunder dan action utama dibuat lebih mudah dibedakan

#### Target hasil
- user tidak perlu membaca instruksi panjang untuk paham apa yang harus dilakukan
- tetap sederhana, tetap tabel, tapi lebih terasa sebagai workflow

### P2. Shell Admin

Tujuan:
- bantu orientasi
- tanpa menghilangkan identitas klub

Perubahan yang kemungkinan dilakukan:

#### Top bar global
- kecilkan dominasi logo / judul brand tengah
- ganti fokus top bar menjadi:
  - judul halaman aktif
  - sublabel singkat jika perlu
  - ruang untuk aksi kecil atau info akun

#### Sidebar trigger area
- pertahankan trigger
- buat relasinya lebih natural dengan judul halaman

#### Footer global
- evaluasi apakah tetap dipertahankan
- jika tetap ada, buat lebih kecil dan tidak terlalu memakan perhatian

#### Target hasil
- shell terasa seperti workspace
- bukan seperti frame branding yang dipasang di semua halaman

### P2. Dashboard Utama

Tujuan:
- tetap punya personality
- tapi lebih terasa sebagai pusat monitoring

Perubahan yang kemungkinan dilakukan:

#### Greeting
- pertahankan sapaan
- ringkas ukurannya
- hilangkan detail yang terasa terlalu display-heavy
- bersihkan karakter rusak

#### Urutan blok
- susun ulang prioritas:
  - error / alert
  - at-risk players
  - pendaftar baru
  - agenda
  - metrik umum

#### Metric cards
- pertahankan card
- tetapi tone lebih utilitarian:
  - angka lebih jelas
  - subtitle lebih tenang
  - fallback simbol dibersihkan

#### Target hasil
- dashboard tetap hangat
- tapi lebih membantu mengambil keputusan cepat

### P2. Pengaturan

Tujuan:
- tetap sederhana
- mengurangi micro-loop yang melelahkan

Perubahan yang kemungkinan dilakukan:

#### Struktur section
- pertahankan dua section besar:
  - aset visual
  - penandatangan
- buat pemisahan visualnya lebih jelas

#### Upload area
- pertahankan preview
- rapikan alignment elemen upload
- buat state:
  - uploading
  - uploaded
  - failed
  lebih mudah dibaca

#### Save flow
- evaluasi apakah signer names tetap save per field atau save per section
- untuk MVP bisa tetap per field, tapi tampilannya harus lebih konsisten

#### Target hasil
- settings masih gampang dibangun
- tapi tidak terasa melelahkan untuk maintenance rutin

### P2. Agenda Klub

Tujuan:
- mempertahankan struktur yang sudah cukup oke
- memperjelas aksi

Perubahan yang kemungkinan dilakukan:

#### Agenda mendatang
- aksi edit/hapus jangan terlalu bergantung pada hover
- buat affordance lebih terlihat, terutama untuk layar sentuh

#### Kalender
- pertahankan kalender sebagai pusat browse
- legend tetap ada, tapi dibuat lebih tenang

#### Target hasil
- halaman tetap kaya fitur
- tetapi tindakan penting tidak tersembunyi

### P3. Users Management

Tujuan:
- jadikan baseline consistency

Perubahan yang kemungkinan dilakukan:
- polish kecil pada spacing dan empty state
- tambah sedikit konteks bila perlu
- jaga agar halaman ini tetap jadi yang paling mudah dipakai

### P3. Finishing dan Trust

Ini kecil tapi wajib:

#### Yang perlu dibersihkan
- karakter rusak
- fallback simbol rusak
- komentar atau text node yang terlihat belum final
- inkonsistensi label kecil

#### Kenapa tetap penting
- walau internal, panel admin harus terasa cukup rapi dan terpercaya

## Gambaran Scope Besok

Kalau dikerjakan bertahap, saya bayangkan begini:

### Batch 1
- `Kelompok Latihan`
- fokus hierarki dan pengurangan noise

### Batch 2
- `Input Penilaian`
- fokus keterbacaan tabel dan mobile density

### Batch 3
- `Pendaftar Baru`
- fokus workflow clarity tanpa ganti arsitektur

### Batch 4
- `Shell Admin` + `Dashboard`
- fokus orientasi dan consistency

### Batch 5
- `Settings`, `Agenda`, dan finishing kecil

## Prinsip Saat Eksekusi Besok

Supaya tidak kebablasan redesign:

- jangan pecah halaman padat kalau belum benar-benar perlu
- jangan tambah komponen berat kalau value-nya kecil
- jangan mengejar style keren kalau mengorbankan speed scan
- pertahankan hal-hal yang memang mendukung kerja admin power-user
- polish hanya yang benar-benar terasa manfaatnya
