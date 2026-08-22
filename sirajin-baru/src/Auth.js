/**
 * Auth.js — login pegawai/admin via NIP (+ password untuk admin), dan
 * manajemen sesi lewat CacheService (token acak, sliding-refresh TTL).
 */

var SESSION_TTL_SECONDS = 21600; // 6 jam — batas keras CacheService

function hashPassword(password) {
  if (typeof Utilities !== 'undefined') {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
    return digest.map(function (byte) {
      var v = (byte + 256) % 256;
      var hex = v.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
  // Fallback murni JS untuk Jest (tidak ada global Utilities di Node) —
  // dipakai HANYA oleh test, runtime Apps Script selalu lewat cabang di atas.
  var crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return Utilities.getUuid();
}

function getSheet(name) {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  return ss.getSheetByName(name);
}

function loginPegawai(nip) {
  var cleanedNip = String(nip).replace(/\s+/g, '');
  if (!isValidNIP(cleanedNip)) {
    return { success: false, message: 'Format NIP tidak valid.' };
  }

  var sheet = getSheet('Pegawai');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var rowNip = String(rows[i][1]).replace(/\s+/g, '');
    if (rowNip === cleanedNip) {
      if (rows[i][5] !== 'Aktif') {
        return { success: false, message: 'Akun pegawai ini nonaktif. Hubungi admin.' };
      }
      var session = {
        role: 'pegawai',
        nip: rowNip,
        nama: rows[i][2],
        jabatan: rows[i][3],
        unitKerja: rows[i][4]
      };
      var token = generateToken();
      CacheService.getScriptCache().put(token, JSON.stringify(session), SESSION_TTL_SECONDS);
      return { success: true, token: token, session: session };
    }
  }
  return { success: false, message: 'NIP tidak ditemukan.' };
}

function loginAdmin(nip, password) {
  var cleanedNip = String(nip).replace(/\s+/g, '');
  var sheet = getSheet('Admin');
  var rows = sheet.getDataRange().getValues();
  var hashed = hashPassword(password);

  for (var i = 1; i < rows.length; i++) {
    var rowNip = String(rows[i][1]).replace(/\s+/g, '');
    if (rowNip === cleanedNip) {
      if (rows[i][5] !== 'Aktif') {
        return { success: false, message: 'Akun admin ini nonaktif.' };
      }
      if (rows[i][3] !== hashed) {
        return { success: false, message: 'NIP atau password salah.' };
      }
      var session = { role: 'admin', nip: rowNip, nama: rows[i][2], level: rows[i][4] };
      var token = generateToken();
      CacheService.getScriptCache().put(token, JSON.stringify(session), SESSION_TTL_SECONDS);
      return { success: true, token: token, session: session };
    }
  }
  return { success: false, message: 'NIP atau password salah.' };
}

function validateToken(token) {
  if (!token) return null;
  var cache = CacheService.getScriptCache();
  var raw = cache.get(token);
  if (!raw) return null;
  cache.put(token, raw, SESSION_TTL_SECONDS); // sliding refresh — reset timer
  return JSON.parse(raw);
}

function requireAdmin_(token) {
  var session = validateToken(token);
  if (!session || session.role !== 'admin') return null;
  return session;
}

function getMySession(token) {
  var session = validateToken(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }
  return { success: true, session: session };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { hashPassword: hashPassword };
}
