# SiRajin Morowali — Rewrite Bersih (GAS) — Design Spec

**Tanggal:** 2026-08-22
**Status:** Draft, menunggu review product owner

## Tujuan

Aplikasi Google Apps Script (HtmlService) baru, ditulis ulang **bersih dari nol**, untuk mencatat aktivitas harian pegawai DPMPTSP Kabupaten Morowali sampai jadi laporan PDF, plus panel admin. Frontend memakai desain **cream/hijau/terracotta** dari `sirajin-morowali-design-bundle` (`template-baru/bundle-extracted/design-reference/01-09.html`) — **tidak ada** warna navy sama sekali. Dibuat di **folder lokal baru**; product owner yang `clasp create` + `clasp push` sendiri.

## Kenapa rewrite (bukan lanjut project lama)

Project `sirajin-morowali` saat ini bercampur: sebagian halaman sudah cream, sebagian masih navy lama (halaman yang belum digarap), sehingga live selalu tampak "balik ke navy" dan membingungkan. Project baru bersih menghilangkan semua warisan navy secara permanen.

## Tech Stack

- Google Apps Script `HtmlService` (template `include()` pattern)
- Google Sheets sebagai database (sheet: `Pegawai`, `Admin`, `Aktivitas`)
- Google Drive: folder foto bukti + folder PDF hasil
- Google Docs sebagai template laporan (placeholder `{{...}}`)
- Google Fonts: Source Serif 4 (judul) + Inter (body)
- `clasp` CLI untuk push; Jest untuk unit test logika murni
- Crest Kabupaten Morowali di-embed sebagai base64 data URI

## Peran & Autentikasi

**Pegawai** — login dengan **NIP saja** (tanpa password). Validasi: NIP terdaftar di sheet Pegawai + status `Aktif`. Kalau nonaktif → ditolak.

**Admin** — login **NIP + password** (hash SHA-256). Ada 2 level: `Admin` dan `SuperAdmin`. SuperAdmin bisa kelola akun admin; Admin biasa tidak.

**Session**: token UUID disimpan di `CacheService` (TTL 6 jam, sliding refresh tiap validasi). Semua fungsi server yang butuh auth memvalidasi token dulu.

## Data Model (Google Sheets)

**Sheet `Pegawai`** (6 kolom, 0-indexed):
| idx | kolom | contoh |
|---|---|---|
| 0 | ID | uuid |
| 1 | NIP | 19850312200901003 |
| 2 | Nama | Rahmawati S. |
| 3 | Jabatan | Analis |
| 4 | Unit Kerja | Bidang Perizinan |
| 5 | Status | Aktif / Nonaktif |

**Sheet `Admin`** (6 kolom):
| idx | kolom |
|---|---|
| 0 | ID |
| 1 | NIP |
| 2 | Nama |
| 3 | Password (SHA-256 hex) |
| 4 | Level (Admin / SuperAdmin) |
| 5 | Status (Aktif / Nonaktif) |

**Sheet `Aktivitas`** (14 kolom):
| idx | kolom | catatan |
|---|---|---|
| 0 | ID Laporan | uuid |
| 1 | NIP | pemilik |
| 2 | Tanggal | YYYY-MM-DD (disimpan sebagai teks, prefix `'`) |
| 3 | Jam Mulai | HH:MM (teks) |
| 4 | Jam Selesai | HH:MM (teks) |
| 5 | Durasi Menit | angka, auto-hitung |
| 6 | Nama Aktivitas | teks |
| 7 | Uraian | poin dipisah `\n` |
| 8 | Link Foto | URL dipisah `\|` |
| 9 | Link PDF | URL |
| 10 | Status | Draft / Final |
| 11 | Waktu Dibuat | Date |
| 12 | Waktu Diubah | Date |
| 13 | Waktu Finalisasi | Date / kosong |

**Catatan teknis penting (dari pengalaman project lama, wajib diterapkan):**
1. Tanggal/Jam disimpan sebagai **teks literal** (prefix tanda kutip satu `'`), karena Sheets otomatis mengonversi string berbentuk tanggal jadi objek Date saat `appendRow`/`setValues`, yang merusak perbandingan `===` dan `.split()`.
2. Field Date (Waktu Dibuat/dll) **tidak boleh** dikirim mentah lewat `google.script.run` — serialisasi ke client gagal total (seluruh `result` jadi null). Konversi ke ISO string dulu sebelum keluar fungsi.

## Alur PEGAWAI (end-to-end)

1. **Login** — halaman NIP (`02-login-pegawai.html`). Input NIP → `loginPegawai(nip)` → kalau valid & Aktif, dapat token + session, redirect ke Aktivitas Saya.
2. **Aktivitas Saya** (`04-aktivitas-saya.html`) — daftar aktivitas per tanggal (default hari ini, ada date-scroller). Tiap item tampil: nama, jam, durasi, badge status (Draft/Final), tombol edit/hapus (khusus Draft), tombol lihat PDF.
3. **Tambah Aktivitas** (`05-tambah-edit-aktivitas.html`) — form: nama aktivitas, jam mulai, jam selesai (durasi auto-hitung), uraian (≥1 poin, bisa tambah/hapus poin), foto bukti (1–2, dari kamera/upload, dikompres client-side). `saveAktivitas(token, data)` → simpan status **Draft** → PDF auto-generate → simpan link.
4. **Edit** aktivitas Draft — sama seperti tambah, tapi foto boleh dikosongkan (pertahankan foto lama). Status tetap Draft.
5. **Finalisasi** — `finalizeAktivitas(token, id)` → PDF regenerate → status jadi **Final** → Waktu Finalisasi diisi. Setelah Final: tak bisa edit/hapus.
6. **Hapus** — hanya Draft (`deleteAktivitas`). Final ditolak.
7. **Download PDF** — buka Link PDF dari Drive.

**Aturan validasi aktivitas:**
- Jam selesai harus > jam mulai.
- Uraian minimal 1 poin.
- Foto: wajib 1–2 saat buat baru; saat edit boleh kosong (pertahankan lama); maksimal 2.

## Alur ADMIN (end-to-end)

1. **Login admin** (`03-login-admin.html`) — NIP + password → `loginAdmin(nip, password)` → token + session (level).
2. **Dashboard Kepatuhan** (`06-dashboard-kepatuhan.html`) — pilih tanggal; tampil: total pegawai aktif, sudah lapor, belum lapor (daftar nama), rata-rata jam. Plus rekap mingguan (Senin–Jumat): per pegawai hari lapor & total jam, badge Lengkap/Kurang.
3. **Kelola Pegawai** (`07-kelola-pegawai.html`) — tabel pegawai; tambah/edit lewat modal (NIP, Nama, Jabatan, Unit Kerja); toggle Aktif/Nonaktif.
4. **Kelola Laporan** (`08-kelola-laporan.html`) — arsip laporan Final (read-only): filter tanggal/pegawai, lihat/download PDF.
5. **Kelola Akun** (`09-kelola-akun.html`) — **SuperAdmin only**: CRUD admin (NIP, Nama, Level, Password), toggle status.

## Fungsi Server (kontrak)

**Auth.js**: `loginPegawai(nip)`, `loginAdmin(nip, password)`, `validateToken(token)`, `getMySession(token)`, `hashPassword(password)`.
**AktivitasService.js**: `listAktivitasByDate(token, tanggal)`, `getAktivitasById(token, id)`, `saveAktivitas(token, data)`, `finalizeAktivitas(token, id)`, `deleteAktivitas(token, id)`.
**PegawaiService.js**: `listPegawai(token)`, `savePegawai(token, data)`, `setPegawaiStatus(token, id, status)`.
**AdminService.js**: `listAdmin(token)`, `saveAdmin(token, data)`, `setAdminStatus(token, id, status)` — semua SuperAdmin only.
**DashboardService.js**: `getDashboardSummary(token, tanggal)`, `getRekapMingguan(token, tanggalAcuan)`.
**PdfGenerator.js**: `generateLaporanPdf(pegawai, laporan)` — copy Google Docs template, replace placeholder, sisip foto, export PDF ke Drive.
**Utils.js**: `isValidNIP`, `isValidTimeRange`, `calculateDurationMinutes`, `formatDuration`.
**Setup.js**: buat sheet + folder + set Script Properties (`SPREADSHEET_ID`, `FOLDER_FOTO_ID`, `FOLDER_PDF_ID`, `TEMPLATE_DOC_ID`), fungsi `setTemplateDocId(id)`.
**Code.js**: `doGet(e)` routing `?page=` → nama file HTML; `include(filename)`.

## Frontend (9 halaman, dari bundle)

Sumber: `template-baru/bundle-extracted/design-reference/` (cream/hijau, ada DESIGN_SYSTEM.md resmi). Tiap file bundle jadi satu file HTML GAS:

| page= | file GAS | asal bundle | peran |
|---|---|---|---|
| home | Home.html | 01-landing.html | landing |
| login | Login.html | 02-login-pegawai.html | login pegawai (NIP) |
| admin-login | AdminLogin.html | 03-login-admin.html | login admin |
| aktivitas | Aktivitas.html | 04-aktivitas-saya.html | daftar aktivitas |
| aktivitas/tambah | TambahAktivitas.html | 05-tambah-edit-aktivitas.html | form aktivitas |
| admin | AdminDashboard.html | 06-dashboard-kepatuhan.html | dashboard |
| admin/pegawai | AdminPegawai.html | 07-kelola-pegawai.html | CRUD pegawai |
| admin/laporan | AdminLaporan.html | 08-kelola-laporan.html | arsip laporan |
| admin/akun | AdminAkun.html | 09-kelola-akun.html | CRUD admin |

Plus 2 file shared: `Shared.html` (design tokens + Google Fonts + base component CSS + crest base64 + client helper: token get/set, redirect, toast, session-expiry) dan `AdminShared.html` (chrome admin: topbar/nav/tabel/modal + `renderAdminNav()`).

## Palette (dari DESIGN_SYSTEM.md bundle, + 2 fix WCAG)

```css
--bg:#F5F1E5; --surface:#FFFFFF; --surface-alt:#EFEADB;
--ink:#211F19; --ink-soft:#5B5648;
--ink-faint:#6B6558;      /* FIX: bundle #8A8471 = 3.74:1 (gagal AA); digelapkan → 5.79:1 */
--primary:#1F4A3D; --primary-dark:#143128; --primary-soft:#E2EAE4;
--accent:#B75A2E; --accent-dark:#93441F;  /* tombol utama (CTA) */
--gold:#B4863C; --gold-text:#6B4E1E;      /* FIX: gold sbagai teks badge = 2.64:1 (gagal); pakai --gold-text 6.20:1 */
--danger:#A23B33; --success:#2F6B52; --warning:#B4863C;
--border:#DED6C0; --border-soft:#E9E3D2;
```

Font: Source Serif 4 (judul/angka) + Inter (body). Radius sm/md/lg/pill = 8/12/18/999px. Shadow sm/md/lg per DESIGN_SYSTEM.md.

**Wajib**: setiap kali menyentuh warna, hitung rasio kontras (jangan eyeball) — palette ini berkali-kali tampak baik tapi gagal AA.

## Struktur folder project baru

```
sirajin-baru/
  .clasp.json          (dibuat oleh clasp create — PO yang jalankan)
  appsscript.json
  package.json         (Jest)
  src/
    Code.js  Setup.js  Utils.js
    Auth.js  PegawaiService.js  AdminService.js
    AktivitasService.js  DashboardService.js  PdfGenerator.js
    Shared.html  AdminShared.html
    Home.html  Login.html  AdminLogin.html
    Aktivitas.html  TambahAktivitas.html
    AdminDashboard.html  AdminPegawai.html  AdminLaporan.html  AdminAkun.html
  tests/
    auth.test.js  utils.test.js  dashboard.test.js
```

## Testing

Jest untuk logika murni (di-bridge lewat `module.exports` seperti project lama): `hashPassword`, `isValidNIP`, `isValidTimeRange`, `calculateDurationMinutes`, `formatDuration`, `hitungRekapMingguan_`, `getMingguKerja_`. Target: semua hijau sebelum push.

## Deploy (dilakukan product owner)

1. `cd sirajin-baru && clasp login` (kalau belum)
2. `clasp create --type webapp --title "SiRajin Morowali"` → buat GAS project baru
3. `clasp push`
4. Buka editor, jalankan `Setup.setupAwal()` → buat sheet/folder + isi Script Properties
5. Buat Google Docs template laporan, jalankan `setTemplateDocId('<id>')`
6. `clasp deploy` → dapat URL `/exec` untuk presentasi

## Verifikasi visual (penting)

Untuk cek render live GAS, pakai **Playwright screenshot** (bukan Chrome-DevTools MCP — tidak bisa tembus sandbox nested-iframe GAS). URL tanpa `?page=` default ke `home`.

## Di luar cakupan (YAGNI)

- Tidak ada notifikasi/pengingat otomatis.
- Tidak ada ekspor CSV.
- Dashboard tetap per-hari + rekap mingguan; tidak ada grafik/chart.
- Tidak memindahkan/mengubah project lama `sirajin-morowali` — biarkan apa adanya.
