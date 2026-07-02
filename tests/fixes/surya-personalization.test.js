'use strict';

/**
 * Tests for MEDIUM-1: Surya Namaskar Not Personalized by Yoga Style
 * Ensures Surya Namaskar rounds are adjusted based on yoga style preference
 */

const { getSuryaNamaskarRounds, getYogaExercises } = require('../../server/engine/exercise-composer');

describe('MEDIUM-1: Surya Namaskar Personalization by Yoga Style', () => {
  test('getSuryaNamaskarRounds returns base value when yogaStyle not specified', () => {
    const rounds = getSuryaNamaskarRounds({ age: 30, fitnessLevel: 'moderately-active' });
    expect(rounds).toBe(10); // (8 + 12) / 2 = 10
  });

  test('getSuryaNamaskarRounds applies 0.8x multiplier for hatha style', () => {
    const rounds = getSuryaNamaskarRounds({
      age: 30,
      fitnessLevel: 'moderately-active',
      yogaStyle: 'hatha'
    });
    expect(rounds).toBe(8); // Math.round(10 * 0.8) = 8
  });

  test('getSuryaNamaskarRounds applies 1.2x multiplier for vinyasa style', () => {
    const rounds = getSuryaNamaskarRounds({
      age: 30,
      fitnessLevel: 'moderately-active',
      yogaStyle: 'vinyasa'
    });
    expect(rounds).toBe(12); // Math.round(10 * 1.2) = 12
  });

  test('getSuryaNamaskarRounds returns 0 for pranayama-only style', () => {
    const rounds = getSuryaNamaskarRounds({
      age: 30,
      fitnessLevel: 'moderately-active',
      yogaStyle: 'pranayama-only'
    });
    expect(rounds).toBe(0);
  });

  test('getSuryaNamaskarRounds returns 0 for pranayama-only regardless of age/fitness', () => {
    const rounds1 = getSuryaNamaskarRounds({
      age: 25,
      fitnessLevel: 'very-active',
      yogaStyle: 'pranayama-only'
    });
    expect(rounds1).toBe(0);

    const rounds2 = getSuryaNamaskarRounds({
      age: 65,
      fitnessLevel: 'sedentary',
      yogaStyle: 'pranayama-only'
    });
    expect(rounds2).toBe(0);
  });

  test('hatha users get fewer Surya rounds than vinyasa users with same profile', () => {
    const profile = { age: 40, fitnessLevel: 'lightly-active' };
    
    const hathRounds = getSuryaNamaskarRounds({ ...profile, yogaStyle: 'hatha' });
    const vinyasaRounds = getSuryaNamaskarRounds({ ...profile, yogaStyle: 'vinyasa' });
    
    expect(hathRounds).toBeLessThan(vinyasaRounds);
  });

  test('getSuryaNamaskarRounds handles none style same as undefined', () => {
    const roundsNone = getSuryaNamaskarRounds({
      age: 30,
      fitnessLevel: 'moderately-active',
      yogaStyle: 'none'
    });
    
    const roundsUndefined = getSuryaNamaskarRounds({
      age: 30,
      fitnessLevel: 'moderately-active'
    });
    
    expect(roundsNone).toBe(roundsUndefined);
  });

  test('multiplier correctly scaled for sedentary + hatha', () => {
    const profile = { age: 55, fitnessLevel: 'sedentary', yogaStyle: 'hatha' };
    const rounds = getSuryaNamaskarRounds(profile);
    // Base for age 46-60 + sedentary = 5 (min)
    // 5 * 0.8 = 4
    expect(rounds).toBe(4);
  });

  test('multiplier correctly scaled for very-active + vinyasa', () => {
    const profile = { age: 25, fitnessLevel: 'very-active', yogaStyle: 'vinyasa' };
    const rounds = getSuryaNamaskarRounds(profile);
    // Base for age <30 + very-active = (12 + 24) / 2 = 18
    // 18 * 1.2 = 21.6 ≈ 22
    expect(rounds).toBeGreaterThanOrEqual(21);
    expect(rounds).toBeLessThanOrEqual(22);
  });

  test('getYogaExercises includes pranayama techniques for pranayama-only style', () => {
    const exercises = getYogaExercises('pranayama-only');
    const exerciseNames = exercises.map(e => e.name);
    
    expect(exerciseNames.some(name => name.includes('Anulom Vilom'))).toBe(true);
    expect(exerciseNames.some(name => name.includes('Bhramari'))).toBe(true);
    expect(exerciseNames.some(name => name.includes('Kapalbhati'))).toBe(true);
  });
});
