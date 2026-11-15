const { passwordProblem} = require('../api');

test('passwordProblem accepts a password at the 8-character minimum', () => {
  expect(passwordProblem('abc12345')).toBe('');
});