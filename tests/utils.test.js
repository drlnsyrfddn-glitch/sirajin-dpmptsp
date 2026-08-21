const {
  calculateDurationMinutes,
  formatDuration,
  isValidNIP,
  isValidTimeRange
} = require('../src/Utils.js');

describe('calculateDurationMinutes', () => {
  test('menghitung durasi normal dalam menit', () => {
    expect(calculateDurationMinutes('08:00', '11:30')).toBe(210);
  });

  test('melempar error jika jam selesai sama dengan jam mulai', () => {
    expect(() => calculateDurationMinutes('08:00', '08:00')).toThrow(
      'Jam selesai harus lebih besar dari jam mulai'
    );
  });

  test('melempar error jika jam selesai sebelum jam mulai', () => {
    expect(() => calculateDurationMinutes('11:00', '08:00')).toThrow(
      'Jam selesai harus lebih besar dari jam mulai'
    );
  });
});

describe('formatDuration', () => {
  test('format jam dan menit sekaligus', () => {
    expect(formatDuration(210)).toBe('3 Jam 30 Menit (210 Menit)');
  });

  test('format hanya menit ketika kurang dari 1 jam', () => {
    expect(formatDuration(45)).toBe('45 Menit (45 Menit)');
  });

  test('format hanya jam ketika kelipatan genap', () => {
    expect(formatDuration(120)).toBe('2 Jam (120 Menit)');
  });
});

describe('isValidNIP', () => {
  test('NIP 18 digit dengan spasi dianggap valid', () => {
    expect(isValidNIP('19920815 202421 1 005')).toBe(true);
  });

  test('NIP 18 digit tanpa spasi dianggap valid', () => {
    expect(isValidNIP('199208152024211005')).toBe(true);
  });

  test('NIP kurang dari 18 digit tidak valid', () => {
    expect(isValidNIP('12345')).toBe(false);
  });

  test('NIP berisi huruf tidak valid', () => {
    expect(isValidNIP('1992081520242A1005')).toBe(false);
  });
});

describe('isValidTimeRange', () => {
  test('jam selesai setelah jam mulai valid', () => {
    expect(isValidTimeRange('08:00', '11:30')).toBe(true);
  });

  test('jam selesai sama dengan jam mulai tidak valid', () => {
    expect(isValidTimeRange('08:00', '08:00')).toBe(false);
  });

  test('jam selesai sebelum jam mulai tidak valid', () => {
    expect(isValidTimeRange('11:00', '08:00')).toBe(false);
  });
});
