'use strict';
const { getExercises, getSuryaNamaskarRounds } = require('../../server/engine/exercise-composer');

test('getSuryaNamaskarRounds is exported', () => {
  expect(typeof getSuryaNamaskarRounds).toBe('function');
});

test('getSuryaNamaskarRounds: age < 30 returns value in 12-24 range', () => {
  const rounds = getSuryaNamaskarRounds({ age: 25, fitnessLevel: 'very-active' });
  expect(rounds).toBeGreaterThanOrEqual(12);
  expect(rounds).toBeLessThanOrEqual(24);
});

test('getSuryaNamaskarRounds: age 60+ returns 3-8 range', () => {
  const rounds = getSuryaNamaskarRounds({ age: 65, fitnessLevel: 'sedentary' });
  expect(rounds).toBeGreaterThanOrEqual(3);
  expect(rounds).toBeLessThanOrEqual(5);
});

test('getSuryaNamaskarRounds: age 46-60 returns 5-12 range', () => {
  const rounds = getSuryaNamaskarRounds({ age: 52, fitnessLevel: 'moderately-active' });
  expect(rounds).toBeGreaterThanOrEqual(5);
  expect(rounds).toBeLessThanOrEqual(8);
});

test('getExercises does not throw with resolved conditions', () => {
  const profileWithResolved = {
    age: 30, fitnessLevel: 'moderately-active', equipmentAvailable: [],
    healthConditions: [
      { name: 'lower-back-pain', active: false }
    ]
  };
  // Resolved condition should NOT be treated as active contraindication
  expect(() => getExercises(profileWithResolved, 'legs', 'weight-loss')).not.toThrow();
});

test('getExercises does not throw with no conditions', () => {
  expect(() => getExercises({ age: 35, fitnessLevel: 'moderately-active', equipmentAvailable: [], healthConditions: [], medications: [] }, 'chest', 'general-fitness')).not.toThrow();
});
