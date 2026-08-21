const { hashPassword } = require('../src/Auth.js');

describe('hashPassword', () => {
  test('hash yang sama untuk input yang sama', () => {
    expect(hashPassword('rahasia123')).toBe(hashPassword('rahasia123'));
  });

  test('hash berbeda untuk input berbeda', () => {
    expect(hashPassword('rahasia123')).not.toBe(hashPassword('rahasia124'));
  });

  test('hash tidak sama dengan plaintext-nya', () => {
    expect(hashPassword('rahasia123')).not.toBe('rahasia123');
  });
});
