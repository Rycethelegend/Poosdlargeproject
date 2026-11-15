const { localDay } = require('../api');

test('localDay returns the previous day when the timezone crosses midnight', () => {
  const date = new Date('2026-11-15T02:30:00Z');

  // UTC−5 is 300 minutes behind UTC, so the local time is Nov 14 at 9:30 PM.
  expect(localDay(date, 300)).toBe('2026-11-14');
});