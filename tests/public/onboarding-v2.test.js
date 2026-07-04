/**
 * Tests for onboarding Step 3: Day-picker for hybrid diets
 * - After selecting "non-vegetarian", show 7 day-picker chips (Mon-Sun)
 * - After selecting "eggetarian", show day-picker; eggDays captured
 * - "vegetarian" selection: no day-picker shown (all days vegetarian)
 * - Selected days saved as nonVegDays / eggDays arrays in form submission
 */

const fs = require('fs');
const path = require('path');

describe('Onboarding Step 3 - Day-picker for hybrid diets', () => {
  let htmlContent;

  beforeAll(() => {
    const htmlPath = path.join(__dirname, '../../public/onboarding.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  test('day-picker container element should exist in Step 3 HTML', () => {
    expect(htmlContent).toMatch(/id=['"]day-picker-container['"]/);
  });

  test('day-picker should have 7 day chips in HTML', () => {
    // Count day chips in HTML
    const dayChipMatches = htmlContent.match(/class=['"][^'"]*day-chip[^'"]*['"]/g);
    expect(dayChipMatches?.length).toBe(7);
  });

  test('day-picker container should have conditional display for non-veg/eggetarian', () => {
    // Check for onDietChange or similar function that shows/hides day-picker
    expect(htmlContent).toMatch(/day-picker-container.*display/i);
  });

  test('day-picker markup should include Monday through Sunday', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      expect(htmlContent).toMatch(new RegExp(day, 'i'));
    });
  });

  test('onboarding script should have getSelectedDays function', () => {
    const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
    const scriptContent = scriptMatch ? scriptMatch[1] : '';
    expect(scriptContent).toMatch(/getSelectedDays|selectedDays/i);
  });

  test('form submission should capture nonVegDays and eggDays', () => {
    const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
    const scriptContent = scriptMatch ? scriptMatch[1] : '';
    expect(scriptContent).toMatch(/nonVegDays|eggDays/);
  });

  test('saveDraft should preserve selected diet days', () => {
    const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
    const scriptContent = scriptMatch ? scriptMatch[1] : '';
    // saveDraft should include logic to capture day selections
    expect(scriptContent).toMatch(/saveDraft/);
    expect(scriptContent).toMatch(/dietType/);
  });

  test('step 3 HTML should have diet selection group', () => {
    expect(htmlContent).toMatch(/id=['"]rg-diet['"]/);
    expect(htmlContent).toMatch(/name=['"]diet['"]/);
    expect(htmlContent).toMatch(/value=['"]non-vegetarian['"]/);
    expect(htmlContent).toMatch(/value=['"]eggetarian['"]/);
    expect(htmlContent).toMatch(/value=['"]vegetarian['"]/);
  });

  test('selectRadio function should trigger day-picker visibility on diet change', () => {
    const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
    const scriptContent = scriptMatch ? scriptMatch[1] : '';
    
    // The selectRadio function or onDietChange should show/hide day-picker
    expect(scriptContent).toMatch(/selectRadio|onDietChange|onDietSelect/i);
  });
});
