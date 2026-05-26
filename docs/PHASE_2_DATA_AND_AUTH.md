# Phase 2 Data And Auth

## Tujuan

Phase 2 difokuskan untuk menaikkan ketegasan sistem terhadap dua hal:

- `data invariant`
- `authorization boundary`

Artinya, sistem tidak lagi terlalu percaya pada:

- session lama yang mungkin sudah stale
- UI yang diasumsikan selalu mengirim target valid
- foreign-key failure sebagai alat validasi utama
- pemisahan role yang hanya “implisit”

## Prinsip Yang Diterapkan

### 1. Session harus cocok dengan kondisi akun aktif saat ini

Perubahan di [src/lib/server-auth.ts](../src/lib/server-auth.ts):

- `requireAuth()` sekarang tidak hanya cek session ada, tapi juga memastikan user masih aktif di database
- `requireAdmin()` sekarang tidak hanya percaya pada role di token, tapi memastikan akun admin masih aktif di database

Kenapa penting:

- session yang masih hidup setelah akun dinonaktifkan tidak boleh tetap punya akses
- role di token bukan sumber kebenaran final untuk operasi sensitif

### 2. Validasi target domain tidak boleh tercecer

Perubahan di [src/lib/domain-guards.ts](../src/lib/domain-guards.ts):

ditambahkan guard reusable untuk:

- parent aktif
- player aktif
- group aktif
- homebase aktif
- player milik parent tertentu

Kenapa penting:

- aturan kepemilikan dan eksistensi domain jadi konsisten lintas action
- lebih kecil risiko satu action lupa validasi sementara action lain sudah aman

## Area Yang Dihardening

### 1. Player Management

Perubahan di [src/actions/players.ts](../src/actions/players.ts):

- tambah pemain sekarang memverifikasi group tujuan ada
- tambah pemain dengan `parentId` sekarang memverifikasi akun tujuan benar-benar parent aktif
- update pemain sekarang memverifikasi player target masih aktif
- update pemain juga memverifikasi group dan parent tujuan bila diubah
- delete player sekarang memakai guard player aktif
- link player sekarang menolak target parent yang bukan akun parent aktif
- unlink player sekarang memakai guard player aktif

Kenapa penting:

- relasi player → group dan player → parent sekarang lebih tegas di layer aplikasi
- action admin tidak lagi terlalu bergantung pada constraint error dari database

### 2. User Management

Perubahan di [src/actions/users.ts](../src/actions/users.ts):

- update user sekarang menolak target yang sudah tidak aktif
- reset password sekarang menolak target user yang sudah tidak aktif
- delete user sekarang memverifikasi target user masih aktif sebelum proses lanjut
- update self dan forced password change sekarang menolak akun yang sudah dinonaktifkan

Kenapa penting:

- operasi akun sensitif sekarang tidak diam-diam berjalan terhadap akun soft-deleted

### 3. Parent Ownership Flows

Perubahan di [src/actions/family.ts](../src/actions/family.ts) dan [src/actions/stats.ts](../src/actions/stats.ts):

- action keluarga sekarang eksplisit hanya untuk role `PARENT`
- akses attendance keluarga sekarang memakai guard ownership yang reusable
- akses statistik pemain tetap menjaga boundary parent vs admin dengan lebih tegas

Kenapa penting:

- flow parent portal tidak lagi sekadar “secara praktik dipakai parent”, tapi ditegaskan di server

### 4. Certificates

Perubahan di [src/actions/certificates.ts](../src/actions/certificates.ts):

- create certificate sekarang memverifikasi target player benar-benar aktif
- create certificate dengan target group sekarang memverifikasi group benar-benar ada
- akses sertifikat player untuk parent sekarang memakai guard ownership reusable

Kenapa penting:

- sertifikat tidak lagi bisa diarahkan ke target yang invalid hanya karena input lolos dari UI

### 5. Schedule

Perubahan di [src/actions/schedule.ts](../src/actions/schedule.ts):

- create event sekarang memverifikasi homebase dan group target lebih dulu
- update event juga melakukan validasi relasi yang sama

Kenapa penting:

- agenda sekarang tidak lagi terlalu percaya `groupIds` dan `homebaseId` yang datang dari caller

## Test Yang Ditambahkan

File baru:

- [tests/integration/authz-invariants.test.ts](../tests/integration/authz-invariants.test.ts)

Cakupan baru:

- link player gagal jika akun tujuan bukan parent aktif
- certificate gagal jika player target tidak ditemukan
- certificate gagal jika group target tidak ditemukan

Total suite integration setelah Phase 2:

- 4 test files
- 10 tests passing

## Verifikasi Yang Dijalankan

Semua gate berikut lulus:

- `npm run lint`
- `npm run test:integration`
- `npm run build`

## Yang Sudah Lebih Baik Setelah Phase 2

- session stale lebih sulit dipakai untuk akses setelah akun dinonaktifkan
- role boundary tidak lagi hanya tersirat dari flow UI
- relasi penting seperti player-parent, player-group, dan event-group/homebase lebih tegas
- action admin lebih sedikit bergantung pada kegagalan database sebagai validator terakhir
- kode validasi domain lebih mudah dipakai ulang dan lebih konsisten

## Tradeoff Yang Disengaja

Phase ini menambah beberapa query guard sebelum write/read sensitif.

Itu berarti:

- ada sedikit overhead query
- tapi hasilnya authorization dan invariant jadi jauh lebih eksplisit

Untuk phase ini, tradeoff tersebut layak karena targetnya adalah hardening, bukan micro-optimasi.

## Yang Belum Selesai Di Phase 2

Masih ada ruang untuk penguatan lebih lanjut:

- constraint database tambahan untuk beberapa invariant domain jika nanti dibutuhkan
- audit lebih luas pada action lain yang masih admin-only tapi menerima relasi kompleks
- test ownership untuk route handler, bukan hanya server actions
- kebijakan yang lebih eksplisit untuk role selain `ADMIN` dan `PARENT` jika nanti model role bertambah

## Judgement Setelah Phase 2

Setelah hardening ini, project naik dari:

`server-side access mostly correct`

menjadi:

`server-side access and domain invariant more intentionally enforced`

Itu penting karena battle-tested system biasanya tidak gagal di happy path, tapi di area “siapa boleh melakukan apa terhadap data mana”.
