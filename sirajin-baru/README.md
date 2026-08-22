# SiRajin Morowali (Rewrite Bersih)

Aplikasi Google Apps Script (HtmlService) untuk mencatat aktivitas harian pegawai DPMPTSP Kabupaten Morowali sampai jadi laporan PDF, plus panel admin. Ditulis ulang bersih dari nol dengan desain cream/hijau/terracotta.

## Struktur folder

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

9 file server (`.js`) + 11 file halaman/chrome (`.html`, 2 shared + 9 halaman) — semua dibangun lewat Subagent-Driven Development, satu task per file, direview sebelum lanjut ke task berikutnya. Riwayat lengkap tiap task (siapa yang implement, temuan review, ruling) ada di `.superpowers/sdd/2026-08-22-sirajin-fresh-gas/progress.md` di root repo.

## Testing

Jest untuk logika murni (di-bridge lewat `module.exports` seperti project lama): `hashPassword`, `isValidNIP`, `isValidTimeRange`, `calculateDurationMinutes`, `formatDuration`, `hitungRekapMingguan_`, `getMingguKerja_`. Target: semua hijau sebelum push.

Status saat ini (Task 20, 2026-08-23): **3 suite, 31/31 test hijau** (`cd sirajin-baru && npm test`). Menjalankan `npm test` dari root repo (bukan dari `sirajin-baru/`) ikut menjalankan suite project lama yang tidak relevan dan akan menunjukkan angka lebih besar — itu bukan regresi, cuma beda cakupan.

## Audit finalisasi (Task 20)

Dijalankan 2026-08-23 terhadap seluruh `sirajin-baru/src/`:

- **Navy/split-shell**: `grep -rn "navy\|split-shell\|split-brand" src/` → **0 hasil**. Tidak ada sisa palet/layout navy dari project lama.
- **Token `:root`**: `grep -c ":root" src/*.html` menghitung 1 di tiga file (`Shared.html`, `AdminShared.html`, `AdminAkun.html`) — tapi grep ini cuma hitung kemunculan teks, bukan blok CSS beneran. Dicek manual: `Shared.html` punya blok `:root { ... }` sungguhan (memang harus, di situ semua token didefinisikan); `AdminShared.html` dan `AdminAkun.html` masing-masing cuma punya 1 baris **komentar** yang secara eksplisit bilang "`:root` TIDAK didefinisikan ulang di sini" — bukan redefinisi token. Jadi audit ini **lolos** secara substansi: cuma `Shared.html` yang benar-benar mendefinisikan token.
- **Link navigasi sisa bundle**: `grep -rn '\.html"' src/*.html | grep -v "Shared\|AdminShared"` → **0 hasil**. Tidak ada link relatif gaya bundle (`./NN-xx.html`) yang lupa diganti `?page=...`.
- **WCAG kontras** (dihitung pakai formula relative-luminance resmi WCAG, bukan tebak-tebakan mata):

  | Pasangan warna | Rasio | Ambang AA |
  |---|---|---|
  | `--ink-faint` (`#6B6558`) di atas `--bg` (`#F5F1E5`) | **5.13:1** | ✅ ≥4.5 |
  | `--ink-faint` di atas `--surface` (`#FFFFFF`) | **5.79:1** | ✅ ≥4.5 |
  | `--gold-text` (`#6B4E1E`) di atas `--bg` | **6.80:1** | ✅ ≥4.5 |
  | `--gold-text` di atas `--surface` | **7.68:1** | ✅ ≥4.5 |
  | `--gold-text` di atas `--gold-soft` (pasangan asli badge `badge-tersimpan`) | **6.20:1** | ✅ ≥4.5 |
  | `--success` di atas `--success-soft` (pasangan asli badge `badge-final`/`badge-aktif`) | **5.07:1** | ✅ ≥4.5 |
  | `--danger` di atas `--danger-soft` (pasangan asli badge `badge-belum`) | **5.07:1** | ✅ ≥4.5 |

  Semua pasangan lolos AA dengan margin sehat. Lima kegagalan WCAG yang sempat ditemukan (dan diperbaiki) di sesi-sesi desain sebelumnya (`--ink-faint` lama, gold-as-badge-text, dll — lihat riwayat git) tidak muncul lagi di palet final ini.

## Deploy (dilakukan product owner)

1. `cd sirajin-baru && clasp login` (kalau belum)
2. `clasp create --type webapp --title "SiRajin Morowali"` → buat GAS project baru
3. `clasp push`
4. Buka editor, jalankan `Setup.setupAwal()` → buat sheet/folder + isi Script Properties
5. Cek log eksekusi (panel **Eksekusi**/**Executions** di editor Apps Script, atau output `Logger.log` yang langsung muncul setelah `setupAwal()` selesai jalan) untuk ambil NIP + password SuperAdmin awal yang baru dibuat. Password ini cuma ditampilkan **sekali** — langsung simpan di tempat aman sebelum log-nya hilang/tergulung.
6. Buat Google Docs template laporan, jalankan `setTemplateDocId('<id>')`
7. `clasp deploy` → dapat URL `/exec` untuk presentasi

## Verifikasi visual (penting)

Untuk cek render live GAS, pakai **Playwright screenshot** (bukan Chrome-DevTools MCP — tidak bisa tembus sandbox nested-iframe GAS). URL tanpa `?page=` default ke `home`.

## Di luar cakupan (YAGNI)

- Tidak ada notifikasi/pengingat otomatis.
- Tidak ada ekspor CSV.
- Dashboard tetap per-hari + rekap mingguan; tidak ada grafik/chart.
- Tidak memindahkan/mengubah project lama `sirajin-morowali` — biarkan apa adanya.

## Known follow-up (tidak blocking)

`Shared.html` (dipakai halaman pegawai) tidak punya helper `escapeHtml()` — cuma `AdminShared.html` yang punya, warisan langsung dari project lama (`Shared.html` lama juga tidak punya). `Aktivitas.html` dan `TambahAktivitas.html` masing-masing punya salinan lokal `escapeHtml()` sebagai workaround (sudah diverifikasi benar dan konsisten dipakai lewat code review). Follow-up yang baik nanti: pindahkan `escapeHtml`/`initials` ke `Shared.html` supaya halaman pegawai tidak perlu duplikasi.
