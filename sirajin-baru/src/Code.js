/**
 * Code.js — entry point HtmlService: routing `?page=` dan include() untuk
 * template HTML (dipakai Shared.html/AdminShared.html lewat `<?!= include(...) ?>`).
 */

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

function doGet(e) {
  var page = (e.parameter.page || 'home');
  var pageMap = {
    'home': 'Home',
    'login': 'Login',
    'admin-login': 'AdminLogin',
    'aktivitas': 'Aktivitas',
    'aktivitas/tambah': 'TambahAktivitas',
    'admin': 'AdminDashboard',
    'admin/pegawai': 'AdminPegawai',
    'admin/laporan': 'AdminLaporan',
    'admin/akun': 'AdminAkun'
  };
  var file = pageMap[page] || 'Home';
  return HtmlService.createTemplateFromFile(file)
    .evaluate()
    .setTitle('SiRajin DPMPTSP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    // `<link rel="icon">` yang ditulis manual di HTML file Apps Script
    // DIABAIKAN oleh wrapper GAS (script.google.com) — favicon tab browser
    // wajib diset lewat HtmlOutput.setFaviconUrl(), bukan lewat markup HTML.
    // getLogoDataUri_() (Utils.js) sama persis dengan SIRAJIN_LOGO_SRC yang
    // dipakai buat crest inline (Shared.html) — satu sumber base64 lambang
    // Kabupaten Morowali.
    .setFaviconUrl(getLogoDataUri_());
}
