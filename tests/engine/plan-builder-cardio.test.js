'use strict';
const { buildPlan } = require('../../server/engine/plan-builder');

function cardioProfile(overrides = {}) {
  return {
    primaryGoal: 'weight-loss',
    dietType: 'vegetarian',
    fitnessLevel: 'moderately-active',
    workoutPreferences: ['cardio'],
    workoutDaysPerWeek: 4,
    currentWeightKg: 75,
    goalWeightKg: 65,
    heightCm: 170,
    age: 28,
    cuisinePreference: 'south-indian',
    ...overrides
  };
}

describe('detectWorkoutMode cardio', () => {
  test('cardio-only preference gives cardio-mode schedule', () => {
    const plan = buildPlan(cardioProfile());
    const month1 = plan.workout[0];
    const activeDays = month1.schedule.filter(d => d.type !== 'rest');
    expect(activeDays.length).toBeGreaterThan(0);
    activeDays.forEach(d => {
      expect(d.session).toBeDefined();
      expect(d.hrZones).toBeDefined();  // only set on cardio path
    });
    expect(month1.phaseLabel).toBe('Phase 1 - Foundation');  // from CARDIO_PHASES, not PHASE_LABELS
  });

  test('gym + cardio preference keeps gym mode (gym wins)', () => {
    const plan = buildPlan(cardioProfile({ workoutPreferences: ['gym', 'cardio'] }));
    const month1 = plan.workout[0];
    const activeDays = month1.schedule.filter(d => d.type !== 'rest');
    activeDays.forEach(d => {
      expect(Array.isArray(d.exercises)).toBe(true);
    });
  });

  test('cardio schedule has 6 months', () => {
    const plan = buildPlan(cardioProfile());
    expect(plan.workout).toHaveLength(6);
  });

  test('each month cardio schedule has 7 days', () => {
    const plan = buildPlan(cardioProfile());
    plan.workout.forEach(month => {
      expect(month.schedule).toHaveLength(7);
    });
  });

  test('cardio schedule progresses through distinct phases across 6 months', () => {
    const plan = buildPlan(cardioProfile());
    const phaseLabels = plan.workout.map(m => m.phaseLabel);
    // All 6 labels should come from CARDIO_PHASES (start with 'Phase')
    phaseLabels.forEach(label => {
      expect(label).toMatch(/^Phase \d/);
    });
    // Phases 1-5 are distinct; Phase 6 may repeat Phase 5 if CARDIO_PHASES has only 6 entries
    const unique = new Set(phaseLabels);
    expect(unique.size).toBe(6);
  });
});
