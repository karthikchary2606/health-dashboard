# User Health Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the single-user hardcoded health tracker into a multi-user platform where every piece of content (diet, workout, cardio, grocery, checklist, guidelines) is generated at request time from server-side plan templates using each user's stored health profile.

**Architecture:** Profile-Driven API — plan data is computed server-side from template functions keyed by `planTemplate` field; nothing is stored in MongoDB except the profile itself. A 6-step onboarding wizard captures the profile on first login. All frontend JS files are rewritten to pull data from a `planCache` global instead of hardcoded constants.

**Tech Stack:** Node.js/Express, MongoDB/Mongoose, JWT, Jest + Supertest + mongodb-memory-server (new), vanilla JS (no bundler), existing plain-script pattern.

**Spec:** `docs/superpowers/specs/2026-06-26-user-health-profiles-design.md`
**Domain glossary:** `CONTEXT.md`

---

## File Map

### New files
| Path | Responsibility |
|------|----------------|
| `middleware/authenticate.js` | Deep auth: JWT decode + DB User load + isApproved check |
| `middleware/requireProfile.js` | Blocks routes until profileComplete=true; admin bypass |
| `lib/computeStats.js` | Pure function: `computeStats(logs, profile)` → stats object |
| `server/templates/_interface.js` | JSDoc contract for all template modules |
| `server/templates/weight-loss.js` | Full 6-month diet/workout/cardio/grocery/checklist for weight-loss goal |
| `server/templates/muscle-gain.js` | Month 1 full + months 2-6 stubs |
| `server/templates/maintenance.js` | Month 1 full + months 2-6 stubs |
| `server/templates/general-fitness.js` | Month 1 full + months 2-6 stubs |
| `routes/profile.js` | POST /onboarding, GET /, PATCH /, GET /plan |
| `public/js/planCache.js` | `window.planCache` global — caches GET /api/profile/plan Promise |
| `public/onboarding.html` | 6-step wizard HTML+JS |
| `public/settings.html` | Profile edit + plan switch + checklist reset |
| `scripts/migrate-karthik-profile.js` | One-time: set Karthik's profile fields + profileComplete=true |
| `tests/setup.js` | Jest/mongodb-memory-server global setup |
| `tests/middleware/authenticate.test.js` | authenticate middleware unit tests |
| `tests/middleware/requireProfile.test.js` | requireProfile middleware unit tests |
| `tests/lib/computeStats.test.js` | computeStats pure function tests |
| `tests/routes/profile.test.js` | /api/profile route integration tests |
| `tests/templates/weight-loss.test.js` | Template output shape tests |

### Modified files
| Path | Changes |
|------|---------|
| `models/User.js` | Add profile sub-fields + profileComplete + waterGoalL |
| `middleware/auth.js` | Replaced by authenticate.js (delete verifyToken, keep file for one export pointing to new file during transition) |
| `routes/logs.js` | Use computeStats; add GET /data/weekly-summary |
| `routes/checklist.js` | Replace DEFAULT_ITEMS with getDefaultChecklist(profile) |
| `routes/auth.js` | Register requireProfile on protected endpoints |
| `server.js` | Mount routes/profile.js |
| `public/js/api.js` | Return `{ ok, status, data }`; handle 403→/onboarding redirect |
| `public/js/diet.js` | Remove MONTHLY_DIET; render from planCache |
| `public/js/workout.js` | Remove WORKOUT_PLAN/WORKOUT_PHASES/PHASE_TASKS; render from planCache |
| `public/js/cardio.js` | Remove CARDIO_TABLE/CARDIO_PHASES/HR_ZONES; render from planCache |
| `public/js/grocery.js` | Remove GROCERY_PLAN; render from planCache |
| `public/js/guidelines.js` | Remove SEEDS/SUPP_TIMING; render medications from planCache |
| `public/js/dashboard.js` | Remove PROGRAM_START; use planCache.currentPhase/currentMonth; add BMI+TDEE card, weekly summary card |
| `public/js/progress.js` | Replace hardcoded 75/95 with planCache profile fields |
| `public/js/auth.js` | Delete getUserPhaseIndex(), getUserMonthIndex(); add 403 redirect |
| `package.json` | Add Jest + Supertest + mongodb-memory-server devDependencies + test script |

---

## Phase 1 — Test Infrastructure, Data Model, Auth Middleware

### Task 1: Install test framework

**Files:**
- Modify: `package.json`
- Create: `tests/setup.js`

- [ ] **Step 1: Install packages**

```bash
npm install --save-dev jest@^29 supertest@^7 mongodb-memory-server@^10
```

- [ ] **Step 2: Add test config to package.json**

In `package.json`, add inside the root object:
```json
"scripts": {
  "start": "node server.js",
  "test": "jest --runInBand --forceExit"
},
"jest": {
  "testEnvironment": "node",
  "globalSetup": "./tests/setup.js",
  "testTimeout": 30000
}
```

- [ ] **Step 3: Create tests/setup.js**

```js
// tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

module.exports = async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret';
  global.__MONGOD__ = mongod;
};
```

Also create `tests/teardown.js`:
```js
module.exports = async () => {
  if (global.__MONGOD__) await global.__MONGOD__.stop();
};
```

Add `"globalTeardown": "./tests/teardown.js"` to jest config in package.json.

- [ ] **Step 4: Verify Jest runs**

```bash
npm test -- --passWithNoTests
```
Expected: `Test Suites: 0 passed` with no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json tests/setup.js tests/teardown.js
git commit -m "chore: install Jest + Supertest + mongodb-memory-server"
```

---

### Task 2: Extend User schema

**Files:**
- Modify: `models/User.js`

- [ ] **Step 1: Read current schema**

```bash
cat models/User.js
```

- [ ] **Step 2: Replace models/User.js with extended schema**

```js
const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: String,
  timing: String
}, { _id: false });

const profileSchema = new mongoose.Schema({
  // Existing fields (keep as-is)
  age: Number,
  heightCm: Number,
  startWeightKg: Number,
  goalWeightKg: Number,
  startDate: Date,
  dietaryPreferences: [String],
  // New fields
  primaryGoal: {
    type: String,
    enum: ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness']
  },
  secondaryGoals: [String],
  currentWeightKg: Number,
  dietType: {
    type: String,
    enum: ['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian']
  },
  cuisinePreference: {
    type: String,
    enum: ['south-indian', 'north-indian', 'continental', 'mixed'],
    default: 'mixed'
  },
  foodAllergies: [String],
  fitnessLevel: {
    type: String,
    enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active']
  },
  equipmentAvailable: [String],
  healthConditions: [String],
  medications: [medicationSchema],
  planTemplate: {
    type: String,
    enum: ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness']
  },
  waterGoalL: { type: Number, default: 2.5 }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  profileComplete: { type: Boolean, default: false },
  profile: { type: profileSchema, default: () => ({}) }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

- [ ] **Step 3: Verify no existing tests break**

```bash
npm test -- --passWithNoTests
```

- [ ] **Step 4: Commit**

```bash
git add models/User.js
git commit -m "feat(schema): extend User profile with health profile fields + profileComplete"
```

---

### Task 3: authenticate middleware (replaces verifyToken)

**Files:**
- Create: `middleware/authenticate.js`
- Create: `tests/middleware/authenticate.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/middleware/authenticate.test.js`:
```js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const authenticate = require('../../middleware/authenticate');
const User = require('../../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

function makeReqRes(token) {
  const req = { headers: { authorization: token ? `Bearer ${token}` : undefined } };
  const res = {
    _status: null,
    _json: null,
    status(code) { this._status = code; return this; },
    json(data) { this._json = data; return this; }
  };
  return { req, res };
}

test('rejects request with no token', async () => {
  const { req, res } = makeReqRes(null);
  const next = jest.fn();
  await authenticate(req, res, next);
  expect(res._status).toBe(401);
  expect(next).not.toHaveBeenCalled();
});

test('rejects request with invalid token', async () => {
  const { req, res } = makeReqRes('bad-token');
  const next = jest.fn();
  await authenticate(req, res, next);
  expect(res._status).toBe(401);
});

test('rejects unapproved user', async () => {
  const user = await User.create({
    name: 'Test', email: 'unapp@test.com',
    password: 'x', isApproved: false
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const { req, res } = makeReqRes(token);
  const next = jest.fn();
  await authenticate(req, res, next);
  expect(res._status).toBe(403);
  expect(next).not.toHaveBeenCalled();
});

test('attaches full user doc and calls next for approved user', async () => {
  const user = await User.create({
    name: 'Approved', email: 'app@test.com',
    password: 'x', isApproved: true
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const { req, res } = makeReqRes(token);
  const next = jest.fn();
  await authenticate(req, res, next);
  expect(next).toHaveBeenCalled();
  expect(req.user).toBeDefined();
  expect(req.user.email).toBe('app@test.com');
  expect(req.user.profileComplete).toBeDefined();
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- tests/middleware/authenticate.test.js
```
Expected: FAIL — `Cannot find module '../../middleware/authenticate'`

- [ ] **Step 3: Implement authenticate.js**

Create `middleware/authenticate.js`:
```js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const user = await User.findById(payload.id).lean();
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (!user.isApproved) return res.status(403).json({ error: 'Account pending approval' });
  req.user = user;
  next();
}

module.exports = authenticate;
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- tests/middleware/authenticate.test.js
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add middleware/authenticate.js tests/middleware/authenticate.test.js
git commit -m "feat(auth): add authenticate middleware — loads full User doc from DB"
```

---

### Task 4: requireProfile middleware

**Files:**
- Create: `middleware/requireProfile.js`
- Create: `tests/middleware/requireProfile.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/middleware/requireProfile.test.js`:
```js
const requireProfile = require('../../middleware/requireProfile');

function fakeReq(profileComplete, isAdmin) {
  return { user: { profileComplete, isAdmin } };
}

function fakeRes() {
  return {
    _status: null, _json: null,
    status(c) { this._status = c; return this; },
    json(d) { this._json = d; return this; }
  };
}

test('blocks user with incomplete profile', () => {
  const req = fakeReq(false, false);
  const res = fakeRes();
  const next = jest.fn();
  requireProfile(req, res, next);
  expect(res._status).toBe(403);
  expect(res._json).toMatchObject({ redirect: '/onboarding.html' });
  expect(next).not.toHaveBeenCalled();
});

test('allows user with complete profile', () => {
  const req = fakeReq(true, false);
  const res = fakeRes();
  const next = jest.fn();
  requireProfile(req, res, next);
  expect(next).toHaveBeenCalled();
});

test('admin bypasses profileComplete check', () => {
  const req = fakeReq(false, true);
  const res = fakeRes();
  const next = jest.fn();
  requireProfile(req, res, next);
  expect(next).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- tests/middleware/requireProfile.test.js
```
Expected: FAIL — `Cannot find module '../../middleware/requireProfile'`

- [ ] **Step 3: Implement requireProfile.js**

Create `middleware/requireProfile.js`:
```js
function requireProfile(req, res, next) {
  if (req.user.isAdmin || req.user.profileComplete) return next();
  return res.status(403).json({ error: 'Profile incomplete', redirect: '/onboarding.html' });
}

module.exports = requireProfile;
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- tests/middleware/requireProfile.test.js
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add middleware/requireProfile.js tests/middleware/requireProfile.test.js
git commit -m "feat(auth): add requireProfile middleware — admin bypass, 403 with redirect"
```

---

### Task 5: Wire new middleware into all routes + register profile route

**Files:**
- Modify: `routes/logs.js`, `routes/checklist.js`, `routes/breathing.js`, `routes/auth.js` (any protected routes using old verifyToken)
- Modify: `server.js`

- [ ] **Step 1: Find all verifyToken usages**

```bash
grep -rn "verifyToken\|middleware/auth" routes/ server.js
```

- [ ] **Step 2: Replace verifyToken with authenticate + requireProfile in each route file**

For every route file that does:
```js
const { verifyToken } = require('../middleware/auth');
// ...
router.get('/something', verifyToken, handler);
```

Change to:
```js
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
// ...
router.get('/something', authenticate, requireProfile, handler);
```

Exception: Admin routes use `authenticate + requireAdmin` WITHOUT requireProfile:
```js
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');
router.get('/admin-thing', authenticate, requireAdmin, handler);
```

- [ ] **Step 3: Register profile route in server.js**

In `server.js`, add with other route mounts:
```js
const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);
```

(routes/profile.js doesn't exist yet — add the mount now, implement the route in Task 14. The app will throw on startup if profile.js is missing, so create a stub immediately after adding the mount.)

Create stub `routes/profile.js`:
```js
const express = require('express');
const router = express.Router();
// TODO: implement in Task 14
module.exports = router;
```

- [ ] **Step 4: Start server and verify it starts**

```bash
node server.js &
sleep 2
curl -s http://localhost:3000/api/health || echo "check /api or root route"
kill %1
```
Expected: server starts without crashing.

- [ ] **Step 5: Commit**

```bash
git add routes/ server.js middleware/
git commit -m "feat(auth): wire authenticate+requireProfile into all routes; mount /api/profile"
```

---

### Task 6: Migration script for Karthik's existing account

**Files:**
- Create: `scripts/migrate-karthik-profile.js`

- [ ] **Step 1: Create migration script**

Create `scripts/migrate-karthik-profile.js`:
```js
#!/usr/bin/env node
/**
 * One-time migration: set Karthik's health profile and mark profileComplete.
 * Run: MONGO_URI=<uri> node scripts/migrate-karthik-profile.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const TARGET_EMAIL = 'karthik.chary2606@gmail.com';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.error(`FATAL: User not found with email ${TARGET_EMAIL}`);
    process.exit(1);
  }

  user.profileComplete = true;
  user.profile = {
    ...user.profile,
    primaryGoal: 'weight-loss',
    currentWeightKg: 95,
    startWeightKg: 95,
    goalWeightKg: 75,
    heightCm: user.profile.heightCm || 175,
    age: user.profile.age || 30,
    dietType: 'non-vegetarian',
    cuisinePreference: 'south-indian',
    foodAllergies: [],
    fitnessLevel: 'lightly-active',
    equipmentAvailable: ['dumbbells', 'resistance-bands'],
    healthConditions: ['lower-back-pain'],
    medications: [
      { name: 'Thyronorm', dosage: '12.5mg', timing: 'morning-empty-stomach' }
    ],
    planTemplate: 'weight-loss',
    waterGoalL: 2.5,
    startDate: user.profile.startDate || new Date('2025-01-01')
  };

  await user.save();
  console.log(`SUCCESS: Profile updated for ${TARGET_EMAIL}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify script is syntactically valid**

```bash
node --check scripts/migrate-karthik-profile.js
```
Expected: no output (clean parse).

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-karthik-profile.js
git commit -m "chore: add migration script for Karthik's health profile"
```

---

## Phase 2 — Plan Templates + Profile API

### Task 7: computeStats pure function

**Files:**
- Create: `lib/computeStats.js`
- Create: `tests/lib/computeStats.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/computeStats.test.js`:
```js
const computeStats = require('../../lib/computeStats');

const baseProfile = { waterGoalL: 2.5 };

function makeLog(overrides) {
  return {
    date: new Date(),
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    waterIntake: 0,
    workoutCompleted: false,
    cardioCompleted: false,
    mood: null,
    weight: null,
    ...overrides
  };
}

test('returns zero stats for empty logs', () => {
  const stats = computeStats([], baseProfile);
  expect(stats.avgCalories).toBe(0);
  expect(stats.workoutCompletionRate).toBe(0);
  expect(stats.waterGoalMetDays).toBe(0);
});

test('calculates avgCalories correctly', () => {
  const logs = [makeLog({ calories: 1800 }), makeLog({ calories: 2200 })];
  const stats = computeStats(logs, baseProfile);
  expect(stats.avgCalories).toBe(2000);
});

test('uses profile.waterGoalL as threshold (not hardcoded 3)', () => {
  const logs = [makeLog({ waterIntake: 2.6 }), makeLog({ waterIntake: 2.3 })];
  // waterGoalL = 2.5: first log meets goal, second does not
  const stats = computeStats(logs, { waterGoalL: 2.5 });
  expect(stats.waterGoalMetDays).toBe(1);
});

test('calculates workoutCompletionRate as percentage', () => {
  const logs = [
    makeLog({ workoutCompleted: true }),
    makeLog({ workoutCompleted: true }),
    makeLog({ workoutCompleted: false })
  ];
  const stats = computeStats(logs, baseProfile);
  expect(stats.workoutCompletionRate).toBeCloseTo(66.67, 1);
});

test('returns latestWeight from most recent log with a weight value', () => {
  const logs = [
    makeLog({ date: new Date('2025-01-01'), weight: 94 }),
    makeLog({ date: new Date('2025-01-03'), weight: null }),
    makeLog({ date: new Date('2025-01-02'), weight: 93 })
  ];
  const stats = computeStats(logs, baseProfile);
  expect(stats.latestWeight).toBe(94); // most recent by date
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- tests/lib/computeStats.test.js
```
Expected: FAIL — `Cannot find module '../../lib/computeStats'`

- [ ] **Step 3: Implement lib/computeStats.js**

Create `lib/computeStats.js`:
```js
/**
 * Compute aggregate health stats from an array of HealthLog documents.
 * @param {Object[]} logs - HealthLog docs (plain objects or Mongoose docs)
 * @param {Object} profile - User.profile sub-doc
 * @param {number} profile.waterGoalL - daily water goal in litres
 * @returns {Object} stats
 */
function computeStats(logs, profile) {
  const waterGoal = (profile && profile.waterGoalL) || 2.5;

  if (!logs || logs.length === 0) {
    return {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      workoutCompletionRate: 0,
      cardioCompletionRate: 0,
      waterGoalMetDays: 0,
      latestWeight: null,
      totalLogs: 0
    };
  }

  const n = logs.length;
  const sum = (field) => logs.reduce((acc, l) => acc + (Number(l[field]) || 0), 0);

  const workoutDone = logs.filter(l => l.workoutCompleted).length;
  const cardioDone = logs.filter(l => l.cardioCompleted).length;
  const waterMetDays = logs.filter(l => (Number(l.waterIntake) || 0) >= waterGoal).length;

  const logsWithWeight = logs
    .filter(l => l.weight != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    avgCalories: Math.round(sum('calories') / n),
    avgProtein: Math.round(sum('protein') / n),
    avgCarbs: Math.round(sum('carbs') / n),
    avgFat: Math.round(sum('fat') / n),
    workoutCompletionRate: parseFloat(((workoutDone / n) * 100).toFixed(2)),
    cardioCompletionRate: parseFloat(((cardioDone / n) * 100).toFixed(2)),
    waterGoalMetDays: waterMetDays,
    latestWeight: logsWithWeight.length ? logsWithWeight[0].weight : null,
    totalLogs: n
  };
}

module.exports = computeStats;
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- tests/lib/computeStats.test.js
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/computeStats.js tests/lib/computeStats.test.js
git commit -m "feat(lib): add computeStats pure function — waterGoalL threshold from profile"
```

---

### Task 8: Update logs route to use computeStats + add weekly summary

**Files:**
- Modify: `routes/logs.js`

- [ ] **Step 1: Read current logs route**

```bash
cat routes/logs.js
```

- [ ] **Step 2: Replace inline stats logic with computeStats**

Find the GET /data/stats handler in routes/logs.js. At the top of the file add:
```js
const computeStats = require('../lib/computeStats');
```

Replace the inline averaging/threshold logic in the stats handler with:
```js
router.get('/data/stats', authenticate, requireProfile, async (req, res) => {
  try {
    const logs = await HealthLog.find({ userId: req.user._id }).lean();
    const stats = computeStats(logs, req.user.profile);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Add weekly summary endpoint**

Add after the stats route:
```js
router.get('/data/weekly-summary', authenticate, requireProfile, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: sevenDaysAgo }
    }).lean();
    const stats = computeStats(logs, req.user.profile);
    res.json({ period: 'last-7-days', ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 4: Verify server still starts**

```bash
node --check routes/logs.js
```

- [ ] **Step 5: Commit**

```bash
git add routes/logs.js
git commit -m "feat(logs): use computeStats; add GET /data/weekly-summary"
```

---

### Task 9: Template interface documentation

**Files:**
- Create: `server/templates/_interface.js`

- [ ] **Step 1: Create interface file**

```bash
mkdir -p server/templates
```

Create `server/templates/_interface.js`:
```js
/**
 * Plan Template Interface
 *
 * Every template module (weight-loss.js, muscle-gain.js, etc.) MUST export
 * the following functions. Each receives the full User.profile sub-doc.
 *
 * @module PlanTemplate
 */

/**
 * @typedef {Object} DayMeals
 * @property {string} breakfast
 * @property {string} lunch
 * @property {string} dinner
 * @property {string[]} snacks
 * @property {number} approxCalories
 */

/**
 * @typedef {Object} MonthDiet
 * @property {string} monthLabel  e.g. "Month 1 — Foundation"
 * @property {DayMeals[]} weekdays  7 items, index 0=Monday
 * @property {string[]} guidelines
 */

/**
 * @typedef {Object} WorkoutDay
 * @property {string} day
 * @property {string} focus
 * @property {Object[]} exercises  [{name, sets, reps, notes}]
 */

/**
 * @typedef {Object} MonthWorkout
 * @property {string} monthLabel
 * @property {WorkoutDay[]} schedule  7 items
 */

/**
 * @typedef {Object} CardioPlan
 * @property {string} monthLabel
 * @property {Object[]} sessions  [{day, type, duration, intensity}]
 * @property {Object} hrZones  {fat_burn, cardio, peak}
 */

/**
 * @typedef {Object} GroceryList
 * @property {string} monthLabel
 * @property {Object[]} categories  [{name, items: string[]}]
 */

/**
 * @typedef {Object} ChecklistItem
 * @property {string} category  e.g. "diet", "workout", "medication"
 * @property {string} text
 * @property {boolean} [isWeekly]
 */

/**
 * @typedef {Object} PlanMeta
 * @property {string} templateName
 * @property {number} totalMonths
 * @property {number} currentMonth  1-based, computed from startDate
 * @property {number} currentPhase  1-based phase index
 * @property {string} currentPhaseLabel
 * @property {Object[]} phases  [{label, months, description}]
 */

/**
 * Returns the diet plan for all months.
 * For stub months, return null in the array slot.
 * @param {Object} profile - User.profile
 * @returns {(MonthDiet|null)[]}  Length = totalMonths
 */
// exports.getDietPlan = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {(MonthWorkout|null)[]}
 */
// exports.getWorkoutPlan = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {(CardioPlan|null)[]}
 */
// exports.getCardioPlan = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {(GroceryList|null)[]}
 */
// exports.getGroceryList = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {ChecklistItem[]}
 */
// exports.getDefaultChecklist = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {PlanMeta}
 */
// exports.getPlanMeta = (profile) => { ... }
```

- [ ] **Step 2: Commit**

```bash
git add server/templates/_interface.js
git commit -m "docs(templates): add plan template interface contract"
```

---

### Task 10: weight-loss template — migrate all hardcoded data

**Files:**
- Create: `server/templates/weight-loss.js`
- Create: `tests/templates/weight-loss.test.js`

This is the largest task. The diet data lives in `public/js/diet.js` (MONTHLY_DIET), workout in `public/js/workout.js`, cardio in `public/js/cardio.js`, grocery in `public/js/grocery.js`, seeds/meds in `public/js/guidelines.js`.

- [ ] **Step 1: Read all source files**

```bash
cat public/js/diet.js
cat public/js/workout.js
cat public/js/cardio.js
cat public/js/grocery.js
cat public/js/guidelines.js
```

- [ ] **Step 2: Write failing shape tests**

Create `tests/templates/weight-loss.test.js`:
```js
const template = require('../../server/templates/weight-loss');

const baseProfile = {
  primaryGoal: 'weight-loss',
  cuisinePreference: 'south-indian',
  dietType: 'non-vegetarian',
  healthConditions: ['lower-back-pain'],
  medications: [{ name: 'Thyronorm', dosage: '12.5mg', timing: 'morning-empty-stomach' }],
  startDate: new Date('2025-01-01'),
  waterGoalL: 2.5
};

test('getDietPlan returns array of 6 items', () => {
  const plan = template.getDietPlan(baseProfile);
  expect(Array.isArray(plan)).toBe(true);
  expect(plan.length).toBe(6);
});

test('getDietPlan month 1 has required shape', () => {
  const [month1] = template.getDietPlan(baseProfile);
  expect(month1).not.toBeNull();
  expect(month1.monthLabel).toBeDefined();
  expect(Array.isArray(month1.weekdays)).toBe(true);
  expect(month1.weekdays.length).toBe(7);
  expect(month1.weekdays[0].breakfast).toBeDefined();
});

test('getWorkoutPlan returns 6 months, month 1 has exercises', () => {
  const plan = template.getWorkoutPlan(baseProfile);
  expect(plan.length).toBe(6);
  const month1 = plan[0];
  expect(Array.isArray(month1.schedule)).toBe(true);
  expect(month1.schedule.length).toBeGreaterThan(0);
});

test('getWorkoutPlan LBP condition: no deadlifts in month 1', () => {
  const plan = template.getWorkoutPlan(baseProfile);
  const allExercises = plan[0].schedule.flatMap(d => d.exercises.map(e => e.name.toLowerCase()));
  expect(allExercises.some(n => n.includes('deadlift'))).toBe(false);
});

test('getCardioPlan returns 6 items', () => {
  const plan = template.getCardioPlan(baseProfile);
  expect(plan.length).toBe(6);
});

test('getGroceryList returns 6 items', () => {
  const list = template.getGroceryList(baseProfile);
  expect(list.length).toBe(6);
});

test('getDefaultChecklist includes medication item from profile', () => {
  const items = template.getDefaultChecklist(baseProfile);
  const medItem = items.find(i => i.category === 'medication' && i.text.includes('Thyronorm'));
  expect(medItem).toBeDefined();
});

test('getPlanMeta returns correct totalMonths and phases', () => {
  const meta = template.getPlanMeta(baseProfile);
  expect(meta.totalMonths).toBe(6);
  expect(meta.templateName).toBe('weight-loss');
  expect(Array.isArray(meta.phases)).toBe(true);
});

test('getPlanMeta computes currentMonth correctly from startDate', () => {
  const profile = { ...baseProfile, startDate: new Date() };
  const meta = template.getPlanMeta(profile);
  expect(meta.currentMonth).toBe(1);
});
```

- [ ] **Step 3: Run to verify failure**

```bash
npm test -- tests/templates/weight-loss.test.js
```
Expected: FAIL — module not found.

- [ ] **Step 4: Implement server/templates/weight-loss.js**

Create `server/templates/weight-loss.js`. Copy all data from the public/js source files (identified in Step 1) into this server-side module.

Key implementation rules:
1. The file exports pure functions — no Express, no Mongoose imports.
2. `getDietPlan(profile)` — filter meal suggestions by `profile.cuisinePreference` (south-indian → use existing data as-is; other → add note "adapt to your cuisine").
3. `getWorkoutPlan(profile)` — filter out deadlifts and heavy squats if `profile.healthConditions.includes('lower-back-pain')`.
4. `getDefaultChecklist(profile)` — map `profile.medications` to checklist items: `{ category: 'medication', text: '💊 Take ${med.name} ${med.dosage} — ${med.timing}' }`.
5. `getPlanMeta(profile)` — compute `currentMonth` as: `Math.min(6, Math.max(1, Math.ceil((Date.now() - new Date(profile.startDate)) / (1000 * 60 * 60 * 24 * 30))))`. Return `currentPhase` as the phase index (1-based) for the current month using the WEIGHT_LOSS_PHASES definition.

The WEIGHT_LOSS_PHASES constant (copy from workout.js WORKOUT_PHASES, adapt names):
```js
const WEIGHT_LOSS_PHASES = [
  { label: 'Foundation', months: [1, 2], description: 'Build habits, reduce inflammation' },
  { label: 'Acceleration', months: [3, 4], description: 'Intensify training, track closely' },
  { label: 'Peak', months: [5, 6], description: 'Push toward goal weight' }
];
```

- [ ] **Step 5: Run tests — expect pass**

```bash
npm test -- tests/templates/weight-loss.test.js
```
Expected: 9 passed.

- [ ] **Step 6: Commit**

```bash
git add server/templates/weight-loss.js tests/templates/weight-loss.test.js
git commit -m "feat(templates): add weight-loss plan template — migrate all hardcoded data"
```

---

### Task 11: Stub templates for other 3 goals

**Files:**
- Create: `server/templates/muscle-gain.js`
- Create: `server/templates/maintenance.js`
- Create: `server/templates/general-fitness.js`

Each template follows the same interface as weight-loss.js but only Month 1 is fully authored; months 2–6 return null stubs.

- [ ] **Step 1: Create muscle-gain.js**

Create `server/templates/muscle-gain.js`:
```js
const PHASES = [
  { label: 'Foundation', months: [1, 2], description: 'Master form, progressive overload' },
  { label: 'Hypertrophy', months: [3, 4], description: 'Volume increase, caloric surplus' },
  { label: 'Strength', months: [5, 6], description: 'Heavy compounds, deload week' }
];

function getMonth1Diet(profile) {
  return {
    monthLabel: 'Month 1 — Foundation',
    weekdays: Array(7).fill(null).map((_, i) => ({
      breakfast: 'High-protein breakfast: 4 eggs + oats + banana',
      lunch: 'Rice + dal + chicken breast 200g + salad',
      dinner: 'Roti + paneer/fish + vegetables',
      snacks: ['Protein shake', 'Mixed nuts 30g'],
      approxCalories: 2800
    })),
    guidelines: [
      'Caloric surplus of ~300 kcal above TDEE',
      'Protein target: 1.8–2.2g per kg bodyweight',
      'Distribute protein across 4–5 meals'
    ]
  };
}

function getPlanMeta(profile) {
  const startDate = profile.startDate ? new Date(profile.startDate) : new Date();
  const monthsElapsed = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24 * 30));
  const currentMonth = Math.min(6, Math.max(1, monthsElapsed + 1));
  const phase = PHASES.find(p => p.months.includes(currentMonth)) || PHASES[0];
  return {
    templateName: 'muscle-gain',
    totalMonths: 6,
    currentMonth,
    currentPhase: PHASES.indexOf(phase) + 1,
    currentPhaseLabel: phase.label,
    phases: PHASES
  };
}

exports.getDietPlan = (profile) => [getMonth1Diet(profile), null, null, null, null, null];
exports.getWorkoutPlan = (profile) => [{
  monthLabel: 'Month 1 — Foundation',
  schedule: [
    { day: 'Monday', focus: 'Chest + Triceps', exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-10', notes: 'Progressive overload' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', notes: '' },
      { name: 'Tricep Dips', sets: 3, reps: '12', notes: '' }
    ]},
    { day: 'Tuesday', focus: 'Back + Biceps', exercises: [
      { name: 'Pull-ups', sets: 4, reps: '6-8', notes: 'Assisted if needed' },
      { name: 'Barbell Row', sets: 4, reps: '8-10', notes: '' },
      { name: 'Barbell Curl', sets: 3, reps: '10-12', notes: '' }
    ]},
    { day: 'Wednesday', focus: 'Rest / Active Recovery', exercises: [] },
    { day: 'Thursday', focus: 'Legs', exercises: [
      { name: 'Squat', sets: 4, reps: '8-10', notes: 'Full depth' },
      { name: 'Romanian Deadlift', sets: 3, reps: '10', notes: '' },
      { name: 'Leg Press', sets: 3, reps: '12', notes: '' }
    ]},
    { day: 'Friday', focus: 'Shoulders + Core', exercises: [
      { name: 'Overhead Press', sets: 4, reps: '8-10', notes: '' },
      { name: 'Lateral Raise', sets: 3, reps: '15', notes: '' },
      { name: 'Plank', sets: 3, reps: '60s', notes: '' }
    ]},
    { day: 'Saturday', focus: 'Full Body', exercises: [
      { name: 'Deadlift', sets: 3, reps: '5', notes: 'Heavy compound' },
      { name: 'Push-ups', sets: 3, reps: '15', notes: '' }
    ]},
    { day: 'Sunday', focus: 'Rest', exercises: [] }
  ]
}, null, null, null, null, null];
exports.getCardioPlan = (profile) => [{ monthLabel: 'Month 1', sessions: [], hrZones: {} }, null, null, null, null, null];
exports.getGroceryList = (profile) => [{ monthLabel: 'Month 1', categories: [
  { name: 'Proteins', items: ['Chicken breast', 'Eggs', 'Whey protein', 'Paneer'] },
  { name: 'Carbs', items: ['Rice', 'Oats', 'Sweet potato', 'Whole wheat roti'] },
  { name: 'Fats', items: ['Mixed nuts', 'Olive oil', 'Avocado'] }
]}, null, null, null, null, null];
exports.getDefaultChecklist = (profile) => {
  const items = [
    { category: 'diet', text: 'Hit daily protein target' },
    { category: 'workout', text: 'Complete strength session' },
    { category: 'recovery', text: 'Sleep 7-8 hours' }
  ];
  (profile.medications || []).forEach(med => {
    items.push({ category: 'medication', text: `💊 Take ${med.name} ${med.dosage} — ${med.timing}` });
  });
  return items;
};
exports.getPlanMeta = getPlanMeta;
```

- [ ] **Step 2: Create maintenance.js and general-fitness.js**

Create `server/templates/maintenance.js` and `server/templates/general-fitness.js` using the same structure but appropriate Month 1 content. The patterns are identical to muscle-gain.js — adjust `templateName`, `PHASES`, diet/workout content to match the goal.

`maintenance.js` Month 1 diet: balanced 2000-2200 kcal, no deficit/surplus. Workout: 3 days full-body circuit. `getPlanMeta` returns `templateName: 'maintenance'`.

`general-fitness.js` Month 1 diet: Mediterranean-style, ~2200 kcal. Workout: 4 days mixed cardio+strength. `getPlanMeta` returns `templateName: 'general-fitness'`.

Both use the same `getDefaultChecklist` medication logic as muscle-gain.js.

- [ ] **Step 3: Verify all templates load**

```bash
node -e "
  const wl = require('./server/templates/weight-loss');
  const mg = require('./server/templates/muscle-gain');
  const m  = require('./server/templates/maintenance');
  const gf = require('./server/templates/general-fitness');
  console.log('All templates load OK');
  console.log('WL months:', wl.getDietPlan({}).length);
  console.log('MG months:', mg.getDietPlan({}).length);
"
```
Expected: All templates load OK

- [ ] **Step 4: Commit**

```bash
git add server/templates/
git commit -m "feat(templates): add muscle-gain, maintenance, general-fitness stub templates"
```

---

### Task 12: Profile routes

**Files:**
- Modify: `routes/profile.js` (currently a stub from Task 5)
- Create: `tests/routes/profile.test.js`

- [ ] **Step 1: Write failing integration tests**

Create `tests/routes/profile.test.js`:
```js
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');

beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI); });
afterEach(async () => { await User.deleteMany({}); });
afterAll(async () => { await mongoose.disconnect(); });

async function createUser(overrides = {}) {
  return User.create({
    name: 'Test User', email: 'test@test.com',
    password: 'hashed', isApproved: true,
    ...overrides
  });
}

function authHeader(userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

test('POST /api/profile/onboarding sets profileComplete=true', async () => {
  const user = await createUser({ profileComplete: false });
  const body = {
    primaryGoal: 'weight-loss',
    currentWeightKg: 90,
    goalWeightKg: 75,
    heightCm: 175,
    age: 30,
    dietType: 'non-vegetarian',
    cuisinePreference: 'south-indian',
    fitnessLevel: 'lightly-active',
    healthConditions: [],
    medications: [],
    waterGoalL: 2.5
  };
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send(body);
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  expect(updated.profileComplete).toBe(true);
  expect(updated.profile.primaryGoal).toBe('weight-loss');
});

test('GET /api/profile returns user profile', async () => {
  const user = await createUser({ profileComplete: true, profile: { primaryGoal: 'weight-loss' } });
  const res = await request(app)
    .get('/api/profile')
    .set(authHeader(user._id));
  expect(res.status).toBe(200);
  expect(res.body.primaryGoal).toBe('weight-loss');
});

test('PATCH /api/profile updates profile field', async () => {
  const user = await createUser({ profileComplete: true });
  const res = await request(app)
    .patch('/api/profile')
    .set(authHeader(user._id))
    .send({ currentWeightKg: 88 });
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  expect(updated.profile.currentWeightKg).toBe(88);
});

test('GET /api/profile/plan returns plan with meta', async () => {
  const user = await createUser({
    profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss',
      planTemplate: 'weight-loss',
      cuisinePreference: 'south-indian',
      healthConditions: [],
      medications: [],
      startDate: new Date(),
      waterGoalL: 2.5
    }
  });
  const res = await request(app)
    .get('/api/profile/plan')
    .set(authHeader(user._id));
  expect(res.status).toBe(200);
  expect(res.body.meta).toBeDefined();
  expect(res.body.diet).toBeDefined();
  expect(res.body.workout).toBeDefined();
});

test('POST /api/profile/onboarding accessible even when profileComplete=false', async () => {
  const user = await createUser({ profileComplete: false });
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send({ primaryGoal: 'maintenance', currentWeightKg: 80, goalWeightKg: 80,
            heightCm: 170, age: 28, dietType: 'vegetarian', cuisinePreference: 'mixed',
            fitnessLevel: 'moderately-active', healthConditions: [], medications: [], waterGoalL: 2.5 });
  expect(res.status).toBe(200);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- tests/routes/profile.test.js
```
Expected: FAIL — routes return 404 or stub response.

- [ ] **Step 3: Implement routes/profile.js**

Replace the stub `routes/profile.js` with:
```js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const User = require('../models/User');

const TEMPLATES = {
  'weight-loss': require('../server/templates/weight-loss'),
  'muscle-gain': require('../server/templates/muscle-gain'),
  'maintenance': require('../server/templates/maintenance'),
  'general-fitness': require('../server/templates/general-fitness')
};

// Onboarding: exempt from requireProfile (user doesn't have profile yet)
router.post('/onboarding', authenticate, async (req, res) => {
  try {
    const {
      primaryGoal, currentWeightKg, goalWeightKg, heightCm, age,
      dietType, cuisinePreference, foodAllergies, fitnessLevel,
      equipmentAvailable, healthConditions, medications,
      secondaryGoals, waterGoalL
    } = req.body;

    const planTemplate = primaryGoal; // 1:1 mapping for now

    await User.findByIdAndUpdate(req.user._id, {
      profileComplete: true,
      'profile.primaryGoal': primaryGoal,
      'profile.planTemplate': planTemplate,
      'profile.currentWeightKg': currentWeightKg,
      'profile.goalWeightKg': goalWeightKg,
      'profile.heightCm': heightCm,
      'profile.age': age,
      'profile.dietType': dietType,
      'profile.cuisinePreference': cuisinePreference || 'mixed',
      'profile.foodAllergies': foodAllergies || [],
      'profile.fitnessLevel': fitnessLevel,
      'profile.equipmentAvailable': equipmentAvailable || [],
      'profile.healthConditions': healthConditions || [],
      'profile.medications': medications || [],
      'profile.secondaryGoals': secondaryGoals || [],
      'profile.waterGoalL': waterGoalL || 2.5,
      'profile.startDate': new Date()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, requireProfile, async (req, res) => {
  res.json(req.user.profile);
});

router.patch('/', authenticate, requireProfile, async (req, res) => {
  try {
    const updates = {};
    const allowed = [
      'currentWeightKg', 'goalWeightKg', 'heightCm', 'age', 'dietType',
      'cuisinePreference', 'foodAllergies', 'fitnessLevel', 'equipmentAvailable',
      'healthConditions', 'medications', 'secondaryGoals', 'waterGoalL', 'planTemplate'
    ];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[`profile.${field}`] = req.body[field];
    });
    await User.findByIdAndUpdate(req.user._id, updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/plan', authenticate, requireProfile, async (req, res) => {
  try {
    const profile = req.user.profile;
    const templateKey = profile.planTemplate || profile.primaryGoal || 'weight-loss';
    const template = TEMPLATES[templateKey];
    if (!template) return res.status(400).json({ error: `Unknown template: ${templateKey}` });

    res.json({
      meta: template.getPlanMeta(profile),
      diet: template.getDietPlan(profile),
      workout: template.getWorkoutPlan(profile),
      cardio: template.getCardioPlan(profile),
      grocery: template.getGroceryList(profile),
      checklist: template.getDefaultChecklist(profile)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 4: Make sure server.js exports app (needed for Supertest)**

Open `server.js`. At the end, check if it has `module.exports = app`. If not:
```js
// At the bottom of server.js, replace:
app.listen(PORT, () => { ... });
// With:
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server on port ${PORT}`));
}
module.exports = app;
```

- [ ] **Step 5: Run tests — expect pass**

```bash
npm test -- tests/routes/profile.test.js
```
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add routes/profile.js server.js tests/routes/profile.test.js
git commit -m "feat(api): implement /api/profile routes — onboarding, GET, PATCH, GET /plan"
```

---

## Phase 3 — Frontend Migration

### Task 13: Deepen apiFetch

**Files:**
- Modify: `public/js/api.js`

- [ ] **Step 1: Read current api.js**

```bash
cat public/js/api.js
```

- [ ] **Step 2: Replace api.js**

```js
/**
 * apiFetch — wraps fetch with auth header and unified response shape.
 *
 * Returns: { ok: boolean, status: number, data: any }
 *
 * Handles:
 *   401 → redirect to /login.html
 *   403 with redirect → redirect to that path (e.g. /onboarding.html)
 *   503 → show offline toast
 */
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    showToast('You appear to be offline. Please check your connection.');
    return { ok: false, status: 0, data: null };
  }

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
    return { ok: false, status: 401, data: null };
  }

  let data = null;
  try { data = await response.json(); } catch { /* empty body */ }

  if (response.status === 403 && data && data.redirect) {
    window.location.href = data.redirect;
    return { ok: false, status: 403, data };
  }

  return { ok: response.ok, status: response.status, data };
}

function showToast(message) {
  const existing = document.getElementById('api-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'api-toast';
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:6px;z-index:9999;font-size:14px;';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
```

- [ ] **Step 3: Update all callers of apiFetch throughout public/js/ to use destructured response**

Search for all usages:
```bash
grep -rn "apiFetch" public/js/
```

Any call that previously did:
```js
const data = await apiFetch('/api/something');
```
Must now be:
```js
const { ok, data } = await apiFetch('/api/something');
if (!ok) return;
// use data
```

Update every call site in: auth.js, dashboard.js, logs.js (if it uses apiFetch), and any other file that calls it.

- [ ] **Step 4: Commit**

```bash
git add public/js/api.js public/js/
git commit -m "feat(frontend): deepen apiFetch — returns {ok,status,data}; handles 403 redirect"
```

---

### Task 14: planCache global

**Files:**
- Create: `public/js/planCache.js`

- [ ] **Step 1: Create planCache.js**

```js
/**
 * planCache — singleton that fetches and caches GET /api/profile/plan.
 *
 * Usage:
 *   const plan = await window.planCache.getPlan();
 *   plan.meta.currentMonth  // 1-based
 *   plan.diet[0]            // Month 1 diet (or null if stub)
 *   plan.workout[0]         // Month 1 workout
 *
 *   window.planCache.invalidate();  // call after profile changes
 */
window.planCache = (() => {
  let _promise = null;

  async function getPlan() {
    if (!_promise) {
      _promise = apiFetch('/api/profile/plan').then(({ ok, data }) => {
        if (!ok) {
          _promise = null;
          return null;
        }
        return data;
      });
    }
    return _promise;
  }

  function invalidate() {
    _promise = null;
  }

  return { getPlan, invalidate };
})();
```

- [ ] **Step 2: Add planCache.js script tag to all protected HTML pages**

Check which HTML files load the other JS:
```bash
grep -rn "api.js" public/*.html
```

Add `<script src="/js/planCache.js"></script>` AFTER the `api.js` script tag in every protected HTML page (dashboard.html, diet.html, workout.html, cardio.html, grocery.html, guidelines.html, progress.html).

- [ ] **Step 3: Commit**

```bash
git add public/js/planCache.js public/*.html
git commit -m "feat(frontend): add planCache global — caches GET /api/profile/plan"
```

---

### Task 15: Rewrite diet.js

**Files:**
- Modify: `public/js/diet.js`

- [ ] **Step 1: Read current diet.js render logic (non-data parts)**

```bash
grep -n "function\|render\|document\." public/js/diet.js | head -40
```

- [ ] **Step 2: Replace diet.js**

Keep the render functions but source data from planCache instead of MONTHLY_DIET:

```js
// public/js/diet.js — rewritten to use planCache
document.addEventListener('DOMContentLoaded', async () => {
  const plan = await window.planCache.getPlan();
  if (!plan) return; // apiFetch handles redirect

  const { meta, diet } = plan;
  renderDiet(diet, meta);
});

function renderDiet(diet, meta) {
  const container = document.getElementById('diet-container');
  if (!container) return;

  const currentIdx = (meta.currentMonth || 1) - 1;
  const monthData = diet[currentIdx];

  if (!monthData) {
    container.innerHTML = `<div class="alert">
      Diet plan for Month ${meta.currentMonth} is coming soon.
      Currently showing Month 1 data.
    </div>`;
    renderMonthDiet(diet[0], container);
    return;
  }

  renderMonthDiet(monthData, container);
}

function renderMonthDiet(monthData, container) {
  if (!monthData) {
    container.innerHTML = '<p>No diet data available.</p>';
    return;
  }

  let html = `<h2>${monthData.monthLabel}</h2>`;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  monthData.weekdays.forEach((day, i) => {
    html += `
      <div class="day-card">
        <h3>${days[i]}</h3>
        <div class="meal"><strong>Breakfast:</strong> ${day.breakfast}</div>
        <div class="meal"><strong>Lunch:</strong> ${day.lunch}</div>
        <div class="meal"><strong>Dinner:</strong> ${day.dinner}</div>
        <div class="meal"><strong>Snacks:</strong> ${(day.snacks || []).join(', ')}</div>
        <div class="calories">~${day.approxCalories} kcal</div>
      </div>`;
  });

  if (monthData.guidelines && monthData.guidelines.length) {
    html += `<div class="guidelines"><h3>Guidelines</h3><ul>`;
    monthData.guidelines.forEach(g => { html += `<li>${g}</li>`; });
    html += `</ul></div>`;
  }

  container.innerHTML = html;
}
```

- [ ] **Step 3: Commit**

```bash
git add public/js/diet.js
git commit -m "feat(frontend): rewrite diet.js — remove MONTHLY_DIET, render from planCache"
```

---

### Task 16: Rewrite workout.js

**Files:**
- Modify: `public/js/workout.js`

- [ ] **Step 1: Replace workout.js**

```js
// public/js/workout.js — rewritten to use planCache
document.addEventListener('DOMContentLoaded', async () => {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  const { meta, workout } = plan;
  renderWorkout(workout, meta);
  renderPhaseTimeline(meta);
});

function renderWorkout(workout, meta) {
  const container = document.getElementById('workout-container');
  if (!container) return;

  const currentIdx = (meta.currentMonth || 1) - 1;
  const monthData = workout[currentIdx] || workout[0];

  if (!monthData) {
    container.innerHTML = '<p>No workout data available.</p>';
    return;
  }

  let html = `<h2>${monthData.monthLabel}</h2>`;

  monthData.schedule.forEach(day => {
    if (!day.exercises || day.exercises.length === 0) {
      html += `<div class="day-card rest"><h3>${day.day}</h3><p>${day.focus}</p></div>`;
      return;
    }
    html += `<div class="day-card"><h3>${day.day} — ${day.focus}</h3><ul>`;
    day.exercises.forEach(ex => {
      html += `<li><strong>${ex.name}</strong> — ${ex.sets} × ${ex.reps}`;
      if (ex.notes) html += ` <em>(${ex.notes})</em>`;
      html += `</li>`;
    });
    html += `</ul></div>`;
  });

  container.innerHTML = html;
}

function renderPhaseTimeline(meta) {
  const container = document.getElementById('phase-timeline');
  if (!container || !meta.phases) return;

  let html = `<div class="timeline">`;
  meta.phases.forEach((phase, i) => {
    const isActive = (i + 1) === meta.currentPhase;
    html += `<div class="phase ${isActive ? 'active' : ''}">
      <span class="phase-label">${phase.label}</span>
      <span class="phase-months">Months ${phase.months.join('–')}</span>
      <span class="phase-desc">${phase.description}</span>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/js/workout.js
git commit -m "feat(frontend): rewrite workout.js — remove WORKOUT_PLAN/PHASES, render from planCache"
```

---

### Task 17: Rewrite cardio.js, grocery.js, guidelines.js

**Files:**
- Modify: `public/js/cardio.js`
- Modify: `public/js/grocery.js`
- Modify: `public/js/guidelines.js`

- [ ] **Step 1: Read current render patterns**

```bash
grep -n "function\|render\|document\." public/js/cardio.js public/js/grocery.js public/js/guidelines.js | head -60
```

- [ ] **Step 2: Rewrite cardio.js**

```js
// public/js/cardio.js — rewritten to use planCache
document.addEventListener('DOMContentLoaded', async () => {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  const { meta, cardio } = plan;
  const currentIdx = (meta.currentMonth || 1) - 1;
  const monthData = cardio[currentIdx] || cardio[0];

  const container = document.getElementById('cardio-container');
  if (!container || !monthData) return;

  let html = `<h2>${monthData.monthLabel}</h2>`;
  if (monthData.hrZones && Object.keys(monthData.hrZones).length) {
    html += `<div class="hr-zones"><h3>Heart Rate Zones</h3><ul>`;
    Object.entries(monthData.hrZones).forEach(([zone, range]) => {
      html += `<li><strong>${zone}:</strong> ${range}</li>`;
    });
    html += `</ul></div>`;
  }
  if (monthData.sessions && monthData.sessions.length) {
    html += `<div class="sessions"><h3>Sessions</h3>`;
    monthData.sessions.forEach(s => {
      html += `<div class="session-card">
        <span>${s.day}</span> — <span>${s.type}</span>
        <span>${s.duration}</span> @ <span>${s.intensity}</span>
      </div>`;
    });
    html += `</div>`;
  } else {
    html += '<p>No cardio sessions defined for this month.</p>';
  }
  container.innerHTML = html;
});
```

- [ ] **Step 3: Rewrite grocery.js**

```js
// public/js/grocery.js — rewritten to use planCache
document.addEventListener('DOMContentLoaded', async () => {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  const { meta, grocery } = plan;
  const currentIdx = (meta.currentMonth || 1) - 1;
  const monthData = grocery[currentIdx] || grocery[0];

  const container = document.getElementById('grocery-container');
  if (!container || !monthData) return;

  let html = `<h2>${monthData.monthLabel}</h2>`;
  (monthData.categories || []).forEach(cat => {
    html += `<div class="grocery-category"><h3>${cat.name}</h3><ul>`;
    (cat.items || []).forEach(item => { html += `<li>${item}</li>`; });
    html += `</ul></div>`;
  });
  container.innerHTML = html;
});
```

- [ ] **Step 4: Rewrite guidelines.js**

```js
// public/js/guidelines.js — rewritten to use planCache
document.addEventListener('DOMContentLoaded', async () => {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  const { meta, checklist } = plan;
  const medicationItems = checklist.filter(i => i.category === 'medication');

  const container = document.getElementById('guidelines-container');
  if (!container) return;

  let html = '';
  if (medicationItems.length) {
    html += `<div class="medication-section"><h3>💊 Medications</h3><ul>`;
    medicationItems.forEach(item => { html += `<li>${item.text}</li>`; });
    html += `</ul></div>`;
  } else {
    html += `<p>No medications recorded. Update your profile to add them.</p>`;
  }
  container.innerHTML = html;
});
```

- [ ] **Step 5: Commit**

```bash
git add public/js/cardio.js public/js/grocery.js public/js/guidelines.js
git commit -m "feat(frontend): rewrite cardio, grocery, guidelines — remove hardcoded data, render from planCache"
```

---

### Task 18: Rewrite dashboard.js and progress.js

**Files:**
- Modify: `public/js/dashboard.js`
- Modify: `public/js/progress.js`

- [ ] **Step 1: Read current files**

```bash
cat public/js/dashboard.js
cat public/js/progress.js
```

- [ ] **Step 2: Rewrite dashboard.js**

Replace the dashboard init section. Remove PROGRAM_START constant. Add BMI+TDEE card and weekly summary card:

```js
// public/js/dashboard.js — excerpt showing changes needed
document.addEventListener('DOMContentLoaded', async () => {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  const { meta } = plan;

  // Replace hardcoded program start display
  const phaseEl = document.getElementById('current-phase');
  if (phaseEl) phaseEl.textContent = `Phase ${meta.currentPhase} — ${meta.currentPhaseLabel}`;

  const monthEl = document.getElementById('current-month');
  if (monthEl) monthEl.textContent = `Month ${meta.currentMonth} of ${meta.totalMonths}`;

  // Load weekly summary
  const { ok, data: weeklyData } = await apiFetch('/api/logs/data/weekly-summary');
  if (ok && weeklyData) renderWeeklySummary(weeklyData);

  // Load profile for BMI/TDEE
  const { ok: profOk, data: profile } = await apiFetch('/api/profile');
  if (profOk && profile) renderBmiTdee(profile);
});

function renderWeeklySummary(data) {
  const el = document.getElementById('weekly-summary');
  if (!el) return;
  el.innerHTML = `
    <h3>Last 7 Days</h3>
    <div class="stat">Avg calories: ${data.avgCalories} kcal</div>
    <div class="stat">Workouts completed: ${data.workoutCompletionRate}%</div>
    <div class="stat">Water goal met: ${data.waterGoalMetDays} days</div>
  `;
}

function renderBmiTdee(profile) {
  const el = document.getElementById('bmi-tdee');
  if (!el) return;
  const heightM = (profile.heightCm || 170) / 100;
  const weight = profile.currentWeightKg || profile.startWeightKg || 70;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  el.innerHTML = `
    <h3>Body Metrics</h3>
    <div class="stat">BMI: ${bmi}</div>
    <div class="stat">Current weight: ${weight} kg</div>
    <div class="stat">Goal: ${profile.goalWeightKg} kg</div>
  `;
}
```

- [ ] **Step 3: Rewrite progress.js**

Replace hardcoded 75 (goal) and 95 (start) with values from planCache:

```js
// public/js/progress.js — rewritten to use planCache
document.addEventListener('DOMContentLoaded', async () => {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  const { ok: profOk, data: profile } = await apiFetch('/api/profile');
  if (!profOk) return;

  const startWeight = profile.startWeightKg || 0;
  const goalWeight = profile.goalWeightKg || 0;
  const currentWeight = profile.currentWeightKg || startWeight;

  renderProgressBar(startWeight, goalWeight, currentWeight);
  renderMilestones(startWeight, goalWeight, currentWeight, plan.meta);
});

function renderProgressBar(start, goal, current) {
  const container = document.getElementById('progress-bar-container');
  if (!container) return;
  const total = Math.abs(start - goal);
  const done = Math.abs(start - current);
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  container.innerHTML = `
    <div class="progress-label">
      ${start}kg → ${goal}kg (currently ${current}kg)
    </div>
    <div class="progress-bar-track">
      <div class="progress-bar-fill" style="width:${pct}%"></div>
    </div>
    <div class="progress-pct">${pct}% complete</div>
  `;
}

function renderMilestones(start, goal, current, meta) {
  const el = document.getElementById('milestones');
  if (!el) return;
  const diff = start - goal;
  const milestones = [0.25, 0.5, 0.75, 1.0].map(pct => ({
    label: `${Math.round(pct * 100)}% — ${(start - diff * pct).toFixed(1)}kg`,
    reached: current <= start - diff * pct
  }));
  el.innerHTML = `<h3>Milestones</h3><ul>` +
    milestones.map(m => `<li class="${m.reached ? 'reached' : ''}">${m.label}${m.reached ? ' ✓' : ''}</li>`).join('') +
    `</ul>`;
}
```

- [ ] **Step 4: Commit**

```bash
git add public/js/dashboard.js public/js/progress.js
git commit -m "feat(frontend): rewrite dashboard+progress — remove hardcoded constants, use planCache+profile"
```

---

### Task 19: Update auth.js + checklist route

**Files:**
- Modify: `public/js/auth.js`
- Modify: `routes/checklist.js`

- [ ] **Step 1: Remove getUserPhaseIndex and getUserMonthIndex from auth.js**

```bash
grep -n "getUserPhaseIndex\|getUserMonthIndex\|PROGRAM_START" public/js/auth.js
```

Delete those functions. Also add 403 handling — when a fetch returns 403 with `redirect` field, navigate to that URL. This is already handled in api.js `apiFetch`, but if auth.js has its own fetch calls, update them to use apiFetch.

- [ ] **Step 2: Update checklist route to seed from plan template**

In `routes/checklist.js`, find where DEFAULT_ITEMS are used for new checklist seeding. Replace with template call:

```js
const TEMPLATES = {
  'weight-loss': require('../server/templates/weight-loss'),
  'muscle-gain': require('../server/templates/muscle-gain'),
  'maintenance': require('../server/templates/maintenance'),
  'general-fitness': require('../server/templates/general-fitness')
};

// In the seeding logic (wherever DEFAULT_ITEMS was used):
async function getDefaultItems(profile) {
  const templateKey = profile.planTemplate || profile.primaryGoal || 'weight-loss';
  const template = TEMPLATES[templateKey];
  if (!template) return [];
  return template.getDefaultChecklist(profile);
}
```

Also add a `POST /checklist/reset-to-defaults` endpoint:
```js
router.post('/reset-to-defaults', authenticate, requireProfile, async (req, res) => {
  try {
    await ChecklistItem.deleteMany({ userId: req.user._id });
    const defaultItems = await getDefaultItems(req.user.profile);
    const docs = defaultItems.map(item => ({
      userId: req.user._id,
      category: item.category,
      text: item.text,
      isWeekly: item.isWeekly || false,
      completed: false
    }));
    await ChecklistItem.insertMany(docs);
    res.json({ success: true, count: docs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add public/js/auth.js routes/checklist.js
git commit -m "feat(auth+checklist): remove phase helpers from auth.js; seed checklist from plan template"
```

---

## Phase 4 — Onboarding Wizard

### Task 20: Onboarding wizard HTML+JS

**Files:**
- Create: `public/onboarding.html`

- [ ] **Step 1: Create onboarding.html**

Create `public/onboarding.html` — 6-step wizard. The wizard must:
- Save progress to localStorage on each "Next" click under key `onboarding_state`
- Prefill from localStorage on page load
- POST to `/api/profile/onboarding` on final step submission
- On success, redirect to `/dashboard.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Set Up Your Health Profile</title>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .wizard { max-width: 600px; margin: 40px auto; padding: 24px; }
    .step { display: none; }
    .step.active { display: block; }
    .progress-bar { display: flex; gap: 8px; margin-bottom: 24px; }
    .progress-step { flex: 1; height: 4px; background: #ddd; border-radius: 2px; }
    .progress-step.done { background: #4CAF50; }
    .progress-step.current { background: #2196F3; }
    .btn-row { display: flex; justify-content: space-between; margin-top: 24px; }
    label { display: block; margin: 12px 0 4px; font-weight: 500; }
    input, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .med-row { display: flex; gap: 8px; margin-bottom: 8px; }
    .med-row input { flex: 1; }
  </style>
</head>
<body>
<div class="wizard">
  <h1>Set Up Your Health Profile</h1>
  <div class="progress-bar" id="progressBar"></div>

  <!-- Step 1: Goal -->
  <div class="step active" id="step-1">
    <h2>Step 1 — Your Goal</h2>
    <label>Primary Goal</label>
    <select id="primaryGoal">
      <option value="weight-loss">Weight Loss</option>
      <option value="muscle-gain">Muscle Gain</option>
      <option value="maintenance">Maintenance</option>
      <option value="general-fitness">General Fitness</option>
    </select>
  </div>

  <!-- Step 2: Body Stats -->
  <div class="step" id="step-2">
    <h2>Step 2 — Body Stats</h2>
    <label>Current Weight (kg)</label>
    <input type="number" id="currentWeightKg" placeholder="e.g. 80">
    <label>Goal Weight (kg)</label>
    <input type="number" id="goalWeightKg" placeholder="e.g. 70">
    <label>Height (cm)</label>
    <input type="number" id="heightCm" placeholder="e.g. 170">
    <label>Age</label>
    <input type="number" id="age" placeholder="e.g. 28">
    <label>Daily Water Goal (litres)</label>
    <input type="number" id="waterGoalL" placeholder="e.g. 2.5" step="0.5" value="2.5">
  </div>

  <!-- Step 3: Dietary Preferences -->
  <div class="step" id="step-3">
    <h2>Step 3 — Dietary Preferences</h2>
    <label>Diet Type</label>
    <select id="dietType">
      <option value="non-vegetarian">Non-Vegetarian</option>
      <option value="vegetarian">Vegetarian</option>
      <option value="vegan">Vegan</option>
      <option value="eggetarian">Eggetarian</option>
    </select>
    <label>Cuisine Preference</label>
    <select id="cuisinePreference">
      <option value="south-indian">South Indian</option>
      <option value="north-indian">North Indian</option>
      <option value="continental">Continental</option>
      <option value="mixed">Mixed</option>
    </select>
    <label>Food Allergies (comma separated, leave blank if none)</label>
    <input type="text" id="foodAllergies" placeholder="e.g. gluten, lactose">
  </div>

  <!-- Step 4: Fitness + Health Conditions -->
  <div class="step" id="step-4">
    <h2>Step 4 — Fitness & Health</h2>
    <label>Fitness Level</label>
    <select id="fitnessLevel">
      <option value="sedentary">Sedentary (desk job, no exercise)</option>
      <option value="lightly-active">Lightly Active (1-3 days/week)</option>
      <option value="moderately-active">Moderately Active (3-5 days/week)</option>
      <option value="very-active">Very Active (6-7 days/week)</option>
    </select>
    <label>Equipment Available (check all that apply)</label>
    <div id="equipmentOptions">
      <label><input type="checkbox" value="dumbbells"> Dumbbells</label>
      <label><input type="checkbox" value="resistance-bands"> Resistance Bands</label>
      <label><input type="checkbox" value="gym-membership"> Gym Membership</label>
      <label><input type="checkbox" value="pull-up-bar"> Pull-up Bar</label>
      <label><input type="checkbox" value="none"> No Equipment</label>
    </div>
    <label>Health Conditions (check all that apply)</label>
    <div id="conditionOptions">
      <label><input type="checkbox" value="lower-back-pain"> Lower Back Pain</label>
      <label><input type="checkbox" value="knee-injury"> Knee Injury</label>
      <label><input type="checkbox" value="diabetes"> Diabetes</label>
      <label><input type="checkbox" value="hypertension"> Hypertension</label>
      <label><input type="checkbox" value="thyroid"> Thyroid Condition</label>
    </div>
  </div>

  <!-- Step 5: Plan Assignment -->
  <div class="step" id="step-5">
    <h2>Step 5 — Your Plan</h2>
    <p>Based on your goal, we'll assign you the <strong id="planPreview"></strong> plan.</p>
    <p>This covers 6 months of personalised diet, workout, cardio, and grocery lists.</p>
    <label>Start Date</label>
    <input type="date" id="startDate">
  </div>

  <!-- Step 6: Medications -->
  <div class="step" id="step-6">
    <h2>Step 6 — Medications (Optional)</h2>
    <p>Add any daily medications. These will appear in your daily checklist.</p>
    <div id="medicationList"></div>
    <button type="button" onclick="addMedRow()">+ Add Medication</button>
    <p style="margin-top: 16px; color: #666;">Leave blank if you take no medications.</p>
  </div>

  <div class="btn-row">
    <button id="btnBack" onclick="prevStep()" style="display:none">← Back</button>
    <button id="btnNext" onclick="nextStep()">Next →</button>
  </div>
  <div id="wizardError" style="color:red;margin-top:12px;"></div>
</div>

<script src="/js/api.js"></script>
<script>
  const TOTAL_STEPS = 6;
  let currentStep = 1;

  // Load saved state
  const saved = JSON.parse(localStorage.getItem('onboarding_state') || '{}');

  function renderProgress() {
    const bar = document.getElementById('progressBar');
    bar.innerHTML = Array(TOTAL_STEPS).fill(0).map((_, i) => {
      const cls = i + 1 < currentStep ? 'done' : i + 1 === currentStep ? 'current' : '';
      return `<div class="progress-step ${cls}"></div>`;
    }).join('');
  }

  function showStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${n}`).classList.add('active');
    document.getElementById('btnBack').style.display = n > 1 ? 'inline-block' : 'none';
    document.getElementById('btnNext').textContent = n === TOTAL_STEPS ? 'Complete Setup' : 'Next →';
    if (n === 5) {
      const goal = document.getElementById('primaryGoal').value;
      document.getElementById('planPreview').textContent = goal.replace(/-/g, ' ');
    }
    renderProgress();
  }

  function collectStep() {
    const state = JSON.parse(localStorage.getItem('onboarding_state') || '{}');
    if (currentStep === 1) state.primaryGoal = document.getElementById('primaryGoal').value;
    if (currentStep === 2) {
      state.currentWeightKg = parseFloat(document.getElementById('currentWeightKg').value);
      state.goalWeightKg = parseFloat(document.getElementById('goalWeightKg').value);
      state.heightCm = parseFloat(document.getElementById('heightCm').value);
      state.age = parseInt(document.getElementById('age').value);
      state.waterGoalL = parseFloat(document.getElementById('waterGoalL').value) || 2.5;
    }
    if (currentStep === 3) {
      state.dietType = document.getElementById('dietType').value;
      state.cuisinePreference = document.getElementById('cuisinePreference').value;
      state.foodAllergies = document.getElementById('foodAllergies').value
        .split(',').map(s => s.trim()).filter(Boolean);
    }
    if (currentStep === 4) {
      state.equipmentAvailable = [...document.querySelectorAll('#equipmentOptions input:checked')].map(i => i.value);
      state.healthConditions = [...document.querySelectorAll('#conditionOptions input:checked')].map(i => i.value);
      state.fitnessLevel = document.getElementById('fitnessLevel').value;
    }
    if (currentStep === 5) {
      state.startDate = document.getElementById('startDate').value;
    }
    if (currentStep === 6) {
      state.medications = [...document.querySelectorAll('.med-row')].map(row => ({
        name: row.querySelector('.med-name').value.trim(),
        dosage: row.querySelector('.med-dosage').value.trim(),
        timing: row.querySelector('.med-timing').value.trim()
      })).filter(m => m.name);
    }
    localStorage.setItem('onboarding_state', JSON.stringify(state));
    return state;
  }

  async function nextStep() {
    const state = collectStep();
    if (currentStep === TOTAL_STEPS) {
      await submitWizard(state);
      return;
    }
    currentStep++;
    prefillStep(currentStep, state);
    showStep(currentStep);
  }

  function prevStep() {
    collectStep();
    currentStep--;
    const state = JSON.parse(localStorage.getItem('onboarding_state') || '{}');
    prefillStep(currentStep, state);
    showStep(currentStep);
  }

  function prefillStep(n, state) {
    if (n === 1 && state.primaryGoal) document.getElementById('primaryGoal').value = state.primaryGoal;
    if (n === 2) {
      if (state.currentWeightKg) document.getElementById('currentWeightKg').value = state.currentWeightKg;
      if (state.goalWeightKg) document.getElementById('goalWeightKg').value = state.goalWeightKg;
      if (state.heightCm) document.getElementById('heightCm').value = state.heightCm;
      if (state.age) document.getElementById('age').value = state.age;
      if (state.waterGoalL) document.getElementById('waterGoalL').value = state.waterGoalL;
    }
    if (n === 3) {
      if (state.dietType) document.getElementById('dietType').value = state.dietType;
      if (state.cuisinePreference) document.getElementById('cuisinePreference').value = state.cuisinePreference;
      if (state.foodAllergies) document.getElementById('foodAllergies').value = state.foodAllergies.join(', ');
    }
    if (n === 4) {
      if (state.fitnessLevel) document.getElementById('fitnessLevel').value = state.fitnessLevel;
      if (state.equipmentAvailable) {
        document.querySelectorAll('#equipmentOptions input').forEach(cb => {
          cb.checked = state.equipmentAvailable.includes(cb.value);
        });
      }
      if (state.healthConditions) {
        document.querySelectorAll('#conditionOptions input').forEach(cb => {
          cb.checked = state.healthConditions.includes(cb.value);
        });
      }
    }
    if (n === 5 && !document.getElementById('startDate').value) {
      document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
    }
  }

  async function submitWizard(state) {
    document.getElementById('btnNext').disabled = true;
    document.getElementById('wizardError').textContent = '';
    const { ok, data } = await apiFetch('/api/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify(state)
    });
    if (ok) {
      localStorage.removeItem('onboarding_state');
      window.location.href = '/dashboard.html';
    } else {
      document.getElementById('wizardError').textContent = (data && data.error) || 'Submission failed. Please try again.';
      document.getElementById('btnNext').disabled = false;
    }
  }

  function addMedRow() {
    const list = document.getElementById('medicationList');
    const row = document.createElement('div');
    row.className = 'med-row';
    row.innerHTML = `
      <input class="med-name" placeholder="Name (e.g. Thyronorm)" />
      <input class="med-dosage" placeholder="Dosage (e.g. 12.5mg)" />
      <input class="med-timing" placeholder="Timing (e.g. morning)" />
      <button type="button" onclick="this.parentElement.remove()">✕</button>
    `;
    list.appendChild(row);
  }

  // Init
  prefillStep(1, saved);
  showStep(1);
</script>
</body>
</html>
```

- [ ] **Step 2: Verify HTML is valid**

```bash
node -e "require('fs').readFileSync('public/onboarding.html', 'utf8'); console.log('File reads OK')"
```

- [ ] **Step 3: Commit**

```bash
git add public/onboarding.html
git commit -m "feat(wizard): add 6-step onboarding wizard with localStorage persistence"
```

---

## Phase 5 — New Features + Migration

### Task 21: Settings page

**Files:**
- Create: `public/settings.html`

- [ ] **Step 1: Create settings.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settings</title>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .settings { max-width: 600px; margin: 40px auto; padding: 24px; }
    .section { margin-bottom: 32px; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
    label { display: block; margin: 10px 0 4px; font-weight: 500; }
    input, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .btn-save { background: #2196F3; color: #fff; border: none; padding: 10px 24px; border-radius: 4px; cursor: pointer; }
    .btn-danger { background: #f44336; color: #fff; border: none; padding: 10px 24px; border-radius: 4px; cursor: pointer; }
    .msg { margin-top: 8px; color: green; font-size: 14px; }
  </style>
</head>
<body>
<div class="settings">
  <h1>Settings</h1>

  <div class="section">
    <h2>Body Stats</h2>
    <label>Current Weight (kg)</label><input type="number" id="currentWeightKg">
    <label>Goal Weight (kg)</label><input type="number" id="goalWeightKg">
    <label>Height (cm)</label><input type="number" id="heightCm">
    <label>Daily Water Goal (L)</label><input type="number" id="waterGoalL" step="0.5">
    <button class="btn-save" onclick="saveStats()">Save</button>
    <div class="msg" id="statsMsg"></div>
  </div>

  <div class="section">
    <h2>Plan Template</h2>
    <label>Switch Plan</label>
    <select id="planTemplate">
      <option value="weight-loss">Weight Loss</option>
      <option value="muscle-gain">Muscle Gain</option>
      <option value="maintenance">Maintenance</option>
      <option value="general-fitness">General Fitness</option>
    </select>
    <button class="btn-save" onclick="savePlan()">Switch Plan</button>
    <div class="msg" id="planMsg"></div>
  </div>

  <div class="section">
    <h2>Checklist</h2>
    <p>Reset your daily checklist to the defaults for your current plan template.</p>
    <button class="btn-danger" onclick="resetChecklist()">Reset Checklist to Plan Defaults</button>
    <div class="msg" id="checklistMsg"></div>
  </div>
</div>

<script src="/js/api.js"></script>
<script src="/js/planCache.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const { ok, data } = await apiFetch('/api/profile');
    if (!ok) return;
    document.getElementById('currentWeightKg').value = data.currentWeightKg || '';
    document.getElementById('goalWeightKg').value = data.goalWeightKg || '';
    document.getElementById('heightCm').value = data.heightCm || '';
    document.getElementById('waterGoalL').value = data.waterGoalL || 2.5;
    document.getElementById('planTemplate').value = data.planTemplate || 'weight-loss';
  });

  async function saveStats() {
    const { ok } = await apiFetch('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        currentWeightKg: parseFloat(document.getElementById('currentWeightKg').value),
        goalWeightKg: parseFloat(document.getElementById('goalWeightKg').value),
        heightCm: parseFloat(document.getElementById('heightCm').value),
        waterGoalL: parseFloat(document.getElementById('waterGoalL').value)
      })
    });
    const msg = document.getElementById('statsMsg');
    if (ok) { window.planCache.invalidate(); msg.textContent = 'Saved!'; }
    else msg.textContent = 'Save failed.';
    setTimeout(() => { msg.textContent = ''; }, 3000);
  }

  async function savePlan() {
    const { ok } = await apiFetch('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ planTemplate: document.getElementById('planTemplate').value })
    });
    const msg = document.getElementById('planMsg');
    if (ok) { window.planCache.invalidate(); msg.textContent = 'Plan switched! Refreshing...'; setTimeout(() => location.reload(), 1000); }
    else msg.textContent = 'Switch failed.';
  }

  async function resetChecklist() {
    if (!confirm('This will replace all your current checklist items. Continue?')) return;
    const { ok } = await apiFetch('/api/checklist/reset-to-defaults', { method: 'POST' });
    const msg = document.getElementById('checklistMsg');
    msg.textContent = ok ? 'Checklist reset to plan defaults.' : 'Reset failed.';
    setTimeout(() => { msg.textContent = ''; }, 3000);
  }
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add public/settings.html
git commit -m "feat(frontend): add settings page — edit profile, switch plan, reset checklist"
```

---

### Task 22: Run full test suite + run migration

- [ ] **Step 1: Run all tests**

```bash
npm test
```
Expected: All tests pass. Fix any failures before proceeding.

- [ ] **Step 2: Deploy to Azure and run migration**

```bash
# Run migration against production (replace <MONGO_URI> with actual connection string)
MONGO_URI=<production_mongo_uri> node scripts/migrate-karthik-profile.js
```
Expected output: `SUCCESS: Profile updated for karthik.chary2606@gmail.com`

- [ ] **Step 3: Add .superpowers to .gitignore**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 4: Final commit**

```bash
git add .gitignore
git commit -m "chore: add .superpowers to .gitignore"
```

- [ ] **Step 5: Verify end-to-end**

1. Log in as a new user → should redirect to `/onboarding.html`
2. Complete the wizard → should land on `/dashboard.html`
3. Check diet/workout/cardio pages → should show plan content (not blank, not Karthik's hardcoded data)
4. Log in as Karthik → should skip onboarding, show weight-loss plan
5. Visit `/settings.html` → should load current profile values

---

## Self-Review Checklist

### Spec coverage
- [x] Profile-Driven API: plan computed server-side (Tasks 10–12)
- [x] authenticate middleware replacing verifyToken (Task 3)
- [x] requireProfile with admin bypass (Task 4)
- [x] computeStats with waterGoalL (Task 7)
- [x] All 4 plan templates (Tasks 10–11)
- [x] POST /api/profile/onboarding (Task 12)
- [x] GET /api/profile, PATCH /api/profile, GET /api/profile/plan (Task 12)
- [x] Onboarding wizard 6 steps + localStorage (Task 20)
- [x] planCache global (Task 14)
- [x] apiFetch deepened (Task 13)
- [x] All frontend files rewritten (Tasks 15–19)
- [x] Settings page with plan switch + checklist reset (Task 21)
- [x] Migration script for Karthik (Task 6)
- [x] weekly-summary endpoint (Task 8)
- [x] checklist seeding from template + reset-to-defaults (Task 19)
- [x] admin bypass on onboarding check (Task 4 + grill decision)
- [x] PHASE_TASKS medication from profile.medications (Task 10 — getDefaultChecklist)
- [x] .superpowers in .gitignore (Task 22)

### Type consistency
- `authenticate` middleware → `req.user` is a `.lean()` plain object. All downstream route handlers use `req.user._id`, `req.user.profile`, `req.user.isAdmin`, `req.user.profileComplete`. Consistent.
- `planCache.getPlan()` returns the shape `{ meta, diet, workout, cardio, grocery, checklist }` from Task 12. All frontend files (Tasks 15–18) destructure this exact shape. Consistent.
- `computeStats(logs, profile)` signature used in Task 7 (definition) and Task 8 (usage). Consistent.
- Template exports: `getDietPlan`, `getWorkoutPlan`, `getCardioPlan`, `getGroceryList`, `getDefaultChecklist`, `getPlanMeta` — used in profile route Task 12 and checklist route Task 19. Consistent.
