# Design Spec — Redesign Visual dari `sirajin-morowali-design-bundle` (v2)

> **Status:** Draft untuk direview pemilik produk · **Tanggal:** 22 Agustus 2026

## 1. Ringkasan Eksekutif

Redesign visual SiRajin Morowali lintas 9 halaman, mengikuti **design bundle baru**
(`template-baru/sirajin-morowali-design-bundle.zip`, dibuat 22 Agustus 2026 jam 12:26)
yang dibawa pemilik produk. Bundle berisi 9 mockup HTML (`design-reference/01-landing.html`
s.d. `09-kelola-akun.html`), `DESIGN_SYSTEM.md`, dan `APPS_SCRIPT_INTEGRATION.md`.

**Design bundle ini adalah evolusi/penyempurnaan dari template lama** (`template-baru/*.html`
lepas, jam 07:xx) yang jadi basis kerja sesi sebelumnya (`worktree-template-theme-switch`,
belum di-merge). File bundle 4–10× lebih detail & matang, dengan palet **identik**
(cream/hijau-tua/terracotta). Pembeda utama: bundle **memakai lambang Kabupaten Morowali asli**
(base64 PNG di landing/login/dashboard), membalik keputusan lama yang memakai shield generik.

**Keputusan pemilik produk untuk redesign ini (dikonfirmasi eksplisit sesi ini):**
- Worktree lama `worktree-template-theme-switch` (commit `a4418bd`, 13 task selesai)
  **dibuang tanpa di-merge** — mulai fresh dari bundle baru.
- **Lambang Kabupaten Morowali asli dipakai** di semua halaman (balik dari shield generik).
- Scope integrasi = **visual saja**, backend `.js` existing **di-reuse 100%** (nol perubahan
  fungsi server yang sudah jalan) — dengan **dua pengecualian scope** yang ditambahkan sadar
  di §4, dan **dua adopsi komponen UI kaya** di §5.

Seperti redesign sebelumnya, setiap file bundle **100% statis** (data hardcode, link pakai
nama file, id tidak cocok dengan JS backend). Ini pada dasarnya **pengulangan** kerja
integrasi per-halaman, dari basis markup/CSS yang lebih matang.

## 2. Latar Belakang & Keputusan yang Dibalik

Sesi sebelumnya membangun redesign template-baru (cream/hijau, shield generik) di
`worktree-template-theme-switch` — 13 task selesai, review clean, **belum di-merge**.
Pemilik produk lalu membawa design bundle yang lebih matang. Setelah membandingkan
(screenshot langsung, hex warna, struktur kode), diputuskan pakai bundle sebagai basis baru.

**Tiga keputusan lama yang dibalik/diperluas sesi ini (semuanya dikonfirmasi eksplisit):**

1. **Lambang**: lama = shield generik; sekarang = **lambang Morowali asli**. Asset sudah ada
   di repo (`morowali.png`, base64 di `Shared.html` sebagai `SIRAJIN_LOGO_SRC`) — reuse, bukan
   re-embed.
2. **Rekap mingguan dashboard**: lama = ditolak (app cuma punya data per-hari); sekarang =
   **bangun agregasi mingguan asli** (fungsi backend baru, §4a).
3. **Pola modal Kelola Pegawai/Akun**: lama = ditolak (id `modalPegawai` collision, pakai
   inline-card); sekarang = **adopsi modal, id di-namespace ulang** (§4b).

Keputusan #2 dan #3 **memperluas scope di luar "visual saja"** — dicatat sebagai pengecualian
sadar, bukan pelanggaran disiplin nol-perubahan-server (yang tetap berlaku untuk semua fungsi
existing).

## 3. Tujuan & Non-Tujuan

### Tujuan
- Semua 9 halaman memakai sistem visual design bundle, terintegrasi penuh ke backend GAS existing.
- Lambang Morowali asli tampil di semua permukaan (landing/login/topbar admin), reuse asset.
- Setiap halaman **di-render dinamis** dari data backend (bukan hardcode statis seperti bundle).
- Nol perubahan file server `.js` **kecuali §4a** — satu fungsi **baru** ditambahkan, nol
  fungsi existing diubah. (§4b dan §5 murni client-side, tidak menyentuh server sama sekali.)
- Nol perubahan pola navigasi/sesi client (`redirectTop()`, `google.script.url.getLocation()`,
  delegated link listener, `requireLogin()`/`requireAdminLogin()`, `handleSessionExpiry()`,
  `renderAdminNav()`'s session-fetch).
- WCAG contrast dihitung ulang dari nol untuk semua kombinasi warna baru (§7).

### Non-Tujuan
- **Tidak** merge/keep worktree lama — dibuang.
- **Tidak** mengubah struktur file backend jadi `Code.gs`/`Data.gs`/`Auth.gs` gaya
  `APPS_SCRIPT_INTEGRATION.md` — dokumen itu asumsikan build-from-scratch, kita punya app jalan.
  Dipakai hanya sebagai referensi skema data bila berguna.
- **Tidak** mengubah `redirectTop()`/`google.script.url.getLocation()`/dst.
- **Tidak** memperkenalkan build step/bundler — bundle hanya Google Fonts + CSS inline.
- **Tidak** mengubah `Aktivitas.html` unescaped `innerHTML` (self-XSS, pre-existing, identik di
  base) — tetap out of scope, dicatat sebagai follow-up terpisah.
- **Tidak** deploy ke production (`@13`) — otorisasi terpisah.
- **Tidak** auto push / merge / deploy — berhenti minta izin di tiap gerbang (§9).

## 4. Dua Pengecualian Scope (di luar "visual saja")

Hanya **§4a** yang menyentuh server (menambah satu fungsi baru). **§4b** murni client-side.

### 4a. Rekap Mingguan Dashboard Admin
Bundle `06-dashboard-kepatuhan.html` punya tabel "Rekap Jam Kerja" mingguan dengan kolom
"Hari Lapor" (isi mis. "5/5 hari"), "Total Jam", "Kelengkapan" (badge Lengkap/Kurang), di
bawah heading "Minggu berjalan". `DashboardService.js` existing hanya mengembalikan data
per-hari (`getDashboardSummary(token, tanggal)` → `{sudahLapor, belumLapor[], rekapJam[]}`).

**Aksi:** tambah fungsi backend baru di `DashboardService.js` (nama kandidat:
`getRekapMingguan(token, tanggalAcuan)`) yang mengagregasi sheet `Aktivitas` per NIP untuk
5 hari kerja (Senin–Jumat) minggu kalender dari `tanggalAcuan`, mengembalikan array
`{nip, nama, hariLapor: <n>, totalHari: 5, totalMenit, lengkap: <bool>}`. Threshold "Lengkap"
= `hariLapor === 5` (5/5); selain itu "Kurang". Fungsi existing `getDashboardSummary` **tidak
diubah** — ini fungsi tambahan yang dipanggil paralel.

**Definisi yang dikunci:**
- "Minggu berjalan" = Senin–Jumat minggu kalender yang memuat `tanggalAcuan`.
- "Hari Lapor" = jumlah hari kerja (dari 5) di mana pegawai punya ≥1 laporan `Final`.
- "Kelengkapan": `Lengkap` (badge hijau) jika 5/5, `Kurang` (badge gold/warning) jika <5.

### 4b. Modal Tambah/Edit Pegawai & Akun
Bundle `07-kelola-pegawai.html` & `09-kelola-akun.html` sama-sama pakai `id="modalPegawai"`
(collision kalau markup mentah dipakai). App existing pakai inline-card expand/collapse.

**Aksi:** adopsi visual `.modal-overlay`/`.modal-box` dari bundle, **id di-namespace**:
`modalPegawai` (halaman Pegawai) vs `modalAkun` (halaman Akun) — bukan collision. JS
open/close/backdrop baru (kandidat: `openModal()`/`closeModal()` per halaman, atau helper
bersama di `AdminShared.html` yang menerima id modal sebagai argumen). Field & id form
**dipertahankan persis** dari app existing (bukan dari bundle):
- Pegawai: `pNip`, `pNama`, `pJabatan`, `pUnit`, `pegawaiId` (hidden), `formError`,
  `formJudul`, `btnSimpanPegawai`. (Bundle pakai field "Bidang" dropdown — **tidak dipakai**,
  tetap "Unit Kerja" input teks.)
- Akun: `aNip`, `aNama`, `aLevel` (select Admin/SuperAdmin), `aPassword`, `adminId` (hidden),
  `formError`, `formJudul`, `btnSimpanAdmin`.

Container form berubah dari `.card` `display:none` jadi `.modal-overlay` `.open` toggle;
`style.display = 'block'` jadi `classList.add('open')`, `= 'none'` jadi `.remove('open')`.
Backend CRUD existing (`savePegawai`, `setPegawaiStatus`, `saveAdmin`, `setAdminStatus`,
`listPegawai`, `listAdmin`) **dipakai apa adanya**.

## 5. Dua Komponen UI Kaya (client-side, dikonfirmasi adopsi)

### 5a. Date Scroller di Aktivitas Saya
Bundle `04-aktivitas-saya.html` punya navigasi tanggal horizontal: tombol prev/next
(`datePrev`/`dateNext`), strip tanggal (`dateScroller`), `<input type="date" id="datePicker">`,
link "Kembali ke hari ini" (`dateTodayLink`), label hari besar (`todayLabel`). App existing
cuma `<input type="date" id="tanggal">` polos.

**Aksi:** adopsi date-scroller (JS baru ~70 baris, murni client-side). Backend tetap
`listAktivitasByDate(token, tanggal)` — dipanggil dengan 1 tanggal terpilih. JS bundle punya
`setSelected(d)` yang jadi titik sambung: strip tanggal render client-side, lalu panggil
`renderLaporan()` existing (fungsi dipertahankan). Perhatikan: `Date.now()`/`new Date()` boleh
di client (bukan di workflow script) — tidak ada batasan GAS di sini.

### 5b. Seal-Ring Motif di Landing/Login
Bundle punya `.seal-ring` (SVG lingkaran putus-putus) di landing & login, mengelilingi lambang.
Adopsi apa adanya (SVG inline statis, nol JS) menggantikan `.pita-lambang` divider lama.

## 6. Token Desain (dari `DESIGN_SYSTEM.md` bundle)

Palet **identik** dengan template lama (sudah pernah diverifikasi WCAG sebagian di sesi lalu,
tapi **wajib hitung ulang** untuk elemen baru — §7):

| Token | Hex | Peran |
|---|---|---|
| `--bg` | `#F5F1E5` | Latar halaman (kertas hangat) |
| `--surface` | `#FFFFFF` | Kartu |
| `--surface-alt` | `#EFEADB` | Latar sekunder / stripe tabel |
| `--ink` | `#211F19` | Teks utama |
| `--ink-soft` | `#5B5648` | Teks sekunder |
| `--ink-faint` | `#8A8471` → **`#6B6558`** | Teks tersier/placeholder (**3.74:1 gagal AA di bg terang, dinaikkan**) |
| `--primary` | `#1F4A3D` | Hijau tua — header, topbar admin, panel login |
| `--primary-dark` | `#143128` | Background panel login gelap |
| `--primary-soft` | `#E2EAE4` | Tint terpilih |
| `--accent` | `#B75A2E` | Terracotta — tombol utama (CTA), aksen |
| `--accent-dark` | `#93441F` | Hover accent |
| `--gold` | `#B4863C` | Emas pudar — status "Final/Selesai" |
| `--gold-text` | **`#6B4E1E`** | Gold-sebagai-teks-badge (**gold asli 2.64:1 gagal AA, token baru**) |
| `--danger` | `#A23B33` | Hapus, belum lapor |
| `--success` | `#2F6B52` | Tersimpan, lengkap |
| `--warning` | `#B4863C` | Draft, kurang |
| `--border` | `#DED6C0` | Border |
| `--border-soft` | `#E9E3D2` | Border halus |

Semua token `--navy-*`/`--gold-600/700/300`/`--pita-*`/`--blue-*` dari sistem lama **dihapus**.

**Tipografi:** Source Serif 4 (display: H1/H2, nama pegawai tabel, angka statistik) + Inter
(UI/body). `.tabular` (`font-variant-numeric: tabular-nums`) untuk jam/NIP/statistik.

## 7. Aksesibilitas — WCAG dihitung ulang dari nol

**Wajib hitung rasio kontras aktual** (bukan asumsi) untuk semua kombinasi teks/background,
termasuk elemen BARU yang belum pernah dicek:
- Teks di atas `--primary` (topbar admin, panel login gelap, badge Lengkap).
- `--accent`/`--gold` sebagai teks di background apa saja.
- Badge "Lengkap"/"Kurang" di tabel rekap mingguan (elemen baru §4a).
- `.stat-card` border-left/top berwarna + angka statistik.
- Isi `.modal-box` (§4b).
- `.date-scroller` chip aktif/non-aktif (§5a).

Lima kegagalan kontras ditemukan sesi lalu dengan menghitung rasio nyata (`--ink-faint`,
gold-as-badge-text, `.btn-primary` text, `.finalisasi`, + 2 di navy round). Palet ini
**berulang kali terlihat bagus tapi gagal AA** — jangan asumsikan otomatis benar.

Pola mobile-first dipertahankan: breakpoint 768px, touch target 44px, font 16px di input.
Verifikasi per-file saat implementasi, bukan diasumsikan.

## 8. Pemetaan File & ID — kontrak integrasi

Setiap file bundle 100% statis. Id kolom "app existing" HARUS ada di markup final (JS backend
bergantung padanya). Id bundle dibuang/diganti.

| Bundle | App existing | Catatan integrasi |
|---|---|---|
| `01-landing.html` | `Home.html` | Nol id backend. Link `./02-...` → `?page=login`, `./03-...` → `?page=admin-login`. Lambang asli + seal-ring. Angka statis "70 pegawai / 1 pintu" → biarkan statis (bukan data backend). |
| `02-login-pegawai.html` | `Login.html` | `id="nip"` sudah cocok. Tombol submit → `type="button"` + handler `loginPegawai(nip)` existing. Elemen `#errorMsg` dipertahankan. |
| `03-login-admin.html` | `AdminLogin.html` | `id="anip"`→`id="nip"`, `id="apw"`→`id="password"`. Tombol → `type="button"` + `loginAdmin(nip, password)`. Toggle show/password bundle: hapus (nol interaksi baru). |
| `04-aktivitas-saya.html` | `Aktivitas.html` | Date-scroller diadopsi (§5a); id `daftarLaporan` untuk timeline; `renderLaporan()`/`hapusLaporan()`/`finalisasiLaporan()` existing dipertahankan. Tombol tambah → `?page=aktivitas/tambah`. |
| `05-tambah-edit-aktivitas.html` | `TambahAktivitas.html` | Paling rumit. `id="pointList"`→`daftarUraian`, `slot0/slot1` → input dalamnya diberi `foto1`/`foto2`. Tambah id: `judulHalaman`, `tanggal`, `jamMulai`, `jamSelesai`, `namaAktivitas`, `btnTambahPoin`, `btnSimpan` (+`type=button`), `errorMsg`. JS bundle (`addPoint`/`handlePhoto`/`removePhoto`) **DIBUANG total**, diganti `tambahPoinUraian`/`kompresGambar`/`ambilFotoBase64`/mode-edit-`getLocation` existing. |
| `06-dashboard-kepatuhan.html` | `AdminDashboard.html` | Stat cards → `id="ringkasan"`, belum-lapor → `id="belumLapor"`, progress → `id="progresLapor"`, rekap harian → `id="tabelJam"`. **Rekap mingguan baru** (§4a) render dari `getRekapMingguan`. Nav 4-link hardcode → topbar dinamis `renderAdminNav()`. |
| `07-kelola-pegawai.html` | `AdminPegawai.html` | Modal `id="modalPegawai"` (§4b), field `pNip/pNama/pJabatan/pUnit`. Filter search nama/NIP + status client-side (opsional). Filter "Bidang" bundle tidak dipakai. Tabel render dari `listPegawai()`. |
| `08-kelola-laporan.html` | `AdminLaporan.html` | Filter `filterMulai`/`filterAkhir`/`filterPegawai`/`btnFilter` (didukung `listLaporanArsip`). Filter status & "Ekspor CSV" bundle **tidak didukung backend → dihapus/dinonaktifkan**. Tabel `id="tabelArsip"`. |
| `09-kelola-akun.html` | `AdminAkun.html` | Modal `id="modalAkun"` (§4b, namespace beda dari Pegawai). Field `aNip/aNama/aLevel/aPassword`. Tabel render dari `listAdmin()`, guard `aksesError`/`kontenHalaman` existing dipertahankan. |

**Topbar admin (`AdminShared.html`)**: tidak diambil dari bundle (bundle punya nav statis
per-halaman). Tetap `renderAdminNav()` dinamis (session-fetch, highlight otomatis, logout,
SuperAdmin conditional). **Hanya CSS direwarnai** ke `--primary`/`--accent`; struktur & JS
`renderAdminNav()` tidak berubah. Lambang asli di brand topbar.

## 9. Rollout & Verifikasi (staged, checkpoint di tengah)

Sama pola sesi lalu (terbukti jalan):

1. Worktree baru dari `master` (kandidat nama: `worktree-template-baru-v2`), lock.
2. **Checkpoint 1**: `Shared.html`/`AdminShared.html` (token baru + lambang) + `Login.html`
   (representatif kecil, kontrak paling dekat). Verifikasi live pemilik produk **sebelum**
   lanjut. (Norm "minta izin sebelum push" berlaku.)
3. Setelah disetujui: `Home.html` + `AdminLogin.html` (hero sisanya).
4. Backend rekap mingguan (`DashboardService.js` §4a) + komponen modal (`AdminShared.html` §4b).
5. 4 halaman admin (`AdminDashboard`, `AdminPegawai`, `AdminLaporan`, `AdminAkun`).
6. `Aktivitas.html` + `TambahAktivitas.html` terakhir (paling rumit; date-scroller §5a +
   pola id-remap sudah teruji di file lain).
7. WCAG audit menyeluruh (§7) sebelum push final.
8. Push final + verifikasi live 9 halaman + regresi kelas bug navigasi.
9. Review menyeluruh branch sebelum merge.

**Gerbang izin eksplisit (berhenti & tanya):** sebelum `clasp push`; sebelum merge ke `master`;
sebelum apapun ke production `@13`.

**Catatan GAS quirk (sesi lalu):** `/dev` kadang serve konten stale lama, tanpa root cause
selain propagation lag Google. Kalau verifikasi live terlihat macet, cut fresh `clasp deploy`
standalone & cek `/exec`-nya dulu — jangan asumsikan kode salah.

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| JS bundle `TambahAktivitas` (addPoint/handlePhoto) kepakai bareng JS existing, dobel-binding | Buang total blok `<script>` bundle, bukan gabung. Verifikasi via review diff eksplisit. |
| Kontras warna elemen baru (badge Lengkap/Kurang, modal, date-chip) belum pernah dicek | Hitung ulang WCAG semua kombinasi §7 sebelum push. |
| Modal id collision `modalPegawai` dipakai 2 file bundle | Namespace: `modalPegawai` vs `modalAkun` (§4b). |
| Rekap mingguan menambah fungsi backend (di luar "visual saja") | Fungsi **baru**, tidak sentuh fungsi existing. Definisi mingguan/threshold dikunci §4a. |
| Filter status / Ekspor CSV `AdminLaporan` menjanjikan fitur tak ada di backend | Dihapus/dinonaktifkan dari markup (§8), bukan tombol mati. |
| Date-scroller nambah ~70 baris JS baru yang perlu ditest | Backend tetap 1-tanggal; test prev/next/today-link/picker terpisah di checkpoint. |
| Scope 9 file "terasa selesai" padahal ada id lolos mapping | Tabel §8 jadi kontrak; plan verifikasi tiap id via grep, bukan visual. |
| Worktree lama dibuang padahal ada kerja bagus di sana | Konfirmasi eksplisit pemilik produk. Branch tetap ada di git history sampai `git branch -d`, bisa di-recover bila perlu. |
