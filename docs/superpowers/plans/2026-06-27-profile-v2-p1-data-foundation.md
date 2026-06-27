# Profile V2 — P1: Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the User model with V2 profile fields (food list, cultural identity, workout preferences, resolved conditions), add a ProfileSnapshot collection, migrate existing data, and expose all new fields through the existing API.

**Architecture:** User model gains new fields on its embedded `profileSchema`. `healthConditions` and `medications` change from flat arrays to structured objects with `active/resolvedAt`. A new `ProfileSnapshot` Mongoose model records a full profile copy on every significant change. The `/api/profile` PATCH and `/api/profile/onboarding` routes accept all new fields. A migration script backfills existing users.

**Tech Stack:** Node.js, Express, Mongoose 8, MongoDB Atlas, Jest + mongodb-memory-server

**Spec:** `docs/superpowers/specs/2026-06-27-profile-onboarding-v2-design.md` Sections 3, 8, 13 (migration)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `models/User.js` | Modify | Add new profile fields; restructure healthConditions + medications |
| `models/ProfileSnapshot.js` | Create | New collection for versioned profile history |
| `routes/profile.js` | Modify | Accept new fields in PATCH + onboarding; add `/snapshots`, `/completion`, `/review` endpoints |
| `scripts/migrate-profile-v2.js` | Create | One-time migration for existing users |
| `tests/models/profileSnapshot.test.js` | Create | Unit tests for ProfileSnapshot creation |
| `tests/routes/profile-v2.test.js` | Create | Integration tests for new profile endpoints |

---

### Task 1: Restructure healthConditions + medications in User model

**Files:**
- Modify: `models/User.js`
- Test: `tests/models/user-v2.test.js` (create)

The `healthConditions` field changes from `[String]` to `[{ name, active, resolvedAt }]`.
The `medications` field gains `active` and `resolvedAt`.

- [ ] **Step 1: Write the failing tests**

Create `tests/models/user-v2.test.js`:

```js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const User = require('../../models/User');

const BASE = {
  name: 'Test', email: 'test@x.com', passwordHash: 'hash',
  isApproved: true
};

test('healthConditions stores name + active + resolvedAt', async () => {
  const u = await User.create({
    ...BASE,
    email: 'hc@x.com',
    profile: {
      healthConditions: [{ name: 'diabetes', active: true }]
    }
  });
  expect(u.profile.healthConditions[0].name).toBe('diabetes');
  expect(u.profile.healthConditions[0].active).toBe(true);
  expect(u.profile.healthConditions[0].resolvedAt).toBeNull();
});

test('healthConditions active defaults to true', async () => {
  const u = await User.create({
    ...BASE, email: 'hc2@x.com',
    profile: { healthConditions: [{ name: 'thyroid' }] }
  });
  expect(u.profile.healthConditions[0].active).toBe(true);
});

test('medications stores active + resolvedAt', async () => {
  const u = await User.create({
    ...BASE, email: 'med@x.com',
    profile: {
      medications: [{ name: 'Metformin', dosage: '500mg', timing: 'morning', active: true }]
    }
  });
  expect(u.profile.medications[0].active).toBe(true);
  expect(u.profile.medications[0].resolvedAt).toBeNull();
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd /Users/kkondoju/projects/health-dashboard
npx jest tests/models/user-v2.test.js --no-coverage
```

Expected: 3 failures (schema doesn't have the new structure yet)

- [ ] **Step 3: Update User model**

In `models/User.js`, replace:

```js
const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: String,
  timing: String
}, { _id: false });
```

With:

```js
const medicationSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  dosage:     String,
  timing:     String,
  active:     { type: Boolean, default: true },
  resolvedAt: { type: Date, default: null }
}, { _id: false });

const healthConditionSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  active:     { type: Boolean, default: true },
  resolvedAt: { type: Date, default: null }
}, { _id: false });
```

In `profileSchema`, replace:

```js
healthConditions: [String],
```

With:

```js
healthConditions: [healthConditionSchema],
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest tests/models/user-v2.test.js --no-coverage
```

Expected: 3 passing

- [ ] **Step 5: Verify full suite still passes**

```bash
npx jest --no-coverage
```

Expected: all tests pass (existing tests may need updating if they pass `healthConditions: ['string']` — fix those to `[{ name: 'string' }]`)

- [ ] **Step 6: Commit**

```bash
git add models/User.js tests/models/user-v2.test.js
git commit -m "feat: restructure healthConditions and medications to objects with active/resolvedAt"
```

---

### Task 2: Add new profile fields to User model

**Files:**
- Modify: `models/User.js`
- Test: `tests/models/user-v2.test.js` (extend)

Add `religion`, `languageCommunity`, `culturalFoodAvoidances`, `foodList`, `workoutPreferences`, `workoutDaysPerWeek`, `workoutTime`, `yogaStyle`, `reviewReminderDays`, `lastReviewedAt`, `dailyCalorieTarget`, `dailyProteinG`, `dailyCarbsG`, `dailyFatG`.

- [ ] **Step 1: Add tests for new fields**

Append to `tests/models/user-v2.test.js`:

```js
test('foodList stores name + category + custom', async () => {
  const u = await User.create({
    ...BASE, email: 'fl@x.com',
    profile: {
      foodList: [
        { name: 'Idli', category: 'grains', custom: false },
        { name: 'Gongura Curry', category: 'vegetables', custom: true }
      ]
    }
  });
  expect(u.profile.foodList).toHaveLength(2);
  expect(u.profile.foodList[0].category).toBe('grains');
  expect(u.profile.foodList[1].custom).toBe(true);
});

test('workoutPreferences stores array of strings', async () => {
  const u = await User.create({
    ...BASE, email: 'wp@x.com',
    profile: { workoutPreferences: ['yoga', 'surya-namaskar'] }
  });
  expect(u.profile.workoutPreferences).toEqual(['yoga', 'surya-namaskar']);
});

test('reviewReminderDays defaults to 60', async () => {
  const u = await User.create({ ...BASE, email: 'rr@x.com' });
  expect(u.profile.reviewReminderDays).toBe(60);
});

test('culturalFoodAvoidances stores array', async () => {
  const u = await User.create({
    ...BASE, email: 'cfa@x.com',
    profile: { culturalFoodAvoidances: ['beef', 'pork'] }
  });
  expect(u.profile.culturalFoodAvoidances).toEqual(['beef', 'pork']);
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest tests/models/user-v2.test.js --no-coverage
```

Expected: 4 new failures

- [ ] **Step 3: Add new fields to profileSchema in User.js**

After the existing `waterGoalL` field in `profileSchema`, add:

```js
// Cultural identity
religion:               { type: String, enum: ['Hindu', 'Muslim', 'Christian', 'Jain', 'Sikh', 'Other'] },
languageCommunity:      { type: String, enum: ['Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Hindi', 'Other'] },
culturalFoodAvoidances: [String],

// Food list
foodList: [{
  name:     { type: String, required: true },
  category: { type: String, enum: ['grains', 'vegetables', 'proteins', 'dairy', 'snacks', 'beverages'] },
  custom:   { type: Boolean, default: false },
  _id:      false
}],

// Workout preferences
workoutPreferences:  [String],
workoutDaysPerWeek:  { type: Number, min: 2, max: 6 },
workoutTime:         { type: String, enum: ['morning', 'afternoon', 'evening'] },
yogaStyle:           { type: String, enum: ['hatha', 'vinyasa', 'pranayama-only', 'none'] },

// Periodic review
reviewReminderDays: { type: Number, enum: [30, 60, 90], default: 60 },
lastReviewedAt:     Date,

// Computed macro targets (set on plan generation)
dailyCalorieTarget: Number,
dailyProteinG:      Number,
dailyCarbsG:        Number,
dailyFatG:          Number,
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest tests/models/user-v2.test.js --no-coverage
```

Expected: all 7 tests pass

- [ ] **Step 5: Full suite**

```bash
npx jest --no-coverage
```

Expected: all passing

- [ ] **Step 6: Commit**

```bash
git add models/User.js tests/models/user-v2.test.js
git commit -m "feat: add food list, cultural identity, workout preferences, macro targets to User profile schema"
```

---

### Task 3: Create ProfileSnapshot model

**Files:**
- Create: `models/ProfileSnapshot.js`
- Create: `tests/models/profileSnapshot.test.js`

- [ ] **Step 1: Write the test**

Create `tests/models/profileSnapshot.test.js`:

```js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const ProfileSnapshot = require('../../models/ProfileSnapshot');

test('creates snapshot with required fields', async () => {
  const userId = new mongoose.Types.ObjectId();
  const snap = await ProfileSnapshot.create({
    userId,
    reason: 'onboarding',
    data: { primaryGoal: 'weight-loss', age: 30 }
  });
  expect(snap.userId.toString()).toBe(userId.toString());
  expect(snap.reason).toBe('onboarding');
  expect(snap.data.primaryGoal).toBe('weight-loss');
  expect(snap.snapshotAt).toBeInstanceOf(Date);
});

test('reason must be valid enum', async () => {
  const userId = new mongoose.Types.ObjectId();
  await expect(
    ProfileSnapshot.create({ userId, reason: 'invalid', data: {} })
  ).rejects.toThrow();
});

test('findByUser returns snapshots sorted newest first', async () => {
  const userId = new mongoose.Types.ObjectId();
  await ProfileSnapshot.create({ userId, reason: 'onboarding', data: { v: 1 } });
  await ProfileSnapshot.create({ userId, reason: 'user-edit', data: { v: 2 } });
  const snaps = await ProfileSnapshot.find({ userId }).sort({ snapshotAt: -1 });
  expect(snaps[0].data.v).toBe(2);
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest tests/models/profileSnapshot.test.js --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Create the model**

Create `models/ProfileSnapshot.js`:

```js
const mongoose = require('mongoose');

const profileSnapshotSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  snapshotAt: { type: Date, default: Date.now },
  reason:     { type: String, enum: ['onboarding', 'user-edit', 'periodic-review'], required: true },
  data:       { type: mongoose.Schema.Types.Mixed, required: true }
});

module.exports = mongoose.model('ProfileSnapshot', profileSnapshotSchema);
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest tests/models/profileSnapshot.test.js --no-coverage
```

Expected: 3 passing

- [ ] **Step 5: Commit**

```bash
git add models/ProfileSnapshot.js tests/models/profileSnapshot.test.js
git commit -m "feat: add ProfileSnapshot model for versioned profile history"
```

---

### Task 4: Update profile routes — PATCH + onboarding + new endpoints

**Files:**
- Modify: `routes/profile.js`
- Create: `tests/routes/profile-v2.test.js`

- [ ] **Step 1: Write the tests**

Create `tests/routes/profile-v2.test.js`:

```js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongod, app, token;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET   = 'test-secret';
  app = require('../../server');
  await mongoose.connect(mongod.getUri());

  // Register + approve user
  const User = require('../../models/User');
  const bcrypt = require('bcryptjs');
  const user = await User.create({
    name: 'Test', email: 't@x.com',
    passwordHash: await bcrypt.hash('Pass1234', 10),
    isApproved: true, profileComplete: false
  });

  // Login
  const res = await request(app).post('/api/auth/login')
    .send({ email: 't@x.com', password: 'Pass1234' });
  token = res.headers['set-cookie'];
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('POST /api/profile/onboarding accepts new V2 fields', async () => {
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set('Cookie', token)
    .send({
      primaryGoal: 'weight-loss', currentWeightKg: 80, goalWeightKg: 70,
      heightCm: 170, age: 30, fitnessLevel: 'moderately-active',
      religion: 'Hindu', languageCommunity: 'Telugu',
      culturalFoodAvoidances: ['beef'],
      healthConditions: [{ name: 'diabetes', active: true }],
      medications: [{ name: 'Metformin', active: true }]
    });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});

test('GET /api/profile/completion returns percentage', async () => {
  const res = await request(app)
    .get('/api/profile/completion')
    .set('Cookie', token);
  expect(res.status).toBe(200);
  expect(typeof res.body.percentage).toBe('number');
  expect(res.body.percentage).toBeGreaterThanOrEqual(0);
  expect(res.body.percentage).toBeLessThanOrEqual(100);
});

test('GET /api/profile/snapshots returns array', async () => {
  const res = await request(app)
    .get('/api/profile/snapshots')
    .set('Cookie', token);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0); // onboarding created one
});

test('PATCH /api/profile accepts foodList and workoutPreferences', async () => {
  const res = await request(app)
    .patch('/api/profile')
    .set('Cookie', token)
    .send({
      foodList: [{ name: 'Idli', category: 'grains', custom: false }],
      workoutPreferences: ['yoga', 'surya-namaskar'],
      reviewReminderDays: 30
    });
  expect(res.status).toBe(200);
  expect(res.body.foodList).toHaveLength(1);
  expect(res.body.workoutPreferences).toContain('surya-namaskar');
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest tests/routes/profile-v2.test.js --no-coverage
```

Expected: failures on new fields + missing endpoints

- [ ] **Step 3: Update routes/profile.js**

Replace the full file with:

```js
const express = require('express');
const router  = express.Router();
const authenticate   = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const User           = require('../models/User');
const ProfileSnapshot = require('../models/ProfileSnapshot');

const TEMPLATES = {
  'weight-loss':     require('../server/templates/weight-loss'),
  'muscle-gain':     require('../server/templates/muscle-gain'),
  'maintenance':     require('../server/templates/maintenance'),
  'general-fitness': require('../server/templates/general-fitness')
};

// ── helpers ─────────────────────────────────────────────────────────────────

function computeWaterGoal(weightKg) {
  if (!weightKg) return 2.5;
  return Math.round((weightKg * 30) / 1000 * 10) / 10;
}

function computeMacroTargets(profile) {
  if (!profile.age || !profile.heightCm || !profile.currentWeightKg) return {};
  const w = profile.currentWeightKg, h = profile.heightCm, a = profile.age;
  // Mifflin-St Jeor (assume male if gender not captured yet)
  const bmr = 10 * w + 6.25 * h - 5 * a + 5;
  const multipliers = { sedentary: 1.2, 'lightly-active': 1.375, 'moderately-active': 1.55, 'very-active': 1.725 };
  const tdee = bmr * (multipliers[profile.fitnessLevel] || 1.2);
  const goalAdj = { 'weight-loss': -500, 'muscle-gain': 300, 'maintenance': 0, 'general-fitness': 0 };
  const calories = Math.round(tdee + (goalAdj[profile.primaryGoal] || 0));
  const macros = {
    'weight-loss':     { p: 0.35, c: 0.40, f: 0.25 },
    'muscle-gain':     { p: 0.40, c: 0.40, f: 0.20 },
    'maintenance':     { p: 0.30, c: 0.45, f: 0.25 },
    'general-fitness': { p: 0.30, c: 0.45, f: 0.25 }
  }[profile.primaryGoal] || { p: 0.30, c: 0.45, f: 0.25 };
  return {
    dailyCalorieTarget: calories,
    dailyProteinG:  Math.round(calories * macros.p / 4),
    dailyCarbsG:    Math.round(calories * macros.c / 4),
    dailyFatG:      Math.round(calories * macros.f / 9)
  };
}

const PHASE2_FIELDS = [
  'cuisinePreference', 'equipmentAvailable', 'workoutPreferences',
  'workoutDaysPerWeek', 'workoutTime', 'yogaStyle',
  'foodList', 'religion', 'languageCommunity',
  'reviewReminderDays'
];

function computeCompletionPct(profile) {
  const filled = PHASE2_FIELDS.filter(f => {
    const v = profile[f];
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
  return Math.round((filled.length / PHASE2_FIELDS.length) * 100);
}

async function writeSnapshot(userId, profile, reason) {
  await ProfileSnapshot.create({ userId, reason, data: profile });
}

// ── routes ───────────────────────────────────────────────────────────────────

// Onboarding: no profile required yet
router.post('/onboarding', authenticate, async (req, res) => {
  try {
    const {
      primaryGoal, currentWeightKg, goalWeightKg, heightCm, age,
      fitnessLevel, religion, languageCommunity, culturalFoodAvoidances,
      healthConditions, medications, secondaryGoals,
      workoutPreferences, workoutDaysPerWeek, workoutTime, yogaStyle,
      foodAllergies, dietType, cuisinePreference, equipmentAvailable
    } = req.body;

    const VALID_TEMPLATES = ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness'];
    if (primaryGoal && !VALID_TEMPLATES.includes(primaryGoal)) {
      return res.status(400).json({ error: `Invalid primaryGoal: ${primaryGoal}` });
    }

    // Normalise healthConditions — accept both [String] (legacy) and [{name}]
    const normConditions = (healthConditions || []).map(c =>
      typeof c === 'string' ? { name: c, active: true } : { ...c, active: c.active !== false }
    );
    const normMeds = (medications || []).map(m =>
      typeof m === 'string' ? { name: m, active: true } : { ...m, active: m.active !== false }
    );

    const partialProfile = {
      primaryGoal, planTemplate: primaryGoal,
      currentWeightKg, startWeightKg: currentWeightKg,
      goalWeightKg, heightCm, age, fitnessLevel,
      religion, languageCommunity,
      culturalFoodAvoidances: culturalFoodAvoidances || [],
      healthConditions: normConditions,
      medications: normMeds,
      secondaryGoals: secondaryGoals || [],
      foodAllergies: foodAllergies || [],
      dietType, cuisinePreference: cuisinePreference || 'mixed',
      equipmentAvailable: equipmentAvailable || [],
      workoutPreferences: workoutPreferences || [],
      workoutDaysPerWeek, workoutTime, yogaStyle,
      startDate: new Date()
    };

    // Add auto-calculated fields
    partialProfile.waterGoalL = computeWaterGoal(currentWeightKg);
    const macros = computeMacroTargets(partialProfile);
    Object.assign(partialProfile, macros);

    const updates = {};
    Object.entries(partialProfile).forEach(([k, v]) => {
      if (v !== undefined) updates[`profile.${k}`] = v;
    });
    updates.profileComplete = true;

    const updated = await User.findByIdAndUpdate(
      req.user._id, updates, { runValidators: true, new: true, lean: true }
    );

    await writeSnapshot(req.user._id, updated.profile, 'onboarding');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Plan generation
router.get('/plan', authenticate, requireProfile, async (req, res) => {
  try {
    const profile = req.user.profile;
    const templateKey = profile.planTemplate || profile.primaryGoal || 'weight-loss';
    const template = TEMPLATES[templateKey];
    if (!template) return res.status(400).json({ error: `Unknown template: ${templateKey}` });
    res.json({
      meta:      template.getPlanMeta(profile),
      diet:      template.getDietPlan(profile),
      workout:   template.getWorkoutPlan(profile),
      cardio:    template.getCardioPlan(profile),
      grocery:   template.getGroceryList(profile),
      checklist: template.getDefaultChecklist(profile)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get profile
router.get('/', authenticate, requireProfile, (req, res) => {
  res.json(req.user.profile);
});

// Profile completion %
router.get('/completion', authenticate, requireProfile, (req, res) => {
  const pct = computeCompletionPct(req.user.profile);
  const missing = PHASE2_FIELDS.filter(f => {
    const v = req.user.profile[f];
    if (v === null || v === undefined) return true;
    if (Array.isArray(v)) return v.length === 0;
    return false;
  });
  res.json({ percentage: pct, missingFields: missing });
});

// Snapshot history
router.get('/snapshots', authenticate, requireProfile, async (req, res) => {
  try {
    const snaps = await ProfileSnapshot.find({ userId: req.user._id })
      .sort({ snapshotAt: -1 }).limit(20).lean();
    res.json(snaps);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Periodic review submission
router.post('/review', authenticate, requireProfile, async (req, res) => {
  try {
    const updates = { 'profile.lastReviewedAt': new Date() };
    // Accept condition updates
    if (req.body.healthConditions) {
      const normConditions = req.body.healthConditions.map(c =>
        typeof c === 'string' ? { name: c, active: true } : { ...c, active: c.active !== false }
      );
      updates['profile.healthConditions'] = normConditions;
    }
    if (req.body.medications) {
      const normMeds = req.body.medications.map(m =>
        typeof m === 'string' ? { name: m, active: true } : { ...m, active: m.active !== false }
      );
      updates['profile.medications'] = normMeds;
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id, updates, { runValidators: true, new: true, lean: true }
    );
    await writeSnapshot(req.user._id, updated.profile, 'periodic-review');
    res.json({ success: true, lastReviewedAt: updated.profile.lastReviewedAt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH profile (settings + phase 2 updates)
router.patch('/', authenticate, requireProfile, async (req, res) => {
  try {
    const VALID_TEMPLATES = ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness'];
    if (req.body.planTemplate && !VALID_TEMPLATES.includes(req.body.planTemplate)) {
      return res.status(400).json({ error: `Invalid planTemplate: ${req.body.planTemplate}` });
    }

    const allowed = [
      'currentWeightKg', 'goalWeightKg', 'heightCm', 'age', 'dietType',
      'cuisinePreference', 'foodAllergies', 'fitnessLevel', 'equipmentAvailable',
      'healthConditions', 'medications', 'secondaryGoals', 'waterGoalL', 'planTemplate',
      // V2 fields
      'religion', 'languageCommunity', 'culturalFoodAvoidances', 'foodList',
      'workoutPreferences', 'workoutDaysPerWeek', 'workoutTime', 'yogaStyle',
      'reviewReminderDays'
    ];

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] === undefined) return;
      if (field === 'healthConditions') {
        updates[`profile.${field}`] = req.body[field].map(c =>
          typeof c === 'string' ? { name: c, active: true } : { ...c, active: c.active !== false }
        );
      } else if (field === 'medications') {
        updates[`profile.${field}`] = req.body[field].map(m =>
          typeof m === 'string' ? { name: m, active: true } : { ...m, active: m.active !== false }
        );
      } else {
        updates[`profile.${field}`] = req.body[field];
      }
    });

    // Recompute water goal if weight changed
    if (req.body.currentWeightKg) {
      updates['profile.waterGoalL'] = computeWaterGoal(req.body.currentWeightKg);
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id, updates, { runValidators: true, new: true, lean: true }
    );

    // Write snapshot on significant field changes
    const snapshotFields = ['foodList', 'culturalFoodAvoidances', 'healthConditions',
                            'medications', 'primaryGoal', 'religion', 'languageCommunity'];
    const hasSignificantChange = snapshotFields.some(f => req.body[f] !== undefined);
    if (hasSignificantChange) {
      await writeSnapshot(req.user._id, updated.profile, 'user-edit');
    }

    res.json(updated.profile);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest tests/routes/profile-v2.test.js --no-coverage
```

Expected: 4 passing

- [ ] **Step 5: Full suite**

```bash
npx jest --no-coverage
```

Expected: all passing

- [ ] **Step 6: Commit**

```bash
git add routes/profile.js tests/routes/profile-v2.test.js
git commit -m "feat: update profile routes — V2 fields, ProfileSnapshot writes, completion%, review endpoint"
```

---

### Task 5: Migration script for existing users

**Files:**
- Create: `scripts/migrate-profile-v2.js`
- Test: manual verification (not unit-tested — runs once against real DB)

- [ ] **Step 1: Create migration script**

Create `scripts/migrate-profile-v2.js`:

```js
#!/usr/bin/env node
/**
 * One-time migration: Profile V2
 * - healthConditions: [String] → [{ name, active: true }]
 * - medications: adds active: true, resolvedAt: null to each
 * - waterGoalL: recomputes from weight if not already set
 * Run: node scripts/migrate-profile-v2.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users`);

  let migrated = 0;
  for (const u of users) {
    const p = u.profile || {};
    const updates = {};

    // Migrate healthConditions: [String] → [{name, active: true}]
    if (Array.isArray(p.healthConditions) && p.healthConditions.length > 0) {
      const needsMigration = p.healthConditions.some(c => typeof c === 'string');
      if (needsMigration) {
        updates['profile.healthConditions'] = p.healthConditions.map(c =>
          typeof c === 'string' ? { name: c, active: true, resolvedAt: null } : c
        );
      }
    }

    // Migrate medications: add active + resolvedAt
    if (Array.isArray(p.medications) && p.medications.length > 0) {
      const needsMigration = p.medications.some(m => m.active === undefined);
      if (needsMigration) {
        updates['profile.medications'] = p.medications.map(m => ({
          ...m,
          active: m.active !== undefined ? m.active : true,
          resolvedAt: m.resolvedAt || null
        }));
      }
    }

    // Recompute waterGoalL if missing or still at default + weight available
    if (p.currentWeightKg && (!p.waterGoalL || p.waterGoalL === 2.5)) {
      updates['profile.waterGoalL'] = Math.round((p.currentWeightKg * 30) / 1000 * 10) / 10;
    }

    // Initialise new empty fields
    if (!p.foodList)                updates['profile.foodList']                = [];
    if (!p.culturalFoodAvoidances)  updates['profile.culturalFoodAvoidances']  = [];
    if (!p.workoutPreferences)      updates['profile.workoutPreferences']      = [];
    if (!p.reviewReminderDays)      updates['profile.reviewReminderDays']      = 60;

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(u._id, updates);
      migrated++;
      console.log(`  Migrated: ${u.email}`);
    }
  }

  console.log(`\n✅ Done — migrated ${migrated}/${users.length} users`);
  await mongoose.disconnect();
}

migrate().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Dry-run on local DB**

```bash
cd /Users/kkondoju/projects/health-dashboard
node scripts/migrate-profile-v2.js
```

Expected output:
```
✅ Connected
Found N users
  Migrated: admin@health.com
✅ Done — migrated N/N users
```

- [ ] **Step 3: Verify migration result**

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await User.find().lean();
  users.forEach(u => {
    const p = u.profile || {};
    console.log(u.email, '| conditions:', JSON.stringify(p.healthConditions?.slice(0,1)));
    console.log(u.email, '| waterGoal:', p.waterGoalL, '| foodList:', p.foodList?.length);
  });
  mongoose.disconnect();
});
"
```

Expected: conditions are objects with `{name, active}`, not strings.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-profile-v2.js
git commit -m "feat: add profile V2 migration script"
```

---

### Task 6: Register ProfileSnapshot model in server + smoke test

**Files:**
- Modify: `server.js` (ensure model is loaded)
- Verify: end-to-end manual check

- [ ] **Step 1: Ensure ProfileSnapshot loads on startup**

In `server.js`, after other model requires (or just before routes), add:

```js
// Ensure all models are registered
require('./models/ProfileSnapshot');
```

- [ ] **Step 2: Full suite**

```bash
npx jest --no-coverage
```

Expected: all passing (should be same count as before — 172+)

- [ ] **Step 3: Manual smoke test**

```bash
# Start server
node server.js &
sleep 3

# Register new test user
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"smoke@test.com","password":"Test1234"}' | python3 -m json.tool

# Admin approve (use existing admin token)
# Then complete onboarding and check snapshots
```

- [ ] **Step 4: Commit**

```bash
git add server.js
git commit -m "chore: ensure ProfileSnapshot model registered on startup"
```

---

## Plan 1 Complete

After all 6 tasks pass tests and commit, the data foundation is in place:
- User model has all V2 fields
- `healthConditions` and `medications` are structured objects with `active/resolvedAt`
- `ProfileSnapshot` collection records every significant profile change
- `/api/profile` PATCH, onboarding, `/completion`, `/snapshots`, `/review` all work
- Migration script backfills existing users
- All 172+ existing tests still pass

**Next plan:** `docs/superpowers/plans/2026-06-27-profile-onboarding-v2-p2-wizard.md` — Onboarding wizard redesign + Phase 2 "Complete Your Profile" page.
