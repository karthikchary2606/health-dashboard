// Node-compatible test — extract RECIPES array without window dependency
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../public/js/recipes.js'), 'utf8');
const match = src.match(/const RECIPES = \[([\s\S]*?)\];/);
const RECIPES = eval('[' + match[1] + ']');

describe('RECIPES array', () => {
  test('north-indian count >= 45', () => {
    const ni = RECIPES.filter(r => r.cuisine === 'north-indian');
    expect(ni.length).toBeGreaterThanOrEqual(45);
  });
  test('continental count >= 30', () => {
    const c = RECIPES.filter(r => r.cuisine === 'continental');
    expect(c.length).toBeGreaterThanOrEqual(30);
  });
  test('all recipes have required fields', () => {
    RECIPES.forEach(r => {
      expect(typeof r.id).toBe('number');
      expect(typeof r.name).toBe('string');
      expect(typeof r.cuisine).toBe('string');
      expect(Array.isArray(r.dietType)).toBe(true);
      expect(typeof r.cal).toBe('number');
      expect(typeof r.p).toBe('number');
    });
  });
  test('no duplicate IDs', () => {
    const ids = RECIPES.map(r => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
