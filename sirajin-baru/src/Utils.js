/**
 * Utils.js — fungsi bantu murni (tanpa panggilan API Apps Script) yang
 * dipakai lintas modul: validasi NIP, validasi rentang jam, dan
 * perhitungan/format durasi kerja.
 */

/**
 * Parse string "HH:MM" jadi total menit sejak 00:00.
 * Helper internal, tidak diekspor (bukan bagian dari kontrak publik modul).
 */
function parseTimeToMinutes(hhmm) {
  var parts = String(hhmm).split(':');
  var jam = parseInt(parts[0], 10);
  var menit = parseInt(parts[1], 10);
  return jam * 60 + menit;
}

/**
 * NIP dianggap valid jika, setelah semua spasi dibuang, berupa
 * persis 18 digit angka.
 */
function isValidNIP(nip) {
  var cleaned = String(nip).replace(/\s+/g, '');
  return /^\d{18}$/.test(cleaned);
}

/**
 * Rentang jam valid hanya jika jam selesai lebih besar dari jam mulai.
 * Format jam yang tidak valid (mis. bukan "HH:MM") akan menghasilkan
 * NaN saat diparse sehingga perbandingan otomatis bernilai false.
 */
function isValidTimeRange(mulai, selesai) {
  return parseTimeToMinutes(selesai) > parseTimeToMinutes(mulai);
}

/**
 * Hitung durasi (dalam menit) antara jam mulai dan jam selesai.
 * Melempar error jika jam selesai tidak lebih besar dari jam mulai.
 */
function calculateDurationMinutes(mulai, selesai) {
  var menitMulai = parseTimeToMinutes(mulai);
  var menitSelesai = parseTimeToMinutes(selesai);
  if (menitSelesai <= menitMulai) {
    throw new Error('Jam selesai harus lebih besar dari jam mulai');
  }
  return menitSelesai - menitMulai;
}

/**
 * Format total menit jadi string ringkas, mis. 450 -> "7j 30m".
 * Bagian jam disembunyikan jika 0 jam; bagian menit disembunyikan
 * jika 0 menit KECUALI jamnya juga 0 (supaya tidak pernah kosong).
 */
function formatDuration(menit) {
  var jam = Math.floor(menit / 60);
  var sisaMenit = menit % 60;
  var parts = [];
  if (jam > 0) parts.push(jam + 'j');
  if (sisaMenit > 0 || jam === 0) parts.push(sisaMenit + 'm');
  return parts.join(' ');
}

// Jembatan Node/Jest <-> Apps Script: blok ini tidak pernah jalan di
// runtime Apps Script (tidak ada global `module`), jadi aman di-deploy
// apa adanya lewat `clasp push`.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidNIP: isValidNIP,
    isValidTimeRange: isValidTimeRange,
    calculateDurationMinutes: calculateDurationMinutes,
    formatDuration: formatDuration
  };
}
