# UI Judgment Report

Tanggal review: 2026-05-27

Scope review ini fokus ke kualitas UI/UX, visual system, responsivitas, aksesibilitas, dan konsistensi experience. Report ini sengaja dipisah dari production/reliability report karena aplikasi sudah cukup kuat di belakang layar, sementara UI punya standar penilaian yang berbeda: clarity, trust, speed of comprehension, dan polish visual.

## Ringkasan Penilaian

Project ini sudah punya identitas visual yang kuat. Landing page dan registration flow terasa berani, sporty, dan tidak generik. Admin dan parent portal juga sudah lebih tenang dan fungsional dibanding halaman publik. Secara umum, UI sudah layak production, tapi belum di tahap "premium polished" karena masih ada risiko readability, encoding polish, dan konsistensi antara marketing UI vs operational UI.

Nilai kasar saat ini:

| Area | Nilai | Catatan |
| --- | ---: | --- |
| Landing visual identity | 8.3/10 | Kuat, energetic, memorable, tapi cukup ramai dan palette terasa agresif. |
| Registration UX | 8.0/10 | Alur jelas, step-based, CTA kuat, tapi visual density cukup tinggi. |
| Admin UX | 7.9/10 | Fungsional, rapi, dan dashboard-ready, tapi perlu audit table/form state yang lebih detail. |
| Parent UX | 8.0/10 | Fokus ke insight anak sudah baik; charts dan PDF action jelas. |
| Responsiveness | 7.8/10 | Sudah responsive-aware, tapi elemen italic/skew/large heading rawan sempit di device kecil. |
| Accessibility/readability | 7.2/10 | Kontras banyak yang aman, tetapi uppercase kecil, tracking lebar, motion, dan text micro perlu dikontrol. |
| Design system consistency | 7.8/10 | Token sudah ada, tapi gaya marketing dan app shell masih perlu boundary yang lebih tegas. |

Overall UI maturity: 7.9/10.

## Yang Sudah Kuat

### 1. Brand punya karakter

UI publik tidak terasa template default. Warna orange, purple, black, halftone pattern, italic heading, skewed badge, dan image hero membentuk bahasa visual yang jelas: muda, kompetitif, basket, dan energetic.

Dampaknya bagus untuk landing page karena user cepat menangkap "ini klub basket aktif, bukan form administrasi polos".

### 2. Landing page punya visual hierarchy yang cukup tegas

Hero punya headline besar, CTA jelas, nav ringkas, dan konten dibagi ke section feature seperti program, homebase, turnamen, galeri, dan CTA akhir. Ini membantu calon orang tua memahami value sebelum masuk ke pendaftaran.

### 3. Registration flow sudah lebih baik dari form biasa

Form pendaftaran dibuat step-based:

- pilih lokasi latihan
- isi data calon pemain
- pilih kelompok usia
- submit dan lanjut WhatsApp

Ini cocok untuk konteks bisnisnya karena pendaftaran klub biasanya butuh follow-up manusia, bukan hanya submit database.

### 4. Admin dan parent tidak terlalu "marketing"

Halaman internal memakai app shell yang lebih tenang: background netral, card, table, chart, sticky header, sidebar admin, dan layout parent yang fokus ke laporan anak. Ini keputusan bagus karena daily-use UI tidak seharusnya seagresif landing page.

### 5. Parent dashboard sudah punya user value yang jelas

Parent portal bukan hanya "data anak", tapi memberi ringkasan nilai, radar chart, progression chart, attendance summary, catatan pelatih, dan download rapor PDF. Itu sudah cukup dekat dengan outcome yang orang tua cari.

## Risiko UI Yang Masih Kelihatan

### 1. Ada indikasi mojibake/encoding artifact

Beberapa file UI menampilkan karakter seperti `â†’`, `â€”`, `â€“`, `ðŸ‘‹`, dan icon warning yang rusak. Kalau karakter ini benar tampil di browser, dampaknya langsung terasa tidak polished walaupun fitur backend bagus.

Prioritas: tinggi untuk UI polish.

Kenapa penting:

- tombol dan menu terlihat kurang profesional
- user bisa merasa situs kurang dirawat
- ini jenis bug kecil yang merusak trust lebih besar dari ukuran teknisnya

### 2. Visual publik cukup ramai

Landing/register memakai kombinasi dark background, orange, purple, yellow, halftone, gradient, skew, border tebal, shadow hitam, italic uppercase, dan large rounded card. Ini kuat untuk brand, tapi kalau terlalu sering muncul, UI bisa terasa capek.

Risikonya:

- user cepat menangkap energi, tapi lebih lambat membaca detail
- elemen penting dan dekoratif saling berebut perhatian
- mobile view bisa terasa padat

### 3. Typography agresif perlu batas

Heading uppercase italic cocok untuk brand. Tetapi jika terlalu banyak dipakai untuk label kecil, nav, button, table, dan microcopy, readability turun.

Area yang perlu dijaga:

- text micro dengan tracking lebar
- label uppercase kecil
- heading panjang di mobile
- chart/table label di dashboard

### 4. App UI dan marketing UI belum sepenuhnya punya boundary

Secara arah sudah benar: landing sporty, dashboard lebih tenang. Tetapi token warna, text-gradient, uppercase heading, dan brand treatment masih terasa cukup dominan di internal page.

Untuk production jangka panjang, admin harus terasa seperti cockpit kerja: cepat dibaca, minim distraksi, dan nyaman dipakai berulang. Parent portal boleh sedikit lebih branded, tapi tetap harus kalem.

### 5. Accessibility belum bisa disebut matang

Belum ada red flag besar dari struktur dasar, tapi masih ada risiko:

- uppercase + tracking lebar menurunkan readability
- motion/animation perlu menghormati reduced motion
- contrast pada text putih transparan di background image perlu audit real browser
- icon-only or decorative components perlu dipastikan aria-safe
- target tap mobile pada drawer/nav/form perlu dicek langsung

## Rekomendasi Prioritas

### P0: Bersihkan encoding artifact

Cari dan ganti semua karakter mojibake yang mungkin tampil di UI:

- arrow rusak menjadi `->` atau icon SVG
- dash rusak menjadi `-`
- emoji rusak di greeting diganti icon atau teks biasa
- warning icon rusak diganti icon component

Target: tidak ada artifact aneh di halaman publik, register, admin, parent, email/pdf label, dan docs user-facing.

### P1: Audit mobile untuk landing dan register

Cek minimal viewport:

- 360 x 740
- 390 x 844
- 768 x 1024
- desktop 1366+

Fokus:

- hero headline tidak kepotong
- sticky header tidak menutup anchor/section
- mobile drawer nyaman dipakai
- CTA tidak terlalu besar atau terlalu mepet
- form step dan program card tetap mudah dipilih

### P1: Pisahkan intensitas visual per surface

Usulan boundary:

- Public landing: boleh bold, sporty, high-energy.
- Register: masih energetic, tapi lebih tenang dari landing karena user sedang mengisi data.
- Parent: branded tapi calm.
- Admin: paling calm, dense, dan readable.

Ini bukan berarti menghapus identitas brand, tapi mengatur volumenya.

### P2: Buat checklist accessibility UI

Minimum yang layak:

- keyboard navigation untuk nav, drawer, forms, select, dialogs
- visible focus state yang jelas
- reduced motion fallback
- color contrast audit untuk text kecil
- aria-label untuk icon-only button
- no keyboard trap pada drawer/dialog

### P2: Audit component consistency

Komponen yang perlu distandarkan:

- card header spacing
- empty state
- loading state
- error state
- destructive/primary/secondary action hierarchy
- table pagination/filter/search affordance
- modal/dialog footer action order

Targetnya bukan semua halaman harus sama, tapi user tidak perlu belajar pola baru setiap pindah fitur.

## Roadmap UI Battle-Tested

### Phase UI-1: Polish visible defects

Output:

- bersihkan mojibake
- audit copy tombol/menu
- cek real browser halaman public/register/login/admin/parent
- screenshot before/after untuk halaman utama

Definition of done:

- tidak ada karakter rusak terlihat
- semua CTA utama terbaca jelas
- smoke visual manual di mobile dan desktop selesai

### Phase UI-2: Mobile hardening

Output:

- audit layout landing/register di viewport kecil
- perbaiki overflow, cramped spacing, dan sticky header anchor issue
- cek form usability dengan keyboard mobile

Definition of done:

- tidak ada horizontal scroll yang tidak disengaja
- form bisa diisi nyaman di mobile
- nav mobile dan CTA bekerja tanpa overlap

### Phase UI-3: Admin/parent UX audit

Output:

- audit table-heavy pages
- cek empty/loading/error state
- cek action hierarchy pada halaman CRUD
- cek chart readability parent dashboard

Definition of done:

- admin bisa scan data cepat
- state kosong dan error tidak terasa mentah
- parent dashboard tetap mudah dipahami tanpa penjelasan admin

### Phase UI-4: Accessibility pass

Output:

- keyboard-only walkthrough
- focus-visible consistency
- reduced motion support
- contrast audit untuk text kecil

Definition of done:

- flow utama bisa dipakai tanpa mouse
- focus state tidak hilang
- motion tidak mengganggu user sensitif animasi

## Judgment Jujur

UI project ini sudah punya rasa dan tidak terlihat asal jadi. Itu poin besar. Banyak project production justru aman secara teknis tapi hambar secara user-facing; project ini tidak jatuh ke situ.

Namun, UI belum "premium" karena polish kecil masih bisa mengganggu trust. Encoding artifact adalah contoh paling jelas. Selain itu, visual language publik sangat kuat, tapi perlu dikontrol agar tidak semua surface ikut berteriak. Untuk klub basket, energi itu aset. Untuk admin harian, energi berlebihan bisa jadi noise.

Kesimpulan: UI sudah production-acceptable, tapi belum UI battle-tested. Target realistis berikutnya adalah naik ke 8.5+ dengan membersihkan artifact, mobile audit, dan accessibility pass ringan.
