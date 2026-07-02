'use strict';

const { applyRules } = require('../../server/engine/personalization-rules');

describe('applyRules', () => {
  test('applies hard rules before cuisine and affinity, then ranks remaining by affinity', () => {
    const profile = {
      dietType: 'vegetarian',
      foodAllergies: ['peanut'],
      culturalFoodAvoidances: ['onion'],
      cuisinePreference: 'south-indian',
      foodList: [{ name: 'tofu' }]
    };

    const recipes = [
      { name: 'Chicken Pepper Fry', dietType: ['non-vegetarian'], cuisine: 'south-indian', ingredients: ['chicken', 'tofu'] },
      { name: 'Peanut Veg Curry', dietType: ['vegetarian'], cuisine: 'south-indian', ingredients: ['peanut', 'tofu'] },
      { name: 'Onion Vegan Stew', dietType: ['vegan'], cuisine: 'south-indian', ingredients: ['onion', 'tofu'] },
      { name: 'Tofu Stir Fry', dietType: ['vegan'], cuisine: 'continental', ingredients: ['tofu'] },
      { name: 'Sambar', dietType: ['vegetarian'], cuisine: 'south-indian', ingredients: ['dal'] },
      { name: 'Tofu Poriyal', dietType: ['vegetarian'], cuisine: 'south-indian', ingredients: ['tofu'] }
    ];

    const result = applyRules(profile, recipes);
    expect(result.map(r => r.name)).toEqual(['Tofu Poriyal', 'Sambar']);
  });

  test('vegetarian includes vegan recipes', () => {
    const profile = { dietType: 'vegetarian' };
    const recipes = [
      { name: 'Vegan Bowl', dietType: ['vegan'], ingredients: ['tofu'] },
      { name: 'Veg Bowl', dietType: ['vegetarian'], ingredients: ['paneer'] },
      { name: 'Chicken Bowl', dietType: ['non-vegetarian'], ingredients: ['chicken'] }
    ];

    const result = applyRules(profile, recipes);
    expect(result.map(r => r.name)).toEqual(['Vegan Bowl', 'Veg Bowl']);
  });

  test('foodList affects ranking but does not hard-filter unmatched recipes', () => {
    const profile = {
      dietType: 'vegetarian',
      cuisinePreference: 'south-indian',
      foodList: [{ name: 'tofu' }]
    };
    const recipes = [
      { name: 'No Match Meal', dietType: ['vegetarian'], cuisine: 'south-indian', ingredients: ['dal'] },
      { name: 'Match Meal', dietType: ['vegetarian'], cuisine: 'south-indian', ingredients: ['tofu'] }
    ];

    const result = applyRules(profile, recipes);
    expect(result.map(r => r.name)).toEqual(['Match Meal', 'No Match Meal']);
  });

  test('handles missing profile fields safely', () => {
    const recipes = [
      { name: 'Unknown Recipe' },
      { name: 'Veg Recipe', dietType: ['vegetarian'], ingredients: ['dal'] }
    ];

    expect(() => applyRules({}, recipes)).not.toThrow();
    expect(applyRules({}, recipes).map(r => r.name)).toEqual(['Unknown Recipe', 'Veg Recipe']);
  });
});
