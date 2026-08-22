# Full Theme Switch to template-baru Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire visual system of SiRajin Morowali (navy/emas, currently live) with the `template-baru/*.html` cream/hijau/terracotta system, wiring all 9 pages to the existing GAS backend with zero server changes and zero new navigation/session JS.

**Architecture:** New design tokens + base component classes live in `src/Shared.html` (replacing the navy/emas tokens there now). Admin chrome (topbar/nav/table/filter-bar/modal CSS, all identical across the 4 admin pages in the template) consolidates into `src/AdminShared.html`, rendered dynamically by the existing `renderAdminNav()` — the template's own static per-page topbar markup is NOT used. Each of the 9 page files gets its markup from the matching `template-baru/*.html` file's `<body>`, with the shared token `<style>` block removed (provided by `include('Shared')` instead) and the page's own second `<style>` block kept. Existing client JS (login handlers, `renderLaporan()`, `tambahPoinUraian()`, `kompresGambar()`, edit-mode logic, admin CRUD handlers) is preserved and reused — never replaced by the template's own inert/mismatched JS.

**Tech Stack:** Google Apps Script `HtmlService` templates, Google Fonts (Source Serif 4 + Inter — unchanged from before), `clasp` CLI, Jest.

**Spec:** `docs/superpowers/specs/2026-08-22-template-theme-switch-design.md` — §6 has the authoritative id-mapping table per file; this plan implements it task by task.

## Global Constraints

- **Zero edits to server-side files** (`Auth.js`, `AktivitasService.js`, `AdminService.js`, `DashboardService.js`, `PegawaiService.js`, `PdfGenerator.js`, `Utils.js`, `Setup.js`, `Code.js`).
- **Zero new client-side navigation/state logic**: `redirectTop()`, `google.script.url.getLocation()`, the delegated `a[href^="?"]` click listener, `requireLogin()`, `requireAdminLogin()`, `handleSessionExpiry()`, `getToken()`/`setToken()`/`clearToken()`, `showToast()`, and `renderAdminNav()`'s session-fetch/nav-highlight logic must be carried over byte-for-byte from the current `src/Shared.html`/`src/AdminShared.html` — only their surrounding CSS/HTML they're embedded in changes.
- **Template's own inert JS is discarded, not merged**: every template file's own `<script>` block (`addPoint`/`removePoint`/`handlePhoto` in the form, `openModal`/`closeModal` in admin pages, empty blocks elsewhere) is discarded entirely — replaced either by existing working JS from the current app, or (for the "Tambah" flows in `AdminPegawai.html`/`AdminAkun.html`) by the current app's already-working inline-card expand/collapse pattern instead of the template's modal, specifically to avoid the `id="modalPegawai"` collision the template itself has between those two pages (see Task 8/10) — the modal pattern is not used anywhere in this plan.
- **Every `<input type="submit">`/`<button type="submit">` in a template form becomes `type="button"`** — a real GAS page has no server-side form action to submit to; native submission reloads the page and loses all JS-driven behavior.
- **Every template nav link using a relative filename (`./NN-name.html`) becomes a `?page=...` link** (see spec §6 mapping) — the delegated click listener in `Shared.html` depends on the `href^="?"` pattern.
- **The template's modal pattern (`id="modalPegawai"`, reused verbatim — and colliding — across `admin-pegawai.html`/`admin-akun.html`) is not adopted anywhere in this plan**: both `AdminPegawai.html` (Task 8) and `AdminAkun.html` (Task 10) use the current app's already-working inline-card expand/collapse pattern instead, sidestepping the collision entirely rather than fixing it in place.
- **`npm test` must stay at 16/16 passing** after every task.
- **Rollout is staged**: Task 3 is a hard checkpoint — do not start Task 5 until the product owner has approved the live `Login.html` redesign.

---

## Ordering note

Task 1 (`Shared.html`) must land first — everything else consumes its tokens. After that, the plan front-loads the checkpoint (`Login.html`, smallest surface closest to the template's contract) before touching anything else, per the spec's staged rollout (§9). `AdminShared.html` (Task 2) is written before the checkpoint runs even though the checkpoint itself doesn't need it, because Tasks 7-10 (the 4 admin pages) all depend on it and grouping foundational tasks together up front avoids interrupting the admin-page work later to backfill it — the checkpoint gate in Task 4 still blocks Task 5 onward exactly as the spec requires.

## Task 1: Replace design tokens & base classes in `Shared.html`

**Files:**
- Modify: `src/Shared.html` (whole `<style>` block; the `<script>` block is UNCHANGED — see Global Constraints)

**Interfaces:**
- Consumes: none (foundational task).
- Produces (for all later tasks): CSS custom properties `--bg`, `--surface`, `--surface-alt`, `--ink`, `--ink-soft`, `--ink-faint`, `--primary`, `--primary-dark`, `--primary-soft`, `--primary-line`, `--accent`, `--accent-dark`, `--accent-soft`, `--gold`, `--gold-text`, `--gold-soft`, `--danger`, `--danger-soft`, `--warning`, `--warning-soft`, `--success`, `--success-soft`, `--border`, `--border-soft`, `--shadow-sm/md/lg`, `--radius-sm/md/lg/pill`, `--font-display`, `--font-ui`, `--space-1` through `--space-10`; base classes `.tabular`, `.eyebrow`, `.btn` (+ `.btn-primary/secondary/ghost/danger-ghost/block/lg/sm`), `.card`, `.badge` (+ `.badge-draft/tersimpan/final/belum/aktif/nonaktif`), `.field`, `.input`/`.select`/`.textarea`, `.input-nip`, `.seal`, `.error-message`, `.loading` (the last two aren't in the template — they're kept from the current app since every existing page's JS renders into elements with these exact classes).
- Removes (no longer produced — every consumer of these from the navy/emas system must lose its reference in this same task or a later task, never left dangling): `--navy-*`, `--gold-600/700/300`, `--pita-*`, `--blue-*`, `.pita-lambang`, `.lambang-logo`, `.split-shell/.split-brand/.split-form/.brand-name/.split-motto`, `.avatar-initial`, `.circle-badge`, `.avatar-row`, `.progress-track/.progress-fill/.progress-caption` (dashboard gets its own copy in Task 7, template's version differs slightly), `.stat-card--success/--warning`, `.card--final/--draft/.card-preview`, `.form-section` (old), `h1.h1-compact` (old — replaced with new value in this task, see Step 4), `.waktu-aktivitas`, `.badge-aktif/.badge-nonaktif` (old navy-tinted versions — replaced with template's in this same task), `SIRAJIN_LOGO_SRC` JS constant and its two consumption patterns.

**Pre-verified contrast fixes (computed against the actual template hex values before implementation, not guessed)** — two of the template's own token choices fail WCAG AA and are corrected here rather than shipped and fixed in a later round:
1. `--ink-faint` (`#8A8471`) on white/`--surface` computes to **3.74:1** (fails the 4.5:1 floor for normal text) — and it's used pervasively as small-label text (`.stat-label`, `.filter-field label`, `.data-table thead th`, `.field .hint`, `.loading`, `.alert-row .role`, `.cell-name-text .n2`, and more, all defined against this one token in Tasks 1-12). Darkened to `#6B6558` (**5.79:1**, still reads as the same muted warm-gray character, just legible).
2. `var(--gold)`/`var(--warning)` (`#B4863C`, aliased) used as **text** color on `--gold-soft`/`--warning-soft` (`#F1E6CE`) — i.e. `.badge-final`/`.badge-draft`'s text — computes to **2.64:1** (fails badly; badge text at 12px is not "large text" by WCAG's definition, so needs 4.5:1). A new token, `--gold-text: #6B4E1E`, is introduced for this ONE use (badge text only) — it computes to **6.20:1** on the same background. `--gold` itself is untouched everywhere it's used decoratively (icon fills, border accents, stat-card top border) — those aren't text-on-tint and don't have this problem.

- [ ] **Step 1: Replace the Google Fonts `<link>`**

Replace:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet">
```

with:

```html
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Replace the entire `:root` block and every base rule through the scrollbar rules**

Replace everything from `:root {` through the `#sirajinToast { ... }` rule (i.e. the entire current `<style>` block's content) with:

```css
:root{
  --bg: #F5F1E5;
  --surface: #FFFFFF;
  --surface-alt: #EFEADB;
  --ink: #211F19;
  --ink-soft: #5B5648;
  --ink-faint: #6B6558;

  --primary: #1F4A3D;
  --primary-dark: #143128;
  --primary-soft: #E2EAE4;
  --primary-line: #C9D6CD;

  --accent: #B75A2E;
  --accent-dark: #93441F;
  --accent-soft: #F3E2D5;

  --gold: #B4863C;
  --gold-text: #6B4E1E;
  --gold-soft: #F1E6CE;

  --danger: #A23B33;
  --danger-soft: #F3DEDA;
  --warning: #B4863C;
  --warning-soft: #F1E6CE;
  --success: #2F6B52;
  --success-soft: #DEEAE2;

  --border: #DED6C0;
  --border-soft: #E9E3D2;

  --shadow-sm: 0 1px 2px rgba(33,31,25,.05);
  --shadow-md: 0 10px 30px -14px rgba(33,31,25,.22), 0 2px 6px -2px rgba(33,31,25,.08);
  --shadow-lg: 0 24px 60px -20px rgba(20,49,40,.28);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 999px;

  --font-display: "Source Serif 4", "Source Serif Pro", Georgia, serif;
  --font-ui: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 32px; --space-8: 40px;
  --space-9: 56px; --space-10: 72px;
}

*{box-sizing:border-box;}
html{-webkit-text-size-adjust:100%;}
body{
  margin:0;
  font-family:var(--font-ui);
  background:var(--bg);
  color:var(--ink);
  font-size:15px;
  line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,.font-display{font-family:var(--font-display);font-weight:600;color:var(--ink);margin:0;letter-spacing:-0.01em;}
p{margin:0;}
a{color:inherit;text-decoration:none;}
button{font-family:inherit;}
input,select,textarea{font-family:inherit;}
:focus-visible{outline:2.5px solid var(--accent);outline-offset:2px;border-radius:4px;}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important;}}

.tabular{font-variant-numeric:tabular-nums;}
.eyebrow{
  font-size:11.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;
  color:var(--primary);display:inline-flex;align-items:center;gap:8px;
}
.eyebrow::before{content:"";width:16px;height:1.5px;background:var(--accent);display:inline-block;}

.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:13px 22px;border-radius:var(--radius-sm);border:1.5px solid transparent;
  font-weight:600;font-size:14.5px;cursor:pointer;transition:transform .12s ease, box-shadow .12s ease, background .15s ease;
  line-height:1.2;
}
.btn:active{transform:translateY(1px);}
.btn-primary{background:var(--accent);color:#FDF9F2;box-shadow:var(--shadow-sm);}
.btn-primary:hover{background:var(--accent-dark);}
.btn-secondary{background:var(--surface);color:var(--primary);border-color:var(--border);}
.btn-secondary:hover{border-color:var(--primary);background:var(--primary-soft);}
.btn-ghost{background:transparent;color:var(--ink-soft);border-color:transparent;}
.btn-ghost:hover{background:var(--surface-alt);color:var(--ink);}
.btn-danger-ghost{background:transparent;color:var(--danger);border-color:var(--danger-soft);}
.btn-danger-ghost:hover{background:var(--danger-soft);}
.btn-block{width:100%;}
.btn-lg{padding:16px 26px;font-size:15.5px;border-radius:10px;}
.btn-sm{padding:8px 14px;font-size:13px;border-radius:7px;}
.btn:disabled{opacity:.5;cursor:not-allowed;}
.btn-inline{width:auto;display:inline-flex;}

.card{
  background:var(--surface);border:1px solid var(--border-soft);border-radius:var(--radius-lg);
  box-shadow:var(--shadow-sm);
}

.badge{
  display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:var(--radius-pill);
  font-size:12px;font-weight:600;letter-spacing:.02em;font-family:var(--font-display);
}
.badge::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;}
.badge-draft{background:var(--warning-soft);color:var(--gold-text);}
.badge-tersimpan{background:var(--success-soft);color:var(--success);}
.badge-final{background:var(--gold-soft);color:var(--gold-text);}
.badge-belum{background:var(--danger-soft);color:var(--danger);}
.badge-aktif{background:var(--success-soft);color:var(--success);}
.badge-nonaktif{background:var(--surface-alt);color:var(--ink-faint);}

.field{display:flex;flex-direction:column;gap:7px;margin-bottom:var(--space-5);}
.field label{font-size:13px;font-weight:600;color:var(--ink-soft);}
.field .hint{font-size:12px;color:var(--ink-faint);}
.input, .select, .textarea{
  width:100%;padding:13px 14px;border-radius:10px;border:1.5px solid var(--border);
  background:var(--surface);color:var(--ink);font-size:15px;transition:border-color .12s ease, box-shadow .12s ease;
}
.input:focus, .select:focus, .textarea:focus{
  border-color:var(--primary);box-shadow:0 0 0 3.5px var(--primary-soft);outline:none;
}
.input::placeholder{color:var(--ink-faint);}
.input-nip{font-variant-numeric:tabular-nums;letter-spacing:.04em;font-size:19px;font-weight:600;padding:15px 16px;}

.seal{position:relative;width:100%;height:100%;}
.seal svg{width:100%;height:100%;display:block;}

.error-message{color:var(--danger);font-size:13.5px;margin-top:8px;}
.loading{color:var(--ink-faint);font-size:13.5px;}

::-webkit-scrollbar{width:10px;height:10px;}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px;}
::-webkit-scrollbar-track{background:transparent;}

#sirajinToast {
  display: none;
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
  padding: 12px 20px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  box-shadow: var(--shadow-md);
  z-index: 1000;
}
```

(`#sirajinToast` kept functionally identical to before — only `border-radius`/`box-shadow` now reference the new token names. `showToast()` in the `<script>` block below still sets `el.style.background` to `'var(--danger)'`/`'var(--success)'` inline — those token names still resolve correctly since `--danger`/`--success` still exist, just with new hex values.)

- [ ] **Step 3: Verify the `<script>` block is untouched**

Search `src/Shared.html` (Grep tool) for `SIRAJIN_BASE_URL`, `function redirectTop`, `function showToast`, `function requireLogin`, `function handleSessionExpiry`, `getToken`, `setToken`, `clearToken` — all must be present, byte-identical to before this task (this task's diff must show zero changes below the closing `</style>` tag).

Search for `SIRAJIN_LOGO_SRC` — must be **absent** (this task removes it; if the removal wasn't done as part of Step 2 because it lived in the `<script>` block in the current file, remove that one line now — check the current file for a line like `var SIRAJIN_LOGO_SRC = 'data:image/png;base64,...';` right after `var SIRAJIN_BASE_URL = ...;` and delete it).

- [ ] **Step 4: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 5: Commit**

```bash
git add src/Shared.html
git commit -m "feat: replace design tokens with template-baru cream/hijau/terracotta system"
```

---

## Task 2: Replace `AdminShared.html` — topbar/nav/table/modal chrome

**Files:**
- Modify: `src/AdminShared.html`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: CSS classes `.admin-topbar`, `.admin-brand`, `.mark`, `.admin-brand-text` (+ `.b1`/`.b2`), `.admin-nav` (+ `a`, `a.active`), `.admin-user` (+ `.admin-user-info`/`.u1`/`.u2`), `.admin-avatar`, `.admin-logout`, `.admin-shell`, `.admin-page-head` (+ `h1`/`.desc`), `.stat-grid`, `.stat-card` (+ `.accent-primary/success/danger/gold`, `.stat-label`, `.stat-value`, `.stat-foot`), `.panel` (+ `.panel-head`/`h2`/`.count`, `.panel-body`), `.table-wrap`, `.data-table` (+ `.num`), `.cell-name` (+ `.cell-avatar`, `.cell-name-text`/`.n1`/`.n2`), `.row-actions`, `.icon-action` (+ `.danger`), `.filter-bar` (+ `.filter-field`), `.alert-list` (+ `.alert-row`/`.dot`/`.name`/`.role`), `.modal-overlay` (+ `.open`, `.modal-box`, `.modal-head`/`h3`, `.modal-close`, `.modal-body`, `.modal-foot`). JS: `initials(nama)` (unchanged from before — returns 1-2 letter initials string), `avatarHtml(nama, cssClass)` (changed signature — now takes the target class name since the template uses two different avatar classes, `.admin-avatar` in the topbar and `.cell-avatar` in tables), `escapeHtml` (unchanged), `renderAdminNav(halamanAktif)` (unchanged contract — same function name/parameter, same `getMySession()`/`requireAdminLogin()` call, output markup changed to match template).
- **Deviation from template, with rationale**: the template's `.admin-mobile-toggle` hamburger button has **no JS behind it anywhere in any of the 4 admin template files** — it is permanently decorative, and the accompanying CSS hides `.admin-nav` entirely below 880px width, meaning on a real phone the admin nav would have no way to navigate at all. This plan drops the mobile-toggle button entirely (not rendered) and drops the CSS that hides `.admin-nav` on narrow screens — replaced with `flex-wrap:wrap` so the same 4 links wrap onto a second line instead of disappearing. This is a bug-fix within scope (no new interactive JS added, and removes something that would have shipped broken), not a new feature.

- [ ] **Step 1: Replace the entire `<style>` block**

Replace the file's whole `<style>` block (topbar/nav/shell/stat-card/panel/table/filter-bar/alert-list rules, ending wherever the current navy-themed rules stop) with:

```css
  .admin-topbar{
    background:var(--primary-dark);
    color:#EFEADB;
    padding:0 var(--space-7);
    display:flex;align-items:center;justify-content:space-between;
    min-height:66px;
    position:sticky;top:0;z-index:40;
    box-shadow:0 4px 18px rgba(20,49,40,.18);
    flex-wrap:wrap;
    gap:8px;
  }
  .admin-brand{display:flex;align-items:center;gap:11px;padding:12px 0;}
  .admin-brand .mark{
    width:32px;height:32px;border-radius:50%;background:var(--gold);
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
  }
  .admin-brand .mark svg{width:16px;height:16px;}
  .admin-brand-text{line-height:1.2;}
  .admin-brand-text .b1{font-family:var(--font-display);font-weight:700;font-size:15px;color:#FBF8F1;}
  .admin-brand-text .b2{font-size:10.5px;color:#9FB6AA;letter-spacing:.03em;}

  .admin-nav{display:flex;gap:4px;flex-wrap:wrap;padding:8px 0;}
  .admin-nav a{
    padding:9px 15px;border-radius:8px;font-size:13.5px;font-weight:600;color:#B9CFC3;
    transition:background .15s ease,color .15s ease;
  }
  .admin-nav a:hover{background:rgba(255,255,255,.06);color:#EFEADB;}
  .admin-nav a.active{background:rgba(255,255,255,.1);color:#FBF8F1;}

  .admin-user{display:flex;align-items:center;gap:12px;padding:12px 0;}
  .admin-user-info{text-align:right;line-height:1.2;}
  .admin-user-info .u1{font-size:12.5px;font-weight:700;color:#EFEADB;}
  .admin-user-info .u2{font-size:10.5px;color:#9FB6AA;}
  .admin-avatar{
    width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);
    display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:12.5px;font-weight:700;color:#FBF8F1;
  }
  .admin-logout{
    width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.06);
    display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);
  }
  .admin-logout:hover{background:rgba(255,255,255,.12);}

  .admin-shell{max-width:1280px;margin:0 auto;padding:var(--space-7);}
  .admin-page-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:var(--space-6);gap:16px;flex-wrap:wrap;}
  .admin-page-head h1{font-size:26px;}
  .admin-page-head .desc{color:var(--ink-soft);font-size:13.5px;margin-top:5px;}

  .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);margin-bottom:var(--space-7);}
  .stat-card{padding:var(--space-5);position:relative;overflow:hidden;}
  .stat-card .stat-label{font-size:12px;color:var(--ink-faint);font-weight:600;text-transform:uppercase;letter-spacing:.04em;}
  .stat-card .stat-value{font-family:var(--font-display);font-size:34px;margin-top:8px;}
  .stat-card .stat-foot{font-size:12px;margin-top:6px;color:var(--ink-soft);}
  .stat-card.accent-primary{border-top:3px solid var(--primary);}
  .stat-card.accent-success{border-top:3px solid var(--success);}
  .stat-card.accent-danger{border-top:3px solid var(--danger);}
  .stat-card.accent-gold{border-top:3px solid var(--gold);}

  .panel{margin-bottom:var(--space-6);}
  .panel-head{display:flex;justify-content:space-between;align-items:center;padding:var(--space-5) var(--space-5) 0;}
  .panel-head h2{font-size:16px;}
  .panel-head .count{font-size:12px;color:var(--ink-faint);font-weight:600;}
  .panel-body{padding:var(--space-5);}

  .table-wrap{overflow-x:auto;}
  table.data-table{width:100%;border-collapse:collapse;font-size:13.5px;}
  .data-table thead th{
    text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint);
    font-weight:700;padding:10px 14px;border-bottom:1.5px solid var(--border);white-space:nowrap;
  }
  .data-table tbody td{padding:13px 14px;border-bottom:1px solid var(--border-soft);vertical-align:middle;}
  .data-table tbody tr:last-child td{border-bottom:none;}
  .data-table tbody tr:hover{background:var(--surface-alt);}
  .data-table td.num, .data-table th.num{text-align:right;font-variant-numeric:tabular-nums;}
  .cell-name{display:flex;align-items:center;gap:10px;}
  .cell-avatar{
    width:30px;height:30px;border-radius:50%;background:var(--primary-soft);color:var(--primary);
    display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:12px;flex-shrink:0;
  }
  .cell-name-text .n1{font-weight:600;color:var(--ink);}
  .cell-name-text .n2{font-size:11.5px;color:var(--ink-faint);}
  .row-actions{display:flex;gap:6px;justify-content:flex-end;}
  .icon-action{
    width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;
    color:var(--ink-faint);border:1px solid transparent;background:none;cursor:pointer;
  }
  .icon-action:hover{background:var(--primary-soft);color:var(--primary);border-color:var(--primary-line);}
  .icon-action.danger:hover{background:var(--danger-soft);color:var(--danger);}

  .filter-bar{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:var(--space-5);}
  .filter-field{display:flex;flex-direction:column;gap:6px;}
  .filter-field label{font-size:11.5px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.03em;}
  .filter-field .input, .filter-field .select{padding:10px 12px;font-size:13.5px;min-width:170px;}
  .filter-bar .btn{padding:10.5px 18px;font-size:13.5px;}

  .alert-list{display:flex;flex-direction:column;gap:0;}
  .alert-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border-soft);}
  .alert-row:last-child{border-bottom:none;}
  .alert-row .dot{width:7px;height:7px;border-radius:50%;background:var(--danger);flex-shrink:0;}
  .alert-row .name{font-weight:600;font-size:13.5px;flex:1;}
  .alert-row .role{font-size:11.5px;color:var(--ink-faint);}

  .modal-overlay{
    position:fixed;inset:0;background:rgba(20,49,40,.45);backdrop-filter:blur(2px);
    display:none;align-items:center;justify-content:center;z-index:100;padding:var(--space-5);
  }
  .modal-overlay.open{display:flex;}
  .modal-box{
    background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);
    width:100%;max-width:460px;max-height:90vh;overflow-y:auto;
  }
  .modal-head{
    display:flex;justify-content:space-between;align-items:center;padding:var(--space-5) var(--space-5);
    border-bottom:1px solid var(--border-soft);
  }
  .modal-head h3{font-size:17px;}
  .modal-close{width:30px;height:30px;border-radius:8px;background:var(--surface-alt);display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;color:var(--ink-soft);}
  .modal-body{padding:var(--space-5);}
  .modal-foot{display:flex;gap:10px;justify-content:flex-end;padding:var(--space-4) var(--space-5);border-top:1px solid var(--border-soft);}

  @media (max-width: 1080px){
    .stat-grid{grid-template-columns:repeat(2,1fr);}
  }
  @media (max-width: 880px){
    .admin-shell{padding:var(--space-5);}
    .stat-grid{grid-template-columns:1fr 1fr;}
    .admin-page-head h1{font-size:22px;}
  }
```

- [ ] **Step 2: Replace `escapeHtml`'s neighboring helpers and `renderAdminNav()`**

Keep `escapeHtml` exactly as-is. Replace the `initials`/`avatarHtml` helpers (added in the earlier navy redesign) with:

```js
  function initials(nama) {
    var kata = String(nama || '').trim().split(/\s+/).filter(Boolean);
    if (kata.length === 0) return '?';
    if (kata.length === 1) return kata[0].substring(0, 2).toUpperCase();
    return (kata[0][0] + kata[kata.length - 1][0]).toUpperCase();
  }

  function avatarHtml(nama, cssClass) {
    return '<div class="' + cssClass + '">' + escapeHtml(initials(nama)) + '</div>';
  }
```

Replace the `renderAdminNav(halamanAktif)` function's body — keep the exact same function signature, the same `requireAdminLogin()` guard at the top, and the same `getMySession(getToken())` call with the same success/failure handlers — only change the two HTML strings it builds:

Replace:

```js
    var topbarHtml = '<header class="admin-topbar">' +
      '<div class="admin-nav-brand"><img class="lambang-logo" src="' + SIRAJIN_LOGO_SRC + '" alt="Lambang Kabupaten Morowali"> SiRajin Admin</div>' +
      '<nav class="admin-nav" id="adminNavLinks"></nav>' +
      '<div class="admin-user"><span id="adminUserName"></span>' +
      '<a href="#" onclick="adminLogout(); return false;">' + ADMIN_NAV_ICONS.keluar + ' Keluar</a></div></header>' +
      '<div class="pita-lambang admin-pita"><span></span><span></span><span></span><span></span></div>';
    document.body.insertAdjacentHTML('afterbegin', topbarHtml);
```

with:

```js
    var topbarHtml = '<div class="admin-topbar">' +
      '<div class="admin-brand">' +
      '<div class="mark"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2 L20 6 V12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 V6 Z" stroke="#3A2C10" stroke-width="1.8" stroke-linejoin="round"/></svg></div>' +
      '<div class="admin-brand-text"><div class="b1">SiRajin Morowali</div><div class="b2">Panel Admin &middot; DPMPTSP</div></div>' +
      '</div>' +
      '<nav class="admin-nav" id="adminNavLinks"></nav>' +
      '<div class="admin-user" id="adminUserBlock"></div>' +
      '</div>';
    document.body.insertAdjacentHTML('afterbegin', topbarHtml);
```

(The template's brand block always uses the SVG shield glyph — no crest logo per spec §4/§8. The user block is now built inside the success handler below, since it needs the session's `nama`/`level` to render initials — previously it only needed a plain-text name span.)

Then, in the SAME function's `getMySession` success handler, replace:

```js
        var session = result.session;
        function link(page, kunci, icon, label) {
          var active = kunci === halamanAktif ? ' active' : '';
          return '<a class="' + active.trim() + '" href="?page=' + page + '">' + icon + label + '</a>';
        }
        var navLinks = link('admin', 'admin', ADMIN_NAV_ICONS.dashboard, 'Dashboard') +
          link('admin/pegawai', 'admin/pegawai', ADMIN_NAV_ICONS.pegawai, 'Kelola Pegawai') +
          link('admin/laporan', 'admin/laporan', ADMIN_NAV_ICONS.laporan, 'Kelola Laporan') +
          (session.level === 'SuperAdmin' ? link('admin/akun', 'admin/akun', ADMIN_NAV_ICONS.admin, 'Kelola Admin') : '');
        document.getElementById('adminNavLinks').innerHTML = navLinks;
        document.getElementById('adminUserName').textContent = session.nama + ' (' + session.level + ')';
```

with:

```js
        var session = result.session;
        function link(page, kunci, label) {
          var active = kunci === halamanAktif ? ' active' : '';
          return '<a class="' + active.trim() + '" href="?page=' + page + '">' + label + '</a>';
        }
        var navLinks = link('admin', 'admin', 'Dashboard') +
          link('admin/pegawai', 'admin/pegawai', 'Kelola Pegawai') +
          link('admin/laporan', 'admin/laporan', 'Kelola Laporan') +
          (session.level === 'SuperAdmin' ? link('admin/akun', 'admin/akun', 'Kelola Admin') : '');
        document.getElementById('adminNavLinks').innerHTML = navLinks;
        document.getElementById('adminUserBlock').innerHTML =
          '<div class="admin-user-info"><div class="u1">' + escapeHtml(session.nama) + '</div><div class="u2">' + escapeHtml(session.level) + '</div></div>' +
          avatarHtml(session.nama, 'admin-avatar') +
          '<a href="#" onclick="adminLogout(); return false;" class="admin-logout" title="Keluar">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="#EFEADB" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
```

Delete the `ADMIN_NAV_ICONS` object entirely (the SVG nav-link icons it held are no longer used — the template's nav links are plain text, no icons). `adminLogout()` and `requireAdminLogin()` stay completely unchanged.

- [ ] **Step 3: Verify old identifiers are gone and new ones are present**

Search `src/AdminShared.html` for `ADMIN_NAV_ICONS`, `SIRAJIN_LOGO_SRC`, `admin-pita`, `lambang-logo` — expected **zero** matches for all four.

Search for `function renderAdminNav`, `function adminLogout`, `function requireAdminLogin`, `getMySession` — all must still be present.

- [ ] **Step 4: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 5: Commit**

```bash
git add src/AdminShared.html
git commit -m "feat: replace admin topbar/table/modal chrome with template-baru system"
```

---

## Task 3: Replace `Login.html` (checkpoint build)

**Files:**
- Modify: `src/Login.html`

**Interfaces:**
- Consumes: tokens/classes from Task 1.
- Produces: none new — this is a leaf page.

- [ ] **Step 1: Replace the whole file**

Replace the entire content of `src/Login.html` with:

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?>
  <style>
    body{
      background:var(--primary);
      min-height:100vh;
    }
    .auth-wrap{
      min-height:100vh;
      display:flex;
      flex-direction:column;
      background:var(--primary);
      background-image: radial-gradient(circle at 85% -10%, rgba(255,255,255,.06), transparent 45%);
      position:relative;
    }
    .auth-top{
      padding:var(--space-6) var(--space-5) var(--space-8);
      color:#EFEADB;
      position:relative;
      overflow:hidden;
    }
    .auth-top .back-link{
      font-size:13px;color:#C9D6CD;display:inline-flex;align-items:center;gap:6px;margin-bottom:var(--space-6);
    }
    .auth-top .seal-mini{position:absolute;right:-40px;top:-40px;width:200px;height:200px;opacity:.5;}
    .auth-top .eyebrow{color:#B9CFC3;}
    .auth-top .eyebrow::before{background:var(--gold);}
    .auth-top h1{color:#FBF8F1;font-size:30px;margin-top:10px;}
    .auth-top p{color:#C9D6CD;font-size:14px;margin-top:8px;max-width:340px;line-height:1.55;}

    .auth-sheet{
      flex:1;
      background:var(--bg);
      border-radius:26px 26px 0 0;
      margin-top:-18px;
      padding:var(--space-7) var(--space-5) var(--space-8);
      box-shadow:0 -12px 30px rgba(0,0,0,.12);
      display:flex;
      flex-direction:column;
    }
    .auth-card-title{font-size:20px;margin-bottom:4px;}
    .auth-card-sub{font-size:13.5px;color:var(--ink-soft);margin-bottom:var(--space-7);}

    .nip-field label{font-size:13px;font-weight:600;color:var(--ink-soft);margin-bottom:8px;display:block;}
    .nip-field .input-nip{text-align:left;}
    .nip-note{
      display:flex;gap:10px;align-items:flex-start;
      background:var(--surface-alt);border-radius:10px;padding:12px 14px;
      font-size:12.5px;color:var(--ink-soft);margin:var(--space-4) 0 var(--space-6);line-height:1.5;
    }
    .nip-note svg{flex-shrink:0;margin-top:1px;}

    .auth-footer{
      margin-top:auto;
      padding-top:var(--space-6);
      text-align:center;
      font-size:12px;color:var(--ink-faint);
    }
    .auth-footer a{color:var(--primary);font-weight:600;}

    @media (min-width:640px){
      .auth-wrap{align-items:center;justify-content:center;flex-direction:row;}
      .auth-top{width:44%;min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:var(--space-9);}
      .auth-sheet{width:56%;min-height:100vh;border-radius:0;margin-top:0;box-shadow:none;justify-content:center;padding:var(--space-9) var(--space-8);}
      .auth-card{max-width:380px;margin:0 auto;width:100%;}
    }
  </style>
  </head>
  <body>
    <div class="auth-wrap">
      <div class="auth-top">
        <svg class="seal-mini" viewBox="0 0 200 200"><circle cx="100" cy="100" r="94" fill="none" stroke="#3C6858" stroke-width="1.4" stroke-dasharray="2 6"/><circle cx="100" cy="100" r="72" fill="none" stroke="#3C6858" stroke-width="1"/></svg>
        <a href="?page=home" class="back-link">← Beranda</a>
        <span class="eyebrow">Login Pegawai</span>
        <h1 class="font-display">Selamat bekerja.</h1>
        <p>Masuk dengan NIP Anda untuk mencatat aktivitas dan bukti dukung kinerja hari ini.</p>
      </div>

      <div class="auth-sheet">
        <div class="auth-card">
          <h2 class="auth-card-title">Masuk dengan NIP</h2>
          <p class="auth-card-sub">Tidak perlu kata sandi — cukup Nomor Induk Pegawai Anda.</p>

          <div class="field nip-field">
            <label for="nip">Nomor Induk Pegawai (NIP)</label>
            <input class="input input-nip" type="text" inputmode="numeric" id="nip" placeholder="19850312 200901 1 003" autofocus>
          </div>

          <div class="nip-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#5B5648" stroke-width="1.5"/><path d="M12 11v5.5M12 8v.01" stroke="#5B5648" stroke-width="1.6" stroke-linecap="round"/></svg>
            <span>Login khusus NIP berlaku untuk mempercepat akses pegawai. Lupa atau salah NIP? Hubungi Kepegawaian DPMPTSP.</span>
          </div>

          <button type="button" class="btn btn-primary btn-block btn-lg" id="btnLogin">Masuk</button>
          <p class="error-message" id="errorMsg" style="display:none;"></p>

          <div class="auth-footer">
            Bukan pegawai? <a href="?page=admin-login">Login sebagai admin</a>
          </div>
        </div>
      </div>
    </div>

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
              redirectTop('?page=aktivitas', 'Berhasil masuk. Klik di sini untuk lanjut →');
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

(The `<form>`/`<button type="submit">` wrapper from the template is removed entirely — the field and button are direct children of `.auth-card`, matching the pattern every other page in this app already uses, since there is no server-side form action to submit to. The `google.script.run...loginPegawai(nip)` script block is carried over unchanged from the current `Login.html`. The back-links now use `?page=home`/`?page=admin-login` instead of the template's relative filenames.)

- [ ] **Step 2: Verify the ids the login script depends on still exist**

Search `src/Login.html` for `id="nip"`, `id="btnLogin"`, `id="errorMsg"` — each exactly once.

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/Login.html
git commit -m "feat: replace Login.html with template-baru auth-sheet layout"
```

---

## Task 4: CHECKPOINT — push & verify Login live, get approval

Same process as the previous redesign's checkpoint. Do not proceed to Task 5 until Step 4 is explicitly confirmed by the product owner.

- [ ] **Step 1: Push to the live Apps Script project**

Run: `clasp push` (create/verify `.clasp.json` in the worktree first if missing — it's gitignored, so a fresh worktree never has it; scriptId `1g9i794okCNqu1nqV_thpQIWWTunyhnhnTGB93-Wac3CQWyC7Xc-ddfcU`, `rootDir: "src"`).

- [ ] **Step 2: Verify live**

**Important — the `/dev` testing URL has shown unreliable propagation before** (a prior session found `/dev` serving stale content across multiple browsers/incognito/cache-busting query params, with no root cause other than Google-side propagation lag on that specific URL type). If `/dev?page=login` does not show the new design within a reasonable check, do NOT conclude the code is wrong — instead create a fresh standalone test deployment (`clasp deploy --description "..."`) and check that deployment's `/exec` URL instead, which reliably reflects the latest push immediately. This creates a new deployment ID and does **not** touch the pinned production deployment (`@13` at time of writing) that real users hit.

Check: split auth layout renders (dark green top panel + cream sheet, stacked on mobile / side-by-side ≥640px), login with a valid test NIP still redirects to `?page=aktivitas` correctly (regression check against the navigation bug class from Task 10 history), invalid/empty NIP still shows the inline error correctly.

- [ ] **Step 3: Get product owner approval — STOP HERE**

Do not start Task 5 until they explicitly approve the visual direction on the live page.

---

## Task 5: Replace `Home.html`

**Files:**
- Modify: `src/Home.html`

**Interfaces:**
- Consumes: tokens/classes from Task 1.

- [ ] **Step 1: Replace the whole file**

Replace the entire content of `src/Home.html` with:

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?>
  <style>
    body{background:var(--bg);}
    .landing{
      min-height:100vh;
      display:flex;
      flex-direction:column;
    }
    .landing-top{
      display:flex;align-items:center;justify-content:space-between;
      padding:var(--space-6) var(--space-8);
    }
    .kop{display:flex;align-items:center;gap:12px;}
    .kop-mark{
      width:38px;height:38px;border-radius:50%;background:var(--primary);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .kop-mark svg{width:20px;height:20px;}
    .kop-text{line-height:1.25;}
    .kop-text .k1{font-size:11px;letter-spacing:.06em;color:var(--ink-faint);text-transform:uppercase;font-weight:600;}
    .kop-text .k2{font-size:13.5px;font-weight:700;color:var(--primary);}

    .landing-main{
      flex:1;
      display:grid;
      grid-template-columns:1.05fr 0.85fr;
      align-items:center;
      gap:var(--space-8);
      padding:var(--space-6) var(--space-8) var(--space-9);
      max-width:1280px;
      margin:0 auto;
      width:100%;
    }
    .landing-copy h1{
      font-size:clamp(40px,6vw,68px);
      line-height:1.02;
      margin:14px 0 20px;
    }
    .landing-copy h1 .accent-word{color:var(--accent);font-style:italic;}
    .landing-copy .tagline{
      font-size:17px;color:var(--ink-soft);max-width:480px;line-height:1.6;margin-bottom:var(--space-7);
    }
    .landing-actions{display:flex;flex-direction:column;gap:16px;align-items:flex-start;}
    .landing-actions .btn{padding:16px 30px;font-size:16px;}
    .admin-link{font-size:13px;color:var(--ink-faint);border-bottom:1px dashed var(--border);padding-bottom:1px;}
    .admin-link:hover{color:var(--primary);border-color:var(--primary);}

    .landing-visual{
      position:relative;
      aspect-ratio:1/1;
      max-width:460px;
      margin:0 auto;
      display:flex;align-items:center;justify-content:center;
    }
    .landing-visual .seal-ring{position:absolute;inset:0;}
    .landing-visual .seal-card{
      position:relative;
      background:var(--surface);
      border:1px solid var(--border-soft);
      border-radius:var(--radius-lg);
      box-shadow:var(--shadow-lg);
      padding:28px 26px;
      width:78%;
      z-index:2;
    }
    .seal-card .row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-soft);}
    .seal-card .row:last-child{border-bottom:none;}
    .seal-card .row .lbl{font-size:12.5px;color:var(--ink-faint);}
    .seal-card .row .val{font-size:13px;font-weight:600;font-family:var(--font-display);}

    .landing-strip{
      border-top:1px solid var(--border-soft);
      padding:var(--space-5) var(--space-8);
      display:flex;justify-content:space-between;align-items:center;
      font-size:12px;color:var(--ink-faint);
    }
    .landing-strip .stat-row{display:flex;gap:28px;}
    .landing-strip .stat b{color:var(--ink);font-family:var(--font-display);font-size:15px;display:block;}

    @media (max-width: 880px){
      .landing-top{padding:var(--space-5) var(--space-5);}
      .landing-main{grid-template-columns:1fr;padding:var(--space-4) var(--space-5) var(--space-7);gap:var(--space-7);}
      .landing-visual{order:-1;max-width:280px;}
      .landing-copy h1{font-size:38px;}
      .landing-actions .btn{width:100%;}
      .landing-strip{flex-direction:column;gap:12px;align-items:flex-start;padding:var(--space-5);}
    }
  </style>
  </head>
  <body>
    <div class="landing">

      <div class="landing-top">
        <div class="kop">
          <div class="kop-mark">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 L20 6 V12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 V6 Z" stroke="#F5F1E5" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 12.2 L11 14.7 L15.7 9.5" stroke="#F5F1E5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="kop-text">
            <div class="k1">Pemerintah Kabupaten Morowali</div>
            <div class="k2">DPMPTSP · Sistem Internal</div>
          </div>
        </div>
      </div>

      <div class="landing-main">
        <div class="landing-copy">
          <span class="eyebrow">Sistem Rekap Aktivitas Jurnal Instansi</span>
          <h1>Si<span class="accent-word">Rajin</span><br>Morowali</h1>
          <p class="tagline">Satu tempat untuk mencatat aktivitas dan bukti dukung kinerja harian pegawai DPMPTSP Kabupaten Morowali — cepat diisi, rapi terekap, mudah dipantau.</p>
          <div class="landing-actions">
            <a href="?page=login" class="btn btn-primary btn-lg">Login Pegawai</a>
            <a href="?page=admin-login" class="admin-link">Masuk sebagai admin →</a>
          </div>
        </div>

        <div class="landing-visual">
          <div class="seal-ring">
            <svg viewBox="0 0 400 400" width="100%" height="100%">
              <circle cx="200" cy="200" r="188" fill="none" stroke="#C9D6CD" stroke-width="1.2" stroke-dasharray="2 7" stroke-linecap="round"/>
              <circle cx="200" cy="200" r="160" fill="none" stroke="#DED6C0" stroke-width="1"/>
              <g stroke="#C9D6CD" stroke-width="1.2">
                <line x1="200" y1="8" x2="200" y2="24"/><line x1="200" y1="376" x2="200" y2="392"/>
                <line x1="8" y1="200" x2="24" y2="200"/><line x1="376" y1="200" x2="392" y2="200"/>
              </g>
            </svg>
          </div>
          <div class="seal-card">
            <div class="row"><span class="lbl">Blok waktu</span><span class="val">08.00 – 09.30</span></div>
            <div class="row"><span class="lbl">Aktivitas</span><span class="val">Verifikasi berkas izin usaha</span></div>
            <div class="row"><span class="lbl">Status</span><span class="badge badge-tersimpan">Tersimpan</span></div>
          </div>
        </div>
      </div>

      <div class="landing-strip">
        <span>SiRajin Morowali — bukti dukung kinerja harian, terekap otomatis.</span>
        <div class="stat-row">
          <div class="stat"><b>70</b>pegawai aktif</div>
          <div class="stat"><b>1</b>pintu pelaporan</div>
        </div>
      </div>

    </div>
  </body>
</html>
```

(Every `href` now uses `?page=...` — this page has no `google.script.run` calls at all, so nothing from the old `Home.html` needed carrying over besides the base `<head>` include.)

- [ ] **Step 2: Verify the login/admin links survived**

Search `src/Home.html` for `href="?page=login"` and `href="?page=admin-login"` — each present once.

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/Home.html
git commit -m "feat: replace Home.html with template-baru landing layout"
```

---

## Task 6: Replace `AdminLogin.html`

**Files:**
- Modify: `src/AdminLogin.html`

**Interfaces:**
- Consumes: tokens/classes from Task 1.

**Deviation from template, with rationale**: the template's password show/hide toggle button (`.pw-toggle`) has no JS behind it anywhere in the source file — clicking it does nothing. Per spec §6.3, it is removed entirely rather than given new JS, since adding working show/hide behavior would be new interactive logic beyond this plan's scope (a pure visual/markup port).

- [ ] **Step 1: Replace the whole file**

Replace the entire content of `src/AdminLogin.html` with:

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?>
  <style>
    body{
      background:var(--primary-dark);
      background-image:
        radial-gradient(circle at 12% 18%, rgba(255,255,255,.05), transparent 40%),
        radial-gradient(circle at 88% 82%, rgba(180,134,60,.12), transparent 45%);
      min-height:100vh;
    }
    .admin-login-wrap{
      min-height:100vh;display:flex;align-items:center;justify-content:center;padding:var(--space-6);
    }
    .admin-login-card{
      width:100%;max-width:400px;background:var(--bg);border-radius:var(--radius-lg);
      box-shadow:var(--shadow-lg);padding:var(--space-8) var(--space-7);position:relative;overflow:hidden;
    }
    .admin-login-seal{position:absolute;top:-60px;right:-60px;width:180px;height:180px;opacity:.6;}
    .admin-login-top{text-align:left;margin-bottom:var(--space-7);position:relative;}
    .admin-login-top .kop-mark{
      width:40px;height:40px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-4);
    }
    .admin-login-top .kop-mark svg{width:20px;height:20px;}
    .admin-login-top h1{font-size:23px;margin-top:2px;}
    .admin-login-top p{font-size:13px;color:var(--ink-soft);margin-top:6px;}

    .admin-login-footer{
      margin-top:var(--space-6);text-align:center;font-size:12px;color:var(--ink-faint);
    }
    .admin-login-footer a{color:var(--primary);font-weight:600;}

    .back-corner{
      position:fixed;top:24px;left:24px;font-size:13px;color:#C9D6CD;display:flex;align-items:center;gap:6px;
    }
    .back-corner:hover{color:#fff;}
  </style>
  </head>
  <body>
    <a href="?page=home" class="back-corner">← Kembali ke beranda</a>
    <div class="admin-login-wrap">
      <div class="admin-login-card">
        <svg class="admin-login-seal" viewBox="0 0 200 200"><circle cx="100" cy="100" r="94" fill="none" stroke="#DED6C0" stroke-width="1.2" stroke-dasharray="2 6"/><circle cx="100" cy="100" r="74" fill="none" stroke="#EFEADB" stroke-width="1"/></svg>

        <div class="admin-login-top">
          <div class="kop-mark">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 2 L20 6 V12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 V6 Z" stroke="#F5F1E5" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 12.2 L11 14.7 L15.7 9.5" stroke="#F5F1E5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <span class="eyebrow">Panel Admin</span>
          <h1 class="font-display">Masuk ke SiRajin</h1>
          <p>Khusus admin &amp; superadmin DPMPTSP Kabupaten Morowali.</p>
        </div>

        <div class="field">
          <label for="nip">NIP</label>
          <input class="input tabular" type="text" id="nip" inputmode="numeric" placeholder="19850312 200901 1 003" autofocus>
        </div>
        <div class="field">
          <label for="password">Kata sandi</label>
          <input class="input" type="password" id="password" placeholder="••••••••">
        </div>

        <button type="button" class="btn btn-primary btn-block btn-lg" id="btnLogin" style="margin-top:var(--space-3);">Masuk</button>
        <p class="error-message" id="errorMsg" style="display:none;"></p>

        <div class="admin-login-footer">
          Lupa kata sandi? <a href="#">Hubungi SuperAdmin</a>
        </div>
      </div>
    </div>

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
              redirectTop('?page=admin', 'Berhasil masuk. Klik di sini untuk lanjut ke Dashboard →');
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

(`id="anip"`/`id="apw"` from the template become `id="nip"`/`id="password"`; the `.pw-field`/`.pw-toggle` wrapper is dropped per the deviation note above — the password input reverts to a plain `.field`, matching every other password input in this app.)

- [ ] **Step 2: Verify the ids the admin login script depends on still exist**

Search `src/AdminLogin.html` for `id="nip"`, `id="password"`, `id="btnLogin"`, `id="errorMsg"` — each exactly once. Search for `id="anip"`, `id="apw"`, `pw-toggle` — expected zero matches (confirms the rename and removal both landed).

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/AdminLogin.html
git commit -m "feat: replace AdminLogin.html with template-baru layout"
```

---

## Task 7: Replace `AdminDashboard.html`

**Files:**
- Modify: `src/AdminDashboard.html`

**Interfaces:**
- Consumes: tokens/classes from Task 1, admin chrome from Task 2 (`renderAdminNav('admin')`).

**Deviation from template, with rationale**: the template's "Rekap Jam Kerja" table is weekly ("Hari Lapor: X/5 hari", "Kelengkapan: Lengkap/Kurang") — per spec §6.7/the product owner's decision (this plan's design doc), the dashboard stays **per-day only**, matching what `getDashboardSummary()` actually returns. The "Hari Lapor" and "Kelengkapan" columns are **dropped** (not faked with placeholder data) — the table becomes 2 real columns: Pegawai, Total Jam. "Rata-rata Jam Tercatat" is computed client-side from `rekapJam` (simple average — sum of `totalMenit` divided by count of entries that reported), since the server doesn't return that figure directly and it's a pure arithmetic derivation of data already sent. The "Kirim Pengingat" button has no server support (no notification-sending endpoint exists) and stays inert/decorative, matching how it already behaves in the source template — not wired to a fake action.

- [ ] **Step 1: Replace the whole file**

Replace the entire content of `src/AdminDashboard.html` with:

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('AdminShared'); ?>
  <style>
    .dash-grid{display:grid;grid-template-columns:1fr 1.6fr;gap:var(--space-6);align-items:start;}
    @media (max-width: 980px){
      .dash-grid{grid-template-columns:1fr;}
    }
  </style>
  </head>
  <body>
    <script>renderAdminNav('admin');</script>

    <div class="admin-shell">

      <div class="admin-page-head">
        <div>
          <span class="eyebrow">Pemantauan</span>
          <h1 class="font-display">Dashboard Kepatuhan</h1>
          <p class="desc">Ringkasan kepatuhan pelaporan aktivitas harian pegawai DPMPTSP Kabupaten Morowali.</p>
        </div>
        <div class="filter-field">
          <label>Tanggal</label>
          <input type="date" class="input" id="tanggal">
        </div>
      </div>

      <div class="stat-grid" id="ringkasan">
        <p class="loading">Memuat...</p>
      </div>

      <div class="dash-grid">

        <div class="card panel">
          <div class="panel-head">
            <h2>Belum Lapor Hari Ini</h2>
            <span class="count" id="belumLaporCount"></span>
          </div>
          <div class="panel-body">
            <div id="progresLapor"></div>
            <div class="alert-list" id="belumLapor" style="margin-top:var(--space-5);">
              <p class="loading">Memuat...</p>
            </div>
            <button class="btn btn-secondary btn-block" style="margin-top:var(--space-5);">Kirim Pengingat</button>
          </div>
        </div>

        <div class="card panel">
          <div class="panel-head">
            <h2>Rekap Jam Kerja</h2>
            <span class="count">Laporan Final hari ini</span>
          </div>
          <div class="panel-body table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Pegawai</th><th class="num">Total Jam</th></tr>
              </thead>
              <tbody id="tabelJam"><tr><td colspan="2" class="loading">Memuat...</td></tr></tbody>
            </table>
          </div>
        </div>

      </div>

    </div>

    <script>
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
              if (!handleSessionExpiry(result.message, '?page=admin-login')) {
                document.getElementById('ringkasan').innerHTML = '<p class="error-message">' + result.message + '</p>';
              }
              return;
            }
            var d = result.data;
            var persen = d.totalPegawaiAktif > 0 ? Math.round((d.sudahLapor / d.totalPegawaiAktif) * 100) : 0;
            var rataMenit = d.rekapJam.length > 0
              ? Math.round(d.rekapJam.reduce(function (sum, r) { return sum + r.totalMenit; }, 0) / d.rekapJam.length)
              : 0;

            document.getElementById('ringkasan').innerHTML =
              '<div class="card stat-card accent-primary"><div class="stat-label">Pegawai Aktif</div><div class="stat-value tabular">' + d.totalPegawaiAktif + '</div><div class="stat-foot">Terdaftar di seluruh bidang</div></div>' +
              '<div class="card stat-card accent-success"><div class="stat-label">Sudah Lapor</div><div class="stat-value tabular">' + d.sudahLapor + '</div><div class="stat-foot">' + persen + '% dari pegawai aktif</div></div>' +
              '<div class="card stat-card accent-danger"><div class="stat-label">Belum Lapor</div><div class="stat-value tabular">' + d.belumLapor.length + '</div><div class="stat-foot">Perlu tindak lanjut</div></div>' +
              '<div class="card stat-card accent-gold"><div class="stat-label">Rata-rata Jam Tercatat</div><div class="stat-value tabular">' + formatMenitJam(rataMenit) + '</div><div class="stat-foot">Dari laporan Final hari ini</div></div>';

            document.getElementById('progresLapor').innerHTML =
              '<div class="progress-track"><div class="progress-fill" style="width:' + persen + '%;"></div></div>' +
              '<div class="progress-label"><span>' + d.sudahLapor + ' dari ' + d.totalPegawaiAktif + ' pegawai sudah lapor</span><span>' + persen + '%</span></div>';

            document.getElementById('belumLaporCount').textContent = d.belumLapor.length + ' pegawai';
            document.getElementById('belumLapor').innerHTML = d.belumLapor.length === 0
              ? '<p class="loading">Semua pegawai aktif sudah lapor.</p>'
              : d.belumLapor.map(function (p) {
                  return '<div class="alert-row"><div class="dot"></div>' +
                    avatarHtml(p.nama, 'cell-avatar') +
                    '<div style="flex:1;"><div class="name">' + escapeHtml(p.nama) + '</div><div class="role">' + escapeHtml(p.nip) + '</div></div></div>';
                }).join('');

            document.getElementById('tabelJam').innerHTML = d.rekapJam.length === 0
              ? '<tr><td colspan="2" class="loading">Belum ada laporan Final untuk tanggal ini.</td></tr>'
              : d.rekapJam.map(function (r) {
                  return '<tr><td><div class="cell-name">' + avatarHtml(r.nama, 'cell-avatar') +
                    '<div class="cell-name-text"><div class="n1">' + escapeHtml(r.nama) + '</div></div></div></td>' +
                    '<td class="num tabular">' + formatMenitJam(r.totalMenit) + '</td></tr>';
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

- [ ] **Step 2: Verify no dropped-in-scope ids and no reintroduced weekly columns**

Search `src/AdminDashboard.html` for `id="tanggal"`, `id="ringkasan"`, `id="belumLapor"`, `id="tabelJam"`, `id="progresLapor"` — each present once. Search for `Hari Lapor`, `Kelengkapan`, `5/5 hari` — expected zero matches (confirms the weekly columns were dropped, not silently kept as dead markup).

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/AdminDashboard.html
git commit -m "feat: replace AdminDashboard.html with template-baru layout (per-day scope, dropped weekly columns)"
```

---

## Task 8: Replace `AdminPegawai.html`

**Files:**
- Modify: `src/AdminPegawai.html`

**Interfaces:**
- Consumes: tokens/classes from Task 1, admin chrome from Task 2 (`renderAdminNav('admin/pegawai')`).
- Produces: none new. See the deviation note below — this task does NOT adopt the template's modal pattern, so there is no `openModal()`/`closeModal()` anywhere in this plan (Task 10 makes the same choice for `AdminAkun.html`, for the same reason).

**Deviation from template, with rationale**: the template's "Bidang" modal field is a `<select>` with 4 invented example options (Sekretariat, Bidang Pelayanan Perizinan, etc.) — this app's real organizational units are unknown and `savePegawai()` accepts free-text `unitKerja`. Constraining input to 4 guessed categories risks the admin being unable to enter a real unit that doesn't match the placeholder list. This field stays a free-text `<input>` (labeled "Unit Kerja", matching the current app's terminology and the backend field name), not a `<select>`. Similarly, the template's "Bidang" *filter* dropdown in the filter bar is **dropped** for the same reason — it would filter against invented categories that may not match real `unitKerja` values. Only two filters are implemented: a search-by-nama/NIP text box and a Status dropdown (Aktif/Nonaktif/Semua Status) — both filter real, known data (the Status enum matches `setPegawaiStatus()`'s exact accepted values), both purely client-side (no new server call), applied to the already-loaded `daftarPegawai` array.

- [ ] **Step 1: Replace the whole file**

Replace the entire content of `src/AdminPegawai.html` with:

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('AdminShared'); ?></head>
  <body>
    <script>renderAdminNav('admin/pegawai');</script>

    <div class="admin-shell">

      <div class="admin-page-head">
        <div>
          <span class="eyebrow">Data Induk</span>
          <h1 class="font-display">Kelola Pegawai</h1>
          <p class="desc">Data pegawai DPMPTSP yang berhak mengakses SiRajin Morowali.</p>
        </div>
        <button class="btn btn-primary" id="btnTambah">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
          Tambah Pegawai
        </button>
      </div>

      <div class="filter-bar">
        <div class="filter-field">
          <label>Cari nama / NIP</label>
          <input class="input" type="text" id="filterCari" placeholder="Cari pegawai…">
        </div>
        <div class="filter-field">
          <label>Status</label>
          <select class="select" id="filterStatus">
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      <div class="card" id="formPegawai" style="display:none; margin-bottom:var(--space-6); padding:var(--space-5);">
        <h3 class="font-display" id="formJudul">Tambah Pegawai</h3>
        <input type="hidden" id="pegawaiId">
        <div class="field" style="margin-top:var(--space-4);"><label for="pNama">Nama Lengkap</label><input class="input" type="text" id="pNama"></div>
        <div class="field"><label for="pNip">NIP</label><input class="input tabular" type="text" id="pNip" inputmode="numeric"></div>
        <div class="field"><label for="pUnit">Unit Kerja</label><input class="input" type="text" id="pUnit"></div>
        <div class="field" style="margin-bottom:0;"><label for="pJabatan">Jabatan</label><input class="input" type="text" id="pJabatan"></div>
        <p class="error-message" id="formError" style="display:none;"></p>
        <div style="display:flex; gap:10px; margin-top:var(--space-5);">
          <button class="btn btn-primary" id="btnSimpanPegawai">Simpan</button>
          <button class="btn btn-secondary" id="btnBatalPegawai">Batal</button>
        </div>
      </div>

      <div class="card panel">
        <div class="panel-head">
          <h2>Daftar Pegawai</h2>
          <span class="count" id="jumlahPegawai"></span>
        </div>
        <div class="panel-body table-wrap">
          <table class="data-table">
            <thead><tr><th>Nama</th><th>NIP</th><th>Unit Kerja</th><th>Jabatan</th><th>Status</th><th></th></tr></thead>
            <tbody id="tabelPegawai"><tr><td colspan="6" class="loading">Memuat...</td></tr></tbody>
          </table>
        </div>
      </div>

    </div>

    <script>
      var daftarPegawai = [];

      function muatPegawai() {
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result.success) {
              if (!handleSessionExpiry(result.message, '?page=admin-login')) { showToast(result.message, true); }
              return;
            }
            daftarPegawai = result.data;
            renderTabel();
          })
          .withFailureHandler(function (error) { showToast('Gagal memuat: ' + error.message, true); })
          .listPegawai(getToken());
      }

      function renderTabel() {
        var cari = document.getElementById('filterCari').value.trim().toLowerCase();
        var status = document.getElementById('filterStatus').value;
        var tampil = daftarPegawai.filter(function (p) {
          var cocokCari = !cari || p.namaLengkap.toLowerCase().indexOf(cari) > -1 || String(p.nip).indexOf(cari) > -1;
          var cocokStatus = !status || p.status === status;
          return cocokCari && cocokStatus;
        });

        document.getElementById('jumlahPegawai').textContent = tampil.length + ' dari ' + daftarPegawai.length + ' pegawai';

        var tbody = document.getElementById('tabelPegawai');
        if (tampil.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="loading">Tidak ada pegawai yang cocok.</td></tr>';
          return;
        }
        tbody.innerHTML = tampil.map(function (p) {
          var badge = p.status === 'Aktif' ? '<span class="badge badge-aktif">Aktif</span>' : '<span class="badge badge-nonaktif">Nonaktif</span>';
          var aksiToggle = p.status === 'Aktif'
            ? '<button class="icon-action danger" title="Nonaktifkan" onclick="toggleStatus(\'' + p.id + '\', \'Nonaktif\')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v9M6.2 6.2a8 8 0 1 0 11.6 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>'
            : '<button class="icon-action" title="Aktifkan" onclick="toggleStatus(\'' + p.id + '\', \'Aktif\')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v9M6.2 6.2a8 8 0 1 0 11.6 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>';
          return '<tr><td><div class="cell-name">' + avatarHtml(p.namaLengkap, 'cell-avatar') +
            '<div class="cell-name-text"><div class="n1">' + escapeHtml(p.namaLengkap) + '</div></div></div></td>' +
            '<td class="tabular">' + escapeHtml(p.nip) + '</td><td>' + escapeHtml(p.unitKerja) + '</td><td>' + escapeHtml(p.jabatan) + '</td>' +
            '<td>' + badge + '</td>' +
            '<td><div class="row-actions"><button class="icon-action" title="Edit" onclick="editPegawai(\'' + p.id + '\')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8L17.3 5.5a2 2 0 0 0-2.8 0L4 16v4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>' + aksiToggle + '</div></td></tr>';
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

      document.getElementById('filterCari').addEventListener('input', renderTabel);
      document.getElementById('filterStatus').addEventListener('change', renderTabel);

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
              if (!handleSessionExpiry(result.message, '?page=admin-login')) {
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
            else if (!handleSessionExpiry(result.message, '?page=admin-login')) { showToast(result.message, true); }
          })
          .withFailureHandler(function (error) { showToast('Gagal: ' + error.message, true); })
          .setPegawaiStatus(getToken(), id, statusBaru);
      }

      muatPegawai();
    </script>
  </body>
</html>
```

(No `#modalPegawai`/`openModal()`/`closeModal()` in this task — the template's modal pattern is replaced with the current app's inline expand/collapse `#formPegawai` card, exactly like the app already does today, since introducing a real modal here means also introducing it in `AdminAkun.html` with a colliding id, and the inline-card pattern already works and is already tested. This keeps the "one new bit of template JS" — modals — scoped to nowhere in this task; if the product owner specifically wants the modal look later, that's a follow-up, not silently done here.)

- [ ] **Step 2: Verify ids and nav call**

Search `src/AdminPegawai.html` for `renderAdminNav('admin/pegawai')`, `id="btnTambah"`, `id="tabelPegawai"`, `id="pNip"`, `id="pNama"`, `id="pJabatan"`, `id="pUnit"`, `id="pegawaiId"`, `id="formError"` — each present once.

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/AdminPegawai.html
git commit -m "feat: replace AdminPegawai.html with template-baru layout (client-side search+status filter)"
```

---

## Task 9: Replace `AdminLaporan.html`

**Files:**
- Modify: `src/AdminLaporan.html`

**Interfaces:**
- Consumes: tokens/classes from Task 1, admin chrome from Task 2 (`renderAdminNav('admin/laporan')`).

**Deviation from template, with rationale**: the template's "Status" filter and "Ekspor CSV" button aren't backed by `listLaporanArsip()` — Status is added here as a **client-side** filter over the array the server already returns (same technique as Task 8, real enum values `Final`/`Tersimpan`/`Draft`/`Belum`... — actually `AktivitasService.js`'s status column is only ever `'Draft'` or `'Final'`, so the filter options are just those two + "Semua Status", not the template's extra `Tersimpan`/`Belum`, which don't correspond to any real status value this backend produces). "Ekspor CSV" has no server support at all (no such endpoint exists) — dropped entirely per spec §6.10, not left as a dead button.

- [ ] **Step 1: Replace the whole file**

Replace the entire content of `src/AdminLaporan.html` with:

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('AdminShared'); ?></head>
  <body>
    <script>renderAdminNav('admin/laporan');</script>

    <div class="admin-shell">

      <div class="admin-page-head">
        <div>
          <span class="eyebrow">Arsip · Baca saja</span>
          <h1 class="font-display">Kelola Laporan</h1>
          <p class="desc">Arsip seluruh laporan aktivitas pegawai. Isi laporan tidak dapat diubah dari panel admin.</p>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-field">
          <label>Dari tanggal</label>
          <input class="input" type="date" id="filterMulai">
        </div>
        <div class="filter-field">
          <label>Sampai tanggal</label>
          <input class="input" type="date" id="filterAkhir">
        </div>
        <div class="filter-field">
          <label>Pegawai</label>
          <select class="select" id="filterPegawai"><option value="">Semua Pegawai</option></select>
        </div>
        <div class="filter-field">
          <label>Status</label>
          <select class="select" id="filterStatus">
            <option value="">Semua Status</option>
            <option value="Final">Final</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
        <button class="btn btn-secondary" id="btnFilter">Terapkan Filter</button>
      </div>

      <div class="card panel">
        <div class="panel-head">
          <h2>Arsip Laporan</h2>
          <span class="count" id="jumlahArsip"></span>
        </div>
        <div class="panel-body table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Tanggal</th><th>Pegawai</th><th>Jam</th><th>Aktivitas</th><th>Status</th><th></th></tr>
            </thead>
            <tbody id="tabelArsip"><tr><td colspan="6" class="loading">Memuat...</td></tr></tbody>
          </table>
        </div>
      </div>

    </div>

    <script>
      var hasilArsip = [];

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

      function renderArsip() {
        var statusFilter = document.getElementById('filterStatus').value;
        var tampil = statusFilter ? hasilArsip.filter(function (l) { return l.status === statusFilter; }) : hasilArsip;

        document.getElementById('jumlahArsip').textContent = tampil.length + ' laporan';

        if (tampil.length === 0) {
          document.getElementById('tabelArsip').innerHTML = '<tr><td colspan="6" class="loading">Tidak ada laporan yang cocok dengan filter.</td></tr>';
          return;
        }
        document.getElementById('tabelArsip').innerHTML = tampil.map(function (l) {
          return '<tr><td class="tabular" style="white-space:nowrap;">' + escapeHtml(l.tanggal) + '</td>' +
            '<td><div class="cell-name">' + avatarHtml(l.nama, 'cell-avatar') + '<div class="cell-name-text"><div class="n1">' + escapeHtml(l.nama) + '</div></div></div></td>' +
            '<td class="tabular" style="white-space:nowrap;">' + escapeHtml(l.jamMulai) + '-' + escapeHtml(l.jamSelesai) + '</td>' +
            '<td style="max-width:340px;">' + escapeHtml(l.namaAktivitas) + '</td><td>' + formatBadge(l.status) + '</td>' +
            '<td>' + (l.linkPdf ? '<div class="row-actions"><a href="' + l.linkPdf + '" target="_blank" class="icon-action" title="Unduh PDF"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v13m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>' : '-') + '</td></tr>';
        }).join('');
      }

      function muatArsip() {
        var filter = {
          nip: document.getElementById('filterPegawai').value,
          tanggalMulai: document.getElementById('filterMulai').value,
          tanggalAkhir: document.getElementById('filterAkhir').value
        };
        document.getElementById('tabelArsip').innerHTML = '<tr><td colspan="6" class="loading">Memuat...</td></tr>';

        google.script.run
          .withSuccessHandler(function (result) {
            if (!result.success) {
              if (!handleSessionExpiry(result.message, '?page=admin-login')) {
                document.getElementById('tabelArsip').innerHTML = '<tr><td colspan="6" class="error-message">' + result.message + '</td></tr>';
              }
              return;
            }
            hasilArsip = result.data;
            renderArsip();
          })
          .withFailureHandler(function (error) {
            document.getElementById('tabelArsip').innerHTML = '<tr><td colspan="6" class="error-message">Gagal memuat: ' + error.message + '</td></tr>';
          })
          .listLaporanArsip(getToken(), filter);
      }

      document.getElementById('btnFilter').addEventListener('click', muatArsip);
      document.getElementById('filterStatus').addEventListener('change', renderArsip);
      muatDaftarPegawaiFilter();
      muatArsip();
    </script>
  </body>
</html>
```

- [ ] **Step 2: Verify ids and that no dead "Ekspor CSV" button was carried over**

Search `src/AdminLaporan.html` for `renderAdminNav('admin/laporan')`, `id="filterMulai"`, `id="filterAkhir"`, `id="filterPegawai"`, `id="btnFilter"`, `id="tabelArsip"` — each present once. Search for `Ekspor CSV` — expected zero matches.

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/AdminLaporan.html
git commit -m "feat: replace AdminLaporan.html with template-baru layout (dropped unsupported CSV export)"
```

---

## Task 10: Replace `AdminAkun.html`

**Files:**
- Modify: `src/AdminAkun.html`

**Interfaces:**
- Consumes: tokens/classes from Task 1, admin chrome from Task 2 (`renderAdminNav('admin/akun')`).
- Produces: none new.

**Deviation from template, with rationale**: same as Task 8 — the modal pattern (`id="modalPegawai"`, would collide with `AdminPegawai.html`) is not used; the inline-card expand/collapse pattern already working in the current app is used instead. This page also has a SuperAdmin-only access gate in the current app (`listAdmin()`/`saveAdmin()`/etc. all reject non-SuperAdmin server-side; the client additionally hides the whole page body and shows an access-denied message if the server says so) — that gate (`id="kontenHalaman"` wrapper + `id="aksesError"`) is carried over unchanged.

- [ ] **Step 1: Replace the whole file**

Replace the entire content of `src/AdminAkun.html` with:

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('AdminShared'); ?></head>
  <body>
    <script>renderAdminNav('admin/akun');</script>

    <p class="error-message" id="aksesError" style="display:none;"></p>

    <div id="kontenHalaman">
      <div class="admin-shell">

        <div class="admin-page-head">
          <div>
            <span class="eyebrow">Khusus SuperAdmin</span>
            <h1 class="font-display">Kelola Akun Admin</h1>
            <p class="desc">Mengatur siapa saja yang punya akses sebagai admin atau superadmin di SiRajin Morowali.</p>
          </div>
          <button class="btn btn-primary" id="btnTambah">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
            Tambah Akun Admin
          </button>
        </div>

        <div class="card" style="padding:var(--space-4) var(--space-5);margin-bottom:var(--space-6);display:flex;gap:12px;align-items:flex-start;border-left:3px solid var(--gold);">
          <svg width="17" height="17" style="flex-shrink:0;margin-top:2px;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#B4863C" stroke-width="1.5"/><path d="M12 11v5.5M12 8v.01" stroke="#B4863C" stroke-width="1.6" stroke-linecap="round"/></svg>
          <p style="font-size:13px;color:var(--ink-soft);line-height:1.55;">Halaman ini hanya bisa diakses oleh SuperAdmin. Perubahan akun admin akan tercatat pada log aktivitas sistem.</p>
        </div>

        <div class="card" id="formAdmin" style="display:none; margin-bottom:var(--space-6); padding:var(--space-5);">
          <h3 class="font-display" id="formJudul">Tambah Admin</h3>
          <input type="hidden" id="adminId">
          <div class="field" style="margin-top:var(--space-4);"><label for="aNama">Nama</label><input class="input" type="text" id="aNama"></div>
          <div class="field"><label for="aNip">NIP</label><input class="input tabular" type="text" id="aNip" inputmode="numeric"></div>
          <div class="field"><label for="aLevel">Level</label>
            <select class="select" id="aLevel"><option value="Admin">Admin</option><option value="SuperAdmin">SuperAdmin</option></select>
          </div>
          <div class="field" style="margin-bottom:0;"><label for="aPassword">Password (kosongkan kalau tidak ingin diubah saat edit)</label><input class="input" type="password" id="aPassword"></div>
          <p class="error-message" id="formError" style="display:none;"></p>
          <div style="display:flex; gap:10px; margin-top:var(--space-5);">
            <button class="btn btn-primary" id="btnSimpanAdmin">Simpan</button>
            <button class="btn btn-secondary" id="btnBatalAdmin">Batal</button>
          </div>
        </div>

        <div class="card panel">
          <div class="panel-head">
            <h2>Daftar Akun Admin</h2>
            <span class="count" id="jumlahAdmin"></span>
          </div>
          <div class="panel-body table-wrap">
            <table class="data-table">
              <thead><tr><th>Nama</th><th>NIP</th><th>Level</th><th>Status</th><th></th></tr></thead>
              <tbody id="tabelAdmin"><tr><td colspan="5" class="loading">Memuat...</td></tr></tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <script>
      var daftarAdmin = [];

      function muatAdmin() {
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result.success) {
              if (handleSessionExpiry(result.message, '?page=admin-login')) return;
              document.getElementById('kontenHalaman').style.display = 'none';
              var errEl = document.getElementById('aksesError');
              errEl.textContent = result.message;
              errEl.style.display = 'block';
              return;
            }
            daftarAdmin = result.data;
            renderTabel();
          })
          .withFailureHandler(function (error) { showToast('Gagal memuat: ' + error.message, true); })
          .listAdmin(getToken());
      }

      function renderTabel() {
        document.getElementById('jumlahAdmin').textContent = daftarAdmin.length + ' akun';
        var tbody = document.getElementById('tabelAdmin');
        if (daftarAdmin.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="loading">Belum ada admin.</td></tr>';
          return;
        }
        tbody.innerHTML = daftarAdmin.map(function (a) {
          var badge = a.status === 'Aktif' ? '<span class="badge badge-aktif">Aktif</span>' : '<span class="badge badge-nonaktif">Nonaktif</span>';
          var aksiToggle = a.status === 'Aktif'
            ? '<button class="icon-action danger" title="Nonaktifkan" onclick="toggleStatus(\'' + a.id + '\', \'Nonaktif\')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v9M6.2 6.2a8 8 0 1 0 11.6 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>'
            : '<button class="icon-action" title="Aktifkan" onclick="toggleStatus(\'' + a.id + '\', \'Aktif\')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v9M6.2 6.2a8 8 0 1 0 11.6 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>';
          return '<tr><td><div class="cell-name">' + avatarHtml(a.nama, 'cell-avatar') +
            '<div class="cell-name-text"><div class="n1">' + escapeHtml(a.nama) + '</div></div></div></td>' +
            '<td class="tabular">' + escapeHtml(a.nip) + '</td><td>' + escapeHtml(a.level) + '</td>' +
            '<td>' + badge + '</td>' +
            '<td><div class="row-actions"><button class="icon-action" title="Edit" onclick="editAdmin(\'' + a.id + '\')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8L17.3 5.5a2 2 0 0 0-2.8 0L4 16v4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>' + aksiToggle + '</div></td></tr>';
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
              if (!handleSessionExpiry(result.message, '?page=admin-login')) {
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
            else if (!handleSessionExpiry(result.message, '?page=admin-login')) { showToast(result.message, true); }
          })
          .withFailureHandler(function (error) { showToast('Gagal: ' + error.message, true); })
          .setAdminStatus(getToken(), id, statusBaru);
      }

      muatAdmin();
    </script>
  </body>
</html>
```

- [ ] **Step 2: Verify ids, the SuperAdmin gate, and no modal**

Search `src/AdminAkun.html` for `renderAdminNav('admin/akun')`, `id="kontenHalaman"`, `id="aksesError"`, `id="btnTambah"`, `id="tabelAdmin"`, `id="aNip"`, `id="aNama"`, `id="aLevel"`, `id="aPassword"`, `id="adminId"`, `id="formError"` — each present once. Search for `modalPegawai`, `modalAdmin`, `openModal` — expected zero matches.

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/AdminAkun.html
git commit -m "feat: replace AdminAkun.html with template-baru layout"
```

---

## Task 11: Replace `Aktivitas.html`

**Files:**
- Modify: `src/Aktivitas.html`

**Interfaces:**
- Consumes: tokens/classes from Task 1.
- Produces: none new. Reuses the existing `getMySession(token)` server function (already used by admin pages) to fetch the logged-in pegawai's `nama`/`jabatan` for the header "who" block — this is not a new server capability, just a new caller of an existing one.

**Deviations from template, with rationale**:
- The `.date-scroller` chip row (Kam/Jum/Sab…) is a fixed 5-day static display with no way to pick an arbitrary date — replaced with a real `<input type="date" id="tanggal">`, placed in the light `.container` area (matching where `AdminDashboard.html`'s date filter lives) rather than inside the dark `.app-header`, since a light input box was never designed to sit on the header's dark green background.
- The summary strip (Aktivitas / Jam tercatat / Belum final) is computed client-side from the same array `listAktivitasByDate()` already returns (`durasiMenit` per row is already in the payload) — no new server data needed.

- [ ] **Step 1: Replace the whole file**

Replace the entire content of `src/Aktivitas.html` with:

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?>
  <style>
    body{background:var(--bg);padding-bottom:96px;}
    .app-header{
      position:sticky;top:0;z-index:20;
      background:var(--primary);color:#F5F1E5;
      padding:var(--space-5) var(--space-5) var(--space-6);
      border-radius:0 0 20px 20px;
      box-shadow:var(--shadow-md);
    }
    .app-header-row{display:flex;align-items:center;justify-content:space-between;}
    .app-header .who{display:flex;align-items:center;gap:10px;}
    .avatar{
      width:38px;height:38px;border-radius:50%;background:var(--gold);color:#3A2C10;
      display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:15px;
    }
    .who-text .name{font-size:13.5px;font-weight:700;}
    .who-text .role{font-size:11px;color:#BFD1C7;}
    .icon-btn{
      width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.08);
      display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.14);
    }
    .app-header h1{color:#FBF8F1;font-size:23px;margin-top:var(--space-5);}
    .app-header .sub{color:#BFD1C7;font-size:12.5px;margin-top:4px;}

    .container{max-width:640px;margin:0 auto;padding:var(--space-5);}

    .summary-strip{
      display:flex;justify-content:space-between;background:var(--surface);border:1px solid var(--border-soft);
      border-radius:var(--radius-md);padding:var(--space-4) var(--space-5);margin-top:-30px;position:relative;z-index:10;
      box-shadow:var(--shadow-sm);
    }
    .summary-item{text-align:center;flex:1;}
    .summary-item + .summary-item{border-left:1px solid var(--border-soft);}
    .summary-item b{display:block;font-family:var(--font-display);font-size:19px;}
    .summary-item span{font-size:11px;color:var(--ink-faint);}

    .section-label{
      display:flex;align-items:center;justify-content:space-between;margin:var(--space-6) 0 var(--space-3);
    }
    .section-label h2{font-size:14px;color:var(--ink-soft);font-family:var(--font-ui);font-weight:600;text-transform:uppercase;letter-spacing:.04em;}

    .timeline{position:relative;}
    .timeline::before{
      content:"";position:absolute;left:19px;top:10px;bottom:10px;width:1.5px;
      background:repeating-linear-gradient(to bottom, var(--border) 0 5px, transparent 5px 9px);
    }
    .activity-item{position:relative;padding-left:46px;margin-bottom:var(--space-4);}
    .activity-dot{
      position:absolute;left:12px;top:20px;width:15px;height:15px;border-radius:50%;
      background:var(--surface);border:2.5px solid var(--primary);
    }
    .activity-item.is-draft .activity-dot{border-color:var(--warning);}
    .activity-item.is-final .activity-dot{border-color:var(--gold);background:var(--gold);}

    .act-card{padding:var(--space-4) var(--space-5);}
    .act-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}
    .act-time{font-family:var(--font-display);font-weight:600;font-size:15px;color:var(--primary);}
    .act-name{font-size:14.5px;font-weight:600;margin-top:4px;line-height:1.4;}
    .act-actions{
      display:flex;gap:14px;margin-top:var(--space-4);padding-top:var(--space-3);
      border-top:1px solid var(--border-soft);flex-wrap:wrap;
    }
    .act-actions a, .act-actions button{
      font-size:12.5px;font-weight:600;color:var(--ink-soft);display:flex;align-items:center;gap:5px;
      background:none;border:none;padding:0;cursor:pointer;
    }
    .act-actions a:hover, .act-actions button:hover{color:var(--primary);}
    .act-actions .danger{color:var(--danger);}
    .act-actions .finalisasi{color:var(--gold);}

    .fab-wrap{
      position:fixed;left:0;right:0;bottom:0;padding:var(--space-4) var(--space-5) calc(var(--space-4) + env(safe-area-inset-bottom));
      background:linear-gradient(to top, var(--bg) 60%, transparent);
      display:flex;justify-content:center;z-index:30;
    }
    .fab-wrap .btn{max-width:640px;box-shadow:var(--shadow-md);}

    @media (min-width:720px){
      .app-header{border-radius:0 0 24px 24px;padding:var(--space-6) var(--space-8);}
      .container{max-width:820px;padding:var(--space-6) var(--space-8);}
      .fab-wrap{position:static;background:none;padding:0;justify-content:flex-end;margin-top:var(--space-6);}
      .fab-wrap .btn{width:auto;}
    }
  </style>
  </head>
  <body>
    <div class="app-header">
      <div class="app-header-row">
        <div class="who">
          <div class="avatar" id="avatarPegawai">--</div>
          <div class="who-text">
            <div class="name" id="namaPegawai">Memuat…</div>
            <div class="role" id="jabatanPegawai"></div>
          </div>
        </div>
        <a href="#" onclick="keluar(); return false;" class="icon-btn" title="Keluar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="#F5F1E5" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
      <h1 class="font-display">Aktivitas Saya</h1>
      <p class="sub">Rekap aktivitas &amp; bukti dukung kinerja harian Anda.</p>
    </div>

    <div class="container">

      <div class="field" style="max-width:220px;margin-bottom:var(--space-5);">
        <label for="tanggal">Tanggal</label>
        <input type="date" class="input" id="tanggal">
      </div>

      <div class="summary-strip" id="summaryStrip">
        <div class="summary-item"><b class="tabular">0</b><span>Aktivitas</span></div>
        <div class="summary-item"><b class="tabular">0j 0m</b><span>Jam tercatat</span></div>
        <div class="summary-item"><b class="tabular">0</b><span>Belum final</span></div>
      </div>

      <div class="section-label"><h2 id="labelTanggal"></h2></div>

      <div class="timeline" id="daftarLaporan">
        <p class="loading">Memuat...</p>
      </div>

    </div>

    <div class="fab-wrap">
      <a href="?page=aktivitas/tambah" class="btn btn-primary btn-block btn-lg">+ Tambah Aktivitas</a>
    </div>

    <script>
      requireLogin();

      function keluar() {
        clearToken();
        redirectTop('?page=home', 'Berhasil keluar. Klik di sini →');
      }

      // Inline initials logic (not a call to Task 2's initials()/avatarHtml() —
      // those live in AdminShared.html, which this pegawai-facing page never
      // includes; duplicating this ~2-line computation here is intentional,
      // not an oversight).
      google.script.run
        .withSuccessHandler(function (result) {
          if (!result.success) return;
          var s = result.session;
          document.getElementById('namaPegawai').textContent = s.nama;
          document.getElementById('jabatanPegawai').textContent = s.jabatan || '';
          var kata = String(s.nama || '').trim().split(/\s+/).filter(Boolean);
          document.getElementById('avatarPegawai').textContent = kata.length > 1 ? (kata[0][0] + kata[kata.length - 1][0]).toUpperCase() : (kata[0] || '?').substring(0, 2).toUpperCase();
        })
        .withFailureHandler(function () {})
        .getMySession(getToken());

      function formatBadge(status) {
        if (status === 'Final') return '<span class="badge badge-final">Final</span>';
        return '<span class="badge badge-tersimpan">Tersimpan</span>';
      }

      function formatMenitJam(menit) {
        var jam = Math.floor(menit / 60);
        var sisaMenit = menit % 60;
        return jam + 'j ' + sisaMenit + 'm';
      }

      function renderLaporan(list) {
        var container = document.getElementById('daftarLaporan');

        var totalMenit = list.reduce(function (sum, l) { return sum + (l.durasiMenit || 0); }, 0);
        var belumFinal = list.filter(function (l) { return l.status !== 'Final'; }).length;
        document.getElementById('summaryStrip').innerHTML =
          '<div class="summary-item"><b class="tabular">' + list.length + '</b><span>Aktivitas</span></div>' +
          '<div class="summary-item"><b class="tabular">' + formatMenitJam(totalMenit) + '</b><span>Jam tercatat</span></div>' +
          '<div class="summary-item"><b class="tabular">' + belumFinal + '</b><span>Belum final</span></div>';

        if (list.length === 0) {
          container.innerHTML = '<p class="loading">Belum ada laporan untuk tanggal ini.</p>';
          return;
        }
        container.innerHTML = list.map(function (l) {
          var kelas = l.status === 'Final' ? 'activity-item is-final' : 'activity-item';
          var aksiTambahan = l.status === 'Draft'
            ? '<a href="?page=aktivitas/tambah&id=' + l.idLaporan + '">Lanjutkan isi</a>' +
              ' <button class="finalisasi" onclick="finalisasiLaporan(\'' + l.idLaporan + '\')">Finalisasi</button>' +
              ' <button class="danger" onclick="hapusLaporan(\'' + l.idLaporan + '\')">Hapus</button>'
            : '<a href="?page=aktivitas/tambah&id=' + l.idLaporan + '">Edit</a>';
          return '<div class="' + kelas + '">' +
            '<div class="activity-dot"></div>' +
            '<div class="card act-card">' +
            '<div class="act-card-top"><div><div class="act-time tabular">' + l.jamMulai + ' – ' + l.jamSelesai + '</div>' +
            '<div class="act-name">' + l.namaAktivitas + '</div></div>' + formatBadge(l.status) + '</div>' +
            '<div class="act-actions"><a href="' + l.linkPdf + '" target="_blank">Unduh PDF</a> ' + aksiTambahan + '</div>' +
            '</div></div>';
        }).join('');
      }

      function muatLaporan() {
        var tanggal = document.getElementById('tanggal').value;
        document.getElementById('labelTanggal').textContent = tanggal;
        document.getElementById('daftarLaporan').innerHTML = '<p class="loading">Memuat...</p>';
        google.script.run
          .withSuccessHandler(function (result) {
            if (result.success) {
              renderLaporan(result.data);
            } else if (!handleSessionExpiry(result.message)) {
              document.getElementById('daftarLaporan').innerHTML = '<p class="error-message">' + result.message + '</p>';
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
            if (result.success) { muatLaporan(); } else if (!handleSessionExpiry(result.message)) { showToast(result.message, true); }
          })
          .withFailureHandler(function (error) { showToast('Gagal: ' + error.message, true); })
          .deleteAktivitas(getToken(), id);
      }

      function finalisasiLaporan(id) {
        if (!confirm('Setelah difinalisasi, laporan tidak bisa dihapus. Lanjutkan?')) return;
        google.script.run
          .withSuccessHandler(function (result) {
            if (result.success) { muatLaporan(); } else if (!handleSessionExpiry(result.message)) { showToast(result.message, true); }
          })
          .withFailureHandler(function (error) { showToast('Gagal: ' + error.message, true); })
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

(`formatBadge` maps our two real statuses — `Draft`→`badge-tersimpan` (visually "in progress, saved"), `Final`→`badge-final` — the template's third example state, `badge-belum`/"Belum", doesn't correspond to anything `AktivitasService.js` produces here, so it's not used. `keluar()` replaces the template's plain `href="./01-landing.html"` logout link with a real `clearToken()` + `redirectTop()` call, exactly matching the pattern the admin pages already use for logout — the template file has no working logout logic at all, just a dead link to the landing page that would leave the session token in place.)

- [ ] **Step 2: Verify ids/functions the page depends on**

Search `src/Aktivitas.html` for `id="tanggal"`, `id="daftarLaporan"`, `requireLogin()`, `muatLaporan`, `hapusLaporan`, `finalisasiLaporan`, `getMySession` — all present.

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/Aktivitas.html
git commit -m "feat: replace Aktivitas.html with template-baru timeline layout"
```

---

## Task 12: Replace `TambahAktivitas.html` — most complex task, do last

**Files:**
- Modify: `src/TambahAktivitas.html`

**Interfaces:**
- Consumes: tokens/classes from Task 1.
- Produces: none new.

**Critical correctness note — read before implementing**: the template's title markup is:
```html
<div class="title font-display">Tambah Aktivitas
  <span class="sub">Sabtu, 22 Agustus 2026</span>
</div>
```
If `id="judulHalaman"` were placed on that OUTER div (the natural-looking place, since it wraps the visible title text), the existing edit-mode JS line `document.getElementById('judulHalaman').textContent = 'Edit Aktivitas';` would **wipe out the nested `.sub` span** — `.textContent =` replaces ALL child nodes, not just the direct text. This plan avoids that entirely by dropping the `.sub` subtitle line (the current app has no such subtitle feature, so this isn't a loss of anything that exists today) and putting `id="judulHalaman"` directly on a title element with no children, per the markup below.

**Deviations from template, with rationale**:
- The template's own `<script>` (`addPoint`/`removePoint`/`handlePhoto`, using `FileReader` with no resize/compression) is discarded entirely — this task keeps using the current app's `kompresGambar()` (resizes to max 1600px, JPEG quality 0.8) and `ambilFotoBase64()` (indexed slot handling so async compression completing out of order still maps to the correct `{{FOTO_1}}`/`{{FOTO_2}}`), unchanged.
- Point-uraian **remove** is kept (matches the template's visible `point-remove` X button) — it's small, self-contained, client-only (just DOM removal + renumbering, exactly mirroring the template's own `removePoint`/`renumberPoints` logic pattern, adapted to fire alongside the existing `tambahPoinUraian()`), and leaving the X button in the markup with no handler behind it would be a worse outcome (a visibly broken control) than a minimal, safe implementation of it.
- Photo **preview thumbnails** and the photo-remove-X overlay are **not** ported — the current app has no such feature, and doing it well means integrating `FileReader`-based preview with `kompresGambar()`'s own separate `FileReader` read (two reads of the same file, more surface for bugs) for a feature nobody asked for. The photo slots keep their template *styling* (dashed-border drop-zone look) but stay plain file inputs, exactly like the current app.
- `id="pointList"` → `id="daftarUraian"`, `<input type="text" class="uraian-poin">` → `<textarea class="textarea uraian-poin">` (still has `.value`, so the existing `document.querySelectorAll('.uraian-poin')...map(el => el.value)` in the save handler needs no change) — matches spec §6.5.

- [ ] **Step 1: Replace the whole file**

Replace the entire content of `src/TambahAktivitas.html` with:

```html
<!DOCTYPE html>
<html>
  <head><base target="_top"><?!= include('Shared'); ?>
  <style>
    body{background:var(--bg);padding-bottom:100px;}
    .form-header{
      position:sticky;top:0;z-index:20;background:var(--surface);
      border-bottom:1px solid var(--border-soft);
      padding:var(--space-4) var(--space-5);
      display:flex;align-items:center;gap:12px;
    }
    .form-header .icon-btn{
      width:34px;height:34px;border-radius:50%;background:var(--surface-alt);display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .form-header .title{font-size:16px;}

    .container{max-width:640px;margin:0 auto;padding:var(--space-5);}
    .form-section{margin-bottom:var(--space-6);}
    .form-section-title{
      font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--primary);
      margin-bottom:var(--space-4);display:flex;align-items:center;gap:8px;
    }
    .form-section-title::before{content:"";width:14px;height:1.5px;background:var(--accent);}

    .card-pad{padding:var(--space-5);}

    .row-time{display:grid;grid-template-columns:1fr auto 1fr;gap:var(--space-3);align-items:end;}
    .row-time .sep{padding-bottom:14px;color:var(--ink-faint);font-size:13px;}

    .point-list{display:flex;flex-direction:column;gap:10px;}
    .point-item{display:flex;align-items:flex-start;gap:10px;}
    .point-num{
      width:26px;height:26px;border-radius:50%;background:var(--primary-soft);color:var(--primary);
      font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:9px;
      font-family:var(--font-display);
    }
    .point-item textarea{resize:vertical;min-height:46px;flex:1;}
    .point-remove{
      flex-shrink:0;width:34px;height:34px;border-radius:8px;background:transparent;border:none;
      display:flex;align-items:center;justify-content:center;color:var(--ink-faint);cursor:pointer;margin-top:6px;
    }
    .point-remove:hover{color:var(--danger);background:var(--danger-soft);}
    .add-point-btn{
      display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--primary);
      background:none;border:none;cursor:pointer;padding:10px 2px;
    }
    .add-point-btn:hover{text-decoration:underline;}

    .photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);}
    .photo-slot{
      position:relative;aspect-ratio:1/1;border-radius:var(--radius-md);border:1.5px dashed var(--border);
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
      color:var(--ink-faint);background:var(--surface-alt);overflow:hidden;cursor:pointer;
    }
    .photo-slot span{font-size:11.5px;font-weight:600;}
    .photo-slot input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;}

    .save-bar{
      position:fixed;left:0;right:0;bottom:0;padding:var(--space-4) var(--space-5) calc(var(--space-4) + env(safe-area-inset-bottom));
      background:linear-gradient(to top, var(--bg) 65%, transparent);
      display:flex;gap:10px;justify-content:center;z-index:30;
    }
    .save-bar .btn{max-width:640px;}
    .save-bar .btn-secondary{flex:0 0 auto;}
    .save-bar .btn-primary{flex:1;}

    @media (min-width:720px){
      .form-header{padding:var(--space-5) var(--space-8);}
      .container{max-width:760px;padding:var(--space-7) var(--space-8);}
      .photo-grid{grid-template-columns:repeat(4,1fr);max-width:420px;}
      .save-bar{position:static;background:none;padding:0;justify-content:flex-end;margin-top:var(--space-7);}
      .save-bar .btn-primary{flex:none;padding-left:36px;padding-right:36px;}
    }
  </style>
  </head>
  <body>
    <div class="form-header">
      <a href="?page=aktivitas" class="icon-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m0 0 6-6m-6 6 6 6" stroke="#211F19" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <div class="title font-display" id="judulHalaman">Tambah Aktivitas</div>
    </div>

    <div class="container">

      <div class="form-section">
        <div class="form-section-title">Waktu &amp; Tanggal</div>
        <div class="card card-pad">
          <div class="field" style="margin-bottom:var(--space-4);">
            <label for="tanggal">Tanggal</label>
            <input type="date" class="input" id="tanggal">
          </div>
          <div class="row-time">
            <div class="field" style="margin-bottom:0;">
              <label for="jamMulai">Jam mulai</label>
              <input type="time" class="input tabular" id="jamMulai">
            </div>
            <div class="sep">–</div>
            <div class="field" style="margin-bottom:0;">
              <label for="jamSelesai">Jam selesai</label>
              <input type="time" class="input tabular" id="jamSelesai">
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">Aktivitas</div>
        <div class="card card-pad">
          <div class="field" style="margin-bottom:0;">
            <label for="namaAktivitas">Nama aktivitas</label>
            <input type="text" class="input" id="namaAktivitas" placeholder="Contoh: Peninjauan lapangan lokasi usaha pemohon IMB">
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">Uraian Kegiatan</div>
        <div class="card card-pad">
          <div class="point-list" id="daftarUraian"></div>
          <button type="button" class="add-point-btn" id="btnTambahPoin">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            Tambah poin uraian
          </button>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">Foto Kegiatan</div>
        <div class="card card-pad">
          <label id="labelFoto" style="display:block;font-size:13px;font-weight:600;color:var(--ink-soft);margin-bottom:10px;">Foto Kegiatan (1-2 foto)</label>
          <p class="hint" id="fotoLamaInfo" style="display:none;margin-bottom:12px;line-height:1.5;">Laporan ini sudah punya foto. Kosongkan SEMUA kolom foto di bawah untuk mempertahankan foto lama apa adanya. Kalau kamu pilih foto baru di salah satu kolom saja, SEMUA foto lama akan diganti dengan foto yang baru kamu pilih (bukan cuma slot yang kamu isi) — jadi pilih ulang semua foto yang masih ingin kamu pakai.</p>
          <div class="photo-grid">
            <label class="photo-slot" id="slot0">
              <input type="file" id="foto1" accept="image/*" capture="environment">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 8a2 2 0 0 1 2-2h1.2l.9-1.6A1.5 1.5 0 0 1 9.4 3.6h5.2a1.5 1.5 0 0 1 1.3.8L16.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="#8A8471" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4" stroke="#8A8471" stroke-width="1.5"/></svg>
              <span>Foto 1</span>
            </label>
            <label class="photo-slot" id="slot1">
              <input type="file" id="foto2" accept="image/*" capture="environment">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 8a2 2 0 0 1 2-2h1.2l.9-1.6A1.5 1.5 0 0 1 9.4 3.6h5.2a1.5 1.5 0 0 1 1.3.8L16.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="#8A8471" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4" stroke="#8A8471" stroke-width="1.5"/></svg>
              <span>Foto 2</span>
            </label>
          </div>
          <p class="hint" style="margin-top:12px;">Maksimal 2 foto, langsung dari kamera HP atau galeri.</p>
        </div>
      </div>

    </div>

    <div class="save-bar">
      <a href="?page=aktivitas" class="btn btn-secondary btn-lg">Batal</a>
      <button type="button" class="btn btn-primary btn-lg" id="btnSimpan">Simpan Aktivitas</button>
    </div>
    <p class="error-message" id="errorMsg" style="display:none;text-align:center;padding:0 var(--space-5);"></p>

    <script>
      requireLogin();

      var idLaporan = null;
      var isEditMode = false;

      var jumlahPoin = 0;
      function renumberPoints() {
        var nums = document.querySelectorAll('#daftarUraian .point-num');
        for (var i = 0; i < nums.length; i++) { nums[i].textContent = i + 1; }
      }
      function tambahPoinUraian(nilaiAwal) {
        jumlahPoin++;
        var div = document.createElement('div');
        div.className = 'point-item';
        div.innerHTML = '<div class="point-num">' + jumlahPoin + '</div>' +
          '<textarea class="textarea uraian-poin" placeholder="Uraikan poin kegiatan…"></textarea>' +
          '<button type="button" class="point-remove" onclick="hapusPoinUraian(this)">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>';
        document.getElementById('daftarUraian').appendChild(div);
        if (nilaiAwal) div.querySelector('textarea').value = nilaiAwal;
      }
      function hapusPoinUraian(btn) {
        var list = document.getElementById('daftarUraian');
        if (list.children.length <= 1) return;
        btn.closest('.point-item').remove();
        renumberPoints();
      }
      document.getElementById('btnTambahPoin').addEventListener('click', function () { tambahPoinUraian(); });

      var today = new Date().toISOString().split('T')[0];

      google.script.url.getLocation(function (location) {
        idLaporan = location.parameter.id || null;
        isEditMode = !!idLaporan;

        if (isEditMode) {
          document.getElementById('judulHalaman').textContent = 'Edit Aktivitas';
          document.getElementById('labelFoto').textContent = 'Foto Kegiatan (opsional saat edit)';
          document.getElementById('fotoLamaInfo').style.display = 'block';
          google.script.run
            .withSuccessHandler(function (result) {
              if (!result.success) {
                if (!handleSessionExpiry(result.message)) {
                  document.getElementById('errorMsg').textContent = result.message;
                  document.getElementById('errorMsg').style.display = 'block';
                }
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
          tambahPoinUraian();
        }
      });

      function kompresGambar(file, callback, onError) {
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
          img.onerror = onError;
          img.src = e.target.result;
        };
        reader.onerror = onError;
        reader.readAsDataURL(file);
      }

      function ambilFotoBase64(callback, onError) {
        var fileInputs = [document.getElementById('foto1'), document.getElementById('foto2')];
        var hasil = [null, null];
        var selesai = 0;
        var gagal = false;
        var totalFile = fileInputs.filter(function (el) { return el.files.length > 0; }).length;

        if (totalFile === 0) { callback([]); return; }

        fileInputs.forEach(function (el, idx) {
          if (el.files.length === 0) return;
          kompresGambar(el.files[0], function (base64) {
            if (gagal) return;
            hasil[idx] = base64;
            selesai++;
            if (selesai === totalFile) callback(hasil.filter(Boolean));
          }, function () {
            if (gagal) return;
            gagal = true;
            onError();
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
            btn.textContent = 'Simpan Aktivitas';
            errorEl.textContent = 'Minimal 1 foto kegiatan wajib diunggah.';
            errorEl.style.display = 'block';
            return;
          }

          if (isEditMode && fotoBase64.length > 0) {
            if (!confirm('Ini akan mengganti SEMUA foto lama laporan ini dengan foto yang baru kamu pilih. Foto lama yang tidak kamu unggah ulang akan hilang. Lanjutkan?')) {
              btn.disabled = false;
              btn.textContent = 'Simpan Aktivitas';
              return;
            }
          }

          google.script.run
            .withSuccessHandler(function (result) {
              btn.disabled = false;
              btn.textContent = 'Simpan Aktivitas';
              if (result.success) {
                redirectTop('?page=aktivitas', 'Laporan tersimpan. Klik di sini untuk lanjut →');
              } else if (!handleSessionExpiry(result.message)) {
                errorEl.textContent = result.message;
                errorEl.style.display = 'block';
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
        }, function () {
          btn.disabled = false;
          btn.textContent = 'Simpan Aktivitas';
          errorEl.textContent = 'Salah satu foto gagal diproses (kemungkinan file rusak atau bukan gambar). Coba pilih ulang foto itu.';
          errorEl.style.display = 'block';
        });
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2: Verify every id from spec §6.5's mapping table is present exactly once, and the template's discarded JS is gone**

Search `src/TambahAktivitas.html` for `id="judulHalaman"`, `id="tanggal"`, `id="jamMulai"`, `id="jamSelesai"`, `id="namaAktivitas"`, `id="daftarUraian"`, `id="btnTambahPoin"`, `id="foto1"`, `id="foto2"`, `id="btnSimpan"`, `id="errorMsg"` — each exactly once.

Search for `pointList`, `slotId`, `handlePhoto`, `addPoint(` (template's own function names) — expected zero matches (confirms the template's own script was fully discarded, not partially merged).

Search for `kompresGambar`, `ambilFotoBase64`, `google.script.url.getLocation` — must be present (confirms the working logic was carried over).

- [ ] **Step 3: Run the regression test suite**

Run: `npm test`
Expected: `Tests: 16 passed, 16 total`.

- [ ] **Step 4: Commit**

```bash
git add src/TambahAktivitas.html
git commit -m "feat: replace TambahAktivitas.html with template-baru sectioned form layout"
```

---

## Task 13: Final push & full live verification

**Files:** none (deploy + manual verification only).

- [ ] **Step 1: Re-verify contrast on the remaining risk spots not already fixed in Task 1**

Task 1 pre-emptively fixed two confirmed WCAG failures (`--ink-faint` and gold-as-badge-text — see its notes). Before pushing, compute contrast (same WCAG relative-luminance formula used throughout this project's redesign history: linearize each channel c/255 with the ≤0.03928 piecewise rule, weighted sum 0.2126R+0.7152G+0.0722B, contrast=(L1+0.05)/(L2+0.05)) for these remaining combinations introduced across Tasks 1-12, which were not hand-verified when this plan was written:
- `.admin-nav a.active` text (`#FBF8F1`) against its real rendered background (`rgba(255,255,255,.1)` composited over `--primary-dark`) — composite first (`result = 255*0.1 + base*0.9` per channel), then compute contrast.
- `.auth-top .eyebrow` color (`#B9CFC3`) against `--primary` (Login.html's dark panel).
- `.admin-login-footer a` / `.auth-footer a` color (`var(--primary)`) against `--bg` (should be safe — dark green on cream — but confirm, don't assume).
- Any other text-on-tint or text-on-dark-panel combination you notice while implementing that wasn't listed here — this list is what was identified when the plan was written, not a claim that it's exhaustive.

If anything here fails 4.5:1 (or 3:1 for genuinely large text — 18.66px+ bold or 24px+ regular), fix it the same way Task 1 did: introduce a specifically-named darker/lighter variant token for that one text-on-background pairing, don't change the base decorative token.

- [ ] **Step 2: Push everything to the live Apps Script project**

Run: `clasp push`
Expected: exits 0, lists all changed `src/*.html` files.

- [ ] **Step 3: Get the current deployment URL(s)**

Run: `clasp deployments`. Per the caution in Task 4 Step 2, if the `/dev` URL doesn't reflect the latest push reliably, create a fresh standalone deployment (`clasp deploy --description "..."`) and use its `/exec` URL instead — this never touches the pinned production deployment real users hit.

- [ ] **Step 4: Visually verify each surface**

For each of the 9 pages, confirm it renders per spec §6/§7 (cream/hijau/terracotta tokens, correct layout) at both desktop (≥720px) and mobile (<720px) viewports, with no console errors:
- `?page=home`
- `?page=login`
- `?page=admin-login`
- `?page=aktivitas` (after logging in as the test pegawai) — confirm the "who" header shows real nama/jabatan (via `getMySession`), summary strip numbers are correct, date input works
- `?page=aktivitas/tambah` — confirm add/remove uraian point works and renumbers correctly, photo slots accept a file
- `?page=admin` (after logging in as the test SuperAdmin) — confirm topbar renders via `renderAdminNav`, stat cards + progress bar + belum-lapor list correct, rekap table has no "Hari Lapor"/"Kelengkapan" columns
- `?page=admin/pegawai` — confirm search + status filter work, inline add/edit card works (not a modal)
- `?page=admin/laporan` — confirm date/pegawai/status filters work, no "Ekspor CSV" button present
- `?page=admin/akun` — confirm SuperAdmin gate still works (log in as a non-SuperAdmin `Admin`-level test account if one exists, confirm access is denied with `aksesError`; otherwise confirm the page loads normally for the SuperAdmin test account, since the gate logic itself is server-verified unchanged from before)

- [ ] **Step 5: Full regression pass on the navigation bug class (Task 10 history) and this plan's specific deviations**

- Click every admin topbar nav link (`Dashboard`, `Kelola Pegawai`, `Kelola Laporan`, `Kelola Admin`) — confirm each navigates correctly via the delegated `a[href^="?"]` listener, no blank pages.
- Log in as pegawai, log out via the header icon, confirm `clearToken()` + redirect to `?page=home` both actually happen (this is new code in Task 11 — `keluar()` — verify it live, not just by reading the diff).
- Open `TambahAktivitas.html` in edit mode (click an existing Draft laporan's "Lanjutkan isi"/Edit link from `Aktivitas.html`) — confirm existing data loads (`google.script.url.getLocation()`), confirm the title correctly shows "Edit Aktivitas" **and the page doesn't crash or lose other UI** (this is the specific bug Task 12's markup was designed to avoid — confirm it live).
- Save a brand-new laporan end-to-end with a real photo — exercises `kompresGambar`/`ambilFotoBase64`/`saveAktivitas` unchanged, plus the Sheets-write-corruption fix from commit `c665bd1` (should be completely unaffected by this plan, but worth the extra minute to re-confirm given the scale of this change).
- Add and then remove a uraian point in `TambahAktivitas.html` (Task 12's one small new interactive feature) — confirm renumbering is correct and the minimum-1-point floor holds.

- [ ] **Step 6: Report to the product owner**

List the URLs to check, and ask them to do a final pass themselves before considering this plan complete.

---
