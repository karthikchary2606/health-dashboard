'use strict';

const {
  buildDietPlan,
  buildWorkoutPlan,
  buildCardioPlan,
  buildGroceryList,
} = require('../../server/engine/plan-builder');

const vegProfile = {
  dietType: 'vegetarian',
  cuisinePreference: 'north-indian',
  fitnessLevel: 'lightly-active',
  equipmentAvailable: [],
  healthConditions: [],
};

const nonVegProfile = {
  dietType: 'non-vegetarian',
  cuisinePreference: 'south-indian',
  fitnessLevel: 'very-active',
  equipmentAvailable: ['dumbbells', 'barbell'],
  healthConditions: [],
};

const beginnerProfile = {
  dietType: 'vegetarian',
  cuisinePreference: 'north-indian',
  fitnessLevel: 'sedentary',
  equipmentAvailable: [],
  healthConditions: [],
};

const advancedProfile = {
  dietType: 'non-vegetarian',
  cuisinePreference: 'north-indian',
  fitnessLevel: 'very-active',
  equipmentAvailable: ['dumbbells', 'barbell', 'cable-machine'],
  healthConditions: [],
};

const goal = 'weight-loss';

// ─── buildDietPlan ────────────────────────────────────────────────────────────

describe('buildDietPlan', () => {
  let plan;
  beforeAll(() => { plan = buildDietPlan(vegProfile, goal); });

  test('returns exactly 6 months', () => {
    expect(Array.isArray(plan)).toBe(true);
    expect(plan).toHaveLength(6);
  });

  test('no null months', () => {
    plan.forEach(month => expect(month).not.toBeNull());
  });

  test('each month has monthLabel (Month N) and 4 weeks', () => {
    plan.forEach((month, i) => {
      expect(month.monthLabel).toBe(`Month ${i + 1}`);
      expect(Array.isArray(month.weeks)).toBe(true);
      expect(month.weeks).toHaveLength(4);
    });
  });

  test('each week has weekLabel (Week N) and 7 weekdays', () => {
    plan.forEach(month => {
      month.weeks.forEach((week, i) => {
        expect(week.weekLabel).toBe(`Week ${i + 1}`);
        expect(Array.isArray(week.weekdays)).toBe(true);
        expect(week.weekdays).toHaveLength(7);
      });
    });
  });

  test('each day has breakfast, lunch, snack, dinner as strings', () => {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    plan.forEach(month => {
      month.weeks.forEach(week => {
        week.weekdays.forEach((day, i) => {
          expect(day.day).toBe(days[i]);
          expect(typeof day.breakfast).toBe('string');
          expect(typeof day.lunch).toBe('string');
          expect(typeof day.snack).toBe('string');
          expect(typeof day.dinner).toBe('string');
        });
      });
    });
  });

  test('vegetarian profile gets different meals than non-veg profile', () => {
    const vegPlan   = buildDietPlan(vegProfile, goal);
    const nonVegPlan = buildDietPlan(nonVegProfile, goal);
    const vegBreakfasts   = vegPlan[0].weeks[0].weekdays.map(d => d.breakfast);
    const nonVegBreakfasts = nonVegPlan[0].weeks[0].weekdays.map(d => d.breakfast);
    expect(vegBreakfasts).not.toEqual(nonVegBreakfasts);
  });

  test('north-indian profile gets different meals than south-indian', () => {
    const northPlan = buildDietPlan(
      { ...vegProfile, cuisinePreference: 'north-indian' }, goal
    );
    const southPlan = buildDietPlan(
      { ...vegProfile, cuisinePreference: 'south-indian' }, goal
    );
    const northLunches = northPlan[0].weeks[0].weekdays.map(d => d.lunch);
    const southLunches = southPlan[0].weeks[0].weekdays.map(d => d.lunch);
    expect(northLunches).not.toEqual(southLunches);
  });

  test('has guidelines array', () => {
    plan.forEach(month => {
      expect(Array.isArray(month.guidelines)).toBe(true);
    });
  });
});

// ─── buildWorkoutPlan ─────────────────────────────────────────────────────────

describe('buildWorkoutPlan', () => {
  let plan;
  beforeAll(() => { plan = buildWorkoutPlan(beginnerProfile, goal); });

  test('returns exactly 6 months', () => {
    expect(Array.isArray(plan)).toBe(true);
    expect(plan).toHaveLength(6);
  });

  test('no null months', () => {
    plan.forEach(month => expect(month).not.toBeNull());
  });

  test('each month has monthLabel and schedule array', () => {
    plan.forEach((month, i) => {
      expect(month.monthLabel).toBe(`Month ${i + 1}`);
      expect(Array.isArray(month.schedule)).toBe(true);
      expect(month.schedule).toHaveLength(7);
    });
  });

  test('schedule exercises have sets (number) reps (string) note (string)', () => {
    plan.forEach(month => {
      month.schedule.forEach(dayEntry => {
        if (dayEntry.exercises && dayEntry.exercises.length > 0) {
          dayEntry.exercises.forEach(ex => {
            expect(typeof ex.sets).toBe('number');
            expect(typeof ex.reps).toBe('string');
            expect(typeof ex.note).toBe('string');
          });
        }
      });
    });
  });

  test('beginner profile gets lower sets than advanced', () => {
    const beginnerPlan = buildWorkoutPlan(beginnerProfile, goal);
    const advancedPlan = buildWorkoutPlan(advancedProfile, goal);

    // Find a strength day with exercises in both plans
    const getMaxSets = p =>
      p[0].schedule
        .flatMap(d => d.exercises || [])
        .reduce((max, ex) => Math.max(max, ex.sets), 0);

    expect(getMaxSets(beginnerPlan)).toBeLessThanOrEqual(getMaxSets(advancedPlan));
  });
});

// ─── buildCardioPlan ──────────────────────────────────────────────────────────

describe('buildCardioPlan', () => {
  let plan;
  beforeAll(() => { plan = buildCardioPlan(vegProfile, goal); });

  test('returns exactly 6 months', () => {
    expect(Array.isArray(plan)).toBe(true);
    expect(plan).toHaveLength(6);
  });

  test('no null months', () => {
    plan.forEach(month => expect(month).not.toBeNull());
  });

  test('each month has monthLabel, phaseLabel, sessions, hrZones', () => {
    plan.forEach((month, i) => {
      expect(month.monthLabel).toBe(`Month ${i + 1}`);
      expect(typeof month.phaseLabel).toBe('string');
      expect(Array.isArray(month.sessions)).toBe(true);
      expect(typeof month.hrZones).toBe('object');
    });
  });
});

// ─── buildGroceryList ─────────────────────────────────────────────────────────

describe('buildGroceryList', () => {
  let plan;
  beforeAll(() => { plan = buildGroceryList(vegProfile, goal); });

  test('returns exactly 6 months', () => {
    expect(Array.isArray(plan)).toBe(true);
    expect(plan).toHaveLength(6);
  });

  test('no null months', () => {
    plan.forEach(month => expect(month).not.toBeNull());
  });

  test('each month has monthLabel, budget, categories', () => {
    plan.forEach((month, i) => {
      expect(month.monthLabel).toBe(`Month ${i + 1}`);
      expect(typeof month.budget).toBe('string');
      expect(Array.isArray(month.categories)).toBe(true);
    });
  });

  test('vegetarian grocery list has no meat items', () => {
    const vegPlan = buildGroceryList(vegProfile, goal);
    const meatTerms = ['chicken', 'fish', 'mutton', 'beef', 'pork', 'meat'];
    vegPlan.forEach(month => {
      month.categories.forEach(cat => {
        cat.items.forEach(item => {
          const lower = item.toLowerCase();
          meatTerms.forEach(term => expect(lower).not.toContain(term));
        });
      });
    });
  });
});
