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
    // Ini WAJIB diset sebelum baris data pertama ditulis oleh AktivitasService.js.
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
