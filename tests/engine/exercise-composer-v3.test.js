'use strict';
const {
  getYogaExercises,
  getSuryaNamaskarRounds,
} = require('../../server/engine/exercise-composer');

describe('getYogaExercises', () => {
  test('exists and is a function', () => {
    expect(typeof getYogaExercises).toBe('function');
  });

  test('returns array for hatha', () => {
    const result = getYogaExercises('hatha');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns array for vinyasa', () => {
    const result = getYogaExercises('vinyasa');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns array for pranayama-only', () => {
    const result = getYogaExercises('pranayama-only');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('falls back to hatha for unknown type', () => {
    expect(getYogaExercises('unknown-style')).toEqual(getYogaExercises('hatha'));
  });

  test('each exercise has name (string), sets (number), reps (string), note (string), cat (string)', () => {
    ['hatha', 'vinyasa', 'pranayama-only'].forEach(type => {
      getYogaExercises(type).forEach(ex => {
        expect(typeof ex.name).toBe('string');
        expect(typeof ex.sets).toBe('number');
        expect(typeof ex.reps).toBe('string');
        expect(typeof ex.note).toBe('string');
        expect(typeof ex.cat).toBe('string');
      });
    });
  });

  test('hatha and vinyasa return different exercises', () => {
    const hatha = getYogaExercises('hatha').map(e => e.name);
    const vinyasa = getYogaExercises('vinyasa').map(e => e.name);
    expect(hatha).not.toEqual(vinyasa);
  });
});

describe('getSuryaNamaskarRounds', () => {
  test('young fit user gets highest rounds', () => {
    const rounds = getSuryaNamaskarRounds({ age: 25, fitnessLevel: 'very-active' });
    expect(rounds).toBeGreaterThanOrEqual(12);
  });

  test('older sedentary user gets lower rounds', () => {
    const rounds = getSuryaNamaskarRounds({ age: 55, fitnessLevel: 'sedentary' });
    expect(rounds).toBeLessThanOrEqual(8);
  });

  test('returns a number', () => {
    const rounds = getSuryaNamaskarRounds({ age: 30, fitnessLevel: 'moderately-active' });
    expect(typeof rounds).toBe('number');
    expect(rounds).toBeGreaterThan(0);
  });
});
