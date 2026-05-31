# Supabase Storage and ACL Notes

## Keputusan Yang Diambil

Project ini memakai Supabase Storage dengan pola berikut:

- bucket operasional untuk upload dibuat private
- URL yang disimpan di database adalah URL internal aplikasi, bukan public bucket URL
- akses file dibuka lewat route aplikasi yang bisa diberi validasi session dan relasi data

## Alasan

- file operasional klub seperti foto, signature, sertifikat, dan dokumen internal tidak cocok dipasang di public bucket
- parent hanya perlu melihat file yang memang terkait dengan anaknya
- admin tetap perlu akses penuh untuk operasional dashboard
- aset publik seperti banner, logo, dan gambar landing page tetap boleh dipisah ke bucket publik terpisah bila diperlukan

## Rekomendasi ACL

Untuk project ini, default yang paling aman dan paling simpel adalah:

- semua file operasional masuk ke bucket private `uploads`
- aset publik dipisah ke bucket public lain kalau memang ada kebutuhan marketing
- route aplikasi yang menentukan siapa boleh akses file, bukan Supabase bucket public

### Matrix Akses yang Disarankan

| Jenis File                | Bucket                 | Siapa Boleh Akses      | Catatan                                  |
| ------------------------- | ---------------------- | ---------------------- | ---------------------------------------- |
| Foto pemain               | private `uploads`      | admin                  | jangan expose langsung ke public         |
| Signature                 | private `uploads`      | admin                  | sensitif, tidak perlu public             |
| Dokumen internal          | private `uploads`      | admin                  | termasuk file operasional dashboard      |
| Sertifikat                | private `uploads`      | admin + parent terkait | hanya untuk pemain individual            |
| Rapor PDF                 | private `uploads`      | admin + parent terkait | hanya parent yang punya player terkait   |
| File evaluasi             | private `uploads`      | admin + parent terkait | jika memang ditampilkan ke parent portal |
| Logo/banner/galeri publik | public bucket terpisah | publik                 | jangan dicampur dengan data operasional  |

### Admin-only

Gunakan untuk:

- foto pemain
- signature
- dokumen internal
- file upload operasional dashboard

### Admin + Parent Terkait

Gunakan untuk:

- sertifikat (hanya pemain individual)
- rapor PDF
- file evaluasi pemain

Validasi akses harus mengikuti relasi data, bukan hanya role login.

### Public

Gunakan hanya untuk aset marketing dan landing page seperti:

- logo
- banner
- galeri publik

Kalau aset publik jumlahnya kecil, tetap boleh dibuat bucket public terpisah supaya file operasional tidak ikut terbuka.

## Implementasi Saat Ini

- upload masuk ke bucket private `uploads`
- file dibuka melalui route internal `/api/storage/uploads/...`
- route internal sekarang sudah membedakan akses:
  - admin: bisa membuka semua private upload
  - parent: hanya bisa membuka file certificate yang terkait anaknya
  - file foto/signature pemain tetap admin-only

## Rekomendasi Final Untuk Case Ini

Untuk client klub basket seperti ADORA, pilihan paling masuk akal adalah:

1. bucket private untuk semua file operasional
2. bucket public terpisah hanya untuk aset marketing
3. route aplikasi sebagai pintu akses file
4. ACL berdasarkan role + relasi data, bukan sekadar login status

Dengan pola ini, konfigurasi tetap sederhana, risiko kebocoran file turun, dan struktur akses masih mudah dipahami tim non-teknis.

## Catatan Operasional

- kalau ada file yang seharusnya sensitif, jangan simpan sebagai URL public langsung
- kalau kebutuhan akses makin kompleks, pertahankan bucket private dan pindahkan keputusan akses ke aplikasi, bukan ke bucket publik
- untuk aset yang benar-benar publik, gunakan bucket terpisah agar tidak bercampur dengan data operasional
