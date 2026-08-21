# Design Spec — Redesign UI/UX SiRajin Morowali

> **Status:** Draft untuk direview pemilik produk · **Tanggal:** 22 Agustus 2026

## 1. Ringkasan Eksekutif

Redesign visual menyeluruh atas 5 permukaan **SiRajin Morowali** (landing, login pegawai, tampilan pegawai, login admin, tampilan admin) yang saat ini memakai gaya "Notion-esque" generik (biru `#2383E2`, Inter, card shadow tipis — hasil polish pass `f3099f1`, 2026-08-21). Redesign ini menggantikannya dengan sistem visual **hybrid modern-institusional**: identitas resmi Kabupaten Morowali (lambang, warna perisai) dipadukan dengan tipografi, spacing, dan komponen bergaya produk digital modern.

Pendekatan yang dipilih (lihat §8) sengaja membatasi perubahan pada lapisan visual/markup saja — **nol perubahan pada logic navigasi client-side atau kode server** — karena seluruh bug kritis yang ditemukan di Task 10 (lihat git log `9c85c94`..`7b474b3`, khususnya commit `c665bd1` dan `7b474b3`) berasal dari kelas yang sama: navigasi di dalam sandbox iframe GAS. Menambah state JS baru (sidebar, wizard, tab bar) akan membuka kembali permukaan bug itu; redesign ini menghindarinya dengan sengaja.

## 2. Latar Belakang & Masalah

Pemilik produk menilai UI hasil polish pass 2026-08-21 belum "bagus dan modern professional" — masih terasa seperti template SaaS generik, tidak mencerminkan identitas SiRajin sebagai aplikasi resmi instansi pemerintah (DPMPTSP Kabupaten Morowali). Lambang resmi Kabupaten Morowali (`morowali.png`, ada di root repo) belum dipakai sama sekali di aplikasi.

## 3. Tujuan (Goals)

- Tampilan terasa "bagus, modern, dan professional" — bukan template SaaS generik, juga bukan portal pemerintah yang kaku/ketinggalan zaman.
- Identitas resmi Kabupaten Morowali (lambang, warna perisai, motto "Tepe Asa Maroso") terintegrasi secara wajar di landing, login, dan topbar admin.
- Redesign tidak membuka kembali kelas bug navigasi GAS sandbox yang sudah susah payah diperbaiki di Task 10.
- Perubahan bisa diverifikasi bertahap: 1 halaman contoh disetujui dulu sebelum diterapkan ke sisanya.

## 4. Non-Tujuan (Out of Scope)

- **Tidak** mengubah IA/struktur navigasi — topbar admin tetap topbar (bukan sidebar), form pegawai tetap satu kolom linear (bukan wizard multi-step). Ini eksplisit ditolak sebagai Pendekatan 2 (lihat §8) karena risiko regresi navigasi.
- **Tidak** menyentuh file server (`Auth.js`, `AktivitasService.js`, `AdminService.js`, `DashboardService.js`, `PegawaiService.js`, `PdfGenerator.js`, `Utils.js`, `Setup.js`, `Code.js`) — murni redesign visual/markup pada file `.html` di `src/`.
- **Tidak** mengubah template PDF laporan (`laporan_kinerja_harian_v4.pdf`) — di luar cakupan, itu dokumen Google Docs terpisah.
- **Tidak** memperkenalkan build step/bundler/framework — tetap HTML+CSS+JS inline sesuai model `HtmlService` Apps Script yang sudah ada.
- **Tidak** dark mode — tidak diminta, di luar cakupan v1 redesign ini.

## 5. Token Desain

### 5.1 Warna

| Token | Hex | Peran |
|---|---|---|
| `--navy-900` | `#163A6B` | Primary — topbar admin, panel gelap landing/login |
| `--navy-700` | `#1E4E8C` | Hover state dari navy-900 |
| `--navy-600` | `#2C6CB0` | Interactive — tombol, link, focus ring |
| `--navy-100` | `#EAF1FA` | Tint — surface aktif/hover |
| `--gold-600` | `#C9971F` | Accent institusional — angka stat, pita lambang, warning |
| `--ink-900` | `#1E2A38` | Teks utama (netral dingin, selaras navy) |
| `--ink-600` | `#5B6B7A` | Teks sekunder/label |
| `--paper` | `#FFFFFF` | Background card/panel putih |
| `--surface` | `#F5F7FA` | Background halaman |
| `--border` | `#DFE4EA` | Garis/border |
| `--success` | `#2F9E5B` | Badge "Tersimpan"/Final — **tidak diganti gold**, tetap hijau supaya makna status gak rancu sama accent gold |
| `--danger` | `#D64545` | Error, disegarkan dari `#F64932` sebelumnya |

Warna lambang (hijau `#2F7D4F`, merah `#B23A2E`) **hanya** dipakai di elemen signature "Pita Lambang" (§5.3) — tidak dipakai sebagai warna fungsional UI (tombol/badge/status), untuk menghindari tabrakan makna dengan token semantik di atas.

### 5.2 Tipografi

- **Source Serif 4** (display) — dipakai di semua H1, tapi dalam **2 ukuran** tergantung konteks halaman (lihat pemisahan di bawah). Kesan dokumen resmi, senada dengan sifat formal laporan PDF yang dihasilkan aplikasi ini.
- **Inter** (tetap, sudah dipakai) — semua UI, form, tabel, body text.
- `font-variant-numeric: tabular-nums` (sudah ada di `.stat-number`, `.admin-table td`) dipertahankan, diperluas ke tampilan jam mulai/selesai di kartu Aktivitas (§6.2).

**H1 hero vs H1 utility** — ditambahkan setelah review checkpoint Task 3 (produk owner menandai H1 32px terasa kebesaran buat halaman yang dibuka pegawai berkali-kali sehari dari HP):

| Konteks | Ukuran | Halaman |
|---|---|---|
| **Hero** (rule `h1` default, 32px) | Halaman yang dibuka jarang/sekali per sesi, desktop-first atau splash-style | `Home.html`, `Login.html`, `AdminLogin.html` (judul di `.split-form`), 4 halaman admin (`Dashboard Kepatuhan`, `Kelola Pegawai`, `Kelola Laporan`, `Kelola Admin`) |
| **Utility** (class `h1.h1-compact`, 22px) | Halaman yang dibuka pegawai berulang kali sehari, HP-first, butuh hemat ruang vertikal di atas layar kecil | `Aktivitas.html` ("Aktivitas Saya"), `TambahAktivitas.html` ("Tambah Aktivitas"/"Edit Aktivitas") |

`h1.h1-compact` mewarisi `font-family`/`font-weight`/`letter-spacing` dari rule `h1` dasar, cuma override `font-size` (22px), `line-height` (1.25), dan `margin` (0 0 12px) — tetap Source Serif, cuma lebih ringkas.

### 5.3 Elemen Signature — "Pita Lambang"

Strip horizontal 4px, 4 segmen proporsional (hijau–biru–emas–merah, mengikuti warna perisai lambang Kabupaten Morowali), dipakai **satu kali per konteks halaman** — bukan elemen berulang:

- Tepi atas panel gelap pada landing/login (split-panel, §6.1) — baris pertama di dalam panel, di atas logo.
- Garis pembatas tipis di bawah topbar admin (§6.3).
- Garis pembatas tipis di bawah H1 pada halaman pegawai (§6.2).

## 6. Layout per Permukaan

### 6.1 Landing (`Home.html`) & Login (`Login.html`, `AdminLogin.html`) — Split Panel

Desktop (≥768px):

```
┌───────────────────┬──────────────────────────┐
│▓▓▓▓ pita lambang ▓▓│                          │
│                    │   Login Pegawai          │
│    [lambang logo]  │                          │
│                    │   NIP                    │
│  SiRajin Morowali  │   [______________]       │
│  (Source Serif)    │                          │
│  "Tepe Asa Maroso" │   [   Masuk   ]           │
│  (caption kecil)   │                          │
│  panel navy-900    │   panel putih             │
└───────────────────┴──────────────────────────┘
```

Mobile (<768px): panel navy jadi header pendek di atas (logo lebih kecil, caption tetap ada), form menyusul langsung di bawah tanpa scroll jauh — stack vertikal, bukan sejajar.

`Home.html` memakai pola sama; sisi form diganti tagline singkat + tombol "Login Pegawai". `AdminLogin.html` sama seperti `Login.html`, field password ditambahkan.

### 6.2 Halaman Pegawai (`Aktivitas.html`, `TambahAktivitas.html`) — Struktur Tetap 1 Kolom

```
┌─────────────────────────────┐
│ Aktivitas Saya                │ <- Source Serif, pita-strip tipis di bawah judul
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ [ Tanggal: ____ ]             │
│ ┌─────────────────────────┐  │
│ │ 08:00–10:30  [Tersimpan] │  │ <- jam besar/bold, tabular-nums
│ │ Monitoring Jaringan MPP   │  │
│ │ Unduh PDF | Edit          │  │
│ └─────────────────────────┘  │
│ [+ Tambah Aktivitas]          │
└─────────────────────────────┘
```

`TambahAktivitas.html` mempertahankan struktur field-by-field yang sama persis (tanggal, jam mulai/selesai, nama aktivitas, uraian dinamis, upload foto) — hanya dapat polesan token baru, tanpa reorganisasi jadi wizard.

### 6.3 Halaman Admin — Topbar Dipertahankan, Dipoles

```
┌──────────────────────────────────────────┐
│ [logo] SiRajin Admin  Dashboard Pegawai…  Nama (Keluar) │ <- topbar navy-900
│▓▓▓▓▓▓▓▓▓▓ pita lambang (4px) ▓▓▓▓▓▓▓▓▓▓▓▓ │
│  Dashboard Kepatuhan (Source Serif)         │
│  [ 12 ]Aktif  [ 9 ]Sudah Lapor [ 3 ]Belum   │ <- stat-card, angka gold-600
│  ┌─ tabel rekap jam (netral dingin) ──────┐│
└──────────────────────────────────────────┘
```

Pola yang sama diterapkan ke `AdminDashboard.html`, `AdminPegawai.html`, `AdminLaporan.html`, `AdminAkun.html` — topbar, judul, dan token seragam; konten tabel/form tiap halaman tidak berubah struktur.

## 7. Komponen & State

- **Tombol** (`.btn-primary`, `.btn-ghost`): warna dasar berubah ke `--navy-600`/hover `--navy-700`, transisi 150ms dipertahankan (tidak ditambah motion baru).
- **Badge**: `badge-final` tetap hijau `--success` (bukan gold), `badge-draft` netral, `badge-error` tetap merah `--danger`. Gold direservasi ketat untuk stat number, pita lambang, dan warning saja.
- **Card/Input**: shadow & border-radius disegarkan mengikuti token baru, tanpa mengubah markup/DOM yang menjadi target `document.getElementById`/`querySelector` di JS existing.
- **Error message/toast**: hanya gaya warna yang berubah (`--danger` baru); logic (`showToast`, `errorMsg` show/hide) sama sekali tidak disentuh — nol jalur error baru diperkenalkan.

## 8. Pendekatan yang Dipilih & Alasan

Dua pendekatan diusulkan; **Pendekatan 1 (Visual Overhaul)** dipilih:

1. **Visual Overhaul, Pola Interaksi Tetap** *(dipilih)* — dampak visual besar lewat token, tipografi, dan split-panel, **nol JS navigasi baru**. `redirectTop()`, `google.script.url.getLocation()`, dan delegated link listener di `Shared.html` tidak diubah strukturnya.
2. **Modernisasi Struktural** *(ditolak)* — sidebar admin, bottom tab-bar mobile, wizard form. Wow-factor lebih tinggi tapi menambah state JS baru (toggle sidebar, step wizard) yang harus diuji ulang terhadap sandbox gotcha yang sudah ditemukan (commit `7b474b3`, `c665bd1`). Bisa dipertimbangkan sebagai peningkatan lanjutan di masa depan, setelah Pendekatan 1 stabil.

## 9. Responsif & Aksesibilitas

- Breakpoint 768px untuk collapse split-panel jadi stack vertikal.
- Touch target ≥44px, `font-size: 16px` pada input (cegah auto-zoom iOS) — dipertahankan dari sistem sekarang.
- `:focus-visible` dipertahankan, diperluas ke elemen baru (link panel split, nav admin).
- `prefers-reduced-motion` dihormati untuk transisi hover/tombol.
- Kontras warna diverifikasi manual saat implementasi: teks putih di atas `--navy-900`, `--gold-600` di atas putih (target WCAG AA, khususnya untuk stat number dan teks di panel gelap).

## 10. Batasan Implementasi

- Semua token & CSS komponen baru hidup di `Shared.html` (dipakai semua halaman via `include('Shared')`) dan `AdminShared.html` (khusus admin: topbar navy, pita-strip, stat-card gold) — mengikuti pola `include()` yang sudah ada, tidak ada file CSS terpisah baru.
- Font Source Serif 4 ditambahkan lewat Google Fonts `<link>` yang sama seperti Inter sekarang.
- Lambang (`morowali.png`) perlu di-upload ke Google Drive/di-encode base64 agar bisa ditampilkan dari dalam `HtmlService` (GAS tidak bisa serve file statis dari root repo langsung) — detail teknis ini diputuskan saat implementation plan (`writing-plans`).

## 11. Rencana Rollout & Verifikasi

1. **Checkpoint pertama**: `Login.html` dibangun penuh dengan token + layout baru.
2. `npm test` — harus tetap 16/16 (test tidak menyentuh HTML/CSS, tapi wajib dijalankan untuk memastikan tidak ada regresi tak sengaja).
3. `clasp push` ke deployment live.
4. Verifikasi live: render desktop & mobile, kontras warna, `redirectTop`/link nav tidak regresi (checklist eksplisit terhadap kelas bug Task 10).
5. **Pemilik produk mereview halaman Login yang live** sebelum lanjut.
6. Setelah disetujui: pola yang sama diterapkan ke 4 permukaan sisanya (`Home.html`, `AdminLogin.html`, `Aktivitas.html`+`TambahAktivitas.html`, 4 halaman admin) sekaligus.
7. `clasp push` + verifikasi live final untuk seluruh 5 permukaan.

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Kontras warna navy-900/gold-600 tidak cukup buat aksesibilitas | Cek kontras manual (target WCAG AA) sebelum `clasp push` checkpoint pertama |
| Lambang (`morowali.png`) perlu proses ekstra buat ditampilkan di GAS `HtmlService` | Ditangani eksplisit sebagai langkah implementation plan, bukan diasumsikan "tinggal taruh" |
| Restyle CSS gak sengaja ganggu selector yang dipakai JS (`getElementById`, dst) | Markup/DOM id & class struktural tidak diubah — hanya gaya (warna, spacing, font) yang diganti |
