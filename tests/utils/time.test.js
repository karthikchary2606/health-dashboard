'use strict';
const { todayIST } = require('../../server/utils/time');

describe('todayIST', () => {
  test('returns day string in lowercase', () => {
    const { day } = todayIST();
    const valid = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    expect(valid).toContain(day);
  });

  test('returns isoDate in YYYY-MM-DD format', () => {
    const { isoDate } = todayIST();
    expect(isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('IST date is UTC date shifted by +5:30', () => {
    // 18:00 UTC Monday → IST 23:30 Monday = still Monday
    const fake = new Date('2026-07-06T18:00:00.000Z');
    const { day, isoDate } = todayIST(fake);
    expect(day).toBe('monday');
    expect(isoDate).toBe('2026-07-06');
  });

  test('IST rolls over to next day before UTC does', () => {
    // 19:00 UTC Monday → IST 00:30 Tuesday
    const fake = new Date('2026-07-06T19:00:00.000Z');
    const { day, isoDate } = todayIST(fake);
    expect(day).toBe('tuesday');
    expect(isoDate).toBe('2026-07-07');
  });
});
