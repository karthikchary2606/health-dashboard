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

  test('returns a non-empty array of categories', () => {
    expect(Array.isArray(plan)).toBe(true);
    expect(plan.length).toBeGreaterThan(0);
  });

  test('no null categories', () => {
    plan.forEach(cat => expect(cat).not.toBeNull());
  });

  test('each category has name and items array', () => {
    plan.forEach(cat => {
      expect(typeof cat.name).toBe('string');
      expect(Array.isArray(cat.items)).toBe(true);
    });
  });

  test('vegetarian grocery list has no meat items', () => {
    const vegPlan = buildGroceryList(vegProfile, goal);
    const meatTerms = ['chicken', 'fish', 'mutton', 'beef', 'pork', 'meat'];
    vegPlan.forEach(cat => {
      cat.items.forEach(item => {
        const lower = item.toLowerCase();
        meatTerms.forEach(term => expect(lower).not.toContain(term));
      });
    });
  });

  test('vegan grocery list has no dairy items', () => {
    const vegan = { ...nonVegProfile, dietType: 'vegan' };
    const result = buildGroceryList(vegan, 'weight-loss');
    const dairyKeywords = /\b(paneer|yogurt|ghee|butter|cream|cheese|mozzarella)\b|\bcow milk\b|\bdairy milk\b/i;
    result.forEach(cat => {
      cat.items.forEach(item => {
        expect(item).not.toMatch(dairyKeywords);
      });
    });
  });
});

// ─── Personalized buildWorkoutPlan ─────────────────────────────────────────

const yogaProfile = {
  dietType: 'vegetarian',
  cuisinePreference: 'south-indian',
  fitnessLevel: 'moderately-active',
  equipmentAvailable: [],
  healthConditions: [],
  workoutPreferences: ['yoga'],
  workoutDaysPerWeek: 4,
  yogaStyle: 'hatha',
  age: 30,
};

const gymProfile3Day = {
  dietType: 'non-vegetarian',
  cuisinePreference: 'north-indian',
  fitnessLevel: 'very-active',
  equipmentAvailable: ['dumbbells', 'barbell'],
  healthConditions: [],
  workoutPreferences: ['gym'],
  workoutDaysPerWeek: 3,
  age: 28,
};

const hybridProfile = {
  dietType: 'eggetarian',
  cuisinePreference: 'mixed',
  fitnessLevel: 'moderately-active',
  equipmentAvailable: ['dumbbells'],
  healthConditions: [],
  workoutPreferences: ['gym', 'yoga'],
  workoutDaysPerWeek: 5,
  yogaStyle: 'vinyasa',
  age: 35,
};

describe('buildWorkoutPlan — personalized', () => {
  test('yoga profile: active days have yoga cat exercises', () => {
   const plan = buildWorkoutPlan(yogaProfile, 'weight-loss');
   const activeDays = plan[0].schedule.filter(d => d.type !== 'rest');
   expect(activeDays.length).toBe(4);
   activeDays.forEach(day => {
     const hasYogaCat = day.exercises.some(ex => ex.cat === 'yoga');
     expect(hasYogaCat).toBe(true);
   });
  });

  test('yoga profile: Surya Namaskar is always first exercise on active days', () => {
   const plan = buildWorkoutPlan(yogaProfile, 'weight-loss');
   plan[0].schedule
     .filter(d => d.type !== 'rest' && d.exercises.length > 0)
     .forEach(day => {
       expect(day.exercises[0].name).toMatch(/Surya Namaskar/i);
     });
  });

  test('gym profile 3 days: exactly 3 active days and 4 rest days per week', () => {
   const plan = buildWorkoutPlan(gymProfile3Day, 'muscle-gain');
   const activeDays = plan[0].schedule.filter(d => d.type !== 'rest');
   const restDays   = plan[0].schedule.filter(d => d.type === 'rest');
   expect(activeDays.length).toBe(3);
   expect(restDays.length).toBe(4);
  });

  test('gym profile 3 days: Surya Namaskar first on all active days', () => {
   const plan = buildWorkoutPlan(gymProfile3Day, 'muscle-gain');
   plan[0].schedule
     .filter(d => d.type !== 'rest' && d.exercises.length > 0)
     .forEach(day => {
       expect(day.exercises[0].name).toMatch(/Surya Namaskar/i);
     });
  });

  test('each month has phaseLabel, focus, note', () => {
   const plan = buildWorkoutPlan(yogaProfile, 'weight-loss');
   plan.forEach(month => {
     expect(typeof month.phaseLabel).toBe('string');
     expect(month.phaseLabel.length).toBeGreaterThan(0);
     expect(typeof month.focus).toBe('string');
     expect(month.focus.length).toBeGreaterThan(0);
     expect(typeof month.note).toBe('string');
     expect(month.note.length).toBeGreaterThan(0);
   });
  });

  test('rest days include optional Surya Namaskar entry', () => {
   const plan = buildWorkoutPlan(gymProfile3Day, 'weight-loss');
   const restDays = plan[0].schedule.filter(d => d.type === 'rest');
   expect(restDays.length).toBeGreaterThan(0);
   restDays.forEach(day => {
     expect(day.exercises.length).toBe(1);
     expect(day.exercises[0].name).toMatch(/Surya Namaskar/i);
   });
  });

  test('hybrid profile: schedule has both strength and yoga days', () => {
   const plan = buildWorkoutPlan(hybridProfile, 'general-fitness');
   const activeDays = plan[0].schedule.filter(d => d.type !== 'rest');
   const yogaDays     = activeDays.filter(d => d.focus && d.focus.toLowerCase().includes('yoga'));
   const strengthDays = activeDays.filter(d => d.focus && !d.focus.toLowerCase().includes('yoga'));
   expect(yogaDays.length).toBeGreaterThan(0);
   expect(strengthDays.length).toBeGreaterThan(0);
  });

  test('hybrid profile 3-day: has at least 1 yoga day and 1 strength day', () => {
  const hybrid3Day = {
    dietType: 'vegetarian',
    cuisinePreference: 'south-indian',
    fitnessLevel: 'moderately-active',
    equipmentAvailable: ['dumbbells'],
    healthConditions: [],
    workoutPreferences: ['gym', 'yoga'],
    workoutDaysPerWeek: 3,
    yogaStyle: 'hatha',
    age: 30,
  };
  const plan = buildWorkoutPlan(hybrid3Day, 'weight-loss');
  const activeDays   = plan[0].schedule.filter(d => d.type !== 'rest');
  const yogaDays     = activeDays.filter(d => d.focus && d.focus.toLowerCase().includes('yoga'));
  const strengthDays = activeDays.filter(d => d.type === 'Strength');
  expect(activeDays.length).toBe(3);
  expect(yogaDays.length).toBe(1);      // Friday
  expect(strengthDays.length).toBe(2);  // Monday + Wednesday
 });

 test('hybrid profile 4-day: has 2 yoga days and 2 strength days', () => {
  const hybrid4Day = {
    dietType: 'vegetarian',
    cuisinePreference: 'south-indian',
    fitnessLevel: 'moderately-active',
    equipmentAvailable: ['dumbbells'],
    healthConditions: [],
    workoutPreferences: ['gym', 'yoga'],
    workoutDaysPerWeek: 4,
    yogaStyle: 'vinyasa',
    age: 30,
  };
  const plan = buildWorkoutPlan(hybrid4Day, 'weight-loss');
  const activeDays   = plan[0].schedule.filter(d => d.type !== 'rest');
  const yogaDays     = activeDays.filter(d => d.focus && d.focus.toLowerCase().includes('yoga'));
  const strengthDays = activeDays.filter(d => d.type === 'Strength');
  expect(activeDays.length).toBe(4);
  expect(yogaDays.length).toBe(2);
  expect(strengthDays.length).toBe(2);
 });

 test('hybrid profile 5-day: 3 strength + 2 yoga active days', () => {
  const hybrid5Day = {
    dietType: 'vegetarian',
    cuisinePreference: 'south-indian',
    fitnessLevel: 'moderately-active',
    equipmentAvailable: ['dumbbells'],
    healthConditions: [],
    workoutPreferences: ['gym', 'yoga'],
    workoutDaysPerWeek: 5,
    yogaStyle: 'hatha',
    age: 30,
  };
  const plan = buildWorkoutPlan(hybrid5Day, 'weight-loss');
  const activeDays   = plan[0].schedule.filter(d => d.type !== 'rest');
  const yogaDays     = activeDays.filter(d => d.focus && d.focus.toLowerCase().includes('yoga'));
  const strengthDays = activeDays.filter(d => d.type === 'Strength');
  expect(activeDays.length).toBe(5);
  expect(strengthDays.length).toBe(3);  // Mon, Wed, Thu
  expect(yogaDays.length).toBe(2);      // Tue, Fri
 });

 test('hybrid profile 6-day: 3 strength + 3 yoga active days', () => {
   const hybrid6Day = {
     dietType: 'vegetarian',
     cuisinePreference: 'south-indian',
     fitnessLevel: 'very-active',
     equipmentAvailable: ['dumbbells', 'barbell'],
     healthConditions: [],
     workoutPreferences: ['gym', 'yoga'],
     workoutDaysPerWeek: 6,
     yogaStyle: 'vinyasa',
     age: 28,
   };
   const plan = buildWorkoutPlan(hybrid6Day, 'muscle-gain');
   const activeDays   = plan[0].schedule.filter(d => d.type !== 'rest');
   const yogaDays     = activeDays.filter(d => d.focus && d.focus.toLowerCase().includes('yoga'));
   const strengthDays = activeDays.filter(d => d.type === 'Strength');
   expect(activeDays.length).toBe(6);
   expect(strengthDays.length).toBe(3);
   expect(yogaDays.length).toBe(3);
   // All strength days must have real exercises beyond just surya namaskar
   strengthDays.forEach(day => {
     expect(day.exercises.length).toBeGreaterThan(1);
   });
 });

 test('hybrid profile 7-day: 4 strength + 3 yoga active days, no focus/type mismatch', () => {
   const hybrid7Day = {
     dietType: 'non-vegetarian',
     cuisinePreference: 'north-indian',
     fitnessLevel: 'very-active',
     equipmentAvailable: ['dumbbells', 'barbell'],
     healthConditions: [],
     workoutPreferences: ['gym', 'yoga'],
     workoutDaysPerWeek: 7,
     yogaStyle: 'hatha',
     age: 25,
   };
   const plan = buildWorkoutPlan(hybrid7Day, 'muscle-gain');
   const activeDays   = plan[0].schedule.filter(d => d.type !== 'rest');
   const yogaDays     = activeDays.filter(d => d.focus && d.focus.toLowerCase().includes('yoga'));
   const strengthDays = activeDays.filter(d => d.type === 'Strength');
   expect(activeDays.length).toBe(7);
   expect(strengthDays.length).toBe(4);
   expect(yogaDays.length).toBe(3);
   // No strength day should have a Flexibility or Recovery focus
   strengthDays.forEach(day => {
     expect(day.focus).not.toMatch(/flexibility|recovery/i);
     expect(day.exercises.length).toBeGreaterThan(1);
   });
 });
});

// ─── Diet guidelines ──────────────────────────────────────────────────────────

// ─── Effective diet impacts generated meals ──────────────────────────────────

describe('effective diet inference impacts generated meals', () => {
  test('vegetarian profile with chicken in foodList still generates vegetarian meals', () => {
    const vegProfileWithChicken = {
      dietType: 'vegetarian',
      cuisinePreference: 'north-indian',
      fitnessLevel: 'lightly-active',
      equipmentAvailable: [],
      healthConditions: [],
      foodList: [{ name: 'Chicken Curry' }],
    };

    const strictVegPlan  = buildDietPlan(vegProfile, goal);
    const withChickenPlan = buildDietPlan(vegProfileWithChicken, goal);

    const NON_VEG_OR_EGG_PATTERN = /chicken|mutton|prawn|keema|fish|egg/i;

    // Both plans must never surface non-veg/egg items — dietType: vegetarian
    // is a strict constraint that foodList cannot override.
    strictVegPlan[0].weeks[0].weekdays.forEach(d => {
      expect(d.breakfast).not.toMatch(NON_VEG_OR_EGG_PATTERN);
    });
    withChickenPlan[0].weeks[0].weekdays.forEach(d => {
      expect(d.breakfast).not.toMatch(NON_VEG_OR_EGG_PATTERN);
    });
  });
});

describe('buildDietPlan guidelines', () => {
  test('each month has a non-empty guidelines array', () => {
   const plan = buildDietPlan(vegProfile, 'weight-loss');
   plan.forEach((month) => {
     expect(Array.isArray(month.guidelines)).toBe(true);
     expect(month.guidelines.length).toBeGreaterThan(0);
     month.guidelines.forEach(g => expect(typeof g).toBe('string'));
   });
  });

  test('guidelines differ between foundation and peak months', () => {
   const plan = buildDietPlan(vegProfile, 'weight-loss');
   const foundationGuidelines = plan[0].guidelines; // Month 1
   const peakGuidelines       = plan[4].guidelines; // Month 5
   expect(foundationGuidelines).not.toEqual(peakGuidelines);
  });
});
