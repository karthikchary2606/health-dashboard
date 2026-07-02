# Personalization Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every plan — diet, workout, recipes — actually use the user's saved preferences (cuisine, diet type, workout style, fitness level, equipment, yoga, days/week) instead of returning the same hardcoded output for all users.

**Architecture:** Six independent tasks executed in order. Tasks 1–4 are server-side (model, route, exercise engine, plan builder). Task 5 is a client-side recipe fix. Task 6 is the onboarding HTML fix. Each task has its own tests, committed independently.

**Tech Stack:** Node.js, Express, Mongoose, Jest + supertest (tests), vanilla JS (frontend)

**Spec:** `docs/superpowers/specs/2026-07-02-personalization-engine-design.md`

---

## File Map

| File | Change |
|------|--------|
| `models/User.js` | Add `sex` field to `profileSchema` |
| `server/routes/profile.js` | Implement `computeMacroTargets()` with Mifflin-St Jeor |
| `server/engine/exercise-composer.js` | Add `YOGA_EXERCISES` data, export `getYogaExercises()` |
| `server/engine/plan-builder.js` | Replace `buildWorkoutPlan()` with profile-driven engine; import `getSuryaNamaskarRounds` + `getYogaExercises`; add guidelines to diet plan |
| `public/js/recipes.js` | Replace `renderRecipes()` to use `getFilteredRecipes()`; add cuisine toggle |
| `public/onboarding.html` | Add step 4 (workout prefs), fix step numbering 3→4→5, wire new fields to `submitProfile()` and `saveDraft()`/`loadDraft()` |
| `tests/engine/plan-builder.test.js` | Add tests for new workout structure, phase labels, Surya Namaskar, yoga days, guidelines |
| `tests/engine/exercise-composer-v3.test.js` | New: tests for `getYogaExercises()` and `getSuryaNamaskarRounds()` |
| `tests/routes/profile-v3.test.js` | New: tests for macro target computation and `sex` field onboarding |

---

## Task 1: Add `sex` field to User model + macro targets

**Files:**
- Modify: `models/User.js`
- Modify: `server/routes/profile.js`
- Create: `tests/routes/profile-v3.test.js`

### Step 1: Write failing tests

Create `tests/routes/profile-v3.test.js`:

```js
'use strict';
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');

beforeAll(async () => { await mongoose.connect(process.env.MONGODB_URI); });
afterEach(async () => { await User.deleteMany({}); });
afterAll(async () => { await mongoose.disconnect(); });

function authHeader(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

async function createUser(overrides = {}) {
  return User.create({
    name: 'Test', email: 'test@test.com',
    passwordHash: 'hashed', isApproved: true,
    profileComplete: true,
    ...overrides
  });
}

test('onboarding saves sex field', async () => {
  const user = await createUser({ profileComplete: false });
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send({
      primaryGoal: 'weight-loss',
      currentWeightKg: 80,
      heightCm: 175,
      age: 30,
      dietType: 'vegetarian',
      fitnessLevel: 'moderately-active',
      sex: 'male'
    });
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  expect(updated.profile.sex).toBe('male');
});

test('onboarding with complete stats computes macro targets', async () => {
  const user = await createUser({ profileComplete: false });
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send({
      primaryGoal: 'weight-loss',
      currentWeightKg: 80,
      heightCm: 175,
      age: 30,
      dietType: 'vegetarian',
      fitnessLevel: 'moderately-active',
      sex: 'male'
    });
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  // Mifflin male: 10*80 + 6.25*175 - 5*30 + 5 = 1800 BMR, x1.55 TDEE = 2790, -300 = 2490
  expect(updated.profile.dailyCalorieTarget).toBeGreaterThan(2000);
  expect(updated.profile.dailyCalorieTarget).toBeLessThan(3500);
  expect(updated.profile.dailyProteinG).toBeGreaterThan(100);
  expect(updated.profile.dailyCarbsG).toBeGreaterThan(100);
  expect(updated.profile.dailyFatG).toBeGreaterThan(40);
});

test('macro targets not set when sex is missing', async () => {
  const user = await createUser({ profileComplete: false });
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send({
      primaryGoal: 'muscle-gain',
      currentWeightKg: 70,
      heightCm: 170,
      age: 25,
      dietType: 'non-vegetarian',
      fitnessLevel: 'lightly-active'
      // no sex field
    });
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  expect(updated.profile.dailyCalorieTarget).toBeUndefined();
});

test('PATCH /api/profile accepts sex field', async () => {
  const user = await createUser({ profile: { primaryGoal: 'weight-loss' } });
  const res = await request(app)
    .patch('/api/profile')
    .set(authHeader(user._id))
    .send({ sex: 'female' });
  expect(res.status).toBe(200);
  expect(res.body.sex).toBe('female');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/kkondoju/projects/health-dashboard
NODE_ENV=test npx jest tests/routes/profile-v3.test.js --forceExit -t "onboarding saves sex" 2>&1 | tail -20
```
Expected: FAIL — `profile.sex` undefined / field not in schema.

- [ ] **Step 3: Add `sex` to `models/User.js` profileSchema**

In `models/User.js`, add after `reviewReminderDays` / `lastReviewedAt`:

```js
  // Gender — used for BMR calculation
  sex: { type: String, enum: ['male', 'female', 'other'] },
```

The full profileSchema block where it goes (after `lastReviewedAt: Date,`):

```js
  // Gender — used for BMR calculation
  sex: { type: String, enum: ['male', 'female', 'other'] },

  // Computed macro targets (set on plan generation)
  dailyCalorieTarget: Number,
  dailyProteinG:      Number,
  dailyCarbsG:        Number,
  dailyFatG:          Number
```

(The macro fields already exist — just add `sex` above them.)

- [ ] **Step 4: Implement `computeMacroTargets()` in `server/routes/profile.js`**

Replace the existing stub function (lines ~22-27):

```js
// Activity multipliers (Mifflin-St Jeor)
const ACTIVITY_MULTIPLIERS = {
  'sedentary':          1.2,
  'lightly-active':     1.375,
  'moderately-active':  1.55,
  'very-active':        1.725,
};

// Goal caloric adjustments
const GOAL_ADJUSTMENTS = {
  'weight-loss':     -300,
  'muscle-gain':     +300,
  'maintenance':      0,
  'general-fitness':  0,
};

function computeMacroTargets(profile) {
  const { sex, age, heightCm, currentWeightKg, fitnessLevel, primaryGoal } = profile;
  if (!sex || !age || !heightCm || !currentWeightKg) return {};

  // Mifflin-St Jeor BMR
  const base = 10 * currentWeightKg + 6.25 * heightCm - 5 * age;
  const bmr  = sex === 'female' ? base - 161 : base + 5; // male/other use +5

  const multiplier = ACTIVITY_MULTIPLIERS[fitnessLevel] || 1.375;
  const tdee       = Math.round(bmr * multiplier);
  const adjustment = GOAL_ADJUSTMENTS[primaryGoal] || 0;
  const calories   = tdee + adjustment;

  // Macro split: 30% protein, 45% carbs, 25% fat (weight-loss / general)
  // muscle-gain: 35% protein, 45% carbs, 20% fat
  const proteinPct = primaryGoal === 'muscle-gain' ? 0.35 : 0.30;
  const carbsPct   = 0.45;
  const fatPct     = 1 - proteinPct - carbsPct;

  return {
    dailyCalorieTarget: calories,
    dailyProteinG:      Math.round((calories * proteinPct) / 4),  // 4 kcal/g
    dailyCarbsG:        Math.round((calories * carbsPct)   / 4),
    dailyFatG:          Math.round((calories * fatPct)     / 9),  // 9 kcal/g
  };
}
```

- [ ] **Step 5: Wire `sex` into onboarding route**

In `server/routes/profile.js`, in the `POST /onboarding` handler, destructure `sex` from `req.body`:

```js
const {
  primaryGoal, currentWeightKg, goalWeightKg, heightCm, age,
  fitnessLevel, religion, languageCommunity, culturalFoodAvoidances,
  healthConditions, medications, secondaryGoals,
  workoutPreferences, workoutDaysPerWeek, workoutTime, yogaStyle,
  foodAllergies, dietType, cuisinePreference, equipmentAvailable,
  sex   // ADD THIS
} = req.body;
```

Add to `partialProfile`:

```js
const partialProfile = {
  primaryGoal, planTemplate: primaryGoal,
  currentWeightKg, startWeightKg: currentWeightKg,
  goalWeightKg, heightCm, age, fitnessLevel, sex,   // add sex
  religion, languageCommunity,
  // ... rest unchanged
};
```

The `computeMacroTargets(partialProfile)` call is already there — it will now return values instead of `{}`.

Also add `sex` to the `allowed` array in `PATCH /` handler:

```js
const allowed = [
  'currentWeightKg', 'goalWeightKg', 'heightCm', 'age', 'dietType', 'sex',  // add sex
  // ... rest unchanged
];
```

Also add `workoutPreferences`, `workoutDaysPerWeek`, `workoutTime`, `yogaStyle` to the destructuring in the `POST /onboarding` handler (already in `allowed` for PATCH but need to be in the onboarding destructure and `partialProfile`):

```js
const partialProfile = {
  // existing fields ...
  sex,
  workoutPreferences: workoutPreferences || [],
  workoutDaysPerWeek, workoutTime, yogaStyle,
  startDate: new Date()
};
```

- [ ] **Step 6: Run tests**

```bash
cd /Users/kkondoju/projects/health-dashboard
NODE_ENV=test npx jest tests/routes/profile-v3.test.js --forceExit 2>&1 | tail -20
```
Expected: 4 tests pass.

- [ ] **Step 7: Run full suite to check regressions**

```bash
cd /Users/kkondoju/projects/health-dashboard
npm test 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
cd /Users/kkondoju/projects/health-dashboard
git add models/User.js server/routes/profile.js tests/routes/profile-v3.test.js
git commit -m "feat: add sex field to profile + compute macro targets via Mifflin-St Jeor

- User.profileSchema gets sex: enum['male','female','other']
- computeMacroTargets() implements Mifflin-St Jeor BMR + activity multiplier
- Returns dailyCalorieTarget, dailyProteinG, dailyCarbsG, dailyFatG
- Macro targets saved on onboarding and usable by macro chart in progress.js
- Onboarding route wires sex + workoutPreferences + workoutDaysPerWeek +
  workoutTime + yogaStyle into partialProfile

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Add yoga exercises + `getYogaExercises()` to exercise-composer

**Files:**
- Modify: `server/engine/exercise-composer.js`
- Create: `tests/engine/exercise-composer-v3.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/engine/exercise-composer-v3.test.js`:

```js
'use strict';
const {
  getYogaExercises,
  getSuryaNamaskarRounds,
} = require('../../server/engine/exercise-composer');

describe('getYogaExercises', () => {
  test('exists and is a function', () => {
    expect(typeof getYogaExercises).toBe('function');
  });

  test('returns array for hatha', () => {
    const result = getYogaExercises('hatha');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns array for vinyasa', () => {
    const result = getYogaExercises('vinyasa');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns array for pranayama-only', () => {
    const result = getYogaExercises('pranayama-only');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('falls back to hatha for unknown type', () => {
    const result = getYogaExercises('unknown-style');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('each exercise has name (string), sets (number), reps (string), note (string), cat (string)', () => {
    ['hatha', 'vinyasa', 'pranayama-only'].forEach(type => {
      getYogaExercises(type).forEach(ex => {
        expect(typeof ex.name).toBe('string');
        expect(typeof ex.sets).toBe('number');
        expect(typeof ex.reps).toBe('string');
        expect(typeof ex.note).toBe('string');
        expect(typeof ex.cat).toBe('string');
      });
    });
  });

  test('hatha and vinyasa return different exercises', () => {
    const hatha = getYogaExercises('hatha').map(e => e.name);
    const vinyasa = getYogaExercises('vinyasa').map(e => e.name);
    expect(hatha).not.toEqual(vinyasa);
  });
});

describe('getSuryaNamaskarRounds', () => {
  test('young fit user gets highest rounds', () => {
    const rounds = getSuryaNamaskarRounds({ age: 25, fitnessLevel: 'very-active' });
    expect(rounds).toBeGreaterThanOrEqual(12);
  });

  test('older sedentary user gets lower rounds', () => {
    const rounds = getSuryaNamaskarRounds({ age: 55, fitnessLevel: 'sedentary' });
    expect(rounds).toBeLessThanOrEqual(8);
  });

  test('returns a number', () => {
    const rounds = getSuryaNamaskarRounds({ age: 30, fitnessLevel: 'moderately-active' });
    expect(typeof rounds).toBe('number');
    expect(rounds).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/kkondoju/projects/health-dashboard
NODE_ENV=test npx jest tests/engine/exercise-composer-v3.test.js --forceExit 2>&1 | tail -15
```
Expected: FAIL — `getYogaExercises is not a function`.

- [ ] **Step 3: Add `YOGA_EXERCISES` data and `getYogaExercises()` to `server/engine/exercise-composer.js`**

Add after the existing `SURYA_ROUNDS` and `getSuryaNamaskarRounds` function (around line 40), before `highestTier`:

```js
const YOGA_EXERCISES = {
  hatha: [
    { name: 'Vrikshasana (Tree Pose)',               sets: 3, reps: '30s hold per side', note: 'Balance and mental focus — arms above head',      cat: 'yoga' },
    { name: 'Virabhadrasana II (Warrior II)',        sets: 3, reps: '45s hold per side', note: 'Hip strength and chest opening',                   cat: 'yoga' },
    { name: 'Setu Bandhasana (Bridge Pose)',         sets: 3, reps: '12 reps',           note: 'Glute activation — squeeze at the top',            cat: 'yoga' },
    { name: 'Paschimottanasana (Forward Fold)',      sets: 3, reps: '30s hold',          note: 'Hamstring and spine stretch — breathe into hold',  cat: 'yoga' },
    { name: 'Shavasana (Corpse Pose)',               sets: 1, reps: '5 min',             note: 'Full-body relaxation — do not skip',               cat: 'yoga' },
  ],
  vinyasa: [
    { name: 'Chaturanga → Up Dog → Down Dog Flow',  sets: 3, reps: '5 rounds',          note: 'Core and upper body — maintain straight spine',    cat: 'yoga' },
    { name: 'Warrior I → II → Reverse Warrior',     sets: 3, reps: 'per side',          note: 'Full-body flow — synchronise breath with movement', cat: 'yoga' },
    { name: 'Utkatasana (Chair Pose)',               sets: 3, reps: '45s hold',          note: 'Thigh and glute strength',                         cat: 'yoga' },
    { name: 'Phalakasana → Vasisthasana (Plank → Side Plank)', sets: 3, reps: '30s each side', note: 'Core stability', cat: 'yoga' },
    { name: 'Shavasana',                            sets: 1, reps: '3 min',             note: 'Recovery — let heart rate settle',                  cat: 'yoga' },
  ],
  'pranayama-only': [
    { name: 'Anulom Vilom (Alternate Nostril)',      sets: 1, reps: '5 min',            note: 'Balance left/right hemisphere. Close right nostril inhale, close left exhale', cat: 'yoga' },
    { name: 'Bhramari (Humming Bee Breath)',         sets: 1, reps: '5 min',            note: 'Index fingers on ears, hum on exhale — reduces anxiety', cat: 'yoga' },
    { name: 'Kapalbhati (Skull-Shining Breath)',     sets: 3, reps: '30 cycles',        note: 'Forceful exhale through nose, passive inhale — energising', cat: 'yoga' },
    { name: 'Uddiyana Bandha (Abdominal Lock)',      sets: 3, reps: '10 contractions',  note: 'Exhale fully, suck abdomen in and up — empty stomach only', cat: 'yoga' },
    { name: 'Shavasana',                            sets: 1, reps: '10 min',            note: 'Deep relaxation — close eyes, no movement',         cat: 'yoga' },
  ],
};

/**
 * Returns the yoga exercise list for the given yoga style.
 * Falls back to hatha for unknown styles.
 *
 * @param {string} yogaType - 'hatha' | 'vinyasa' | 'pranayama-only'
 * @returns {Array<{name, sets, reps, note, cat}>}
 */
function getYogaExercises(yogaType) {
  return YOGA_EXERCISES[yogaType] || YOGA_EXERCISES.hatha;
}
```

Update the `module.exports` at the bottom:

```js
module.exports = { getExercises, getSuryaNamaskarRounds, getYogaExercises };
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/kkondoju/projects/health-dashboard
NODE_ENV=test npx jest tests/engine/exercise-composer-v3.test.js --forceExit 2>&1 | tail -15
```
Expected: all tests pass.

- [ ] **Step 5: Run full suite**

```bash
npm test 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/engine/exercise-composer.js tests/engine/exercise-composer-v3.test.js
git commit -m "feat: add yoga exercise data and getYogaExercises() to exercise-composer

Adds YOGA_EXERCISES (hatha/vinyasa/pranayama-only) with 5 exercises each.
Exports getYogaExercises(yogaType) alongside existing getExercises() and
getSuryaNamaskarRounds(). Falls back to hatha for unknown styles.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Rebuild `buildWorkoutPlan()` + add diet guidelines

**Files:**
- Modify: `server/engine/plan-builder.js`
- Modify: `tests/engine/plan-builder.test.js`

This is the core task. Read the existing `plan-builder.js` carefully before editing.

- [ ] **Step 1: Add new tests to `tests/engine/plan-builder.test.js`**

Append to the existing file (after the last test block):

```js
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

  test('yoga profile: Surya Namaskar is always first exercise', () => {
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
});

// ─── Diet guidelines ──────────────────────────────────────────────────────────

describe('buildDietPlan guidelines', () => {
  test('each month has a non-empty guidelines array', () => {
    const plan = buildDietPlan(vegProfile, 'weight-loss');
    plan.forEach((month, i) => {
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
```

- [ ] **Step 2: Run new tests to verify they fail**

```bash
cd /Users/kkondoju/projects/health-dashboard
NODE_ENV=test npx jest tests/engine/plan-builder.test.js --forceExit 2>&1 | grep -E "PASS|FAIL|✓|✗|×|●" | tail -20
```
Expected: new tests fail, existing tests still pass.

- [ ] **Step 3: Replace `buildWorkoutPlan()` and update `buildDietPlan()` in `server/engine/plan-builder.js`**

At the top of the file, update the imports:

```js
'use strict';

const { getMeals }          = require('./meal-composer');
const { getExercises, getSuryaNamaskarRounds, getYogaExercises } = require('./exercise-composer');
```

Remove the existing `WEEKLY_SCHEDULE` constant entirely.

Add these helper functions (before `buildWorkoutPlan`):

```js
// ─── Phase labels per goal ────────────────────────────────────────────────────

const PHASE_LABELS = {
  'weight-loss': [
    { phaseLabel: 'Foundation Phase',  focus: 'Build habits, establish routine',      note: 'Form over speed. Surya Namaskar every session.' },
    { phaseLabel: 'Foundation Phase',  focus: 'Increase consistency',                  note: 'Track energy and recovery daily.' },
    { phaseLabel: 'Progression Phase', focus: 'Progressive overload begins',           note: 'Add one rep or 0.5kg each week.' },
    { phaseLabel: 'Progression Phase', focus: 'Push intensity moderately',             note: 'Pre-workout snack on training days.' },
    { phaseLabel: 'Peak Phase',        focus: 'Maximum effort, peak performance',      note: 'Protein within 45 min post-workout.' },
    { phaseLabel: 'Peak Phase',        focus: 'Maintain and consolidate gains',        note: 'Reduce refined carbs. Hold the discipline.' },
  ],
  'muscle-gain': [
    { phaseLabel: 'Hypertrophy Foundation', focus: 'Build muscle-mind connection',    note: 'Slow negatives, controlled reps.' },
    { phaseLabel: 'Hypertrophy Foundation', focus: 'Volume accumulation',              note: 'Hit protein target every day.' },
    { phaseLabel: 'Progressive Overload',   focus: 'Increase load weekly',             note: 'Log every lift. Linear progression.' },
    { phaseLabel: 'Progressive Overload',   focus: 'Peak volume block',                note: 'Sleep 8h — muscle grows during recovery.' },
    { phaseLabel: 'Strength Peak',          focus: 'Intensity over volume',            note: 'Lower reps, heavier weight.' },
    { phaseLabel: 'Strength Peak',          focus: 'Test maxes and consolidate',       note: 'Deload week at end of month 6.' },
  ],
  'maintenance': [
    { phaseLabel: 'Stabilize',  focus: 'Re-establish consistent routine',     note: 'Consistency beats perfection.' },
    { phaseLabel: 'Stabilize',  focus: 'Fine-tune habits',                    note: 'Track energy weekly.' },
    { phaseLabel: 'Optimize',   focus: 'Improve weak areas',                  note: 'Add one new challenge per week.' },
    { phaseLabel: 'Optimize',   focus: 'Sustain without burn-out',            note: 'Rest is part of the programme.' },
    { phaseLabel: 'Sustain',    focus: 'Long-term sustainable movement',      note: 'Enjoy the process.' },
    { phaseLabel: 'Sustain',    focus: 'Lifestyle integration',               note: 'Make this permanent.' },
  ],
  'general-fitness': [
    { phaseLabel: 'Establish Routine',    focus: 'Build the habit first',            note: 'Show up even when motivation is low.' },
    { phaseLabel: 'Establish Routine',    focus: 'Add structure',                    note: 'Hydration and sleep matter as much as reps.' },
    { phaseLabel: 'Build Consistency',    focus: 'Progressive challenge',            note: 'Small improvements compound fast.' },
    { phaseLabel: 'Build Consistency',    focus: 'Push past plateaus',               note: 'Try one new exercise per week.' },
    { phaseLabel: 'Advance & Maintain',   focus: 'Higher intensity sessions',        note: 'Form check — video yourself once a month.' },
    { phaseLabel: 'Advance & Maintain',   focus: 'Lifelong fitness foundation',      note: 'You have built something real.' },
  ],
};

// ─── Day slot templates by workoutDaysPerWeek ─────────────────────────────────

const GYM_HOME_SLOTS = {
  3: [
    { day: 'Monday',    muscleGroup: 'full-body', focus: 'Full Body',   duration: '45 min' },
    { day: 'Wednesday', muscleGroup: 'chest',     focus: 'Upper Body',  duration: '45 min' },
    { day: 'Friday',    muscleGroup: 'legs',      focus: 'Lower Body',  duration: '45 min' },
  ],
  4: [
    { day: 'Monday',   muscleGroup: 'legs',      focus: 'Lower Body',   duration: '45 min' },
    { day: 'Tuesday',  muscleGroup: 'chest',     focus: 'Upper Body',   duration: '45 min' },
    { day: 'Thursday', muscleGroup: 'back',      focus: 'Back & Core',  duration: '45 min' },
    { day: 'Friday',   muscleGroup: 'full-body', focus: 'Full Body',    duration: '45 min' },
  ],
  5: [
    { day: 'Monday',    muscleGroup: 'legs',      focus: 'Lower Body',   duration: '45 min' },
    { day: 'Tuesday',   muscleGroup: 'chest',     focus: 'Upper Body',   duration: '45 min' },
    { day: 'Wednesday', muscleGroup: 'back',      focus: 'Back & Core',  duration: '30 min' },
    { day: 'Thursday',  muscleGroup: 'full-body', focus: 'Full Body',    duration: '45 min' },
    { day: 'Friday',    muscleGroup: null,         focus: 'Cardio',      duration: '30 min' },
  ],
  6: [
    { day: 'Monday',    muscleGroup: 'legs',      focus: 'Lower Body',    duration: '45 min' },
    { day: 'Tuesday',   muscleGroup: 'chest',     focus: 'Upper Body',    duration: '45 min' },
    { day: 'Wednesday', muscleGroup: 'back',      focus: 'Back & Core',   duration: '45 min' },
    { day: 'Thursday',  muscleGroup: 'full-body', focus: 'Full Body',     duration: '45 min' },
    { day: 'Friday',    muscleGroup: null,         focus: 'Cardio',       duration: '30 min' },
    { day: 'Saturday',  muscleGroup: 'back',      focus: 'Flexibility',   duration: '30 min' },
  ],
  7: [
    { day: 'Monday',    muscleGroup: 'legs',      focus: 'Lower Body',    duration: '45 min' },
    { day: 'Tuesday',   muscleGroup: 'chest',     focus: 'Upper Body',    duration: '45 min' },
    { day: 'Wednesday', muscleGroup: 'back',      focus: 'Back & Core',   duration: '45 min' },
    { day: 'Thursday',  muscleGroup: 'full-body', focus: 'Full Body',     duration: '45 min' },
    { day: 'Friday',    muscleGroup: null,         focus: 'Cardio',       duration: '30 min' },
    { day: 'Saturday',  muscleGroup: 'back',      focus: 'Flexibility',   duration: '30 min' },
    { day: 'Sunday',    muscleGroup: 'back',      focus: 'Active Recovery', duration: '20 min' },
  ],
};

const YOGA_SLOTS = {
  3: ['Monday','Wednesday','Friday'],
  4: ['Monday','Tuesday','Thursday','Friday'],
  5: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
  6: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  7: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
};

const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function detectWorkoutMode(profile) {
  const prefs = profile.workoutPreferences || [];
  const hasGym  = prefs.includes('gym') ||
                  (profile.equipmentAvailable || []).includes('gym-access');
  const hasYoga = prefs.includes('yoga');
  if (hasGym && hasYoga) return 'hybrid';
  if (hasYoga)           return 'yoga';
  if (hasGym)            return 'gym';
  return 'home'; // default — bodyweight only
}

function suryaEntry(profile, gentle = false) {
  const rounds = getSuryaNamaskarRounds(profile);
  if (gentle) {
    return {
      name: 'Gentle Surya Namaskar (optional)',
      sets: 3,
      reps: '12 poses per round',
      note: 'Active recovery — slow gentle pace only',
      cat: 'yoga'
    };
  }
  return {
    name: `Surya Namaskar — ${rounds} rounds`,
    sets: rounds,
    reps: '12 poses per round',
    note: `Age/fitness-adjusted warm-up. Full-body activation before training.`,
    cat: 'yoga'
  };
}

function yogaDayExercises(profile, dayIndex) {
  const style = profile.yogaStyle;
  let yogaType;
  if (style && style !== 'none' && ['hatha','vinyasa','pranayama-only'].includes(style)) {
    yogaType = style;
  } else {
    // Cycle: hatha → vinyasa → pranayama-only
    const cycle = ['hatha', 'vinyasa', 'pranayama-only'];
    yogaType = cycle[dayIndex % 3];
  }
  return [suryaEntry(profile), ...getYogaExercises(yogaType)];
}

function strengthDayExercises(profile, muscleGroup, goal) {
  if (!muscleGroup) return [suryaEntry(profile)]; // cardio day — just surya
  const exercises = getExercises(profile, muscleGroup, goal);
  return [suryaEntry(profile), ...exercises];
}
```

Replace the existing `buildWorkoutPlan` function:

```js
// ─── buildWorkoutPlan ─────────────────────────────────────────────────────────

function buildWorkoutPlan(profile, goal) {
  const mode        = detectWorkoutMode(profile);
  const daysPerWeek = Math.min(7, Math.max(3, profile.workoutDaysPerWeek || 4));
  const phaseLabels = PHASE_LABELS[goal] || PHASE_LABELS['general-fitness'];

  return Array.from({ length: 6 }, (_, monthIndex) => {
    const { phaseLabel, focus, note } = phaseLabels[monthIndex] || phaseLabels[0];
    const schedule = buildWeekSchedule(profile, goal, mode, daysPerWeek);

    return {
      monthLabel: `Month ${monthIndex + 1}`,
      phaseLabel,
      focus,
      note,
      schedule,
    };
  });
}

function buildWeekSchedule(profile, goal, mode, daysPerWeek) {
  if (mode === 'yoga') {
    return buildYogaSchedule(profile, daysPerWeek);
  }
  if (mode === 'hybrid') {
    return buildHybridSchedule(profile, goal, daysPerWeek);
  }
  // gym or home — same structure, equipment filter handles the difference
  return buildStrengthSchedule(profile, goal, daysPerWeek);
}

function buildStrengthSchedule(profile, goal, daysPerWeek) {
  const slots   = GYM_HOME_SLOTS[daysPerWeek] || GYM_HOME_SLOTS[4];
  const activeSet = new Set(slots.map(s => s.day));

  return ALL_DAYS.map(day => {
    if (!activeSet.has(day)) {
      return {
        day, focus: 'Rest', type: 'rest', duration: '-',
        exercises: [suryaEntry(profile, true)]
      };
    }
    const slot = slots.find(s => s.day === day);
    return {
      day,
      focus:     slot.focus,
      type:      slot.muscleGroup ? 'Strength' : 'Cardio',
      duration:  slot.duration,
      exercises: strengthDayExercises(profile, slot.muscleGroup, goal)
    };
  });
}

function buildYogaSchedule(profile, daysPerWeek) {
  const activeDays = new Set(YOGA_SLOTS[daysPerWeek] || YOGA_SLOTS[4]);
  let yogaDayIndex = 0;

  return ALL_DAYS.map(day => {
    if (!activeDays.has(day)) {
      return {
        day, focus: 'Rest', type: 'rest', duration: '-',
        exercises: [suryaEntry(profile, true)]
      };
    }
    const idx = yogaDayIndex++;
    const style = profile.yogaStyle;
    let yogaType;
    if (style && style !== 'none' && ['hatha','vinyasa','pranayama-only'].includes(style)) {
      yogaType = style;
    } else {
      yogaType = ['hatha','vinyasa','pranayama-only'][idx % 3];
    }
    return {
      day,
      focus:     `Yoga — ${yogaType.charAt(0).toUpperCase() + yogaType.slice(1)}`,
      type:      'Yoga',
      duration:  '45 min',
      exercises: [suryaEntry(profile), ...getYogaExercises(yogaType)]
    };
  });
}

function buildHybridSchedule(profile, goal, daysPerWeek) {
  const activeDays = YOGA_SLOTS[daysPerWeek] || YOGA_SLOTS[4];
  const activeSet  = new Set(activeDays);
  const strengthSlots = (GYM_HOME_SLOTS[Math.ceil(activeDays.length / 2)] || GYM_HOME_SLOTS[3])
    .map(s => s.day);
  let yogaDayIndex = 0;

  return ALL_DAYS.map(day => {
    if (!activeSet.has(day)) {
      return {
        day, focus: 'Rest', type: 'rest', duration: '-',
        exercises: [suryaEntry(profile, true)]
      };
    }
    // Alternate: strength days from strengthSlots, rest → yoga
    if (strengthSlots.includes(day)) {
      const slot = (GYM_HOME_SLOTS[Math.ceil(activeDays.length / 2)] || GYM_HOME_SLOTS[3])
        .find(s => s.day === day);
      return {
        day,
        focus:     slot ? slot.focus : 'Strength',
        type:      'Strength',
        duration:  '45 min',
        exercises: strengthDayExercises(profile, slot ? slot.muscleGroup : 'full-body', goal)
      };
    }
    // Yoga day
    const yogaType = (profile.yogaStyle && profile.yogaStyle !== 'none')
      ? profile.yogaStyle
      : ['hatha','vinyasa','pranayama-only'][yogaDayIndex % 3];
    yogaDayIndex++;
    return {
      day,
      focus:     `Yoga — ${yogaType.charAt(0).toUpperCase() + yogaType.slice(1)}`,
      type:      'Yoga',
      duration:  '45 min',
      exercises: [suryaEntry(profile), ...getYogaExercises(yogaType)]
    };
  });
}
```

- [ ] **Step 4: Add phase guidelines to `buildDietPlan()`**

Add this constant before `buildDietPlan`:

```js
const DIET_GUIDELINES = {
  foundation: [
    'Establish 3 balanced meals + 1 snack per day',
    'Caloric target: −300 kcal deficit (weight-loss) / +300 surplus (muscle-gain) / maintenance (other goals)',
    'Hydration: drink 2.5–3L water daily',
    'Avoid processed foods and sugar-sweetened beverages this month',
  ],
  progression: [
    'Increase protein to support higher training volume (aim for 1.6–2g per kg body weight)',
    'Add a pre-workout snack on training days: banana + tablespoon of nut butter',
    'If energy is low, slightly increase complex carbs (oats, brown rice, sweet potato)',
    'Continue hydration: 3L water on training days',
  ],
  peak: [
    'Protein within 45 minutes post-workout for optimal muscle repair',
    'Reduce refined carbs; prioritise complex carbs and dark leafy greens',
    'If goal weight is reached, shift to maintenance calories',
    'Monitor sleep — inadequate sleep undermines nutrition and performance',
  ],
};

function getMonthGuidelines(monthIndex) {
  if (monthIndex <= 1) return DIET_GUIDELINES.foundation;
  if (monthIndex <= 3) return DIET_GUIDELINES.progression;
  return DIET_GUIDELINES.peak;
}
```

In `buildDietPlan`, `guidelines: []` already exists in the return object. Replace that line:

```js
// Before:
guidelines: [],

// After:
guidelines: getMonthGuidelines(monthIndex),
```

The full updated `buildDietPlan` return shape:

```js
function buildDietPlan(profile, goal) {
  return Array.from({ length: 6 }, (_, monthIndex) => ({
    monthLabel: `Month ${monthIndex + 1}`,
    weeks: Array.from({ length: 4 }, (_, weekIdx) => {
      const globalWeekIndex = monthIndex * 4 + weekIdx;
      return {
        weekLabel: `Week ${weekIdx + 1}`,
        weekdays: DAYS.map((day, dayIndex) => ({
          day,
          breakfast: getMeals(profile, 'breakfast', goal, globalWeekIndex, dayIndex),
          lunch:     getMeals(profile, 'lunch',     goal, globalWeekIndex, dayIndex),
          snack:     getMeals(profile, 'snack',     goal, globalWeekIndex, dayIndex),
          dinner:    getMeals(profile, 'dinner',    goal, globalWeekIndex, dayIndex),
        })),
      };
    }),
    guidelines: getMonthGuidelines(monthIndex),
  }));
}
```

- [ ] **Step 5: Run new and existing tests**

```bash
cd /Users/kkondoju/projects/health-dashboard
NODE_ENV=test npx jest tests/engine/plan-builder.test.js --forceExit 2>&1 | tail -20
```
Expected: all tests pass (existing + new).

- [ ] **Step 6: Run full suite**

```bash
npm test 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/engine/plan-builder.js tests/engine/plan-builder.test.js
git commit -m "feat: rebuild buildWorkoutPlan() with full profile personalization

- detectWorkoutMode(): yoga / gym / home / hybrid from workoutPreferences
- Day slots driven by workoutDaysPerWeek (3-7 days)
- Surya Namaskar always first exercise on every active day (getSuryaNamaskarRounds)
- Yoga mode: hatha/vinyasa/pranayama-only days (yogaStyle or rotating)
- Hybrid mode: alternating strength + yoga days
- phaseLabel, focus, note added to every monthly object (fixes blank banners)
- buildDietPlan: phase guidelines added to every month (foundation/progression/peak)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Fix recipe filtering in `public/js/recipes.js`

**Files:**
- Modify: `public/js/recipes.js`

Note: This is a frontend file — no automated Jest tests. Verify manually by checking that a south-indian vegetarian profile filters recipes correctly.

- [ ] **Step 1: Add `_recipeShowAll` flag and `toggleCuisineFilter()` function**

Near the top of `public/js/recipes.js`, after `let currentRecipeFilter = 'all';`, add:

```js
window._recipeShowAll = false;

function toggleCuisineFilter(btn) {
  window._recipeShowAll = !window._recipeShowAll;
  btn.textContent = window._recipeShowAll ? '🍛 My Cuisine Only' : '🌍 Show All Cuisines';
  renderRecipes(currentRecipeFilter);
}
```

- [ ] **Step 2: Replace `renderRecipes()` body**

Find `function renderRecipes(cat) {` and replace the entire function:

```js
function renderRecipes(cat) {
  const profile = (currentUser && currentUser.profile) || {};
  const overrideProfile = window._recipeShowAll
    ? { ...profile, cuisinePreference: 'mixed' }
    : profile;

  const recs = (typeof getFilteredRecipes === 'function')
    ? getFilteredRecipes(overrideProfile, {
        limit: 200,
        mealType: (cat && cat !== 'all') ? cat : undefined
      })
    : (cat === 'all' ? RECIPES : RECIPES.filter(r => r.cat === cat));

  const grid = document.getElementById('recipeGrid');
  if (!recs || recs.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-light);padding:20px;text-align:center">No recipes match your profile preferences. <button onclick="toggleCuisineFilter(document.getElementById(\'cuisineToggleBtn\'))" style="color:#1b4332;background:none;border:none;cursor:pointer;text-decoration:underline">Show all cuisines</button></p>';
    return;
  }

  grid.innerHTML = recs.map(r => `
    <div class="recipe-card">
      <div class="recipe-header">
        <div class="r-icon">${r.icon}</div>
        <div class="r-name">${r.name}</div>
        <div class="r-time">⏱️ ${r.time} · ${r.cal} kcal</div>
      </div>
      <div class="recipe-body">
        <div class="recipe-macros">
          <span class="macro-pill p">P ${r.p}g</span>
          <span class="macro-pill f">F ${r.f}g</span>
          <span class="macro-pill c">C ${r.c}g</span>
          <span class="macro-pill cal">${r.cal} kcal</span>
        </div>
        <div class="recipe-tags">
          ${r.tags.map(t => `<span class="tag${t.includes('ban') ? ' red' : ''}">${t}</span>`).join('')}
        </div>
      </div>
      <div class="recipe-expand" id="rx-${r.id}">
        <h4>🛒 Ingredients</h4>
        <ul>${r.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
        <h4>👨‍🍳 Method</h4>
        <ol>${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        ${r.tip ? `<div class="recipe-tip">💡 ${r.tip}</div>` : ''}
      </div>
      <div style="padding:10px 16px;border-top:1px solid var(--border)">
        <button class="btn btn-primary btn-sm" onclick="toggleRecipe(${r.id})">View Recipe ▼</button>
      </div>
    </div>
  `).join('');
}
```

- [ ] **Step 3: Add cuisine toggle button in `buildRecipes()`**

Find the `buildRecipes()` function. After building the filter pills (`filtersEl.innerHTML = ...`), add the toggle button:

```js
function buildRecipes() {
  const subtitle = document.getElementById('recipeSectionSubtitle');
  if (subtitle) {
    const dietLabel = {
      vegetarian:      'Vegetarian recipes',
      vegan:           'Vegan recipes',
      eggetarian:      'Egg-friendly recipes',
      'non-vegetarian':'All recipes',
    };
    const diet = currentUser && currentUser.profile && currentUser.profile.dietType;
    const cuisine = currentUser && currentUser.profile && currentUser.profile.cuisinePreference;
    const cuisineLabel = cuisine && cuisine !== 'mixed' ? ` · ${cuisine.replace('-', ' ')} cuisine` : '';
    subtitle.textContent = (dietLabel[diet] || 'All recipes') + cuisineLabel + ' · Filtered for your profile';
  }

  const cats = ['all','breakfast','lunch','dinner','snack','chutney'];
  const filtersEl = document.getElementById('recipeFilters');
  filtersEl.innerHTML = cats.map(c =>
    `<button class="filter-pill${c === 'all' ? ' active' : ''}" onclick="filterRecipes('${c}',this)">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`
  ).join('') +
  `<button id="cuisineToggleBtn" class="filter-pill" style="margin-left:8px;background:#f0fdf4;color:#166534;border-color:#bbf7d0" onclick="toggleCuisineFilter(this)">🌍 Show All Cuisines</button>`;

  renderRecipes('all');
}
```

- [ ] **Step 4: Smoke-test manually**

Start the server and verify:
```bash
cd /Users/kkondoju/projects/health-dashboard
node server.js
```
Open `http://localhost:3000`, log in as a south-indian vegetarian user. Navigate to the recipes tab. Confirm only south-indian vegetarian recipes appear. Click "Show All Cuisines" and confirm all cuisines appear. Click "My Cuisine Only" and confirm filter re-applies.

- [ ] **Step 5: Run full test suite (no recipe unit tests — frontend only)**

```bash
npm test 2>&1 | tail -10
```
Expected: all tests pass (no recipe tests exist — this is client-side JS).

- [ ] **Step 6: Commit**

```bash
git add public/js/recipes.js
git commit -m "feat: wire getFilteredRecipes() into renderRecipes() for proper profile filtering

- renderRecipes() now calls getFilteredRecipes(profile, options) instead of
  naive tag/name heuristic filtering
- Cuisine preference, diet type, cultural avoidances, health conditions all applied
- Goal-based sort: weight-loss shows lowest calories first
- Added Show All Cuisines / My Cuisine Only toggle button
- Updated subtitle to show active cuisine + diet filter

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Add step 4 (Workout Preferences) to onboarding

**Files:**
- Modify: `public/onboarding.html`

- [ ] **Step 1: Add step 4 HTML**

In `public/onboarding.html`, find the closing `</div>` of step 3 (the div ending after `goTo(5)` button). Insert the new step immediately after:

```html
  <!-- ── STEP 4: Workout Preferences ── -->
  <div class="step" id="step-4" style="display:none;">
    <div class="step-title">Workout Preferences</div>
    <div class="step-subtitle">We'll build your weekly schedule around these. You can change them later.</div>

    <div class="form-group">
      <label>What type of workouts do you prefer? <span class="hint">(select all that apply)</span></label>
      <div class="checkbox-group" id="cg-workoutPref">
        <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="workoutPref" value="gym"> 🏋️ Gym workouts</label>
        <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="workoutPref" value="home-workout"> 🏠 Home / bodyweight</label>
        <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="workoutPref" value="yoga"> 🧘 Yoga & mindfulness</label>
        <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="workoutPref" value="cardio"> 🏃 Cardio (running, cycling)</label>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="f-workoutDays">Days per week</label>
        <select id="f-workoutDays">
          <option value="">Select…</option>
          <option value="2">2 days</option>
          <option value="3">3 days</option>
          <option value="4" selected>4 days (recommended)</option>
          <option value="5">5 days</option>
          <option value="6">6 days</option>
          <option value="7">7 days</option>
        </select>
      </div>
      <div class="form-group">
        <label for="f-workoutTime">Preferred time</label>
        <select id="f-workoutTime">
          <option value="">Select…</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </div>
    </div>

    <div class="form-group" id="yogaStyleGroup" style="display:none">
      <label for="f-yogaStyle">Yoga style preference</label>
      <select id="f-yogaStyle">
        <option value="">Select…</option>
        <option value="hatha">Hatha — slow, foundational poses</option>
        <option value="vinyasa">Vinyasa — flowing sequences</option>
        <option value="pranayama-only">Pranayama only — breathing focus</option>
        <option value="none">No preference (I'll rotate)</option>
      </select>
    </div>

    <div class="step-actions">
      <button type="button" onclick="goTo(3)">← Back</button>
      <button type="button" onclick="goTo(5)" class="btn-primary">Next →</button>
    </div>
  </div>
```

- [ ] **Step 2: Fix step navigation**

Find the step 3 next button (`goTo(5)`) and change to `goTo(4)`:

```html
<!-- In step 3 -->
<button class="btn-next" onclick="goTo(4)">Next →</button>
```

Find the step 5 back button (`goTo(3)`) and change to `goTo(4)`:

```html
<!-- In step 5 -->
<button type="button" onclick="goTo(4)">← Back</button>
```

- [ ] **Step 3: Show/hide yoga style selector based on yoga checkbox**

In the `<script>` section, add a listener after the yoga checkbox. Find the `toggleCheck` function and add a call. Alternatively, add an `onchange` to the yoga checkbox. Find where `toggleCheck` is defined and add:

```js
function onWorkoutPrefChange() {
  const yogaChecked = Array.from(document.querySelectorAll('input[name="workoutPref"]:checked'))
    .some(cb => cb.value === 'yoga');
  const yogaGroup = document.getElementById('yogaStyleGroup');
  if (yogaGroup) yogaGroup.style.display = yogaChecked ? 'block' : 'none';
}
```

Add `onchange="onWorkoutPrefChange()"` to each workout pref checkbox:

```html
<label class="check-option" onclick="toggleCheck(this); onWorkoutPrefChange()"><input type="checkbox" name="workoutPref" value="gym"> 🏋️ Gym workouts</label>
<label class="check-option" onclick="toggleCheck(this); onWorkoutPrefChange()"><input type="checkbox" name="workoutPref" value="home-workout"> 🏠 Home / bodyweight</label>
<label class="check-option" onclick="toggleCheck(this); onWorkoutPrefChange()"><input type="checkbox" name="workoutPref" value="yoga"> 🧘 Yoga & mindfulness</label>
<label class="check-option" onclick="toggleCheck(this); onWorkoutPrefChange()"><input type="checkbox" name="workoutPref" value="cardio"> 🏃 Cardio (running, cycling)</label>
```

- [ ] **Step 4: Update `TOTAL_STEPS` and progress label**

Find `const TOTAL_STEPS = 8;` and change to `const TOTAL_STEPS = 9;`.

Find the progress label element. It reads "Step 1 of 8" — update to "Step 1 of 9". This is controlled by the `goTo` function — update the denominator or the text in the `goTo` call:

Find `goTo` function. It likely sets the progress text. Ensure it uses `TOTAL_STEPS`:

```js
function goTo(n) {
  document.querySelectorAll('.step').forEach(s => s.style.display = 'none');
  const step = document.getElementById('step-' + n);
  if (step) step.style.display = 'block';
  currentStep = n;
  const progressText = document.getElementById('progress-text');
  if (progressText) progressText.textContent = `Step ${n} of ${TOTAL_STEPS}`;
  const progressPct = document.getElementById('progress-pct');
  if (progressPct) progressPct.textContent = Math.round((n / TOTAL_STEPS) * 100) + '%';
  saveDraft();
}
```

- [ ] **Step 5: Update `submitProfile()` to include workout fields and `sex`**

In `submitProfile()`, add to the payload object:

```js
const payload = {
  // existing fields …
  sex: document.getElementById('f-sex')?.value || undefined,
  workoutPreferences: Array.from(document.querySelectorAll('input[name="workoutPref"]:checked')).map(cb => cb.value),
  workoutDaysPerWeek: document.getElementById('f-workoutDays')?.value
    ? parseInt(document.getElementById('f-workoutDays').value)
    : undefined,
  workoutTime: document.getElementById('f-workoutTime')?.value || undefined,
  yogaStyle:   document.getElementById('f-yogaStyle')?.value   || undefined,
};
```

- [ ] **Step 6: Update `saveDraft()` / `loadDraft()` to persist new fields**

In `saveDraft()`, add to the draft object:

```js
sex:                document.getElementById('f-sex')?.value || '',
workoutPreferences: Array.from(document.querySelectorAll('input[name="workoutPref"]:checked')).map(cb => cb.value),
workoutDaysPerWeek: document.getElementById('f-workoutDays')?.value || '',
workoutTime:        document.getElementById('f-workoutTime')?.value || '',
yogaStyle:          document.getElementById('f-yogaStyle')?.value   || '',
```

In `loadDraft()`, add:

```js
if (d.sex)                document.getElementById('f-sex').value = d.sex;
if (d.workoutPreferences && d.workoutPreferences.length) {
  setCheckboxes('cg-workoutPref', d.workoutPreferences);
  onWorkoutPrefChange();
}
if (d.workoutDaysPerWeek) document.getElementById('f-workoutDays').value = d.workoutDaysPerWeek;
if (d.workoutTime)        document.getElementById('f-workoutTime').value  = d.workoutTime;
if (d.yogaStyle)          document.getElementById('f-yogaStyle').value    = d.yogaStyle;
```

- [ ] **Step 7: Smoke-test the onboarding flow**

```bash
cd /Users/kkondoju/projects/health-dashboard && node server.js
```
Open `http://localhost:3000/onboarding.html`. Navigate all 9 steps. Verify:
- Step 4 appears between Health & Diet (step 3) and Food & Equipment (step 5)
- Yoga style selector appears when yoga checkbox is ticked
- Progress bar shows "Step 4 of 9" on step 4
- After submitting, check `/api/profile` and confirm `workoutPreferences`, `workoutDaysPerWeek`, `yogaStyle`, `sex` are saved

- [ ] **Step 8: Run full test suite**

```bash
npm test 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add public/onboarding.html
git commit -m "feat: add step 4 (workout preferences) to onboarding wizard

- New step 4 collects workoutPreferences, workoutDaysPerWeek, workoutTime, yogaStyle
- Yoga style selector shows/hides based on yoga checkbox state
- Step navigation fixed: 3→4→5 (was 3→5, skipping step 4)
- submitProfile() sends all workout fields + sex to /api/profile/onboarding
- saveDraft()/loadDraft() persist new fields across page refreshes
- TOTAL_STEPS updated from 8 to 9

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Final: Run full suite + push

- [ ] **Step 1: Run complete test suite**

```bash
cd /Users/kkondoju/projects/health-dashboard
npm test 2>&1
```
Expected: All tests pass (225+ tests).

- [ ] **Step 2: Push to remote**

```bash
cd /Users/kkondoju/projects/health-dashboard
git push origin main
```

- [ ] **Step 3: Verify CI pipeline passes**

```bash
gh run list --limit 3
```
Expected: latest run shows `completed` + `success`.
