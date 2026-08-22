# SiRajin Morowali — Rewrite Bersih (GAS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun project GAS SiRajin Morowali baru bersih di folder lokal `sirajin-baru/` — backend ditulis ulang identik (TDD) + frontend 9 halaman dari bundle cream/hijau, tanpa warisan navy.

**Architecture:** Google Apps Script HtmlService. Backend = server `.js` (Auth/Pegawai/Admin/Aktivitas/Dashboard/Pdf/Utils/Setup/Code) dengan `module.exports` bridge untuk Jest. Frontend = `Shared.html` (tokens+helper) + `AdminShared.html` (chrome admin) + 9 halaman, tiap halaman diadaptasi dari file bundle `template-baru/bundle-extracted/design-reference/NN-*.html` (CSS/markup dipakai, JS bundle yang inert dibuang, disambung ke fungsi server via `google.script.run`).

**Tech Stack:** Google Apps Script, Google Sheets/Drive/Docs, Google Fonts (Source Serif 4 + Inter), clasp, Jest.

**Spec:** `docs/superpowers/specs/2026-08-22-sirajin-fresh-gas-design.md` — §Data Model, §Alur Pegawai/Admin, §Fungsi Server, §Palette, §Frontend adalah acuan otoritatif.

## Global Constraints

- **Semua file baru dibuat di folder `sirajin-baru/`** (bukan di `src/` project lama). Project lama `sirajin-morowali` tidak disentuh.
- **Tanggal & Jam ditulis ke Sheets sebagai teks literal** (prefix `'` via helper `sebagaiTeks_`) — cegah auto-konversi Date.
- **Field Date tidak dikirim mentah lewat `google.script.run`** — konversi ke ISO string dulu (helper `formatWaktu_`).
- **Palette dari spec §Palette** — pakai `--ink-faint:#6B6558` dan `--gold-text:#6B4E1E` (fix WCAG), bukan nilai bundle asli. Nol token navy.
- **Warna sebagai teks → hitung rasio kontras**, jangan eyeball.
- **Session**: token UUID di CacheService, TTL 6 jam, sliding refresh.
- **Baseline test** naik tiap task backend yang menambah test; tiap task lapor jumlah pasti (mis. `Tests: N passed`).
- **Foto aktivitas**: wajib 1–2 saat buat baru; edit boleh kosong (pertahankan lama); maks 2.
- **Status Aktivitas** hanya `Draft`/`Final`. Final tak bisa edit/hapus.
- **crest Morowali base64** disimpan di `Shared.html` sebagai `SIRAJIN_LOGO_SRC`, di-inject ke tiap placeholder logo.

## Catatan urutan

Task 0 (scaffold) dulu — semua task lain butuh folder + package.json. Task 1-2 (Utils, Auth) foundational untuk semua service. Task 9 (Shared.html tokens) harus sebelum halaman apapun. Task 10 (AdminShared) sebelum halaman admin. Halaman leaf (11-19) boleh urut apa saja setelah shared siap, tapi diurut per kompleksitas. Task 20 = verifikasi + finalisasi.

---

## Task 0: Scaffold project baru

**Files:**
- Create: `sirajin-baru/appsscript.json`, `sirajin-baru/package.json`, `sirajin-baru/.gitignore`, `sirajin-baru/README.md`

**Interfaces:** Produces: struktur folder + `npm test` yang bisa jalan (0 test dulu, exit 0).

- [ ] **Step 1: Buat folder & appsscript.json**

`sirajin-baru/appsscript.json`:
```json
{
  "timeZone": "Asia/Makassar",
  "dependencies": {},
  "webapp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS" },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

- [ ] **Step 2: package.json**

`sirajin-baru/package.json`:
```json
{
  "name": "sirajin-baru",
  "version": "1.0.0",
  "scripts": { "test": "jest" },
  "devDependencies": { "jest": "^29.7.0" }
}
```

- [ ] **Step 3: .gitignore + README**

`sirajin-baru/.gitignore`:
```
node_modules/
.clasp.json
```
`sirajin-baru/README.md`: judul + langkah deploy dari spec §Deploy.

- [ ] **Step 4: Install & verifikasi**

Run: `cd sirajin-baru && npm install && npx jest --passWithNoTests`
Expected: exit 0, "No tests found... passing".

- [ ] **Step 5: Commit**

```bash
git add sirajin-baru/
git commit -m "chore: scaffold sirajin-baru GAS project"
```

---

## Task 1: `Utils.js` + test (TDD)

**Files:**
- Create: `sirajin-baru/src/Utils.js`, `sirajin-baru/tests/utils.test.js`
- Reference (baca, jangan salin buta): `src/Utils.js` project lama

**Interfaces:**
- Produces: `isValidNIP(nip)` → bool (18 digit setelah spasi dibuang); `isValidTimeRange(mulai, selesai)` → bool (selesai > mulai, format HH:MM); `calculateDurationMinutes(mulai, selesai)` → number; `formatDuration(menit)` → string `"7j 30m"`. Semua diekspor via `module.exports` untuk Jest.

- [ ] **Step 1: Tulis test dulu (RED)** — `tests/utils.test.js` minimal 10 test: NIP valid/invalid/berspasi/kurang-digit; time-range valid, selesai<mulai, selesai==mulai, format salah; durasi lintas jam; formatDuration <60 menit, tepat 60, >60.
- [ ] **Step 2: Jalankan test, pastikan GAGAL** — `cd sirajin-baru && npx jest tests/utils.test.js` → FAIL (module belum ada).
- [ ] **Step 3: Implementasi `src/Utils.js`** hingga semua test hijau. Akhiri file dengan bridge `if (typeof module !== 'undefined' && module.exports) { module.exports = { ... } }`.
- [ ] **Step 4: Jalankan test, pastikan LULUS** — semua hijau, output bersih.
- [ ] **Step 5: Commit** — `git add sirajin-baru/src/Utils.js sirajin-baru/tests/utils.test.js && git commit -m "feat: add Utils with NIP/time validation (TDD)"`

---

## Task 2: `Auth.js` + test (TDD)

**Files:**
- Create: `sirajin-baru/src/Auth.js`, `sirajin-baru/tests/auth.test.js`
- Reference: `src/Auth.js` project lama

**Interfaces:**
- Consumes: `isValidNIP` (Task 1).
- Produces: `hashPassword(password)` (SHA-256 hex; cabang `Utilities` di GAS, fallback `crypto` untuk Jest), `generateToken()`, `getSheet(name)`, `loginPegawai(nip)` → `{success, token, session}` | `{success:false, message}`, `loginAdmin(nip, password)`, `validateToken(token)` → session|null (sliding refresh 6 jam), `requireAdmin_(token)`, `getMySession(token)`. Session pegawai: `{role:'pegawai', nip, nama, jabatan, unitKerja}`; admin: `{role:'admin', nip, nama, level}`.

- [ ] **Step 1: Tulis test (RED)** — `tests/auth.test.js` untuk `hashPassword`: hasil 64-char hex, deterministik, beda input beda hash, string kosong tetap hash valid. (Fungsi ber-GAS-API tidak di-unit-test; diuji manual saat live.)
- [ ] **Step 2: Verifikasi GAGAL** — `npx jest tests/auth.test.js`.
- [ ] **Step 3: Implementasi `src/Auth.js`** — konstanta `SESSION_TTL_SECONDS = 21600`. Login pegawai: bersihkan spasi NIP, validasi format, cari di sheet Pegawai, tolak jika status ≠ `Aktif`. Login admin: cari di sheet Admin, tolak jika nonaktif, bandingkan hash password. Token disimpan `CacheService.getScriptCache().put(token, JSON.stringify(session), TTL)`.
- [ ] **Step 4: Verifikasi LULUS** — `npm test` semua hijau (Utils + Auth).
- [ ] **Step 5: Commit** — `git commit -m "feat: add Auth with NIP/password login + session cache (TDD)"`

---

## Task 3: `Setup.js` + `Code.js`

**Files:**
- Create: `sirajin-baru/src/Setup.js`, `sirajin-baru/src/Code.js`
- Reference: `src/Setup.js`, `src/Code.js` project lama

**Interfaces:**
- Produces: `setupAwal()` — buat spreadsheet (sheet `Pegawai`/`Admin`/`Aktivitas` + baris header sesuai spec §Data Model), buat folder Drive `SiRajin Foto` & `SiRajin PDF`, simpan `SPREADSHEET_ID`/`FOLDER_FOTO_ID`/`FOLDER_PDF_ID` ke Script Properties, buat 1 akun SuperAdmin awal. `setTemplateDocId(id)` — simpan `TEMPLATE_DOC_ID`. `doGet(e)` — routing `?page=` ke file HTML (map: home/login/aktivitas/aktivitas-tambah/admin-login/admin/admin-pegawai/admin-laporan/admin-akun), default `home`, set title + viewport meta + `XFrameOptionsMode.ALLOWALL`. `include(filename)`.

- [ ] **Step 1: Tulis `src/Setup.js`** — header kolom persis spec; kolom Tanggal/Jam Mulai/Jam Selesai di-set format `@` (plain text); SuperAdmin awal NIP+password default yang dicetak ke log (bukan hardcode di kode produksi—log sekali saat setup).
- [ ] **Step 2: Tulis `src/Code.js`** — `doGet` + `include`. Routing pakai key `?page=` sesuai spec §Frontend.
- [ ] **Step 3: Verifikasi tidak merusak test** — `npm test` tetap hijau (file ini tidak punya unit test; murni GAS API).
- [ ] **Step 4: Commit** — `git commit -m "feat: add Setup (sheets/folders/props) and Code routing"`

---

## Task 4: `PegawaiService.js`

**Files:**
- Create: `sirajin-baru/src/PegawaiService.js`
- Reference: `src/PegawaiService.js` project lama

**Interfaces:**
- Consumes: `requireAdmin_`, `getSheet` (Task 2).
- Produces: `listPegawai(token)` → `{success, data:[{id,nip,namaLengkap,jabatan,unitKerja,status}]}`; `savePegawai(token, data)` — tambah (id kosong) atau edit (id ada), tolak NIP duplikat; `setPegawaiStatus(token, id, status)` — set `Aktif`/`Nonaktif`. Semua wajib admin.

- [ ] **Step 1: Implementasi ketiga fungsi** — validasi: semua field wajib; NIP dibersihkan spasi; NIP duplikat ditolak dengan pesan jelas.
- [ ] **Step 2: Verifikasi** — `npm test` tetap hijau.
- [ ] **Step 3: Commit** — `git commit -m "feat: add PegawaiService CRUD"`

---

## Task 5: `AdminService.js`

**Files:**
- Create: `sirajin-baru/src/AdminService.js`
- Reference: `src/AdminService.js` project lama

**Interfaces:**
- Consumes: `requireAdmin_`, `hashPassword`, `getSheet` (Task 2).
- Produces: `listAdmin(token)` → `{success, data:[{id,nip,nama,level,status}]}` (password TIDAK ikut dikirim); `saveAdmin(token, data)` — tambah/edit, password di-hash, saat edit password kosong = pertahankan lama; `setAdminStatus(token, id, status)`. **Semua wajib level `SuperAdmin`** — Admin biasa ditolak.

- [ ] **Step 1: Implementasi** — guard SuperAdmin di ketiga fungsi; tolak menonaktifkan akun diri sendiri.
- [ ] **Step 2: Verifikasi** — `npm test` hijau.
- [ ] **Step 3: Commit** — `git commit -m "feat: add AdminService (SuperAdmin-only CRUD)"`

---

## Task 6: `PdfGenerator.js`

**Files:**
- Create: `sirajin-baru/src/PdfGenerator.js`
- Reference: `src/PdfGenerator.js` project lama

**Interfaces:**
- Consumes: `formatDuration` (Task 1).
- Produces: `formatTanggalIndonesia(iso)` → `"22 Agustus 2026"`; `insertImageAtPlaceholder(body, placeholder, blob)`; `generateLaporanPdf(pegawai, laporan)` → URL PDF. Alur: copy Google Docs template (`TEMPLATE_DOC_ID`) ke folder PDF → `replaceText` untuk `{{NAMA}} {{NIP}} {{JABATAN}} {{UNIT_KERJA}} {{TANGGAL}} {{JAM_MULAI}} {{JAM_SELESAI}} {{DURASI}} {{NAMA_AKTIVITAS}} {{URAIAN}}` → sisip foto di `{{FOTO_1}}`/`{{FOTO_2}}` → `saveAndClose` → export `application/pdf` → simpan sebagai `<NIP>_<tanggal>_<jamMulai>.pdf` → buang salinan Docs sementara.

- [ ] **Step 1: Implementasi** — lempar error jelas kalau `TEMPLATE_DOC_ID` belum diset. Placeholder foto yang blob-nya null → paragraf dikosongkan (bukan error).
- [ ] **Step 2: Verifikasi** — `npm test` hijau.
- [ ] **Step 3: Commit** — `git commit -m "feat: add PdfGenerator (Docs template to PDF)"`

---

## Task 7: `AktivitasService.js`

**Files:**
- Create: `sirajin-baru/src/AktivitasService.js`
- Reference: `src/AktivitasService.js` project lama

**Interfaces:**
- Consumes: `validateToken` (Task 2), `isValidTimeRange`/`calculateDurationMinutes` (Task 1), `generateLaporanPdf` (Task 6).
- Produces: helper `sebagaiTeks_(v)`, `formatWaktu_(v)`, `rowToLaporan_(row)`, `saveFotoKeDrive_`, `getOrCreateFolder_`, `extractDriveFileId_`, `getBlobsFromDriveUrls_`, `regenerateDanSimpanPdf_`. Fungsi client: `listAktivitasByDate(token, tanggal)`, `getAktivitasById(token, id)`, `saveAktivitas(token, data)` → `{success, idLaporan, linkPdf}`, `finalizeAktivitas(token, id)`, `deleteAktivitas(token, id)`.

**Aturan wajib (spec §Alur Pegawai):** jam selesai > jam mulai; uraian ≥1 poin; foto wajib 1–2 saat buat baru, boleh kosong saat edit (pertahankan lama), maks 2; simpan baru → status `Draft`; edit tidak mengubah status; finalisasi → regenerate PDF lalu status `Final` + isi Waktu Finalisasi; hapus hanya Draft; semua operasi cek kepemilikan NIP.

- [ ] **Step 1: Implementasi helper** — `sebagaiTeks_` (prefix `'`), `formatWaktu_` (Date → ISO string), `rowToLaporan_` (uraian `split('\n')`, foto `split('|')`).
- [ ] **Step 2: Implementasi foto ke Drive** — folder per NIP per tanggal; base64 → blob JPEG.
- [ ] **Step 3: Implementasi 5 fungsi client** sesuai aturan di atas.
- [ ] **Step 4: Verifikasi** — `npm test` hijau.
- [ ] **Step 5: Commit** — `git commit -m "feat: add AktivitasService (draft/final + PDF regen)"`

---

## Task 8: `DashboardService.js` + test rekap (TDD)

**Files:**
- Create: `sirajin-baru/src/DashboardService.js`, `sirajin-baru/tests/dashboard.test.js`
- Reference: `src/DashboardService.js` project lama

**Interfaces:**
- Consumes: `requireAdmin_` (Task 2).
- Produces: `getDashboardSummary(token, tanggal)` → `{success, data:{tanggal, totalPegawaiAktif, sudahLapor, belumLapor:[{nip,nama}], rekapJam:[{nip,nama,totalMenit}]}}`; `listLaporanArsip(token, filter)` → laporan Final untuk arsip admin; pure helper `getMingguKerja_(tanggalAcuan)` → array 5 tanggal ISO Senin–Jumat, `hitungRekapMingguan_(aktivitasRows, pegawaiAktif, tanggalAcuan)` → `[{nip,nama,hariLapor,totalHari:5,totalMenit,lengkap}]`; `getRekapMingguan(token, tanggalAcuan)`. Dua pure helper diekspor untuk Jest.

**Definisi:** "minggu berjalan" = Senin–Jumat minggu kalender yang memuat `tanggalAcuan` (hari Minggu mundur ke Senin minggu yang baru lewat). "Hari Lapor" = jumlah hari (dari 5) yang punya ≥1 Aktivitas berstatus `Final`. "Lengkap" = hariLapor === 5.

- [ ] **Step 1: Tulis test (RED)** — `tests/dashboard.test.js` ≥9 test: `getMingguKerja_` (Sabtu, Rabu, Minggu); `hitungRekapMingguan_` (5 hari penuh = Lengkap; <5 = Kurang; tanpa laporan = 0; Draft tidak dihitung; Final di luar minggu tidak dihitung; 2 laporan sehari = 1 hari tapi menit diakumulasi).
- [ ] **Step 2: Verifikasi GAGAL** — `npx jest tests/dashboard.test.js`.
- [ ] **Step 3: Implementasi** — pure helper dulu, lalu wrapper ber-GAS-API, lalu `module.exports` bridge.
- [ ] **Step 4: Verifikasi LULUS** — `npm test` semua suite hijau; catat jumlah total test sebagai baseline baru.
- [ ] **Step 5: Commit** — `git commit -m "feat: add DashboardService with weekly rekap (TDD)"`

---

## Task 9: `Shared.html` — tokens, base CSS, client helper, crest

**Files:**
- Create: `sirajin-baru/src/Shared.html`
- Reference: `src/Shared.html` project lama (untuk blok `<script>` helper + base64 crest), `template-baru/bundle-extracted/design-reference/DESIGN_SYSTEM.md` + file bundle manapun (untuk CSS)

**Interfaces:**
- Produces (dipakai SEMUA halaman): `<link>` Google Fonts (Source Serif 4 400–700 + Inter 400–800); CSS custom properties dari spec §Palette (termasuk fix `--ink-faint:#6B6558`, `--gold-text:#6B4E1E`); spacing `--space-1..10`, radius, shadow; base class `.btn`(+`-primary/-secondary/-ghost/-danger-ghost/-block/-lg/-sm`), `.card`, `.badge`(+`-draft/-tersimpan/-final/-belum/-aktif/-nonaktif`), `.field`, `.input`/`.select`/`.textarea`, `.input-nip`, `.eyebrow`, `.tabular`, `.font-display`, `.lambang-logo`, `.error-message`, `.loading`, `#sirajinToast`. JS helper: `SIRAJIN_LOGO_SRC` (base64 crest), `getToken()`/`setToken()`/`clearToken()`, `redirectTop(url, label)`, `showToast(msg, isError)`, `handleSessionExpiry(msg, loginUrl)`, listener delegasi klik `a[href^="?"]` (navigasi di dalam sandbox GAS).

- [ ] **Step 1: Tulis blok `<style>`** — token + base class persis spec §Palette. NOL token navy.
- [ ] **Step 2: Tulis blok `<script>`** — helper di atas; `SIRAJIN_LOGO_SRC` disalin dari `src/Shared.html` lama (base64 crest asli).
- [ ] **Step 3: Verifikasi tidak ada navy** — `grep -c "navy\|#1B3A6B\|split-shell" sirajin-baru/src/Shared.html` → `0`.
- [ ] **Step 4: Commit** — `git commit -m "feat: add Shared.html design tokens + client helpers"`

---

## Task 10: `AdminShared.html` — chrome admin

**Files:**
- Create: `sirajin-baru/src/AdminShared.html`
- Reference: bundle `06-dashboard-kepatuhan.html` (CSS topbar/tabel/modal), `src/AdminShared.html` lama (pola `renderAdminNav`)

**Interfaces:**
- Consumes: token Task 9.
- Produces (dipakai Task 16-19): `include('Shared')`; CSS `.admin-topbar`, `.admin-brand`, `.admin-nav`, `.admin-user`, `.admin-avatar`, `.admin-shell`, `.admin-page-head`, `.stat-grid`/`.stat-card`(+accent), `.panel`/`.panel-head`/`.panel-body`, `.table-wrap`, `.data-table`(+`.cell-name`/`.cell-avatar`/`.row-actions`/`.icon-action`), `.filter-bar`/`.filter-field`, `.alert-list`/`.alert-row`, `.modal-overlay`/`.modal-box`/`.modal-head`/`.modal-body`/`.modal-foot`; JS `escapeHtml(s)`, `initials(nama)`, `openModal(id)`, `closeModal(id)`, `toggleAdminNav()`, `adminLogout()`, `renderAdminNav(halamanAktif)` (render topbar + nav, ambil sesi via `getMySession(getToken())`, isi nama/level/avatar, highlight menu aktif, sembunyikan menu "Kelola Akun" kalau level bukan SuperAdmin).

- [ ] **Step 1: Tulis CSS chrome** dari bundle admin.
- [ ] **Step 2: Tulis JS** termasuk `renderAdminNav` + crest di `.mark` via `SIRAJIN_LOGO_SRC`.
- [ ] **Step 3: Verifikasi** — grep navy → 0; `.icon-btn` yang dipakai harus punya rule CSS (jangan class mati).
- [ ] **Step 4: Commit** — `git commit -m "feat: add AdminShared.html admin chrome + renderAdminNav"`

---

## Aturan umum semua task halaman (Task 11-19)

Berlaku untuk setiap halaman; jangan diulang per task tapi WAJIB dipatuhi:

1. Struktur file: `<!DOCTYPE html><html><head><base target="_top"><?!= include('Shared'); ?>` (atau `include('AdminShared')` untuk halaman admin) + `<style>` khusus halaman + `</head><body>` markup + `<script>` logic `</body></html>`.
2. Markup & CSS diadaptasi dari file bundle yang ditunjuk. **JS bawaan bundle dibuang** (inert/mock) — diganti pemanggilan `google.script.run` nyata.
3. Semua `<button type="submit">` → `type="button"` + `addEventListener('click', ...)`. Tag `<form>` dibuang.
4. Semua link navigasi → `?page=...` (bukan `./NN-xx.html`).
5. Placeholder logo di bundle diisi crest asli: `<img class="lambang-logo">` + `<script>document.currentScript.previousElementSibling.src = SIRAJIN_LOGO_SRC;</script>`.
6. Setiap panggilan server pakai `withSuccessHandler` + `withFailureHandler`; hasil `{success:false}` dicek `handleSessionExpiry()` dulu sebelum menampilkan error.
7. Semua teks pegawai/admin yang masuk `innerHTML` di-escape dengan `escapeHtml()`.
8. Jangan mendefinisikan ulang `:root` token — konsumsi dari `Shared.html`.
9. Setiap task halaman diakhiri: verifikasi grep id yang dipakai script, `npm test` tetap hijau, commit.

---

## Task 11: `Home.html` (landing)

**Files:** Create `sirajin-baru/src/Home.html` — sumber bundle `01-landing.html`.
**Interfaces:** Consumes token Task 9. Leaf.

- [ ] **Step 1:** Adaptasi markup landing: kop instansi + crest, judul "SiRajin Morowali", tagline, tombol `?page=login` (Login Pegawai) + link `?page=admin-login`, visual seal-ring + logo-plate (crest kedua), strip statistik statis.
- [ ] **Step 2:** Verifikasi — grep `split-shell|navy` → 0; ada 2 injeksi `SIRAJIN_LOGO_SRC`.
- [ ] **Step 3:** `npm test` hijau → Commit `git commit -m "feat: add Home.html landing"`

---

## Task 12: `Login.html` (login pegawai)

**Files:** Create `sirajin-baru/src/Login.html` — sumber bundle `02-login-pegawai.html`.
**Interfaces:** Consumes Task 9; memanggil `loginPegawai(nip)` (Task 2). Leaf.

- [ ] **Step 1:** Markup: kartu auth di ground `--primary-dark`, crest, eyebrow "Login Pegawai", input `id="nip"` (class `input input-nip tabular`), catatan info NIP, tombol `id="btnLogin"`, `<p class="error-message" id="errorMsg">`, footer link `?page=admin-login`.
- [ ] **Step 2:** Script: klik → validasi NIP tidak kosong → `google.script.run...loginPegawai(nip)` → sukses: `setToken(result.token)` + `redirectTop('?page=aktivitas', ...)`; gagal: tampilkan `result.message`; tombol disable + teks "Memproses..." selama request.
- [ ] **Step 3:** Verifikasi — `grep -c 'id="nip"\|id="btnLogin"\|id="errorMsg"'` → 3.
- [ ] **Step 4:** `npm test` hijau → Commit `git commit -m "feat: add Login.html (NIP login)"`

---

## Task 13: `AdminLogin.html`

**Files:** Create `sirajin-baru/src/AdminLogin.html` — sumber bundle `03-login-admin.html`.
**Interfaces:** Consumes Task 9; memanggil `loginAdmin(nip, password)` (Task 2). Leaf.

- [ ] **Step 1:** Markup sama pola Task 12 + field password `id="password"`; eyebrow "Panel Admin"; footer teks polos "Lupa kata sandi? Hubungi SuperAdmin." (bukan link mati). Toggle show/hide password bundle DIBUANG.
- [ ] **Step 2:** Script: validasi NIP+password terisi → `loginAdmin` → sukses `redirectTop('?page=admin', ...)`.
- [ ] **Step 3:** Verifikasi — grep 4 id (`nip`,`password`,`btnLogin`,`errorMsg`).
- [ ] **Step 4:** `npm test` hijau → Commit `git commit -m "feat: add AdminLogin.html"`

---

## Task 14: `Aktivitas.html` (daftar aktivitas pegawai)

**Files:** Create `sirajin-baru/src/Aktivitas.html` — sumber bundle `04-aktivitas-saya.html`.
**Interfaces:** Consumes Task 9; memanggil `getMySession`, `listAktivitasByDate(token, tanggal)`, `finalizeAktivitas(token, id)`, `deleteAktivitas(token, id)`. Leaf.

- [ ] **Step 1: Guard sesi** — di awal script: kalau `getToken()` kosong → `redirectTop('?page=login')`. Ambil sesi, tampilkan nama/jabatan di header.
- [ ] **Step 2: Date-scroller** — deret tanggal (7 hari terakhir s.d hari ini), default hari ini, klik ganti tanggal → muat ulang daftar. Tanggal aktif ditandai.
- [ ] **Step 3: Render daftar** — `renderLaporan()`: tiap item tampil nama aktivitas, jam mulai–selesai, durasi (`formatDuration` versi client), badge status (`Final` → label "Tersimpan" class `badge-final`; `Draft` → "Draft" class `badge-draft`), uraian (poin), thumbnail foto, tombol: Lihat PDF (buka `linkPdf`), Edit + Hapus (khusus Draft, Edit → `?page=aktivitas-tambah&id=<id>`), Finalisasi (khusus Draft, konfirmasi dulu). Kosong → pesan ramah + tombol tambah.
- [ ] **Step 4: Tombol Tambah Aktivitas** → `?page=aktivitas-tambah`. Tombol Keluar → `clearToken()` + `redirectTop('?page=login')`.
- [ ] **Step 5:** Verifikasi id yang dipakai script ada di markup; `npm test` hijau → Commit `git commit -m "feat: add Aktivitas.html (daftar + finalisasi)"`

---

## Task 15: `TambahAktivitas.html` (form tambah/edit)

**Files:** Create `sirajin-baru/src/TambahAktivitas.html` — sumber bundle `05-tambah-edit-aktivitas.html`.
**Interfaces:** Consumes Task 9; memanggil `getAktivitasById(token, id)` (mode edit), `saveAktivitas(token, data)`. Leaf. **Task paling kompleks — kerjakan terakhir di antara halaman pegawai.**

- [ ] **Step 1: Guard sesi + mode** — baca `id` dari query (`google.script.url.getLocation()`); ada id = mode edit (muat data, isi form, judul "Edit Aktivitas"), tanpa id = mode tambah.
- [ ] **Step 2: Field dasar** — tanggal (default hari ini), nama aktivitas, jam mulai, jam selesai; durasi dihitung otomatis & ditampilkan saat jam berubah.
- [ ] **Step 3: Uraian dinamis** — `tambahPoinUraian()` / hapus poin; minimal 1 poin tersisa; poin dinomori ulang otomatis.
- [ ] **Step 4: Foto** — input kamera/file (maks 2), kompres client-side (`kompresGambar()`: canvas, maks sisi ~1280px, JPEG quality ~0.7) → base64; preview thumbnail + tombol hapus foto; mode edit: kosong = pertahankan foto lama (tampilkan foto existing).
- [ ] **Step 5: Simpan** — validasi client (jam selesai > mulai, uraian ≥1, foto 1–2 saat tambah) → `saveAktivitas` → sukses: toast + `redirectTop('?page=aktivitas')`; tombol disable saat proses (upload bisa lama).
- [ ] **Step 6:** Verifikasi id; `npm test` hijau → Commit `git commit -m "feat: add TambahAktivitas.html (form + foto + uraian)"`

---

## Task 16: `AdminDashboard.html`

**Files:** Create `sirajin-baru/src/AdminDashboard.html` — sumber bundle `06-dashboard-kepatuhan.html`.
**Interfaces:** Consumes Task 10; memanggil `getDashboardSummary(token, tanggal)` + `getRekapMingguan(token, tanggal)` (Task 8). Leaf.

- [ ] **Step 1:** `renderAdminNav('admin')`; input tanggal (default hari ini) yang memuat ulang saat berubah.
- [ ] **Step 2: Stat cards** — Pegawai Aktif, Sudah Lapor (+% ), Belum Lapor, Rata-rata Jam.
- [ ] **Step 3: Panel "Belum Lapor Hari Ini"** — progress bar % kepatuhan + daftar nama (avatar inisial + NIP). Kosong → "Semua pegawai aktif sudah lapor."
- [ ] **Step 4: Panel rekap mingguan** — tabel: Pegawai, Hari Lapor (`x/5 hari`), Total Jam, badge Lengkap/Kurang.
- [ ] **Step 5:** Verifikasi id; `npm test` hijau → Commit `git commit -m "feat: add AdminDashboard.html"`

---

## Task 17: `AdminPegawai.html`

**Files:** Create `sirajin-baru/src/AdminPegawai.html` — sumber bundle `07-kelola-pegawai.html`.
**Interfaces:** Consumes Task 10; memanggil `listPegawai`, `savePegawai`, `setPegawaiStatus` (Task 4). Modal id `modalPegawai` (namespaced).

- [ ] **Step 1:** `renderAdminNav('admin/pegawai')`; tabel: Nama(+avatar inisial), NIP, Jabatan, Unit Kerja, badge status, aksi (edit/toggle status).
- [ ] **Step 2:** Modal tambah/edit — field `pNip`/`pNama`/`pJabatan`/`pUnit` (Unit Kerja tetap free-text, BUKAN dropdown "Bidang" bundle); `openModal('modalPegawai')`/`closeModal(...)`.
- [ ] **Step 3:** Toggle status pakai `confirm()` sebelum kirim.
- [ ] **Step 4:** Verifikasi — `grep -c 'id="modalPegawai"'` → 1; id field ada; `npm test` hijau → Commit `git commit -m "feat: add AdminPegawai.html (CRUD pegawai)"`

---

## Task 18: `AdminLaporan.html`

**Files:** Create `sirajin-baru/src/AdminLaporan.html` — sumber bundle `08-kelola-laporan.html`.
**Interfaces:** Consumes Task 10; memanggil `listLaporanArsip(token, filter)` (Task 8). Leaf, read-only.

- [ ] **Step 1:** `renderAdminNav('admin/laporan')`; filter tanggal + pegawai (sesuai yang benar-benar didukung `listLaporanArsip` — JANGAN tampilkan filter status/ekspor CSV yang tidak ada backend-nya).
- [ ] **Step 2:** Tabel arsip: Nama, Tanggal, Jam, Durasi, tombol lihat/download PDF. Hanya laporan `Final` yang tampil.
- [ ] **Step 3:** Verifikasi id; `npm test` hijau → Commit `git commit -m "feat: add AdminLaporan.html (arsip read-only)"`

---

## Task 19: `AdminAkun.html`

**Files:** Create `sirajin-baru/src/AdminAkun.html` — sumber bundle `09-kelola-akun.html`.
**Interfaces:** Consumes Task 10; memanggil `listAdmin`, `saveAdmin`, `setAdminStatus` (Task 5). Modal id `modalAkun`. **Halaman ini hanya berguna untuk SuperAdmin** — `renderAdminNav` menyembunyikan menu ini untuk Admin biasa (Task 10), tapi halaman ini sendiri juga harus menolak render isi kalau sesi bukan SuperAdmin (tampilkan pesan "Halaman khusus SuperAdmin" + redirect).

- [ ] **Step 1:** Guard level di awal script: `getMySession` → kalau `level !== 'SuperAdmin'` → tampilkan pesan + `redirectTop('?page=admin')`.
- [ ] **Step 2:** `renderAdminNav('admin/akun')`; tabel: Nama, NIP, Level, status, aksi.
- [ ] **Step 3:** Modal tambah/edit — field `aNip`/`aNama`/`aLevel` (select Admin/SuperAdmin)/`aPassword` (edit: kosong = pertahankan lama); `openModal('modalAkun')`/`closeModal(...)`.
- [ ] **Step 4:** Verifikasi — `grep -c 'id="modalAkun"'` → 1; `npm test` hijau → Commit `git commit -m "feat: add AdminAkun.html (SuperAdmin CRUD)"`

---

## Task 20: Verifikasi end-to-end + finalisasi

**Files:** tidak ada file baru — verifikasi + README update.

**Interfaces:** Consumes semua task 0-19.

- [ ] **Step 1: Test penuh** — `cd sirajin-baru && npm test` → semua suite hijau, catat jumlah total.
- [ ] **Step 2: Audit navy** — `grep -rn "navy\|split-shell\|split-brand" sirajin-baru/src/` → harus 0 hasil di semua file.
- [ ] **Step 3: Audit token** — setiap file halaman: `grep -c ":root" sirajin-baru/src/*.html` → hanya `Shared.html` yang boleh >0.
- [ ] **Step 4: Audit navigasi** — `grep -rn "\.html\"" sirajin-baru/src/*.html | grep -v "Shared\|AdminShared"` → pastikan tak ada sisa link relatif `./NN-xx.html` dari bundle yang lupa diganti `?page=`.
- [ ] **Step 5: WCAG spot-check** — hitung rasio kontras `--ink-faint` dan `--gold-text` pada `--bg`/`--surface` (harus ≥4.5:1); catat hasilnya di README.
- [ ] **Step 6: Update README.md** — isi langkah deploy final (spec §Deploy) + ringkasan struktur.
- [ ] **Step 7: Commit final** — `git add -A && git commit -m "chore: finalize sirajin-baru — full pegawai+admin flow, cream/hijau design"`
