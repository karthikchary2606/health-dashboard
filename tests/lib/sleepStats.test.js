'use strict';
const { computeSleepStats, GOAL_MINUTES } = require('../../lib/sleepStats');

// Helper: returns a Date for a given YYYY-MM-DD string at noon LOCAL time
function d(str) {
  const [y, m, day] = str.split('-').map(Number);
  return new Date(y, m - 1, day, 12, 0, 0); // local noon — avoids UTC midnight drift
}

describe('computeSleepStats', () => {
  test('returns zeros when entries array is empty', () => {
    const result = computeSleepStats([]);
    expect(result).toEqual({ avgDurationMinutes: 0, avgQuality: 0, goalNightsThisWeek: 0, currentStreak: 0 });
  });

  test('returns zeros when entries is null', () => {
    const result = computeSleepStats(null);
    expect(result).toEqual({ avgDurationMinutes: 0, avgQuality: 0, goalNightsThisWeek: 0, currentStreak: 0 });
  });

  test('computes avgDurationMinutes correctly', () => {
    const entries = [
      { date: '2026-06-25', durationMinutes: 480, quality: 5 },
      { date: '2026-06-24', durationMinutes: 360, quality: 3 },
    ];
    const { avgDurationMinutes } = computeSleepStats(entries, d('2026-06-25'));
    expect(avgDurationMinutes).toBe(420); // (480+360)/2
  });

  test('rounds avgQuality to 1 decimal', () => {
    const entries = [
      { date: '2026-06-25', durationMinutes: 480, quality: 4 },
      { date: '2026-06-24', durationMinutes: 480, quality: 3 },
      { date: '2026-06-23', durationMinutes: 480, quality: 5 },
    ];
    const { avgQuality } = computeSleepStats(entries, d('2026-06-25'));
    expect(avgQuality).toBe(4.0); // (4+3+5)/3 = 4.0
  });

  test('counts goal nights this week correctly (>=450 min)', () => {
    // now = Wednesday 2026-06-24; week Mon 2026-06-22 to Sun 2026-06-28
    const entries = [
      { date: '2026-06-24', durationMinutes: 480, quality: 4 }, // Wed — goal met
      { date: '2026-06-23', durationMinutes: 420, quality: 3 }, // Tue — below goal
      { date: '2026-06-22', durationMinutes: 450, quality: 4 }, // Mon — exactly goal, met
      { date: '2026-06-15', durationMinutes: 500, quality: 5 }, // prev week — excluded
    ];
    const { goalNightsThisWeek } = computeSleepStats(entries, d('2026-06-24'));
    expect(goalNightsThisWeek).toBe(2);
  });

  test('streak: 0 when no entry today or yesterday', () => {
    const entries = [
      { date: '2026-06-20', durationMinutes: 480, quality: 4 },
    ];
    const { currentStreak } = computeSleepStats(entries, d('2026-06-25'));
    expect(currentStreak).toBe(0);
  });

  test('streak: counts consecutive days ending today', () => {
    const entries = [
      { date: '2026-06-25', durationMinutes: 480, quality: 4 },
      { date: '2026-06-24', durationMinutes: 460, quality: 3 },
      { date: '2026-06-23', durationMinutes: 470, quality: 5 },
      // gap — 2026-06-22 missing
      { date: '2026-06-21', durationMinutes: 480, quality: 4 },
    ];
    const { currentStreak } = computeSleepStats(entries, d('2026-06-25'));
    expect(currentStreak).toBe(3); // stops at the gap
  });

  test('streak: resets when a day is skipped', () => {
    const entries = [
      { date: '2026-06-25', durationMinutes: 480, quality: 4 },
      // 2026-06-24 missing
      { date: '2026-06-23', durationMinutes: 480, quality: 4 },
    ];
    const { currentStreak } = computeSleepStats(entries, d('2026-06-25'));
    expect(currentStreak).toBe(1);
  });

  test('GOAL_MINUTES constant is 450', () => {
    expect(GOAL_MINUTES).toBe(450);
  });
});
