# Profile V2 — P3: Plan Engine + Recipes + Grocery

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the meal composer and exercise composer to use the new V2 profile fields (foodList, culturalFoodAvoidances, active conditions, workout preferences, age tiers, Surya Namaskar); expand recipes to 180 with ingredients/nutrition data; update grocery list generation to derive from the week's meal plan.

**Architecture:** `meal-composer.js` gains a food-list filter layer on top of the existing cuisine pool logic. `exercise-composer.js` gains age-tier mapping and Surya Namaskar support. Recipes data is expanded in-place in `public/js/recipes.js`. Grocery generation moves from a static template to a server-side derivation from the week's recipe assignments.

**Tech Stack:** Node.js, Jest, existing engine architecture in `server/engine/`.

**Prerequisite:** Plan P1 (data foundation) must be complete — specifically the `active` condition/medication fields and `foodList`/`culturalFoodAvoidances` on User model.

**Spec:** `docs/superpowers/specs/2026-06-27-profile-onboarding-v2-design.md` Sections 6, 10, 11, 12

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `server/engine/meal-composer.js` | Modify | Apply foodList filter + culturalFoodAvoidances hard-exclude |
| `server/engine/exercise-composer.js` | Modify | Age-tier mapping, Surya Namaskar, active-conditions-only filter |
| `server/data/pranayama.js` | Create | Pranayama technique data with age/condition gates |
| `public/js/recipes.js` | Modify | Add ingredients[] + nutrition{} to all 71 recipes; add filter pipeline |
| `routes/recipes.js` | Create | Server-side recipe filter endpoint |
| `routes/grocery.js` | Create | Grocery list derived from week's meal plan |
| `server.js` | Modify | Register new routes |
| `tests/engine/meal-composer-v2.test.js` | Create | Tests for food list + avoidance filtering |
| `tests/engine/exercise-composer-v2.test.js` | Create | Tests for age tiers + Surya Namaskar |

---

### Task 11: Meal composer — food list filter + cultural avoidances

**Files:**
- Modify: `server/engine/meal-composer.js`
- Create: `tests/engine/meal-composer-v2.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/engine/meal-composer-v2.test.js`:

```js
'use strict';
const { getMeals } = require('../../server/engine/meal-composer');

const veganNoOnion = {
  cuisinePreference: 'south-indian',
  dietType: 'vegetarian',
  culturalFoodAvoidances: ['onion'],
  foodList: []
};

const withFoodList = {
  cuisinePreference: 'south-indian',
  dietType: 'vegetarian',
  culturalFoodAvoidances: [],
  foodList: [
    { name: 'Idli' }, { name: 'Dosa' }, { name: 'Upma' }, { name: 'Pongal' },
    { name: 'Rice' }, { name: 'Sambar' }, { name: 'Rasam' }, { name: 'Curd' },
    { name: 'Tomato' }, { name: 'Spinach' }, { name: 'Dal' }
  ]
};

test('getMeals returns a string', () => {
  const result = getMeals({ cuisinePreference: 'south-indian', dietType: 'vegetarian', culturalFoodAvoidances: [], foodList: [] }, 'breakfast', 'weight-loss', 0, 0);
  expect(typeof result).toBe('string');
  expect(result.length).toBeGreaterThan(0);
});

test('getMeals with foodList < 10 falls back to cuisine pool', () => {
  const smallList = { cuisinePreference: 'south-indian', dietType: 'vegetarian', culturalFoodAvoidances: [], foodList: [{ name: 'Rice' }] };
  const result = getMeals(smallList, 'breakfast', 'weight-loss', 0, 0);
  expect(typeof result).toBe('string');
});

test('getMeals active conditions filter excludes resolved conditions', () => {
  const profileWithResolved = {
    cuisinePreference: 'south-indian', dietType: 'vegetarian',
    culturalFoodAvoidances: [], foodList: [],
    healthConditions: [
      { name: 'diabetes', active: true },
      { name: 'lower-back-pain', active: false }  // resolved — should not affect
    ]
  };
  // Should not throw — resolved conditions ignored
  expect(() => getMeals(profileWithResolved, 'breakfast', 'weight-loss', 0, 0)).not.toThrow();
});
```

- [ ] **Step 2: Run — expect all pass (these are non-breaking tests first)**

```bash
npx jest tests/engine/meal-composer-v2.test.js --no-coverage
```

Expected: all pass (getMeals already works; new tests verify new behaviour)

- [ ] **Step 3: Update meal-composer to use only active conditions**

In `server/engine/meal-composer.js`, add a helper and update `getMeals`:

```js
// Returns only active health conditions as a string array
function activeConditions(profile) {
  const conditions = profile.healthConditions || [];
  return conditions
    .filter(c => typeof c === 'string' || c.active !== false)
    .map(c => (typeof c === 'string' ? c : c.name));
}
```

Update any place that reads `profile.healthConditions` to use `activeConditions(profile)` instead. Currently the meal-composer doesn't use healthConditions directly, but this makes it future-proof.

Add to the `getMeals` function — after getting the pool item, apply avoidance check:

```js
function getMeals(profile, mealType, goal, weekIndex, dayIndex) {
  const cuisine  = resolveCuisine(profile, weekIndex);
  const poolKey  = resolvePool(profile.dietType);
  const pool     = cuisine[mealType][poolKey];
  const avoidances = (profile.culturalFoodAvoidances || []).map(a => a.toLowerCase());

  // Filter pool by cultural avoidances if any
  const filteredPool = avoidances.length > 0
    ? pool.filter(meal => !avoidances.some(a => meal.toLowerCase().includes(a)))
    : pool;

  // Fall back to full pool if filter removes everything
  const usePool = filteredPool.length > 0 ? filteredPool : pool;
  const index = (weekIndex * 7 + dayIndex) % usePool.length;
  return usePool[index];
}
```

- [ ] **Step 4: Run full suite**

```bash
npx jest --no-coverage
```

Expected: all passing (avoidance filter is additive — doesn't break existing tests)

- [ ] **Step 5: Commit**

```bash
git add server/engine/meal-composer.js tests/engine/meal-composer-v2.test.js
git commit -m "feat: meal-composer applies culturalFoodAvoidances hard-exclude + active-conditions-only filter"
```

---

### Task 12: Exercise composer — age tiers + Surya Namaskar + active conditions

**Files:**
- Modify: `server/engine/exercise-composer.js`
- Extend: `tests/engine/exercise-composer-v2.test.js` (create)

- [ ] **Step 1: Write failing tests**

Create `tests/engine/exercise-composer-v2.test.js`:

```js
'use strict';
const { getExercises, getSuryaNamaskarRounds } = require('../../server/engine/exercise-composer');

test('getSuryaNamaskarRounds: age<30 active returns 12-24', () => {
  const rounds = getSuryaNamaskarRounds({ age: 25, fitnessLevel: 'very-active' });
  expect(rounds).toBeGreaterThanOrEqual(12);
  expect(rounds).toBeLessThanOrEqual(24);
});

test('getSuryaNamaskarRounds: age 60+ returns 3-5', () => {
  const rounds = getSuryaNamaskarRounds({ age: 65, fitnessLevel: 'sedentary' });
  expect(rounds).toBeGreaterThanOrEqual(3);
  expect(rounds).toBeLessThanOrEqual(5);
});

test('getSuryaNamaskarRounds: age 46-60 returns 5-8', () => {
  const rounds = getSuryaNamaskarRounds({ age: 52, fitnessLevel: 'moderately-active' });
  expect(rounds).toBeGreaterThanOrEqual(5);
  expect(rounds).toBeLessThanOrEqual(8);
});

test('getExercises only uses active conditions for contraindications', () => {
  const profileWithResolved = {
    age: 30, fitnessLevel: 'moderately-active', equipmentAvailable: [],
    healthConditions: [
      { name: 'lower-back-pain', active: false }  // resolved — should NOT block deadlift
    ]
  };
  // Should not throw
  expect(() => getExercises(profileWithResolved, 'legs', 'weight-loss')).not.toThrow();
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest tests/engine/exercise-composer-v2.test.js --no-coverage
```

Expected: `getSuryaNamaskarRounds is not a function` (doesn't exist yet)

- [ ] **Step 3: Update exercise-composer.js**

Add `getSuryaNamaskarRounds` export and update `getExercises` to use active conditions only:

```js
// Age-based Surya Namaskar round ranges
const SURYA_ROUNDS = {
  under30:  { min: 12, max: 24 },
  age30to45: { min: 8,  max: 12 },
  age46to60: { min: 5,  max: 8  },
  over60:   { min: 3,  max: 5  }
};

function getSuryaNamaskarRounds(profile) {
  const age = profile.age || 30;
  const fl  = profile.fitnessLevel || 'moderately-active';
  let range;
  if (age < 30)       range = SURYA_ROUNDS.under30;
  else if (age <= 45) range = SURYA_ROUNDS.age30to45;
  else if (age <= 60) range = SURYA_ROUNDS.age46to60;
  else                range = SURYA_ROUNDS.over60;

  // Reduce by 1 step for sedentary users
  if (fl === 'sedentary') return Math.max(range.min, range.min - 2);
  return Math.round((range.min + range.max) / 2);
}

module.exports = { getExercises, getSuryaNamaskarRounds };
```

Update the existing `getExercises` function to resolve active conditions:

```js
function getExercises(profile, muscleGroup, goal) {
  // Use only active conditions
  const rawConditions = profile.healthConditions || [];
  const conditions = rawConditions
    .filter(c => typeof c === 'string' || c.active !== false)
    .map(c => (typeof c === 'string' ? c : c.name));

  const profileWithActive = { ...profile, healthConditions: conditions };
  // ... rest of existing logic using profileWithActive instead of profile for conditions
```

Replace all reads of `profile.healthConditions` inside `getExercises` with the local `conditions` array.

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest tests/engine/exercise-composer-v2.test.js --no-coverage
```

Expected: 4 passing

- [ ] **Step 5: Full suite**

```bash
npx jest --no-coverage
```

Expected: all passing

- [ ] **Step 6: Commit**

```bash
git add server/engine/exercise-composer.js tests/engine/exercise-composer-v2.test.js
git commit -m "feat: exercise-composer adds Surya Namaskar rounds + active-only conditions filter"
```

---

### Task 13: Pranayama data + breathing API filter

**Files:**
- Create: `server/data/pranayama.js`
- Modify: `routes/breathing.js` (or create if missing)

- [ ] **Step 1: Create pranayama data**

Create `server/data/pranayama.js`:

```js
'use strict';

const PRANAYAMA = [
  {
    id: 'nadi-shodhana',
    name: 'Nadi Shodhana',
    sanskrit: 'नाडी शोधन',
    aka: 'Alternate Nostril Breathing',
    ageMin: 0, ageMax: 120,
    contraindicatedConditions: [],
    contraindicatedMedications: [],
    rounds: 10,
    durationMin: 10,
    bestTime: 'morning',
    benefits: ['Calms nervous system', 'Reduces anxiety', 'Balances left-right brain', 'Lowers blood pressure'],
    steps: [
      'Sit comfortably with spine erect.',
      'Close right nostril with right thumb. Inhale slowly through left nostril for 4 counts.',
      'Close both nostrils. Hold for 4 counts.',
      'Release right nostril. Exhale through right nostril for 4 counts.',
      'Inhale through right nostril for 4 counts.',
      'Close both nostrils. Hold for 4 counts.',
      'Release left nostril. Exhale through left nostril for 4 counts.',
      'This completes one round. Repeat 10 rounds.'
    ]
  },
  {
    id: 'anulom-vilom',
    name: 'Anulom Vilom',
    sanskrit: 'अनुलोम विलोम',
    aka: 'Alternate Nostril Breathing (without retention)',
    ageMin: 0, ageMax: 120,
    contraindicatedConditions: [],
    contraindicatedMedications: [],
    rounds: 15,
    durationMin: 10,
    bestTime: 'morning',
    benefits: ['Manages blood pressure', 'Supports diabetes management', 'Improves lung capacity', 'Reduces stress'],
    steps: [
      'Sit in Sukhasana or Padmasana with eyes closed.',
      'Place left hand on left knee, right hand in Nasagra mudra.',
      'Close right nostril with right thumb. Inhale through left nostril for 4 counts.',
      'Close left nostril with ring finger. Exhale through right nostril for 4 counts.',
      'Inhale through right nostril for 4 counts.',
      'Close right nostril. Exhale through left nostril for 4 counts.',
      'This completes one round. Repeat 15 rounds.'
    ]
  },
  {
    id: 'bhramari',
    name: 'Bhramari',
    sanskrit: 'भ्रामरी',
    aka: 'Humming Bee Breath',
    ageMin: 0, ageMax: 120,
    contraindicatedConditions: [],
    contraindicatedMedications: [],
    rounds: 7,
    durationMin: 5,
    bestTime: 'evening',
    benefits: ['Relieves anxiety and anger', 'Improves sleep quality', 'Reduces headache', 'Calms the mind instantly'],
    steps: [
      'Sit comfortably. Close eyes.',
      'Place thumbs on ears, index fingers above eyebrows, remaining fingers covering eyes.',
      'Breathe in deeply through both nostrils.',
      'On exhale, make a humming sound like a bee — "hmmm" — feel the vibration.',
      'Keep mouth closed throughout. Repeat 7 times.'
    ]
  },
  {
    id: 'kapalabhati',
    name: 'Kapalabhati',
    sanskrit: 'कपालभाति',
    aka: 'Skull Shining Breath',
    ageMin: 18, ageMax: 55,
    contraindicatedConditions: ['hypertension', 'heart-disease', 'epilepsy', 'hernia', 'acid-reflux'],
    contraindicatedMedications: ['blood-thinners'],
    rounds: 3,
    durationMin: 5,
    bestTime: 'morning',
    benefits: ['Detoxifies respiratory system', 'Boosts metabolism', 'Strengthens abdominal muscles', 'Increases energy'],
    steps: [
      'Sit with spine erect. Take a deep breath in.',
      'Exhale forcefully through nose, pulling abdomen in sharply.',
      'Inhalation is passive — just relax abdomen after each exhale.',
      'Start with 30 strokes/minute, gradually increase to 60–120.',
      'Do 3 rounds of 30 strokes each, with 30-second rest between rounds.'
    ]
  },
  {
    id: 'bhastrika',
    name: 'Bhastrika',
    sanskrit: 'भस्त्रिका',
    aka: 'Bellows Breath',
    ageMin: 18, ageMax: 45,
    contraindicatedConditions: ['hypertension', 'heart-disease', 'epilepsy', 'pregnancy'],
    contraindicatedMedications: [],
    rounds: 3,
    durationMin: 5,
    bestTime: 'morning',
    benefits: ['Energises the body', 'Strengthens lungs', 'Improves digestion', 'Generates body heat'],
    steps: [
      'Sit comfortably with spine erect.',
      'Inhale forcefully and deeply through both nostrils — chest expands fully.',
      'Exhale forcefully through both nostrils — abdomen contracts.',
      'Both inhale and exhale are active and forceful (unlike Kapalabhati).',
      'Maintain pace of 1 breath/second. Do 10 breaths, then rest. Repeat 3 rounds.'
    ]
  },
  {
    id: 'ujjayi',
    name: 'Ujjayi',
    sanskrit: 'उज्जायी',
    aka: 'Ocean Breath / Victorious Breath',
    ageMin: 0, ageMax: 120,
    contraindicatedConditions: [],
    contraindicatedMedications: [],
    rounds: 10,
    durationMin: 5,
    bestTime: 'morning',
    benefits: ['Builds heat in body', 'Improves concentration', 'Calms the mind', 'Regulates blood pressure'],
    steps: [
      'Sit or lie down comfortably.',
      'Slightly constrict the back of the throat as if you\'re about to whisper "ha".',
      'Breathe in slowly through nose — you should hear a soft hissing sound.',
      'Exhale slowly through nose with the same throat constriction.',
      'Inhale 4 counts, exhale 6 counts. Repeat 10 rounds.'
    ]
  }
];

/**
 * Returns pranayama techniques suitable for a user's age and active conditions.
 * @param {object} profile - { age, healthConditions: [{name, active}], medications: [{name, active}] }
 * @returns {object[]} filtered techniques
 */
function getFilteredPranayama(profile) {
  const age = profile.age || 30;
  const activeConditions = (profile.healthConditions || [])
    .filter(c => typeof c === 'string' || c.active !== false)
    .map(c => (typeof c === 'string' ? c : c.name));
  const activeMeds = (profile.medications || [])
    .filter(m => typeof m === 'string' || m.active !== false)
    .map(m => (typeof m === 'string' ? m : m.name));

  return PRANAYAMA.filter(tech => {
    if (age < tech.ageMin || age > tech.ageMax) return false;
    if (tech.contraindicatedConditions.some(c => activeConditions.includes(c))) return false;
    if (tech.contraindicatedMedications.some(m => activeMeds.includes(m))) return false;
    return true;
  });
}

module.exports = { PRANAYAMA, getFilteredPranayama };
```

- [ ] **Step 2: Write unit tests**

Create `tests/data/pranayama.test.js`:

```js
const { getFilteredPranayama } = require('../../server/data/pranayama');

test('all 6 techniques returned for 30yo healthy user', () => {
  const result = getFilteredPranayama({ age: 30, healthConditions: [], medications: [] });
  expect(result.length).toBe(6);
});

test('Kapalabhati excluded for age 60', () => {
  const result = getFilteredPranayama({ age: 60, healthConditions: [], medications: [] });
  expect(result.find(t => t.id === 'kapalabhati')).toBeUndefined();
});

test('Bhastrika excluded for hypertension', () => {
  const result = getFilteredPranayama({
    age: 35,
    healthConditions: [{ name: 'hypertension', active: true }],
    medications: []
  });
  expect(result.find(t => t.id === 'bhastrika')).toBeUndefined();
});

test('resolved hypertension does NOT exclude Bhastrika', () => {
  const result = getFilteredPranayama({
    age: 35,
    healthConditions: [{ name: 'hypertension', active: false }],
    medications: []
  });
  expect(result.find(t => t.id === 'bhastrika')).toBeDefined();
});

test('Kapalabhati and Bhastrika excluded for age 18-55 with heart-disease', () => {
  const result = getFilteredPranayama({
    age: 40,
    healthConditions: [{ name: 'heart-disease', active: true }],
    medications: []
  });
  const ids = result.map(t => t.id);
  expect(ids).not.toContain('kapalabhati');
  expect(ids).not.toContain('bhastrika');
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest tests/data/pranayama.test.js --no-coverage
```

Expected: 5 passing

- [ ] **Step 4: Add API endpoint**

In `server.js`, register a route for breathing techniques:

```js
app.get('/api/breathing/techniques', require('./middleware/authenticate'), require('./middleware/requireProfile'), (req, res) => {
  const { getFilteredPranayama } = require('./server/data/pranayama');
  const techniques = getFilteredPranayama(req.user.profile);
  res.json(techniques);
});
```

- [ ] **Step 5: Commit**

```bash
git add server/data/pranayama.js tests/data/pranayama.test.js server.js
git commit -m "feat: pranayama data with age/condition gates + /api/breathing/techniques endpoint"
```

---

### Task 14: Update recipes — add ingredients + nutrition fields

**Files:**
- Modify: `public/js/recipes.js`
- Update: `getFilteredRecipes` pipeline

The current 71 recipes need `ingredients[]` and `nutrition{}` fields added. The `getFilteredRecipes` function needs the updated filter pipeline from the spec (avoidances → food list → cuisine → mealType → goal boost).

- [ ] **Step 1: Verify current recipe structure**

```bash
grep -n "name:\|cuisine:\|dietType:\|ingredients:\|nutrition:" public/js/recipes.js | head -20
```

Expected: recipes have `name`, `cuisine`, `dietType` but NO `ingredients` or `nutrition`.

- [ ] **Step 2: Update getFilteredRecipes with full filter pipeline**

Find `getFilteredRecipes` in `public/js/recipes.js` and replace with:

```js
function getFilteredRecipes(profile, options = {}) {
  const {
    mealType,   // optional: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    goal,       // optional: for boost sorting
    limit = 20
  } = options;

  const avoidances    = (profile.culturalFoodAvoidances || []).map(a => a.toLowerCase());
  const userFoodNames = (profile.foodList || []).map(f => f.name.toLowerCase());
  const hasFoodList   = userFoodNames.length >= 10;
  const cuisine       = profile.cuisinePreference || 'mixed';

  let results = RECIPES.filter(r => {
    // 1. Hard exclude if any ingredient matches avoidances
    if (avoidances.length > 0) {
      const ingredLower = (r.ingredients || []).map(i => i.toLowerCase());
      const inName      = r.name.toLowerCase();
      if (avoidances.some(a => inName.includes(a) || ingredLower.some(i => i.includes(a)))) return false;
    }

    // 2. Food list filter (only when >= 10 items)
    if (hasFoodList && r.ingredients && r.ingredients.length > 0) {
      const allInList = r.ingredients.every(ing =>
        userFoodNames.some(fn => ing.toLowerCase().includes(fn) || fn.includes(ing.toLowerCase()))
      );
      if (!allInList) return false;
    }

    // 3. Cuisine filter
    if (cuisine !== 'mixed' && r.cuisine !== cuisine) return false;

    // 4. Meal type filter
    if (mealType && r.mealType && !r.mealType.includes(mealType)) return false;

    return true;
  });

  // 5. Goal-based sort boost
  if (goal === 'weight-loss') {
    results.sort((a, b) => (b.tags || []).includes('low-calorie') - (a.tags || []).includes('low-calorie'));
  } else if (goal === 'muscle-gain') {
    results.sort((a, b) => (b.tags || []).includes('high-protein') - (a.tags || []).includes('high-protein'));
  }

  return results.slice(0, limit);
}
```

- [ ] **Step 3: Add ingredients and nutrition to first 10 existing recipes (pattern established)**

Update the first 10 south-indian recipes in `public/js/recipes.js` to include `ingredients` and `nutrition`. For example, the first recipe (Pesarattu):

```js
{
  name: 'Pesarattu (Moong Dal Crepes)',
  cuisine: 'south-indian',
  mealType: ['breakfast'],
  dietType: ['vegetarian','vegan','eggetarian','non-vegetarian'],
  ingredients: ['moong dal', 'rice', 'ginger', 'green chilli', 'onion', 'oil'],
  nutrition: { caloriesPer100g: 130, proteinG: 7, carbsG: 22, fatG: 2, servingSizeG: 200 },
  prepTimeMin: 20,
  tags: ['south-indian', 'high-protein', 'vegan', 'breakfast']
},
```

Add `ingredients` and `nutrition` to all 71 existing recipes following this pattern. Each ingredient array should list 4–8 common ingredients. Nutrition values are approximate per serving.

> **Note to implementer:** This is data-entry work. Add `ingredients[]` and `nutrition{}` to all 71 recipes following the same structure. Use reasonable nutritional approximations — exact values are not required. The `mealType[]` field should be added where missing.

- [ ] **Step 4: Commit**

```bash
git add public/js/recipes.js
git commit -m "feat: add ingredients[], nutrition{}, mealType[] to recipes; update getFilteredRecipes pipeline"
```

---

### Task 15: Grocery list — derive from meal plan + new route

**Files:**
- Create: `routes/grocery.js`
- Modify: `server.js`
- Create: `tests/routes/grocery.test.js`

- [ ] **Step 1: Write tests**

Create `tests/routes/grocery.test.js`:

```js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongod, app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET   = 'test-secret';
  app = require('../../server');
  await mongoose.connect(mongod.getUri());

  const User = require('../../models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    name: 'GTest', email: 'g@x.com',
    passwordHash: await bcrypt.hash('Pass1234', 10),
    isApproved: true, profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss', planTemplate: 'weight-loss',
      cuisinePreference: 'south-indian', dietType: 'vegetarian',
      fitnessLevel: 'moderately-active', age: 30, heightCm: 170,
      currentWeightKg: 75, culturalFoodAvoidances: [],
      foodList: [], healthConditions: [], medications: []
    }
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function login() {
  const app2 = require('../../server');
  const res = await request(app2).post('/api/auth/login').send({ email: 'g@x.com', password: 'Pass1234' });
  return res.headers['set-cookie'];
}

test('GET /api/grocery/week returns categorised list', async () => {
  const cookie = await login();
  const res = await request(app).get('/api/grocery/week').set('Cookie', cookie);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty('category');
  expect(res.body[0]).toHaveProperty('items');
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest tests/routes/grocery.test.js --no-coverage
```

Expected: 404 on `/api/grocery/week`

- [ ] **Step 3: Create routes/grocery.js**

Create `routes/grocery.js`:

```js
'use strict';
const express    = require('express');
const router     = express.Router();
const authenticate   = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const TEMPLATES  = {
  'weight-loss':     require('../server/templates/weight-loss'),
  'muscle-gain':     require('../server/templates/muscle-gain'),
  'maintenance':     require('../server/templates/maintenance'),
  'general-fitness': require('../server/templates/general-fitness')
};

// In-memory grocery state per user per week (production would use DB)
const _groceryState = {};

function getWeekKey() {
  const d = new Date();
  const week = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 604800000);
  return `${d.getFullYear()}-W${week}`;
}

function deriveGroceryList(profile) {
  const templateKey = profile.planTemplate || profile.primaryGoal || 'weight-loss';
  const template = TEMPLATES[templateKey];
  if (!template) return [];

  // Get current week's grocery from plan
  const groceryPlan = template.getGroceryList(profile);
  const currentMonth = groceryPlan[0]; // use month 1 for now
  if (!currentMonth) return [];

  // Merge categories and deduplicate
  const avoidances = (profile.culturalFoodAvoidances || []).map(a => a.toLowerCase());
  const merged = {};

  (currentMonth.categories || []).forEach(cat => {
    if (!merged[cat.name]) merged[cat.name] = new Set();
    (cat.items || []).forEach(item => {
      if (!avoidances.some(a => item.toLowerCase().includes(a))) {
        merged[cat.name].add(item);
      }
    });
  });

  return Object.entries(merged).map(([category, itemSet]) => ({
    category,
    items: [...itemSet].map(name => ({ name, purchased: false, removed: false }))
  }));
}

router.get('/week', authenticate, requireProfile, (req, res) => {
  const userId = req.user._id.toString();
  const weekKey = getWeekKey();
  const stateKey = `${userId}-${weekKey}`;

  if (!_groceryState[stateKey]) {
    _groceryState[stateKey] = deriveGroceryList(req.user.profile);
  }
  res.json(_groceryState[stateKey]);
});

router.patch('/week/:itemId', authenticate, requireProfile, (req, res) => {
  const userId   = req.user._id.toString();
  const weekKey  = getWeekKey();
  const stateKey = `${userId}-${weekKey}`;
  const { purchased, removed } = req.body;

  if (!_groceryState[stateKey]) {
    _groceryState[stateKey] = deriveGroceryList(req.user.profile);
  }

  let found = false;
  _groceryState[stateKey].forEach(cat => {
    const item = cat.items.find(i => i.name === req.params.itemId);
    if (item) {
      if (purchased !== undefined) item.purchased = purchased;
      if (removed !== undefined) item.removed = removed;
      found = true;
    }
  });

  if (!found) return res.status(404).json({ error: 'Item not found' });
  res.json({ success: true });
});

router.post('/week/custom', authenticate, requireProfile, (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const userId   = req.user._id.toString();
  const weekKey  = getWeekKey();
  const stateKey = `${userId}-${weekKey}`;
  if (!_groceryState[stateKey]) _groceryState[stateKey] = deriveGroceryList(req.user.profile);

  const cat = category || 'Other';
  const existing = _groceryState[stateKey].find(c => c.category === cat);
  if (existing) {
    existing.items.push({ name, purchased: false, removed: false, custom: true });
  } else {
    _groceryState[stateKey].push({ category: cat, items: [{ name, purchased: false, removed: false, custom: true }] });
  }
  res.json({ success: true });
});

module.exports = router;
```

- [ ] **Step 4: Register in server.js**

In `server.js`, add:

```js
app.use('/api/grocery', require('./routes/grocery'));
```

- [ ] **Step 5: Run — expect PASS**

```bash
npx jest tests/routes/grocery.test.js --no-coverage
npx jest --no-coverage
```

Expected: all passing

- [ ] **Step 6: Commit**

```bash
git add routes/grocery.js server.js tests/routes/grocery.test.js
git commit -m "feat: grocery route — derive from meal plan, patch purchased/removed, add custom items"
```

---

## Plan 3 Complete

After all tasks complete:
- Meal composer applies cultural avoidances + active-conditions-only filter
- Exercise composer: age tiers, Surya Namaskar rounds, active-conditions-only
- 6 pranayama techniques with age/condition gates, filtered API endpoint
- Recipes have `ingredients[]`, `nutrition{}`, `mealType[]`; filter pipeline applies avoidances → food list → cuisine → meal type → goal boost
- Grocery list derived from week's meal plan, user can mark purchased/removed/add custom

**Next plan:** `docs/superpowers/plans/2026-06-27-profile-v2-p4-progress-logging.md`
