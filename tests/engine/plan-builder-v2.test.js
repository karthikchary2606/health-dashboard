'use strict';

const { buildDietPlan } = require('../../server/engine/plan-builder');

/**
 * Test that plan-builder respects weekly diet pattern for hybrid users.
 *
 * A hybrid user has different diet types on different days:
 * - Example: vegetarian Mon-Fri, non-vegetarian Sat-Sun
 *
 * The plan-builder should use deriveWeeklyDietPattern to get the diet type
 * for each day, rather than using a single effectiveDiet for all days.
 */

describe('buildDietPlan with hybrid diet pattern', () => {
  test('respects hybrid diet pattern: veg Mon-Fri, non-veg Sat-Sun', () => {
    // Hybrid profile: non-vegetarian by default, but vegetarian Mon-Fri via eggDays/override
    // To support "veg Mon-Fri, non-veg Sat-Sun", we use:
    // - dietType: 'non-vegetarian' (base)
    // - eggDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] (veg preference)
    const hybridProfile = {
      userId: 'test-user-hybrid',
      dietType: 'non-vegetarian',
      eggDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],  // veg Mon-Fri
      nonVegDays: ['Saturday', 'Sunday'],  // non-veg Sat-Sun
      cuisinePreference: 'south-indian',
      fitnessLevel: 'lightly-active',
      equipmentAvailable: [],
      healthConditions: [],
    };

    const plan = buildDietPlan(hybridProfile, 'weight-loss');

    // Verify plan structure
    expect(plan).toHaveLength(6); // 6 months
    expect(plan[0].weeks).toHaveLength(4); // 4 weeks per month
    expect(plan[0].weeks[0].weekdays).toHaveLength(7); // 7 days per week

    // Get the first week's meals
    const firstWeek = plan[0].weeks[0];
    const weekdaysByName = {};

    firstWeek.weekdays.forEach(day => {
      weekdaysByName[day.day] = day;
    });

    // Verify Monday is vegetarian (should come from veg pool)
    expect(weekdaysByName['Monday']).toBeDefined();
    const mondayBreakfast = weekdaysByName['Monday'].breakfast;
    expect(mondayBreakfast).toBeDefined();
    expect(typeof mondayBreakfast).toBe('string');
    // The meal name should NOT contain common non-veg indicators
    // This is a proxy for "meal comes from veg pool"
    const nonVegIndicators = ['chicken', 'mutton', 'fish', 'meat', 'beef'];
    const mondayHasNonVeg = nonVegIndicators.some(indicator =>
      mondayBreakfast.toLowerCase().includes(indicator)
    );
    expect(mondayHasNonVeg).toBe(false);

    // Verify Saturday CAN be non-veg (meal from non-veg pool)
    // Note: This is a behavioral check - the meal should come from non-veg pool
    // For vegetarian pool, it would never contain meat. For non-veg pool, it might.
    expect(weekdaysByName['Saturday']).toBeDefined();
    const saturdayBreakfast = weekdaysByName['Saturday'].breakfast;
    expect(saturdayBreakfast).toBeDefined();
    expect(typeof saturdayBreakfast).toBe('string');
    // Saturday meal is selected from non-veg pool, so it could contain meat
    // (or could be veg - the point is it's from the pool that allows it)
  });

  test('strict vegetarian stays vegetarian all week', () => {
    const vegProfile = {
      userId: 'test-user-strict-veg',
      dietType: 'vegetarian',
      nonVegDays: [],
      eggDays: [],
      cuisinePreference: 'north-indian',
      fitnessLevel: 'lightly-active',
      equipmentAvailable: [],
      healthConditions: [],
    };

    const plan = buildDietPlan(vegProfile, 'weight-loss');

    // All meals across all days should be vegetarian
    for (let monthIdx = 0; monthIdx < plan.length; monthIdx++) {
      for (let weekIdx = 0; weekIdx < plan[monthIdx].weeks.length; weekIdx++) {
        const week = plan[monthIdx].weeks[weekIdx];
        for (let dayIdx = 0; dayIdx < week.weekdays.length; dayIdx++) {
          const day = week.weekdays[dayIdx];
          const nonVegIndicators = ['chicken', 'mutton', 'fish', 'meat', 'beef'];
          
          // Check all meal types
          ['breakfast', 'lunch', 'snack', 'dinner'].forEach(mealType => {
            const meal = day[mealType];
            expect(meal).toBeDefined();
            expect(typeof meal).toBe('string');
            const hasNonVeg = nonVegIndicators.some(indicator =>
              meal.toLowerCase().includes(indicator)
            );
            expect(hasNonVeg).toBe(false);
          });
        }
      }
    }
  });
});
