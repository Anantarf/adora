# Phase 3 Scale And Performance

## Tujuan

Phase 3 difokuskan untuk memastikan area admin yang paling sering dipakai tetap sehat saat data tumbuh.

Fokus utamanya:

- mengurangi payload besar yang sebelumnya ditarik penuh ke browser
- memindahkan pagination dan filtering ke database
- menambahkan guard agar page size tidak melebar diam-diam
- mulai mendokumentasikan batas aman operasional yang disengaja

## Masalah Utama Yang Ditutup

Sebelum phase ini:

- halaman `players` mengambil semua pemain per grup lalu memotongnya di client
- halaman `users` mengambil semua akun per role lalu mencari dan memotongnya di client
- cost query dan payload akan naik seiring data, walaupun user hanya melihat 1 halaman

Untuk data kecil ini masih terasa aman, tapi untuk skala production itu pola yang mudah membengkak tanpa terasa.

## Perubahan Yang Dikerjakan

### 1. Players Admin Page Dipindahkan ke Server Pagination

Perubahan di [src/actions/players.ts](../src/actions/players.ts), [src/hooks/use-players.ts](../src/hooks/use-players.ts), dan [src/app/(admin)/dashboard/players/page.tsx](../src/app/%28admin%29/dashboard/players/page.tsx):

- ditambahkan `getPlayersPageAction()`
- query pemain admin sekarang menerima `groupId`, `searchQuery`, `page`, dan `pageSize`
- pagination dihitung di database lewat `count + skip + take`
- page yang di luar batas sekarang dinormalisasi di server
- page size dibatasi maksimum `50`
- halaman players sekarang memakai `usePlayersPage()` alih-alih memotong array hasil penuh di browser

Kenapa penting:

- browser tidak lagi menanggung daftar pemain penuh hanya untuk menampilkan 9 kartu
- saat data grup membesar, cost render dan memory client ikut lebih stabil
- invalid current page setelah delete/filter tidak lagi menghasilkan state sync yang rapuh di client

### 2. Users Admin Page Dipindahkan ke Server Pagination dan Search

Perubahan di [src/actions/users.ts](../src/actions/users.ts), [src/hooks/use-users.ts](../src/hooks/use-users.ts), dan [src/app/(admin)/dashboard/users/page.tsx](../src/app/%28admin%29/dashboard/users/page.tsx):

- ditambahkan `getUsersPageAction()`
- pencarian nama, username, dan email sekarang dilakukan di database
- pagination akun admin/parent sekarang memakai `count + skip + take`
- page yang out of range dinormalisasi di server
- page size dibatasi maksimum `50`
- halaman users sekarang tidak lagi memfilter array besar di client

Kenapa penting:

- pencarian akun tetap ringan walau jumlah parent/admin naik
- network payload menurun karena browser hanya menerima page aktif
- halaman users lebih realistis untuk data production, bukan hanya data demo

### 3. Guard Operasional untuk Beban List

Perubahan di action paginated:

- `page` minimal `1`
- `pageSize` maksimal `50`
- total page dihitung konsisten di server lalu dikembalikan ke UI

Kenapa penting:

- endpoint internal tidak bisa dipakai menarik ratusan row per request hanya karena bug UI atau caller nakal
- batas ini memberi baseline aman sambil tetap cukup nyaman untuk admin workflow

## Test Yang Ditambahkan

File baru:

- [tests/integration/pagination.test.ts](../tests/integration/pagination.test.ts)

Cakupan baru:

- players admin page query memakai `skip/take` dan filter database yang benar
- users admin page query memakai `skip/take` dan search database yang benar
- page size berlebihan ditolak

Total suite integration setelah Phase 3:

- 5 test files
- 13 tests passing

## Verifikasi Yang Dijalankan

Semua gate berikut lulus setelah perubahan:

- `npm run lint`
- `npm run test:integration`
- `npm run build`

## Yang Sudah Lebih Baik Setelah Phase 3

- dua halaman admin yang paling rawan membengkak sekarang tidak lagi bergantung pada client-side slicing
- query list lebih dekat ke pola production yang sehat
- pagination behavior lebih stabil saat total data berubah
- scale baseline project naik tanpa mengorbankan UX yang sudah ada

## Batas Yang Masih Perlu Diingat

Phase 3 ini belum berarti semua area sudah perfect pada data besar.

Yang masih layak dipertimbangkan di fase berikutnya:

- registrasi pending masih bisa dievaluasi lagi jika volumenya besar
- halaman statistik dan dialog sertifikat masih punya consumer yang sengaja mengambil list pemain penuh
- export/report tetap perlu diuji dengan volume data besar nyata, bukan hanya query list biasa

## Judgement Setelah Phase 3

Setelah phase ini, project naik dari:

`works fine on moderate data`

menjadi:

`starts enforcing scale-aware list access on the most exposed admin paths`

Itu penting karena banyak project terlihat cepat sampai jumlah data naik, lalu baru terasa mahal. Phase ini mendorong bottleneck itu pindah ke tempat yang lebih tepat: database query yang terukur, bukan browser admin.
