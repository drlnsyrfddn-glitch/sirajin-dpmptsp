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
  var out = HtmlService.createTemplateFromFile(file)
    .evaluate()
    .setTitle('SiRajin DPMPTSP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  // Favicon tab browser = logo Kabupaten Morowali (crest di-host di Drive,
  // lihat getFaviconUrl_ di Utils.js). getFaviconUrl_() return null kalau
  // FAVICON_FILE_ID belum di-setup -> skip, app tetap hidup (fail-safe).
  // JANGAN pakai data: URI di sini — GAS menolaknya & bikin doGet throw =
  // app down (commit 60b1c48). URL Drive #favicon.png lolos validator.
  var faviconUrl = getFaviconUrl_();
  if (faviconUrl) out.setFaviconUrl(faviconUrl);

  return out;
}
