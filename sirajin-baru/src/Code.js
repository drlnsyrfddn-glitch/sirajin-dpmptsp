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
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
