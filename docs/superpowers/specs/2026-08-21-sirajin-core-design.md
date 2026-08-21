# Design Spec — SiRajin Morowali (Core)

> **Status:** Draft untuk direview pemilik produk · **Tanggal:** 21 Agustus 2026

## 1. Ringkasan Eksekutif

**SiRajin** (*Sistem Rekap Aktivitas Jurnal Instansi*) adalah alat bantu bagi ±70 ASN DPMPTSP Kabupaten Morowali untuk menyusun **Laporan Bukti Dukung Kinerja Harian** — dokumen PDF resmi (uraian aktivitas + 1-3 foto kegiatan per blok waktu) yang diunggah manual ke portal e-Kinerja BKN. Sistem menggantikan proses manual (ketik ulang template Word, tempel foto satu-satu) dengan form web sederhana yang menghasilkan PDF identik dengan template resmi kantor secara otomatis.

Dibangun di atas **Google Apps Script** (backend + hosting Web App), **Google Sheets** (database), dan **Google Drive** (penyimpanan foto & PDF) — tanpa biaya hosting, memakai infrastruktur Google yang sudah tersedia di institusi.

## 2. Latar Belakang & Masalah

Pengisian bukti dukung kinerja harian di e-Kinerja mengharuskan pegawai mencatat aktivitas per blok waktu kerja (mis. 08.00-08.05 apel pagi, 08.05-09.00 monitoring jaringan, dst), masing-masing disertai bukti dukung berupa laporan berisi uraian + dokumentasi foto. Menyusun laporan ini manual (copy template Word/PDF, ketik ulang identitas, tempel foto) memakan waktu dan rawan tidak konsisten format antar pegawai.

## 3. Tujuan (Goals)

- Pegawai bisa membuat laporan bukti dukung dari HP/desktop dalam hitungan menit, hasil PDF identik dengan template resmi kantor.
- Riwayat laporan tersimpan & bisa dilihat ulang per tanggal.
- Admin bisa memantau kepatuhan pelaporan 70 pegawai tanpa rekap manual.

## 4. Non-Tujuan (Out of Scope v1)

Ditulis eksplisit untuk menghindari ambiguitas cakupan:

- **Tidak** terintegrasi otomatis ke portal e-Kinerja BKN — PDF diunduh, diunggah manual oleh pegawai ke portal tsb.
- **Tidak** ada penyusunan narasi berbantuan AI (berbeda dari proyek `sikap-morowali` yang sedang *pending* — lihat §12).
- **Tidak** ada alur approval/verifikasi atasan — laporan sepenuhnya tanggung jawab pegawai pembuatnya; admin hanya memantau kepatuhan & mengelola akun, tidak membaca/mengubah isi substansi laporan.
- **Tidak** ada keterkaitan ke struktur SKP/RHK — laporan berdiri sendiri per aktivitas, sesuai template existing.
- **Tidak** ada mode offline — Apps Script Web App butuh koneksi internet aktif.

## 5. Pengguna & Peran

| Peran | Login | Kewenangan |
|---|---|---|
| **Pegawai** (~70 ASN) | NIP saja, tanpa password | Buat, lihat, edit laporan miliknya. Hapus hanya saat status Draft. Finalisasi laporan (aksi eksplisit, tidak bisa dibatalkan/dihapus setelahnya). |
| **Admin** | NIP + password | Kelola data pegawai (CRUD), lihat dashboard monitoring & arsip semua laporan (read-only terhadap isi), nonaktifkan pegawai/laporan bermasalah. **Tidak** bisa edit/hapus isi laporan pegawai. |
| **SuperAdmin** (level Admin) | NIP + password | Semua kewenangan Admin + kelola akun Admin lain (CRUD). |

**Keputusan sadar & trade-off:** Login pegawai memakai NIP saja tanpa password, atas permintaan eksplisit pemilik produk — demi kemudahan bagi pegawai senior yang mudah lupa kredensial. Ini berarti siapa pun yang mengetahui NIP kolega (info yang tidak sepenuhnya rahasia) bisa login sebagai pegawai tsb. Risiko ini diterima sadar untuk konteks pemakaian internal kantor tertutup — **tidak** direkomendasikan untuk sistem yang diakses dari luar jaringan kantor tanpa mitigasi tambahan di kemudian hari.

## 6. Arsitektur

```
Browser (Pegawai/Admin, HP atau desktop)
   │  HTML/CSS/JS (HtmlService, routing via ?page=...)
   │  google.script.run  ↕
Google Apps Script (backend .gs)
   ├─ Auth.gs        → validasi NIP/password, token sesi (CacheService)
   ├─ Aktivitas.gs   → CRUD laporan, generate PDF
   ├─ Pegawai.gs     → CRUD data pegawai (admin)
   ├─ Admin.gs       → CRUD akun admin (superadmin)
   └─ Utils.gs       → validasi & kalkulasi bersama
   │
   ├─ Google Sheets (DB): Pegawai · Admin · Aktivitas
   └─ Google Drive: Template Docs · Foto · Laporan_PDF
```

Komunikasi client↔server memakai `google.script.run` (pola standar Apps Script Web App), bukan REST API. Satu Web App deployment melayani seluruh halaman lewat parameter `page`.

## 7. Model Data

### 7.1 Google Sheets (1 spreadsheet, 3 tab)

**`Pegawai`**
| Kolom | Keterangan |
|---|---|
| ID | Unique ID internal |
| NIP | Login pegawai, unique |
| Nama Lengkap | |
| Jabatan | |
| Unit Kerja | |
| Status | Aktif / Nonaktif |

**`Admin`**
| Kolom | Keterangan |
|---|---|
| ID | Unique ID internal |
| NIP | Login admin, unique |
| Nama | |
| Password | Di-hash (tidak plaintext) |
| Level | Admin / SuperAdmin |
| Status | Aktif / Nonaktif |

**`Aktivitas`** (1 baris = 1 laporan)
| Kolom | Keterangan |
|---|---|
| ID Laporan | Unique ID |
| NIP | FK ke Pegawai |
| Tanggal | Tanggal pelaksanaan aktivitas |
| Jam Mulai / Jam Selesai | |
| Durasi Menit | Dihitung otomatis dari jam mulai-selesai |
| Nama Aktivitas | |
| Uraian | Poin-poin, disimpan sebagai teks multi-baris |
| Link Foto | 1-3 URL Drive, dipisah delimiter |
| Link PDF | URL PDF hasil generate terbaru |
| Status | Draft / Final |
| Waktu Dibuat | |
| Waktu Diubah Terakhir | |
| Waktu Finalisasi | Kosong jika masih Draft |

### 7.2 Google Drive

```
SiRajin_Storage/
├── Template/                          → 1 Google Docs master (placeholder {{...}})
├── Foto/{NIP}/{tanggal}/              → foto asli yang diupload pegawai
└── Laporan_PDF/{tahun}/{bulan}/       → PDF hasil generate, nama file NIP_tanggal_jamMulai.pdf
```

## 8. Autentikasi & Sesi

1. NIP (pegawai) atau NIP+password (admin) divalidasi terhadap sheet `Pegawai`/`Admin` (status harus Aktif).
2. Backend generate token (`Utilities.getUuid()`), simpan di `CacheService` (TTL 8 jam) berpasangan dengan identitas & peran pemilik.
3. Token dikirim ke browser, disimpan di `sessionStorage` (hilang saat tab ditutup — sesuai pemakaian bergantian di komputer/HP kantor).
4. Setiap pemanggilan `google.script.run` menyertakan token; backend memvalidasi token ke Cache sebelum memproses. Token tidak ditemukan/kedaluwarsa → respons "unauthorized", frontend redirect ke halaman login tanpa kehilangan data form yang sedang diisi (dipertahankan di memori JS).

## 9. Peta Halaman

| Halaman | Path | Akses |
|---|---|---|
| Landing | `?page=home` | Publik |
| Login Pegawai | `?page=login` | Publik |
| Login Admin | `?page=admin-login` | Publik |
| Aktivitas Pegawai | `?page=aktivitas` | Pegawai — daftar laporan per tanggal (default hari ini, bisa ganti tanggal utk lihat riwayat) |
| Tambah/Edit Aktivitas | `?page=aktivitas/tambah` | Pegawai — form isi/edit laporan |
| Dashboard Admin | `?page=admin` | Admin/SuperAdmin |
| Kelola Pegawai | `?page=admin/pegawai` | Admin/SuperAdmin |
| Kelola Laporan | `?page=admin/laporan` | Admin/SuperAdmin — arsip read-only, filter tanggal/pegawai |
| Kelola Admin | `?page=admin/akun` | SuperAdmin saja |

## 10. Alur Laporan: Buat → Edit → Finalisasi

**Status:** `Draft` → `Final` (satu arah, aksi eksplisit lewat tombol "Finalisasi", tidak ada status lain/approval tersembunyi).

| Aksi | Draft | Final |
|---|---|---|
| Edit isi | ✅ | ✅ (PDF diregenerate otomatis) |
| Hapus | ✅ | ❌ (tombol disabled) |
| Finalisasi | ✅ (mengubah ke Final) | — (sudah final) |

**Keputusan eksplisit:** PDF di-generate ulang **setiap kali laporan disimpan** (baik saat dibuat, diedit, maupun saat difinalisasi) — bukan hanya sekali di awal. Ini menjamin link PDF di sheet `Aktivitas` selalu mencerminkan isi terbaru, termasuk saat laporan Final diedit.

**Alur teknis pembuatan/pembaruan laporan:**
1. Pegawai isi/ubah form → validasi frontend (field wajib, jam selesai > jam mulai, minimal 1 foto, maksimal 3).
2. Foto dikompres di browser (canvas resize) sebelum dikirim — mengantisipasi ukuran asli foto HP modern (>5MB).
3. Backend validasi ulang (tidak percaya validasi frontend) → simpan/replace foto ke `Foto/{NIP}/{tanggal}/`.
4. Salin Template Docs → isi placeholder data → tempel foto ke slot dokumen → export PDF → simpan ke `Laporan_PDF/{tahun}/{bulan}/` (menimpa versi lama jika ini proses edit).
5. Update/insert baris di sheet `Aktivitas`.
6. Frontend tampilkan kartu laporan terbaru + tombol unduh PDF.

## 11. Error Handling

| Situasi | Penanganan |
|---|---|
| Proses generate PDF berjalan lama | Tombol submit disabled + loading state eksplisit ("Menyusun laporan..."), cegah submit ganda |
| Koneksi terputus saat submit | `withFailureHandler` menangkap error, tampilkan pesan + tombol "Coba Lagi"; jika gagal di tengah proses, file yang telanjur ter-upload dihapus balik (tidak menyisakan data setengah jadi) |
| Token sesi kedaluwarsa saat submit | Redirect ke login, data form dipertahankan di memori |
| NIP tidak ditemukan / pegawai-admin nonaktif | Pesan jelas di halaman login, bukan error generik |
| Percobaan hapus laporan Final | Ditolak di backend meski request dipaksa lewat client (validasi tidak hanya disable tombol di UI) |

## 12. Dashboard Admin

- **Ringkasan hari ini**: jumlah pegawai (dari 70) yang sudah lapor (≥1 laporan Final) vs belum, plus daftar nama yang belum lapor.
- **Filter riwayat**: per pegawai / per tanggal / per rentang tanggal (untuk rekap bulanan).
- **Total jam kerja per pegawai per hari**: dijumlahkan dari durasi laporan Final — bersifat **informatif, bukan gerbang/validasi yang memblokir** apa pun.
- Admin **tidak** dapat mengubah/menghapus isi laporan pegawai — hanya dapat menonaktifkan akun pegawai/status laporan bermasalah (bukan mengedit substansi).

## 13. Strategi Testing

- Fungsi murni tanpa dependensi layanan Google (kalkulasi durasi, validasi format NIP, validasi rentang jam) dipisah ke modul independen → diuji otomatis dengan Jest, berjalan lokal tanpa perlu lingkungan Apps Script.
- Fungsi yang bergantung `SpreadsheetApp`/`DriveApp`/`DocumentApp` diuji lewat **checklist skenario manual** sebelum tiap rilis perubahan besar:
  - Login pegawai (NIP valid/invalid/nonaktif), login admin (NIP+password benar/salah)
  - Tambah laporan (1/2/3 foto), edit laporan Draft, edit laporan Final, finalisasi
  - Percobaan hapus laporan Draft (berhasil) vs Final (ditolak)
  - Generate PDF — bandingkan visual hasil dengan `template/laporan_kinerja_harian_v4.pdf`
  - Dashboard admin — angka kepatuhan sesuai data aktual
  - Submit dengan koneksi disimulasikan putus di tengah proses

## 14. Struktur Proyek & Tooling

Pengembangan lokal memakai `clasp` (CLI resmi Google Apps Script) + git lokal untuk riwayat perubahan, deploy tetap ke Google:

```
sirajin-morowali/
├── design.md                                          → design system (§ referensi)
├── template/laporan_kinerja_harian_v4.pdf              → acuan visual PDF
├── docs/superpowers/specs/2026-08-21-sirajin-core-design.md   → dokumen ini
├── src/
│   ├── backend/    (Code.gs, Auth.gs, Aktivitas.gs, Pegawai.gs, Admin.gs, Utils.gs)
│   └── frontend/   (Login.html, Aktivitas.html, TambahAktivitas.html, AdminDashboard.html, AdminPegawai.html, AdminLaporan.html, AdminAkun.html, Shared.html)
├── appsscript.json
└── .clasp.json
```

## 15. Referensi Visual

Lihat `design.md` di root proyek ini untuk palet warna, tipografi, spacing, dan komponen UI (terinspirasi notion.com, disesuaikan konteks pemerintahan & mobile-first untuk halaman pegawai).

## 16. Hubungan dengan Proyek `sikap-morowali`

Dicatat sebagai konteks, bukan keputusan teknis: pemilik produk memiliki proyek terpisah `sikap-morowali` (Next.js, lebih besar — mencakup SKP/RHK, narasi berbantuan AI, audit trail) yang saat ini **pending** pengerjaannya. SiRajin dirancang independen dan lebih ringan, fokus khusus pada kebutuhan bukti dukung foto+uraian saat ini — tidak dimaksudkan menggantikan atau bergantung pada `sikap-morowali`.
