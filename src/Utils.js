function parseTimeToMinutes(hhmm) {
  var parts = String(hhmm).split(':');
  var h = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  return h * 60 + m;
}

function calculateDurationMinutes(jamMulai, jamSelesai) {
  var mulai = parseTimeToMinutes(jamMulai);
  var selesai = parseTimeToMinutes(jamSelesai);
  if (selesai <= mulai) {
    throw new Error('Jam selesai harus lebih besar dari jam mulai');
  }
  return selesai - mulai;
}

function formatDuration(totalMinutes) {
  var jam = Math.floor(totalMinutes / 60);
  var menit = totalMinutes % 60;
  var parts = [];
  if (jam > 0) parts.push(jam + ' Jam');
  if (menit > 0 || jam === 0) parts.push(menit + ' Menit');
  return parts.join(' ') + ' (' + totalMinutes + ' Menit)';
}

function isValidNIP(nip) {
  var cleaned = String(nip).replace(/\s+/g, '');
  return /^\d{18}$/.test(cleaned);
}

function isValidTimeRange(jamMulai, jamSelesai) {
  return parseTimeToMinutes(jamSelesai) > parseTimeToMinutes(jamMulai);
}

// Jembatan Node/Jest <-> Apps Script: blok ini tidak pernah jalan di
// runtime Apps Script (tidak ada global `module`), jadi aman di-deploy
// apa adanya lewat `clasp push`.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseTimeToMinutes: parseTimeToMinutes,
    calculateDurationMinutes: calculateDurationMinutes,
    formatDuration: formatDuration,
    isValidNIP: isValidNIP,
    isValidTimeRange: isValidTimeRange
  };
}
