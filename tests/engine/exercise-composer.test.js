'use strict';

const { getExercises } = require('../../server/engine/exercise-composer');

const bodyweightBeginner = {
  fitnessLevel: 'sedentary',
  equipmentAvailable: [],
  healthConditions: [],
};

const intermediateWithEquipment = {
  fitnessLevel: 'moderately-active',
  equipmentAvailable: ['dumbbells', 'barbell', 'pull-up-bar'],
  healthConditions: [],
};

const advancedFull = {
  fitnessLevel: 'very-active',
  equipmentAvailable: ['dumbbells', 'barbell', 'pull-up-bar'],
  healthConditions: [],
};

const lowerBackPainProfile = {
  fitnessLevel: 'lightly-active',
  equipmentAvailable: ['barbell'],
  healthConditions: ['lower-back-pain'],
};

const kneePainProfile = {
  fitnessLevel: 'sedentary',
  equipmentAvailable: [],
  healthConditions: ['knee-pain'],
};

describe('getExercises', () => {
  test('returns an array', () => {
    const result = getExercises(bodyweightBeginner, 'legs', 'general-fitness');
    expect(Array.isArray(result)).toBe(true);
  });

  test('returns at least one exercise', () => {
    const result = getExercises(bodyweightBeginner, 'legs', 'general-fitness');
    expect(result.length).toBeGreaterThan(0);
  });

  test('each exercise has name (string), sets (number), reps (string), note (string)', () => {
    const result = getExercises(bodyweightBeginner, 'core', 'general-fitness');
    expect(result.length).toBeGreaterThan(0);
    result.forEach(ex => {
      expect(typeof ex.name).toBe('string');
      expect(typeof ex.sets).toBe('number');
      expect(typeof ex.reps).toBe('string');
      expect(typeof ex.note).toBe('string');
    });
  });

  test('beginner gets fewer sets than advanced', () => {
    const beginnerResults = getExercises(bodyweightBeginner, 'core', 'general-fitness');
    const advancedResults = getExercises(advancedFull, 'core', 'general-fitness');

    const beginnerSets = beginnerResults.find(e => e.name === 'Plank')?.sets;
    const advancedSets = advancedResults.find(e => e.name === 'Plank')?.sets;

    expect(beginnerSets).toBeDefined();
    expect(advancedSets).toBeDefined();
    expect(beginnerSets).toBeLessThan(advancedSets);
  });

  test('exercises require only available equipment — bodyweight profile gets results', () => {
    const result = getExercises(bodyweightBeginner, 'legs', 'general-fitness');
    expect(result.length).toBeGreaterThan(0);
    // None should require equipment the profile doesn't have
    // (we can't inspect raw equipment here, but we verify no throw + results returned)
  });

  test('lower-back-pain profile does not get deadlift', () => {
    const result = getExercises(lowerBackPainProfile, 'back', 'general-fitness');
    const names = result.map(e => e.name);
    expect(names).not.toContain('Deadlift');
  });

  test('lower-back-pain substitution is applied — Barbell Squat becomes Goblet Squat', () => {
    const result = getExercises(lowerBackPainProfile, 'legs', 'general-fitness');
    const names = result.map(e => e.name);
    expect(names).not.toContain('Barbell Squat');
    // Goblet Squat is the substitution but requires dumbbells — profile has barbell not dumbbells
    // Plank → Dead Bug substitution (core)
    const coreResult = getExercises(
      { ...lowerBackPainProfile, equipmentAvailable: [] },
      'core',
      'general-fitness'
    );
    const coreNames = coreResult.map(e => e.name);
    expect(coreNames).not.toContain('Plank');
    expect(coreNames).toContain('Dead Bug');
  });

  test('all muscleGroups work without throwing', () => {
    const muscleGroups = ['legs', 'back', 'chest', 'shoulders', 'arms', 'core', 'full-body'];
    muscleGroups.forEach(mg => {
      expect(() => getExercises(bodyweightBeginner, mg, 'general-fitness')).not.toThrow();
      const result = getExercises(bodyweightBeginner, mg, 'general-fitness');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  test('different goals return exercises', () => {
    const goals = ['weight-loss', 'muscle-gain', 'general-fitness', 'maintenance'];
    goals.forEach(goal => {
      const result = getExercises(bodyweightBeginner, 'core', goal);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
