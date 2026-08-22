/**
 * Setup.js — inisialisasi infrastruktur SiRajin: spreadsheet (3 sheet + header),
 * folder Drive foto/PDF, dan Script Properties. Dijalankan SEKALI secara manual
 * dari editor Apps Script oleh deployer, sebelum aplikasi dipakai.
 */

function setupAwal() {
  var props = PropertiesService.getScriptProperties();

  if (!props.getProperty('SPREADSHEET_ID')) {
    var ss = SpreadsheetApp.create('SiRajin - Database');
    props.setProperty('SPREADSHEET_ID', ss.getId());

    var pegawaiSheet = ss.getSheets()[0].setName('Pegawai');
    pegawaiSheet.appendRow(['ID', 'NIP', 'Nama', 'Jabatan', 'Unit Kerja', 'Status']);
    pegawaiSheet.getRange('B:B').setNumberFormat('@'); // NIP wajib teks polos

    var adminSheet = ss.insertSheet('Admin');
    adminSheet.appendRow(['ID', 'NIP', 'Nama', 'Password', 'Level', 'Status']);
    adminSheet.getRange('B:B').setNumberFormat('@');

    var aktivitasSheet = ss.insertSheet('Aktivitas');
    aktivitasSheet.appendRow([
      'ID Laporan', 'NIP', 'Tanggal', 'Jam Mulai', 'Jam Selesai',
      'Durasi Menit', 'Nama Aktivitas', 'Uraian', 'Link Foto', 'Link PDF',
      'Status', 'Waktu Dibuat', 'Waktu Diubah', 'Waktu Finalisasi'
    ]);
    // Kolom B/C/D/E dipaksa teks polos ('@') — tanpa ini, Sheets otomatis
    // mengonversi "08:00" jadi nilai waktu (Date) dan NIP 18 digit jadi
    // Number yang kehilangan presisi (18 digit > Number.MAX_SAFE_INTEGER).
    // Ini WAJIB diset sebelum baris data pertama ditulis oleh AktivitasService.js.
    aktivitasSheet.getRange('B:B').setNumberFormat('@'); // NIP
    aktivitasSheet.getRange('C:C').setNumberFormat('@'); // Tanggal (disimpan "YYYY-MM-DD")
    aktivitasSheet.getRange('D:E').setNumberFormat('@'); // Jam Mulai, Jam Selesai ("HH:MM")

    // Akun SuperAdmin awal — satu-satunya jalan masuk sebelum admin lain
    // dibuat lewat Kelola Akun. Password acak per-setup; TIDAK di-hardcode
    // di kode manapun — hanya dicetak sekali di log untuk deployer.
    var defaultNip = '000000000000000001';
    var defaultPassword = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
    adminSheet.appendRow([
      Utilities.getUuid(), sebagaiTeks_(defaultNip), 'Super Admin',
      hashPassword(defaultPassword), 'SuperAdmin', 'Aktif'
    ]);
    Logger.log('SuperAdmin awal dibuat — NIP: ' + defaultNip + ' | Password: ' + defaultPassword +
      ' (CATAT SEKARANG, tidak akan ditampilkan lagi.)');

    Logger.log('Spreadsheet dibuat: ' + ss.getUrl());
  }

  if (!props.getProperty('FOLDER_FOTO_ID')) {
    var fotoFolder = DriveApp.createFolder('SiRajin Foto');
    var pdfFolder = DriveApp.createFolder('SiRajin PDF');
    props.setProperty('FOLDER_FOTO_ID', fotoFolder.getId());
    props.setProperty('FOLDER_PDF_ID', pdfFolder.getId());
    Logger.log('Folder Drive dibuat: ' + fotoFolder.getUrl() + ' | ' + pdfFolder.getUrl());
  }

  Logger.log('Setup selesai. Jangan lupa: buat Template Doc laporan PDF secara manual, lalu simpan ID-nya lewat setTemplateDocId().');
}

function setTemplateDocId(docId) {
  PropertiesService.getScriptProperties().setProperty('TEMPLATE_DOC_ID', docId);
}
