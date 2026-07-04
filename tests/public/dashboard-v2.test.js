'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadDiet(apiFetch) {
  const dietSource = fs.readFileSync(
    path.join(__dirname, '../../public/js/diet.js'),
    'utf8'
  );
  
  const dayTabsContainer = {
    innerHTML: '',
    appendChild: function(child) {
      if (!this.children) this.children = [];
      this.children.push(child);
    },
    children: []
  };

  const sandbox = {
    window: {
      planCache: {
        getPlan: apiFetch
      }
    },
    document: {
      getElementById: (id) => {
        const elements = {
          dietMonthSelector: { innerHTML: '' },
          dietWeekSelector: { innerHTML: '' },
          dietPhaseBanner: { innerHTML: '' },
          dietWeekNote: { innerHTML: '' },
          dayTabs: dayTabsContainer,
          dietDayContent: { innerHTML: '' }
        };
        return elements[id];
      },
      addEventListener: () => {},
      createElement: (tag) => {
        if (tag === 'button') {
          return {
            className: '',
            textContent: '',
            onclick: null,
            classList: {
              add: function(cls) {
                this.classes = this.classes || [];
                this.classes.push(cls);
              },
              remove: function(cls) {
                if (this.classes) {
                  this.classes = this.classes.filter(c => c !== cls);
                }
              },
              contains: function(cls) {
                return this.classes && this.classes.includes(cls);
              },
              toggle: function(cls, force) {
                if (force === undefined) {
                  force = !this.contains(cls);
                }
                if (force) {
                  this.add(cls);
                } else {
                  this.remove(cls);
                }
              },
              classes: []
            }
          };
        }
        return { innerHTML: '' };
      },
      querySelectorAll: () => []
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(dietSource, sandbox);
  return sandbox;
}

describe('Color-coded diet day tabs', () => {
  test('Monday tab renders 🟢 green dot if vegetarian diet type', async () => {
    const mockPlan = {
      meta: { currentMonth: 1, currentWeek: 1 },
      diet: [
        {
          monthLabel: 'Month 1',
          weeks: [
            {
              weekLabel: 'Week 1',
              weekdays: [
                { day: 'Monday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Tuesday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Wednesday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Thursday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Friday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Saturday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Sunday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' }
              ]
            }
          ],
          guidelines: []
        }
      ]
    };

    const apiFetch = jest.fn().mockResolvedValue(mockPlan);
    const sandbox = loadDiet(apiFetch);

    await sandbox.initDiet();
    const dayTabs = sandbox.document.getElementById('dayTabs');
    
    // Verify that at least one tab was created
    expect(dayTabs.children.length).toBeGreaterThan(0);
    
    // Check Monday tab for green dot
    const mondayTab = dayTabs.children[0];
    expect(mondayTab.textContent).toContain('🟢');
  });

  test('Saturday tab renders 🔴 red dot if non-vegetarian diet type', async () => {
    const mockPlan = {
      meta: { currentMonth: 1, currentWeek: 1 },
      diet: [
        {
          monthLabel: 'Month 1',
          weeks: [
            {
              weekLabel: 'Week 1',
              weekdays: [
                { day: 'Monday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Tuesday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Wednesday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Thursday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Friday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Saturday', dietType: 'non-vegetarian', breakfast: 'Chicken', lunch: 'Biryani', snack: 'Apple', dinner: 'Mutton' },
                { day: 'Sunday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' }
              ]
            }
          ],
          guidelines: []
        }
      ]
    };

    const apiFetch = jest.fn().mockResolvedValue(mockPlan);
    const sandbox = loadDiet(apiFetch);

    await sandbox.initDiet();
    const dayTabs = sandbox.document.getElementById('dayTabs');
    
    // Saturday is at index 5
    const saturdayTab = dayTabs.children[5];
    expect(saturdayTab.textContent).toContain('🔴');
  });

  test('Wednesday tab renders 🟠 orange dot if eggetarian diet type', async () => {
    const mockPlan = {
      meta: { currentMonth: 1, currentWeek: 1 },
      diet: [
        {
          monthLabel: 'Month 1',
          weeks: [
            {
              weekLabel: 'Week 1',
              weekdays: [
                { day: 'Monday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Tuesday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Wednesday', dietType: 'eggetarian', breakfast: 'Eggs', lunch: 'Omelets', snack: 'Apple', dinner: 'Egg Curry' },
                { day: 'Thursday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Friday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Saturday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' },
                { day: 'Sunday', dietType: 'vegetarian', breakfast: 'Oats', lunch: 'Rice', snack: 'Apple', dinner: 'Dal' }
              ]
            }
          ],
          guidelines: []
        }
      ]
    };

    const apiFetch = jest.fn().mockResolvedValue(mockPlan);
    const sandbox = loadDiet(apiFetch);

    await sandbox.initDiet();
    const dayTabs = sandbox.document.getElementById('dayTabs');
    
    // Wednesday is at index 2
    const wednesdayTab = dayTabs.children[2];
    expect(wednesdayTab.textContent).toContain('🟠');
  });
});
