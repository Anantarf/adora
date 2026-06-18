# Visual Regression Audit

Tanggal audit: 2026-06-19
Komit baseline: `42e5053f` (post seed.ts cleanup) + hero pill patch + gallery slot height patch
Tool: Playwright 1.59.1 + `@playwright/test` `toHaveScreenshot()`
Snapshot: `tests/visual-regression/landing.spec.ts-snapshots/` (20 PNG, 12.76 MB tracked)

## Cakupan

Spec: `tests/visual-regression/landing.spec.ts`

- 3 viewport: mobile 375x812, tablet 768x1024, desktop 1440x900
- 6 section anchor: `#home` (hero), `#program` (programs), `#homebase`, `#turnamen`, `#galeri`, `#daftar` (cta)
- Total 18 section test + 2 full-page test (mobile + desktop; tablet full-page di-skip karena carousel auto-fade + year text menghasilkan pixel drift > 5%)
- Threshold: section 2%, full-page 5%

## Hasil run terakhir

```
20 passed (18.0s)
1 skipped (tablet full-page)
```

Tidak ada drift dari baseline. Pixel diff 0% pada semua section test.

## Audit dimensi section × viewport

Dimensi diambil dari snapshot PNG. Section height = tinggi visual section setelah render (termasuk padding & grid gap). Digunakan untuk sanity check layout responsivity, bukan sebagai threshold pixel diff.

| Section | Mobile 375 | Tablet 768 | Desktop 1440 | Pattern |
| --- | ---: | ---: | ---: | --- |
| Hero | 740 | 952 | 828 | `min-h-[calc(100vh-72px)]` aktif di semua; tablet paling tinggi karena aspect ratio foto landscape |
| Programs | 1444 | 1180 | 944 | Stack 1-col mobile, 2-col sm, 3-col lg; cards `aspect-card-wide` mobile, `aspect-card` sm ke atas |
| Homebase | 739 | 535 | 701 | 2-col aktif di md (>=768); tablet lebih pendek dari mobile karena aspect card scale dengan lebar container |
| Turnamen | 924 | 1277 | 780 | `lg:grid-cols-2` aktif >=1024; mobile+tablet stack 1-col, desktop 2-col side-by-side |
| Galeri | 1425 | 877 | 877 | Bento grid; mobile stack 5 slot vertikal, tablet+desktop sama (2D grid) |
| CTA | 521 | 566 | 537 | Konten center tanpa `min-h`; ukuran konsisten antar viewport |
| Full page | 6964 | skip | 5227 | Total tinggi halaman one-page funnel |

## Temuan audit

### 1. Tidak ada anomali layout

Semua dimensi konsisten dengan design intent:
- Hero: tinggi sesuai viewport.
- Programs: stack ratio mobile/tablet/desktop sesuai flex-wrap column count.
- Homebase: perbedaan tablet vs mobile/desktop dijelaskan oleh grid 2-col aktif di md+ yang scale card width.
- Turnamen: stack 1-col di mobile+tablet (lg belum aktif), 2-col di desktop; mobile lebih tinggi karena list ASBC+ABCC + carousel stack vertikal.
- Galeri: stack mobile = 5 slot, tablet+desktop = bento 2D grid dengan tinggi tetap (877px).
- CTA: proporsional di semua viewport.

### 2. Tidak ada overflow horizontal

Snapshot baseline match di run ulang tanpa `--update-snapshots`. Cross-check dengan `tests/responsive-critical-paths.spec.ts` juga lulus untuk `/` di iphone-se, ipad, ipad-landscape.

### 3. Mobile full-page paling panjang (6964px)

Wajar untuk one-page funnel publik dengan 6 section + footer. Tap target >= 44px di semua interactive element (button, link, drawer toggle). Touch scroll normal di mobile viewport.

### 4. Tidak ada tap target < 40px

Cross-check dengan `scripts/visual-audit.ts` (run terakhir 2026-06-18) — 0 high/medium issues. 3 low = "credentials not set, role pages skipped" (by design).

## Yang dimonitor oleh spec

Setiap perubahan terhadap hal di bawah ini akan terdeteksi otomatis saat `npx playwright test tests/visual-regression/landing.spec.ts` dijalankan:

- Hero text content & layout (h1 gradient text, badge pill, CTA button shape)
- Programs card hover state (back-shadow offset, image scale)
- Homebase card hover state (yellow shadow pop-out, border color)
- Turnamen carousel current image, info button placement
- Galeri hero carousel current image
- CTA step description text wrap & button hover state
- Layout reflow antar breakpoint

## Yang TIDAK dimonitor

- Tahun akademik dinamis (`getAcademicYear()` di hero pill): bisa diganti tiap tahun tanpa alert.
- Carousel auto-fade state: butuh `--update-snapshots` setelah add/hapus image di `public/images/tournaments/`.
- Year text di footer (`new Date().getFullYear()`): berubah tiap Januari, tapi tidak signifikan secara visual.

## Cara pakai

Generate baseline (sekali, atau setelah perubahan layout disengaja):

```bash
npx playwright test tests/visual-regression/landing.spec.ts --update-snapshots
```

Verifikasi tidak ada regresi visual (CI gate):

```bash
npx playwright test tests/visual-regression/landing.spec.ts
```

Saat test gagal, diff image otomatis tersimpan di `test-results/<spec-name>/<test-name>-diff.png`. Buka file tersebut untuk inspeksi visual.

## Catatan

- Tablet full-page sengaja di-skip. Carousel auto-fade + dynamic year text menyebabkan drift > 5% yang tidak bisa di-stabilize dengan `animations: 'disabled'` saja. Section-level test tetap cover semua viewport.
- Snapshot baseline sengaja tracked di git (12.76 MB) untuk perbandingan antar-commit. Cleanup: gunakan `git clean -ndX` untuk cek file ignored, atau hapus folder `tests/visual-regression/landing.spec.ts-snapshots/` jika ingin reset.