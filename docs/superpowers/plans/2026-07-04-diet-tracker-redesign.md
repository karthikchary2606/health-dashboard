# Diet Tracker Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hybrid weekly diet patterns, calorie + steps tracker module, and redesign the Today dashboard with dynamic data — making Praana competitive with HealthifyMe/MyFitnessPal.

**Architecture:** Meal data files are promoted from plain strings to objects with ICMR calorie estimates. `meal-composer.js` gains a `deriveWeeklyDietPattern()` export that returns a day-keyed object, used by `plan-builder.js` to set per-day diet types. A new `routes/tracker.js` provides calorie/steps CRUD. A new `tracker.html` + `tracker.js` gives users a dedicated tracking page. The Today dashboard is rebuilt using live `/api/logs/today` data.

**Tech Stack:** Express, Mongoose, vanilla JS (no framework), Jest + MongoMemoryServer

---

## File Map

**Modified files:**
- `models/User.js` — add `nonVegDays: [String]`, `eggDays: [String]`, `stepGoal: Number`
- `models/HealthLog.js` — add `fromPlan: Boolean` to mealEntrySchema; add `'custom'` to mealType enum; add `stepCount: Number` to HealthLogSchema
- `server/meals/south-indian.js` — meal strings → objects `{ name, calories, proteinG, carbsG, fatG, estimated }`
- `server/meals/north-indian.js` — same
- `server/meals/continental.js` — same
- `server/engine/meal-composer.js` — add `deriveWeeklyDietPattern()` export; update `getMeals()` to accept `dietTypeOverride` param; update `resolvePool()` callers
- `server/engine/plan-builder.js` — use `deriveWeeklyDietPattern()` per day; update meal access from string → `.name`
- `public/onboarding.html` — Step 3: add day-picker chips for `nonVegDays`/`eggDays` after diet radio selection
- `public/settings.html` — add diet day pickers and stepGoal field
- `public/js/diet.js` — add color-coded dot indicators (🟢🟠🔴) to day tabs
- `public/js/bottom-nav.js` — add `tracker` to PAGE_NAV; add "More" sheet button (⋯) for secondary modules
- `public/js/api.js` — add `localDateString()` helper
- `public/js/dashboard.js` — redesign Today view using `/api/logs/today`
- `routes/dashboard.js` (or `routes/logs.js`) — add `GET /api/logs/today` endpoint
- `server.js` — register `routes/tracker.js` as `/api/tracker`

**New files:**
- `routes/tracker.js` — 6 endpoints: log meal, log steps, get today summary, delete meal, update meal, patch steps
- `public/tracker.html` — calorie tab + steps tab UI
- `public/js/tracker.js` — tracker page frontend logic
- `tests/routes/tracker.test.js` — route tests
- `tests/engine/meal-composer-v3.test.js` — `deriveWeeklyDietPattern` tests
- `tests/engine/plan-builder-v2-meal-objects.test.js` — plan now returns meal objects with `.name`

---

### Task 1: Add `nonVegDays`, `eggDays`, `stepGoal` to User model

**Files:**
- Modify: `models/User.js`
- Test: `tests/models/user-v2.test.js` (add new cases to existing file)

- [ ] **Step 1: Write the failing test**

In `tests/models/user-v2.test.js`, add after existing tests:

```js
describe('profile hybrid diet fields', () => {
  test('saves nonVegDays array on profile', async () => {
    const user = await User.create({
      name: 'Test', email: 'nv@test.com', passwordHash: 'x',
      profile: { dietType: 'non-vegetarian', nonVegDays: ['Saturday', 'Sunday'] }
    });
    expect(user.profile.nonVegDays).toEqual(['Saturday', 'Sunday']);
  });

  test('saves eggDays array on profile', async () => {
    const user = await User.create({
      name: 'Test2', email: 'eg@test.com', passwordHash: 'x',
      profile: { dietType: 'eggetarian', eggDays: ['Monday', 'Wednesday', 'Friday'] }
    });
    expect(user.profile.eggDays).toEqual(['Monday', 'Wednesday', 'Friday']);
  });

  test('saves stepGoal on profile', async () => {
    const user = await User.create({
      name: 'Test3', email: 'sg@test.com', passwordHash: 'x',
      profile: { stepGoal: 8000 }
    });
    expect(user.profile.stepGoal).toBe(8000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/models/user-v2.test.js --testNamePattern="hybrid diet" -t "hybrid diet" --no-coverage
```
Expected: FAIL — `nonVegDays`, `eggDays`, `stepGoal` are not in schema.

- [ ] **Step 3: Add fields to `models/User.js` profileSchema**

In `models/User.js`, after the `waterGoalL` field (around line 70), add:

```js
  // Hybrid diet day configuration
  nonVegDays: { type: [String], default: [] },  // e.g. ['Saturday','Sunday']
  eggDays:    { type: [String], default: [] },  // e.g. ['Monday','Wednesday','Friday']

  // Steps goal
  stepGoal: { type: Number, default: 8000 },
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/models/user-v2.test.js --no-coverage
```
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add models/User.js tests/models/user-v2.test.js
git commit -m "feat(model): add nonVegDays, eggDays, stepGoal to User profile"
```

---

### Task 2: Update HealthLog model — add `fromPlan`, `stepCount`, `'custom'` enum

**Files:**
- Modify: `models/HealthLog.js`
- Test: `tests/models/healthLog-v2.test.js` (add new cases)

- [ ] **Step 1: Write the failing test**

In `tests/models/healthLog-v2.test.js`, add after existing tests:

```js
describe('HealthLog tracker extensions', () => {
  test('mealEntry accepts fromPlan flag', async () => {
    const log = await HealthLog.create({
      userId: new mongoose.Types.ObjectId(),
      date: '2024-01-15',
      meals: [{ mealType: 'breakfast', recipeName: 'Idli with Sambar', calories: 320, fromPlan: true }]
    });
    expect(log.meals[0].fromPlan).toBe(true);
  });

  test('mealEntry accepts custom mealType', async () => {
    const log = await HealthLog.create({
      userId: new mongoose.Types.ObjectId(),
      date: '2024-01-16',
      meals: [{ mealType: 'custom', recipeName: 'Evening Chai', calories: 60 }]
    });
    expect(log.meals[0].mealType).toBe('custom');
  });

  test('HealthLog accepts stepCount', async () => {
    const log = await HealthLog.create({
      userId: new mongoose.Types.ObjectId(),
      date: '2024-01-17',
      stepCount: 7450
    });
    expect(log.stepCount).toBe(7450);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/models/healthLog-v2.test.js --no-coverage
```
Expected: FAIL — `fromPlan` not in schema, `'custom'` not in enum, `stepCount` not in schema.

- [ ] **Step 3: Update `models/HealthLog.js`**

Change `mealEntrySchema`:

```js
const mealEntrySchema = new mongoose.Schema({
  mealType:   { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack', 'custom'] },
  recipeName: { type: String },
  calories:   { type: Number, default: 0 },
  proteinG:   { type: Number, default: 0 },
  carbsG:     { type: Number, default: 0 },
  fatG:       { type: Number, default: 0 },
  fromPlan:   { type: Boolean, default: false }
}, { _id: false });
```

In `HealthLogSchema`, add after `exerciseLog`:

```js
  stepCount: { type: Number, default: 0 },
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/models/healthLog-v2.test.js --no-coverage
```
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add models/HealthLog.js tests/models/healthLog-v2.test.js
git commit -m "feat(model): add fromPlan, stepCount, custom mealType to HealthLog"
```

---

### Task 3: Convert south-indian.js meal strings to objects with ICMR calorie data

**Files:**
- Modify: `server/meals/south-indian.js`
- Test: `tests/engine/meal-composer.test.js` (will break — fix in Task 6)

- [ ] **Step 1: Write a data-shape test first**

Create `tests/engine/plan-builder-v2-meal-objects.test.js`:

```js
'use strict';
const si = require('../../server/meals/south-indian');

describe('south-indian meal data shape', () => {
  const slots = ['breakfast', 'lunch', 'snack', 'dinner'];
  const pools = ['veg', 'eggetarian', 'non-veg'];

  slots.forEach(slot => {
    pools.forEach(pool => {
      test(`${slot}.${pool} meals are objects with name and calories`, () => {
        const meals = si[slot][pool];
        expect(Array.isArray(meals)).toBe(true);
        meals.forEach(m => {
          expect(typeof m).toBe('object');
          expect(typeof m.name).toBe('string');
          expect(m.name.length).toBeGreaterThan(0);
          expect(typeof m.calories).toBe('number');
          expect(m.calories).toBeGreaterThan(0);
          expect(m.estimated).toBe(true);
        });
      });
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest tests/engine/plan-builder-v2-meal-objects.test.js --no-coverage
```
Expected: FAIL — meals are strings.

- [ ] **Step 3: Replace `server/meals/south-indian.js` contents**

Replace the entire file with:

```js
'use strict';

// All calorie/macro values are ICMR best-effort estimates for a typical serving.
// estimated: true — shown as "~NNN kcal" in the UI.

module.exports = {
  breakfast: {
    veg: [
      { name: 'Idli with Sambar',              calories: 220, proteinG: 8,  carbsG: 40, fatG: 3,  estimated: true },
      { name: 'Masala Dosa',                   calories: 340, proteinG: 8,  carbsG: 55, fatG: 10, estimated: true },
      { name: 'Rava Upma',                     calories: 260, proteinG: 6,  carbsG: 42, fatG: 8,  estimated: true },
      { name: 'Pongal with Chutney',           calories: 300, proteinG: 9,  carbsG: 50, fatG: 8,  estimated: true },
      { name: 'Medu Vada',                     calories: 280, proteinG: 8,  carbsG: 36, fatG: 12, estimated: true },
      { name: 'Rava Idli',                     calories: 240, proteinG: 7,  carbsG: 40, fatG: 6,  estimated: true },
      { name: 'Oats Pongal',                   calories: 250, proteinG: 9,  carbsG: 44, fatG: 5,  estimated: true },
      { name: 'Pesarattu with Ginger Chutney', calories: 230, proteinG: 10, carbsG: 36, fatG: 5,  estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Dosa',                       calories: 320, proteinG: 14, carbsG: 42, fatG: 10, estimated: true },
      { name: 'Egg Upma',                       calories: 300, proteinG: 12, carbsG: 40, fatG: 10, estimated: true },
      { name: 'Egg Parotta',                    calories: 420, proteinG: 16, carbsG: 56, fatG: 14, estimated: true },
      { name: 'Masala Egg Omelette with Idli',  calories: 360, proteinG: 18, carbsG: 38, fatG: 14, estimated: true },
      { name: 'Scrambled Eggs with Appam',      calories: 340, proteinG: 14, carbsG: 44, fatG: 12, estimated: true },
    ],
    'non-veg': [
      { name: 'Chicken Keema Dosa',             calories: 440, proteinG: 28, carbsG: 48, fatG: 14, estimated: true },
      { name: 'Fish Curry with Idli',           calories: 380, proteinG: 26, carbsG: 44, fatG: 10, estimated: true },
      { name: 'Prawn Masala with Appam',        calories: 400, proteinG: 24, carbsG: 48, fatG: 12, estimated: true },
      { name: 'Mutton Kheema with Parotta',     calories: 520, proteinG: 32, carbsG: 52, fatG: 20, estimated: true },
      { name: 'Chicken Chettinad Breakfast Bowl', calories: 460, proteinG: 30, carbsG: 44, fatG: 16, estimated: true },
    ],
  },
  lunch: {
    veg: [
      { name: 'Sambar Rice with Papad',         calories: 380, proteinG: 12, carbsG: 68, fatG: 8,  estimated: true },
      { name: 'Vegetable Biryani',              calories: 420, proteinG: 10, carbsG: 72, fatG: 12, estimated: true },
      { name: 'Rasam Rice with Poriyal',        calories: 340, proteinG: 9,  carbsG: 60, fatG: 8,  estimated: true },
      { name: 'Curd Rice with Pickle',          calories: 300, proteinG: 8,  carbsG: 55, fatG: 6,  estimated: true },
      { name: 'Kootu Curry with Rice',          calories: 360, proteinG: 11, carbsG: 62, fatG: 8,  estimated: true },
      { name: 'Tamarind Rice',                  calories: 350, proteinG: 7,  carbsG: 64, fatG: 9,  estimated: true },
      { name: 'Vegetable Kuzhambu with Rice',   calories: 370, proteinG: 9,  carbsG: 65, fatG: 9,  estimated: true },
      { name: 'Tomato Rice with Raita',         calories: 360, proteinG: 9,  carbsG: 62, fatG: 9,  estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Curry with Rice',            calories: 460, proteinG: 22, carbsG: 60, fatG: 14, estimated: true },
      { name: 'Egg Biryani',                    calories: 520, proteinG: 24, carbsG: 72, fatG: 16, estimated: true },
      { name: 'Egg Masala with Parotta',        calories: 500, proteinG: 22, carbsG: 66, fatG: 18, estimated: true },
      { name: 'Egg Kuzhambu with Rice',         calories: 440, proteinG: 20, carbsG: 60, fatG: 14, estimated: true },
      { name: 'Egg Fried Rice',                 calories: 480, proteinG: 18, carbsG: 68, fatG: 16, estimated: true },
    ],
    'non-veg': [
      { name: 'Chicken Chettinad with Rice',    calories: 560, proteinG: 36, carbsG: 64, fatG: 16, estimated: true },
      { name: 'Fish Curry with Rice',           calories: 480, proteinG: 30, carbsG: 62, fatG: 12, estimated: true },
      { name: 'Prawn Biryani',                  calories: 580, proteinG: 32, carbsG: 72, fatG: 18, estimated: true },
      { name: 'Mutton Kuzhambu with Rice',      calories: 600, proteinG: 38, carbsG: 64, fatG: 22, estimated: true },
      { name: 'Chicken Biryani',                calories: 580, proteinG: 36, carbsG: 70, fatG: 18, estimated: true },
      { name: 'Fish Fry with Sambar Rice',      calories: 500, proteinG: 32, carbsG: 64, fatG: 14, estimated: true },
      { name: 'Prawn Masala with Rice',         calories: 520, proteinG: 30, carbsG: 64, fatG: 16, estimated: true },
      { name: 'Chicken 65 Rice Bowl',           calories: 560, proteinG: 34, carbsG: 66, fatG: 18, estimated: true },
    ],
  },
  snack: {
    veg: [
      { name: 'Murukku with Tea',               calories: 180, proteinG: 3,  carbsG: 28, fatG: 8,  estimated: true },
      { name: 'Sundal',                         calories: 140, proteinG: 7,  carbsG: 22, fatG: 3,  estimated: true },
      { name: 'Banana Chips',                   calories: 200, proteinG: 2,  carbsG: 30, fatG: 10, estimated: true },
      { name: 'Onion Pakoda',                   calories: 220, proteinG: 5,  carbsG: 26, fatG: 12, estimated: true },
      { name: 'Tapioca Chips',                  calories: 190, proteinG: 2,  carbsG: 28, fatG: 9,  estimated: true },
      { name: 'Coconut Ladoo',                  calories: 160, proteinG: 2,  carbsG: 22, fatG: 8,  estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Bhurji on Toast',            calories: 280, proteinG: 16, carbsG: 26, fatG: 12, estimated: true },
      { name: 'Boiled Egg with Pepper',         calories: 80,  proteinG: 6,  carbsG: 1,  fatG: 6,  estimated: true },
      { name: 'Egg Puff',                       calories: 260, proteinG: 10, carbsG: 28, fatG: 14, estimated: true },
    ],
    'non-veg': [
      { name: 'Chicken Lollipop',               calories: 280, proteinG: 20, carbsG: 14, fatG: 16, estimated: true },
      { name: 'Fish Fry Bites',                 calories: 240, proteinG: 18, carbsG: 12, fatG: 14, estimated: true },
      { name: 'Prawn Fry',                      calories: 220, proteinG: 20, carbsG: 8,  fatG: 12, estimated: true },
    ],
  },
  dinner: {
    veg: [
      { name: 'Chapati with Vegetable Curry',   calories: 360, proteinG: 10, carbsG: 58, fatG: 10, estimated: true },
      { name: 'Dosa with Sambar',               calories: 300, proteinG: 9,  carbsG: 52, fatG: 7,  estimated: true },
      { name: 'Parotta with Salna',             calories: 420, proteinG: 8,  carbsG: 62, fatG: 16, estimated: true },
      { name: 'Idiyappam with Coconut Milk',    calories: 280, proteinG: 6,  carbsG: 50, fatG: 7,  estimated: true },
      { name: 'Pongal with Vada',               calories: 380, proteinG: 12, carbsG: 60, fatG: 12, estimated: true },
      { name: 'Vegetable Kurma with Rice',      calories: 400, proteinG: 10, carbsG: 66, fatG: 12, estimated: true },
      { name: 'Kothu Parotta (Veg)',            calories: 440, proteinG: 10, carbsG: 64, fatG: 16, estimated: true },
      { name: 'Adai with Avial',               calories: 340, proteinG: 12, carbsG: 54, fatG: 8,  estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Kothu Parotta',              calories: 500, proteinG: 22, carbsG: 64, fatG: 18, estimated: true },
      { name: 'Egg Curry with Chapati',         calories: 440, proteinG: 22, carbsG: 56, fatG: 16, estimated: true },
      { name: 'Egg Masala Dosa',               calories: 400, proteinG: 18, carbsG: 56, fatG: 14, estimated: true },
      { name: 'Egg Rice Bowl',                  calories: 460, proteinG: 20, carbsG: 62, fatG: 14, estimated: true },
      { name: 'Omelette with Idiyappam',        calories: 360, proteinG: 16, carbsG: 48, fatG: 14, estimated: true },
    ],
    'non-veg': [
      { name: 'Chicken Curry with Rice',        calories: 560, proteinG: 36, carbsG: 62, fatG: 18, estimated: true },
      { name: 'Fish Fry with Rasam Rice',       calories: 480, proteinG: 32, carbsG: 58, fatG: 14, estimated: true },
      { name: 'Mutton Biryani',                 calories: 640, proteinG: 40, carbsG: 72, fatG: 22, estimated: true },
      { name: 'Prawn Curry with Idiyappam',     calories: 480, proteinG: 28, carbsG: 56, fatG: 16, estimated: true },
      { name: 'Chicken Kothu Parotta',          calories: 580, proteinG: 36, carbsG: 62, fatG: 22, estimated: true },
      { name: 'Fish Kuzhambu with Rice',        calories: 500, proteinG: 30, carbsG: 62, fatG: 16, estimated: true },
      { name: 'Chicken Pepper Fry with Parotta', calories: 560, proteinG: 36, carbsG: 56, fatG: 22, estimated: true },
      { name: 'Crab Curry with Rice',           calories: 520, proteinG: 32, carbsG: 62, fatG: 16, estimated: true },
    ],
  },
};
```

- [ ] **Step 4: Run the data-shape test**

```bash
npx jest tests/engine/plan-builder-v2-meal-objects.test.js --no-coverage
```
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add server/meals/south-indian.js tests/engine/plan-builder-v2-meal-objects.test.js
git commit -m "feat(meals): convert south-indian meals to objects with ICMR calorie data"
```

---

### Task 4: Convert north-indian.js meal strings to objects

**Files:**
- Modify: `server/meals/north-indian.js`

- [ ] **Step 1: Extend the data-shape test from Task 3**

Add to `tests/engine/plan-builder-v2-meal-objects.test.js`:

```js
const ni = require('../../server/meals/north-indian');

describe('north-indian meal data shape', () => {
  const slots = ['breakfast', 'lunch', 'snack', 'dinner'];
  const pools = ['veg', 'eggetarian', 'non-veg'];

  slots.forEach(slot => {
    pools.forEach(pool => {
      test(`${slot}.${pool} meals are objects with name and calories`, () => {
        const meals = ni[slot][pool];
        expect(Array.isArray(meals)).toBe(true);
        meals.forEach(m => {
          expect(typeof m.name).toBe('string');
          expect(typeof m.calories).toBe('number');
          expect(m.calories).toBeGreaterThan(0);
          expect(m.estimated).toBe(true);
        });
      });
    });
  });
});
```

- [ ] **Step 2: Run to confirm the new tests fail**

```bash
npx jest tests/engine/plan-builder-v2-meal-objects.test.js --no-coverage
```
Expected: north-indian tests FAIL.

- [ ] **Step 3: Replace `server/meals/north-indian.js` contents**

```js
'use strict';

module.exports = {
  breakfast: {
    veg: [
      { name: 'Aloo Paratha with Curd',     calories: 380, proteinG: 10, carbsG: 58, fatG: 12, estimated: true },
      { name: 'Poha with Peanuts',          calories: 280, proteinG: 8,  carbsG: 46, fatG: 8,  estimated: true },
      { name: 'Upma with Chutney',          calories: 260, proteinG: 6,  carbsG: 42, fatG: 8,  estimated: true },
      { name: 'Besan Chilla',               calories: 240, proteinG: 12, carbsG: 30, fatG: 8,  estimated: true },
      { name: 'Puri with Aloo Bhaji',       calories: 420, proteinG: 8,  carbsG: 60, fatG: 16, estimated: true },
      { name: 'Methi Paratha',              calories: 340, proteinG: 8,  carbsG: 52, fatG: 12, estimated: true },
      { name: 'Dal Paratha',                calories: 360, proteinG: 12, carbsG: 54, fatG: 12, estimated: true },
      { name: 'Sooji Halwa with Puri',      calories: 440, proteinG: 7,  carbsG: 70, fatG: 16, estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Paratha',                calories: 400, proteinG: 16, carbsG: 52, fatG: 14, estimated: true },
      { name: 'Egg Bhurji with Roti',       calories: 340, proteinG: 18, carbsG: 36, fatG: 14, estimated: true },
      { name: 'Masala Omelette with Poha',  calories: 360, proteinG: 16, carbsG: 42, fatG: 14, estimated: true },
      { name: 'Egg Frankie',                calories: 380, proteinG: 16, carbsG: 48, fatG: 14, estimated: true },
      { name: 'Egg Kathi Roll',             calories: 400, proteinG: 16, carbsG: 50, fatG: 14, estimated: true },
    ],
    'non-veg': [
      { name: 'Keema Paratha',              calories: 480, proteinG: 28, carbsG: 52, fatG: 18, estimated: true },
      { name: 'Chicken Frankie',            calories: 440, proteinG: 26, carbsG: 48, fatG: 16, estimated: true },
      { name: 'Mutton Kheema with Puri',    calories: 520, proteinG: 32, carbsG: 52, fatG: 22, estimated: true },
      { name: 'Chicken Tikka Breakfast Bowl', calories: 460, proteinG: 30, carbsG: 42, fatG: 18, estimated: true },
      { name: 'Prawn Masala with Roti',     calories: 420, proteinG: 26, carbsG: 44, fatG: 14, estimated: true },
    ],
  },
  lunch: {
    veg: [
      { name: 'Dal Tadka with Roti',        calories: 400, proteinG: 16, carbsG: 60, fatG: 10, estimated: true },
      { name: 'Paneer Butter Masala with Rice', calories: 520, proteinG: 20, carbsG: 64, fatG: 20, estimated: true },
      { name: 'Rajma Chawal',               calories: 460, proteinG: 16, carbsG: 78, fatG: 8,  estimated: true },
      { name: 'Chole Bhature',              calories: 580, proteinG: 16, carbsG: 80, fatG: 22, estimated: true },
      { name: 'Sabzi with Roti',            calories: 360, proteinG: 10, carbsG: 58, fatG: 10, estimated: true },
      { name: 'Palak Paneer with Rice',     calories: 480, proteinG: 18, carbsG: 60, fatG: 18, estimated: true },
      { name: 'Kadhi Chawal',               calories: 380, proteinG: 10, carbsG: 66, fatG: 8,  estimated: true },
      { name: 'Aloo Gobi with Roti',        calories: 360, proteinG: 8,  carbsG: 58, fatG: 10, estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Curry with Roti',        calories: 460, proteinG: 22, carbsG: 52, fatG: 16, estimated: true },
      { name: 'Egg Biryani',                calories: 520, proteinG: 24, carbsG: 70, fatG: 16, estimated: true },
      { name: 'Egg Masala with Rice',       calories: 480, proteinG: 20, carbsG: 64, fatG: 16, estimated: true },
      { name: 'Egg Bhurji with Paratha',    calories: 460, proteinG: 20, carbsG: 56, fatG: 18, estimated: true },
      { name: 'Egg Fried Rice',             calories: 480, proteinG: 18, carbsG: 68, fatG: 16, estimated: true },
    ],
    'non-veg': [
      { name: 'Chicken Biryani',            calories: 580, proteinG: 36, carbsG: 70, fatG: 18, estimated: true },
      { name: 'Mutton Rogan Josh with Rice', calories: 620, proteinG: 40, carbsG: 64, fatG: 24, estimated: true },
      { name: 'Butter Chicken with Naan',   calories: 640, proteinG: 38, carbsG: 66, fatG: 24, estimated: true },
      { name: 'Fish Curry with Rice',       calories: 480, proteinG: 30, carbsG: 62, fatG: 12, estimated: true },
      { name: 'Keema with Roti',            calories: 500, proteinG: 32, carbsG: 48, fatG: 20, estimated: true },
      { name: 'Prawn Masala with Rice',     calories: 520, proteinG: 30, carbsG: 64, fatG: 16, estimated: true },
      { name: 'Chicken Korma with Rice',    calories: 600, proteinG: 36, carbsG: 66, fatG: 22, estimated: true },
      { name: 'Mutton Biryani',             calories: 640, proteinG: 40, carbsG: 72, fatG: 24, estimated: true },
    ],
  },
  snack: {
    veg: [
      { name: 'Samosa',                     calories: 240, proteinG: 4,  carbsG: 30, fatG: 12, estimated: true },
      { name: 'Aloo Tikki',                 calories: 200, proteinG: 4,  carbsG: 30, fatG: 8,  estimated: true },
      { name: 'Bhel Puri',                  calories: 180, proteinG: 4,  carbsG: 30, fatG: 6,  estimated: true },
      { name: 'Dhokla',                     calories: 160, proteinG: 6,  carbsG: 26, fatG: 4,  estimated: true },
      { name: 'Poha Chivda',               calories: 200, proteinG: 5,  carbsG: 32, fatG: 8,  estimated: true },
      { name: 'Roasted Chana',              calories: 120, proteinG: 8,  carbsG: 18, fatG: 3,  estimated: true },
    ],
    eggetarian: [
      { name: 'Boiled Egg with Chat Masala', calories: 90,  proteinG: 6,  carbsG: 2,  fatG: 6,  estimated: true },
      { name: 'Egg Roll',                   calories: 300, proteinG: 14, carbsG: 34, fatG: 14, estimated: true },
      { name: 'Egg Bhurji with Bread',      calories: 280, proteinG: 14, carbsG: 28, fatG: 12, estimated: true },
    ],
    'non-veg': [
      { name: 'Chicken Tikka',              calories: 260, proteinG: 28, carbsG: 6,  fatG: 14, estimated: true },
      { name: 'Mutton Seekh Kebab',         calories: 280, proteinG: 26, carbsG: 8,  fatG: 16, estimated: true },
      { name: 'Fish Pakora',                calories: 220, proteinG: 18, carbsG: 16, fatG: 12, estimated: true },
    ],
  },
  dinner: {
    veg: [
      { name: 'Dal Makhani with Roti',      calories: 440, proteinG: 16, carbsG: 62, fatG: 14, estimated: true },
      { name: 'Paneer Tikka Masala with Rice', calories: 540, proteinG: 22, carbsG: 64, fatG: 22, estimated: true },
      { name: 'Chole with Bhature',         calories: 560, proteinG: 16, carbsG: 78, fatG: 20, estimated: true },
      { name: 'Palak Dal with Roti',        calories: 380, proteinG: 14, carbsG: 58, fatG: 10, estimated: true },
      { name: 'Aloo Paratha with Raita',    calories: 420, proteinG: 10, carbsG: 62, fatG: 14, estimated: true },
      { name: 'Shahi Paneer with Naan',     calories: 580, proteinG: 22, carbsG: 64, fatG: 26, estimated: true },
      { name: 'Vegetable Pulao with Raita', calories: 400, proteinG: 10, carbsG: 66, fatG: 10, estimated: true },
      { name: 'Chana Masala with Rice',     calories: 460, proteinG: 16, carbsG: 76, fatG: 10, estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Curry with Rice',        calories: 480, proteinG: 22, carbsG: 62, fatG: 16, estimated: true },
      { name: 'Egg Bhurji with Paratha',    calories: 460, proteinG: 20, carbsG: 58, fatG: 18, estimated: true },
      { name: 'Masala Omelette with Roti',  calories: 400, proteinG: 20, carbsG: 46, fatG: 18, estimated: true },
      { name: 'Egg Biryani',                calories: 520, proteinG: 24, carbsG: 70, fatG: 16, estimated: true },
      { name: 'Egg Korma with Rice',        calories: 500, proteinG: 22, carbsG: 64, fatG: 18, estimated: true },
    ],
    'non-veg': [
      { name: 'Butter Chicken with Naan',   calories: 640, proteinG: 38, carbsG: 66, fatG: 24, estimated: true },
      { name: 'Mutton Curry with Rice',     calories: 600, proteinG: 40, carbsG: 62, fatG: 22, estimated: true },
      { name: 'Chicken Tikka Masala with Rice', calories: 580, proteinG: 36, carbsG: 64, fatG: 20, estimated: true },
      { name: 'Prawn Masala with Naan',     calories: 540, proteinG: 30, carbsG: 58, fatG: 18, estimated: true },
      { name: 'Fish Fry with Dal Rice',     calories: 520, proteinG: 32, carbsG: 60, fatG: 16, estimated: true },
      { name: 'Keema Matar with Roti',      calories: 520, proteinG: 34, carbsG: 50, fatG: 20, estimated: true },
      { name: 'Chicken Handi with Rice',    calories: 580, proteinG: 36, carbsG: 64, fatG: 20, estimated: true },
      { name: 'Mutton Rogan Josh with Rice', calories: 640, proteinG: 42, carbsG: 64, fatG: 26, estimated: true },
    ],
  },
};
```

- [ ] **Step 4: Run tests**

```bash
npx jest tests/engine/plan-builder-v2-meal-objects.test.js --no-coverage
```
Expected: All PASS (both south-indian and north-indian blocks).

- [ ] **Step 5: Commit**

```bash
git add server/meals/north-indian.js
git commit -m "feat(meals): convert north-indian meals to objects with ICMR calorie data"
```

---

### Task 5: Convert continental.js meal strings to objects

**Files:**
- Modify: `server/meals/continental.js`

- [ ] **Step 1: Extend the data-shape test**

Add to `tests/engine/plan-builder-v2-meal-objects.test.js`:

```js
const ct = require('../../server/meals/continental');

describe('continental meal data shape', () => {
  const slots = ['breakfast', 'lunch', 'snack', 'dinner'];
  const pools = ['veg', 'eggetarian', 'non-veg'];
  slots.forEach(slot => {
    pools.forEach(pool => {
      test(`${slot}.${pool} meals are objects with name and calories`, () => {
        const meals = ct[slot][pool];
        meals.forEach(m => {
          expect(typeof m.name).toBe('string');
          expect(typeof m.calories).toBe('number');
          expect(m.calories).toBeGreaterThan(0);
          expect(m.estimated).toBe(true);
        });
      });
    });
  });
});
```

- [ ] **Step 2: Run to confirm new tests fail**

```bash
npx jest tests/engine/plan-builder-v2-meal-objects.test.js --testNamePattern="continental" --no-coverage
```
Expected: FAIL.

- [ ] **Step 3: Replace `server/meals/continental.js` contents**

```js
'use strict';

module.exports = {
  breakfast: {
    veg: [
      { name: 'Avocado Toast',              calories: 280, proteinG: 8,  carbsG: 28, fatG: 16, estimated: true },
      { name: 'Oatmeal with Berries',       calories: 260, proteinG: 7,  carbsG: 46, fatG: 5,  estimated: true },
      { name: 'Granola with Yogurt',        calories: 320, proteinG: 10, carbsG: 48, fatG: 10, estimated: true },
      { name: 'Banana Nut Smoothie Bowl',   calories: 340, proteinG: 8,  carbsG: 56, fatG: 10, estimated: true },
      { name: 'Whole Grain Pancakes',       calories: 380, proteinG: 8,  carbsG: 64, fatG: 10, estimated: true },
      { name: 'Smoothie Bowl',              calories: 300, proteinG: 6,  carbsG: 52, fatG: 8,  estimated: true },
    ],
    eggetarian: [
      { name: 'Scrambled Eggs on Toast',    calories: 320, proteinG: 16, carbsG: 28, fatG: 16, estimated: true },
      { name: 'Eggs Benedict',              calories: 440, proteinG: 22, carbsG: 32, fatG: 26, estimated: true },
      { name: 'French Omelette',            calories: 300, proteinG: 16, carbsG: 6,  fatG: 24, estimated: true },
      { name: 'Poached Eggs with Sourdough', calories: 340, proteinG: 18, carbsG: 32, fatG: 16, estimated: true },
    ],
    'non-veg': [
      { name: 'Bacon and Eggs',             calories: 440, proteinG: 28, carbsG: 4,  fatG: 34, estimated: true },
      { name: 'Smoked Salmon Bagel',        calories: 420, proteinG: 28, carbsG: 36, fatG: 16, estimated: true },
      { name: 'Chicken Sausage with Toast', calories: 400, proteinG: 26, carbsG: 30, fatG: 18, estimated: true },
      { name: 'Ham and Cheese Omelette',    calories: 420, proteinG: 28, carbsG: 6,  fatG: 32, estimated: true },
    ],
  },
  lunch: {
    veg: [
      { name: 'Garden Salad with Vinaigrette', calories: 200, proteinG: 4,  carbsG: 18, fatG: 12, estimated: true },
      { name: 'Grilled Cheese Sandwich',    calories: 380, proteinG: 14, carbsG: 36, fatG: 22, estimated: true },
      { name: 'Caprese Salad with Focaccia', calories: 380, proteinG: 12, carbsG: 40, fatG: 18, estimated: true },
      { name: 'Vegetable Soup with Bread',  calories: 300, proteinG: 8,  carbsG: 44, fatG: 8,  estimated: true },
      { name: 'Mushroom Risotto',           calories: 440, proteinG: 10, carbsG: 64, fatG: 14, estimated: true },
      { name: 'Pasta Primavera',            calories: 420, proteinG: 12, carbsG: 66, fatG: 12, estimated: true },
    ],
    eggetarian: [
      { name: 'Egg Salad Sandwich',         calories: 360, proteinG: 18, carbsG: 30, fatG: 18, estimated: true },
      { name: 'Quiche Lorraine',            calories: 480, proteinG: 18, carbsG: 32, fatG: 32, estimated: true },
      { name: 'Frittata with Salad',        calories: 380, proteinG: 20, carbsG: 14, fatG: 26, estimated: true },
      { name: 'Egg Fried Rice',             calories: 440, proteinG: 16, carbsG: 62, fatG: 14, estimated: true },
    ],
    'non-veg': [
      { name: 'Grilled Chicken Caesar Salad', calories: 420, proteinG: 32, carbsG: 18, fatG: 24, estimated: true },
      { name: 'Tuna Sandwich',              calories: 380, proteinG: 28, carbsG: 32, fatG: 14, estimated: true },
      { name: 'Chicken Wrap',               calories: 440, proteinG: 30, carbsG: 40, fatG: 16, estimated: true },
      { name: 'Fish and Chips',             calories: 560, proteinG: 28, carbsG: 56, fatG: 26, estimated: true },
      { name: 'Prawn Pasta',                calories: 480, proteinG: 28, carbsG: 58, fatG: 14, estimated: true },
      { name: 'Turkey Club Sandwich',       calories: 460, proteinG: 32, carbsG: 38, fatG: 18, estimated: true },
    ],
  },
  snack: {
    veg: [
      { name: 'Hummus with Veggie Sticks',  calories: 160, proteinG: 6,  carbsG: 18, fatG: 8,  estimated: true },
      { name: 'Trail Mix',                  calories: 200, proteinG: 5,  carbsG: 22, fatG: 12, estimated: true },
      { name: 'Greek Yogurt with Honey',    calories: 180, proteinG: 10, carbsG: 24, fatG: 4,  estimated: true },
      { name: 'Rice Cakes with Almond Butter', calories: 200, proteinG: 6, carbsG: 26, fatG: 10, estimated: true },
    ],
    eggetarian: [
      { name: 'Hard Boiled Eggs',           calories: 140, proteinG: 12, carbsG: 2,  fatG: 10, estimated: true },
      { name: 'Egg Muffin',                 calories: 180, proteinG: 12, carbsG: 8,  fatG: 12, estimated: true },
      { name: 'Deviled Eggs',               calories: 120, proteinG: 8,  carbsG: 2,  fatG: 10, estimated: true },
    ],
    'non-veg': [
      { name: 'Grilled Chicken Strips',     calories: 180, proteinG: 24, carbsG: 4,  fatG: 8,  estimated: true },
      { name: 'Tuna on Crackers',           calories: 160, proteinG: 16, carbsG: 12, fatG: 6,  estimated: true },
      { name: 'Smoked Salmon Cucumber Bites', calories: 120, proteinG: 12, carbsG: 4, fatG: 6, estimated: true },
    ],
  },
  dinner: {
    veg: [
      { name: 'Pasta Arrabiata',            calories: 420, proteinG: 12, carbsG: 68, fatG: 10, estimated: true },
      { name: 'Vegetable Stir Fry with Rice', calories: 380, proteinG: 8, carbsG: 64, fatG: 10, estimated: true },
      { name: 'Margherita Pizza',           calories: 560, proteinG: 18, carbsG: 72, fatG: 20, estimated: true },
      { name: 'Lentil Soup with Bread',     calories: 360, proteinG: 16, carbsG: 54, fatG: 8,  estimated: true },
      { name: 'Stuffed Bell Peppers',       calories: 340, proteinG: 10, carbsG: 48, fatG: 10, estimated: true },
      { name: 'Mushroom Pasta',             calories: 440, proteinG: 12, carbsG: 66, fatG: 14, estimated: true },
    ],
    eggetarian: [
      { name: 'Spaghetti Carbonara',        calories: 560, proteinG: 24, carbsG: 64, fatG: 22, estimated: true },
      { name: 'Egg Fried Noodles',          calories: 480, proteinG: 18, carbsG: 68, fatG: 16, estimated: true },
      { name: 'Omelette with Ratatouille',  calories: 380, proteinG: 20, carbsG: 20, fatG: 26, estimated: true },
      { name: 'Frittata with Roasted Veg',  calories: 360, proteinG: 20, carbsG: 16, fatG: 24, estimated: true },
    ],
    'non-veg': [
      { name: 'Grilled Salmon with Quinoa', calories: 520, proteinG: 40, carbsG: 42, fatG: 18, estimated: true },
      { name: 'Chicken Roast with Vegetables', calories: 540, proteinG: 40, carbsG: 32, fatG: 24, estimated: true },
      { name: 'Beef Stew with Bread',       calories: 580, proteinG: 38, carbsG: 48, fatG: 20, estimated: true },
      { name: 'Prawn Pasta',                calories: 520, proteinG: 30, carbsG: 60, fatG: 16, estimated: true },
      { name: 'Fish Tacos',                 calories: 480, proteinG: 28, carbsG: 50, fatG: 16, estimated: true },
      { name: 'Chicken Parmesan',           calories: 580, proteinG: 40, carbsG: 44, fatG: 24, estimated: true },
    ],
  },
};
```

- [ ] **Step 4: Run all data-shape tests**

```bash
npx jest tests/engine/plan-builder-v2-meal-objects.test.js --no-coverage
```
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add server/meals/continental.js tests/engine/plan-builder-v2-meal-objects.test.js
git commit -m "feat(meals): convert continental meals to objects with ICMR calorie data"
```

---

### Task 6: Update meal-composer.js — use `.name`, add `deriveWeeklyDietPattern()`

**Files:**
- Modify: `server/engine/meal-composer.js`
- Test: `tests/engine/meal-composer.test.js` (fix string assertions → `.name` assertions)
- New test: `tests/engine/meal-composer-v3.test.js`

- [ ] **Step 1: Write the failing tests for `deriveWeeklyDietPattern`**

Create `tests/engine/meal-composer-v3.test.js`:

```js
'use strict';
const { deriveWeeklyDietPattern, getMeals } = require('../../server/engine/meal-composer');
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

describe('deriveWeeklyDietPattern', () => {
  test('vegetarian profile → all days vegetarian', () => {
    const profile = { dietType: 'vegetarian' };
    const pattern = deriveWeeklyDietPattern(profile);
    DAYS.forEach(day => expect(pattern[day]).toBe('vegetarian'));
  });

  test('vegan profile → all days vegan', () => {
    const profile = { dietType: 'vegan' };
    const pattern = deriveWeeklyDietPattern(profile);
    DAYS.forEach(day => expect(pattern[day]).toBe('vegan'));
  });

  test('non-veg with nonVegDays → named days are non-veg, rest are vegetarian', () => {
    const profile = { dietType: 'non-vegetarian', nonVegDays: ['Saturday', 'Sunday'] };
    const pattern = deriveWeeklyDietPattern(profile);
    expect(pattern['Saturday']).toBe('non-vegetarian');
    expect(pattern['Sunday']).toBe('non-vegetarian');
    expect(pattern['Monday']).toBe('vegetarian');
    expect(pattern['Wednesday']).toBe('vegetarian');
  });

  test('non-veg with no nonVegDays → all days non-veg (backward compat)', () => {
    const profile = { dietType: 'non-vegetarian', nonVegDays: [] };
    const pattern = deriveWeeklyDietPattern(profile);
    DAYS.forEach(day => expect(pattern[day]).toBe('non-vegetarian'));
  });

  test('eggetarian with eggDays → named days are eggetarian, rest are vegetarian', () => {
    const profile = { dietType: 'eggetarian', eggDays: ['Monday', 'Wednesday', 'Friday'] };
    const pattern = deriveWeeklyDietPattern(profile);
    expect(pattern['Monday']).toBe('eggetarian');
    expect(pattern['Wednesday']).toBe('eggetarian');
    expect(pattern['Friday']).toBe('eggetarian');
    expect(pattern['Tuesday']).toBe('vegetarian');
    expect(pattern['Saturday']).toBe('vegetarian');
  });
});

describe('getMeals returns object with name and calories after meal files upgrade', () => {
  test('returns object for vegetarian south-indian breakfast', () => {
    const profile = { cuisinePreference: 'south-indian', dietType: 'vegetarian' };
    const meal = getMeals(profile, 'breakfast', 'weight-loss', 0, 0);
    expect(typeof meal).toBe('object');
    expect(typeof meal.name).toBe('string');
    expect(typeof meal.calories).toBe('number');
  });

  test('returns object for non-veg north-indian dinner', () => {
    const profile = { cuisinePreference: 'north-indian', dietType: 'non-vegetarian' };
    const meal = getMeals(profile, 'dinner', 'weight-loss', 0, 0);
    expect(typeof meal).toBe('object');
    expect(typeof meal.name).toBe('string');
    expect(meal.calories).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx jest tests/engine/meal-composer-v3.test.js --no-coverage
```
Expected: FAIL — `deriveWeeklyDietPattern` is not exported; `getMeals` returns string.

- [ ] **Step 3: Update `server/engine/meal-composer.js`**

**3a.** Add `deriveWeeklyDietPattern` function before the `module.exports` block:

```js
const DAYS_OF_WEEK = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

/**
 * Returns an object keyed by day name with the effective diet type for that day.
 * Non-veg and eggetarian users can specify which days they eat non-veg/eggs via
 * nonVegDays / eggDays arrays. On other days, vegetarian meals are served.
 *
 * @param {object} profile - { dietType, nonVegDays, eggDays }
 * @returns {Object<string, string>}  e.g. { Monday: 'vegetarian', Saturday: 'non-vegetarian', ... }
 */
function deriveWeeklyDietPattern(profile) {
  if (!profile) return Object.fromEntries(DAYS_OF_WEEK.map(d => [d, 'vegetarian']));

  const base = profile.dietType || 'vegetarian';

  // Strict diets apply every day
  if (base === 'vegetarian' || base === 'vegan') {
    return Object.fromEntries(DAYS_OF_WEEK.map(d => [d, base]));
  }

  if (base === 'non-vegetarian') {
    const nonVegDays = profile.nonVegDays || [];
    // No days configured → every day is non-veg (backward compat)
    if (nonVegDays.length === 0) {
      return Object.fromEntries(DAYS_OF_WEEK.map(d => [d, 'non-vegetarian']));
    }
    const daySet = new Set(nonVegDays);
    return Object.fromEntries(DAYS_OF_WEEK.map(d => [d, daySet.has(d) ? 'non-vegetarian' : 'vegetarian']));
  }

  if (base === 'eggetarian') {
    const eggDays = profile.eggDays || [];
    if (eggDays.length === 0) {
      return Object.fromEntries(DAYS_OF_WEEK.map(d => [d, 'eggetarian']));
    }
    const daySet = new Set(eggDays);
    return Object.fromEntries(DAYS_OF_WEEK.map(d => [d, daySet.has(d) ? 'eggetarian' : 'vegetarian']));
  }

  return Object.fromEntries(DAYS_OF_WEEK.map(d => [d, base]));
}
```

**3b.** In `getMeals`, add `dietTypeOverride` parameter and use it when resolving the pool:

```js
function getMeals(profile, mealType, goal, weekIndex, dayIndex, dietTypeOverride) {
  const effectiveDiet = dietTypeOverride || deriveEffectiveDiet(profile);
  const cuisine  = resolveCuisine(profile, weekIndex);
  const poolKey  = resolvePool(effectiveDiet);
  const pool     = cuisine[mealType][poolKey];
  // ... rest unchanged ...
```

**3c.** Update `module.exports`:

```js
module.exports = {
  getMeals,
  activeConditions,
  deriveEffectiveDiet,
  deriveWeeklyDietPattern,
  normalizeFoodTokens,
  hashSeed,
  getRotationOffset,
};
```

- [ ] **Step 4: Fix existing meal-composer.test.js string assertions**

The existing tests do `expect(typeof result).toBe('string')` and `expect(result).not.toMatch(...)`. These must change to use `.name`:

In `tests/engine/meal-composer.test.js`, find every instance of:
- `expect(typeof result).toBe('string')` → `expect(typeof result.name).toBe('string')`
- `expect(typeof ...).toBe('string')` for meal return values → check `.name`
- `expect(meal).not.toMatch(...)` → `expect(meal.name).not.toMatch(...)`
- `expect(result.length).toBeGreaterThan(0)` → `expect(result.name.length).toBeGreaterThan(0)`

Also in `tests/engine/meal-rotation.test.js` and `tests/engine/meal-composer-v2.test.js` — same substitution for any assertion on raw meal return value.

Run this to find all affected assertions:
```bash
grep -n "toBe('string')\|toMatch\|result\.length\|meal\)" tests/engine/meal-composer.test.js tests/engine/meal-rotation.test.js tests/engine/meal-composer-v2.test.js
```
Update each relevant line.

- [ ] **Step 5: Run all meal-composer tests**

```bash
npx jest tests/engine/meal-composer.test.js tests/engine/meal-composer-v2.test.js tests/engine/meal-rotation.test.js tests/engine/meal-composer-v3.test.js --no-coverage
```
Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add server/engine/meal-composer.js tests/engine/meal-composer.test.js tests/engine/meal-composer-v2.test.js tests/engine/meal-rotation.test.js tests/engine/meal-composer-v3.test.js
git commit -m "feat(engine): add deriveWeeklyDietPattern, getMeals returns meal object"
```

---

### Task 7: Update plan-builder.js — use weeklyDietPattern per day, use `.name`

**Files:**
- Modify: `server/engine/plan-builder.js`
- Test: `tests/engine/plan-builder.test.js` (fix `.name` assertions)

- [ ] **Step 1: Write failing test**

In `tests/engine/plan-builder.test.js`, add:

```js
describe('buildDietPlan weekday diet types', () => {
  test('non-veg user with nonVegDays gets non-veg only on specified days', () => {
    const profile = {
      dietType: 'non-vegetarian',
      cuisinePreference: 'south-indian',
      nonVegDays: ['Saturday', 'Sunday'],
      healthConditions: []
    };
    const plan = buildDietPlan(profile, 'weight-loss');
    const week1 = plan[0].weeks[0].weekdays;
    const saturday = week1.find(d => d.day === 'Saturday');
    const monday   = week1.find(d => d.day === 'Monday');
    // Saturday should serve non-veg
    const satMeatKeyword = /chicken|fish|prawn|mutton|beef|pork|lamb/i;
    expect(saturday.dinner.name).toMatch(satMeatKeyword);
    // Monday should serve vegetarian
    expect(monday.dinner.name).not.toMatch(satMeatKeyword);
  });

  test('meal objects have name and calories fields', () => {
    const profile = {
      dietType: 'vegetarian',
      cuisinePreference: 'south-indian',
      healthConditions: []
    };
    const plan = buildDietPlan(profile, 'weight-loss');
    const day = plan[0].weeks[0].weekdays[0];
    expect(typeof day.breakfast.name).toBe('string');
    expect(typeof day.breakfast.calories).toBe('number');
    expect(typeof day.lunch.name).toBe('string');
    expect(typeof day.dinner.name).toBe('string');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest tests/engine/plan-builder.test.js --testNamePattern="weekday diet" --no-coverage
```
Expected: FAIL.

- [ ] **Step 3: Update `server/engine/plan-builder.js`**

**3a.** Change the import at top of file:

```js
const { getMeals, deriveEffectiveDiet, deriveWeeklyDietPattern, hashSeed } = require('./meal-composer');
```

**3b.** Inside `buildDietPlan`, change the weekday mapping block (around line 592):

```js
// Compute weekly diet pattern once per week
const weeklyDietPattern = deriveWeeklyDietPattern(profile);

return {
  weekLabel: `Week ${weekIdx + 1}`,
  weekdays: DAYS.map((day, dayIndex) => ({
    day,
    dietType: weeklyDietPattern[day],
    breakfast: getMeals(profile, 'breakfast', goal, globalWeekIndex, dayIndex, weeklyDietPattern[day]),
    lunch:     getMeals(profile, 'lunch',     goal, globalWeekIndex, dayIndex, weeklyDietPattern[day]),
    snack:     getMeals(profile, 'snack',     goal, globalWeekIndex, dayIndex, weeklyDietPattern[day]),
    dinner:    getMeals(profile, 'dinner',    goal, globalWeekIndex, dayIndex, weeklyDietPattern[day]),
  })),
};
```

- [ ] **Step 4: Fix existing plan-builder tests that read meal as string**

In `tests/engine/plan-builder.test.js`, find assertions like `weekdays[0].breakfast` expecting a string and add `.name`:

```bash
grep -n "\.breakfast\|\.lunch\|\.dinner\|\.snack" tests/engine/plan-builder.test.js | head -30
```
Update assertions: `weekdays[0].breakfast` → `weekdays[0].breakfast.name`
Any `.not.toMatch(keyword)` on meals → `.breakfast.name.not.toMatch(keyword)`

Run: `npx jest tests/engine/plan-builder.test.js --no-coverage`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add server/engine/plan-builder.js tests/engine/plan-builder.test.js
git commit -m "feat(engine): plan-builder uses weeklyDietPattern per day, meal objects"
```

---

### Task 8: Update diet.js frontend — color-coded dots on day tabs

**Files:**
- Modify: `public/js/diet.js`

The diet plan API response now includes `dietType` per weekday. Render a dot indicator on each tab.

- [ ] **Step 1: Locate the day tab render loop in `public/js/diet.js`**

```bash
grep -n "day-tab\|btn.className\|day\.day" /Users/kkondoju/projects/health-dashboard/public/js/diet.js
```

- [ ] **Step 2: Add the dot function and update the tab render**

At the top of the `renderDietTabs` function (or equivalent), add:

```js
function dietDot(dietType) {
  if (dietType === 'non-vegetarian') return '<span class="diet-dot diet-dot--nonveg" title="Non-veg day">🔴</span>';
  if (dietType === 'eggetarian')     return '<span class="diet-dot diet-dot--egg"    title="Egg day">🟠</span>';
  return '<span class="diet-dot diet-dot--veg" title="Veg day">🟢</span>';
}
```

In the tab creation loop, change:
```js
btn.textContent = d.day.slice(0, 3);
```
to:
```js
btn.innerHTML = d.day.slice(0, 3) + ' ' + dietDot(d.dietType || 'vegetarian');
```

- [ ] **Step 3: Add CSS for diet dots**

In `public/index.html` `<style>` block (or linked CSS), add:

```css
.diet-dot { font-size: 0.65rem; vertical-align: middle; }
```

- [ ] **Step 4: Manual verification**

Start the app (`node server.js` or `npm start`) and view the diet tab. Each day tab should show a 🟢🟠🔴 dot matching its diet type.

- [ ] **Step 5: Commit**

```bash
git add public/js/diet.js public/index.html
git commit -m "feat(ui): diet day tabs show color-coded diet type dot"
```

---

### Task 9: Onboarding — add day-picker chips for non-veg/egg days

**Files:**
- Modify: `public/onboarding.html`

- [ ] **Step 1: Add day-picker HTML after the diet radio group in step-3**

In `public/onboarding.html`, after the `rg-diet` radio-group `</div>` and before the step-3 `btn-row`, add:

```html
<!-- Hybrid day picker — shown only for non-veg or eggetarian -->
<div class="form-group" id="day-picker-group" style="display:none">
  <label id="day-picker-label">Which days do you eat non-veg?</label>
  <p class="hint" style="margin-bottom:8px">Vegetarian meals will be planned on other days.</p>
  <div class="day-chip-group" id="dg-hybrid-days">
    <button type="button" class="day-chip" data-day="Monday">Mon</button>
    <button type="button" class="day-chip" data-day="Tuesday">Tue</button>
    <button type="button" class="day-chip" data-day="Wednesday">Wed</button>
    <button type="button" class="day-chip" data-day="Thursday">Thu</button>
    <button type="button" class="day-chip" data-day="Friday">Fri</button>
    <button type="button" class="day-chip" data-day="Saturday">Sat</button>
    <button type="button" class="day-chip" data-day="Sunday">Sun</button>
  </div>
  <p class="hint" style="margin-top:6px">Leave all unselected for a full non-veg plan.</p>
</div>
```

- [ ] **Step 2: Add CSS for day chips**

In the onboarding `<style>` block, add:

```css
.day-chip-group { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.day-chip {
  padding: 8px 14px; border: 1.5px solid #e2e8f0; border-radius: 20px;
  background: #fff; font-family: inherit; font-size: .84rem; font-weight: 500;
  color: #4a5568; cursor: pointer; transition: .15s;
}
.day-chip.selected { border-color: #1b4332; background: #d1fae5; color: #1b4332; font-weight: 600; }
```

- [ ] **Step 3: Add JS to show/hide day-picker and handle chip selection**

In the onboarding `<script>`, add a function and wire it to diet radio changes.

Find the `selectRadio` function call in onboarding and add a listener:

```js
function onDietChange(value) {
  const group = document.getElementById('day-picker-group');
  const label = document.getElementById('day-picker-label');
  if (value === 'non-vegetarian') {
    group.style.display = 'block';
    label.textContent = 'Which days do you eat non-veg?';
  } else if (value === 'eggetarian') {
    group.style.display = 'block';
    label.textContent = 'Which days do you eat eggs?';
  } else {
    group.style.display = 'none';
    // Clear all chip selections
    document.querySelectorAll('.day-chip').forEach(c => c.classList.remove('selected'));
  }
}

document.querySelectorAll('.day-chip').forEach(chip => {
  chip.addEventListener('click', function() {
    this.classList.toggle('selected');
  });
});
```

Find the `selectRadio('rg-diet', ...)` calls in the existing onboarding.html radio click handlers and add `onDietChange(value)` call.

- [ ] **Step 4: Include hybrid day data in profile submission**

In the onboarding profile submission JS (around the `dietType: checkedRadio('diet')` line), add:

```js
const dietType = checkedRadio('diet');
const selectedDays = Array.from(document.querySelectorAll('.day-chip.selected')).map(c => c.dataset.day);
// ...
dietType,
nonVegDays: dietType === 'non-vegetarian' ? selectedDays : [],
eggDays:    dietType === 'eggetarian'     ? selectedDays : [],
```

- [ ] **Step 5: Commit**

```bash
git add public/onboarding.html
git commit -m "feat(onboarding): add day-picker chips for hybrid non-veg/egg diet pattern"
```

---

### Task 10: Tracker API routes

**Files:**
- Create: `routes/tracker.js`
- Test: `tests/routes/tracker.test.js`
- Modify: `server.js` (register route)

- [ ] **Step 1: Write the failing route tests**

Create `tests/routes/tracker.test.js`:

```js
'use strict';
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const HealthLog = require('../models/HealthLog');

let agent;
let userId;
const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
})();

beforeAll(async () => {
  agent = request.agent(app);
  // Register + login
  const reg = await agent.post('/api/auth/register')
    .send({ name: 'TrackerUser', email: 'tracker@test.com', password: 'Test1234!' });
  userId = reg.body.userId || reg.body.user?._id;
  await User.findByIdAndUpdate(userId, { isApproved: true, profileComplete: true,
    'profile.dietType': 'vegetarian', 'profile.dailyCalorieTarget': 2100 });
  await agent.post('/api/auth/login').send({ email: 'tracker@test.com', password: 'Test1234!' });
});

afterAll(async () => {
  await User.deleteMany({ email: 'tracker@test.com' });
  await HealthLog.deleteMany({ userId });
});

describe('POST /api/tracker/meal', () => {
  test('logs a meal entry and returns updated calorie totals', async () => {
    const res = await agent.post('/api/tracker/meal').send({
      date: today,
      mealType: 'breakfast',
      recipeName: 'Idli with Sambar',
      calories: 220,
      proteinG: 8,
      carbsG: 40,
      fatG: 3,
      fromPlan: true
    });
    expect(res.status).toBe(200);
    expect(res.body.totalCalories).toBe(220);
    expect(res.body.meals.length).toBe(1);
  });

  test('second meal adds to totals', async () => {
    const res = await agent.post('/api/tracker/meal').send({
      date: today,
      mealType: 'lunch',
      recipeName: 'Sambar Rice',
      calories: 380,
      proteinG: 12,
      carbsG: 68,
      fatG: 8,
      fromPlan: false
    });
    expect(res.status).toBe(200);
    expect(res.body.totalCalories).toBe(600);
  });
});

describe('GET /api/tracker/today', () => {
  test('returns today log with calorie totals and macro breakdown', async () => {
    const res = await agent.get('/api/tracker/today');
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(today);
    expect(typeof res.body.totalCalories).toBe('number');
    expect(typeof res.body.calorieTarget).toBe('number');
    expect(Array.isArray(res.body.meals)).toBe(true);
    expect(typeof res.body.macros).toBe('object');
    expect(typeof res.body.macros.proteinG).toBe('number');
  });
});

describe('PATCH /api/tracker/steps', () => {
  test('sets step count for today', async () => {
    const res = await agent.patch('/api/tracker/steps').send({ date: today, stepCount: 7450 });
    expect(res.status).toBe(200);
    expect(res.body.stepCount).toBe(7450);
  });
});

describe('DELETE /api/tracker/meal/:mealIndex', () => {
  test('removes a meal entry by index', async () => {
    const res = await agent.delete(`/api/tracker/meal/0?date=${today}`);
    expect(res.status).toBe(200);
    expect(res.body.meals.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx jest tests/routes/tracker.test.js --no-coverage
```
Expected: FAIL — route does not exist.

- [ ] **Step 3: Create `routes/tracker.js`**

```js
'use strict';
const express = require('express');
const HealthLog = require('../models/HealthLog');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');

const router = express.Router();
router.use(authenticate, requireProfile);

/**
 * Returns YYYY-MM-DD string using local calendar date (avoids UTC midnight bug).
 * Called server-side to set a default when client omits date.
 */
function localDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function computeTotals(meals) {
  return meals.reduce((acc, m) => {
    acc.totalCalories += m.calories || 0;
    acc.proteinG  += m.proteinG  || 0;
    acc.carbsG    += m.carbsG    || 0;
    acc.fatG      += m.fatG      || 0;
    return acc;
  }, { totalCalories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
}

// GET /api/tracker/today
router.get('/today', async (req, res) => {
  try {
    const date = localDateString();
    const log = await HealthLog.findOne({ userId: req.user._id, date }).lean();
    const meals = log?.meals || [];
    const totals = computeTotals(meals);
    const calorieTarget = req.user.profile?.dailyCalorieTarget || estimateBMR(req.user.profile);
    res.json({
      date,
      meals,
      stepCount: log?.stepCount || 0,
      stepGoal: req.user.profile?.stepGoal || 8000,
      totalCalories: totals.totalCalories,
      calorieTarget,
      macros: { proteinG: totals.proteinG, carbsG: totals.carbsG, fatG: totals.fatG },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/tracker/meal
router.post('/meal', async (req, res) => {
  try {
    const { date, mealType, recipeName, calories = 0, proteinG = 0, carbsG = 0, fatG = 0, fromPlan = false } = req.body;
    const logDate = date || localDateString();
    const entry = { mealType: mealType || 'custom', recipeName, calories, proteinG, carbsG, fatG, fromPlan };
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user._id, date: logDate },
      { $push: { meals: entry } },
      { upsert: true, new: true }
    );
    const totals = computeTotals(log.meals);
    res.json({ meals: log.meals, ...totals });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/tracker/meal/:mealIndex?date=YYYY-MM-DD
router.delete('/meal/:mealIndex', async (req, res) => {
  try {
    const mealIndex = parseInt(req.params.mealIndex, 10);
    const date = req.query.date || localDateString();
    const log = await HealthLog.findOne({ userId: req.user._id, date });
    if (!log) return res.status(404).json({ error: 'No log for this date' });
    if (mealIndex < 0 || mealIndex >= log.meals.length) return res.status(400).json({ error: 'Invalid meal index' });
    log.meals.splice(mealIndex, 1);
    await log.save();
    const totals = computeTotals(log.meals);
    res.json({ meals: log.meals, ...totals });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/tracker/steps
router.patch('/steps', async (req, res) => {
  try {
    const { date, stepCount } = req.body;
    const logDate = date || localDateString();
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user._id, date: logDate },
      { $set: { stepCount: stepCount || 0 } },
      { upsert: true, new: true }
    );
    res.json({ date: logDate, stepCount: log.stepCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * Mifflin-St Jeor BMR estimate when no explicit calorie target is set.
 * Returns a round number with "~" label handled in the UI.
 * @param {object} profile
 * @returns {number}
 */
function estimateBMR(profile) {
  if (!profile) return 2000;
  const w = profile.currentWeightKg || profile.startWeightKg || 70;
  const h = profile.heightCm || 165;
  const a = profile.age || 30;
  const isMale = profile.sex !== 'female';
  const bmr = isMale
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161;
  return Math.round(bmr * 1.4); // sedentary TDEE multiplier
}

module.exports = router;
```

- [ ] **Step 4: Register in `server.js`**

In `server.js`, after existing route registrations, add:

```js
app.use('/api/tracker', require('./routes/tracker'));
```

- [ ] **Step 5: Run tests**

```bash
npx jest tests/routes/tracker.test.js --no-coverage
```
Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add routes/tracker.js server.js tests/routes/tracker.test.js
git commit -m "feat(api): add /api/tracker routes for meal logging and steps tracking"
```

---

### Task 11: Add `/api/logs/today` endpoint for dashboard

**Files:**
- Modify: `routes/logs.js` (add GET /today)
- Test: inline with tracker test or existing route tests

- [ ] **Step 1: Add the endpoint to `routes/logs.js`**

Find the existing `router.get` declarations in `routes/logs.js` and add before the existing date-based GET:

```js
// GET /api/logs/today — returns today's log + plan context for dashboard
router.get('/today', async (req, res) => {
  try {
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const log = await HealthLog.findOne({ userId: req.user._id, date }).lean();
    const profile = req.user.profile || {};
    const meals = log?.meals || [];
    const totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
    const calorieTarget = profile.dailyCalorieTarget || null;

    res.json({
      date,
      waterIntake: log?.waterIntake || 0,
      waterGoalL: profile.waterGoalL || 2.5,
      stepCount: log?.stepCount || 0,
      stepGoal: profile.stepGoal || 8000,
      totalCalories,
      calorieTarget,
      completedWorkout: log?.completedWorkout || false,
      moodScore: log?.moodScore || null,
      weight: log?.weight || null,
      meals,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
```

- [ ] **Step 2: Verify no test regressions**

```bash
npx jest tests/routes/ --no-coverage
```
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add routes/logs.js
git commit -m "feat(api): add GET /api/logs/today for dashboard live data"
```

---

### Task 12: Build tracker.html + tracker.js

**Files:**
- Create: `public/tracker.html`
- Create: `public/js/tracker.js`
- Modify: `public/js/bottom-nav.js` (add tracker to PAGE_NAV)

- [ ] **Step 1: Create `public/tracker.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Praana — Tracker</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:"Inter",sans-serif;background:#f0f4f0;min-height:100vh;padding-bottom:80px}
    .page-header{background:#1b4332;color:#fff;padding:20px 20px 16px;display:flex;align-items:center;gap:12px}
    .page-header h1{font-size:1.1rem;font-weight:700}
    .back-btn{background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;padding:0}
    /* Tab bar */
    .tracker-tabs{display:flex;background:#fff;border-bottom:1.5px solid #e2e8f0}
    .tracker-tab{flex:1;padding:14px;text-align:center;font-size:.88rem;font-weight:600;color:#718096;cursor:pointer;border-bottom:3px solid transparent}
    .tracker-tab.active{color:#1b4332;border-bottom-color:#1b4332}
    /* Calorie summary ring */
    .calorie-card{background:#fff;margin:16px;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .calorie-ring-row{display:flex;align-items:center;gap:20px}
    .ring-wrap{position:relative;width:100px;height:100px;flex-shrink:0}
    .ring-wrap svg{transform:rotate(-90deg)}
    .ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .ring-kcal{font-size:1.2rem;font-weight:800;color:#1b4332}
    .ring-label{font-size:.68rem;color:#718096}
    .macro-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:16px}
    .macro-cell{text-align:center;padding:10px 6px;background:#f8fffe;border-radius:10px}
    .macro-val{font-size:1rem;font-weight:700;color:#1b4332}
    .macro-name{font-size:.72rem;color:#718096}
    /* Meal list */
    .section-title{font-size:.82rem;font-weight:700;color:#4a5568;padding:16px 16px 8px;text-transform:uppercase;letter-spacing:.04em}
    .meal-card{background:#fff;margin:0 16px 10px;border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 4px rgba(0,0,0,.05)}
    .meal-name{font-size:.9rem;font-weight:600;color:#1a1a2e}
    .meal-meta{font-size:.78rem;color:#718096}
    .meal-kcal{font-size:.9rem;font-weight:700;color:#1b4332}
    .meal-del{background:none;border:none;color:#e53e3e;font-size:1rem;cursor:pointer;padding:4px}
    /* Add meal button */
    .add-meal-btn{display:block;width:calc(100% - 32px);margin:4px 16px 16px;padding:14px;background:#1b4332;color:#fff;border:none;border-radius:12px;font-family:inherit;font-size:.92rem;font-weight:600;cursor:pointer}
    /* Steps */
    .steps-card{background:#fff;margin:16px;border-radius:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .steps-big{font-size:2.4rem;font-weight:800;color:#1b4332;text-align:center}
    .steps-goal{font-size:.84rem;color:#718096;text-align:center;margin-top:4px}
    .steps-bar-wrap{margin:16px 0;height:10px;background:#e2e8f0;border-radius:5px;overflow:hidden}
    .steps-bar{height:100%;background:#40916c;border-radius:5px;transition:width .4s ease}
    .steps-input-row{display:flex;gap:10px;margin-top:16px}
    .steps-input{flex:1;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:.9rem}
    .steps-save-btn{padding:10px 20px;background:#1b4332;color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:600;cursor:pointer}
    /* Add meal modal */
    .modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;align-items:flex-end;justify-content:center}
    .modal-overlay.open{display:flex}
    .modal-sheet{background:#fff;border-radius:20px 20px 0 0;padding:24px 20px 32px;width:100%;max-width:520px}
    .modal-title{font-size:1.05rem;font-weight:700;color:#1b4332;margin-bottom:16px}
    .modal-field{margin-bottom:14px}
    .modal-field label{display:block;font-size:.8rem;font-weight:600;color:#4a5568;margin-bottom:5px}
    .modal-field input,.modal-field select{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:.9rem}
    .modal-actions{display:flex;gap:10px;margin-top:4px}
    .modal-cancel{flex:1;padding:12px;background:#f7fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:.9rem;cursor:pointer}
    .modal-save{flex:2;padding:12px;background:#1b4332;color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:600;cursor:pointer}
    /* Toast */
    .toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:10px 20px;border-radius:20px;font-size:.84rem;z-index:300;opacity:0;transition:opacity .2s;pointer-events:none}
    .toast.show{opacity:1}
  </style>
</head>
<body>
  <div class="page-header">
    <button class="back-btn" onclick="history.back()">←</button>
    <h1>Calorie &amp; Steps Tracker</h1>
  </div>

  <div class="tracker-tabs">
    <div class="tracker-tab active" data-tab="calories" onclick="switchTab('calories', this)">🍽 Calories</div>
    <div class="tracker-tab" data-tab="steps" onclick="switchTab('steps', this)">👣 Steps</div>
  </div>

  <!-- CALORIES TAB -->
  <div id="tab-calories">
    <div class="calorie-card">
      <div class="calorie-ring-row">
        <div class="ring-wrap">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" stroke-width="10"/>
            <circle id="ring-progress" cx="50" cy="50" r="42" fill="none" stroke="#40916c" stroke-width="10"
              stroke-dasharray="263.9" stroke-dashoffset="263.9" stroke-linecap="round"/>
          </svg>
          <div class="ring-center">
            <span class="ring-kcal" id="ring-consumed">0</span>
            <span class="ring-label">kcal</span>
          </div>
        </div>
        <div style="flex:1">
          <div style="font-size:.84rem;color:#718096">Target</div>
          <div style="font-size:1.1rem;font-weight:700;color:#1a1a2e" id="ring-target">— kcal</div>
          <div style="font-size:.8rem;color:#40916c;margin-top:4px" id="ring-remaining">— remaining</div>
        </div>
      </div>
      <div class="macro-grid">
        <div class="macro-cell"><div class="macro-val" id="macro-p">0g</div><div class="macro-name">Protein</div></div>
        <div class="macro-cell"><div class="macro-val" id="macro-c">0g</div><div class="macro-name">Carbs</div></div>
        <div class="macro-cell"><div class="macro-val" id="macro-f">0g</div><div class="macro-name">Fat</div></div>
      </div>
    </div>

    <div class="section-title">Today's Meals</div>
    <div id="meal-list"></div>
    <button class="add-meal-btn" onclick="openAddMeal()">+ Log a Meal</button>
  </div>

  <!-- STEPS TAB -->
  <div id="tab-steps" style="display:none">
    <div class="steps-card">
      <div class="steps-big" id="steps-count">0</div>
      <div class="steps-goal" id="steps-goal-label">of 8,000 steps</div>
      <div class="steps-bar-wrap"><div class="steps-bar" id="steps-bar" style="width:0%"></div></div>
      <div class="steps-input-row">
        <input class="steps-input" id="steps-input" type="number" placeholder="Enter steps" min="0">
        <button class="steps-save-btn" onclick="saveSteps()">Save</button>
      </div>
    </div>
  </div>

  <!-- Add Meal Modal -->
  <div class="modal-overlay" id="add-meal-modal">
    <div class="modal-sheet">
      <div class="modal-title">Log a Meal</div>
      <div class="modal-field">
        <label>Meal Type</label>
        <select id="am-type">
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="snack">Snack</option>
          <option value="dinner">Dinner</option>
          <option value="custom">Other / Custom</option>
        </select>
      </div>
      <div class="modal-field">
        <label>Food Name</label>
        <input id="am-name" type="text" placeholder="e.g. Idli with Sambar">
      </div>
      <div class="modal-field">
        <label>Calories (kcal)</label>
        <input id="am-cal" type="number" placeholder="e.g. 320" min="0">
      </div>
      <div style="display:flex;gap:10px">
        <div class="modal-field" style="flex:1"><label>Protein (g)</label><input id="am-p" type="number" placeholder="0" min="0"></div>
        <div class="modal-field" style="flex:1"><label>Carbs (g)</label><input id="am-c" type="number" placeholder="0" min="0"></div>
        <div class="modal-field" style="flex:1"><label>Fat (g)</label><input id="am-f" type="number" placeholder="0" min="0"></div>
      </div>
      <div class="modal-actions">
        <button class="modal-cancel" onclick="closeAddMeal()">Cancel</button>
        <button class="modal-save" onclick="submitMeal()">Save Meal</button>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script src="/js/api.js"></script>
  <script src="/js/tracker.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `public/js/tracker.js`**

```js
'use strict';

let todayData = { meals: [], totalCalories: 0, calorieTarget: 2000, macros: {}, stepCount: 0, stepGoal: 8000 };

function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

async function loadToday() {
  const { ok, data } = await apiFetch('/api/tracker/today');
  if (!ok) return;
  todayData = data;
  renderCalories();
  renderSteps();
}

function renderCalories() {
  const { totalCalories, calorieTarget, meals, macros } = todayData;
  document.getElementById('ring-consumed').textContent = totalCalories;
  document.getElementById('ring-target').textContent = (calorieTarget ? `${calorieTarget} kcal` : '~ kcal');
  const remaining = calorieTarget ? Math.max(0, calorieTarget - totalCalories) : '—';
  document.getElementById('ring-remaining').textContent = typeof remaining === 'number' ? `${remaining} remaining` : '—';

  // Update ring SVG progress
  const CIRCUMFERENCE = 263.9;
  const pct = calorieTarget ? Math.min(1, totalCalories / calorieTarget) : 0;
  document.getElementById('ring-progress').style.strokeDashoffset = CIRCUMFERENCE * (1 - pct);

  document.getElementById('macro-p').textContent = `${Math.round(macros?.proteinG || 0)}g`;
  document.getElementById('macro-c').textContent = `${Math.round(macros?.carbsG  || 0)}g`;
  document.getElementById('macro-f').textContent = `${Math.round(macros?.fatG    || 0)}g`;

  renderMealList(meals);
}

function renderMealList(meals) {
  const container = document.getElementById('meal-list');
  if (!meals || meals.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#a0aec0;padding:24px 0;font-size:.88rem">No meals logged yet</p>';
    return;
  }
  container.innerHTML = meals.map((m, i) => `
    <div class="meal-card">
      <div>
        <div class="meal-name">${m.recipeName || 'Unknown'}</div>
        <div class="meal-meta">${capitalize(m.mealType || '')}${m.fromPlan ? ' · from plan' : ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="meal-kcal">~${m.calories} kcal</span>
        <button class="meal-del" onclick="deleteMeal(${i})" title="Remove">✕</button>
      </div>
    </div>
  `).join('');
}

function renderSteps() {
  const { stepCount, stepGoal } = todayData;
  document.getElementById('steps-count').textContent = stepCount.toLocaleString('en-IN');
  document.getElementById('steps-goal-label').textContent = `of ${(stepGoal || 8000).toLocaleString('en-IN')} steps`;
  const pct = stepGoal ? Math.min(100, Math.round(stepCount / stepGoal * 100)) : 0;
  document.getElementById('steps-bar').style.width = pct + '%';
  document.getElementById('steps-input').value = stepCount || '';
}

function switchTab(tab, el) {
  document.querySelectorAll('.tracker-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-calories').style.display = tab === 'calories' ? 'block' : 'none';
  document.getElementById('tab-steps').style.display    = tab === 'steps'    ? 'block' : 'none';
}

function openAddMeal()  { document.getElementById('add-meal-modal').classList.add('open'); }
function closeAddMeal() { document.getElementById('add-meal-modal').classList.remove('open'); }

async function submitMeal() {
  const name = document.getElementById('am-name').value.trim();
  const cal  = parseInt(document.getElementById('am-cal').value, 10) || 0;
  if (!name) { showToast('Please enter a food name'); return; }

  const { ok, data } = await apiFetch('/api/tracker/meal', {
    method: 'POST',
    body: {
      date: localDateString(),
      mealType:   document.getElementById('am-type').value,
      recipeName: name,
      calories:   cal,
      proteinG:   parseInt(document.getElementById('am-p').value, 10) || 0,
      carbsG:     parseInt(document.getElementById('am-c').value, 10) || 0,
      fatG:       parseInt(document.getElementById('am-f').value, 10) || 0,
      fromPlan:   false,
    }
  });

  if (ok) {
    todayData.meals = data.meals;
    todayData.totalCalories = data.totalCalories;
    todayData.macros = { proteinG: data.proteinG, carbsG: data.carbsG, fatG: data.fatG };
    renderCalories();
    closeAddMeal();
    showToast('Meal logged ✓');
    // Reset fields
    ['am-name','am-cal','am-p','am-c','am-f'].forEach(id => document.getElementById(id).value = '');
  }
}

async function deleteMeal(index) {
  const { ok, data } = await apiFetch(`/api/tracker/meal/${index}?date=${localDateString()}`, { method: 'DELETE' });
  if (ok) {
    todayData.meals = data.meals;
    todayData.totalCalories = data.totalCalories;
    todayData.macros = { proteinG: data.proteinG, carbsG: data.carbsG, fatG: data.fatG };
    renderCalories();
    showToast('Meal removed');
  }
}

async function saveSteps() {
  const val = parseInt(document.getElementById('steps-input').value, 10);
  if (isNaN(val) || val < 0) { showToast('Enter a valid step count'); return; }
  const { ok, data } = await apiFetch('/api/tracker/steps', {
    method: 'PATCH',
    body: { date: localDateString(), stepCount: val }
  });
  if (ok) {
    todayData.stepCount = data.stepCount;
    renderSteps();
    showToast('Steps saved ✓');
  }
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

document.addEventListener('DOMContentLoaded', loadToday);
```

- [ ] **Step 3: Update `public/js/bottom-nav.js`**

Change the `PAGE_NAV` object:

```js
const PAGE_NAV = {
  settings: '/settings.html',
  tracker:  '/tracker.html',
};
```

Add `tracker` to the HTML bottom nav wherever other items are. In `public/index.html`, in the `<nav class="bottom-nav">` (or equivalent), add a tracker nav item:

```html
<button class="nav-item" data-nav="tracker" aria-label="Tracker">
  <span class="nav-icon">📊</span>
  <span class="nav-label">Track</span>
</button>
```

- [ ] **Step 4: Manual smoke-test**

```bash
node server.js
# Open http://localhost:3000/tracker.html
# Log a meal, verify calorie ring updates
# Enter step count, verify bar fills
# Switch between tabs
```

- [ ] **Step 5: Commit**

```bash
git add public/tracker.html public/js/tracker.js public/js/bottom-nav.js public/index.html
git commit -m "feat(ui): add tracker.html + tracker.js for calorie/steps logging"
```

---

### Task 13: Redesign Today dashboard — dynamic live data

**Files:**
- Modify: `public/js/dashboard.js`
- Modify: `public/index.html` (dashboard section HTML)

The Today dashboard replaces static data with live `/api/logs/today` data. It shows: calorie progress widget, water intake, steps progress, streak, and quick-log shortcuts.

- [ ] **Step 1: Update dashboard HTML section in `public/index.html`**

Find the `<div id="dashboard">` section and replace its inner content with:

```html
<div id="dashboard" class="section">
  <!-- Top greeting -->
  <div class="dashboard-header">
    <div>
      <div class="dash-greeting" id="dash-greeting">Good morning 👋</div>
      <div class="dash-date" id="dash-date"></div>
    </div>
    <div class="dash-streak" id="dash-streak" title="Log streak">🔥 —</div>
  </div>

  <!-- Calorie widget -->
  <div class="dash-card" id="dash-cal-card">
    <div class="dash-card-title">Calories Today</div>
    <div class="dash-cal-row">
      <span class="dash-cal-consumed" id="dash-cal-consumed">—</span>
      <span class="dash-cal-sep"> / </span>
      <span class="dash-cal-target" id="dash-cal-target">— kcal</span>
    </div>
    <div class="dash-progress-bar-wrap">
      <div class="dash-progress-bar" id="dash-cal-bar" style="width:0%"></div>
    </div>
    <div class="dash-card-sub" id="dash-cal-sub">—</div>
  </div>

  <!-- Steps + Water row -->
  <div class="dash-twin-row">
    <div class="dash-card" id="dash-steps-card" onclick="navigateTo('tracker')">
      <div class="dash-card-title">👣 Steps</div>
      <div class="dash-big-num" id="dash-steps">—</div>
      <div class="dash-progress-bar-wrap"><div class="dash-progress-bar dash-progress-bar--blue" id="dash-steps-bar" style="width:0%"></div></div>
      <div class="dash-card-sub" id="dash-steps-sub">of — goal</div>
    </div>
    <div class="dash-card" id="dash-water-card">
      <div class="dash-card-title">💧 Water</div>
      <div class="dash-big-num" id="dash-water">—</div>
      <div class="dash-progress-bar-wrap"><div class="dash-progress-bar dash-progress-bar--cyan" id="dash-water-bar" style="width:0%"></div></div>
      <div class="dash-card-sub" id="dash-water-sub">of — L goal</div>
    </div>
  </div>

  <!-- Quick actions -->
  <div class="dash-quick-row">
    <button class="dash-quick-btn" onclick="navigateTo('tracker')">+ Log Meal</button>
    <button class="dash-quick-btn dash-quick-btn--sec" onclick="navigateTo('diet')">View Diet Plan</button>
  </div>
</div>
```

Add CSS in `<style>` block (or linked CSS):

```css
.dashboard-header{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 20px 8px}
.dash-greeting{font-size:1.1rem;font-weight:700;color:#1b4332}
.dash-date{font-size:.8rem;color:#718096;margin-top:2px}
.dash-streak{font-size:1rem;font-weight:700;color:#ed8936;background:#fff7ed;border-radius:20px;padding:6px 12px}
.dash-card{background:#fff;margin:8px 16px;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.dash-card-title{font-size:.76rem;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}
.dash-cal-row{display:flex;align-items:baseline;gap:4px}
.dash-cal-consumed{font-size:1.8rem;font-weight:800;color:#1b4332}
.dash-cal-sep{font-size:1rem;color:#a0aec0}
.dash-cal-target{font-size:1rem;color:#718096}
.dash-progress-bar-wrap{height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;margin:10px 0 6px}
.dash-progress-bar{height:100%;background:#40916c;border-radius:4px;transition:width .4s ease}
.dash-progress-bar--blue{background:#4299e1}
.dash-progress-bar--cyan{background:#38b2ac}
.dash-card-sub{font-size:.78rem;color:#718096}
.dash-twin-row{display:grid;grid-template-columns:1fr 1fr;gap:0}
.dash-twin-row .dash-card{margin:4px 8px}
.dash-twin-row .dash-card:first-child{margin-left:16px}
.dash-twin-row .dash-card:last-child{margin-right:16px}
.dash-big-num{font-size:1.4rem;font-weight:800;color:#1b4332}
.dash-quick-row{display:flex;gap:10px;padding:12px 16px 0}
.dash-quick-btn{flex:1;padding:12px;background:#1b4332;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.88rem;font-weight:600;cursor:pointer}
.dash-quick-btn--sec{background:#f0fdf4;color:#1b4332;border:1.5px solid #d1fae5}
```

- [ ] **Step 2: Rewrite `public/js/dashboard.js` today-data section**

Find the initialization/load function in `dashboard.js` and add:

```js
async function loadTodayData() {
  const { ok, data } = await apiFetch('/api/logs/today');
  if (!ok) return;

  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const el = document.getElementById('dash-greeting');
  if (el) el.textContent = greet + ' 👋';

  const dateEl = document.getElementById('dash-date');
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // Calories
  const consumed = data.totalCalories || 0;
  const target   = data.calorieTarget;
  const isEstimated = !target;
  const displayTarget = target || 2000;
  const pct = Math.min(100, Math.round(consumed / displayTarget * 100));
  const remaining = Math.max(0, displayTarget - consumed);

  setEl('dash-cal-consumed', consumed);
  setEl('dash-cal-target', `${isEstimated ? '~' : ''}${displayTarget} kcal`);
  const calBar = document.getElementById('dash-cal-bar');
  if (calBar) calBar.style.width = pct + '%';
  setEl('dash-cal-sub', pct >= 100 ? '✓ Target reached' : `${remaining} kcal remaining`);

  // Steps
  const steps = data.stepCount || 0;
  const stepGoal = data.stepGoal || 8000;
  const stepPct = Math.min(100, Math.round(steps / stepGoal * 100));
  setEl('dash-steps', steps.toLocaleString('en-IN'));
  setEl('dash-steps-sub', `of ${stepGoal.toLocaleString('en-IN')} goal`);
  const stBar = document.getElementById('dash-steps-bar');
  if (stBar) stBar.style.width = stepPct + '%';

  // Water
  const water = data.waterIntake || 0;
  const waterGoal = data.waterGoalL || 2.5;
  const waterPct = Math.min(100, Math.round(water / waterGoal * 100));
  setEl('dash-water', `${water}L`);
  setEl('dash-water-sub', `of ${waterGoal}L goal`);
  const wBar = document.getElementById('dash-water-bar');
  if (wBar) wBar.style.width = waterPct + '%';
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function navigateTo(key) {
  if (typeof window.showSection === 'function') window.showSection(key, null);
  if (typeof window.setActiveNavItem === 'function') window.setActiveNavItem(key);
  // For page nav items like tracker
  if (key === 'tracker') window.location.href = '/tracker.html';
}
```

Call `loadTodayData()` inside the dashboard's `DOMContentLoaded` handler or equivalent init.

- [ ] **Step 3: Run full test suite to check no regressions**

```bash
npx jest --no-coverage 2>&1 | tail -20
```
Expected: All pre-existing tests PASS.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/js/dashboard.js
git commit -m "feat(dashboard): redesign Today view with live calorie/steps/water data"
```

---

### Task 14: Fix existing test regressions and run full suite

This task exists to catch any remaining broken assertions after the meal string → object change cascades through all tests.

- [ ] **Step 1: Run full test suite**

```bash
npx jest --no-coverage 2>&1 | grep -E "FAIL|PASS|✕|×"
```

- [ ] **Step 2: Fix any remaining `typeof meal === 'string'` assertions**

For each failing test file, apply the same fix pattern from Task 6 Step 4: `meal.name` instead of `meal` for string comparison.

Common files likely affected:
- `tests/engine/personalization-rules.test.js`
- `tests/engine/grocery-cuisine.test.js`
- `tests/templates/*.test.js`

```bash
grep -rn "typeof.*string\|\.toMatch\|\.toBe('string')" tests/engine/ tests/templates/ | grep -v "\.name"
```
Update each one.

- [ ] **Step 3: Run full suite again**

```bash
npx jest --no-coverage
```
Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "fix(tests): update meal string assertions to use .name after meal object migration"
```

---

## Self-Review Checklist

### Spec coverage scan

| Spec requirement | Task that covers it |
|---|---|
| Hybrid weekly diet patterns with day-picker chips | Task 1, 6, 7, 9 |
| nonVegDays/eggDays saved to profile | Task 1 |
| Meal data with ICMR calorie estimates | Tasks 3, 4, 5 |
| deriveWeeklyDietPattern per-day logic | Task 6 |
| plan-builder uses per-day diet type | Task 7 |
| Color-coded dots on diet day tabs | Task 8 |
| Onboarding day-picker chips | Task 9 |
| Tracker API (meal log, steps, delete) | Task 10 |
| /api/logs/today endpoint | Task 11 |
| tracker.html UI with ring + tabs | Task 12 |
| Today dashboard with live dynamic data | Task 13 |
| Bottom-nav tracker entry | Task 12 |
| Dynamic calorie target (BMR fallback) | Task 10 (estimateBMR) |
| fromPlan boolean on meal entries | Task 2, 10 |
| stepCount on HealthLog | Task 2 |
| 'custom' mealType enum | Task 2 |
| stepGoal on User profile | Task 1 |

### Placeholder scan
No TBDs. All code blocks are complete.

### Type consistency
- `getMeals(profile, mealType, goal, weekIndex, dayIndex, dietTypeOverride)` — 6-param signature used in Task 6 (definition) and Task 7 (call site). ✓
- `deriveWeeklyDietPattern(profile)` → `{ [day: string]: string }` — used in Tasks 6, 7. ✓
- `mealType` / `recipeName` field names — all tasks use existing HealthLog field names. ✓
- `estimateBMR(profile)` — defined in Task 10 (tracker.js), not referenced elsewhere. ✓
