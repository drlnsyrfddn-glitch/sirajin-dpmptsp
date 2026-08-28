# Setup project ini di mesin baru (Mac)

Project ini isinya 2 Google Apps Script (GAS) project yang di-develop lewat `clasp`
(CLI resmi Google buat push/pull kode GAS dari git):

| Folder | scriptId | Keterangan |
|---|---|---|
| `src/` (root) | `1g9i794okCNqu1nqV_thpQIWWTunyhnhnTGB93-Wac3CQWyC7Xc-ddfcU` | App live yang dipakai staf sehari-hari |
| `sirajin-baru/` | `1Avpse4Dea1zpH1TiDWBk0DDvpGJDqfhRYlvfEwDJ03G_XX4D0vkN7AuL` | Rewrite "(Baru)" — sudah di-QA & deploy, ini yang dipresentasikan ke staf |

`scriptId` bukan rahasia (cuma pointer ke project GAS), tapi file `.clasp.json` sengaja
di-`.gitignore`-in supaya tiap developer bisa punya `rootDir` sendiri kalau perlu. Jadi
2 file ini **tidak ikut ke-clone** dan harus dibikin manual — isinya sudah dikasih di
bawah, tinggal copy-paste.

## 1. Install tool dasar

```bash
# git & node — pakai Homebrew kalau belum ada
brew install git node

# clasp (CLI Google Apps Script)
npm install -g @google/clasp

# Claude Code
curl -fsSL https://claude.ai/install.sh | bash
```

## 2. Clone repo

```bash
git clone https://github.com/drlnsyrfddn-glitch/sirajin-dpmptsp.git
cd sirajin-dpmptsp
npm install
```

## 3. Bikin ulang `.clasp.json` (2 file, gak ikut ke-clone)

`.clasp.json` di root:

```json
{
  "scriptId": "1g9i794okCNqu1nqV_thpQIWWTunyhnhnTGB93-Wac3CQWyC7Xc-ddfcU",
  "rootDir": "src",
  "scriptExtensions": [".js", ".gs"],
  "htmlExtensions": [".html"],
  "jsonExtensions": [".json"],
  "filePushOrder": [],
  "skipSubdirectories": false
}
```

`sirajin-baru/.clasp.json`:

```json
{
  "scriptId": "1Avpse4Dea1zpH1TiDWBk0DDvpGJDqfhRYlvfEwDJ03G_XX4D0vkN7AuL",
  "rootDir": "src",
  "scriptExtensions": [".js", ".gs"],
  "htmlExtensions": [".html"],
  "jsonExtensions": [".json"],
  "filePushOrder": [],
  "skipSubdirectories": false
}
```

## 4. Login clasp

Token login clasp (`~/.clasprc.json`) itu per-mesin, gak ikut git. Login ulang pakai
akun Google yang sama yang biasa dipakai buat project ini:

```bash
clasp login
```

Ini buka browser buat OAuth. Setelah login, cek koneksi ke project:

```bash
clasp status                # di root repo
cd sirajin-baru && clasp status
```

Kalau muncul daftar file tanpa error, artinya sudah nyambung ke project GAS yang benar.

## 5. Jalanin test

```bash
npm test
```

## Yang TIDAK ikut pindah otomatis

- **Memory/context Claude** (backlog fitur, catatan project) tersimpan lokal di laptop
  Windows (`~/.claude/projects/...`). Di Mac, Claude mulai dari nol soal histori
  obrolan — kalau perlu, minta Claude re-summarize dari `git log` + file ini.
- **MCP plugin** (chrome-devtools, playwright, dll kalau dipakai) perlu di-install/setup
  ulang di Claude Code Mac, itu config per-mesin bukan per-repo.
