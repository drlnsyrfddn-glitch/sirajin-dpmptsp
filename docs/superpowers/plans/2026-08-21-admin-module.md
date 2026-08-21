# SiRajin Admin Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin-facing half of SiRajin: NIP+password login, a compliance monitoring dashboard, CRUD for pegawai accounts, a read-only archive of all laporan, and CRUD for admin accounts (SuperAdmin only) — completing the system per spec §5/§9/§12.

**Architecture:** Same Google Apps Script Web App as Plan 1 — new routes added to the existing `doGet` router, new backend service files following the existing `AktivitasService.js` pattern (auth-gate first, plain `{success, ...}` returns), new frontend pages sharing a new `AdminShared.html` layer that itself wraps the existing `Shared.html`.

**Tech Stack:** Same as Plan 1 — Google Apps Script (V8), vanilla HTML/CSS/JS, Jest for pure-logic tests, Google Sheets as the datastore (already provisioned by Plan 1's `Setup.js`).

**Spec:** `docs/superpowers/specs/2026-08-21-sirajin-core-design.md` (§5 Pengguna & Peran, §9 Peta Halaman, §12 Dashboard Admin)

**Builds on:** Plan 1 (`docs/superpowers/plans/2026-08-21-core-pegawai-flow.md`), already merged to `master`. `src/Auth.js`'s `loginAdmin(nip, password)` and `validateToken(token)` already exist and already produce an admin session shaped `{role:'admin', nip, nama, level}` — reused as-is, not rebuilt.

## Global Constraints

- Admin login is NIP+password (already implemented in Plan 1's `Auth.js` — this plan only builds the frontend page and the new backend services that consume the existing session).
- Every new backend function gates on `requireAdmin_(token)` (Task 1's new helper) first; functions restricted to `Kelola Admin` additionally require `session.level === 'SuperAdmin'`, checked explicitly with a distinct "Hanya SuperAdmin..." message (not folded into the generic auth-failure message, since a regular Admin's session IS valid — they're just not privileged enough, and telling them to "login ulang" would be actively misleading).
- Pegawai and Admin accounts are **soft-deleted only** — `setPegawaiStatus`/`setAdminStatus` toggle `Aktif`/`Nonaktif`, there is no hard-delete function anywhere in this plan. Hard-deleting a pegawai would orphan their historical laporan rows (foreign-keyed by NIP); hard-deleting an admin would break audit continuity.
- A SuperAdmin can never deactivate their own account (`setAdminStatus` must reject `Nonaktif` on the caller's own NIP) — prevents total lockout with no one left to re-activate anyone.
- `listAdmin` never returns the password hash to the frontend, under any circumstance.
- **Kelola Laporan is read-only browse + filter + open-PDF.** Per spec §12, admin cannot edit/delete laporan content. This plan does **not** implement a per-laporan "tandai bermasalah" flag — that capability was never precisely specified during brainstorming and a real one would need a new status value plus UI; for now, deactivating the pegawai's account (already in scope) is the available remedy for a problematic pegawai. Flag this to the product owner as a known deferred capability, not a bug.
- Palette/typography/mobile rules from `design.md` apply to admin pages too, except admin pages are desktop-first (per spec: tables scroll horizontally on narrow screens rather than reflowing to single-column cards).

---

## Catatan Penting Sebelum Mulai

Semua langkah di plan ini **bisa dikerjakan penuh oleh agent/engineer** tanpa langkah manual baru — Apps Script project, Spreadsheet, dan Drive folder sudah ada dari Plan 1. Satu-satunya hal yang perlu manusia: **Task 10 Step 2** (isi 1 baris akun SuperAdmin pertama langsung di Google Sheets, karena tanpa itu tidak ada cara login ke Kelola Admin sama sekali — sama seperti Plan 1 butuh 1 baris pegawai uji coba diisi manual).

---

### Task 1: Fondasi Admin — Auth Helper, Routing, Shell Bersama

**Files:**
- Modify: `src/Auth.js` (tambah `requireAdmin_`, `getMySession`)
- Modify: `src/Code.js` (tambah 5 route admin)
- Create: `src/AdminShared.html`

**Interfaces:**
- Produces: `requireAdmin_(token)` → session object atau `null` (dipakai `PegawaiService.js`, `DashboardService.js`, `AdminService.js`). `getMySession(token)` → `{success, session}` atau `{success:false, message}` (dipakai `AdminShared.html` buat render nav & nama admin). `renderAdminNav()` (JS, di dalam `AdminShared.html`) — dipanggil 1 baris oleh setiap halaman admin, inject topbar navigasi ke `<body>`.

- [ ] **Step 1: Tambahkan `requireAdmin_` dan `getMySession` ke `src/Auth.js`**

Tambahkan di akhir file, sebelum blok `if (typeof module !== 'undefined' ...)`:

```js
function requireAdmin_(token) {
  var session = validateToken(token);
  if (!session || session.role !== 'admin') return null;
  return session;
}

function getMySession(token) {
  var session = validateToken(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }
  return { success: true, session: session };
}
```

- [ ] **Step 2: Update `pageMap` di `src/Code.js`**

Ganti isi `pageMap` dari:

```js
  var pageMap = {
    'home': 'Home',
    'login': 'Login',
    'aktivitas': 'Aktivitas',
    'aktivitas/tambah': 'TambahAktivitas'
  };
```

menjadi:

```js
  var pageMap = {
    'home': 'Home',
    'login': 'Login',
    'aktivitas': 'Aktivitas',
    'aktivitas/tambah': 'TambahAktivitas',
    'admin-login': 'AdminLogin',
    'admin': 'AdminDashboard',
    'admin/pegawai': 'AdminPegawai',
    'admin/laporan': 'AdminLaporan',
    'admin/akun': 'AdminAkun'
  };
```

- [ ] **Step 3: Tulis `src/AdminShared.html`**

```html
<?!= include('Shared'); ?>
<style>
  .admin-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    margin: -16px -16px 24px -16px;
    background: var(--paper);
    flex-wrap: wrap;
    gap: 8px;
  }
  .admin-nav { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
  .admin-nav a { color: var(--ink-600); text-decoration: none; font-size: 14px; font-weight: 600; }
  .admin-nav a:hover { color: var(--blue-600); }
  .admin-nav-brand { font-weight: 700; color: var(--ink-900); font-size: 16px; }
  .admin-user { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--ink-600); }
  .admin-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .admin-table th, .admin-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 14px; }
  .admin-table th { background: var(--surface); text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; color: var(--ink-600); }
  .table-wrap { overflow-x: auto; }
  .stat-card { display: inline-block; min-width: 160px; padding: 20px; background: var(--paper); border: 1px solid var(--border); border-radius: 10px; margin-right: 12px; margin-bottom: 12px; }
  .stat-number { font-size: 32px; font-weight: 700; color: var(--ink-900); }
  .stat-label { font-size: 12px; color: var(--ink-600); text-transform: uppercase; }
</style>
<script>
  function requireAdminLogin() {
    if (!getToken()) { window.location.href = '?page=admin-login'; }
  }

  function renderAdminNav() {
    requireAdminLogin();

    var topbarHtml = '<div class="admin-topbar">' +
      '<div class="admin-nav"><span class="admin-nav-brand">SiRajin Admin</span>' +
      '<span id="adminNavLinks"></span></div>' +
      '<div class="admin-user"><span id="adminUserName"></span>' +
      '<a href="#" onclick="adminLogout(); return false;">Keluar</a></div></div>';
    document.body.insertAdjacentHTML('afterbegin', topbarHtml);

    google.script.run
      .withSuccessHandler(function (result) {
        if (!result.success) {
          if (!handleSessionExpiry(result.message)) { window.location.href = '?page=admin-login'; }
          return;
        }
        var session = result.session;
        var navLinks = '<a href="?page=admin">Dashboard</a>' +
          '<a href="?page=admin/pegawai">Kelola Pegawai</a>' +
          '<a href="?page=admin/laporan">Kelola Laporan</a>' +
          (session.level === 'SuperAdmin' ? '<a href="?page=admin/akun">Kelola Admin</a>' : '');
        document.getElementById('adminNavLinks').innerHTML = navLinks;
        document.getElementById('adminUserName').textContent = session.nama + ' (' + session.level + ')';
      })
      .withFailureHandler(function (error) {
        console.error('Gagal memuat sesi admin: ' + error.message);
      })
      .getMySession(getToken());
  }

  function adminLogout() {
    clearToken();
    window.location.href = '?page=admin-login';
  }
</script>
```

**Catatan:** `renderAdminNav()` menyuntikkan topbar ke `<body>` lewat JS (bukan HTML statis di `AdminShared.html`) supaya file ini aman di-include di `<head>` (tidak ada markup body yang nyasar ke head). Tiap halaman admin (Task 2, 4, 6, 7, 9) cukup panggil `renderAdminNav();` satu baris di awal script mereka.

- [ ] **Step 4: Commit**

```bash
git add src/Auth.js src/Code.js src/AdminShared.html
git commit -m "feat: add admin routing, session helper, and shared admin shell"
```

---

### Task 2: Halaman Login Admin

**Files:**
- Create: `src/AdminLogin.html`

**Interfaces:**
- Consumes: `loginAdmin(nip, password)` (sudah ada dari Plan 1) lewat `google.script.run`.

- [ ] **Step 1: Implementasi `src/AdminLogin.html`**

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?></head>
  <body>
    <h1>Login Admin</h1>
    <div class="field">
      <label for="nip">NIP</label>
      <input type="text" id="nip" inputmode="numeric" autofocus>
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input type="password" id="password">
    </div>
    <button class="btn-primary" id="btnLogin">Masuk</button>
    <p class="error-message" id="errorMsg" style="display:none;"></p>

    <script>
      document.getElementById('btnLogin').addEventListener('click', function () {
        var nip = document.getElementById('nip').value.trim();
        var password = document.getElementById('password').value;
        var btn = document.getElementById('btnLogin');
        var errorEl = document.getElementById('errorMsg');
        errorEl.style.display = 'none';

        if (!nip || !password) {
          errorEl.textContent = 'NIP dan password wajib diisi.';
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
              window.location.href = '?page=admin';
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
          .loginAdmin(nip, password);
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/AdminLogin.html
git commit -m "feat: add admin login page"
```

---

### Task 3: CRUD Pegawai (Backend)

**Files:**
- Create: `src/PegawaiService.js`

**Interfaces:**
- Consumes: `requireAdmin_` (Task 1), `isValidNIP` (Plan 1's `Utils.js`).
- Produces: `listPegawai(token)`, `savePegawai(token, data)` (buat baru jika `data.id` kosong, edit jika terisi), `setPegawaiStatus(token, id, status)` — dipakai `AdminPegawai.html` (Task 4).

Tidak ada unit test otomatis (bergantung `SpreadsheetApp`) — diverifikasi manual di Task 10.

- [ ] **Step 1: Implementasi `src/PegawaiService.js`**

```js
function getPegawaiSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  return ss.getSheetByName('Pegawai');
}

function listPegawai(token) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheet = getPegawaiSheet_();
  var rows = sheet.getDataRange().getValues();
  var hasil = [];
  for (var i = 1; i < rows.length; i++) {
    hasil.push({
      id: rows[i][0],
      nip: rows[i][1],
      namaLengkap: rows[i][2],
      jabatan: rows[i][3],
      unitKerja: rows[i][4],
      status: rows[i][5]
    });
  }
  return { success: true, data: hasil };
}

function savePegawai(token, data) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var nipBersih = String(data.nip).replace(/\s+/g, '');
  if (!isValidNIP(nipBersih)) {
    return { success: false, message: 'Format NIP tidak valid (harus 18 digit).' };
  }
  if (!data.namaLengkap || !data.jabatan || !data.unitKerja) {
    return { success: false, message: 'Nama, jabatan, dan unit kerja wajib diisi.' };
  }

  var sheet = getPegawaiSheet_();
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var rowNip = String(rows[i][1]).replace(/\s+/g, '');
    if (rowNip === nipBersih && rows[i][0] !== data.id) {
      return { success: false, message: 'NIP ini sudah terdaftar untuk pegawai lain.' };
    }
  }

  if (data.id) {
    for (var j = 1; j < rows.length; j++) {
      if (rows[j][0] === data.id) {
        sheet.getRange(j + 1, 2, 1, 4).setValues([[nipBersih, data.namaLengkap, data.jabatan, data.unitKerja]]);
        return { success: true, id: data.id };
      }
    }
    return { success: false, message: 'Pegawai tidak ditemukan.' };
  }

  var idBaru = Utilities.getUuid();
  sheet.appendRow([idBaru, nipBersih, data.namaLengkap, data.jabatan, data.unitKerja, 'Aktif']);
  return { success: true, id: idBaru };
}

function setPegawaiStatus(token, id, status) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }
  if (status !== 'Aktif' && status !== 'Nonaktif') {
    return { success: false, message: 'Status tidak valid.' };
  }

  var sheet = getPegawaiSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sheet.getRange(i + 1, 6).setValue(status);
      return { success: true };
    }
  }
  return { success: false, message: 'Pegawai tidak ditemukan.' };
}
```

**Catatan:** `Pegawai` sheet kolom B (`NIP`) sudah diformat teks polos (`'@'`) sejak Plan 1's `Setup.js` — `savePegawai`/`setPegawaiStatus` tidak perlu mengulang itu, cukup pastikan tidak menulis nilai yang membuat Sheets menebak ulang tipe (string biasa aman).

- [ ] **Step 2: Commit**

```bash
git add src/PegawaiService.js
git commit -m "feat: add pegawai CRUD service with soft-delete status toggle"
```

---

### Task 4: Halaman Kelola Pegawai

**Files:**
- Create: `src/AdminPegawai.html`

**Interfaces:**
- Consumes: `listPegawai(token)`, `savePegawai(token, data)`, `setPegawaiStatus(token, id, status)` (Task 3) lewat `google.script.run`.

- [ ] **Step 1: Implementasi `src/AdminPegawai.html`**

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('AdminShared'); ?></head>
  <body>
    <h1>Kelola Pegawai</h1>

    <button class="btn-primary" id="btnTambah" style="width:auto;">+ Tambah Pegawai</button>

    <div class="card" id="formPegawai" style="display:none; margin-top:16px;">
      <h3 id="formJudul">Tambah Pegawai</h3>
      <input type="hidden" id="pegawaiId">
      <div class="field"><label for="pNip">NIP</label><input type="text" id="pNip" inputmode="numeric"></div>
      <div class="field"><label for="pNama">Nama Lengkap</label><input type="text" id="pNama"></div>
      <div class="field"><label for="pJabatan">Jabatan</label><input type="text" id="pJabatan"></div>
      <div class="field"><label for="pUnit">Unit Kerja</label><input type="text" id="pUnit"></div>
      <button class="btn-primary" id="btnSimpanPegawai" style="width:auto;">Simpan</button>
      <button class="btn-ghost" id="btnBatalPegawai" style="width:auto;">Batal</button>
      <p class="error-message" id="formError" style="display:none;"></p>
    </div>

    <div class="table-wrap">
      <table class="admin-table">
        <thead><tr><th>NIP</th><th>Nama</th><th>Jabatan</th><th>Unit Kerja</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody id="tabelPegawai"><tr><td colspan="6" class="loading">Memuat...</td></tr></tbody>
      </table>
    </div>

    <script>
      renderAdminNav();

      var daftarPegawai = [];

      function muatPegawai() {
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result.success) {
              if (!handleSessionExpiry(result.message)) { alert(result.message); }
              return;
            }
            daftarPegawai = result.data;
            renderTabel();
          })
          .withFailureHandler(function (error) { alert('Gagal memuat: ' + error.message); })
          .listPegawai(getToken());
      }

      function renderTabel() {
        var tbody = document.getElementById('tabelPegawai');
        if (daftarPegawai.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="loading">Belum ada pegawai.</td></tr>';
          return;
        }
        tbody.innerHTML = daftarPegawai.map(function (p) {
          var badge = p.status === 'Aktif' ? '<span class="badge badge-final">Aktif</span>' : '<span class="badge badge-error">Nonaktif</span>';
          var aksiToggle = p.status === 'Aktif'
            ? '<a href="#" onclick="toggleStatus(\'' + p.id + '\', \'Nonaktif\'); return false;">Nonaktifkan</a>'
            : '<a href="#" onclick="toggleStatus(\'' + p.id + '\', \'Aktif\'); return false;">Aktifkan</a>';
          return '<tr><td>' + p.nip + '</td><td>' + p.namaLengkap + '</td><td>' + p.jabatan + '</td><td>' + p.unitKerja + '</td>' +
            '<td>' + badge + '</td>' +
            '<td><a href="#" onclick="editPegawai(\'' + p.id + '\'); return false;">Edit</a> | ' + aksiToggle + '</td></tr>';
        }).join('');
      }

      function editPegawai(id) {
        var p = daftarPegawai.filter(function (x) { return x.id === id; })[0];
        if (!p) return;
        document.getElementById('formJudul').textContent = 'Edit Pegawai';
        document.getElementById('pegawaiId').value = p.id;
        document.getElementById('pNip').value = p.nip;
        document.getElementById('pNama').value = p.namaLengkap;
        document.getElementById('pJabatan').value = p.jabatan;
        document.getElementById('pUnit').value = p.unitKerja;
        document.getElementById('formPegawai').style.display = 'block';
      }

      function resetForm() {
        document.getElementById('formJudul').textContent = 'Tambah Pegawai';
        document.getElementById('pegawaiId').value = '';
        document.getElementById('pNip').value = '';
        document.getElementById('pNama').value = '';
        document.getElementById('pJabatan').value = '';
        document.getElementById('pUnit').value = '';
        document.getElementById('formError').style.display = 'none';
      }

      document.getElementById('btnTambah').addEventListener('click', function () {
        resetForm();
        document.getElementById('formPegawai').style.display = 'block';
      });

      document.getElementById('btnBatalPegawai').addEventListener('click', function () {
        document.getElementById('formPegawai').style.display = 'none';
      });

      document.getElementById('btnSimpanPegawai').addEventListener('click', function () {
        var errorEl = document.getElementById('formError');
        errorEl.style.display = 'none';

        var data = {
          id: document.getElementById('pegawaiId').value || null,
          nip: document.getElementById('pNip').value.trim(),
          namaLengkap: document.getElementById('pNama').value.trim(),
          jabatan: document.getElementById('pJabatan').value.trim(),
          unitKerja: document.getElementById('pUnit').value.trim()
        };

        if (!data.nip || !data.namaLengkap || !data.jabatan || !data.unitKerja) {
          errorEl.textContent = 'Semua field wajib diisi.';
          errorEl.style.display = 'block';
          return;
        }

        var btn = document.getElementById('btnSimpanPegawai');
        btn.disabled = true;

        google.script.run
          .withSuccessHandler(function (result) {
            btn.disabled = false;
            if (result.success) {
              document.getElementById('formPegawai').style.display = 'none';
              muatPegawai();
            } else {
              if (!handleSessionExpiry(result.message)) {
                errorEl.textContent = result.message;
                errorEl.style.display = 'block';
              }
            }
          })
          .withFailureHandler(function (error) {
            btn.disabled = false;
            errorEl.textContent = 'Gagal menyimpan: ' + error.message;
            errorEl.style.display = 'block';
          })
          .savePegawai(getToken(), data);
      });

      function toggleStatus(id, statusBaru) {
        if (!confirm('Yakin ubah status pegawai ini jadi "' + statusBaru + '"?')) return;
        google.script.run
          .withSuccessHandler(function (result) {
            if (result.success) { muatPegawai(); }
            else if (!handleSessionExpiry(result.message)) { alert(result.message); }
          })
          .withFailureHandler(function (error) { alert('Gagal: ' + error.message); })
          .setPegawaiStatus(getToken(), id, statusBaru);
      }

      muatPegawai();
    </script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/AdminPegawai.html
git commit -m "feat: add kelola pegawai admin page"
```

---

### Task 5: Dashboard & Arsip Laporan (Backend)

**Files:**
- Create: `src/DashboardService.js`

**Interfaces:**
- Consumes: `requireAdmin_` (Task 1).
- Produces: `getDashboardSummary(token, tanggal)`, `listLaporanArsip(token, filter)` (`filter = {nip, tanggalMulai, tanggalAkhir}`, semua field opsional) — dipakai `AdminDashboard.html` (Task 6) dan `AdminLaporan.html` (Task 7).

Tidak ada unit test otomatis (bergantung `SpreadsheetApp`) — diverifikasi manual di Task 10.

- [ ] **Step 1: Implementasi `src/DashboardService.js`**

```js
function getDashboardSheets_() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  return {
    pegawai: ss.getSheetByName('Pegawai'),
    aktivitas: ss.getSheetByName('Aktivitas')
  };
}

function buildNipNamaMap_(pegawaiRows) {
  var map = {};
  for (var i = 1; i < pegawaiRows.length; i++) {
    map[String(pegawaiRows[i][1]).replace(/\s+/g, '')] = pegawaiRows[i][2];
  }
  return map;
}

function getDashboardSummary(token, tanggal) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheets = getDashboardSheets_();
  var pegawaiRows = sheets.pegawai.getDataRange().getValues();
  var aktivitasRows = sheets.aktivitas.getDataRange().getValues();

  var pegawaiAktif = [];
  for (var i = 1; i < pegawaiRows.length; i++) {
    if (pegawaiRows[i][5] === 'Aktif') {
      pegawaiAktif.push({ nip: String(pegawaiRows[i][1]).replace(/\s+/g, ''), nama: pegawaiRows[i][2] });
    }
  }

  var sudahLaporSet = {};
  var jamPerNip = {};
  for (var j = 1; j < aktivitasRows.length; j++) {
    if (aktivitasRows[j][2] !== tanggal || aktivitasRows[j][10] !== 'Final') continue;
    var nip = String(aktivitasRows[j][1]).replace(/\s+/g, '');
    sudahLaporSet[nip] = true;
    jamPerNip[nip] = (jamPerNip[nip] || 0) + Number(aktivitasRows[j][5]);
  }

  var sudahLapor = 0;
  var belumLapor = [];
  var rekapJam = [];
  pegawaiAktif.forEach(function (p) {
    if (sudahLaporSet[p.nip]) {
      sudahLapor++;
      rekapJam.push({ nip: p.nip, nama: p.nama, totalMenit: jamPerNip[p.nip] || 0 });
    } else {
      belumLapor.push({ nip: p.nip, nama: p.nama });
    }
  });

  return {
    success: true,
    data: {
      tanggal: tanggal,
      totalPegawaiAktif: pegawaiAktif.length,
      sudahLapor: sudahLapor,
      belumLapor: belumLapor,
      rekapJam: rekapJam
    }
  };
}

function listLaporanArsip(token, filter) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }
  filter = filter || {};

  var sheets = getDashboardSheets_();
  var pegawaiRows = sheets.pegawai.getDataRange().getValues();
  var nipNamaMap = buildNipNamaMap_(pegawaiRows);
  var aktivitasRows = sheets.aktivitas.getDataRange().getValues();

  var filterNip = filter.nip ? String(filter.nip).replace(/\s+/g, '') : null;

  var hasil = [];
  for (var i = 1; i < aktivitasRows.length; i++) {
    var row = aktivitasRows[i];
    var nip = String(row[1]).replace(/\s+/g, '');
    var tanggal = row[2];

    if (filterNip && nip !== filterNip) continue;
    if (filter.tanggalMulai && tanggal < filter.tanggalMulai) continue;
    if (filter.tanggalAkhir && tanggal > filter.tanggalAkhir) continue;

    hasil.push({
      idLaporan: row[0],
      nip: nip,
      nama: nipNamaMap[nip] || '(pegawai tidak ditemukan)',
      tanggal: tanggal,
      jamMulai: row[3],
      jamSelesai: row[4],
      namaAktivitas: row[6],
      linkPdf: row[9],
      status: row[10]
    });
  }

  hasil.sort(function (a, b) {
    if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? 1 : -1;
    return a.jamMulai < b.jamMulai ? 1 : -1;
  });

  return { success: true, data: hasil };
}
```

**Catatan:** `listLaporanArsip` sengaja **tidak** menyertakan `uraian`/`linkFoto` di hasilnya — admin melihat metadata kepatuhan (jam, nama aktivitas, status, link PDF buat verifikasi) sesuai batasan spec §12 ("read-only terhadap status kepatuhan, bukan isi substansi laporan"), bukan uraian mentahnya. `linkPdf` tetap disertakan karena itu representasi resmi laporan, bukan draft substansi internal.

- [ ] **Step 2: Commit**

```bash
git add src/DashboardService.js
git commit -m "feat: add dashboard summary and read-only laporan archive service"
```

---

### Task 6: Halaman Dashboard Admin

**Files:**
- Create: `src/AdminDashboard.html`

**Interfaces:**
- Consumes: `getDashboardSummary(token, tanggal)` (Task 5) lewat `google.script.run`.

- [ ] **Step 1: Implementasi `src/AdminDashboard.html`**

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('AdminShared'); ?></head>
  <body>
    <h1>Dashboard Kepatuhan</h1>

    <div class="field" style="max-width:220px;">
      <label for="tanggal">Tanggal</label>
      <input type="date" id="tanggal">
    </div>

    <div id="ringkasan"><p class="loading">Memuat...</p></div>

    <h3>Belum Lapor</h3>
    <div id="belumLapor"><p class="loading">Memuat...</p></div>

    <h3>Rekap Jam Kerja (laporan Final)</h3>
    <div class="table-wrap">
      <table class="admin-table">
        <thead><tr><th>NIP</th><th>Nama</th><th>Total Jam</th></tr></thead>
        <tbody id="tabelJam"><tr><td colspan="3" class="loading">Memuat...</td></tr></tbody>
      </table>
    </div>

    <script>
      renderAdminNav();

      function formatMenitJam(menit) {
        var jam = Math.floor(menit / 60);
        var sisaMenit = menit % 60;
        return jam + ' Jam ' + sisaMenit + ' Menit';
      }

      function muatDashboard() {
        var tanggal = document.getElementById('tanggal').value;
        document.getElementById('ringkasan').innerHTML = '<p class="loading">Memuat...</p>';

        google.script.run
          .withSuccessHandler(function (result) {
            if (!result.success) {
              if (!handleSessionExpiry(result.message)) {
                document.getElementById('ringkasan').innerHTML = '<p class="error-message">' + result.message + '</p>';
              }
              return;
            }
            var d = result.data;

            document.getElementById('ringkasan').innerHTML =
              '<div class="stat-card"><div class="stat-number">' + d.totalPegawaiAktif + '</div><div class="stat-label">Pegawai Aktif</div></div>' +
              '<div class="stat-card"><div class="stat-number">' + d.sudahLapor + '</div><div class="stat-label">Sudah Lapor</div></div>' +
              '<div class="stat-card"><div class="stat-number">' + d.belumLapor.length + '</div><div class="stat-label">Belum Lapor</div></div>';

            document.getElementById('belumLapor').innerHTML = d.belumLapor.length === 0
              ? '<p class="loading">Semua pegawai aktif sudah lapor.</p>'
              : '<ul>' + d.belumLapor.map(function (p) { return '<li>' + p.nama + ' (' + p.nip + ')</li>'; }).join('') + '</ul>';

            document.getElementById('tabelJam').innerHTML = d.rekapJam.length === 0
              ? '<tr><td colspan="3" class="loading">Belum ada laporan Final untuk tanggal ini.</td></tr>'
              : d.rekapJam.map(function (r) {
                  return '<tr><td>' + r.nip + '</td><td>' + r.nama + '</td><td>' + formatMenitJam(r.totalMenit) + '</td></tr>';
                }).join('');
          })
          .withFailureHandler(function (error) {
            document.getElementById('ringkasan').innerHTML = '<p class="error-message">Gagal memuat: ' + error.message + '</p>';
          })
          .getDashboardSummary(getToken(), tanggal);
      }

      var today = new Date().toISOString().split('T')[0];
      document.getElementById('tanggal').value = today;
      document.getElementById('tanggal').addEventListener('change', muatDashboard);
      muatDashboard();
    </script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/AdminDashboard.html
git commit -m "feat: add admin compliance dashboard page"
```

---

### Task 7: Halaman Kelola Laporan (Arsip)

**Files:**
- Create: `src/AdminLaporan.html`

**Interfaces:**
- Consumes: `listLaporanArsip(token, filter)` (Task 5), `listPegawai(token)` (Task 3, buat populate dropdown filter) lewat `google.script.run`.

- [ ] **Step 1: Implementasi `src/AdminLaporan.html`**

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('AdminShared'); ?></head>
  <body>
    <h1>Kelola Laporan (Arsip)</h1>

    <div class="field" style="max-width:280px;">
      <label for="filterPegawai">Pegawai</label>
      <select id="filterPegawai"><option value="">Semua Pegawai</option></select>
    </div>
    <div class="field" style="max-width:220px; display:inline-block; margin-right:16px;">
      <label for="filterMulai">Dari Tanggal</label>
      <input type="date" id="filterMulai">
    </div>
    <div class="field" style="max-width:220px; display:inline-block;">
      <label for="filterAkhir">Sampai Tanggal</label>
      <input type="date" id="filterAkhir">
    </div>
    <button class="btn-primary" id="btnFilter" style="width:auto;">Terapkan Filter</button>

    <div class="table-wrap">
      <table class="admin-table">
        <thead><tr><th>Tanggal</th><th>Jam</th><th>NIP</th><th>Nama</th><th>Aktivitas</th><th>Status</th><th>PDF</th></tr></thead>
        <tbody id="tabelArsip"><tr><td colspan="7" class="loading">Memuat...</td></tr></tbody>
      </table>
    </div>

    <script>
      renderAdminNav();

      function muatDaftarPegawaiFilter() {
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result.success) { return; }
            var select = document.getElementById('filterPegawai');
            result.data.forEach(function (p) {
              var opt = document.createElement('option');
              opt.value = p.nip;
              opt.textContent = p.namaLengkap + ' (' + p.nip + ')';
              select.appendChild(opt);
            });
          })
          .withFailureHandler(function () {})
          .listPegawai(getToken());
      }

      function formatBadge(status) {
        return status === 'Final' ? '<span class="badge badge-final">Final</span>' : '<span class="badge badge-draft">Draft</span>';
      }

      function muatArsip() {
        var filter = {
          nip: document.getElementById('filterPegawai').value,
          tanggalMulai: document.getElementById('filterMulai').value,
          tanggalAkhir: document.getElementById('filterAkhir').value
        };
        document.getElementById('tabelArsip').innerHTML = '<tr><td colspan="7" class="loading">Memuat...</td></tr>';

        google.script.run
          .withSuccessHandler(function (result) {
            if (!result.success) {
              if (!handleSessionExpiry(result.message)) {
                document.getElementById('tabelArsip').innerHTML = '<tr><td colspan="7" class="error-message">' + result.message + '</td></tr>';
              }
              return;
            }
            if (result.data.length === 0) {
              document.getElementById('tabelArsip').innerHTML = '<tr><td colspan="7" class="loading">Tidak ada laporan yang cocok dengan filter.</td></tr>';
              return;
            }
            document.getElementById('tabelArsip').innerHTML = result.data.map(function (l) {
              return '<tr><td>' + l.tanggal + '</td><td>' + l.jamMulai + '-' + l.jamSelesai + '</td><td>' + l.nip + '</td><td>' + l.nama + '</td>' +
                '<td>' + l.namaAktivitas + '</td><td>' + formatBadge(l.status) + '</td>' +
                '<td>' + (l.linkPdf ? '<a href="' + l.linkPdf + '" target="_blank">Buka</a>' : '-') + '</td></tr>';
            }).join('');
          })
          .withFailureHandler(function (error) {
            document.getElementById('tabelArsip').innerHTML = '<tr><td colspan="7" class="error-message">Gagal memuat: ' + error.message + '</td></tr>';
          })
          .listLaporanArsip(getToken(), filter);
      }

      document.getElementById('btnFilter').addEventListener('click', muatArsip);
      muatDaftarPegawaiFilter();
      muatArsip();
    </script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/AdminLaporan.html
git commit -m "feat: add read-only laporan archive page with filters"
```

---

### Task 8: CRUD Akun Admin (Backend, SuperAdmin Saja)

**Files:**
- Create: `src/AdminService.js`

**Interfaces:**
- Consumes: `requireAdmin_` (Task 1), `isValidNIP` (Plan 1's `Utils.js`), `hashPassword` (Plan 1's `Auth.js`).
- Produces: `listAdmin(token)`, `saveAdmin(token, data)`, `setAdminStatus(token, id, status)` — dipakai `AdminAkun.html` (Task 9). Semua fungsi menolak akses kalau `session.level !== 'SuperAdmin'`, bukan cuma kalau sesi tidak valid.

Tidak ada unit test otomatis (bergantung `SpreadsheetApp`) — diverifikasi manual di Task 10.

- [ ] **Step 1: Implementasi `src/AdminService.js`**

```js
function getAdminSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  return ss.getSheetByName('Admin');
}

function requireSuperAdminResult_(token) {
  var session = requireAdmin_(token);
  if (!session) {
    return { session: null, error: { success: false, message: 'Sesi tidak valid, silakan login ulang.' } };
  }
  if (session.level !== 'SuperAdmin') {
    return { session: null, error: { success: false, message: 'Hanya SuperAdmin yang berhak mengakses ini.' } };
  }
  return { session: session, error: null };
}

function listAdmin(token) {
  var gate = requireSuperAdminResult_(token);
  if (gate.error) return gate.error;

  var sheet = getAdminSheet_();
  var rows = sheet.getDataRange().getValues();
  var hasil = [];
  for (var i = 1; i < rows.length; i++) {
    hasil.push({ id: rows[i][0], nip: rows[i][1], nama: rows[i][2], level: rows[i][4], status: rows[i][5] });
    // Kolom Password (index 3) sengaja tidak disertakan.
  }
  return { success: true, data: hasil };
}

function saveAdmin(token, data) {
  var gate = requireSuperAdminResult_(token);
  if (gate.error) return gate.error;

  var nipBersih = String(data.nip).replace(/\s+/g, '');
  if (!isValidNIP(nipBersih)) {
    return { success: false, message: 'Format NIP tidak valid (harus 18 digit).' };
  }
  if (!data.nama) {
    return { success: false, message: 'Nama wajib diisi.' };
  }
  if (data.level !== 'Admin' && data.level !== 'SuperAdmin') {
    return { success: false, message: 'Level tidak valid.' };
  }
  if (!data.id && !data.password) {
    return { success: false, message: 'Password wajib diisi untuk akun admin baru.' };
  }

  var sheet = getAdminSheet_();
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var rowNip = String(rows[i][1]).replace(/\s+/g, '');
    if (rowNip === nipBersih && rows[i][0] !== data.id) {
      return { success: false, message: 'NIP ini sudah terdaftar untuk admin lain.' };
    }
  }

  if (data.id) {
    for (var j = 1; j < rows.length; j++) {
      if (rows[j][0] === data.id) {
        var passwordHash = data.password ? hashPassword(data.password) : rows[j][3];
        sheet.getRange(j + 1, 2, 1, 4).setValues([[nipBersih, data.nama, passwordHash, data.level]]);
        return { success: true, id: data.id };
      }
    }
    return { success: false, message: 'Akun admin tidak ditemukan.' };
  }

  var idBaru = Utilities.getUuid();
  sheet.appendRow([idBaru, nipBersih, data.nama, hashPassword(data.password), data.level, 'Aktif']);
  return { success: true, id: idBaru };
}

function setAdminStatus(token, id, status) {
  var gate = requireSuperAdminResult_(token);
  if (gate.error) return gate.error;
  if (status !== 'Aktif' && status !== 'Nonaktif') {
    return { success: false, message: 'Status tidak valid.' };
  }

  var sheet = getAdminSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      var rowNip = String(rows[i][1]).replace(/\s+/g, '');
      if (status === 'Nonaktif' && rowNip === gate.session.nip) {
        return { success: false, message: 'Tidak bisa menonaktifkan akun sendiri.' };
      }
      sheet.getRange(i + 1, 6).setValue(status);
      return { success: true };
    }
  }
  return { success: false, message: 'Akun admin tidak ditemukan.' };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/AdminService.js
git commit -m "feat: add SuperAdmin-only admin account CRUD with self-lockout guard"
```

---

### Task 9: Halaman Kelola Admin (SuperAdmin Saja)

**Files:**
- Create: `src/AdminAkun.html`

**Interfaces:**
- Consumes: `listAdmin(token)`, `saveAdmin(token, data)`, `setAdminStatus(token, id, status)` (Task 8) lewat `google.script.run`.

Halaman ini tetap dapat diakses lewat URL oleh Admin biasa (bukan cuma SuperAdmin) — link navigasinya memang disembunyikan (Task 1's `renderAdminNav`), tapi keamanan sesungguhnya ada di backend Task 8 yang menolak level selain SuperAdmin. Halaman ini harus menampilkan pesan tolak yang jelas kalau backend menolak, bukan layar kosong membingungkan.

- [ ] **Step 1: Implementasi `src/AdminAkun.html`**

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('AdminShared'); ?></head>
  <body>
    <h1>Kelola Admin</h1>
    <p class="error-message" id="aksesError" style="display:none;"></p>

    <div id="kontenHalaman">
      <button class="btn-primary" id="btnTambah" style="width:auto;">+ Tambah Admin</button>

      <div class="card" id="formAdmin" style="display:none; margin-top:16px;">
        <h3 id="formJudul">Tambah Admin</h3>
        <input type="hidden" id="adminId">
        <div class="field"><label for="aNip">NIP</label><input type="text" id="aNip" inputmode="numeric"></div>
        <div class="field"><label for="aNama">Nama</label><input type="text" id="aNama"></div>
        <div class="field"><label for="aLevel">Level</label>
          <select id="aLevel"><option value="Admin">Admin</option><option value="SuperAdmin">SuperAdmin</option></select>
        </div>
        <div class="field"><label for="aPassword">Password (kosongkan kalau tidak ingin diubah saat edit)</label><input type="password" id="aPassword"></div>
        <button class="btn-primary" id="btnSimpanAdmin" style="width:auto;">Simpan</button>
        <button class="btn-ghost" id="btnBatalAdmin" style="width:auto;">Batal</button>
        <p class="error-message" id="formError" style="display:none;"></p>
      </div>

      <div class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>NIP</th><th>Nama</th><th>Level</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody id="tabelAdmin"><tr><td colspan="5" class="loading">Memuat...</td></tr></tbody>
        </table>
      </div>
    </div>

    <script>
      renderAdminNav();

      var daftarAdmin = [];

      function muatAdmin() {
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result.success) {
              if (handleSessionExpiry(result.message)) return;
              document.getElementById('kontenHalaman').style.display = 'none';
              var errEl = document.getElementById('aksesError');
              errEl.textContent = result.message;
              errEl.style.display = 'block';
              return;
            }
            daftarAdmin = result.data;
            renderTabel();
          })
          .withFailureHandler(function (error) { alert('Gagal memuat: ' + error.message); })
          .listAdmin(getToken());
      }

      function renderTabel() {
        var tbody = document.getElementById('tabelAdmin');
        if (daftarAdmin.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="loading">Belum ada admin.</td></tr>';
          return;
        }
        tbody.innerHTML = daftarAdmin.map(function (a) {
          var badge = a.status === 'Aktif' ? '<span class="badge badge-final">Aktif</span>' : '<span class="badge badge-error">Nonaktif</span>';
          var aksiToggle = a.status === 'Aktif'
            ? '<a href="#" onclick="toggleStatus(\'' + a.id + '\', \'Nonaktif\'); return false;">Nonaktifkan</a>'
            : '<a href="#" onclick="toggleStatus(\'' + a.id + '\', \'Aktif\'); return false;">Aktifkan</a>';
          return '<tr><td>' + a.nip + '</td><td>' + a.nama + '</td><td>' + a.level + '</td>' +
            '<td>' + badge + '</td>' +
            '<td><a href="#" onclick="editAdmin(\'' + a.id + '\'); return false;">Edit</a> | ' + aksiToggle + '</td></tr>';
        }).join('');
      }

      function editAdmin(id) {
        var a = daftarAdmin.filter(function (x) { return x.id === id; })[0];
        if (!a) return;
        document.getElementById('formJudul').textContent = 'Edit Admin';
        document.getElementById('adminId').value = a.id;
        document.getElementById('aNip').value = a.nip;
        document.getElementById('aNama').value = a.nama;
        document.getElementById('aLevel').value = a.level;
        document.getElementById('aPassword').value = '';
        document.getElementById('formAdmin').style.display = 'block';
      }

      function resetForm() {
        document.getElementById('formJudul').textContent = 'Tambah Admin';
        document.getElementById('adminId').value = '';
        document.getElementById('aNip').value = '';
        document.getElementById('aNama').value = '';
        document.getElementById('aLevel').value = 'Admin';
        document.getElementById('aPassword').value = '';
        document.getElementById('formError').style.display = 'none';
      }

      document.getElementById('btnTambah').addEventListener('click', function () {
        resetForm();
        document.getElementById('formAdmin').style.display = 'block';
      });

      document.getElementById('btnBatalAdmin').addEventListener('click', function () {
        document.getElementById('formAdmin').style.display = 'none';
      });

      document.getElementById('btnSimpanAdmin').addEventListener('click', function () {
        var errorEl = document.getElementById('formError');
        errorEl.style.display = 'none';

        var id = document.getElementById('adminId').value || null;
        var data = {
          id: id,
          nip: document.getElementById('aNip').value.trim(),
          nama: document.getElementById('aNama').value.trim(),
          level: document.getElementById('aLevel').value,
          password: document.getElementById('aPassword').value
        };

        if (!data.nip || !data.nama) {
          errorEl.textContent = 'NIP dan nama wajib diisi.';
          errorEl.style.display = 'block';
          return;
        }
        if (!id && !data.password) {
          errorEl.textContent = 'Password wajib diisi untuk admin baru.';
          errorEl.style.display = 'block';
          return;
        }

        var btn = document.getElementById('btnSimpanAdmin');
        btn.disabled = true;

        google.script.run
          .withSuccessHandler(function (result) {
            btn.disabled = false;
            if (result.success) {
              document.getElementById('formAdmin').style.display = 'none';
              muatAdmin();
            } else {
              if (!handleSessionExpiry(result.message)) {
                errorEl.textContent = result.message;
                errorEl.style.display = 'block';
              }
            }
          })
          .withFailureHandler(function (error) {
            btn.disabled = false;
            errorEl.textContent = 'Gagal menyimpan: ' + error.message;
            errorEl.style.display = 'block';
          })
          .saveAdmin(getToken(), data);
      });

      function toggleStatus(id, statusBaru) {
        if (!confirm('Yakin ubah status admin ini jadi "' + statusBaru + '"?')) return;
        google.script.run
          .withSuccessHandler(function (result) {
            if (result.success) { muatAdmin(); }
            else if (!handleSessionExpiry(result.message)) { alert(result.message); }
          })
          .withFailureHandler(function (error) { alert('Gagal: ' + error.message); })
          .setAdminStatus(getToken(), id, statusBaru);
      }

      muatAdmin();
    </script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/AdminAkun.html
git commit -m "feat: add kelola admin page with superadmin-only access message"
```

---

### Task 10: Deploy & Verifikasi End-to-End Manual

**Files:** tidak ada file kode baru — task ini murni verifikasi.

- [ ] **Step 1: 🔴 MANUAL (kamu sendiri) — push kode terbaru & deploy**

```bash
clasp push
clasp deploy --description "v2 - modul admin"
```

- [ ] **Step 2: 🔴 MANUAL (kamu sendiri) — seed akun SuperAdmin pertama**

Buka spreadsheet `SiRajin - Database`, sheet `Admin`, tambahkan 1 baris manual:
- `ID`: string bebas unik, mis. `admin-001`
- `NIP`: NIP kamu sendiri (18 digit)
- `Nama`: nama kamu
- `Password`: **hash SHA-256** dari password yang kamu mau pakai, BUKAN plaintext. Cara dapetin hash-nya: buka editor Apps Script, jalankan sekali di console:
  ```js
  Logger.log(hashPassword('password-pilihanmu'));
  ```
  Salin hasil log-nya (64 karakter hex) ke kolom Password.
- `Level`: `SuperAdmin`
- `Status`: `Aktif`

- [ ] **Step 3: 🔴 MANUAL (kamu sendiri) — jalankan checklist berikut di browser**

Buka URL Web App, lalu:

- [ ] Login admin dengan NIP+password yang di-seed → masuk ke Dashboard
- [ ] Login admin dengan password salah → pesan "NIP atau password salah", bukan pesan generik
- [ ] Dashboard menampilkan angka pegawai aktif/sudah lapor/belum lapor yang benar dibanding isi Sheets aktual
- [ ] Ganti tanggal dashboard ke hari sebelumnya → angka ikut berubah sesuai data hari itu
- [ ] Kelola Pegawai: tambah pegawai baru → langsung muncul di tabel, dan pegawai itu bisa login di halaman pegawai biasa
- [ ] Kelola Pegawai: edit data pegawai existing → tersimpan
- [ ] Kelola Pegawai: nonaktifkan pegawai → status berubah, dan pegawai itu gagal login di halaman pegawai biasa dengan pesan "Akun pegawai ini nonaktif"
- [ ] Kelola Pegawai: coba masukkan NIP yang sudah dipakai pegawai lain → ditolak dengan pesan jelas
- [ ] Kelola Laporan: filter berdasarkan 1 pegawai → hanya laporan pegawai itu yang tampil
- [ ] Kelola Laporan: filter rentang tanggal → hanya laporan dalam rentang itu yang tampil
- [ ] Kelola Laporan: klik link PDF salah satu laporan → PDF asli terbuka, bukan link rusak
- [ ] Kelola Admin: coba akses `?page=admin/akun` login sebagai Admin biasa (bukan SuperAdmin) → tampil pesan "Hanya SuperAdmin yang berhak mengakses ini", bukan layar kosong/error mentah
- [ ] Kelola Admin (login sebagai SuperAdmin): tambah admin baru dengan level `Admin` → berhasil, dan akun itu bisa login tapi tidak melihat menu "Kelola Admin" di nav
- [ ] Kelola Admin: coba nonaktifkan akun SuperAdmin yang sedang login sendiri → ditolak dengan pesan "Tidak bisa menonaktifkan akun sendiri"
- [ ] Kelola Admin: edit admin lain tanpa isi password baru → password lama tetap work buat login
- [ ] Nav admin: link "Kelola Admin" cuma muncul buat SuperAdmin, tersembunyi buat Admin biasa
- [ ] Buka salah satu halaman admin dari HP/layar sempit → tabel bisa di-scroll horizontal, tidak pecah/terpotong

- [ ] **Step 4: Catat hasil checklist**

Kalau ada langkah yang gagal, catat sebagai temuan dan perbaiki sebelum sistem dipakai 70 pegawai sungguhan.
