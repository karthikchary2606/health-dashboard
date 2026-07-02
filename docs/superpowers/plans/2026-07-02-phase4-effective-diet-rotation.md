# Phase 4 Effective Diet + Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make diet/workout plans adapt to mixed food preferences (vegetarian + eggs/chicken) and enforce strong 4-week variation.

**Architecture:** Keep `profile.dietType` unchanged in storage but derive an `effectiveDietType` at generation time from `foodList`. Use deterministic block rotation (`blockIndex = floor(weekIndex/4)`) to vary meal and workout structures every 4 weeks while keeping output reproducible for a given user/profile block.

**Tech Stack:** Node.js, Express, Jest, existing planner/composer modules in `server/engine`.

---

### Task 1: Lock behavior with failing tests for effective diet inference

**Files:**
- Modify: `tests/engine/meal-composer-v2.test.js`
- Modify: `tests/engine/plan-builder.test.js`
- Test: `tests/engine/meal-composer-v2.test.js`, `tests/engine/plan-builder.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/engine/meal-composer-v2.test.js
const { getMeals, deriveEffectiveDiet } = require('../../server/engine/meal-composer');

describe('deriveEffectiveDiet', () => {
  test('vegetarian + egg foodList upgrades to eggetarian', () => {
    const profile = { dietType: 'vegetarian', foodList: ['egg curry'] };
    expect(deriveEffectiveDiet(profile)).toBe('eggetarian');
  });

  test('vegetarian + chicken foodList upgrades to non-vegetarian', () => {
    const profile = { dietType: 'vegetarian', foodList: ['chicken curry'] };
    expect(deriveEffectiveDiet(profile)).toBe('non-vegetarian');
  });

  test('vegan never upgrades even if foodList contains chicken token', () => {
    const profile = { dietType: 'vegan', foodList: ['chicken'] };
    expect(deriveEffectiveDiet(profile)).toBe('vegan');
  });
});
```

```js
// tests/engine/plan-builder.test.js
test('effective diet impacts generated meals for vegetarian+chicken profile', () => {
  const profile = {
    ...vegProfile,
    dietType: 'vegetarian',
    foodList: ['chicken', 'eggs'],
    cuisinePreference: 'south-indian'
  };
  const dietPlan = buildDietPlan(profile, goal);
  const weekMeals = dietPlan[0].weeks[0].weekdays.map(d => `${d.breakfast} ${d.lunch} ${d.dinner}`).join(' ');
  expect(weekMeals.toLowerCase()).toMatch(/chicken|egg|fish|mutton/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npm test -- tests/engine/meal-composer-v2.test.js tests/engine/plan-builder.test.js
```

Expected: FAIL with `deriveEffectiveDiet is not a function` and/or mismatch on mixed-preference meal expectations.

- [ ] **Step 3: Implement the minimal export wiring for test visibility**

```js
// server/engine/meal-composer.js (module export shape, temporary)
module.exports = { getMeals, activeConditions, deriveEffectiveDiet };
```

- [ ] **Step 4: Re-run tests**

Run:
```bash
npm test -- tests/engine/meal-composer-v2.test.js tests/engine/plan-builder.test.js
```

Expected: tests still fail on logic until Task 2 implementation is complete, but export-related failure is gone.

- [ ] **Step 5: Commit**

```bash
git add tests/engine/meal-composer-v2.test.js tests/engine/plan-builder.test.js server/engine/meal-composer.js
git commit -m "test: lock effective diet inference behavior"
```

### Task 2: Implement effective diet inference in meal generation + planner

**Files:**
- Modify: `server/engine/meal-composer.js`
- Modify: `server/engine/plan-builder.js`
- Test: `tests/engine/meal-composer-v2.test.js`, `tests/engine/plan-builder.test.js`

- [ ] **Step 1: Write one additional failing integration test for food object arrays**

```js
// tests/engine/meal-composer-v2.test.js
test('deriveEffectiveDiet supports object-style foodList entries', () => {
  const profile = {
    dietType: 'vegetarian',
    foodList: [{ name: 'boiled egg' }, { name: 'chicken stew' }]
  };
  expect(deriveEffectiveDiet(profile)).toBe('non-vegetarian');
});
```

- [ ] **Step 2: Run the targeted test**

Run:
```bash
npm test -- tests/engine/meal-composer-v2.test.js -t "deriveEffectiveDiet supports object-style foodList entries"
```

Expected: FAIL.

- [ ] **Step 3: Implement minimal production logic**

```js
// server/engine/meal-composer.js
const EGG_TERMS = ['egg', 'eggs', 'omelette', 'boiled egg'];
const NON_VEG_TERMS = ['chicken', 'fish', 'mutton', 'prawn', 'meat'];

function normalizeFoodTokens(foodList) {
  return (foodList || []).map(item => {
    if (typeof item === 'string') return item.toLowerCase();
    if (item && typeof item.name === 'string') return item.name.toLowerCase();
    return '';
  }).filter(Boolean);
}

function deriveEffectiveDiet(profile = {}) {
  const base = String(profile.dietType || 'vegetarian').toLowerCase();
  if (base === 'vegan') return 'vegan';
  const foods = normalizeFoodTokens(profile.foodList);
  const hasNonVeg = foods.some(f => NON_VEG_TERMS.some(t => f.includes(t)));
  if (hasNonVeg) return 'non-vegetarian';
  const hasEgg = foods.some(f => EGG_TERMS.some(t => f.includes(t)));
  if (base === 'vegetarian' && hasEgg) return 'eggetarian';
  return base;
}

// inside getMeals(...)
const effectiveDiet = deriveEffectiveDiet(profile);
const poolKey = resolvePool(effectiveDiet);
```

```js
// server/engine/plan-builder.js
const { getMeals, deriveEffectiveDiet } = require('./meal-composer');

function buildGroceryList(profile, goal) {
  const effectiveDiet = deriveEffectiveDiet(profile);
  const cuisinePreference = profile.cuisinePreference || 'mixed';
  const categories = getCuisineGrocery(effectiveDiet, cuisinePreference);
  return filterOutAvoidances(categories, profile.foodAllergies, profile.culturalFoodAvoidances);
}
```

- [ ] **Step 4: Run targeted tests**

Run:
```bash
npm test -- tests/engine/meal-composer-v2.test.js tests/engine/plan-builder.test.js
```

Expected: PASS for effective-diet inference and mixed-preference meal generation tests.

- [ ] **Step 5: Commit**

```bash
git add server/engine/meal-composer.js server/engine/plan-builder.js tests/engine/meal-composer-v2.test.js tests/engine/plan-builder.test.js
git commit -m "feat: infer effective diet from food preferences at generation time"
```

### Task 3: Add deterministic 4-week meal rotation with anti-repeat constraints

**Files:**
- Modify: `server/engine/meal-composer.js`
- Modify: `server/engine/plan-builder.js`
- Create: `tests/engine/meal-rotation.test.js`
- Test: `tests/engine/meal-rotation.test.js`

- [ ] **Step 1: Write failing rotation tests**

```js
// tests/engine/meal-rotation.test.js
'use strict';
const { getMeals } = require('../../server/engine/meal-composer');

const profile = {
  _id: 'u-rotation-1',
  dietType: 'vegetarian',
  cuisinePreference: 'south-indian',
  foodList: []
};

function dayTuple(weekIndex, dayIndex) {
  return [
    getMeals(profile, 'breakfast', 'weight-loss', weekIndex, dayIndex),
    getMeals(profile, 'lunch', 'weight-loss', weekIndex, dayIndex),
    getMeals(profile, 'snack', 'weight-loss', weekIndex, dayIndex),
    getMeals(profile, 'dinner', 'weight-loss', weekIndex, dayIndex),
  ].join('|');
}

test('week 0 and week 4 differ due to block rotation', () => {
  expect(dayTuple(0, 0)).not.toBe(dayTuple(4, 0));
});

test('same block remains deterministic', () => {
  expect(dayTuple(1, 2)).toBe(dayTuple(1, 2));
});
```

- [ ] **Step 2: Run test to verify failure**

Run:
```bash
npm test -- tests/engine/meal-rotation.test.js
```

Expected: FAIL on `week 0 and week 4 differ`.

- [ ] **Step 3: Implement seeded block rotation**

```js
// server/engine/meal-composer.js
function hashSeed(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = ((h << 5) - h) + input.charCodeAt(i);
  return Math.abs(h);
}

function getRotationOffset(profile, weekIndex, mealType) {
  const blockIndex = Math.floor(weekIndex / 4);
  const userId = String(profile._id || profile.email || 'anon');
  const seed = `${userId}|${profile.primaryGoal || 'general-fitness'}|${profile.cuisinePreference || 'mixed'}|${mealType}|${blockIndex}`;
  return hashSeed(seed);
}

// inside getMeals(...)
const offset = getRotationOffset(profile, weekIndex, mealType);
const index = (offset + weekIndex * 7 + dayIndex) % usePool.length;
```

- [ ] **Step 4: Run rotation + regression tests**

Run:
```bash
npm test -- tests/engine/meal-rotation.test.js tests/engine/meal-composer-v2.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/engine/meal-composer.js tests/engine/meal-rotation.test.js
git commit -m "feat: add deterministic 4-week meal rotation"
```

### Task 4: Add 4-week workout rotation across strength/yoga/cardio variants

**Files:**
- Modify: `server/engine/plan-builder.js`
- Create: `tests/engine/workout-rotation.test.js`
- Test: `tests/engine/workout-rotation.test.js`, `tests/engine/plan-builder-cardio.test.js`

- [ ] **Step 1: Write failing workout-rotation tests**

```js
// tests/engine/workout-rotation.test.js
'use strict';
const { buildWorkoutPlan } = require('../../server/engine/plan-builder');

const profile = {
  _id: 'u-workout-1',
  dietType: 'vegetarian',
  cuisinePreference: 'south-indian',
  workoutPreferences: ['gym', 'yoga'],
  workoutDaysPerWeek: 5,
  fitnessLevel: 'moderately-active',
  age: 30
};

test('month 1 and month 2 produce different active-day focus layouts', () => {
  const plan = buildWorkoutPlan(profile, 'weight-loss');
  const m1 = plan[0].schedule.filter(d => d.type !== 'rest').map(d => d.focus);
  const m2 = plan[1].schedule.filter(d => d.type !== 'rest').map(d => d.focus);
  expect(m1).not.toEqual(m2);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:
```bash
npm test -- tests/engine/workout-rotation.test.js
```

Expected: FAIL (current schedule repeats month to month).

- [ ] **Step 3: Implement block-based rotation in planner**

```js
// server/engine/plan-builder.js
function workoutVariantOffset(profile, monthIndex) {
  const userId = String(profile._id || profile.email || 'anon');
  const blockIndex = Math.floor(monthIndex); // one variant per month, 4-week diet block aligned by month
  const seed = `${userId}|${profile.primaryGoal || 'general-fitness'}|${profile.workoutDaysPerWeek || 4}|${blockIndex}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h) + seed.charCodeAt(i);
  return Math.abs(h);
}

// in buildWorkoutPlan loop, monthIndex available
const variant = workoutVariantOffset(profile, monthIndex) % 3;
// apply variant to slot ordering / yoga style progression / cardio session order
// ensure schedule shape remains valid while focus/exercise selection rotates
```

- [ ] **Step 4: Run targeted tests**

Run:
```bash
npm test -- tests/engine/workout-rotation.test.js tests/engine/plan-builder-cardio.test.js tests/engine/plan-builder.test.js
```

Expected: PASS for rotation and no regression in cardio/gym/hybrid expectations.

- [ ] **Step 5: Commit**

```bash
git add server/engine/plan-builder.js tests/engine/workout-rotation.test.js tests/engine/plan-builder-cardio.test.js tests/engine/plan-builder.test.js
git commit -m "feat: add deterministic workout variation across 6-month plan"
```

### Task 5: Full regression + deployment readiness

**Files:**
- Modify: `README.md` (testing section for new behavior)
- Test: `tests/engine/*.test.js`, `tests/routes/grocery.test.js`

- [ ] **Step 1: Add README validation notes for mixed preferences + rotation**

```md
## Personalization Validation (Phase 4)
- Vegetarian + egg/chicken in food list now influences generated plans via effective diet inference.
- Diet/workout patterns rotate deterministically across 4-week blocks.
- Re-generating plan with same profile in same block is stable (no random drift).
```

- [ ] **Step 2: Run focused regression**

Run:
```bash
npm test -- tests/engine/meal-composer-v2.test.js tests/engine/plan-builder.test.js tests/engine/plan-builder-cardio.test.js tests/engine/meal-rotation.test.js tests/engine/workout-rotation.test.js tests/routes/grocery.test.js
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:
```bash
npm test
```

Expected: PASS all suites.

- [ ] **Step 4: Create release commit**

```bash
git add server/engine/meal-composer.js server/engine/plan-builder.js tests/engine/meal-composer-v2.test.js tests/engine/plan-builder.test.js tests/engine/meal-rotation.test.js tests/engine/workout-rotation.test.js README.md
git commit -m "feat: phase 4 effective diet inference and deterministic plan rotation"
```

- [ ] **Step 5: Push and verify CI**

Run:
```bash
git push origin main
gh run list --limit 5
```

Expected: latest deploy workflow for `main` is `in_progress` then `success`.
