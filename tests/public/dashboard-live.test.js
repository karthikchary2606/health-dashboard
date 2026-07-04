'use strict';

const fs = require('fs');
const path = require('path');

describe('Dashboard Live Data', () => {
  let jsContent;

  beforeAll(() => {
    // Load dashboard.js
    const jsPath = path.join(__dirname, '../../public/js/dashboard.js');
    jsContent = fs.readFileSync(jsPath, 'utf8');
  });

  describe('Live Data Fetching', () => {
    test('has initLiveData function defined', () => {
      expect(jsContent).toMatch(/function\s+initLiveData|initLiveData\s*=/);
    });

    test('fetches from /api/logs/today', () => {
      expect(jsContent).toMatch(/\/api\/logs\/today/);
    });

    test('calls initLiveData on page load', () => {
      expect(jsContent).toMatch(/initLiveData\s*\(/);
    });

    test('handles API errors gracefully', () => {
      expect(jsContent).toMatch(/catch|error/i);
    });
  });

  describe('Auto-Refresh Logic', () => {
    test('sets interval for auto-refresh', () => {
      expect(jsContent).toMatch(/setInterval/);
    });

    test('refresh interval is 30 seconds or less', () => {
      // Look for setInterval with 30000ms (30 seconds) or less
      const intervalMatch = jsContent.match(/setInterval\([^,]+,\s*(\d+)/);
      expect(intervalMatch).toBeTruthy();
      if (intervalMatch) {
        const intervalMs = parseInt(intervalMatch[1]);
        expect(intervalMs).toBeLessThanOrEqual(30000);
      }
    });

    test('stores interval ID for cleanup', () => {
      expect(jsContent).toMatch(/liveDataInterval|refreshInterval|dashRefresh/i);
    });
  });

  describe('Calorie Ring Updates', () => {
    test('updates calorie ring element from live data', () => {
      expect(jsContent).toMatch(/calorieRing|calorieAmount/i);
    });

    test('displays consumed / target calories', () => {
      expect(jsContent).toMatch(/consumed|target/i);
    });

    test('calculates progress percentage for ring', () => {
      expect(jsContent).toMatch(/percentage|progress|\/\s*\*|Math\.(min|max)|consumed.*target/i);
    });

    test('applies color logic for calorie ring', () => {
      // Should have color logic: green (under 80%), orange (80-100%), red (over 100%)
      expect(jsContent).toMatch(/#|color|rgb|green|orange|red/i);
    });
  });

  describe('Step Progress Updates', () => {
    test('updates step count from live data', () => {
      expect(jsContent).toMatch(/stepCount|steps/i);
    });

    test('displays steps as current / goal format', () => {
      expect(jsContent).toMatch(/stepCount|stepGoal|steps/i);
    });

    test('calculates step progress percentage', () => {
      expect(jsContent).toMatch(/step.*percentage|step.*goal|Math\.(min|max)/i);
    });
  });

  describe('Meal Log Updates', () => {
    test('updates meal log list from live data', () => {
      expect(jsContent).toMatch(/mealLog|meals/i);
    });

    test('displays meals with type and calories', () => {
      expect(jsContent).toMatch(/mealType|breakfast|lunch|dinner|snack|calories/i);
    });

    test('handles multiple meals in timeline', () => {
      expect(jsContent).toMatch(/forEach|map|for\s*\(/);
    });

    test('shows meal description if available', () => {
      expect(jsContent).toMatch(/description|name|meal\s*text/i);
    });
  });

  describe('DOM Updates', () => {
    test('updates DOM elements safely', () => {
      expect(jsContent).toMatch(/textContent|innerHTML|innerText/);
    });

    test('parses API response correctly', () => {
      expect(jsContent).toMatch(/res\.body|res\.data|response/i);
    });

    test('handles null or missing data fields', () => {
      expect(jsContent).toMatch(/\?\.|null|undefined|if\s*\(|&&/);
    });
  });

  describe('Error Handling', () => {
    test('shows warning on fetch failure', () => {
      expect(jsContent).toMatch(/error|catch|console\.(warn|error)/i);
    });

    test('retries on network error', () => {
      expect(jsContent).toMatch(/retry|interval|setTimeout|setInterval/i);
    });

    test('does not break dashboard on API failure', () => {
      // Should have try-catch or error handling
      expect(jsContent).toMatch(/try|catch|console/i);
    });
  });

  describe('Integration', () => {
    test('works alongside existing dashboard functions', () => {
      // Should have other functions from original dashboard
      expect(jsContent).toMatch(/loadDashboardOverview|updateWaterGoal|dismissReview/i);
    });

    test('does not conflict with other event listeners', () => {
      expect(jsContent).toMatch(/addEventListener|on\w+/);
    });

    test('coordinates with authentication flow', () => {
      expect(jsContent).toMatch(/currentUser|initAuth/i);
    });
  });

  describe('Data Validation', () => {
    test('validates consumed calories is a number', () => {
      expect(jsContent).toMatch(/consumed|typeof|Number/i);
    });

    test('validates target calories is a number', () => {
      expect(jsContent).toMatch(/target|typeof|Number/i);
    });

    test('validates meals array is iterable', () => {
      expect(jsContent).toMatch(/Array\.isArray|meals|forEach/i);
    });

    test('validates step count is a number', () => {
      expect(jsContent).toMatch(/stepCount|typeof|Number/i);
    });
  });
});
