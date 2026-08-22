const {
  isValidNIP,
  isValidTimeRange,
  calculateDurationMinutes,
  formatDuration
} = require('../src/Utils.js');

describe('isValidNIP', () => {
  test('18 digit tanpa spasi dianggap valid', () => {
    expect(isValidNIP('199208152024211005')).toBe(true);
  });

  test('18 digit dengan spasi dianggap valid (spasi dibuang)', () => {
    expect(isValidNIP('19920815 202421 1 005')).toBe(true);
  });

  test('kurang dari 18 digit tidak valid', () => {
    expect(isValidNIP('12345')).toBe(false);
  });

  test('mengandung huruf tidak valid', () => {
    expect(isValidNIP('1992081520242A1005')).toBe(false);
  });
});

describe('isValidTimeRange', () => {
  test('jam selesai setelah jam mulai valid', () => {
    expect(isValidTimeRange('08:00', '11:30')).toBe(true);
  });

  test('jam selesai sebelum jam mulai tidak valid', () => {
    expect(isValidTimeRange('11:00', '08:00')).toBe(false);
  });

  test('jam selesai sama dengan jam mulai tidak valid', () => {
    expect(isValidTimeRange('08:00', '08:00')).toBe(false);
  });

  test('format jam tidak valid (bukan HH:MM) tidak valid', () => {
    expect(isValidTimeRange('0800', '11:30')).toBe(false);
  });
});

describe('calculateDurationMinutes', () => {
  test('menghitung durasi normal dalam menit', () => {
    expect(calculateDurationMinutes('08:00', '11:30')).toBe(210);
  });

  test('menghitung durasi yang melintasi beberapa jam', () => {
    expect(calculateDurationMinutes('08:45', '10:15')).toBe(90);
  });

  test('melempar error jika jam selesai sebelum jam mulai', () => {
    expect(() => calculateDurationMinutes('11:00', '08:00')).toThrow();
  });

  test('melempar error jika jam selesai sama dengan jam mulai', () => {
    expect(() => calculateDurationMinutes('08:00', '08:00')).toThrow();
  });
});

describe('formatDuration', () => {
  test('kurang dari 60 menit hanya tampilkan menit', () => {
    expect(formatDuration(45)).toBe('45 Menit (45 Menit)');
  });

  test('120 menit (kelipatan genap) hanya tampilkan jam', () => {
    expect(formatDuration(120)).toBe('2 Jam (120 Menit)');
  });

  test('jam dan menit sekaligus', () => {
    expect(formatDuration(210)).toBe('3 Jam 30 Menit (210 Menit)');
  });

  test('0 menit tetap tampilkan menit, tidak boleh string kosong', () => {
    expect(formatDuration(0)).toBe('0 Menit (0 Menit)');
  });
});
