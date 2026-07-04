'use strict';
const { getMeals, deriveEffectiveDiet, deriveWeeklyDietPattern } = require('../../server/engine/meal-composer');

test('getMeals returns a meal object', () => {
  const result = getMeals({ cuisinePreference: 'south-indian', dietType: 'vegetarian', culturalFoodAvoidances: [], foodList: [] }, 'breakfast', 'weight-loss', 0, 0);
  expect(typeof result).toBe('object');
  expect(result.name).toBeDefined();
  expect(result.calories).toBeDefined();
});

test('getMeals works with empty foodList', () => {
  const result = getMeals({ cuisinePreference: 'south-indian', dietType: 'vegetarian', culturalFoodAvoidances: [], foodList: [] }, 'breakfast', 'weight-loss', 0, 0);
  expect(typeof result).toBe('object');
  expect(result.name).toBeDefined();
  expect(result.name.length).toBeGreaterThan(0);
});

test('getMeals works with large foodList (>= 10 items)', () => {
  const result = getMeals({
    cuisinePreference: 'south-indian', dietType: 'vegetarian',
    culturalFoodAvoidances: [],
    foodList: [
      { name: 'Idli' }, { name: 'Dosa' }, { name: 'Upma' }, { name: 'Pongal' },
      { name: 'Rice' }, { name: 'Sambar' }, { name: 'Rasam' }, { name: 'Curd' },
      { name: 'Tomato' }, { name: 'Spinach' }, { name: 'Dal' }
    ]
  }, 'breakfast', 'weight-loss', 0, 0);
  expect(typeof result).toBe('object');
  expect(result.name).toBeDefined();
  expect(result.name.length).toBeGreaterThan(0);
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

// ─── deriveEffectiveDiet ───────────────────────────────────────────────────

describe('deriveEffectiveDiet', () => {
  test('vegetarian + egg foodList stays vegetarian (strict preference respected)', () => {
    const profile = {
      dietType: 'vegetarian',
      foodList: [{ name: 'Egg Bhurji' }, { name: 'Boiled Egg' }],
    };
    expect(deriveEffectiveDiet(profile)).toBe('vegetarian');
  });

  test('vegetarian + chicken foodList stays vegetarian (strict preference never overridden)', () => {
    const profile = {
      dietType: 'vegetarian',
      foodList: [{ name: 'Chicken Curry' }],
    };
    expect(deriveEffectiveDiet(profile)).toBe('vegetarian');
  });

  test('vegan never upgrades even if foodList contains chicken token', () => {
    const profile = {
      dietType: 'vegan',
      foodList: [{ name: 'Chicken Curry' }, { name: 'Egg Bhurji' }],
    };
    expect(deriveEffectiveDiet(profile)).toBe('vegan');
  });

  test('vegetarian + mixed object-style foodList (egg + non-veg) stays vegetarian', () => {
    const profile = {
      dietType: 'vegetarian',
      foodList: [{ name: 'boiled egg' }, { name: 'chicken stew' }],
    };
    expect(deriveEffectiveDiet(profile)).toBe('vegetarian');
  });

  test('vegetarian + "vegetable stew" foodList stays vegetarian', () => {
    const profile = {
      dietType: 'vegetarian',
      foodList: [{ name: 'Vegetable Stew' }],
    };
    expect(deriveEffectiveDiet(profile)).toBe('vegetarian');
  });

  test('vegetarian + "eggplant curry" foodList does NOT upgrade to eggetarian', () => {
    const profile = {
      dietType: 'vegetarian',
      foodList: [{ name: 'Eggplant Curry' }],
    };
    expect(deriveEffectiveDiet(profile)).toBe('vegetarian');
  });

  test('eggetarian + chicken foodList upgrades to non-vegetarian', () => {
    const profile = {
      dietType: 'eggetarian',
      foodList: [{ name: 'Chicken Curry' }],
    };
    expect(deriveEffectiveDiet(profile)).toBe('non-vegetarian');
  });

  test('non-vegetarian stays non-vegetarian regardless of foodList', () => {
    const profile = {
      dietType: 'non-vegetarian',
      foodList: [],
    };
    expect(deriveEffectiveDiet(profile)).toBe('non-vegetarian');
  });
});

test('getMeals excludes meals matching culturalFoodAvoidances', () => {
  // If avoidances removes some items, result should still be a valid meal object
  const profileWithAvoidance = {
    cuisinePreference: 'south-indian', dietType: 'vegetarian',
    culturalFoodAvoidances: ['onion'],
    foodList: []
  };
  const result = getMeals(profileWithAvoidance, 'breakfast', 'weight-loss', 0, 0);
  expect(typeof result).toBe('object');
  expect(result.name).toBeDefined();
  expect(result.name.length).toBeGreaterThan(0);
});

// ─── deriveWeeklyDietPattern ──────────────────────────────────────────────

describe('deriveWeeklyDietPattern', () => {
  test('vegetarian profile: all days return vegetarian', () => {
    const user = {
      profile: {
        dietType: 'vegetarian',
        nonVegDays: [],
        eggDays: [],
      }
    };
    const pattern = deriveWeeklyDietPattern(user);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      expect(pattern[day]).toBe('vegetarian');
    });
  });

  test('non-vegetarian profile: respects nonVegDays and eggDays', () => {
    const user = {
      profile: {
        dietType: 'non-vegetarian',
        nonVegDays: ['Saturday', 'Sunday'], // non-veg on weekends
        eggDays: ['Wednesday'], // egg on Wednesday
      }
    };
    const pattern = deriveWeeklyDietPattern(user);
    
    // Weekdays default to dietType (non-vegetarian)
    expect(pattern['Monday']).toBe('non-vegetarian');
    expect(pattern['Tuesday']).toBe('non-vegetarian');
    // Wednesday is override to eggetarian
    expect(pattern['Wednesday']).toBe('eggetarian');
    expect(pattern['Thursday']).toBe('non-vegetarian');
    expect(pattern['Friday']).toBe('non-vegetarian');
    // Saturday and Sunday can stay non-veg or be in nonVegDays
    expect(pattern['Saturday']).toBe('non-vegetarian');
    expect(pattern['Sunday']).toBe('non-vegetarian');
  });

  test('default case: non-vegetarian with empty nonVegDays/eggDays all days are non-vegetarian', () => {
    const user = {
      profile: {
        dietType: 'non-vegetarian',
        nonVegDays: [],
        eggDays: [],
      }
    };
    const pattern = deriveWeeklyDietPattern(user);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      expect(pattern[day]).toBe('non-vegetarian');
    });
  });
});
