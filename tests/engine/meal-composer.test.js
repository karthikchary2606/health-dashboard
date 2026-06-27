'use strict';

const { getMeals } = require('../../server/engine/meal-composer');

const siNonVeg    = { cuisinePreference: 'south-indian',  dietType: 'non-vegetarian', healthConditions: [] };
const siVeg       = { cuisinePreference: 'south-indian',  dietType: 'vegetarian',     healthConditions: [] };
const niNonVeg    = { cuisinePreference: 'north-indian',  dietType: 'non-vegetarian', healthConditions: [] };
const mixedNonVeg = { cuisinePreference: 'mixed',         dietType: 'non-vegetarian', healthConditions: [] };
const siEgg       = { cuisinePreference: 'south-indian',  dietType: 'eggetarian',     healthConditions: [] };

describe('getMeals', () => {
  test('returns a non-empty string', () => {
    const result = getMeals(siNonVeg, 'lunch', 'weight-loss', 0, 0);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('deterministic — same inputs return same output', () => {
    const a = getMeals(siNonVeg, 'dinner', 'weight-loss', 2, 4);
    const b = getMeals(siNonVeg, 'dinner', 'weight-loss', 2, 4);
    expect(a).toBe(b);
  });

  test('varies across days within a week', () => {
    const meals = Array.from({ length: 7 }, (_, d) =>
      getMeals(siVeg, 'lunch', 'muscle-gain', 0, d)
    );
    const unique = new Set(meals);
    expect(unique.size).toBeGreaterThan(1);
  });

  test('varies across weeks', () => {
    const meals = Array.from({ length: 6 }, (_, w) =>
      getMeals(siVeg, 'dinner', 'weight-loss', w, 0)
    );
    const unique = new Set(meals);
    expect(unique.size).toBeGreaterThan(1);
  });

  test('veg profile never gets meat meal', () => {
    const meatKeywords = /chicken|mutton|fish|prawn|egg|beef|pork|lamb/i;
    for (let w = 0; w < 6; w++) {
      for (let d = 0; d < 7; d++) {
        const meal = getMeals(siVeg, 'dinner', 'weight-loss', w, d);
        expect(meal).not.toMatch(meatKeywords);
      }
    }
  });

  test('non-veg profile can get meat meals', () => {
    const meatKeywords = /chicken|mutton|fish|prawn|beef|pork|lamb/i;
    const meals = Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => getMeals(siNonVeg, 'dinner', 'weight-loss', w, d))
    ).flat();
    const hasMeat = meals.some(m => meatKeywords.test(m));
    expect(hasMeat).toBe(true);
  });

  test('respects north-indian cuisine preference', () => {
    const niKeywords = /dal|roti|paneer|rajma|chole|biryani|paratha|sabzi|naan|lassi|poha|khichdi/i;
    const meals = Array.from({ length: 4 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => getMeals(niNonVeg, 'lunch', 'weight-loss', w, d))
    ).flat();
    const hasNI = meals.some(m => niKeywords.test(m));
    expect(hasNI).toBe(true);
  });

  test('mixed cuisine rotates across weeks', () => {
    const siData = require('../../server/meals/south-indian');
    const niData = require('../../server/meals/north-indian');
    const coData = require('../../server/meals/continental');

    const w0 = getMeals(mixedNonVeg, 'lunch', 'weight-loss', 0, 0);
    const w1 = getMeals(mixedNonVeg, 'lunch', 'weight-loss', 1, 0);
    const w2 = getMeals(mixedNonVeg, 'lunch', 'weight-loss', 2, 0);
    const w3 = getMeals(mixedNonVeg, 'lunch', 'weight-loss', 3, 0);

    // Verify rotation produces meals from the correct cuisine pool
    expect(siData.lunch['non-veg']).toContain(w0); // week 0 → south-indian
    expect(niData.lunch['non-veg']).toContain(w1); // week 1 → north-indian
    expect(coData.lunch['non-veg']).toContain(w2); // week 2 → continental
    expect(siData.lunch['non-veg']).toContain(w3); // week 3 → south-indian again
    // All three cuisines must produce distinct meals
    expect(new Set([w0, w1, w2]).size).toBe(3);
  });

  test('all mealTypes work without throwing', () => {
    const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
    mealTypes.forEach(mt => {
      expect(() => getMeals(siVeg, mt, 'weight-loss', 0, 0)).not.toThrow();
      const result = getMeals(siVeg, mt, 'weight-loss', 0, 0);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  test('eggetarian gets egg dishes but not meat', () => {
    const meatKeywords = /chicken|mutton|fish|prawn|beef|pork|lamb/i;
    for (let d = 0; d < 7; d++) {
      const meal = getMeals(siEgg, 'breakfast', 'weight-loss', 0, d);
      expect(meal).not.toMatch(meatKeywords);
    }
    // Verify eggetarian pool is actually used (different from veg pool)
    const eggMeals = Array.from({ length: 7 }, (_, d) =>
      getMeals(siEgg, 'breakfast', 'weight-loss', 0, d)
    );
    const vegMeals = Array.from({ length: 7 }, (_, d) =>
      getMeals(siVeg, 'breakfast', 'weight-loss', 0, d)
    );
    // Eggetarian and veg pools are distinct, so at least some meals should differ
    expect(eggMeals).not.toEqual(vegMeals);
  });
});
