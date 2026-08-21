function getAktivitasSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  return ss.getSheetByName('Aktivitas');
}

function rowToLaporan_(row) {
  return {
    idLaporan: row[0],
    nip: row[1],
    tanggal: row[2],
    jamMulai: row[3],
    jamSelesai: row[4],
    durasiMenit: row[5],
    namaAktivitas: row[6],
    uraian: String(row[7]).split('\n'),
    linkFoto: String(row[8]).split('|').filter(Boolean),
    linkPdf: row[9],
    status: row[10],
    waktuDibuat: row[11],
    waktuDiubah: row[12],
    waktuFinalisasi: row[13]
  };
}

function listAktivitasByDate(token, tanggal) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheet = getAktivitasSheet_();
  var rows = sheet.getDataRange().getValues();
  var hasil = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === session.nip && rows[i][2] === tanggal) {
      hasil.push(rowToLaporan_(rows[i]));
    }
  }
  return { success: true, data: hasil };
}

function saveFotoKeDrive_(nip, tanggal, fotoBase64List) {
  var props = PropertiesService.getScriptProperties();
  var rootFoto = DriveApp.getFolderById(props.getProperty('FOLDER_FOTO_ID'));

  var nipFolder = getOrCreateFolder_(rootFoto, nip);
  var tanggalFolder = getOrCreateFolder_(nipFolder, tanggal);

  var urls = [];
  var blobs = [];
  for (var i = 0; i < fotoBase64List.length; i++) {
    var base64 = fotoBase64List[i];
    if (!base64) { blobs.push(null); continue; }
    var blob = Utilities.newBlob(Utilities.base64Decode(base64.split(',')[1] || base64), 'image/jpeg', 'foto_' + (i + 1) + '.jpg');
    var file = tanggalFolder.createFile(blob);
    urls.push(file.getUrl());
    blobs.push(blob);
  }
  return { urls: urls, blobs: blobs };
}

function getOrCreateFolder_(parent, name) {
  var existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function extractDriveFileId_(url) {
  var match = String(url).match(/\/d\/([^\/]+)/);
  return match ? match[1] : null;
}

function getBlobsFromDriveUrls_(urls) {
  // Kembalikan array persis 3 elemen (slot kosong = null) supaya cocok
  // dengan urutan {{FOTO_1}}/{{FOTO_2}}/{{FOTO_3}} di generateLaporanPdf.
  var blobs = [null, null, null];
  for (var i = 0; i < urls.length && i < 3; i++) {
    var fileId = extractDriveFileId_(urls[i]);
    if (fileId) blobs[i] = DriveApp.getFileById(fileId).getBlob();
  }
  return blobs;
}

function regenerateDanSimpanPdf_(sheet, rowIndex, session, rowValues) {
  // rowValues = baris Aktivitas apa adanya dari getValues() (0-indexed array kolom)
  var pdfUrl = generateLaporanPdf(session, {
    tanggal: rowValues[2],
    jamMulai: rowValues[3],
    jamSelesai: rowValues[4],
    durasiMenit: rowValues[5],
    namaAktivitas: rowValues[6],
    uraian: String(rowValues[7]).split('\n'),
    fotoBlobs: getBlobsFromDriveUrls_(String(rowValues[8]).split('|').filter(Boolean))
  });
  sheet.getRange(rowIndex, 10).setValue(pdfUrl); // kolom Link PDF
  return pdfUrl;
}

function getAktivitasById(token, idLaporan) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }
  var sheet = getAktivitasSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idLaporan) {
      if (rows[i][1] !== session.nip) {
        return { success: false, message: 'Tidak berhak melihat laporan ini.' };
      }
      return { success: true, data: rowToLaporan_(rows[i]) };
    }
  }
  return { success: false, message: 'Laporan tidak ditemukan.' };
}

function saveAktivitas(token, data) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  if (!isValidTimeRange(data.jamMulai, data.jamSelesai)) {
    return { success: false, message: 'Jam selesai harus lebih besar dari jam mulai.' };
  }
  if (!data.uraian || data.uraian.length === 0) {
    return { success: false, message: 'Uraian aktivitas minimal 1 poin.' };
  }
  if (data.fotoBase64 && data.fotoBase64.length > 3) {
    return { success: false, message: 'Maksimal 3 foto.' };
  }

  var sheet = getAktivitasSheet_();
  var durasi = calculateDurationMinutes(data.jamMulai, data.jamSelesai);
  var now = new Date();
  var isEdit = !!data.idLaporan;

  var rows = sheet.getDataRange().getValues();
  var existingRow = null;
  var rowIndex = -1;
  if (isEdit) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.idLaporan) {
        if (rows[i][1] !== session.nip) {
          return { success: false, message: 'Tidak berhak mengubah laporan ini.' };
        }
        existingRow = rows[i];
        rowIndex = i + 1; // 1-indexed di Sheets
        break;
      }
    }
    if (!existingRow) {
      return { success: false, message: 'Laporan tidak ditemukan.' };
    }
  }

  // Foto wajib diisi saat membuat laporan baru. Saat edit, foto boleh
  // dikosongkan di form — artinya pegawai mempertahankan foto yang sudah
  // ada, bukan wajib unggah ulang tiap kali mengedit uraian/jam.
  if (!isEdit && (!data.fotoBase64 || data.fotoBase64.length === 0)) {
    return { success: false, message: 'Foto minimal 1, maksimal 3.' };
  }

  var linkFotoUrls;
  if (data.fotoBase64 && data.fotoBase64.length > 0) {
    linkFotoUrls = saveFotoKeDrive_(session.nip, data.tanggal, data.fotoBase64).urls;
  } else {
    linkFotoUrls = String(existingRow[8]).split('|').filter(Boolean);
  }

  var pdfUrl = generateLaporanPdf(session, {
    tanggal: data.tanggal,
    jamMulai: data.jamMulai,
    jamSelesai: data.jamSelesai,
    durasiMenit: durasi,
    namaAktivitas: data.namaAktivitas,
    uraian: data.uraian,
    fotoBlobs: getBlobsFromDriveUrls_(linkFotoUrls)
  });

  if (isEdit) {
    sheet.getRange(rowIndex, 3, 1, 12).setValues([[
      data.tanggal, data.jamMulai, data.jamSelesai, durasi, data.namaAktivitas,
      data.uraian.join('\n'), linkFotoUrls.join('|'), pdfUrl,
      existingRow[10], // status tidak berubah lewat edit biasa (dipisah dari finalizeAktivitas)
      existingRow[11], now, existingRow[13]
    ]]);
    return { success: true, idLaporan: data.idLaporan, linkPdf: pdfUrl };
  }

  var idBaru = Utilities.getUuid();
  sheet.appendRow([
    idBaru, session.nip, data.tanggal, data.jamMulai, data.jamSelesai, durasi,
    data.namaAktivitas, data.uraian.join('\n'), linkFotoUrls.join('|'), pdfUrl,
    'Draft', now, now, ''
  ]);
  return { success: true, idLaporan: idBaru, linkPdf: pdfUrl };
}

function finalizeAktivitas(token, idLaporan) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheet = getAktivitasSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idLaporan) {
      if (rows[i][1] !== session.nip) {
        return { success: false, message: 'Tidak berhak mengubah laporan ini.' };
      }
      var rowIndex = i + 1;
      // Spec §10: PDF digenerate ulang di setiap penyimpanan, termasuk saat
      // finalisasi (bukan hanya saat dibuat/diedit) — pakai data baris saat ini.
      regenerateDanSimpanPdf_(sheet, rowIndex, session, rows[i]);
      sheet.getRange(rowIndex, 11).setValue('Final'); // kolom Status
      sheet.getRange(rowIndex, 14).setValue(new Date()); // kolom Waktu Finalisasi
      return { success: true };
    }
  }
  return { success: false, message: 'Laporan tidak ditemukan.' };
}

function deleteAktivitas(token, idLaporan) {
  var session = validateToken(token);
  if (!session || session.role !== 'pegawai') {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheet = getAktivitasSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idLaporan) {
      if (rows[i][1] !== session.nip) {
        return { success: false, message: 'Tidak berhak menghapus laporan ini.' };
      }
      if (rows[i][10] === 'Final') {
        return { success: false, message: 'Laporan yang sudah difinalisasi tidak bisa dihapus.' };
      }
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Laporan tidak ditemukan.' };
}
