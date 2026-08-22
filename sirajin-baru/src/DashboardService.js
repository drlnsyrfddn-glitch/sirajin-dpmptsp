/**
 * DashboardService.js — ringkasan harian untuk dashboard admin
 * (`getDashboardSummary`), arsip laporan Final (`listLaporanArsip`), dan
 * rekap kehadiran mingguan (`getRekapMingguan` + 2 helper murni).
 *
 * "Minggu berjalan" = Senin-Jumat minggu kalender yang memuat `tanggalAcuan`.
 * Hari Minggu mundur ke minggu yang BARU LEWAT (bukan minggu mendatang).
 * "Hari Lapor" = jumlah dari 5 hari kerja itu yang punya minimal 1 baris
 * Aktivitas berstatus Final untuk pegawai tsb. "Lengkap" = hariLapor === 5.
 */

function getDashboardSheets_() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  return {
    pegawai: ss.getSheetByName('Pegawai'),
    aktivitas: ss.getSheetByName('Aktivitas')
  };
}

function buildNipNamaMap_(pegawaiRows) {
  var map = {};
  for (var i = 1; i < pegawaiRows.length; i++) {
    map[String(pegawaiRows[i][1]).replace(/\s+/g, '')] = pegawaiRows[i][2];
  }
  return map;
}

function getDashboardSummary(token, tanggal) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheets = getDashboardSheets_();
  var pegawaiRows = sheets.pegawai.getDataRange().getValues();
  var aktivitasRows = sheets.aktivitas.getDataRange().getValues();

  var pegawaiAktif = [];
  for (var i = 1; i < pegawaiRows.length; i++) {
    if (pegawaiRows[i][5] === 'Aktif') {
      pegawaiAktif.push({ nip: String(pegawaiRows[i][1]).replace(/\s+/g, ''), nama: pegawaiRows[i][2] });
    }
  }

  var sudahLaporSet = {};
  var jamPerNip = {};
  for (var j = 1; j < aktivitasRows.length; j++) {
    if (aktivitasRows[j][2] !== tanggal || aktivitasRows[j][10] !== 'Final') continue;
    var nip = String(aktivitasRows[j][1]).replace(/\s+/g, '');
    sudahLaporSet[nip] = true;
    jamPerNip[nip] = (jamPerNip[nip] || 0) + Number(aktivitasRows[j][5]);
  }

  var sudahLapor = 0;
  var belumLapor = [];
  var rekapJam = [];
  pegawaiAktif.forEach(function (p) {
    if (sudahLaporSet[p.nip]) {
      sudahLapor++;
      rekapJam.push({ nip: p.nip, nama: p.nama, totalMenit: jamPerNip[p.nip] || 0 });
    } else {
      belumLapor.push({ nip: p.nip, nama: p.nama });
    }
  });

  return {
    success: true,
    data: {
      tanggal: tanggal,
      totalPegawaiAktif: pegawaiAktif.length,
      sudahLapor: sudahLapor,
      belumLapor: belumLapor,
      rekapJam: rekapJam
    }
  };
}

function listLaporanArsip(token, filter) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }
  filter = filter || {};

  var sheets = getDashboardSheets_();
  var pegawaiRows = sheets.pegawai.getDataRange().getValues();
  var nipNamaMap = buildNipNamaMap_(pegawaiRows);
  var aktivitasRows = sheets.aktivitas.getDataRange().getValues();

  var filterNip = filter.nip ? String(filter.nip).replace(/\s+/g, '') : null;

  var hasil = [];
  for (var i = 1; i < aktivitasRows.length; i++) {
    var row = aktivitasRows[i];
    var nip = String(row[1]).replace(/\s+/g, '');
    var tanggal = row[2];

    if (filterNip && nip !== filterNip) continue;
    if (filter.tanggalMulai && tanggal < filter.tanggalMulai) continue;
    if (filter.tanggalAkhir && tanggal > filter.tanggalAkhir) continue;

    hasil.push({
      idLaporan: row[0],
      nip: nip,
      nama: nipNamaMap[nip] || '(pegawai tidak ditemukan)',
      tanggal: tanggal,
      jamMulai: row[3],
      jamSelesai: row[4],
      namaAktivitas: row[6],
      linkPdf: row[9],
      status: row[10]
    });
  }

  hasil.sort(function (a, b) {
    if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? 1 : -1;
    return a.jamMulai < b.jamMulai ? 1 : -1;
  });

  return { success: true, data: hasil };
}

/**
 * Format Date jadi string ISO "YYYY-MM-DD" (zero-padded), pakai komponen
 * tanggal LOKAL (bukan toISOString(), yang berbasis UTC dan bisa geser
 * satu hari tergantung timezone runtime).
 */
function toISODate_(d) {
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/**
 * Hitung 5 tanggal ISO Senin-Jumat dari minggu kalender yang memuat
 * `tanggalAcuan`. Parse manual (split '-' lalu new Date(y, m-1, d)) supaya
 * tidak kena kuirk timezone dari `new Date(isoString)`.
 *
 * Offset ke Senin: Minggu (getDay()===0) mundur 6 hari (ke Senin minggu
 * yang BARU LEWAT, bukan Senin minggu mendatang); hari lain mundur
 * (dayOfWeek - 1) hari, yakni offset = 1 - dayOfWeek.
 */
function getMingguKerja_(tanggalAcuan) {
  var parts = tanggalAcuan.split('-').map(Number);
  var acuan = new Date(parts[0], parts[1] - 1, parts[2]);
  var dayOfWeek = acuan.getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu
  var offsetKeSenin = dayOfWeek === 0 ? -6 : (1 - dayOfWeek);

  var senin = new Date(acuan);
  senin.setDate(senin.getDate() + offsetKeSenin);

  var hasil = [];
  for (var i = 0; i < 5; i++) {
    var hari = new Date(senin);
    hari.setDate(hari.getDate() + i);
    hasil.push(toISODate_(hari));
  }
  return hasil;
}

/**
 * Hitung rekap kehadiran mingguan per pegawai (helper murni, tanpa
 * panggilan API Apps Script). Untuk tiap pegawai aktif, hitung berapa dari
 * 5 hari kerja minggu itu yang punya minimal 1 baris Aktivitas Final
 * (hariLapor), dan jumlah total menit dari SEMUA baris Final di minggu itu
 * (termasuk duplikat di hari yang sama — menit tetap terakumulasi walau
 * hari itu cuma dihitung 1x untuk hariLapor).
 */
function hitungRekapMingguan_(aktivitasRows, pegawaiAktif, tanggalAcuan) {
  var mingguSet = {};
  getMingguKerja_(tanggalAcuan).forEach(function (tgl) { mingguSet[tgl] = true; });

  var hariSetPerNip = {}; // nip -> { 'YYYY-MM-DD': true, ... }
  var menitPerNip = {}; // nip -> total menit

  for (var i = 1; i < aktivitasRows.length; i++) {
    var row = aktivitasRows[i];
    var status = row[10];
    var tanggal = row[2];
    if (status !== 'Final' || !mingguSet[tanggal]) continue;

    var nip = String(row[1]).replace(/\s+/g, '');
    if (!hariSetPerNip[nip]) hariSetPerNip[nip] = {};
    hariSetPerNip[nip][tanggal] = true;
    menitPerNip[nip] = (menitPerNip[nip] || 0) + Number(row[5]);
  }

  return pegawaiAktif.map(function (p) {
    var hariSet = hariSetPerNip[p.nip] || {};
    var hariLapor = Object.keys(hariSet).length;
    return {
      nip: p.nip,
      nama: p.nama,
      hariLapor: hariLapor,
      totalHari: 5,
      totalMenit: menitPerNip[p.nip] || 0,
      lengkap: hariLapor === 5
    };
  });
}

function getRekapMingguan(token, tanggalAcuan) {
  var session = requireAdmin_(token);
  if (!session) {
    return { success: false, message: 'Sesi tidak valid, silakan login ulang.' };
  }

  var sheets = getDashboardSheets_();
  var pegawaiRows = sheets.pegawai.getDataRange().getValues();
  var aktivitasRows = sheets.aktivitas.getDataRange().getValues();

  var pegawaiAktif = [];
  for (var i = 1; i < pegawaiRows.length; i++) {
    if (pegawaiRows[i][5] === 'Aktif') {
      pegawaiAktif.push({ nip: String(pegawaiRows[i][1]).replace(/\s+/g, ''), nama: pegawaiRows[i][2] });
    }
  }

  var data = hitungRekapMingguan_(aktivitasRows, pegawaiAktif, tanggalAcuan);
  return { success: true, data: data };
}

// Jembatan Node/Jest <-> Apps Script: blok ini tidak pernah jalan di
// runtime Apps Script (tidak ada global `module`), jadi aman di-deploy
// apa adanya lewat `clasp push`. Hanya 2 helper murni yang diekspor —
// wrapper ber-GAS-API tidak diuji unit, sama seperti modul lain.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getMingguKerja_: getMingguKerja_, hitungRekapMingguan_: hitungRekapMingguan_ };
}
