const { getMingguKerja_, hitungRekapMingguan_ } = require('../src/DashboardService.js');

// Minggu acuan yang dipakai berulang di file ini: Senin 2026-08-17 s.d.
// Jumat 2026-08-21 (dikonfirmasi manual: 17 Agu 2026 jatuh hari Senin).
const MINGGU_INI = ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'];

function header() {
  return ['ID Laporan', 'NIP', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Durasi Menit',
    'Nama Aktivitas', 'Uraian', 'Link Foto', 'Link PDF', 'Status',
    'Waktu Dibuat', 'Waktu Diubah', 'Waktu Finalisasi'];
}

// Baris Aktivitas mentah (0-indexed) — kolom sesuai layout Task 7:
// 1 NIP, 2 Tanggal, 5 Durasi Menit, 10 Status. Kolom lain diisi placeholder.
function row(nip, tanggal, durasiMenit, status) {
  return ['id-' + nip + '-' + tanggal + '-' + Math.random(), nip, tanggal, '08:00', '16:00',
    durasiMenit, 'Aktivitas', 'uraian', '', '', status, '', '', ''];
}

describe('getMingguKerja_', () => {
  test('acuan hari Sabtu (di tengah minggu itu) -> Senin-Jumat minggu yang sama', () => {
    expect(getMingguKerja_('2026-08-22')).toEqual(MINGGU_INI);
  });

  test('acuan hari Rabu (tengah minggu) -> Senin-Jumat minggu yang sama', () => {
    expect(getMingguKerja_('2026-08-19')).toEqual(MINGGU_INI);
  });

  test('acuan hari Minggu -> mundur ke minggu yang BARU LEWAT, bukan minggu mendatang', () => {
    // 2026-08-23 adalah hari Minggu yang menutup minggu 17-23 Agustus.
    // Senin BERIKUTNYA adalah 2026-08-24 — hasil TIDAK BOLEH mengarah ke sana.
    const hasil = getMingguKerja_('2026-08-23');
    expect(hasil).toEqual(MINGGU_INI);
    expect(hasil).not.toContain('2026-08-24');
  });

  test('acuan hari Senin itu sendiri -> mulai dari hari itu juga (sanity check offset 0)', () => {
    expect(getMingguKerja_('2026-08-17')).toEqual(MINGGU_INI);
  });
});

describe('hitungRekapMingguan_', () => {
  test('5 baris Final di 5 hari kerja -> hariLapor 5, lengkap true, totalMenit terjumlah', () => {
    const pegawai = [{ nip: '199208152024211005', nama: 'Budi' }];
    const rows = [header()].concat(MINGGU_INI.map((tgl) => row('199208152024211005', tgl, 480, 'Final')));

    const hasil = hitungRekapMingguan_(rows, pegawai, '2026-08-22');

    expect(hasil).toEqual([
      { nip: '199208152024211005', nama: 'Budi', hariLapor: 5, totalHari: 5, totalMenit: 2400, lengkap: true }
    ]);
  });

  test('hanya 1 hari lapor -> hariLapor 1, lengkap false', () => {
    const pegawai = [{ nip: '199208152024211005', nama: 'Budi' }];
    const rows = [header(), row('199208152024211005', '2026-08-17', 480, 'Final')];

    const hasil = hitungRekapMingguan_(rows, pegawai, '2026-08-22');

    expect(hasil[0]).toEqual({ nip: '199208152024211005', nama: 'Budi', hariLapor: 1, totalHari: 5, totalMenit: 480, lengkap: false });
  });

  test('tanpa laporan sama sekali di minggu itu -> hariLapor 0, lengkap false, totalMenit 0', () => {
    const pegawai = [{ nip: '199208152024211005', nama: 'Budi' }];
    const rows = [header()];

    const hasil = hitungRekapMingguan_(rows, pegawai, '2026-08-22');

    expect(hasil[0]).toEqual({ nip: '199208152024211005', nama: 'Budi', hariLapor: 0, totalHari: 5, totalMenit: 0, lengkap: false });
  });

  test('baris berstatus Draft tidak dihitung sebagai hari lapor', () => {
    const pegawai = [{ nip: '199208152024211005', nama: 'Budi' }];
    const rows = [header(), row('199208152024211005', '2026-08-17', 480, 'Draft')];

    const hasil = hitungRekapMingguan_(rows, pegawai, '2026-08-22');

    expect(hasil[0]).toEqual({ nip: '199208152024211005', nama: 'Budi', hariLapor: 0, totalHari: 5, totalMenit: 0, lengkap: false });
  });

  test('baris Final di luar minggu yang dihitung tidak boleh ikut terhitung', () => {
    const pegawai = [{ nip: '199208152024211005', nama: 'Budi' }];
    // 2026-08-24 adalah Senin MINGGU BERIKUTNYA — di luar 17-21 Agustus.
    const rows = [header(), row('199208152024211005', '2026-08-24', 480, 'Final')];

    const hasil = hitungRekapMingguan_(rows, pegawai, '2026-08-22');

    expect(hasil[0]).toEqual({ nip: '199208152024211005', nama: 'Budi', hariLapor: 0, totalHari: 5, totalMenit: 0, lengkap: false });
  });

  test('2 baris Final di hari yang SAMA -> hariLapor tetap 1 hari, tapi menit dari keduanya terakumulasi', () => {
    const pegawai = [{ nip: '199208152024211005', nama: 'Budi' }];
    const rows = [
      header(),
      row('199208152024211005', '2026-08-17', 300, 'Final'),
      row('199208152024211005', '2026-08-17', 120, 'Final')
    ];

    const hasil = hitungRekapMingguan_(rows, pegawai, '2026-08-22');

    expect(hasil[0]).toEqual({ nip: '199208152024211005', nama: 'Budi', hariLapor: 1, totalHari: 5, totalMenit: 420, lengkap: false });
  });

  test('beberapa pegawai dihitung independen (tidak saling campur)', () => {
    const pegawai = [
      { nip: '111111111111111111', nama: 'Lengkap' },
      { nip: '222222222222222222', nama: 'Kurang' }
    ];
    const rows = [header()]
      .concat(MINGGU_INI.map((tgl) => row('111111111111111111', tgl, 480, 'Final')))
      .concat([row('222222222222222222', '2026-08-17', 480, 'Final')]);

    const hasil = hitungRekapMingguan_(rows, pegawai, '2026-08-22');

    expect(hasil).toEqual([
      { nip: '111111111111111111', nama: 'Lengkap', hariLapor: 5, totalHari: 5, totalMenit: 2400, lengkap: true },
      { nip: '222222222222222222', nama: 'Kurang', hariLapor: 1, totalHari: 5, totalMenit: 480, lengkap: false }
    ]);
  });
});
