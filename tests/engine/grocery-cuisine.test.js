const { buildGroceryList } = require('../../server/engine/plan-builder');

describe('buildGroceryList cuisine personalization', () => {
  test('south-indian non-veg includes fish and curry leaves', () => {
    const list = buildGroceryList({ dietType: 'non-vegetarian', cuisinePreference: 'south-indian' });
    const allItems = list.flatMap(c => c.items).map(i => i.toLowerCase());
    expect(allItems.some(i => i.includes('fish'))).toBe(true);
    expect(allItems.some(i => i.includes('curry leaves'))).toBe(true);
  });

  test('north-indian vegetarian includes paneer and atta, no chicken', () => {
    const list = buildGroceryList({ dietType: 'vegetarian', cuisinePreference: 'north-indian' });
    const allItems = list.flatMap(c => c.items).map(i => i.toLowerCase());
    expect(allItems.some(i => i.includes('paneer'))).toBe(true);
    expect(allItems.some(i => i.includes('atta'))).toBe(true);
    expect(allItems.some(i => i.includes('chicken'))).toBe(false);
  });

  test('continental vegan includes pasta and olive oil, no salmon or mozzarella', () => {
    const list = buildGroceryList({ dietType: 'vegan', cuisinePreference: 'continental' });
    const allItems = list.flatMap(c => c.items).map(i => i.toLowerCase());
    expect(allItems.some(i => i.includes('pasta'))).toBe(true);
    expect(allItems.some(i => i.includes('olive oil'))).toBe(true);
    expect(allItems.some(i => i.includes('salmon'))).toBe(false);
    expect(allItems.some(i => i.includes('mozzarella'))).toBe(false);
  });

  test('food allergy filter removes matching items', () => {
    const list = buildGroceryList({
      dietType: 'non-vegetarian',
      cuisinePreference: 'south-indian',
      foodAllergies: ['prawns'],
    });
    const allItems = list.flatMap(c => c.items).map(i => i.toLowerCase());
    expect(allItems.some(i => i.includes('prawns'))).toBe(false);
  });

  test('missing cuisinePreference defaults to mixed', () => {
    const list = buildGroceryList({ dietType: 'non-vegetarian' });
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].items.length).toBeGreaterThan(0);
  });
});
