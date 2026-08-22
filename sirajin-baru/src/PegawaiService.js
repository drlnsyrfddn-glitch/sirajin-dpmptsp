/**
 * PegawaiService.js — CRUD data pegawai (sheet `Pegawai`) untuk admin:
 * daftar, tambah/edit, dan toggle status Aktif/Nonaktif. Semua fungsi
 * di sini wajib sesi admin (lewat requireAdmin_ dari Auth.js).
 *
 * Kolom sheet Pegawai (0-indexed): 0 ID, 1 NIP, 2 Nama, 3 Jabatan,
 * 4 Unit Kerja, 5 Status. Properti objek JS dipakai di sini adalah
 * `namaLengkap` (bukan `nama`) — hanya nama properti, indeks kolom
 * yang dipakai untuk baca/tulis tetap sama.
 */

function listPegawai(token) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheet = getSheet('Pegawai');
  var rows = sheet.getDataRange().getValues();
  var hasil = [];
  for (var i = 1; i < rows.length; i++) {
    hasil.push({
      id: rows[i][0],
      nip: rows[i][1],
      namaLengkap: rows[i][2],
      jabatan: rows[i][3],
      unitKerja: rows[i][4],
      status: rows[i][5]
    });
  }
  return { success: true, data: hasil };
}

function savePegawai(token, data) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var nipBersih = data.nip ? String(data.nip).replace(/\s+/g, '') : '';
  if (!nipBersih) {
    return { success: false, message: 'NIP wajib diisi.' };
  }
  if (!isValidNIP(nipBersih)) {
    return { success: false, message: 'Format NIP tidak valid (harus 18 digit).' };
  }
  if (!data.namaLengkap || !data.jabatan || !data.unitKerja) {
    return { success: false, message: 'Nama, jabatan, dan unit kerja wajib diisi.' };
  }

  var sheet = getSheet('Pegawai');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var rowNip = String(rows[i][1]).replace(/\s+/g, '');
    if (rowNip === nipBersih && rows[i][0] !== data.id) {
      return { success: false, message: 'NIP ini sudah terdaftar untuk pegawai lain.' };
    }
  }

  if (data.id) {
    for (var j = 1; j < rows.length; j++) {
      if (rows[j][0] === data.id) {
        sheet.getRange(j + 1, 1, 1, 6).setValues([[
          data.id, nipBersih, data.namaLengkap, data.jabatan, data.unitKerja, rows[j][5]
        ]]);
        return { success: true, id: data.id };
      }
    }
    return { success: false, message: 'Pegawai tidak ditemukan.' };
  }

  var idBaru = Utilities.getUuid();
  sheet.appendRow([idBaru, nipBersih, data.namaLengkap, data.jabatan, data.unitKerja, 'Aktif']);
  return { success: true, id: idBaru };
}

function setPegawaiStatus(token, id, status) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }
  if (status !== 'Aktif' && status !== 'Nonaktif') {
    return { success: false, message: 'Status tidak valid.' };
  }

  var sheet = getSheet('Pegawai');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sheet.getRange(i + 1, 6).setValue(status);
      return { success: true };
    }
  }
  return { success: false, message: 'Pegawai tidak ditemukan.' };
}
