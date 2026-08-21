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
