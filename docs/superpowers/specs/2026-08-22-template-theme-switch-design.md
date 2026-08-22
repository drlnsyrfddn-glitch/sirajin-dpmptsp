# Design Spec — Full Theme Switch to `template-baru` (SiRajin Morowali)

> **Status:** Draft untuk direview pemilik produk · **Tanggal:** 22 Agustus 2026

## 1. Ringkasan Eksekutif

Mengganti total sistem visual SiRajin Morowali dari hasil redesign hybrid modern-institusional (navy/emas + lambang Morowali, spec `2026-08-22-ui-ux-redesign-design.md`, sudah live) ke sistem visual baru yang berasal dari 9 file template HTML yang dibawa pemilik produk dari AI lain (`template-baru/*.html`): palet krem/hijau-tua/terracotta "civic-editorial", dengan tipografi Source Serif 4 + Inter (kebetulan sama seperti sistem sebelumnya).

Template-template itu **100% tampilan statis** — tidak ada satu pun yang tersambung ke backend GAS (survei lengkap: nol `id` yang cocok dengan yang dipakai JS backend, semua data hardcode fake, semua link nav pakai nama file bukan `?page=`). Redesign ini pada dasarnya adalah **pengulangan Task 1-10 sebelumnya**, dari basis markup/CSS yang berbeda — bukan "tempel file template lalu selesai".

## 2. Latar Belakang & Masalah

Setelah redesign navy/emas selesai, diverifikasi live, dan disetujui (checkpoint Task 3 + Task 10, lihat spec sebelumnya), pemilik produk membawa 9 halaman template dari AI lain untuk dibandingkan. Setelah dibandingkan (§screenshot langsung, tokoh warna, dan struktur kode), pemilik produk memutuskan **mengganti total** ke tema template — bukan sekadar mengambil ide layoutnya (yang sempat dikerjakan duluan sebagai langkah antara, sudah di-merge ke `master` sebagai commit `4497a90`/`3c8c5db`/`f2daea2`, dan tetap dipertahankan konsepnya — avatar inisial, progress bar, badge status, form terbagi section, bulatan nomor poin — hanya diwarnai ulang).

**Keputusan eksplisit dari pemilik produk:**
- Ganti total ke palet template (krem/hijau/terracotta), bukan navy/emas.
- Ikon shield generik template dipertahankan apa adanya — lambang asli Kabupaten Morowali (`morowali.png`, base64 di `Shared.html`) **dilepas**, tidak dipakai lagi.

## 3. Tujuan (Goals)

- Semua 5 permukaan (9 file halaman) memakai sistem visual template baru, terintegrasi penuh ke backend GAS yang sudah ada.
- Konsep layout yang sudah dibangun & disetujui hari ini (avatar inisial, progress bar, badge status semantik, form section, bulatan nomor) **dipertahankan**, cuma direwarnai ulang pakai token template.
- Nol perubahan file server (`.js`) — sama seperti redesign sebelumnya, semua data yang dibutuhkan sudah tersedia dari service yang ada.
- Nol perubahan pola navigasi/sesi client (`redirectTop()`, `google.script.url.getLocation()`, delegated link listener, `renderAdminNav()`'s session-fetch) — kelas bug yang sama tetap harus dihindari.
- Setiap halaman yang lahir dari template tetap **di-render dinamis** dari data backend (bukan hardcode statis seperti aslinya di `template-baru/`).

## 4. Non-Tujuan (Out of Scope)

- **Tidak** mengubah IA/struktur navigasi — topbar admin tetap `renderAdminNav()` dinamis (bukan topbar statis per halaman seperti di template asli), form pegawai tetap linear (template tidak punya wizard, jadi ini otomatis konsisten).
- **Tidak** menyentuh file server — sama seperti sebelumnya.
- **Tidak** mempertahankan lambang asli Kabupaten Morowali di UI — keputusan eksplisit pemilik produk. `morowali.png` tetap ada di git (provenance), base64-nya di `Shared.html` dihapus dari pemakaian aktif.
- **Tidak** memperkenalkan build step/bundler — template asli juga tidak pakai CDN framework (Tailwind/Bootstrap/dst), cuma Google Fonts + CSS inline, jadi konsisten dengan arsitektur `HtmlService` yang ada.
- **Tidak** mengubah `laporan_kinerja_harian_v4.pdf` — di luar cakupan.

## 5. Token Desain (dari `template-baru/*.html`, diambil apa adanya)

### 5.1 Warna

| Token | Hex | Peran |
|---|---|---|
| `--bg` | `#F5F1E5` | Background halaman (krem/parchment) |
| `--surface` | `#FFFFFF` | Card/panel putih |
| `--surface-alt` | `#EFEADB` | Panel sekunder |
| `--ink` | `#211F19` | Teks utama |
| `--ink-soft` | `#5B5648` | Teks sekunder |
| `--ink-faint` | `#8A8471` | Teks tersier/label |
| `--primary` | `#1F4A3D` | Hijau tua — topbar, panel split-hero |
| `--primary-dark` | `#143128` | Hover dari primary |
| `--primary-soft` | `#E2EAE4` | Tint hijau (background aktif/hover) |
| `--primary-line` | `#C9D6CD` | Border hijau muda |
| `--accent` | `#B75A2E` | Terracotta — tombol utama, aksen eyebrow |
| `--accent-dark` | `#93441F` | Hover dari accent |
| `--accent-soft` | `#F3E2D5` | Tint terracotta |
| `--gold` | `#B4863C` | Aksen emas sekunder |
| `--gold-soft` | `#F1E6CE` | Tint emas |
| `--danger` | `#A23B33` / bg `#F3DEDA` | Error |
| `--success` | `#2F6B52` / bg `#DEEAE2` | Status positif |
| `--warning` | sama dengan `--gold` | Peringatan |
| `--border` | `#DED6C0` | Garis/border |
| `--border-soft` | `#E9E3D2` | Border lebih halus |

**Perubahan dari sistem navy/emas:** SEMUA token `--navy-*`, `--gold-600/700/300`, `--pita-*` dari redesign sebelumnya **dihapus**, digantikan token di atas. `--blue-*` (alias lama dari sistem Notion-esque asli) juga dihapus — sudah tidak ada gunanya sejak alias ke navy pun sekarang diganti total.

### 5.2 Tipografi

- **Source Serif 4** (display) — H1, judul section. Sama seperti sebelumnya, tidak berubah link Google Fonts-nya secara prinsip (masih Source Serif 4 + Inter), cuma bobot font yang dipakai bisa beda — cek file template utk weight yang dipakai (600/700).
- **Inter** — body/UI, tidak berubah.
- Konsep H1 hero vs H1 utility (`h1.h1-compact`) dari redesign sebelumnya **dipertahankan** — tetap relevan (halaman pegawai tetap perlu judul ringkas), cuma warnanya ikut token baru.

### 5.3 Elemen Signature

Template tidak punya elemen "pita lambang" — motif signature dari template adalah **eyebrow label** (garis pendek + teks kapital kecil, mis. "— SISTEM REKAP AKTIVITAS JURNAL INSTANSI") dan **ikon seal bulat generik** (SVG shield, bukan lambang asli). Kedua elemen ini yang dipakai sebagai pengganti pita-lambang & lambang asli.

**Konsep yang dipertahankan dari kerja hari ini** (commit `4497a90` dst), direwarnai ulang:
- `.avatar-initial` — bulatan inisial nama, sekarang pakai `--primary-soft`/`--primary` bukan `--navy-100`/`--navy-900`.
- `.circle-badge` — bulatan nomor poin uraian, sama.
- `.progress-track`/`.progress-fill` — progress bar dashboard, fill pakai `--primary`.
- `.stat-card--success`/`--warning` — border atas kartu stat, pakai `--success`/`--gold`.
- `.badge-aktif`/`.badge-nonaktif` — status pegawai/admin.
- `.form-section` + `.eyebrow` — pengelompokan form, garis eyebrow pakai `--accent` (bukan `--gold-600`).
- `.card--final`/`.card--draft` — aksen kiri kartu Aktivitas Saya.

## 6. Pemetaan ID — kritis, ini yang bikin integrasi jalan atau diam-diam rusak

Setiap file template 100% statis. Tabel ini adalah kontrak wajib: id kolom kanan HARUS ada persis di markup final, karena JS backend yang sudah ada bergantung padanya.

### 6.1 `Home.html` (dari `template-baru/home.html`)
- Tidak ada id yang dibutuhkan backend. Link diganti: `./02-login-pegawai.html` → `?page=login`, `./03-login-admin.html` → `?page=admin-login`.

### 6.2 `Login.html` (dari `template-baru/login-pegawai.html`)
- `input id="nip"` — **sudah cocok** di template, tidak perlu diganti.
- Submit button perlu ditambah `id="btnLogin"`.
- Perlu ditambah elemen `<p class="error-message" id="errorMsg" style="display:none;"></p>`.
- Form template pakai native `<button type="submit">` — ganti jadi `type="button"` (submit native akan reload halaman di GAS, salah).
- Script `google.script.run...loginPegawai(nip)` dari `Login.html` versi sekarang dipindah apa adanya ke file baru ini.
- Link `./03-login-admin.html` → `?page=admin-login`, `./01-landing.html` → `?page=home`.

### 6.3 `AdminLogin.html` (dari `template-baru/login-admin.html`)
- `input id="anip"` → **ganti jadi `id="nip"`**.
- `input id="apw"` → **ganti jadi `id="password"`**.
- Tambah `id="btnLogin"` di tombol submit (ganti `type="submit"` jadi `type="button"`), tambah `id="errorMsg"`.
- Tombol show/hide password (`.pw-toggle`) di template **dekoratif, tidak ada JS** — beri JS minimal (toggle `type` antara `password`/`text`) atau hapus elemen itu kalau ingin strict tanpa fitur baru (rekomendasi: **hapus**, supaya nol penambahan interaksi baru di luar yang sudah ada — sesuai prinsip "nol logic baru" §3).
- Script `google.script.run...loginAdmin(nip, password)` dari `AdminLogin.html` versi sekarang dipindah apa adanya.

### 6.4 `Aktivitas.html` (dari `template-baru/aktivitas-list.html`)
- Date UI template adalah baris `.date-chip` statis (Kam/Jum/Sab/dst, tidak bisa diklik pilih tanggal lain) — **diganti total** dengan `<input type="date" id="tanggal">` polos bergaya sama seperti field lain di halaman ini (pola `.field` yang sudah ada), TIDAK mencoba merekonstruksi tampilan chip horizontal — itu berarti fitur date-picker baru (scroll horizontal, klik pilih hari) yang tidak diminta dan menambah risiko di luar cakupan §3/§4.
- Container timeline: bungkus dengan `<div id="daftarLaporan">`, hapus 3 kartu contoh statis — akan diisi `renderLaporan()` dari `Aktivitas.html` versi sekarang (fungsi JS dipindah, cuma template string HTML-nya diganti gaya template + ditambah `.card--final`/`.card--draft`/`.card-preview` seperti hari ini).
- Tombol "+ Tambah Aktivitas" → `href="?page=aktivitas/tambah"`.
- Action link Edit/Hapus/Finalisasi/Unduh PDF — dibangun ulang di `renderLaporan()` persis seperti sekarang (`onclick="hapusLaporan(...)"`, dst), bukan disalin dari markup statis template.

### 6.5 `TambahAktivitas.html` (dari `template-baru/aktivitas-form.html`) — file paling rumit

| Butuh backend | Ada di template sebagai | Aksi |
|---|---|---|
| `id="judulHalaman"` | judul statis teks `"Tambah Aktivitas"` | Tambah id, biarkan teks jadi default |
| `id="tanggal"` | `<input type="date">` tanpa id | Tambah id |
| `id="jamMulai"` | `<input type="time">` tanpa id | Tambah id |
| `id="jamSelesai"` | `<input type="time">` tanpa id | Tambah id |
| `id="namaAktivitas"` | `<input type="text">` tanpa id | Tambah id |
| `id="daftarUraian"` | `id="pointList"` | **Ganti nama id** |
| `id="btnTambahPoin"` | tombol tanpa id | Tambah id |
| `id="foto1"` | `<input type="file">` di dalam `id="slot0"`, tanpa id sendiri | Tambah id ke `<input>`-nya (bukan ke wrapper `slot0`) |
| `id="foto2"` | sama, di dalam `id="slot1"` | Tambah id ke `<input>`-nya |
| `id="btnSimpan"` | tombol `type="submit"` teks "Simpan Aktivitas" | Tambah id, ganti `type="button"` |
| `id="errorMsg"` | tidak ada | Tambah elemen baru |

- Template punya JS asli (~65 baris): `addPoint()`/`removePoint()`/`renumberPoints()`, `handlePhoto()`/`removePhoto()` (preview foto client-side pakai `FileReader`, TANPA kompresi/resize). **JS ini DIBUANG, diganti total** dengan JS dari `TambahAktivitas.html` versi sekarang (`tambahPoinUraian()`, `kompresGambar()`, `ambilFotoBase64()`, listener `btnSimpan`, mode edit via `google.script.url.getLocation()`) — supaya kompresi foto (resize ke maks 1600px, kualitas 0.8) dan kontrak `saveAktivitas()` tetap terjaga persis. Markup visual template (section grouping, bulatan nomor `id="pointList"` punya numbering built-in di template — reuse tampilannya, tapi sambungkan ke fungsi `tambahPoinUraian()` yang sudah ada) dipertahankan.
- Template TIDAK punya logic mode Tambah vs Edit (fitur ini murni dari kode kita) — tambahkan seperti sekarang: judul & label foto berubah teks kalau `isEditMode`.

### 6.6 `AdminShared.html` (topbar admin) — **TIDAK diambil dari template**

Template punya topbar statis per halaman (4 link hardcoded, class `active` manual per file). Ini **tidak dipakai** — topbar tetap dirender dinamis oleh `renderAdminNav()` yang sudah ada (checks session via `getMySession()`, highlight otomatis, logout), karena mengubah ini jadi statis berarti mengulang static-per-page duplication yang justru template sendiri punya masalahnya (linknya hardcode nama file, bukan `?page=`). **Hanya CSS topbar yang direwarnai** ke `--primary`/`--accent`/dst, struktur & JS `renderAdminNav()` tidak berubah.

### 6.7 `AdminDashboard.html` (dari `template-baru/admin-dashboard.html`)
- Date input: tambah `id="tanggal"`.
- 4 stat card (Pegawai Aktif/Sudah Lapor/Belum Lapor/Rata-rata Jam): bungkus container-nya `id="ringkasan"` (rata-rata jam **dihitung client-side** dari `rekapJam`, karena `DashboardService.js` tidak mengembalikan nilai itu — turunan aritmatika sederhana, bukan data baru dari server).
- "Belum Lapor Hari Ini" + progress bar: `id="belumLapor"` (progress bar sudah ada polanya dari hari ini, `id="progresLapor"` dipertahankan).
- "Rekap Jam Kerja" table: `id="tabelJam"`.
- Nav 4 link hardcoded template → **dihapus**, diganti topbar dinamis dari `AdminShared.html` (§6.6).

### 6.8 `AdminPegawai.html` (dari `template-baru/admin-pegawai.html`)
- Filter bar (search/bidang/status) template — **opsional**: bisa dipasang sebagai filter client-side murni di atas data yang sudah dimuat (tidak butuh endpoint baru), atau disederhanakan dulu ke fungsi yang sudah ada (tanpa filter) supaya scope kecil. Rekomendasi: **filter client-side sederhana** (search by nama/NIP, tidak butuh server) — nice-to-have kecil, aman.
- Modal "Tambah Pegawai" (`id="modalPegawai"`): field nama/NIP/bidang/jabatan tanpa id — tambah id (`pNip`, `pNama`, `pJabatan`, `pUnit`, dst — persis nama yang dipakai `AdminPegawai.html` sekarang) + `id="pegawaiId"` hidden + `id="formError"`.
- Tabel: render dinamis dari `listPegawai()`, bukan 8 baris hardcode.

### 6.9 `AdminAkun.html` (dari `template-baru/admin-akun.html`)
- Modal id **collision** dengan `admin-pegawai.html` (sama-sama `id="modalPegawai"`) — **ganti jadi `id="modalAdmin"`** di file ini.
- Field modal: tambah id (`aNip`, `aNama`, `aLevel` select, `aPassword`, `id="adminId"` hidden, `id="formError"`).
- Tabel: render dinamis dari `listAdmin()`.

### 6.10 `AdminLaporan.html` (dari `template-baru/admin-laporan.html`)
- Filter bar (date-from/date-to/pegawai/status) + tombol "Terapkan Filter"/"Ekspor CSV": filter tanggal+pegawai **sudah didukung** `listLaporanArsip()` — sambungkan (`id="filterMulai"`, `id="filterAkhir"`, `id="filterPegawai"`, `id="btnFilter"`, sama seperti sekarang). Filter status & tombol **"Ekspor CSV"** tidak didukung backend saat ini — **di luar cakupan** (§4), tombol dihilangkan atau dinonaktifkan agar tidak menjanjikan fitur yang tidak ada.
- Tabel: render dinamis dari `listLaporanArsip()`, `id="tabelArsip"`.

## 7. Responsif & Aksesibilitas

- Breakpoint & pola mobile-first dipertahankan sama seperti redesign sebelumnya (768px, touch target 44px, font 16px di input) — template tidak mengubah kontrak ini di file manapun (semua file punya media query serupa, perlu diverifikasi tiap file saat implementasi, bukan diasumsikan).
- **Kontras warna wajib dihitung ulang** (bukan diasumsikan) — token baru belum pernah diverifikasi WCAG. Terutama: teks di atas `--primary` (hijau tua) untuk topbar, `--accent`/`--gold` dipakai sebagai teks di background apa saja.
- Semua pelajaran dari redesign sebelumnya (dua arah kontras beda buat gold di background terang vs gelap, dst) berlaku sama di sini dengan warna baru — jangan diasumsikan otomatis benar hanya karena "dari template AI yang kelihatan bagus".

## 8. Batasan Implementasi

- Semua token & komponen bersama tetap di `Shared.html`/`AdminShared.html`, mengikuti arsitektur `include()` yang sudah ada.
- Base64 lambang (`SIRAJIN_LOGO_SRC`) di `Shared.html` **dihapus** dari pemakaian (§4) — hapus juga elemen `.lambang-logo`/`.split-brand .lambang-logo` dkk yang jadi tidak relevan, ganti dengan ikon shield generik SVG inline dari template (`.brand-name` dkk bisa dipertahankan strukturnya, cuma ikonnya diganti).
- File `morowali.png` tetap di git (tidak dihapus dari repo — biarkan untuk provenance/kemungkinan dipakai lagi nanti), cuma tidak direferensikan aktif di CSS/JS manapun.
- Nol perubahan file server, nol perubahan `redirectTop()`/`google.script.url.getLocation()`/delegated link listener/`requireLogin()`/`requireAdminLogin()`/`handleSessionExpiry()`/`renderAdminNav()`'s session-fetch logic.

## 9. Rencana Rollout & Verifikasi

Sama seperti sebelumnya — staged, checkpoint di tengah, karena ini perubahan besar:

1. **Checkpoint 1**: `Shared.html` (token baru) + `Login.html` (representative kecil, sudah paling dekat kontraknya) dibangun dulu, push ke HEAD, verifikasi live oleh pemilik produk sebelum lanjut ke sisanya.
2. Setelah disetujui: `Home.html`, `AdminLogin.html` (permukaan hero sisanya).
3. `AdminShared.html` (topbar reskin) + 4 halaman admin.
4. `Aktivitas.html` + `TambahAktivitas.html` (paling rumit, dikerjakan terakhir supaya pola id-remap sudah teruji di file-file lain dulu).
5. Push akhir + verifikasi live semua 9 halaman, termasuk regresi kelas bug navigasi (checklist sama seperti sebelumnya).

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| `TambahAktivitas.html` — JS template (addPoint/handlePhoto) tidak sengaja ikut kepakai bareng JS asli, dobel-binding | Implementer harus membuang total blok `<script>` template itu, bukan menggabung — diverifikasi lewat review diff eksplisit |
| Kontras warna baru belum pernah dites | Hitung ulang WCAG untuk tiap kombinasi teks/background baru sebelum push, sama seperti proses redesign sebelumnya (yang menemukan 3 kegagalan kontras nyata) |
| Modal id collision (`modalPegawai` dipakai 2 file) | Sudah diketahui di awal (§6.9), diperbaiki sebagai bagian dari implementasi, bukan ditemukan pas review |
| Filter/Ekspor CSV di `AdminLaporan.html` menjanjikan fitur yang belum ada di backend | Fitur yang tidak didukung backend dihilangkan dari markup, bukan dibiarkan jadi tombol mati (§6.10) |
| Scope besar (9 file) bisa "terasa selesai" padahal ada id yang lolos gak ke-mapping | Setiap file punya tabel pemetaan id eksplisit (§6) yang jadi kontrak — plan implementasi memverifikasi tiap id via grep, bukan visual doang |
