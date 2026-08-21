function getAdminSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  return ss.getSheetByName('Admin');
}

function requireSuperAdminResult_(token) {
  var session = requireAdmin_(token);
  if (!session) {
    return { session: null, error: { success: false, message: 'Sesi tidak valid, silakan login ulang.' } };
  }
  if (session.level !== 'SuperAdmin') {
    return { session: null, error: { success: false, message: 'Hanya SuperAdmin yang berhak mengakses ini.' } };
  }
  return { session: session, error: null };
}

function listAdmin(token) {
  var gate = requireSuperAdminResult_(token);
  if (gate.error) return gate.error;

  var sheet = getAdminSheet_();
  var rows = sheet.getDataRange().getValues();
  var hasil = [];
  for (var i = 1; i < rows.length; i++) {
    hasil.push({ id: rows[i][0], nip: rows[i][1], nama: rows[i][2], level: rows[i][4], status: rows[i][5] });
    // Kolom Password (index 3) sengaja tidak disertakan.
  }
  return { success: true, data: hasil };
}

function saveAdmin(token, data) {
  var gate = requireSuperAdminResult_(token);
  if (gate.error) return gate.error;

  var nipBersih = String(data.nip).replace(/\s+/g, '');
  if (!isValidNIP(nipBersih)) {
    return { success: false, message: 'Format NIP tidak valid (harus 18 digit).' };
  }
  if (!data.nama) {
    return { success: false, message: 'Nama wajib diisi.' };
  }
  if (data.level !== 'Admin' && data.level !== 'SuperAdmin') {
    return { success: false, message: 'Level tidak valid.' };
  }
  if (!data.id && !data.password) {
    return { success: false, message: 'Password wajib diisi untuk akun admin baru.' };
  }

  var sheet = getAdminSheet_();
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var rowNip = String(rows[i][1]).replace(/\s+/g, '');
    if (rowNip === nipBersih && rows[i][0] !== data.id) {
      return { success: false, message: 'NIP ini sudah terdaftar untuk admin lain.' };
    }
  }

  if (data.id) {
    for (var j = 1; j < rows.length; j++) {
      if (rows[j][0] === data.id) {
        var passwordHash = data.password ? hashPassword(data.password) : rows[j][3];
        sheet.getRange(j + 1, 2, 1, 4).setValues([[nipBersih, data.nama, passwordHash, data.level]]);
        return { success: true, id: data.id };
      }
    }
    return { success: false, message: 'Akun admin tidak ditemukan.' };
  }

  var idBaru = Utilities.getUuid();
  sheet.appendRow([idBaru, nipBersih, data.nama, hashPassword(data.password), data.level, 'Aktif']);
  return { success: true, id: idBaru };
}

function setAdminStatus(token, id, status) {
  var gate = requireSuperAdminResult_(token);
  if (gate.error) return gate.error;
  if (status !== 'Aktif' && status !== 'Nonaktif') {
    return { success: false, message: 'Status tidak valid.' };
  }

  var sheet = getAdminSheet_();
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      var rowNip = String(rows[i][1]).replace(/\s+/g, '');
      if (status === 'Nonaktif' && rowNip === gate.session.nip) {
        return { success: false, message: 'Tidak bisa menonaktifkan akun sendiri.' };
      }
      sheet.getRange(i + 1, 6).setValue(status);
      return { success: true };
    }
  }
  return { success: false, message: 'Akun admin tidak ditemukan.' };
}
