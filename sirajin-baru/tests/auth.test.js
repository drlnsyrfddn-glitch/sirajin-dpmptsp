const { hashPassword } = require('../src/Auth.js');

describe('hashPassword', () => {
  test('menghasilkan hash hex 64 karakter (SHA-256)', () => {
    const hash = hashPassword('rahasia123');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('deterministik — input sama hasilkan hash sama', () => {
    expect(hashPassword('rahasia123')).toBe(hashPassword('rahasia123'));
  });

  test('input beda hasilkan hash beda', () => {
    expect(hashPassword('rahasia123')).not.toBe(hashPassword('rahasia124'));
  });

  test('string kosong tetap hasilkan hash hex 64 karakter yang valid', () => {
    const hash = hashPassword('');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
