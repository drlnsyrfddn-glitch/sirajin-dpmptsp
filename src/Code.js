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
