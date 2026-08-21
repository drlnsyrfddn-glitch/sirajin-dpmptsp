# Redesign UI/UX SiRajin Morowali Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign 5 UI surfaces of SiRajin Morowali (landing, login pegawai, tampilan pegawai, login admin, tampilan admin) into a hybrid modern-institusional visual system (Kabupaten Morowali identity + modern SaaS-grade polish), with zero changes to navigation/session JS or server-side `.js` files.

**Architecture:** All new design tokens, shared CSS components, and the base64-encoded Morowali crest live in `src/Shared.html` (loaded by every page via `<?!= include('Shared'); ?>`) and `src/AdminShared.html` (admin-only additions, itself includes `Shared.html`). Each page template then applies the shared classes to its own markup. No build step, no new files beyond what already exists — pure additive CSS/markup changes to existing `.html` files in `src/`.

**Tech Stack:** Google Apps Script `HtmlService` templates (plain HTML/CSS/JS, no framework), Google Fonts (Inter + Source Serif 4), `clasp` CLI for deploy, Jest for the existing (untouched) service-layer tests.

**Spec:** `docs/superpowers/specs/2026-08-22-ui-ux-redesign-design.md` — read this before starting; the plan below implements it section by section. Cross-references below (e.g. "§5.1") point into that file.

## Global Constraints

- **Zero edits to server-side files**: `Auth.js`, `AktivitasService.js`, `AdminService.js`, `DashboardService.js`, `PegawaiService.js`, `PdfGenerator.js`, `Utils.js`, `Setup.js`, `Code.js` must not change in this plan (spec §4 non-tujuan).
- **Zero new client-side navigation/state logic**: do not touch `redirectTop()`, `google.script.url.getLocation()`, the delegated `a[href^="?"]` click listener, `requireLogin()`, `requireAdminLogin()`, `handleSessionExpiry()`, or `renderAdminNav()`'s session-fetch logic — only their surrounding HTML/CSS may change (spec §8).
- **No build step / bundler / framework** — every change is plain HTML/CSS/JS pasted directly into the existing `.html` files (spec §10).
- **`badge-final` stays green (`--success`), never gold** — gold (`--gold-600`) is reserved for stat numbers, the pita-lambang stripe, and warnings only (spec §7).
- **Existing DOM ids/classes used by JS (`document.getElementById(...)`, `document.querySelectorAll(...)`) must not be renamed or removed** — only their CSS may change, so existing `google.script.run` wiring keeps working untouched.
- **`npm test` must stay at 16/16 passing** after every task (regression guard — no server file is touched, so this should never fail, but confirms nothing was accidentally broken).
- **Rollout is staged**: Task 3 is a hard checkpoint — do not start Task 4 until the product owner has approved the live `Login.html` redesign (spec §11).

---

## Task 1: Design tokens, shared components & crest logo in `Shared.html`

**Files:**
- Modify: `src/Shared.html` (whole `<style>` block and the `<script>` block's top section)
- Read: `morowali.png` (repo root — source image for the base64 logo constant)

**Interfaces:**
- Consumes: none (foundational task).
- Produces (for all later tasks to consume):
  - CSS custom properties: `--navy-900`, `--navy-700`, `--navy-600`, `--navy-100`, `--gold-600`, `--pita-green`, `--pita-red` (new); `--ink-900`, `--ink-600`, `--surface`, `--border`, `--danger`, `--warning` (existing names, new values); `--blue-600`/`--blue-700`/`--blue-100` (existing names, now aliased to the navy tokens so nothing else needs to change).
  - CSS classes: `.pita-lambang` (+ its 4 `span` children), `.split-shell`, `.split-brand`, `.split-form`, `.brand-name`, `.split-motto`, `.lambang-logo`, `.waktu-aktivitas`.
  - JS global: `SIRAJIN_LOGO_SRC` (string, a `data:image/png;base64,...` URI of `morowali.png`).
  - Reusable snippet (documented here, used verbatim in Tasks 2/4/5): place `<img class="lambang-logo" alt="Lambang Kabupaten Morowali"><script>document.currentScript.previousElementSibling.src = SIRAJIN_LOGO_SRC;</script>` anywhere a static-HTML page needs the crest to render (synchronous, no DOMContentLoaded race — the inline script runs the instant the parser reaches it, and `previousElementSibling` is always exactly that `<img>`).

- [ ] **Step 1: Replace the `:root` token block**

In `src/Shared.html`, replace:

```css
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
```

with:

```css
  :root {
    --navy-900: #163A6B;
    --navy-700: #1E4E8C;
    --navy-600: #2C6CB0;
    --navy-100: #EAF1FA;
    --blue-600: var(--navy-600);
    --blue-700: var(--navy-700);
    --blue-100: var(--navy-100);
    --gold-600: #C9971F;
    --pita-green: #2F7D4F;
    --pita-red: #B23A2E;
    --ink-900: #1E2A38;
    --ink-600: #5B6B7A;
    --paper: #FFFFFF;
    --surface: #F5F7FA;
    --border: #DFE4EA;
    --success: #2F9E5B;
    --danger: #D64545;
    --warning: var(--gold-600);
  }
```

(`--blue-*` are kept as aliases so every other file that already references `var(--blue-600)` etc. keeps working with zero edits — see spec §5.1.)

- [ ] **Step 2: Add Source Serif 4 to the font import**

Replace:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

with:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Update the `h1` rule to use the display face**

Replace:

```css
  h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; margin: 0 0 16px; }
```

with:

```css
  h1 { font-family: 'Source Serif 4', Georgia, serif; font-size: 32px; font-weight: 700; letter-spacing: -0.005em; line-height: 1.15; margin: 0 0 16px; }
```

- [ ] **Step 4: Append the new component CSS**

Add this block right before the closing `</style>` tag (after the existing `#sirajinToast { ... }` rule):

```css
  .pita-lambang { display: flex; height: 4px; width: 100%; }
  .pita-lambang span { flex: 1; }
  .pita-lambang span:nth-child(1) { background: var(--pita-green); }
  .pita-lambang span:nth-child(2) { background: var(--navy-600); }
  .pita-lambang span:nth-child(3) { background: var(--gold-600); }
  .pita-lambang span:nth-child(4) { background: var(--pita-red); }

  .lambang-logo { height: auto; }
  .split-brand .lambang-logo { width: 72px; margin-bottom: 12px; }

  .split-shell { min-height: 100vh; margin: -16px; display: flex; flex-direction: column; }
  .split-brand { background: var(--navy-900); color: #fff; text-align: center; padding: 32px 24px 24px; }
  .brand-name { color: #fff; font-family: 'Source Serif 4', Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: -0.005em; line-height: 1.15; margin: 0 0 4px; }
  .split-motto { font-size: 12px; color: rgba(255,255,255,0.75); letter-spacing: 0.04em; text-transform: uppercase; margin: 0; }
  .split-form { background: var(--paper); padding: 32px 24px; flex: 1; }
  @media (min-width: 768px) {
    .split-shell { flex-direction: row; }
    .split-brand { flex: 0 0 42%; display: flex; flex-direction: column; justify-content: center; padding: 48px; }
    .brand-name { font-size: 32px; }
    .split-form { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 48px; max-width: 440px; }
  }

  .waktu-aktivitas { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ink-900); }
```

- [ ] **Step 5: Add the `SIRAJIN_LOGO_SRC` marker line**

In the existing `<script>` block, right after this existing line:

```js
  var SIRAJIN_BASE_URL = '<?= ScriptApp.getService().getUrl() ?>';
```

add:

```js
  var SIRAJIN_LOGO_SRC = 'data:image/png;base64,LOGO_BASE64_MARKER';
```

- [ ] **Step 6: Generate the base64 crest and inject it, replacing the marker**

Run this PowerShell (from the repo root — `morowali.png` must exist there):

```powershell
$png = [IO.File]::ReadAllBytes("morowali.png")
$b64 = [Convert]::ToBase64String($png)
$path = "src\Shared.html"
$content = (Get-Content $path -Raw) -replace 'LOGO_BASE64_MARKER', $b64
[IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding $false))
Write-Output ("replaced, base64 length: " + $b64.Length)
```

Expected output: `replaced, base64 length: <some number greater than 50000>` (the 52,639-byte PNG becomes a base64 string roughly 4/3 that length).

- [ ] **Step 7: Verify the marker is gone and the tokens/classes are present**

Search `src/Shared.html` (Grep tool) for each of these patterns — every one must have at least one match:
- `--navy-900`
- `--gold-600`
- `\.pita-lambang`
- `\.split-shell`
- `data:image/png;base64,`

Search `src/Shared.html` for `LOGO_BASE64_MARKER` — expected: **zero** matches (confirms the replace in Step 6 worked and no marker text was left behind).

- [ ] **Step 8: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total` (unchanged — this task never touches a `.js` file).

- [ ] **Step 9: Commit**

```bash
git add src/Shared.html
git commit -m "feat: add institutional design tokens, split-panel/pita-lambang components, crest logo to Shared.html"
```

---

## Task 2: Redesign `Login.html` (checkpoint build)

**Files:**
- Modify: `src/Login.html`

**Interfaces:**
- Consumes: `.split-shell`, `.split-brand`, `.split-form`, `.pita-lambang`, `.brand-name`, `.split-motto`, `.lambang-logo`, `SIRAJIN_LOGO_SRC` (all from Task 1).
- Produces: the static-page crest-logo snippet pattern (`<img class="lambang-logo">` + inline `<script>` sibling) that Tasks 4 and 5 reuse verbatim.

- [ ] **Step 1: Replace the `<body>` markup**

Replace:

```html
  <body>
    <main>
    <h1>Login Pegawai</h1>
    <div class="field">
      <label for="nip">NIP</label>
      <input type="text" id="nip" inputmode="numeric" placeholder="19920815 202421 1 005" autofocus>
    </div>
    <button class="btn-primary" id="btnLogin">Masuk</button>
    <p class="error-message" id="errorMsg" style="display:none;"></p>

    </main>
```

with:

```html
  <body>
    <main class="split-shell">
      <section class="split-brand">
        <div class="pita-lambang"><span></span><span></span><span></span><span></span></div>
        <img class="lambang-logo" alt="Lambang Kabupaten Morowali">
        <script>document.currentScript.previousElementSibling.src = SIRAJIN_LOGO_SRC;</script>
        <p class="brand-name">SiRajin Morowali</p>
        <p class="split-motto">Tepe Asa Maroso</p>
      </section>
      <section class="split-form">
        <h1>Login Pegawai</h1>
        <div class="field">
          <label for="nip">NIP</label>
          <input type="text" id="nip" inputmode="numeric" placeholder="19920815 202421 1 005" autofocus>
        </div>
        <button class="btn-primary" id="btnLogin">Masuk</button>
        <p class="error-message" id="errorMsg" style="display:none;"></p>
      </section>
    </main>
```

Leave the existing `<script>...loginPegawai...</script>` block below it completely untouched — the `id="nip"`, `id="btnLogin"`, `id="errorMsg"` elements keep the same ids, so that script keeps working with zero changes.

- [ ] **Step 2: Verify the ids the login script depends on still exist**

Search `src/Login.html` (Grep tool) for `id="nip"`, `id="btnLogin"`, `id="errorMsg"` — all three must still be present exactly once each.

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/Login.html
git commit -m "feat: redesign Login.html with split-panel institutional layout"
```

---

## Task 3: CHECKPOINT — push & verify Login live, get approval

This is a hard gate (spec §11). Do not proceed to Task 4 until Step 5 below is explicitly confirmed by the product owner.

**Files:** none (deploy + manual verification only).

- [ ] **Step 1: Push to the live Apps Script project**

Run: `clasp push`
Expected: exits 0, lists `src/Shared.html` and `src/Login.html` among the pushed files.

- [ ] **Step 2: Find the current live deployment URL**

Run: `clasp deployments`
Expected: a list of deployments — use the most recent `@HEAD` or numbered deployment's web app URL (the URL is not hardcoded anywhere in the repo since it's replaced on redeploy, per the project's existing convention — see the `admin-module-task10-pending` memory).

- [ ] **Step 3: Verify the live page renders correctly**

Open `<deployment-url>?page=login` in a browser (or via Playwright):
- Desktop viewport (≥768px): navy panel with crest logo + "SiRajin Morowali" + "Tepe Asa Maroso" on the left, white login form on the right, 4-color pita-lambang stripe visible at the very top of the navy panel.
- Mobile viewport (<768px): navy panel stacks above the form (not side-by-side).
- No console errors (check devtools console).

- [ ] **Step 4: Regression-check the navigation class of bugs (Task 10 history)**

Type a valid pegawai NIP and submit. Confirm:
- The success path still redirects to `?page=aktivitas` (via `redirectTop()`) without landing on a blank page.
- If NIP is invalid, the inline error message still displays (not a blank/broken page).

This directly guards against the exact bug class fixed in commits `c665bd1`/`7b474b3` — a CSS-only change should never touch this, but it must be re-confirmed live since GAS's sandbox behavior can't be exercised by `npm test`.

- [ ] **Step 5: Get product owner approval — STOP HERE**

Show the live `Login.html` page to the product owner. Do **not** start Task 4 until they explicitly approve the visual direction. If they request changes, make them, re-push, and re-verify before asking again.

---

## Task 4: Redesign `Home.html`

**Files:**
- Modify: `src/Home.html`

**Interfaces:**
- Consumes: same classes as Task 2, plus the static-page crest-logo snippet pattern established in Task 2 Step 1.

- [ ] **Step 1: Replace the `<body>` markup**

Replace:

```html
  <body>
    <main>
      <h1>SiRajin Morowali</h1>
      <p>Sistem Rekap Aktivitas Jurnal Instansi — DPMPTSP Kabupaten Morowali.</p>
      <a href="?page=login"><button class="btn-primary">Login Pegawai</button></a>
    </main>
  </body>
```

with:

```html
  <body>
    <main class="split-shell">
      <section class="split-brand">
        <div class="pita-lambang"><span></span><span></span><span></span><span></span></div>
        <img class="lambang-logo" alt="Lambang Kabupaten Morowali">
        <script>document.currentScript.previousElementSibling.src = SIRAJIN_LOGO_SRC;</script>
        <p class="brand-name">SiRajin Morowali</p>
        <p class="split-motto">Tepe Asa Maroso</p>
      </section>
      <section class="split-form">
        <h1>Sistem Rekap Aktivitas Jurnal Instansi</h1>
        <p>Susun laporan bukti dukung kinerja harian DPMPTSP Kabupaten Morowali langsung dari HP atau desktop.</p>
        <a href="?page=login"><button class="btn-primary">Login Pegawai</button></a>
      </section>
    </main>
  </body>
```

- [ ] **Step 2: Verify the login link survived**

Search `src/Home.html` (Grep tool) for `href="?page=login"` — must still be present (this is what the delegated click listener in `Shared.html` intercepts).

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/Home.html
git commit -m "feat: redesign Home.html landing page with split-panel institutional layout"
```

---

## Task 5: Redesign `AdminLogin.html`

**Files:**
- Modify: `src/AdminLogin.html`

**Interfaces:**
- Consumes: same as Task 4.

- [ ] **Step 1: Replace the `<body>` markup**

Replace:

```html
  <body>
    <main>
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

    </main>
```

with:

```html
  <body>
    <main class="split-shell">
      <section class="split-brand">
        <div class="pita-lambang"><span></span><span></span><span></span><span></span></div>
        <img class="lambang-logo" alt="Lambang Kabupaten Morowali">
        <script>document.currentScript.previousElementSibling.src = SIRAJIN_LOGO_SRC;</script>
        <p class="brand-name">SiRajin Morowali</p>
        <p class="split-motto">Tepe Asa Maroso</p>
      </section>
      <section class="split-form">
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
      </section>
    </main>
```

Leave the existing `<script>...loginAdmin...</script>` block untouched.

- [ ] **Step 2: Verify the ids the admin login script depends on still exist**

Search `src/AdminLogin.html` (Grep tool) for `id="nip"`, `id="password"`, `id="btnLogin"`, `id="errorMsg"` — all four must still be present exactly once each.

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/AdminLogin.html
git commit -m "feat: redesign AdminLogin.html with split-panel institutional layout"
```

---

## Task 6: Redesign `AdminShared.html` (navy topbar + pita + gold stats)

**Files:**
- Modify: `src/AdminShared.html`

**Interfaces:**
- Consumes: `--navy-900`, `--gold-600`, `.pita-lambang`, `SIRAJIN_LOGO_SRC` (from Task 1).
- Produces: the visually-updated `.admin-topbar`/`.admin-nav`/`.stat-card` classes that Task 9's verification pass checks across the 4 admin content pages.

- [ ] **Step 1: Replace the admin CSS block**

Replace:

```css
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
  .admin-nav { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .admin-nav a {
    display: inline-flex; align-items: center; gap: 6px;
    color: var(--ink-600); text-decoration: none; font-size: 14px; font-weight: 600;
    padding: 6px 10px; border-radius: 6px;
    transition: color 150ms ease, background-color 150ms ease;
  }
  .admin-nav a svg { flex: none; }
  .admin-nav a:hover { color: var(--blue-600); background: var(--blue-100); }
  .admin-nav a.active { color: var(--blue-600); background: var(--blue-100); }
  .admin-nav-brand { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--ink-900); font-size: 16px; margin-right: 8px; }
  .admin-user { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--ink-600); }
  .admin-user a { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-600); text-decoration: none; font-weight: 600; }
  .admin-user a:hover { color: var(--danger); }
  .admin-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .admin-table th, .admin-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 14px; }
  .admin-table th { background: var(--surface); text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; color: var(--ink-600); }
  .table-wrap { overflow-x: auto; }
  .stat-card { display: inline-block; min-width: 160px; padding: 20px; background: var(--paper); border-radius: 10px; margin-right: 12px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(35,131,226,0.06), 0 4px 12px rgba(35,131,226,0.05); }
  .stat-number { font-size: 32px; font-weight: 700; color: var(--ink-900); }
  .stat-label { font-size: 12px; color: var(--ink-600); text-transform: uppercase; }
```

with:

```css
  .admin-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    margin: -16px -16px 0 -16px;
    background: var(--navy-900);
    color: #fff;
    flex-wrap: wrap;
    gap: 8px;
  }
  .admin-nav { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .admin-nav a {
    display: inline-flex; align-items: center; gap: 6px;
    color: rgba(255,255,255,0.75); text-decoration: none; font-size: 14px; font-weight: 600;
    padding: 6px 10px; border-radius: 6px;
    transition: color 150ms ease, background-color 150ms ease;
  }
  .admin-nav a svg { flex: none; }
  .admin-nav a:hover { color: #fff; background: rgba(255,255,255,0.12); }
  .admin-nav a.active { color: var(--gold-600); background: rgba(255,255,255,0.12); }
  .admin-nav-brand { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #fff; font-size: 16px; margin-right: 8px; }
  .admin-nav-brand .lambang-logo { width: 24px; }
  .admin-user { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(255,255,255,0.75); }
  .admin-user a { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.75); text-decoration: none; font-weight: 600; }
  .admin-user a:hover { color: #fff; }
  .admin-pita { margin: 0 -16px 24px -16px; width: auto; }
  .admin-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .admin-table th, .admin-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 14px; }
  .admin-table th { background: var(--surface); text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; color: var(--ink-600); }
  .table-wrap { overflow-x: auto; }
  .stat-card { display: inline-block; min-width: 160px; padding: 20px; background: var(--paper); border-radius: 10px; margin-right: 12px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(22,58,107,0.06), 0 4px 12px rgba(22,58,107,0.05); }
  .stat-number { font-size: 32px; font-weight: 700; color: var(--gold-600); }
  .stat-label { font-size: 12px; color: var(--ink-600); text-transform: uppercase; }
```

- [ ] **Step 2: Update `renderAdminNav()` to render the crest logo and the pita-lambang divider**

Replace:

```js
    var topbarHtml = '<header class="admin-topbar">' +
      '<div class="admin-nav-brand">' + ADMIN_NAV_ICONS.dashboard + ' SiRajin Admin</div>' +
      '<nav class="admin-nav" id="adminNavLinks"></nav>' +
      '<div class="admin-user"><span id="adminUserName"></span>' +
      '<a href="#" onclick="adminLogout(); return false;">' + ADMIN_NAV_ICONS.keluar + ' Keluar</a></div></header>';
    document.body.insertAdjacentHTML('afterbegin', topbarHtml);
```

with:

```js
    var topbarHtml = '<header class="admin-topbar">' +
      '<div class="admin-nav-brand"><img class="lambang-logo" src="' + SIRAJIN_LOGO_SRC + '" alt="Lambang Kabupaten Morowali"> SiRajin Admin</div>' +
      '<nav class="admin-nav" id="adminNavLinks"></nav>' +
      '<div class="admin-user"><span id="adminUserName"></span>' +
      '<a href="#" onclick="adminLogout(); return false;">' + ADMIN_NAV_ICONS.keluar + ' Keluar</a></div></header>' +
      '<div class="pita-lambang admin-pita"><span></span><span></span><span></span><span></span></div>';
    document.body.insertAdjacentHTML('afterbegin', topbarHtml);
```

(The crest is embedded directly via the `SIRAJIN_LOGO_SRC` JS variable here, rather than the `document.currentScript` snippet used in static pages, because this markup is built as a JS string and inserted at runtime — there is no static `<img>` tag for a sibling `<script>` to attach to.)

- [ ] **Step 3: Verify the topbar still calls the untouched session/nav logic**

Search `src/AdminShared.html` (Grep tool) for `getMySession`, `requireAdminLogin`, `ADMIN_NAV_ICONS.dashboard` (still used elsewhere for nav link icons, only the brand-row icon was replaced) — all must still be present, confirming Step 2 only changed the topbar's own HTML string, not the session-fetch/nav-link logic below it.

- [ ] **Step 4: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 5: Commit**

```bash
git add src/AdminShared.html
git commit -m "feat: redesign admin topbar to navy institutional style with crest logo and pita-lambang divider"
```

---

## Task 7: Redesign `Aktivitas.html` (pita divider + bold time display + compact H1)

**Files:**
- Modify: `src/Aktivitas.html`
- Modify: `src/Shared.html` (one small addition — see Step 1)

**Interfaces:**
- Consumes: `.pita-lambang`, `.waktu-aktivitas` (from Task 1).
- Produces: `h1.h1-compact` CSS rule in `src/Shared.html` (consumed by Task 8, which reuses the same class on `TambahAktivitas.html`'s H1).

**Context — post-checkpoint amendment:** during the Task 3 checkpoint review, the product owner flagged that the global `h1` rule (32px, added in Task 1) reads as oversized on the small, frequently-opened pegawai utility pages (`Aktivitas.html`, `TambahAktivitas.html` — opened multiple times a day, phone-first). Task 1 is already reviewed and committed, so rather than reopening it, this task adds one small additive CSS rule to `Shared.html` (a new class, nothing existing is changed) and this task is the first to consume it. See spec §5.2 "H1 hero vs H1 utility".

- [ ] **Step 1: Add the `h1.h1-compact` utility-heading override to `Shared.html`**

In `src/Shared.html`, append this rule right after the existing `.waktu-aktivitas` rule (added in Task 1), before `</style>`:

```css
  h1.h1-compact { font-size: 22px; line-height: 1.25; margin: 0 0 12px; }
```

(Inherits `font-family`/`font-weight`/`letter-spacing` from the base `h1` rule — this only overrides size/line-height/margin for utility-page headings.)

- [ ] **Step 2: Add the pita-lambang divider under the H1, and mark it compact**

In `src/Aktivitas.html`, replace:

```html
    <h1>Aktivitas Saya</h1>
    <div class="field">
```

with:

```html
    <h1 class="h1-compact">Aktivitas Saya</h1>
    <div class="pita-lambang" style="margin-bottom:16px;"><span></span><span></span><span></span><span></span></div>
    <div class="field">
```

- [ ] **Step 3: Make the time range bold/tabular in `renderLaporan()`**

Replace:

```js
        container.innerHTML = list.map(function (l) {
          return '<div class="card">' +
            '<strong>' + l.jamMulai + ' - ' + l.jamSelesai + '</strong> ' + formatBadge(l.status) +
```

with:

```js
        container.innerHTML = list.map(function (l) {
          return '<div class="card">' +
            '<span class="waktu-aktivitas">' + l.jamMulai + ' - ' + l.jamSelesai + '</span> ' + formatBadge(l.status) +
```

- [ ] **Step 4: Verify the CSS addition and the JS ids/functions the page depends on are untouched**

Search `src/Shared.html` (Grep tool) for `h1.h1-compact` — must be present (confirms Step 1).

Search `src/Aktivitas.html` (Grep tool) for `id="daftarLaporan"`, `id="tanggal"`, `requireLogin()`, `muatLaporan`, `hapusLaporan`, `finalisasiLaporan` — all must still be present exactly as before (only the markup block and the JS block from Steps 2-3 should differ from the original file).

- [ ] **Step 5: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 6: Commit**

```bash
git add src/Aktivitas.html src/Shared.html
git commit -m "feat: redesign Aktivitas.html with pita-lambang divider, bold time display, compact H1"
```

---

## Task 8: Redesign `TambahAktivitas.html` (pita divider + compact H1)

**Files:**
- Modify: `src/TambahAktivitas.html`

**Interfaces:**
- Consumes: `.pita-lambang` (from Task 1), `h1.h1-compact` (from Task 7).

- [ ] **Step 1: Add the pita-lambang divider under the (dynamic) H1, and mark it compact**

Replace:

```html
    <h1 id="judulHalaman">Tambah Aktivitas</h1>

    <div class="field">
```

with:

```html
    <h1 id="judulHalaman" class="h1-compact">Tambah Aktivitas</h1>
    <div class="pita-lambang" style="margin-bottom:16px;"><span></span><span></span><span></span><span></span></div>

    <div class="field">
```

(This page swaps `id="judulHalaman"`'s text between "Tambah Aktivitas" and "Edit Aktivitas" via JS at runtime — it only ever touches `.textContent`, never `.className`, so the added `class="h1-compact"` is unaffected either way. The divider is static markup below it and is unaffected too.)

- [ ] **Step 2: Verify the ids/JS the page depends on are untouched**

Search `src/TambahAktivitas.html` (Grep tool) for `id="judulHalaman"`, `id="btnSimpan"`, `google.script.url.getLocation`, `kompresGambar` — all must still be present exactly once each. Also search for `h1-compact` — must be present once, confirming Task 7's class is reused correctly.

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/TambahAktivitas.html
git commit -m "feat: add pita-lambang divider to TambahAktivitas.html"
```

---

## Task 9: Verify the 4 admin content pages inherit the new tokens correctly

These 4 files (`AdminDashboard.html`, `AdminPegawai.html`, `AdminLaporan.html`, `AdminAkun.html`) contain **no hardcoded colors** — they only reference shared classes (`.field`, `.card`, `.stat-card`, `.admin-table`, `.btn-primary`, `.btn-ghost`) defined in `Shared.html`/`AdminShared.html`. This task is a verification pass, not an edit — confirming Task 6's `AdminShared.html` changes flow through correctly with no leftover old-token references.

**Files:** none modified — read-only verification of `src/AdminDashboard.html`, `src/AdminPegawai.html`, `src/AdminLaporan.html`, `src/AdminAkun.html`.

- [ ] **Step 1: Confirm no inline hardcoded colors exist in these 4 files**

Search each of the 4 files (Grep tool, pattern `#[0-9A-Fa-f]{3,6}`) — expected: **zero** matches in every file (any match would mean a hardcoded color bypassing the shared token system, which would need its own fix before continuing).

- [ ] **Step 2: Confirm each page still calls `renderAdminNav()` with its own page key unchanged**

Search each file for `renderAdminNav(` — expected one match per file: `renderAdminNav('admin')` in `AdminDashboard.html`, `renderAdminNav('admin/pegawai')` in `AdminPegawai.html`, `renderAdminNav('admin/laporan')` in `AdminLaporan.html`, `renderAdminNav('admin/akun')` in `AdminAkun.html`. This confirms Task 6 didn't change the nav-highlighting contract these pages rely on.

- [ ] **Step 3: Run the regression test suite one more time**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

(No commit — no files were changed in this task.)

---

## Task 10: Push & verify all 5 surfaces live (final rollout)

**Files:** none (deploy + manual verification only).

- [ ] **Step 1: Push everything to the live Apps Script project**

Run: `clasp push`
Expected: exits 0, lists all changed `src/*.html` files.

- [ ] **Step 2: Get the current deployment URL**

Run: `clasp deployments` and note the current web app URL (same as Task 3 Step 2 — may be the same URL if no new deployment version was cut).

- [ ] **Step 3: Visually verify each of the 5 surfaces live**

For each URL below, confirm the page renders per spec §6 (split-panel for the first 3, topbar+content for the last 2) with no console errors, at both a desktop (≥768px) and mobile (<768px) viewport:
- `<url>?page=home` (or the root URL, whichever routes to `Home.html` per `Code.js`'s page map)
- `<url>?page=login`
- `<url>?page=admin-login`
- `<url>?page=aktivitas` (after logging in as the test pegawai)
- `<url>?page=admin` (after logging in as the test SuperAdmin) — then click through to `admin/pegawai`, `admin/laporan`, `admin/akun` and confirm the navy topbar + gold nav-active state + pita divider render on all four.

- [ ] **Step 4: Full regression pass on the navigation bug class (Task 10 history)**

Repeat, on the live site, the checklist from Task 3 Step 4, plus:
- Click every nav link in the admin topbar (`Dashboard`, `Kelola Pegawai`, `Kelola Laporan`, `Kelola Admin`) and confirm each navigates correctly (no blank page — this is exactly the `a[href^="?"]` delegated-listener path).
- Open `TambahAktivitas.html` in edit mode (click "Edit" on an existing laporan from `Aktivitas.html`) and confirm the existing data still loads correctly (exercises `google.script.url.getLocation()`).
- Save a new laporan end-to-end (exercises `saveAktivitas` + the Sheets-write-corruption fix from commit `c665bd1` — should be completely unaffected by this plan, but is the single most severe regression class possible, so it is worth the extra minute to re-confirm).

- [ ] **Step 5: Report to the product owner**

Tell the product owner the redesign is live on all 5 surfaces, list which URLs to check, and ask them to do a final pass themselves before considering this plan complete.
