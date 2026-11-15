const { normalizeEmail } = require('../api');

describe('normalizeEmail', () => {
  test('trims whitespace and lowercases the address', () => {
    expect(normalizeEmail('  Player@Example.COM  ')).toBe('player@example.com');
  });

  test('returns an empty string for whitespace-only input', () => {
    expect(normalizeEmail('   ')).toBe('');
  });

  test('returns an empty string when the email is missing', () => {
    expect(normalizeEmail(undefined)).toBe('');
  });
});