'use strict';
const computeStats = require('../../lib/computeStats');

const logs = [
  {
    date: '2026-06-25', weight: 80, waterIntake: 2.5, completedWorkout: true,
    moodScore: 4, energyScore: 3,
    meals: [
      { mealType: 'breakfast', recipeName: 'Idli',  calories: 200, proteinG: 8,  carbsG: 40, fatG: 2 },
      { mealType: 'lunch',     recipeName: 'Rice',  calories: 350, proteinG: 10, carbsG: 70, fatG: 3 }
    ],
    sleepEntry: { durationMinutes: 420, quality: 4 }
  },
  {
    date: '2026-06-26', weight: 79.8, waterIntake: 2.0, completedWorkout: false,
    moodScore: 3, energyScore: 2,
    meals: [
      { mealType: 'breakfast', recipeName: 'Dosa', calories: 180, proteinG: 6, carbsG: 35, fatG: 3 }
    ],
    sleepEntry: { durationMinutes: 390, quality: 3 }
  }
];

const profile = { waterGoalL: 2.5, startWeightKg: 82 };

test('computeStats returns avgCalories', () => {
  const stats = computeStats(logs, profile);
  // Day 1: 550, Day 2: 180 → avg 365
  expect(stats.avgCalories).toBe(365);
});

test('computeStats returns avgProtein', () => {
  const stats = computeStats(logs, profile);
  // Day 1: 18g, Day 2: 6g → avg 12
  expect(stats.avgProtein).toBe(12);
});

test('computeStats returns avgSleepMinutes', () => {
  const stats = computeStats(logs, profile);
  // (420 + 390) / 2 = 405
  expect(stats.avgSleepMinutes).toBe(405);
});

test('computeStats returns avgMoodScore', () => {
  const stats = computeStats(logs, profile);
  // (4 + 3) / 2 = 3.5
  expect(stats.avgMoodScore).toBe(3.5);
});

test('computeStats returns avgEnergyScore', () => {
  const stats = computeStats(logs, profile);
  // (3 + 2) / 2 = 2.5
  expect(stats.avgEnergyScore).toBe(2.5);
});

test('computeStats handles logs with no meals gracefully', () => {
  const emptyLogs = [{ date: '2026-06-27', weight: 80, waterIntake: 2.0, completedWorkout: false }];
  const stats = computeStats(emptyLogs, profile);
  expect(stats.avgCalories).toBe(0);
  expect(stats.avgSleepMinutes).toBe(0);
});
