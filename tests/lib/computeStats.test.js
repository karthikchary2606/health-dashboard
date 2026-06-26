const computeStats = require('../../lib/computeStats');

const baseProfile = { waterGoalL: 2.5 };

function makeLog(overrides) {
  return {
    date: new Date(),
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    waterIntake: 0,
    workoutCompleted: false,
    cardioCompleted: false,
    mood: null,
    weight: null,
    ...overrides
  };
}

test('returns zero stats for empty logs', () => {
  const stats = computeStats([], baseProfile);
  expect(stats.avgCalories).toBe(0);
  expect(stats.workoutCompletionRate).toBe(0);
  expect(stats.waterGoalMetDays).toBe(0);
});

test('calculates avgCalories correctly', () => {
  const logs = [makeLog({ calories: 1800 }), makeLog({ calories: 2200 })];
  const stats = computeStats(logs, baseProfile);
  expect(stats.avgCalories).toBe(2000);
});

test('uses profile.waterGoalL as threshold (not hardcoded 3)', () => {
  const logs = [makeLog({ waterIntake: 2.6 }), makeLog({ waterIntake: 2.3 })];
  const stats = computeStats(logs, { waterGoalL: 2.5 });
  expect(stats.waterGoalMetDays).toBe(1);
});

test('calculates workoutCompletionRate as percentage', () => {
  const logs = [
    makeLog({ workoutCompleted: true }),
    makeLog({ workoutCompleted: true }),
    makeLog({ workoutCompleted: false })
  ];
  const stats = computeStats(logs, baseProfile);
  expect(stats.workoutCompletionRate).toBeCloseTo(66.67, 1);
});

test('returns latestWeight from most recent log with a weight value', () => {
  const logs = [
    makeLog({ date: new Date('2025-01-01'), weight: 94 }),
    makeLog({ date: new Date('2025-01-03'), weight: null }),
    makeLog({ date: new Date('2025-01-02'), weight: 93 })
  ];
  const stats = computeStats(logs, baseProfile);
  expect(stats.latestWeight).toBe(93); // most recent by date with weight value
});
