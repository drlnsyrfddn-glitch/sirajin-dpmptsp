# SiRajin Core + Alur Pegawai Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun fondasi SiRajin (auth, database, storage) dan alur lengkap pegawai: login NIP → lihat aktivitas per tanggal → buat/edit laporan dengan foto → finalisasi → PDF ter-generate otomatis identik dengan template resmi.

**Architecture:** Google Apps Script Web App (HtmlService untuk frontend, `.gs`/`.js` untuk backend) + Google Sheets sebagai database + Google Drive untuk foto & PDF, dikembangkan lokal via `clasp` dan git, logic murni diuji dengan Jest, logic yang bergantung layanan Google diverifikasi lewat checklist manual.

**Tech Stack:** Google Apps Script (V8 runtime), HTML/CSS/JS vanilla, `clasp` CLI, Jest (testing lokal), Google Sheets, Google Drive, Google Docs (template merge → PDF).

**Spec:** `docs/superpowers/specs/2026-08-21-sirajin-core-design.md`

## Global Constraints

- Login pegawai: NIP saja, tanpa password (keputusan sadar pemilik produk — lihat spec §5).
- Token sesi: `CacheService`, TTL keras 6 jam (21.600 detik), di-refresh tiap request aktif (spec §8).
- Maks 3 foto per laporan, minimal 1.
- Status laporan: `Draft` → `Final` (satu arah). Draft: edit & hapus bebas. Final: boleh edit (PDF diregenerate), tidak boleh dihapus — ditegakkan di backend, bukan cuma disable tombol UI.
- PDF di-generate ulang setiap kali laporan disimpan (buat baru, edit, maupun finalisasi) — bukan hanya sekali di awal.
- Palet & tipografi UI mengikuti `design.md` (biru `#2383E2` sebagai aksen, font Inter, mobile-first untuk semua halaman pegawai).
- Layout dokumen PDF harus identik dengan `template/laporan_kinerja_harian_v4.pdf` — tidak didesain ulang.

---

## Catatan Penting Sebelum Mulai

Beberapa langkah **tidak bisa dijalankan otomatis oleh agent coding** — butuh login interaktif ke akun Google kamu. Langkah-langkah ini ditandai **🔴 MANUAL (kamu sendiri)** di dalam task terkait. Semua langkah lain (tulis kode, tulis test, commit) bisa dikerjakan penuh oleh agent/engineer yang menjalankan plan ini.

---

### Task 1: Scaffolding Proyek (folder, git, Jest, clasp)

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `jest.config.js`
- Create: `appsscript.json`
- Create: `src/backend/.gitkeep`
- Create: `src/frontend/.gitkeep`
- Create: `tests/.gitkeep`

**Interfaces:**
- Produces: struktur folder yang dipakai seluruh task berikutnya (`src/backend/*.js` untuk kode server, `src/frontend/*.html` untuk halaman, `tests/*.test.js` untuk Jest).

- [ ] **Step 1: Buat struktur folder**

```bash
cd sirajin-morowali
mkdir -p src/backend src/frontend tests
```

- [ ] **Step 2: Init npm & install Jest**

```bash
npm init -y
npm install --save-dev jest
```

- [ ] **Step 3: Tulis `jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js']
};
```

- [ ] **Step 4: Tambahkan script test di `package.json`**

Edit `package.json`, tambahkan di bagian `"scripts"`:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

- [ ] **Step 5: Tulis `.gitignore`**

```
node_modules/
.clasp.json
*.log
```

`.clasp.json` diabaikan karena berisi `scriptId` unik milik deployment kamu — bukan sesuatu yang perlu dibagi lewat git.

- [ ] **Step 6: Tulis `appsscript.json`** (manifest Apps Script, wajib ada sebelum `clasp push`)

```json
{
  "timeZone": "Asia/Makassar",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

`timeZone` diset `Asia/Makassar` (WITA, UTC+8) — sesuai lokasi Kabupaten Morowali, penting supaya `new Date()` dan format jam di server tidak bergeser dari waktu lokal pegawai.

- [ ] **Step 7: 🔴 MANUAL (kamu sendiri) — buat Apps Script project & hubungkan clasp**

Jalankan di terminal kamu sendiri (butuh browser buat login Google):

```bash
npm install -g @google/clasp
clasp login
clasp create --title "SiRajin Morowali" --type webapp --rootDir ./src
```

Setelah ini, `clasp` membuat `.clasp.json` di root proyek berisi `scriptId` project Apps Script kamu. **Catat scriptId ini** — dipakai lagi kalau perlu buka project lewat `clasp open`.

- [ ] **Step 8: Commit**

```bash
git add package.json jest.config.js appsscript.json .gitignore src tests
git commit -m "chore: scaffold project structure, jest, clasp manifest"
```

---

### Task 2: Fungsi Utilitas Murni (TDD)

**Files:**
- Create: `src/backend/Utils.js`
- Test: `tests/utils.test.js`

**Interfaces:**
- Produces: `calculateDurationMinutes(jamMulai, jamSelesai)`, `formatDuration(totalMinutes)`, `isValidNIP(nip)`, `isValidTimeRange(jamMulai, jamSelesai)`, `parseTimeToMinutes(hhmm)` — dipakai oleh `Aktivitas.js` (Task 6) dan `Auth.js` (Task 4).

- [ ] **Step 1: Tulis test yang gagal (`tests/utils.test.js`)**

```js
const {
  calculateDurationMinutes,
  formatDuration,
  isValidNIP,
  isValidTimeRange
} = require('../src/backend/Utils.js');

describe('calculateDurationMinutes', () => {
  test('menghitung durasi normal dalam menit', () => {
    expect(calculateDurationMinutes('08:00', '11:30')).toBe(210);
  });

  test('melempar error jika jam selesai sama dengan jam mulai', () => {
    expect(() => calculateDurationMinutes('08:00', '08:00')).toThrow(
      'Jam selesai harus lebih besar dari jam mulai'
    );
  });

  test('melempar error jika jam selesai sebelum jam mulai', () => {
    expect(() => calculateDurationMinutes('11:00', '08:00')).toThrow(
      'Jam selesai harus lebih besar dari jam mulai'
    );
  });
});

describe('formatDuration', () => {
  test('format jam dan menit sekaligus', () => {
    expect(formatDuration(210)).toBe('3 Jam 30 Menit (210 Menit)');
  });

  test('format hanya menit ketika kurang dari 1 jam', () => {
    expect(formatDuration(45)).toBe('45 Menit (45 Menit)');
  });

  test('format hanya jam ketika kelipatan genap', () => {
    expect(formatDuration(120)).toBe('2 Jam (120 Menit)');
  });
});

describe('isValidNIP', () => {
  test('NIP 18 digit dengan spasi dianggap valid', () => {
    expect(isValidNIP('19920815 202421 1 005')).toBe(true);
  });

  test('NIP 18 digit tanpa spasi dianggap valid', () => {
    expect(isValidNIP('199208152024211005')).toBe(true);
  });

  test('NIP kurang dari 18 digit tidak valid', () => {
    expect(isValidNIP('12345')).toBe(false);
  });

  test('NIP berisi huruf tidak valid', () => {
    expect(isValidNIP('1992081520242A1005')).toBe(false);
  });
});

describe('isValidTimeRange', () => {
  test('jam selesai setelah jam mulai valid', () => {
    expect(isValidTimeRange('08:00', '11:30')).toBe(true);
  });

  test('jam selesai sama dengan jam mulai tidak valid', () => {
    expect(isValidTimeRange('08:00', '08:00')).toBe(false);
  });

  test('jam selesai sebelum jam mulai tidak valid', () => {
    expect(isValidTimeRange('11:00', '08:00')).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/backend/Utils.js'`

- [ ] **Step 3: Implementasi `src/backend/Utils.js`**

```js
function parseTimeToMinutes(hhmm) {
  var parts = String(hhmm).split(':');
  var h = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  return h * 60 + m;
}

function calculateDurationMinutes(jamMulai, jamSelesai) {
  var mulai = parseTimeToMinutes(jamMulai);
  var selesai = parseTimeToMinutes(jamSelesai);
  if (selesai <= mulai) {
    throw new Error('Jam selesai harus lebih besar dari jam mulai');
  }
  return selesai - mulai;
}

function formatDuration(totalMinutes) {
  var jam = Math.floor(totalMinutes / 60);
  var menit = totalMinutes % 60;
  var parts = [];
  if (jam > 0) parts.push(jam + ' Jam');
  if (menit > 0 || jam === 0) parts.push(menit + ' Menit');
  return parts.join(' ') + ' (' + totalMinutes + ' Menit)';
}

function isValidNIP(nip) {
  var cleaned = String(nip).replace(/\s+/g, '');
  return /^\d{18}$/.test(cleaned);
}

function isValidTimeRange(jamMulai, jamSelesai) {
  return parseTimeToMinutes(jamSelesai) > parseTimeToMinutes(jamMulai);
}

// Jembatan Node/Jest <-> Apps Script: blok ini tidak pernah jalan di
// runtime Apps Script (tidak ada global `module`), jadi aman di-deploy
// apa adanya lewat `clasp push`.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseTimeToMinutes: parseTimeToMinutes,
    calculateDurationMinutes: calculateDurationMinutes,
    formatDuration: formatDuration,
    isValidNIP: isValidNIP,
    isValidTimeRange: isValidTimeRange
  };
}
```

- [ ] **Step 4: Jalankan test, pastikan lolos**

Run: `npm test`
Expected: PASS — 10 test lolos

- [ ] **Step 5: Commit**

```bash
git add src/backend/Utils.js tests/utils.test.js
git commit -m "feat: add pure utility functions for duration and NIP validation"
```

---

### Task 3: Bootstrap Google Sheets & Drive

**Files:**
- Create: `src/backend/Setup.js`

**Interfaces:**
- Consumes: tidak ada (task independen).
- Produces: `setupSiRajin()` — fungsi one-time yang dijalankan manual dari editor Apps Script. Menyimpan `SPREADSHEET_ID`, `FOLDER_TEMPLATE_ID`, `FOLDER_FOTO_ID`, `FOLDER_PDF_ID` ke `PropertiesService.getScriptProperties()`, dipakai oleh `Auth.js` (Task 4) dan `Aktivitas.js` (Task 6).

- [ ] **Step 1: Tulis `src/backend/Setup.js`**

```js
function setupSiRajin() {
  var props = PropertiesService.getScriptProperties();

  if (!props.getProperty('SPREADSHEET_ID')) {
    var ss = SpreadsheetApp.create('SiRajin - Database');
    props.setProperty('SPREADSHEET_ID', ss.getId());

    var pegawaiSheet = ss.getSheets()[0].setName('Pegawai');
    pegawaiSheet.appendRow(['ID', 'NIP', 'Nama Lengkap', 'Jabatan', 'Unit Kerja', 'Status']);
    pegawaiSheet.getRange('B:B').setNumberFormat('@'); // kolom NIP wajib teks polos

    var adminSheet = ss.insertSheet('Admin');
    adminSheet.appendRow(['ID', 'NIP', 'Nama', 'Password', 'Level', 'Status']);
    adminSheet.getRange('B:B').setNumberFormat('@');

    var aktivitasSheet = ss.insertSheet('Aktivitas');
    aktivitasSheet.appendRow([
      'ID Laporan', 'NIP', 'Tanggal', 'Jam Mulai', 'Jam Selesai',
      'Durasi Menit', 'Nama Aktivitas', 'Uraian', 'Link Foto', 'Link PDF',
      'Status', 'Waktu Dibuat', 'Waktu Diubah Terakhir', 'Waktu Finalisasi'
    ]);
    // Kolom B/C/D/E dipaksa teks polos ('@') — tanpa ini, Sheets otomatis
    // mengonversi "08:00" jadi nilai waktu (Date) dan NIP 18 digit jadi
    // Number yang kehilangan presisi (18 digit > Number.MAX_SAFE_INTEGER).
    // Ini WAJIB diset sebelum baris data pertama ditulis oleh Aktivitas.js.
    aktivitasSheet.getRange('B:B').setNumberFormat('@'); // NIP
    aktivitasSheet.getRange('C:C').setNumberFormat('@'); // Tanggal (disimpan "YYYY-MM-DD")
    aktivitasSheet.getRange('D:E').setNumberFormat('@'); // Jam Mulai, Jam Selesai ("HH:MM")

    Logger.log('Spreadsheet dibuat: ' + ss.getUrl());
  }

  if (!props.getProperty('FOLDER_TEMPLATE_ID')) {
    var root = DriveApp.createFolder('SiRajin_Storage');
    var templateFolder = root.createFolder('Template');
    var fotoFolder = root.createFolder('Foto');
    var pdfFolder = root.createFolder('Laporan_PDF');

    props.setProperty('FOLDER_TEMPLATE_ID', templateFolder.getId());
    props.setProperty('FOLDER_FOTO_ID', fotoFolder.getId());
    props.setProperty('FOLDER_PDF_ID', pdfFolder.getId());

    Logger.log('Folder Drive dibuat: ' + root.getUrl());
  }

  Logger.log('Setup selesai. Jangan lupa: upload/buat Template Doc secara manual ke folder Template, lalu simpan ID-nya lewat setTemplateDocId().');
}

function setTemplateDocId(docId) {
  PropertiesService.getScriptProperties().setProperty('TEMPLATE_DOC_ID', docId);
}
```

- [ ] **Step 2: 🔴 MANUAL (kamu sendiri) — push & jalankan setup**

```bash
clasp push
clasp open
```

Di editor Apps Script yang terbuka: pilih fungsi `setupSiRajin` di dropdown atas, klik **Run**. Kalau ini pertama kali, Google akan minta izin akses Sheets/Drive — setujui. Cek log (`Ctrl+Enter` atau menu Execution log) untuk URL spreadsheet & folder yang baru dibuat, buka keduanya untuk pastikan sudah benar.

- [ ] **Step 3: 🔴 MANUAL (kamu sendiri) — buat Template Google Docs**

1. Buka folder `Template` yang baru dibuat (dari URL folder di log Step 2).
2. Buat **Google Docs baru**, susun layout **persis** seperti `template/laporan_kinerja_harian_v4.pdf`: kop dinas, judul, tabel identitas, tabel rincian aktivitas, 3 slot foto, penutup.
3. Di tempat data akan diisi otomatis, ketik literal placeholder berikut (termasuk kurung kurawal ganda):
   `{{NAMA}}`, `{{NIP}}`, `{{JABATAN}}`, `{{UNIT_KERJA}}`, `{{TANGGAL}}`, `{{JAM_MULAI}}`, `{{JAM_SELESAI}}`, `{{DURASI}}`, `{{NAMA_AKTIVITAS}}`, `{{URAIAN}}`, `{{FOTO_1}}`, `{{FOTO_2}}`, `{{FOTO_3}}`
4. Salin ID dokumen dari URL-nya (bagian antara `/d/` dan `/edit`).
5. Kembali ke editor Apps Script, jalankan sekali lewat Execution log/console:
   ```js
   setTemplateDocId('PASTE_ID_DOC_DI_SINI');
   ```
   (Bisa juga dari tab "Execute function" di editor, isi parameter lewat kode sementara di `Setup.js`, jalankan, lalu boleh dihapus lagi.)

- [ ] **Step 4: Commit**

```bash
git add src/backend/Setup.js
git commit -m "feat: add one-time setup for Sheets and Drive bootstrap"
```

---

### Task 4: Autentikasi & Sesi

**Files:**
- Create: `src/backend/Auth.js`
- Test: `tests/auth.test.js`

**Interfaces:**
- Consumes: `isValidNIP` dari `Utils.js` (Task 2).
- Produces: `loginPegawai(nip)`, `loginAdmin(nip, password)`, `validateToken(token)`, `hashPassword(password)` — dipakai oleh semua endpoint di `Aktivitas.js` (Task 6) dan halaman frontend (Task 8-10) sebagai gerbang tiap request.

Bagian yang bergantung `SpreadsheetApp`/`CacheService` tidak di-mock — diuji lewat checklist manual di Task 11. Yang diuji otomatis di sini hanya `hashPassword` (murni, deterministik).

- [ ] **Step 1: Tulis test untuk `hashPassword` (`tests/auth.test.js`)**

```js
const { hashPassword } = require('../src/backend/Auth.js');

describe('hashPassword', () => {
  test('hash yang sama untuk input yang sama', () => {
    expect(hashPassword('rahasia123')).toBe(hashPassword('rahasia123'));
  });

  test('hash berbeda untuk input berbeda', () => {
    expect(hashPassword('rahasia123')).not.toBe(hashPassword('rahasia124'));
  });

  test('hash tidak sama dengan plaintext-nya', () => {
    expect(hashPassword('rahasia123')).not.toBe('rahasia123');
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/backend/Auth.js'`

- [ ] **Step 3: Implementasi `src/backend/Auth.js`**

```js
var SESSION_TTL_SECONDS = 21600; // 6 jam — batas keras CacheService

function hashPassword(password) {
  if (typeof Utilities !== 'undefined') {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
    return digest.map(function (byte) {
      var v = (byte + 256) % 256;
      var hex = v.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  // Fallback murni JS untuk Jest (tidak ada global Utilities di Node) —
  // dipakai HANYA oleh test, runtime Apps Script selalu lewat cabang di atas.
  var crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return Utilities.getUuid();
}

function getSheet(name) {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  return ss.getSheetByName(name);
}

function loginPegawai(nip) {
  var cleanedNip = String(nip).replace(/\s+/g, '');
  if (!isValidNIP(cleanedNip)) {
    return { success: false, message: 'Format NIP tidak valid.' };
  }

  var sheet = getSheet('Pegawai');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var rowNip = String(rows[i][1]).replace(/\s+/g, '');
    if (rowNip === cleanedNip) {
      if (rows[i][5] !== 'Aktif') {
        return { success: false, message: 'Akun pegawai ini nonaktif. Hubungi admin.' };
      }
      var session = {
        role: 'pegawai',
        nip: rowNip,
        nama: rows[i][2],
        jabatan: rows[i][3],
        unitKerja: rows[i][4]
      };
      var token = generateToken();
      CacheService.getScriptCache().put(token, JSON.stringify(session), SESSION_TTL_SECONDS);
      return { success: true, token: token, session: session };
    }
  }
  return { success: false, message: 'NIP tidak ditemukan.' };
}

function loginAdmin(nip, password) {
  var cleanedNip = String(nip).replace(/\s+/g, '');
  var sheet = getSheet('Admin');
  var rows = sheet.getDataRange().getValues();
  var hashed = hashPassword(password);

  for (var i = 1; i < rows.length; i++) {
    var rowNip = String(rows[i][1]).replace(/\s+/g, '');
    if (rowNip === cleanedNip) {
      if (rows[i][5] !== 'Aktif') {
        return { success: false, message: 'Akun admin ini nonaktif.' };
      }
      if (rows[i][3] !== hashed) {
        return { success: false, message: 'NIP atau password salah.' };
      }
      var session = { role: 'admin', nip: rowNip, nama: rows[i][2], level: rows[i][4] };
      var token = generateToken();
      CacheService.getScriptCache().put(token, JSON.stringify(session), SESSION_TTL_SECONDS);
      return { success: true, token: token, session: session };
    }
  }
  return { success: false, message: 'NIP atau password salah.' };
}

function validateToken(token) {
  if (!token) return null;
  var cache = CacheService.getScriptCache();
  var raw = cache.get(token);
  if (!raw) return null;
  cache.put(token, raw, SESSION_TTL_SECONDS); // sliding refresh — reset timer
  return JSON.parse(raw);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { hashPassword: hashPassword };
}
```

**Catatan:** `Auth.js` memanggil `isValidNIP` dari `Utils.js` — di Apps Script ini otomatis tersedia (semua file digabung satu scope global), tidak perlu `require`. Pastikan `Utils.js` sudah ada dari Task 2 sebelum file ini di-push.

- [ ] **Step 4: Jalankan test, pastikan lolos**

Run: `npm test`
Expected: PASS — semua test `hashPassword` lolos (jalan lewat fallback Node `crypto`)

- [ ] **Step 5: Commit**

```bash
git add src/backend/Auth.js tests/auth.test.js
git commit -m "feat: add pegawai/admin login and session token validation"
```

---

### Task 5: Generate PDF dari Template

**Files:**
- Create: `src/backend/PdfGenerator.js`

**Interfaces:**
- Consumes: `formatDuration` dari `Utils.js` (Task 2); `TEMPLATE_DOC_ID`, `FOLDER_PDF_ID` dari Script Properties (Task 3).
- Produces: `generateLaporanPdf(pegawai, laporan)` → mengembalikan URL file PDF. Dipakai oleh `Aktivitas.js` (Task 6). `laporan` berbentuk `{ tanggal, jamMulai, jamSelesai, durasiMenit, namaAktivitas, uraian: string[], fotoBlobs: Blob[] }` (maks 3 elemen di `fotoBlobs`, slot kosong = `null`).

Tidak ada unit test otomatis (bergantung penuh `DocumentApp`/`DriveApp`) — diverifikasi lewat checklist manual Task 11 dengan membandingkan hasil ke `template/laporan_kinerja_harian_v4.pdf`.

- [ ] **Step 1: Implementasi `src/backend/PdfGenerator.js`**

```js
function formatTanggalIndonesia(tanggalIso) {
  var bulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  var parts = tanggalIso.split('-'); // format input: YYYY-MM-DD
  var tahun = parts[0], bulan = parseInt(parts[1], 10) - 1, tanggal = parseInt(parts[2], 10);
  return tanggal + ' ' + bulanIndo[bulan] + ' ' + tahun;
}

function insertImageAtPlaceholder(body, placeholder, imageBlob) {
  var found = body.findText(placeholder);
  if (!found) return;
  var paragraph = found.getElement().getParent().asParagraph();
  paragraph.clear();
  if (imageBlob) {
    paragraph.appendInlineImage(imageBlob);
  }
}

function generateLaporanPdf(pegawai, laporan) {
  var props = PropertiesService.getScriptProperties();
  var templateId = props.getProperty('TEMPLATE_DOC_ID');
  var pdfFolderId = props.getProperty('FOLDER_PDF_ID');

  if (!templateId) {
    throw new Error('TEMPLATE_DOC_ID belum diset. Jalankan setTemplateDocId() dulu (lihat Task 3).');
  }

  var nipBersih = String(pegawai.nip).replace(/\s+/g, '');
  var namaFile = nipBersih + '_' + laporan.tanggal + '_' + laporan.jamMulai.replace(':', '') + '.pdf';

  var templateFile = DriveApp.getFileById(templateId);
  var pdfFolder = DriveApp.getFolderById(pdfFolderId);
  var copy = templateFile.makeCopy('TEMP_' + namaFile, pdfFolder);

  var doc = DocumentApp.openById(copy.getId());
  var body = doc.getBody();

  body.replaceText('{{NAMA}}', pegawai.nama);
  body.replaceText('{{NIP}}', pegawai.nip);
  body.replaceText('{{JABATAN}}', pegawai.jabatan);
  body.replaceText('{{UNIT_KERJA}}', pegawai.unitKerja);
  body.replaceText('{{TANGGAL}}', formatTanggalIndonesia(laporan.tanggal));
  body.replaceText('{{JAM_MULAI}}', laporan.jamMulai);
  body.replaceText('{{JAM_SELESAI}}', laporan.jamSelesai);
  body.replaceText('{{DURASI}}', formatDuration(laporan.durasiMenit));
  body.replaceText('{{NAMA_AKTIVITAS}}', laporan.namaAktivitas);
  body.replaceText('{{URAIAN}}', laporan.uraian.join('\n'));

  for (var i = 0; i < 3; i++) {
    var placeholder = '{{FOTO_' + (i + 1) + '}}';
    insertImageAtPlaceholder(body, placeholder, laporan.fotoBlobs[i] || null);
  }

  doc.saveAndClose();

  var pdfBlob = DriveApp.getFileById(copy.getId()).getAs('application/pdf');
  var pdfFile = pdfFolder.createFile(pdfBlob).setName(namaFile);
  DriveApp.getFileById(copy.getId()).setTrashed(true); // buang salinan Docs sementara, sisakan PDF saja

  return pdfFile.getUrl();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/backend/PdfGenerator.js
git commit -m "feat: add PDF generation from Google Docs template merge"
```

---

### Task 6: CRUD Laporan Aktivitas

**Files:**
- Create: `src/backend/Aktivitas.js`

**Interfaces:**
- Consumes: `validateToken` (Task 4), `calculateDurationMinutes`/`isValidTimeRange` (Task 2), `generateLaporanPdf` (Task 5).
- Produces: `listAktivitasByDate(token, tanggal)`, `getAktivitasById(token, idLaporan)`, `saveAktivitas(token, data)` (buat baru jika `data.idLaporan` kosong, edit jika terisi — foto opsional saat edit, dipertahankan dari data lama bila tidak diunggah ulang), `finalizeAktivitas(token, idLaporan)`, `deleteAktivitas(token, idLaporan)` — dipanggil langsung dari frontend lewat `google.script.run` (Task 8-10).

Tidak ada unit test otomatis (bergantung penuh `SpreadsheetApp`) — diverifikasi lewat checklist manual Task 11.

- [ ] **Step 1: Implementasi `src/backend/Aktivitas.js`**

```js
function getAktivitasSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  return ss.getSheetByName('Aktivitas');
}

function rowToLaporan_(row) {
  return {
    idLaporan: row[0],
    nip: row[1],
    tanggal: row[2],
    jamMulai: row[3],
    jamSelesai: row[4],
    durasiMenit: row[5],
    namaAktivitas: row[6],
    uraian: String(row[7]).split('\n'),
    linkFoto: String(row[8]).split('|').filter(Boolean),
    linkPdf: row[9],
    status: row[10],
    waktuDibuat: row[11],
    waktuDiubah: row[12],
    waktuFinalisasi: row[13]
  };
}

function listAktivitasByDate(token, tanggal) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheet = getAktivitasSheet_();
  var rows = sheet.getDataRange().getValues();
  var hasil = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === session.nip && rows[i][2] === tanggal) {
      hasil.push(rowToLaporan_(rows[i]));
    }
  }
  return { success: true, data: hasil };
}

function saveFotoKeDrive_(nip, tanggal, fotoBase64List) {
  var props = PropertiesService.getScriptProperties();
  var rootFoto = DriveApp.getFolderById(props.getProperty('FOLDER_FOTO_ID'));

  var nipFolder = getOrCreateFolder_(rootFoto, nip);
  var tanggalFolder = getOrCreateFolder_(nipFolder, tanggal);

  var urls = [];
  var blobs = [];
  for (var i = 0; i < fotoBase64List.length; i++) {
    var base64 = fotoBase64List[i];
    if (!base64) { blobs.push(null); continue; }
    var blob = Utilities.newBlob(Utilities.base64Decode(base64.split(',')[1] || base64), 'image/jpeg', 'foto_' + (i + 1) + '.jpg');
    var file = tanggalFolder.createFile(blob);
    urls.push(file.getUrl());
    blobs.push(blob);
  }
  return { urls: urls, blobs: blobs };
}

function getOrCreateFolder_(parent, name) {
  var existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function extractDriveFileId_(url) {
  var match = String(url).match(/\/d\/([^\/]+)/);
  return match ? match[1] : null;
}

function getBlobsFromDriveUrls_(urls) {
  // Kembalikan array persis 3 elemen (slot kosong = null) supaya cocok
  // dengan urutan {{FOTO_1}}/{{FOTO_2}}/{{FOTO_3}} di generateLaporanPdf.
  var blobs = [null, null, null];
  for (var i = 0; i < urls.length && i < 3; i++) {
    var fileId = extractDriveFileId_(urls[i]);
    if (fileId) blobs[i] = DriveApp.getFileById(fileId).getBlob();
  }
  return blobs;
}

function regenerateDanSimpanPdf_(sheet, rowIndex, session, rowValues) {
  // rowValues = baris Aktivitas apa adanya dari getValues() (0-indexed array kolom)
  var pdfUrl = generateLaporanPdf(session, {
    tanggal: rowValues[2],
    jamMulai: rowValues[3],
    jamSelesai: rowValues[4],
    durasiMenit: rowValues[5],
    namaAktivitas: rowValues[6],
    uraian: String(rowValues[7]).split('\n'),
    fotoBlobs: getBlobsFromDriveUrls_(String(rowValues[8]).split('|').filter(Boolean))
  });
  sheet.getRange(rowIndex, 10).setValue(pdfUrl); // kolom Link PDF
  return pdfUrl;
}

function getAktivitasById(token, idLaporan) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }
  var sheet = getAktivitasSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idLaporan) {
      if (rows[i][1] !== session.nip) {
        return { success: false, message: 'Tidak berhak melihat laporan ini.' };
      }
      return { success: true, data: rowToLaporan_(rows[i]) };
    }
  }
  return { success: false, message: 'Laporan tidak ditemukan.' };
}

function saveAktivitas(token, data) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  if (!isValidTimeRange(data.jamMulai, data.jamSelesai)) {
    return { success: false, message: 'Jam selesai harus lebih besar dari jam mulai.' };
  }
  if (!data.uraian || data.uraian.length === 0) {
    return { success: false, message: 'Uraian aktivitas minimal 1 poin.' };
  }
  if (data.fotoBase64 && data.fotoBase64.length > 3) {
    return { success: false, message: 'Maksimal 3 foto.' };
  }

  var sheet = getAktivitasSheet_();
  var durasi = calculateDurationMinutes(data.jamMulai, data.jamSelesai);
  var now = new Date();
  var isEdit = !!data.idLaporan;

  var rows = sheet.getDataRange().getValues();
  var existingRow = null;
  var rowIndex = -1;
  if (isEdit) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.idLaporan) {
        if (rows[i][1] !== session.nip) {
          return { success: false, message: 'Tidak berhak mengubah laporan ini.' };
        }
        existingRow = rows[i];
        rowIndex = i + 1; // 1-indexed di Sheets
        break;
      }
    }
    if (!existingRow) {
      return { success: false, message: 'Laporan tidak ditemukan.' };
    }
  }

  // Foto wajib diisi saat membuat laporan baru. Saat edit, foto boleh
  // dikosongkan di form — artinya pegawai mempertahankan foto yang sudah
  // ada, bukan wajib unggah ulang tiap kali mengedit uraian/jam.
  if (!isEdit && (!data.fotoBase64 || data.fotoBase64.length === 0)) {
    return { success: false, message: 'Foto minimal 1, maksimal 3.' };
  }

  var linkFotoUrls;
  if (data.fotoBase64 && data.fotoBase64.length > 0) {
    linkFotoUrls = saveFotoKeDrive_(session.nip, data.tanggal, data.fotoBase64).urls;
  } else {
    linkFotoUrls = String(existingRow[8]).split('|').filter(Boolean);
  }

  var pdfUrl = generateLaporanPdf(session, {
    tanggal: data.tanggal,
    jamMulai: data.jamMulai,
    jamSelesai: data.jamSelesai,
    durasiMenit: durasi,
    namaAktivitas: data.namaAktivitas,
    uraian: data.uraian,
    fotoBlobs: getBlobsFromDriveUrls_(linkFotoUrls)
  });

  if (isEdit) {
    sheet.getRange(rowIndex, 3, 1, 12).setValues([[
      data.tanggal, data.jamMulai, data.jamSelesai, durasi, data.namaAktivitas,
      data.uraian.join('\n'), linkFotoUrls.join('|'), pdfUrl,
      existingRow[10], // status tidak berubah lewat edit biasa (dipisah dari finalizeAktivitas)
      existingRow[11], now, existingRow[13]
    ]]);
    return { success: true, idLaporan: data.idLaporan, linkPdf: pdfUrl };
  }

  var idBaru = Utilities.getUuid();
  sheet.appendRow([
    idBaru, session.nip, data.tanggal, data.jamMulai, data.jamSelesai, durasi,
    data.namaAktivitas, data.uraian.join('\n'), linkFotoUrls.join('|'), pdfUrl,
    'Draft', now, now, ''
  ]);
  return { success: true, idLaporan: idBaru, linkPdf: pdfUrl };
}

function finalizeAktivitas(token, idLaporan) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheet = getAktivitasSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idLaporan) {
      if (rows[i][1] !== session.nip) {
        return { success: false, message: 'Tidak berhak mengubah laporan ini.' };
      }
      var rowIndex = i + 1;
      // Spec §10: PDF digenerate ulang di setiap penyimpanan, termasuk saat
      // finalisasi (bukan hanya saat dibuat/diedit) — pakai data baris saat ini.
      regenerateDanSimpanPdf_(sheet, rowIndex, session, rows[i]);
      sheet.getRange(rowIndex, 11).setValue('Final'); // kolom Status
      sheet.getRange(rowIndex, 14).setValue(new Date()); // kolom Waktu Finalisasi
      return { success: true };
    }
  }
  return { success: false, message: 'Laporan tidak ditemukan.' };
}

function deleteAktivitas(token, idLaporan) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheet = getAktivitasSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idLaporan) {
      if (rows[i][1] !== session.nip) {
        return { success: false, message: 'Tidak berhak menghapus laporan ini.' };
      }
      if (rows[i][10] === 'Final') {
        return { success: false, message: 'Laporan yang sudah difinalisasi tidak bisa dihapus.' };
      }
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Laporan tidak ditemukan.' };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/backend/Aktivitas.js
git commit -m "feat: add laporan aktivitas CRUD with draft/final status enforcement"
```

---

### Task 7: Routing & Shell Frontend

**Files:**
- Create: `src/backend/Code.js`
- Create: `src/frontend/Shared.html`

**Interfaces:**
- Consumes: tidak ada dari task lain (murni routing).
- Produces: `doGet(e)` — entry point Web App, dipakai Google saat halaman diakses. Template `Shared.html` (header, style dasar dari `design.md`, helper JS sesi) di-include di semua halaman Task 8-10 lewat `<?!= include('Shared'); ?>`.

- [ ] **Step 1: Implementasi `src/backend/Code.js`**

```js
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  var page = (e.parameter.page || 'home');
  var pageMap = {
    'home': 'Home',
    'login': 'Login',
    'aktivitas': 'Aktivitas',
    'aktivitas/tambah': 'TambahAktivitas'
  };
  var file = pageMap[page] || 'Home';
  return HtmlService.createTemplateFromFile(file)
    .evaluate()
    .setTitle('SiRajin Morowali')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

- [ ] **Step 2: Tulis `src/frontend/Shared.html`** (style dasar mengikuti `design.md`, dishare semua halaman)

```html
<style>
  :root {
    --blue-600: #2383E2;
    --blue-700: #1B6FC2;
    --blue-100: #E8F2FC;
    --ink-900: #37352F;
    --ink-600: #6B6963;
    --paper: #FFFFFF;
    --surface: #F7F6F4;
    --border: #E3E2E0;
    --success: #2F9E5B;
    --danger: #F64932;
    --warning: #FFB110;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: var(--paper);
    color: var(--ink-900);
    margin: 0;
    padding: 16px;
    font-size: 16px;
  }
  h1 { font-size: 24px; font-weight: 700; margin: 0 0 16px; }
  .btn-primary {
    background: var(--blue-600);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 600;
    width: 100%;
    min-height: 44px;
    cursor: pointer;
  }
  .btn-primary:hover { background: var(--blue-700); }
  .btn-primary:disabled { background: var(--border); color: var(--ink-600); cursor: not-allowed; }
  .btn-ghost {
    background: transparent;
    color: var(--ink-900);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 16px;
    width: 100%;
    min-height: 44px;
    cursor: pointer;
  }
  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-600); margin-bottom: 6px; }
  .field input, .field select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 16px;
    min-height: 44px;
  }
  .card {
    background: var(--paper);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .badge-draft { background: var(--surface); color: var(--ink-600); }
  .badge-final { background: #E7F5EC; color: var(--success); }
  .badge-error { background: #FDEBE9; color: var(--danger); }
  .error-message { color: var(--danger); font-size: 14px; margin-top: 8px; }
  .loading { color: var(--ink-600); font-size: 14px; }
</style>
<script>
  function getToken() { return sessionStorage.getItem('sirajin_token'); }
  function setToken(t) { sessionStorage.setItem('sirajin_token', t); }
  function clearToken() { sessionStorage.removeItem('sirajin_token'); }
  function requireLogin() {
    if (!getToken()) { window.location.href = '?page=login'; }
  }
</script>
```

- [ ] **Step 3: Tulis `src/frontend/Home.html`** (landing sederhana)

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?></head>
  <body>
    <h1>SiRajin Morowali</h1>
    <p>Sistem Rekap Aktivitas Jurnal Instansi — DPMPTSP Kabupaten Morowali.</p>
    <a href="?page=login"><button class="btn-primary">Login Pegawai</button></a>
  </body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add src/backend/Code.js src/frontend/Shared.html src/frontend/Home.html
git commit -m "feat: add web app routing and shared frontend shell"
```

---

### Task 8: Halaman Login Pegawai

**Files:**
- Create: `src/frontend/Login.html`

**Interfaces:**
- Consumes: `loginPegawai(nip)` (Task 4) lewat `google.script.run`.
- Produces: menyimpan token ke `sessionStorage` lewat `setToken()` (dari `Shared.html`), redirect ke `?page=aktivitas`.

- [ ] **Step 1: Implementasi `src/frontend/Login.html`**

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?></head>
  <body>
    <h1>Login Pegawai</h1>
    <div class="field">
      <label for="nip">NIP</label>
      <input type="text" id="nip" inputmode="numeric" placeholder="19920815 202421 1 005" autofocus>
    </div>
    <button class="btn-primary" id="btnLogin">Masuk</button>
    <p class="error-message" id="errorMsg" style="display:none;"></p>

    <script>
      document.getElementById('btnLogin').addEventListener('click', function () {
        var nip = document.getElementById('nip').value.trim();
        var btn = document.getElementById('btnLogin');
        var errorEl = document.getElementById('errorMsg');
        errorEl.style.display = 'none';

        if (!nip) {
          errorEl.textContent = 'NIP wajib diisi.';
          errorEl.style.display = 'block';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Memproses...';

        google.script.run
          .withSuccessHandler(function (result) {
            btn.disabled = false;
            btn.textContent = 'Masuk';
            if (result.success) {
              setToken(result.token);
              window.location.href = '?page=aktivitas';
            } else {
              errorEl.textContent = result.message;
              errorEl.style.display = 'block';
            }
          })
          .withFailureHandler(function (error) {
            btn.disabled = false;
            btn.textContent = 'Masuk';
            errorEl.textContent = 'Gagal terhubung ke server: ' + error.message + '. Coba lagi.';
            errorEl.style.display = 'block';
          })
          .loginPegawai(nip);
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2: Daftarkan route di `Code.js`**

Sudah terdaftar di `pageMap` sejak Task 7 (`'login': 'Login'`) — tidak ada perubahan tambahan.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/Login.html
git commit -m "feat: add pegawai login page"
```

---

### Task 9: Halaman Aktivitas Pegawai (list per tanggal)

**Files:**
- Create: `src/frontend/Aktivitas.html`

**Interfaces:**
- Consumes: `listAktivitasByDate(token, tanggal)`, `finalizeAktivitas(token, idLaporan)`, `deleteAktivitas(token, idLaporan)` (Task 6) lewat `google.script.run`.

- [ ] **Step 1: Implementasi `src/frontend/Aktivitas.html`**

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?></head>
  <body>
    <h1>Aktivitas Saya</h1>
    <div class="field">
      <label for="tanggal">Tanggal</label>
      <input type="date" id="tanggal">
    </div>
    <div id="daftarLaporan"><p class="loading">Memuat...</p></div>
    <a href="?page=aktivitas/tambah"><button class="btn-primary">+ Tambah Aktivitas</button></a>

    <script>
      requireLogin();

      function formatBadge(status) {
        if (status === 'Final') return '<span class="badge badge-final">Tersimpan</span>';
        return '<span class="badge badge-draft">Draft</span>';
      }

      function renderLaporan(list) {
        var container = document.getElementById('daftarLaporan');
        if (list.length === 0) {
          container.innerHTML = '<p class="loading">Belum ada laporan untuk tanggal ini.</p>';
          return;
        }
        container.innerHTML = list.map(function (l) {
          return '<div class="card">' +
            '<strong>' + l.jamMulai + ' - ' + l.jamSelesai + '</strong> ' + formatBadge(l.status) +
            '<p>' + l.namaAktivitas + '</p>' +
            '<a href="' + l.linkPdf + '" target="_blank">Unduh PDF</a>' +
            ' | <a href="?page=aktivitas/tambah&id=' + l.idLaporan + '">Edit</a>' +
            (l.status === 'Draft' ? ' | <a href="#" onclick="hapusLaporan(\'' + l.idLaporan + '\'); return false;">Hapus</a> | <a href="#" onclick="finalisasiLaporan(\'' + l.idLaporan + '\'); return false;">Finalisasi</a>' : '') +
            '</div>';
        }).join('');
      }

      function muatLaporan() {
        var tanggal = document.getElementById('tanggal').value;
        document.getElementById('daftarLaporan').innerHTML = '<p class="loading">Memuat...</p>';
        google.script.run
          .withSuccessHandler(function (result) {
            if (result.success) {
              renderLaporan(result.data);
            } else {
              document.getElementById('daftarLaporan').innerHTML = '<p class="error-message">' + result.message + '</p>';
              if (result.message.indexOf('login ulang') > -1) { clearToken(); window.location.href = '?page=login'; }
            }
          })
          .withFailureHandler(function (error) {
            document.getElementById('daftarLaporan').innerHTML = '<p class="error-message">Gagal memuat: ' + error.message + '</p>';
          })
          .listAktivitasByDate(getToken(), tanggal);
      }

      function hapusLaporan(id) {
        if (!confirm('Yakin hapus laporan ini?')) return;
        google.script.run
          .withSuccessHandler(function (result) {
            if (result.success) { muatLaporan(); } else { alert(result.message); }
          })
          .withFailureHandler(function (error) { alert('Gagal: ' + error.message); })
          .deleteAktivitas(getToken(), id);
      }

      function finalisasiLaporan(id) {
        if (!confirm('Setelah difinalisasi, laporan tidak bisa dihapus. Lanjutkan?')) return;
        google.script.run
          .withSuccessHandler(function (result) {
            if (result.success) { muatLaporan(); } else { alert(result.message); }
          })
          .withFailureHandler(function (error) { alert('Gagal: ' + error.message); })
          .finalizeAktivitas(getToken(), id);
      }

      var today = new Date().toISOString().split('T')[0];
      document.getElementById('tanggal').value = today;
      document.getElementById('tanggal').addEventListener('change', muatLaporan);
      muatLaporan();
    </script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/frontend/Aktivitas.html
git commit -m "feat: add pegawai activity list page with date filter"
```

---

### Task 10: Halaman Tambah/Edit Aktivitas

**Files:**
- Create: `src/frontend/TambahAktivitas.html`

**Interfaces:**
- Consumes: `saveAktivitas(token, data)`, `getAktivitasById(token, idLaporan)` (Task 6) lewat `google.script.run`.

Halaman ini melayani dua mode lewat query string: `?page=aktivitas/tambah` (buat baru) dan `?page=aktivitas/tambah&id=xxx` (edit — form terisi otomatis dari data lama, foto boleh dibiarkan kosong untuk mempertahankan foto lama).

- [ ] **Step 1: Implementasi `src/frontend/TambahAktivitas.html`**

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?></head>
  <body>
    <h1 id="judulHalaman">Tambah Aktivitas</h1>

    <div class="field">
      <label for="tanggal">Tanggal</label>
      <input type="date" id="tanggal">
    </div>
    <div class="field">
      <label for="jamMulai">Jam Mulai</label>
      <input type="time" id="jamMulai">
    </div>
    <div class="field">
      <label for="jamSelesai">Jam Selesai</label>
      <input type="time" id="jamSelesai">
    </div>
    <div class="field">
      <label for="namaAktivitas">Nama Aktivitas</label>
      <input type="text" id="namaAktivitas" placeholder="Mis. Monitoring Jaringan MPP">
    </div>
    <div class="field">
      <label>Uraian Aktivitas</label>
      <div id="daftarUraian"></div>
      <button type="button" class="btn-ghost" id="btnTambahPoin">+ Tambah Poin</button>
    </div>
    <div class="field">
      <label id="labelFoto">Foto Kegiatan (1-3 foto)</label>
      <p class="loading" id="fotoLamaInfo" style="display:none;">Laporan ini sudah punya foto. Kosongkan pilihan di bawah untuk mempertahankan foto lama, atau pilih foto baru untuk menggantinya.</p>
      <input type="file" id="foto1" accept="image/*" capture="environment">
      <input type="file" id="foto2" accept="image/*" capture="environment">
      <input type="file" id="foto3" accept="image/*" capture="environment">
    </div>

    <button class="btn-primary" id="btnSimpan">Simpan Laporan</button>
    <p class="error-message" id="errorMsg" style="display:none;"></p>

    <script>
      requireLogin();

      var idLaporan = new URLSearchParams(window.location.search).get('id');
      var isEditMode = !!idLaporan;

      var jumlahPoin = 0;
      function tambahPoinUraian(nilaiAwal) {
        jumlahPoin++;
        var div = document.createElement('div');
        div.className = 'field';
        div.innerHTML = '<input type="text" class="uraian-poin" placeholder="Poin uraian ke-' + jumlahPoin + '">';
        document.getElementById('daftarUraian').appendChild(div);
        if (nilaiAwal) div.querySelector('input').value = nilaiAwal;
      }
      document.getElementById('btnTambahPoin').addEventListener('click', function () { tambahPoinUraian(); });

      var today = new Date().toISOString().split('T')[0];

      if (isEditMode) {
        document.getElementById('judulHalaman').textContent = 'Edit Aktivitas';
        document.getElementById('labelFoto').textContent = 'Foto Kegiatan (opsional saat edit)';
        document.getElementById('fotoLamaInfo').style.display = 'block';
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result.success) {
              document.getElementById('errorMsg').textContent = result.message;
              document.getElementById('errorMsg').style.display = 'block';
              return;
            }
            var l = result.data;
            document.getElementById('tanggal').value = l.tanggal;
            document.getElementById('jamMulai').value = l.jamMulai;
            document.getElementById('jamSelesai').value = l.jamSelesai;
            document.getElementById('namaAktivitas').value = l.namaAktivitas;
            l.uraian.forEach(function (poin) { tambahPoinUraian(poin); });
          })
          .withFailureHandler(function (error) {
            document.getElementById('errorMsg').textContent = 'Gagal memuat data: ' + error.message;
            document.getElementById('errorMsg').style.display = 'block';
          })
          .getAktivitasById(getToken(), idLaporan);
      } else {
        document.getElementById('tanggal').value = today;
        tambahPoinUraian(); // minimal 1 poin saat halaman dibuka mode "tambah baru"
      }

      function kompresGambar(file, callback) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var img = new Image();
          img.onload = function () {
            var maxDim = 1600;
            var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            var canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }

      function ambilFotoBase64(callback) {
        var fileInputs = [document.getElementById('foto1'), document.getElementById('foto2'), document.getElementById('foto3')];
        // Slot terindeks (bukan push saat selesai) — kompresi tiap foto
        // berjalan async dan bisa selesai di luar urutan, padahal urutan
        // array ini menentukan foto masuk {{FOTO_1}}/{{FOTO_2}}/{{FOTO_3}} yang mana.
        var hasil = [null, null, null];
        var selesai = 0;
        var totalFile = fileInputs.filter(function (el) { return el.files.length > 0; }).length;

        if (totalFile === 0) { callback([]); return; }

        fileInputs.forEach(function (el, idx) {
          if (el.files.length === 0) return;
          kompresGambar(el.files[0], function (base64) {
            hasil[idx] = base64;
            selesai++;
            if (selesai === totalFile) callback(hasil.filter(Boolean));
          });
        });
      }

      document.getElementById('btnSimpan').addEventListener('click', function () {
        var errorEl = document.getElementById('errorMsg');
        errorEl.style.display = 'none';

        var tanggal = document.getElementById('tanggal').value;
        var jamMulai = document.getElementById('jamMulai').value;
        var jamSelesai = document.getElementById('jamSelesai').value;
        var namaAktivitas = document.getElementById('namaAktivitas').value.trim();
        var uraian = Array.prototype.slice.call(document.querySelectorAll('.uraian-poin'))
          .map(function (el) { return el.value.trim(); })
          .filter(Boolean);

        if (!tanggal || !jamMulai || !jamSelesai || !namaAktivitas || uraian.length === 0) {
          errorEl.textContent = 'Semua field wajib diisi, minimal 1 poin uraian.';
          errorEl.style.display = 'block';
          return;
        }
        if (jamSelesai <= jamMulai) {
          errorEl.textContent = 'Jam selesai harus lebih besar dari jam mulai.';
          errorEl.style.display = 'block';
          return;
        }

        var btn = document.getElementById('btnSimpan');
        btn.disabled = true;
        btn.textContent = 'Menyusun laporan...';

        ambilFotoBase64(function (fotoBase64) {
          if (!isEditMode && fotoBase64.length === 0) {
            btn.disabled = false;
            btn.textContent = 'Simpan Laporan';
            errorEl.textContent = 'Minimal 1 foto kegiatan wajib diunggah.';
            errorEl.style.display = 'block';
            return;
          }

          google.script.run
            .withSuccessHandler(function (result) {
              btn.disabled = false;
              btn.textContent = 'Simpan Laporan';
              if (result.success) {
                window.location.href = '?page=aktivitas';
              } else {
                errorEl.textContent = result.message;
                errorEl.style.display = 'block';
                if (result.message.indexOf('login ulang') > -1) { clearToken(); window.location.href = '?page=login'; }
              }
            })
            .withFailureHandler(function (error) {
              btn.disabled = false;
              btn.textContent = 'Coba Lagi';
              errorEl.textContent = 'Gagal menyimpan: ' + error.message + '. Data belum hilang, klik Coba Lagi.';
              errorEl.style.display = 'block';
            })
            .saveAktivitas(getToken(), {
              idLaporan: isEditMode ? idLaporan : null,
              tanggal: tanggal,
              jamMulai: jamMulai,
              jamSelesai: jamSelesai,
              namaAktivitas: namaAktivitas,
              uraian: uraian,
              fotoBase64: fotoBase64
            });
        });
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/frontend/TambahAktivitas.html
git commit -m "feat: add tambah aktivitas form with photo compression"
```

---

### Task 11: Deploy & Verifikasi End-to-End Manual

**Files:** tidak ada file kode baru — task ini murni verifikasi.

- [ ] **Step 1: 🔴 MANUAL (kamu sendiri) — push kode terbaru & deploy**

```bash
clasp push
clasp deploy --description "v1 - alur pegawai"
```

Catat URL Web App yang muncul (`clasp deployments` kalau perlu lihat lagi).

- [ ] **Step 2: 🔴 MANUAL (kamu sendiri) — seed data pegawai uji coba**

Buka spreadsheet `SiRajin - Database` (URL dari log Task 3), sheet `Pegawai`, tambahkan 1 baris data dirimu sendiri sebagai pegawai uji coba (Status = `Aktif`).

- [ ] **Step 3: 🔴 MANUAL (kamu sendiri) — jalankan checklist berikut di browser (HP & desktop)**

Buka URL Web App dari Step 1, lalu:

- [ ] Login dengan NIP terdaftar → masuk ke halaman Aktivitas
- [ ] Login dengan NIP yang tidak terdaftar → muncul pesan "NIP tidak ditemukan"
- [ ] Tambah laporan dengan 1 foto → muncul di daftar dengan badge Draft, link PDF bisa dibuka & terlihat identik dengan `template/laporan_kinerja_harian_v4.pdf`
- [ ] Tambah laporan dengan 3 foto → ketiga foto tampil di posisi slot yang benar di PDF
- [ ] Isi jam selesai lebih awal dari jam mulai → ditolak dengan pesan jelas, tidak submit ke server
- [ ] Hapus laporan berstatus Draft → berhasil hilang dari daftar
- [ ] Finalisasi laporan → badge berubah jadi Tersimpan (hijau), tombol Hapus hilang, link PDF tetap bisa dibuka (ter-generate ulang)
- [ ] Coba akses `deleteAktivitas` untuk laporan Final langsung lewat console browser (`google.script.run.deleteAktivitas(token, idLaporanFinal)`) — harus ditolak backend meski tombol UI sudah hilang
- [ ] Klik Edit pada laporan Draft, ubah nama aktivitas tanpa pilih foto baru → tersimpan, foto lama tetap ada di PDF baru
- [ ] Klik Edit pada laporan Final, ubah uraian → tersimpan, status tetap Final, PDF ter-update sesuai uraian baru
- [ ] Klik Edit, ganti salah satu foto dengan foto baru → PDF hasil generate memakai foto baru, bukan foto lama
- [ ] Buka dari HP: layout 1 kolom, tombol full-width, input foto langsung membuka kamera
- [ ] Ganti tanggal di halaman Aktivitas ke hari sebelumnya (kosong) → tampil pesan "Belum ada laporan"
- [ ] Tutup tab, buka lagi Web App → diminta login ulang (sessionStorage kosong, sesuai desain)

- [ ] **Step 4: Catat hasil checklist**

Kalau ada langkah yang gagal, catat sebagai temuan sebelum Plan 2 (Modul Admin) dimulai — jangan lanjut ke Plan 2 dengan bug alur pegawai yang belum beres.
