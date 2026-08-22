# SiRajin Morowali (Rewrite Bersih)

Aplikasi Google Apps Script (HtmlService) untuk mencatat aktivitas harian pegawai DPMPTSP Kabupaten Morowali sampai jadi laporan PDF, plus panel admin. Ditulis ulang bersih dari nol dengan desain cream/hijau/terracotta.

## Deploy (dilakukan product owner)

1. `cd sirajin-baru && clasp login` (kalau belum)
2. `clasp create --type webapp --title "SiRajin Morowali"` → buat GAS project baru
3. `clasp push`
4. Buka editor, jalankan `Setup.setupAwal()` → buat sheet/folder + isi Script Properties
5. Buat Google Docs template laporan, jalankan `setTemplateDocId('<id>')`
6. `clasp deploy` → dapat URL `/exec` untuk presentasi
