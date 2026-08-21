# Design System — SiRajin Morowali

Panduan desain ini menjadi acuan visual & interaksi SiRajin (Sistem Rekap Aktivitas Jurnal Instansi) — alat bantu pegawai DPMPTSP Kabupaten Morowali menyusun Laporan Bukti Dukung Kinerja Harian (uraian + foto kegiatan) untuk diunggah ke portal e-Kinerja.

Gaya visual terinspirasi dari referensi ekstraksi desain **notion.com** (biru `#2383E2`, netral abu-hangat, font Inter), disesuaikan untuk konteks resmi pemerintahan dan penggunaan mobile oleh pegawai di lapangan.

## 1. Prinsip Desain

- **Cepat dipakai di HP, bukan cuma di meja kerja.** Pegawai sering mengisi laporan langsung dari lokasi kegiatan (mis. saat monitoring jaringan) — halaman pegawai wajib mobile-first: 1 kolom, tombol besar, jempol-reachable.
- **Bersih & modern tanpa kehilangan formalitas.** Terinspirasi Notion (SaaS bersih, biru sebagai aksen tunggal), tapi tetap terasa sebagai alat kerja resmi ASN, bukan aplikasi konsumen.
- **Biru dipakai disiplin.** Hanya untuk aksi utama (tombol primer, status aktif, link) — sisanya netral, supaya aksen tetap terasa "diarahkan", bukan menghiasi seluruh layar.
- **Dokumen PDF tidak didesain ulang.** Layout laporan bukti dukung mengikuti template resmi yang sudah dipakai kantor (`template/laporan_kinerja_harian_v4.pdf`) — sistem hanya mereproduksinya secara presisi, bukan menciptakan gaya baru.

## 2. Palet Warna

### 2a. Palet Aplikasi (UI, dipakai pegawai & admin sehari-hari)

| Token | Hex | Peran |
|---|---|---|
| `blue-600` | `#2383E2` | Warna dominan — tombol primer, link, elemen aktif, ikon status |
| `blue-700` | `#1B6FC2` | Hover/pressed state dari blue-600 |
| `blue-100` | `#E8F2FC` | Background elemen terpilih, badge lembut |
| `ink-900` | `#37352F` | Teks utama, judul — abu-gelap hangat, bukan hitam pekat |
| `ink-600` | `#6B6963` | Teks sekunder, label, hint, placeholder |
| `paper` | `#FFFFFF` | Background halaman |
| `surface` | `#F7F6F4` | Background section/kartu alternatif, table header |
| `border` | `#E3E2E0` | Border hairline, pemisah |
| `success` | `#2F9E5B` | Status "Tersimpan/Final", badge durasi terpenuhi |
| `danger` | `#F64932` | Error, aksi hapus |
| `warning` | `#FFB110` | Peringatan non-blocking (mis. total jam kerja kurang dari target) |

**Aturan pemakaian:** biru hanya untuk aksi utama & status aktif — bukan menghiasi seluruh halaman. Sisanya netral (putih/abu hangat) supaya biru tetap terasa istimewa saat muncul.

### 2b. Palet Dokumen Cetak (PDF Laporan Bukti Dukung)

Tidak didesain ulang — reproduksi presisi dari `template/laporan_kinerja_harian_v4.pdf`:

| Elemen | Gaya |
|---|---|
| Kop dinas | Rata kiri/tengah sesuai template, teks tebal, alamat italic kecil di bawahnya |
| Bar judul section (mis. "II. RINCIAN AKTIVITAS KINERJA") | Background biru muda datar, teks biru tua tebal |
| Bar sub-header (mis. "Rincian/Uraian Aktivitas") | Background biru sedang solid, teks putih tebal |
| Badge durasi | Pill hijau lembut, teks hijau tua, mono/tabular |
| Border tabel & slot foto | Abu-biru muda, garis tipis 1px, slot foto putus-putus (dashed) sebelum diisi |

Sampling hex presisi diambil langsung dari file template saat implementasi (color-pick dari PDF asli), bukan ditebak di dokumen ini — supaya hasil generate benar-benar identik dengan template resmi.

## 3. Tipografi

**Aplikasi (UI):**

| Peran | Font | Fallback |
|---|---|---|
| Judul & heading | **Inter** (600–700) | -apple-system, sans-serif |
| Body & UI | **Inter** (400–500) | -apple-system, sans-serif |
| Data teknis (NIP, jam, durasi, tanggal) | **Inter tabular figures** atau monospace | ui-monospace |

- Ukuran dasar: body 15–16px (mobile jangan lebih kecil dari 15px — pegawai senior baca dari HP), heading H1 24–28px, label uppercase 11–12px letter-spacing 0.04em.
- Maks 1 keluarga font di UI (Inter) — jangan tambah font lain demi variasi.

**Dokumen cetak (PDF):** ikuti font asli template (Arial/Helvetica-style, sudah baku di dokumen instansi) — tidak diubah.

## 4. Spacing, Grid & Bentuk

- Grid dasar 4px/8px.
- **Mobile (pegawai, <640px):** 1 kolom penuh, padding halaman 16-20px, jarak antar-field 12-16px, tombol aksi utama full-width, min tinggi 44px, menempel/dekat area bawah layar (thumb-reachable).
- **Tablet/Desktop (640-1024px & >1024px):** form maks lebar 560-640px di tengah (jangan melebar penuh — tetap fokus), dashboard/admin boleh grid 2-3 kolom.
- Radius 8-10px untuk kartu, tombol, input — konsisten sedang (bukan tajam kaku, bukan bubble bulat penuh).
- Border hairline 1px, shadow sangat halus (`0 1px 3px rgba(0,0,0,0.06)`) untuk kartu — hindari shadow tebal/dramatis.
- Dokumen PDF tetap tanpa radius/shadow (meniru kertas fisik, sesuai template asli).

## 5. Komponen Kunci

**Input Foto (khusus mobile)**
`<input type="file" accept="image/*" capture="environment">` — di HP otomatis membuka kamera langsung (bukan cuma galeri), di desktop jadi file picker biasa. Maks 3 foto per laporan; tiap slot foto menampilkan thumbnail + tombol hapus (×) setelah dipilih, slot kosong bergaya dashed placeholder mengikuti gaya template PDF.

**Kartu Aktivitas**
1 kartu = 1 laporan pada Halaman Aktivitas Pegawai: jam mulai-selesai, nama aktivitas, badge status (`Tersimpan` hijau / `Draft` abu / `Gagal` merah), thumbnail foto kecil di pojok. Bisa diklik untuk lihat detail/PDF.

**Navigasi Pegawai (mobile)**
Bar bawah sederhana 2 aksi: "Aktivitas Hari Ini" & "+ Tambah Aktivitas" — bukan sidebar ala aplikasi desktop.

**Navigasi & Tabel Admin**
Sidebar/topbar standar desktop untuk menu (Dashboard, Kelola Pegawai, Kelola Laporan, Kelola Admin). Tabel data scroll horizontal di layar sempit (bukan pecah/terpotong), kartu ringkasan dashboard stack 1 kolom di HP.

**Tombol**
- Primary (blue-600): aksi utama (Simpan, Login, Tambah).
- Ghost/outline: aksi sekunder (Batal, Kembali) — border `border`, teks `ink-900`.
- Danger outline: aksi hapus/merusak.

**Badge Status**
Pill kecil huruf kapital: `Tersimpan` (hijau), `Draft` (abu), `Gagal` (merah), `Belum Lapor` (kuning, khusus dashboard admin).

**Form Tambah Aktivitas**
Jam mulai & selesai (time picker native `<input type="time">` — cocok mobile), durasi otomatis terhitung & tampil sebagai badge read-only, uraian aktivitas sebagai daftar poin dinamis (tombol "+ Tambah Poin"), upload foto di bagian bawah.

## 6. Interaksi & Motion

- Transisi standar 150-200ms, easing halus — hindari animasi bouncy.
- Loading state eksplisit saat generate PDF ("Menyusun laporan...") — proses ini tidak instan (render Google Docs → export PDF), jangan biarkan tombol diam tanpa feedback.
- Toast konfirmasi singkat untuk aksi non-destruktif (laporan tersimpan).
- Aksi destruktif (hapus laporan/pegawai/admin) selalu perlu dialog konfirmasi eksplisit.

## 7. Aksesibilitas & Kualitas

- Kontras teks minimal AA. Blue-600 di atas putih hanya untuk elemen besar (tombol, badge, ikon) — teks kecil/body tetap pakai `ink-900`/`ink-600`.
- Target sentuh minimal 44×44px di semua halaman pegawai (mobile).
- Semua elemen interaktif punya focus state terlihat (outline blue-700 saat fokus keyboard) — penting untuk halaman admin yang lebih banyak dipakai dengan keyboard.
- Bahasa UI: Indonesia formal-bersahabat, hindari jargon teknis di sisi pegawai.
- Form input laporan harus tetap dapat diedit penuh sebelum disimpan — tidak ada field yang "terkunci otomatis" tanpa alasan jelas ke pengguna.

## 8. Yang Harus Dihindari

- Sidebar kompleks ala desktop dipaksakan ke halaman pegawai mobile — pegawai hanya butuh 2 aksi utama.
- Font selain Inter di UI aplikasi (boleh khusus di dokumen cetak, mengikuti template asli).
- Ilustrasi/dekorasi berlebihan — ini alat kerja harian, bukan landing page pemasaran.
- Shadow tebal, glassmorphism, radius >14px — jaga kesan tegas-modern, bukan bubble konsumen.
- Menebak/mengarang warna dokumen PDF — selalu rujuk langsung ke `template/laporan_kinerja_harian_v4.pdf`.
