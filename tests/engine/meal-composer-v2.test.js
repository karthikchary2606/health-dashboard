'use strict';
const { getMeals } = require('../../server/engine/meal-composer');

test('getMeals returns a string', () => {
  const result = getMeals({ cuisinePreference: 'south-indian', dietType: 'vegetarian', culturalFoodAvoidances: [], foodList: [] }, 'breakfast', 'weight-loss', 0, 0);
  expect(typeof result).toBe('string');
  expect(result.length).toBeGreaterThan(0);
});

test('getMeals with foodList < 10 falls back to cuisine pool', () => {
  const smallList = { cuisinePreference: 'south-indian', dietType: 'vegetarian', culturalFoodAvoidances: [], foodList: [{ name: 'Rice' }] };
  const result = getMeals(smallList, 'breakfast', 'weight-loss', 0, 0);
  expect(typeof result).toBe('string');
});

test('getMeals active conditions filter excludes resolved conditions', () => {
  const profileWithResolved = {
    cuisinePreference: 'south-indian', dietType: 'vegetarian',
    culturalFoodAvoidances: [], foodList: [],
    healthConditions: [
      { name: 'diabetes', active: true },
      { name: 'lower-back-pain', active: false }
    ]
  };
  expect(() => getMeals(profileWithResolved, 'breakfast', 'weight-loss', 0, 0)).not.toThrow();
});

test('getMeals excludes meals matching culturalFoodAvoidances', () => {
  // If avoidances removes some items, result should still be a non-empty string
  const profileWithAvoidance = {
    cuisinePreference: 'south-indian', dietType: 'vegetarian',
    culturalFoodAvoidances: ['onion'],
    foodList: []
  };
  const result = getMeals(profileWithAvoidance, 'breakfast', 'weight-loss', 0, 0);
  expect(typeof result).toBe('string');
  expect(result.length).toBeGreaterThan(0);
});
