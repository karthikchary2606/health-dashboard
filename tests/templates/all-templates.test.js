'use strict';

const PROFILES = {
  SI_VEG_SED:    { name: 'SI Veg Sedentary',    cuisinePreference: 'south-indian',  dietType: 'vegetarian',     fitnessLevel: 'sedentary',         equipmentAvailable: [] },
  SI_NVEG_ACT:   { name: 'SI NonVeg Active',     cuisinePreference: 'south-indian',  dietType: 'non-vegetarian', fitnessLevel: 'very-active',        equipmentAvailable: ['dumbbells', 'barbell'] },
  SI_EGG_MOD:    { name: 'SI Eggetarian Mod',    cuisinePreference: 'south-indian',  dietType: 'eggetarian',     fitnessLevel: 'moderately-active',  equipmentAvailable: ['dumbbells'] },
  NI_VEG_SED:    { name: 'NI Veg Sedentary',     cuisinePreference: 'north-indian',  dietType: 'vegetarian',     fitnessLevel: 'sedentary',          equipmentAvailable: [] },
  NI_NVEG_ACT:   { name: 'NI NonVeg Active',     cuisinePreference: 'north-indian',  dietType: 'non-vegetarian', fitnessLevel: 'very-active',        equipmentAvailable: ['gym-access'] },
  NI_VEGAN_LACT: { name: 'NI Vegan Lightly',     cuisinePreference: 'north-indian',  dietType: 'vegan',          fitnessLevel: 'lightly-active',     equipmentAvailable: ['resistance-bands'] },
  CON_VEG_MOD:   { name: 'Con Veg Moderate',     cuisinePreference: 'continental',   dietType: 'vegetarian',     fitnessLevel: 'moderately-active',  equipmentAvailable: ['treadmill'] },
  CON_NVEG_ACT:  { name: 'Con NonVeg Active',    cuisinePreference: 'continental',   dietType: 'non-vegetarian', fitnessLevel: 'very-active',        equipmentAvailable: ['gym-access'] },
  MIX_VEG_SED:   { name: 'Mixed Veg Sedentary',  cuisinePreference: 'mixed',         dietType: 'vegetarian',     fitnessLevel: 'sedentary',          equipmentAvailable: [] },
  MIX_NVEG_ACT:  { name: 'Mixed NonVeg Active',  cuisinePreference: 'mixed',         dietType: 'non-vegetarian', fitnessLevel: 'very-active',        equipmentAvailable: ['dumbbells'] },
  LBP_PROFILE:   { name: 'LBP No Deadlift',      cuisinePreference: 'south-indian',  dietType: 'vegetarian',     fitnessLevel: 'lightly-active',     equipmentAvailable: ['dumbbells'],               healthConditions: [{ name: 'lower-back-pain' }] },
  VEGAN_NI:      { name: 'Vegan NI Active',      cuisinePreference: 'north-indian',  dietType: 'vegan',          fitnessLevel: 'moderately-active',  equipmentAvailable: ['barbell', 'dumbbells'] },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Templates export individual getters (getDietPlan, getWorkoutPlan, etc.) rather
 * than a single getFullPlan. This assembles the canonical full-plan shape.
 */
function getFullPlan(mod, profile) {
  return {
    dietPlan:    mod.getDietPlan(profile),
    workoutPlan: mod.getWorkoutPlan(profile),
    cardioPlan:  mod.getCardioPlan(profile),
    groceryList: mod.getGroceryList(profile),
  };
}

/**
 * Flatten all meal strings from a dietPlan.
 * Structure: month[] → month.weeks[] → week.weekdays[] → day.{breakfast,lunch,snack,dinner}
 */
function collectAllMeals(dietPlan) {
  return dietPlan.flatMap(month =>
    month.weeks.flatMap(week =>
      week.weekdays.flatMap(day =>
        ['breakfast', 'lunch', 'snack', 'dinner'].map(mt => day[mt])
      )
    )
  ).filter(Boolean);
}

/**
 * Flatten all exercise names from a workoutPlan.
 * Structure: month[] → month.schedule[] → slot.exercises[] → exercise.name
 */
function collectAllExerciseNames(workoutPlan) {
  return workoutPlan.flatMap(month =>
    month.schedule.flatMap(slot =>
      (slot.exercises || []).map(e => e.name || e)
    )
  ).filter(Boolean);
}

const TEMPLATE_MODS = [
  { name: 'weight-loss',     mod: require('../../server/templates/weight-loss') },
  { name: 'muscle-gain',     mod: require('../../server/templates/muscle-gain') },
  { name: 'maintenance',     mod: require('../../server/templates/maintenance') },
  { name: 'general-fitness', mod: require('../../server/templates/general-fitness') },
];

// ─── 1. Shape tests (4 templates × 12 profiles = 48 combinations) ────────────

describe('getFullPlan shape', () => {
  TEMPLATE_MODS.forEach(({ name, mod }) => {
    Object.entries(PROFILES).forEach(([key, profile]) => {
      test(`${name} + ${key}: returns 6-month arrays`, () => {
        const plan = getFullPlan(mod, profile);
        expect(plan).toHaveProperty('dietPlan');
        expect(plan).toHaveProperty('workoutPlan');
        expect(plan).toHaveProperty('cardioPlan');
        expect(plan).toHaveProperty('groceryList');
        expect(plan.dietPlan).toHaveLength(6);
        expect(plan.workoutPlan).toHaveLength(6);
        expect(plan.cardioPlan).toHaveLength(6);
        expect(plan.groceryList).toHaveLength(5);
      });
    });
  });
});

// ─── 2. Veg purity (veg/vegan/eggetarian profiles must never contain meat) ───

describe('veg purity', () => {
  const MEAT_KEYWORDS = ['chicken', 'mutton', 'fish', 'prawn', 'lamb', 'beef', 'pork', 'keema', 'kodi', 'meen'];
  const vegProfileKeys = ['SI_VEG_SED', 'NI_VEG_SED', 'CON_VEG_MOD', 'MIX_VEG_SED', 'NI_VEGAN_LACT', 'VEGAN_NI'];

  TEMPLATE_MODS.forEach(({ name, mod }) => {
    vegProfileKeys.forEach(key => {
      test(`${name} + ${key}: no meat in dietPlan`, () => {
        const plan = getFullPlan(mod, PROFILES[key]);
        const allMeals = collectAllMeals(plan.dietPlan);
        const hasMeat = allMeals.some(meal =>
          MEAT_KEYWORDS.some(kw => meal.toLowerCase().includes(kw))
        );
        expect(hasMeat).toBe(false);
      });
    });
  });
});

// ─── 3. Health condition contraindications ────────────────────────────────────

describe('health condition contraindications', () => {
  TEMPLATE_MODS.forEach(({ name, mod }) => {
    test(`${name} + LBP_PROFILE: no deadlift in workoutPlan`, () => {
      const plan = getFullPlan(mod, PROFILES.LBP_PROFILE);
      const allExerciseNames = collectAllExerciseNames(plan.workoutPlan);
      const hasDeadlift = allExerciseNames.some(
        e => typeof e === 'string' && e.toLowerCase().includes('deadlift')
      );
      expect(hasDeadlift).toBe(false);
    });
  });
});

// ─── 4. getPlanMeta clamping ──────────────────────────────────────────────────

describe('getPlanMeta clamping', () => {
  TEMPLATE_MODS.forEach(({ name, mod }) => {
    test(`${name}: clamps month 0 without throwing`, () => {
      expect(() => mod.getPlanMeta(PROFILES.SI_VEG_SED, 0, 1)).not.toThrow();
    });
    test(`${name}: clamps month 99 without throwing`, () => {
      expect(() => mod.getPlanMeta(PROFILES.SI_VEG_SED, 99, 1)).not.toThrow();
    });
  });
});
