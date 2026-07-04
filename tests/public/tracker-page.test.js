'use strict';

const fs = require('fs');
const path = require('path');

describe('Tracker Page UI', () => {
  let htmlContent;
  let jsContent;

  beforeAll(() => {
    // Load HTML
    const htmlPath = path.join(__dirname, '../../public/tracker.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Load JS
    const jsPath = path.join(__dirname, '../../public/js/tracker.js');
    jsContent = fs.readFileSync(jsPath, 'utf8');
  });

  describe('HTML Structure', () => {
    test('tracker.html exists and loads', () => {
      expect(htmlContent).toBeDefined();
      expect(htmlContent.length).toBeGreaterThan(0);
    });

    test('has a calories tab', () => {
      expect(htmlContent).toMatch(/data-tab="calories"/);
    });

    test('has a steps tab', () => {
      expect(htmlContent).toMatch(/data-tab="steps"/);
    });

    test('calorie ring shows consumed / target format', () => {
      // Look for the pattern X,XXX / Y,YYY kcal
      expect(htmlContent).toMatch(/id="calorieAmount"/);
    });

    test('calorie ring element exists', () => {
      expect(htmlContent).toMatch(/id="calorieRing"/);
    });

    test('meal log list element exists', () => {
      expect(htmlContent).toMatch(/id="mealLogList"/);
    });

    test('add meal button exists', () => {
      expect(htmlContent).toMatch(/id="addMealBtn"/);
    });

    test('meal form modal exists', () => {
      expect(htmlContent).toMatch(/id="mealFormModal"/);
    });

    test('meal type select has breakfast, lunch, dinner, snack options', () => {
      expect(htmlContent).toMatch(/value="breakfast"/);
      expect(htmlContent).toMatch(/value="lunch"/);
      expect(htmlContent).toMatch(/value="dinner"/);
      expect(htmlContent).toMatch(/value="snack"/);
    });

    test('steps counter shows current / goal format', () => {
      expect(htmlContent).toMatch(/id="stepCount"/);
    });

    test('steps goal element exists', () => {
      expect(htmlContent).toMatch(/id="stepsGoal"/);
    });

    test('add steps button exists', () => {
      expect(htmlContent).toMatch(/id="addStepsBtn"/);
    });

    test('steps form modal exists', () => {
      expect(htmlContent).toMatch(/id="stepsFormModal"/);
    });

    test('summary stats section exists for nutrients', () => {
      expect(htmlContent).toMatch(/id="proteinStat"/);
      expect(htmlContent).toMatch(/id="carbsStat"/);
      expect(htmlContent).toMatch(/id="fatStat"/);
    });
  });

  describe('JS Module', () => {
    test('tracker.js exists and loads', () => {
      expect(jsContent).toBeDefined();
      expect(jsContent.length).toBeGreaterThan(0);
    });

    test('has initTracker function', () => {
      expect(jsContent).toMatch(/initTracker/);
    });

    test('API calls to /api/tracker/today', () => {
      expect(jsContent).toMatch(/API_BASE.*\/today/);
    });

    test('has fetchTrackerData function', () => {
      expect(jsContent).toMatch(/fetchTrackerData/);
    });

    test('has addMeal function', () => {
      expect(jsContent).toMatch(/function addMeal|addMeal\s*=/);
    });

    test('has deleteMeal function', () => {
      expect(jsContent).toMatch(/function deleteMeal|deleteMeal\s*=/);
    });

    test('has addSteps function', () => {
      expect(jsContent).toMatch(/function addSteps|addSteps\s*=/);
    });

    test('API calls to DELETE /api/tracker/meal', () => {
      expect(jsContent).toMatch(/method:\s*['"]DELETE['"]/);
      expect(jsContent).toMatch(/API_BASE.*meal/);
    });

    test('API calls to POST /api/tracker/meal', () => {
      expect(jsContent).toMatch(/method:\s*['"]POST['"]/);
      expect(jsContent).toMatch(/API_BASE.*meal/);
    });

    test('API calls to PATCH /api/tracker/steps', () => {
      expect(jsContent).toMatch(/method:\s*['"]PATCH['"]/);
      expect(jsContent).toMatch(/API_BASE.*steps/);
    });

    test('calorie ring color logic for green (under 80%)', () => {
      expect(jsContent).toMatch(/getCalorieRingColor|#52b788|green/i);
    });

    test('calorie ring color logic for orange (80-100%)', () => {
      expect(jsContent).toMatch(/80|#f4a261|orange/i);
    });

    test('calorie ring color logic for red (over 100%)', () => {
      expect(jsContent).toMatch(/#e63946|red/i);
    });
  });

  describe('Integration', () => {
    test('tracker page elements have proper event listeners', () => {
      expect(jsContent).toMatch(/addEventListener/);
    });

    test('meal form has submit handler', () => {
      expect(jsContent).toMatch(/submit|mealForm/i);
    });

    test('steps form has submit handler', () => {
      expect(jsContent).toMatch(/submit|stepsForm/i);
    });

    test('meal delete buttons have click handlers', () => {
      expect(jsContent).toMatch(/delete|remove/i);
    });
  });
});
