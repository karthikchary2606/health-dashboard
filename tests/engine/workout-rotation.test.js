'use strict';

const { buildWorkoutPlan, workoutVariantOffset } = require('../../server/engine/plan-builder');

// A hybrid profile (strength + yoga) with enough active days to expose
// muscle-group/yoga-style rotation differences across month blocks.
function hybridProfile(overrides = {}) {
  return {
    userId: 'user-rotation-1',
    dietType: 'eggetarian',
    cuisinePreference: 'mixed',
    fitnessLevel: 'moderately-active',
    equipmentAvailable: ['dumbbells'],
    healthConditions: [],
    workoutPreferences: ['gym', 'yoga'],
    workoutDaysPerWeek: 6,
    // No explicit yogaStyle — lets the yoga-style progression rotate.
    age: 32,
    ...overrides,
  };
}

function activeFocusLayout(monthSchedule) {
  return monthSchedule
    .filter(d => d.type !== 'rest')
    .map(d => ({ day: d.day, focus: d.focus, type: d.type }));
}

describe('4-week workout rotation across strength/yoga/cardio variants', () => {
  test('month 1 and month 2 produce different active-day focus layouts for a hybrid profile', () => {
    const plan = buildWorkoutPlan(hybridProfile(), 'general-fitness');
    const month1Layout = activeFocusLayout(plan[0].schedule);
    const month2Layout = activeFocusLayout(plan[1].schedule);

    // Same active days / types (schedule shape stays valid)...
    expect(month1Layout.map(d => d.day)).toEqual(month2Layout.map(d => d.day));
    expect(month1Layout.map(d => d.type)).toEqual(month2Layout.map(d => d.type));

    // ...but the focus assigned to those active days should differ between
    // month 1 and month 2 (block-based rotation of muscle-group/style order).
    expect(month1Layout).not.toEqual(month2Layout);
  });

  test('workoutVariantOffset is deterministic for the same profile/month', () => {
    const profile = hybridProfile();
    const a = workoutVariantOffset(profile, 0);
    const b = workoutVariantOffset(profile, 0);
    expect(a).toBe(b);
  });

  test('workoutVariantOffset differs across months for the same profile', () => {
    const profile = hybridProfile();
    const offsets = Array.from({ length: 6 }, (_, i) => workoutVariantOffset(profile, i));
    const unique = new Set(offsets);
    expect(unique.size).toBeGreaterThan(1);
  });

  test('rotation does not change the count of active days per month', () => {
    const plan = buildWorkoutPlan(hybridProfile(), 'general-fitness');
    plan.forEach(month => {
      const activeCount = month.schedule.filter(d => d.type !== 'rest').length;
      expect(activeCount).toBe(6); // workoutDaysPerWeek: 6
    });
  });
});
