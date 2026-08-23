const { hitungPegawaiAktif_ } = require('../src/PegawaiService.js');

describe('hitungPegawaiAktif_', () => {
  // Baris sheet Pegawai: [id, nip, nama, jabatan, unitKerja, status]
  // Baris 0 = header, dilewati. Kolom status = index 5.
  const header = ['id', 'nip', 'nama', 'jabatan', 'unitKerja', 'status'];

  test('menghitung hanya pegawai berstatus Aktif', () => {
    const rows = [
      header,
      ['1', '111', 'A', 'j', 'u', 'Aktif'],
      ['2', '222', 'B', 'j', 'u', 'Nonaktif'],
      ['3', '333', 'C', 'j', 'u', 'Aktif'],
    ];
    expect(hitungPegawaiAktif_(rows)).toBe(2);
  });

  test('mengembalikan 0 jika hanya ada header', () => {
    expect(hitungPegawaiAktif_([header])).toBe(0);
  });

  test('mengembalikan 0 jika sheet benar-benar kosong', () => {
    expect(hitungPegawaiAktif_([])).toBe(0);
  });

  test('mengembalikan 0 jika tidak ada yang Aktif', () => {
    const rows = [header, ['1', '111', 'A', 'j', 'u', 'Nonaktif']];
    expect(hitungPegawaiAktif_(rows)).toBe(0);
  });
});
