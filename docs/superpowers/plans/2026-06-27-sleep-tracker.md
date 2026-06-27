# Sleep Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated sleep tracking module — log bedtime/wake or duration, emoji quality, view a 7-day chart and insight cards, with a summary card on the main dashboard.

**Architecture:** Extend the existing `HealthLog` Mongoose model with a `sleepEntry` sub-document. A new `routes/sleep.js` file handles three endpoints (POST, GET /history, GET /stats). Stats aggregation lives in a pure function `lib/sleepStats.js`. The frontend is a standalone `public/sleep.html` + `public/js/sleep.js` page using the same `apiFetch`/`planCache` patterns as the rest of the app.

**Tech Stack:** Node.js/Express, Mongoose, MongoDB, Chart.js 4.4 (already loaded), Jest 29 + Supertest + mongodb-memory-server, vanilla JS frontend.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `models/HealthLog.js` | Modify | Add `sleepEntry` sub-document to schema |
| `lib/sleepStats.js` | Create | Pure function: compute avg, streak, goal nights from array of entries |
| `routes/sleep.js` | Create | POST /api/sleep, GET /api/sleep/history, GET /api/sleep/stats |
| `server.js` | Modify | Mount `routes/sleep.js` at `/api/sleep` |
| `public/sleep.html` | Create | Full sleep tracker page (form + cards + chart + table) |
| `public/js/sleep.js` | Create | Frontend logic: log form, chart rendering, table, dashboard card |
| `public/index.html` | Modify | Add sleep summary card + Sleep nav link |
| `public/js/dashboard.js` | Modify | Fetch most recent sleep entry and render summary card |
| `tests/lib/sleepStats.test.js` | Create | Unit tests for pure stats function |
| `tests/routes/sleep.test.js` | Create | Integration tests for all three endpoints |

---

## Task 1: Extend HealthLog schema + create sleepStats pure function

**Files:**
- Modify: `models/HealthLog.js`
- Create: `lib/sleepStats.js`

- [ ] **Step 1: Add `sleepEntry` to HealthLog schema**

Open `models/HealthLog.js`. After the `notes` field, add the `sleepEntry` sub-document before the closing `}`  of the schema fields:

```js
// models/HealthLog.js — full file after change:
const mongoose = require('mongoose');

const HealthLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  checklist: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChecklistItem' },
    done: { type: Boolean, default: false }
  }],
  waterIntake: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  completedWorkout: { type: Boolean, default: false },
  moodScore: { type: Number, default: 3 },
  energyScore: { type: Number, default: 3 },
  notes: { type: String, default: '' },
  sleepEntry: {
    bedtime:         { type: String },
    wakeTime:        { type: String },
    durationMinutes: { type: Number },
    quality:         { type: Number, min: 1, max: 5 },
    notes:           { type: String, default: '' }
  }
}, { timestamps: true });

HealthLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HealthLog', HealthLogSchema);
```

- [ ] **Step 2: Create `lib/sleepStats.js`**

```js
// lib/sleepStats.js
'use strict';

const GOAL_MINUTES = 450; // 7.5 hours

/**
 * Compute sleep stats from an array of sleep entry objects.
 *
 * @param {Array<{date: string, durationMinutes: number, quality: number}>} entries
 *   Sorted descending by date (newest first). Each entry must have `date` (YYYY-MM-DD),
 *   `durationMinutes` (number > 0), and `quality` (1–5).
 * @param {Date} [now] - injectable for testing; defaults to new Date()
 * @returns {{ avgDurationMinutes: number, avgQuality: number, goalNightsThisWeek: number, currentStreak: number }}
 */
function computeSleepStats(entries, now) {
  now = now || new Date();

  if (!entries || entries.length === 0) {
    return { avgDurationMinutes: 0, avgQuality: 0, goalNightsThisWeek: 0, currentStreak: 0 };
  }

  // --- avg duration + quality (all entries) ---
  const total = entries.reduce((acc, e) => {
    acc.dur += e.durationMinutes || 0;
    acc.qual += e.quality || 0;
    return acc;
  }, { dur: 0, qual: 0 });

  const avgDurationMinutes = Math.round(total.dur / entries.length);
  const avgQuality = Math.round((total.qual / entries.length) * 10) / 10;

  // --- goal nights this week (Mon–Sun) ---
  const todayStr = toDateStr(now);
  const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  const mondayStr = toDateStr(monday);

  const goalNightsThisWeek = entries.filter(e =>
    e.date >= mondayStr && e.date <= todayStr && e.durationMinutes >= GOAL_MINUTES
  ).length;

  // --- current streak (consecutive days ending today, descending) ---
  const entryDates = new Set(entries.map(e => e.date));
  let streak = 0;
  const cursor = new Date(now);
  while (true) {
    const dateStr = toDateStr(cursor);
    if (!entryDates.has(dateStr)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { avgDurationMinutes, avgQuality, goalNightsThisWeek, currentStreak: streak };
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

module.exports = { computeSleepStats, GOAL_MINUTES };
```

- [ ] **Step 3: Verify syntax**

```bash
node --check lib/sleepStats.js models/HealthLog.js
```

Expected: no output (no errors).

- [ ] **Step 4: Commit**

```bash
git add models/HealthLog.js lib/sleepStats.js
git commit -m "feat(sleep): extend HealthLog schema; add sleepStats pure function

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Unit tests for sleepStats

**Files:**
- Create: `tests/lib/sleepStats.test.js`

- [ ] **Step 1: Create the test file**

```js
// tests/lib/sleepStats.test.js
'use strict';
const { computeSleepStats, GOAL_MINUTES } = require('../../lib/sleepStats');

// Helper: returns a Date for a given YYYY-MM-DD string (noon UTC to avoid TZ drift)
function d(str) {
  return new Date(str + 'T12:00:00.000Z');
}

describe('computeSleepStats', () => {
  test('returns zeros when entries array is empty', () => {
    const result = computeSleepStats([]);
    expect(result).toEqual({ avgDurationMinutes: 0, avgQuality: 0, goalNightsThisWeek: 0, currentStreak: 0 });
  });

  test('returns zeros when entries is null', () => {
    const result = computeSleepStats(null);
    expect(result).toEqual({ avgDurationMinutes: 0, avgQuality: 0, goalNightsThisWeek: 0, currentStreak: 0 });
  });

  test('computes avgDurationMinutes correctly', () => {
    const entries = [
      { date: '2026-06-25', durationMinutes: 480, quality: 5 },
      { date: '2026-06-24', durationMinutes: 360, quality: 3 },
    ];
    const { avgDurationMinutes } = computeSleepStats(entries, d('2026-06-25'));
    expect(avgDurationMinutes).toBe(420); // (480+360)/2
  });

  test('rounds avgQuality to 1 decimal', () => {
    const entries = [
      { date: '2026-06-25', durationMinutes: 480, quality: 4 },
      { date: '2026-06-24', durationMinutes: 480, quality: 3 },
      { date: '2026-06-23', durationMinutes: 480, quality: 5 },
    ];
    const { avgQuality } = computeSleepStats(entries, d('2026-06-25'));
    expect(avgQuality).toBe(4.0); // (4+3+5)/3 = 4.0
  });

  test('counts goal nights this week correctly (>=450 min)', () => {
    // now = Wednesday 2026-06-24; week Mon 2026-06-22 to Sun 2026-06-28
    const entries = [
      { date: '2026-06-24', durationMinutes: 480, quality: 4 }, // Wed — goal met
      { date: '2026-06-23', durationMinutes: 420, quality: 3 }, // Tue — below goal
      { date: '2026-06-22', durationMinutes: 450, quality: 4 }, // Mon — exactly goal, met
      { date: '2026-06-15', durationMinutes: 500, quality: 5 }, // prev week — excluded
    ];
    const { goalNightsThisWeek } = computeSleepStats(entries, d('2026-06-24'));
    expect(goalNightsThisWeek).toBe(2);
  });

  test('streak: 0 when no entry today or yesterday', () => {
    const entries = [
      { date: '2026-06-20', durationMinutes: 480, quality: 4 },
    ];
    const { currentStreak } = computeSleepStats(entries, d('2026-06-25'));
    expect(currentStreak).toBe(0);
  });

  test('streak: counts consecutive days ending today', () => {
    const entries = [
      { date: '2026-06-25', durationMinutes: 480, quality: 4 },
      { date: '2026-06-24', durationMinutes: 460, quality: 3 },
      { date: '2026-06-23', durationMinutes: 470, quality: 5 },
      // gap — 2026-06-22 missing
      { date: '2026-06-21', durationMinutes: 480, quality: 4 },
    ];
    const { currentStreak } = computeSleepStats(entries, d('2026-06-25'));
    expect(currentStreak).toBe(3); // stops at the gap
  });

  test('streak: resets when a day is skipped', () => {
    const entries = [
      { date: '2026-06-25', durationMinutes: 480, quality: 4 },
      // 2026-06-24 missing
      { date: '2026-06-23', durationMinutes: 480, quality: 4 },
    ];
    const { currentStreak } = computeSleepStats(entries, d('2026-06-25'));
    expect(currentStreak).toBe(1);
  });

  test('GOAL_MINUTES constant is 450', () => {
    expect(GOAL_MINUTES).toBe(450);
  });
});
```

- [ ] **Step 2: Run the tests — expect all to pass**

```bash
npm test -- tests/lib/sleepStats.test.js --verbose
```

Expected output: `8 tests passing` in `sleepStats.test.js`.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/sleepStats.test.js
git commit -m "test(sleep): unit tests for computeSleepStats

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Sleep API routes + server mount

**Files:**
- Create: `routes/sleep.js`
- Modify: `server.js`

- [ ] **Step 1: Create `routes/sleep.js`**

```js
// routes/sleep.js
'use strict';
const express = require('express');
const HealthLog = require('../models/HealthLog');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const { computeSleepStats } = require('../lib/sleepStats');

const router = express.Router();
router.use(authenticate, requireProfile);

// Parse "HH:MM" into minutes-since-midnight
function timeToMinutes(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

// Calculate durationMinutes from bedtime/wakeTime strings ("HH:MM"), handling overnight
function calcDuration(bedtime, wakeTime) {
  let bed = timeToMinutes(bedtime);
  let wake = timeToMinutes(wakeTime);
  if (wake <= bed) wake += 24 * 60; // overnight
  return wake - bed;
}

// POST /api/sleep — create or update sleep entry for a given date
router.post('/', async (req, res, next) => {
  try {
    const { bedtime, wakeTime, quality, notes } = req.body;
    let { date, durationMinutes } = req.body;

    // Default date to today
    if (!date) date = new Date().toISOString().slice(0, 10);

    // Calculate duration from times if provided
    if (bedtime && wakeTime) {
      durationMinutes = calcDuration(bedtime, wakeTime);
    }

    // Validate
    if (!durationMinutes || durationMinutes <= 0) {
      return res.status(400).json({ error: 'Provide durationMinutes or both bedtime and wakeTime' });
    }
    if (quality !== undefined && (quality < 1 || quality > 5)) {
      return res.status(400).json({ error: 'quality must be between 1 and 5' });
    }

    const sleepEntry = { durationMinutes, quality: quality || null, notes: notes || '' };
    if (bedtime) sleepEntry.bedtime = bedtime;
    if (wakeTime) sleepEntry.wakeTime = wakeTime;

    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user._id, date },
      { $set: { sleepEntry } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(log.sleepEntry);
  } catch (err) { next(err); }
});

// GET /api/sleep/history — last 30 days of sleep entries, newest first
router.get('/history', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: cutoff },
      'sleepEntry.durationMinutes': { $gt: 0 }
    }).sort({ date: -1 }).select('date sleepEntry -_id').lean();

    const entries = logs.map(l => ({
      date: l.date,
      durationMinutes: l.sleepEntry.durationMinutes,
      quality: l.sleepEntry.quality,
      bedtime: l.sleepEntry.bedtime || null,
      wakeTime: l.sleepEntry.wakeTime || null,
      notes: l.sleepEntry.notes || ''
    }));

    res.json(entries);
  } catch (err) { next(err); }
});

// GET /api/sleep/stats — aggregated stats
router.get('/stats', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: cutoff },
      'sleepEntry.durationMinutes': { $gt: 0 }
    }).sort({ date: -1 }).select('date sleepEntry -_id').lean();

    const entries = logs.map(l => ({
      date: l.date,
      durationMinutes: l.sleepEntry.durationMinutes,
      quality: l.sleepEntry.quality
    }));

    res.json(computeSleepStats(entries));
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Step 2: Mount the route in `server.js`**

In `server.js`, find the block of `app.use('/api/...')` lines and add one line after the profile route:

```js
app.use('/api/profile',   require('./routes/profile'));
app.use('/api/sleep',     require('./routes/sleep'));   // ← add this line
```

- [ ] **Step 3: Verify syntax**

```bash
node --check routes/sleep.js server.js
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add routes/sleep.js server.js
git commit -m "feat(sleep): add /api/sleep routes (POST, GET /history, GET /stats)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Integration tests for sleep routes

**Files:**
- Create: `tests/routes/sleep.test.js`

- [ ] **Step 1: Create the test file**

```js
// tests/routes/sleep.test.js
'use strict';
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');
const HealthLog = require('../../models/HealthLog');

beforeAll(async () => { await mongoose.connect(process.env.MONGODB_URI); });
afterEach(async () => {
  await User.deleteMany({});
  await HealthLog.deleteMany({});
});
afterAll(async () => { await mongoose.disconnect(); });

async function createUser(overrides = {}) {
  return User.create({
    name: 'Test User',
    email: 'sleep@test.com',
    passwordHash: 'hashed',
    isApproved: true,
    profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss',
      currentWeightKg: 80,
      goalWeightKg: 70,
      heightCm: 175,
      age: 30,
      dietType: 'non-vegetarian',
      cuisinePreference: 'south-indian',
      fitnessLevel: 'lightly-active',
      waterGoalL: 2.5
    },
    ...overrides
  });
}

function authHeader(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

describe('POST /api/sleep', () => {
  test('creates a sleep entry with durationMinutes', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', durationMinutes: 480, quality: 4, notes: 'Good night' });

    expect(res.status).toBe(200);
    expect(res.body.durationMinutes).toBe(480);
    expect(res.body.quality).toBe(4);
  });

  test('calculates durationMinutes from bedtime + wakeTime (same day)', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', bedtime: '22:00', wakeTime: '06:00' });

    expect(res.status).toBe(200);
    expect(res.body.durationMinutes).toBe(480); // 8h
  });

  test('handles overnight sleep (wakeTime < bedtime)', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', bedtime: '23:30', wakeTime: '06:00' });

    expect(res.status).toBe(200);
    expect(res.body.durationMinutes).toBe(390); // 6.5h
  });

  test('upserts when same date submitted twice', async () => {
    const user = await createUser();
    await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', durationMinutes: 360, quality: 2 });

    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', durationMinutes: 480, quality: 5 });

    expect(res.status).toBe(200);
    expect(res.body.durationMinutes).toBe(480); // updated value
    expect(res.body.quality).toBe(5);

    const count = await HealthLog.countDocuments({ userId: user._id, date: '2026-06-25' });
    expect(count).toBe(1); // only one document
  });

  test('returns 400 when neither durationMinutes nor times provided', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', quality: 3 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/durationMinutes/);
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/sleep')
      .send({ date: '2026-06-25', durationMinutes: 480 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/sleep/history', () => {
  test('returns entries sorted descending by date', async () => {
    const user = await createUser();
    await HealthLog.create([
      { userId: user._id, date: '2026-06-23', sleepEntry: { durationMinutes: 420, quality: 3 } },
      { userId: user._id, date: '2026-06-25', sleepEntry: { durationMinutes: 480, quality: 5 } },
      { userId: user._id, date: '2026-06-24', sleepEntry: { durationMinutes: 450, quality: 4 } },
    ]);

    const res = await request(app)
      .get('/api/sleep/history')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body[0].date).toBe('2026-06-25');
    expect(res.body[1].date).toBe('2026-06-24');
    expect(res.body[2].date).toBe('2026-06-23');
  });

  test('excludes logs without a sleep entry', async () => {
    const user = await createUser();
    await HealthLog.create([
      { userId: user._id, date: '2026-06-25', sleepEntry: { durationMinutes: 480, quality: 4 } },
      { userId: user._id, date: '2026-06-24', waterIntake: 2 }, // no sleepEntry
    ]);

    const res = await request(app)
      .get('/api/sleep/history')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].date).toBe('2026-06-25');
  });
});

describe('GET /api/sleep/stats', () => {
  test('returns correct currentStreak and goalNightsThisWeek', async () => {
    const user = await createUser();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    await HealthLog.create([
      { userId: user._id, date: today,     sleepEntry: { durationMinutes: 480, quality: 4 } },
      { userId: user._id, date: yesterday, sleepEntry: { durationMinutes: 480, quality: 4 } },
    ]);

    const res = await request(app)
      .get('/api/sleep/stats')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.currentStreak).toBeGreaterThanOrEqual(2);
    expect(typeof res.body.avgDurationMinutes).toBe('number');
    expect(typeof res.body.goalNightsThisWeek).toBe('number');
  });
});
```

- [ ] **Step 2: Run tests — expect all to pass**

```bash
npm test -- tests/routes/sleep.test.js --verbose
```

Expected: `9 tests passing`.

- [ ] **Step 3: Run full test suite — no regressions**

```bash
npm test
```

Expected: all existing tests + new sleep tests passing (36+ total).

- [ ] **Step 4: Commit**

```bash
git add tests/routes/sleep.test.js
git commit -m "test(sleep): integration tests for sleep routes

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Sleep frontend — `sleep.html` + `sleep.js`

**Files:**
- Create: `public/sleep.html`
- Create: `public/js/sleep.js`

- [ ] **Step 1: Create `public/js/sleep.js`**

```js
// public/js/sleep.js
'use strict';

const QUALITY_EMOJIS = ['', '😩', '😴', '😐', '😊', '🤩'];
const GOAL_MINUTES = 450; // 7.5h

let _chart = null;
let _selectedQuality = 0;

function minutesToHM(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function calcDurationFromInputs() {
  const bed = document.getElementById('bedtime').value;
  const wake = document.getElementById('wakeTime').value;
  const display = document.getElementById('durationDisplay');
  if (!bed || !wake) { display.textContent = ''; return; }

  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 1440; // overnight
  const dur = wakeMins - bedMins;
  display.textContent = minutesToHM(dur);
  display.style.color = dur >= GOAL_MINUTES ? '#16a34a' : '#dc2626';
}

function selectQuality(val) {
  _selectedQuality = val;
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    const active = parseInt(btn.dataset.val) === val;
    btn.style.opacity = active ? '1' : '0.35';
    btn.style.transform = active ? 'scale(1.25)' : 'scale(1)';
  });
}

async function saveSleep() {
  const date = document.getElementById('sleepDate').value;
  const bedtime = document.getElementById('bedtime').value || undefined;
  const wakeTime = document.getElementById('wakeTime').value || undefined;
  const manualHours = parseFloat(document.getElementById('manualHours').value);
  const notes = document.getElementById('sleepNotes').value.trim();

  const body = { date, quality: _selectedQuality || undefined, notes };

  if (bedtime && wakeTime) {
    body.bedtime = bedtime;
    body.wakeTime = wakeTime;
  } else if (manualHours > 0) {
    body.durationMinutes = Math.round(manualHours * 60);
  } else {
    showToast('Enter bedtime + wake time, or total hours');
    return;
  }

  const res = await apiFetch('/api/sleep', { method: 'POST', body });
  if (res.ok) {
    showToast('Sleep logged ✓');
    await loadAll();
  } else {
    showToast('Failed to save — try again');
  }
}

async function loadAll() {
  const [histRes, statsRes] = await Promise.all([
    apiFetch('/api/sleep/history'),
    apiFetch('/api/sleep/stats')
  ]);

  const history = histRes.ok ? histRes.data : [];
  const stats = statsRes.ok ? statsRes.data : {};
  const enough = history.length >= 3;

  // insight cards
  document.getElementById('statAvgHours').textContent =
    enough ? minutesToHM(stats.avgDurationMinutes) : '—';
  document.getElementById('statGoalNights').textContent =
    enough ? `${stats.goalNightsThisWeek}/7` : '—';
  document.getElementById('statAvgQuality').textContent =
    enough ? (QUALITY_EMOJIS[Math.round(stats.avgQuality)] || '—') : '—';
  document.getElementById('statStreak').textContent =
    history.length > 0 ? `${stats.currentStreak}🔥` : '—';

  renderChart(history);
  renderTable(history);
}

function renderChart(history) {
  // Build last-7-days labels
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const dayNames = days.map(d =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short' })
  );
  const entryMap = {};
  history.forEach(e => { entryMap[e.date] = e; });

  const durations = days.map(d => {
    const e = entryMap[d];
    return e ? +(e.durationMinutes / 60).toFixed(1) : 0;
  });
  const colors = days.map(d => {
    const e = entryMap[d];
    if (!e) return '#e2e8f0';
    return e.durationMinutes >= GOAL_MINUTES ? '#22c55e' : '#6366f1';
  });

  const ctx = document.getElementById('sleepChart').getContext('2d');
  if (_chart) _chart.destroy();
  _chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dayNames,
      datasets: [{
        data: durations,
        backgroundColor: colors,
        borderRadius: 4
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        annotation: {
          annotations: {
            goalLine: {
              type: 'line',
              yMin: 7.5, yMax: 7.5,
              borderColor: '#94a3b8',
              borderWidth: 1,
              borderDash: [4, 4]
            }
          }
        }
      },
      scales: {
        y: {
          min: 0, max: 10,
          ticks: { callback: v => `${v}h` }
        }
      }
    }
  });
}

function renderTable(history) {
  const tbody = document.getElementById('sleepTableBody');
  const empty = document.getElementById('sleepTableEmpty');
  if (!history.length) {
    tbody.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = history.slice(0, 7).map(e => `
    <tr>
      <td>${new Date(e.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
      <td>${minutesToHM(e.durationMinutes)}</td>
      <td style="font-size:1.2rem">${QUALITY_EMOJIS[e.quality] || '—'}</td>
      <td style="color:#94a3b8;font-size:.85rem">${e.notes || '—'}</td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initAuth();

    // Default date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    document.getElementById('sleepDate').value = yesterday.toISOString().slice(0, 10);

    // Wire up time inputs for auto-calculation
    document.getElementById('bedtime').addEventListener('input', calcDurationFromInputs);
    document.getElementById('wakeTime').addEventListener('input', calcDurationFromInputs);

    // Wire up emoji buttons
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => selectQuality(parseInt(btn.dataset.val)));
    });

    // Wire up save button
    document.getElementById('saveSleepBtn').addEventListener('click', saveSleep);

    await loadAll();
  } catch (e) {
    console.error('Sleep init error:', e);
  }
});
```

- [ ] **Step 2: Create `public/sleep.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sleep Tracker</title>
  <link rel="stylesheet" href="/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body { visibility: hidden; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
    .stat-val { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: .75rem; color: #64748b; margin-top: 4px; }
    .emoji-btn { font-size: 1.6rem; background: none; border: 2px solid transparent; border-radius: 50%; padding: 4px 6px; cursor: pointer; opacity: 0.35; transition: all .15s; }
    .emoji-row { display: flex; gap: 10px; align-items: center; margin: 8px 0; }
    .duration-display { font-weight: 700; font-size: 1rem; min-width: 60px; display: inline-block; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }
    .form-group label { font-size: .8rem; color: #64748b; font-weight: 600; }
    .form-group input, .form-group textarea { border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 10px; font-size: .9rem; font-family: inherit; }
    .divider-or { text-align: center; color: #94a3b8; font-size: .8rem; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    th { color: #94a3b8; font-weight: 600; text-align: left; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    td { padding: 8px 0; border-bottom: 1px solid #f8fafc; }
    .chart-legend { display: flex; gap: 16px; font-size: .75rem; color: #64748b; margin-top: 8px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; margin-right: 4px; }
    @media (max-width: 600px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <nav class="navbar">
    <a href="/index.html">🏠 Dashboard</a>
    <a href="/diet.html">🍽 Diet</a>
    <a href="/workout.html">💪 Workout</a>
    <a href="/sleep.html" class="active">😴 Sleep</a>
    <a href="/progress.html">📈 Progress</a>
    <a href="/settings.html">⚙️ Settings</a>
  </nav>

  <div class="container" style="max-width:820px;margin:0 auto;padding:24px 16px;">

    <!-- LOG FORM -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">📅 Log Last Night's Sleep</div>

      <div class="form-row">
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="sleepDate">
        </div>
        <div class="form-group">
          <label>🌙 Bedtime</label>
          <input type="time" id="bedtime">
        </div>
        <div class="form-group">
          <label>☀️ Wake Time</label>
          <input type="time" id="wakeTime">
        </div>
        <div class="form-group" style="justify-content:flex-end;">
          <label>Duration</label>
          <span class="duration-display" id="durationDisplay" style="padding:7px 0;"></span>
        </div>
      </div>

      <div class="divider-or">— or enter total hours directly —</div>

      <div class="form-row" style="margin-bottom:12px;">
        <div class="form-group" style="max-width:160px;">
          <label>Total Hours</label>
          <input type="number" id="manualHours" min="0" max="24" step="0.5" placeholder="e.g. 7.5">
        </div>
      </div>

      <div style="margin-bottom:12px;">
        <div style="font-size:.8rem;color:#64748b;font-weight:600;margin-bottom:6px;">How did you sleep?</div>
        <div class="emoji-row">
          <button class="emoji-btn" data-val="1" title="Exhausted">😩</button>
          <button class="emoji-btn" data-val="2" title="Poor">😴</button>
          <button class="emoji-btn" data-val="3" title="OK">😐</button>
          <button class="emoji-btn" data-val="4" title="Good">😊</button>
          <button class="emoji-btn" data-val="5" title="Great">🤩</button>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label>Notes (optional)</label>
        <textarea id="sleepNotes" rows="2" placeholder="Woke up once, vivid dreams..."></textarea>
      </div>

      <button id="saveSleepBtn" class="btn-primary">Save Sleep Entry</button>
    </div>

    <!-- INSIGHT CARDS -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-val" id="statAvgHours">—</div>
        <div class="stat-label">Avg This Week</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" id="statGoalNights">—</div>
        <div class="stat-label">Goal Nights (≥7.5h)</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" id="statAvgQuality" style="font-size:1.8rem;">—</div>
        <div class="stat-label">Avg Quality</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" id="statStreak">—</div>
        <div class="stat-label">Current Streak</div>
      </div>
    </div>

    <!-- CHART -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">📈 Last 7 Nights</div>
      <canvas id="sleepChart" height="120"></canvas>
      <div class="chart-legend">
        <span><span class="legend-dot" style="background:#22c55e;"></span>Goal met (≥7.5h)</span>
        <span><span class="legend-dot" style="background:#6366f1;"></span>Below goal</span>
        <span><span class="legend-dot" style="background:#e2e8f0;"></span>Not logged</span>
      </div>
    </div>

    <!-- HISTORY TABLE -->
    <div class="card">
      <div class="card-title">📋 Recent Nights</div>
      <table>
        <thead>
          <tr><th>Date</th><th>Duration</th><th>Quality</th><th>Notes</th></tr>
        </thead>
        <tbody id="sleepTableBody"></tbody>
      </table>
      <p id="sleepTableEmpty" style="color:#94a3b8;font-size:.9rem;text-align:center;padding:16px 0;display:none;">
        No sleep entries yet — log your first night above
      </p>
    </div>

  </div>

  <script src="/js/api.js"></script>
  <script src="/js/auth.js"></script>
  <script src="/js/sleep.js"></script>
</body>
</html>
```

- [ ] **Step 3: Check that `style.css` has `.btn-primary` and `.card` classes**

```bash
grep -n "btn-primary\|\.card[^-]" public/style.css | head -6
```

If `.btn-primary` doesn't exist, check what button class the rest of the app uses (e.g., `public/onboarding.html`) and use the same class name in `sleep.html`'s Save button instead.

- [ ] **Step 4: Syntax check**

```bash
node --check public/js/sleep.js
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add public/sleep.html public/js/sleep.js
git commit -m "feat(sleep): add sleep.html page and sleep.js frontend

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Dashboard sleep summary card + nav link

**Files:**
- Modify: `public/index.html`
- Modify: `public/js/dashboard.js`

- [ ] **Step 1: Add Sleep nav link to `index.html`**

Find the `<nav>` block in `public/index.html`. Add a Sleep link alongside the existing nav items (the exact surrounding HTML varies — find the nav and add it):

```html
<a href="/sleep.html">😴 Sleep</a>
```

- [ ] **Step 2: Add sleep summary card HTML to `index.html`**

Find a suitable location in `public/index.html` — after the Hydration Tracker card (search for `💧 Hydration Tracker`) and add this card in the same grid section:

```html
<!-- Sleep Summary Card -->
<div class="card" id="sleepSummaryCard">
  <div class="card-title">😴 Last Night's Sleep</div>
  <div id="sleepSummaryContent" style="color:#64748b;font-size:.9rem;">Loading...</div>
</div>
```

- [ ] **Step 3: Add `loadSleepSummary` to `public/js/dashboard.js`**

At the bottom of `public/js/dashboard.js`, add this function:

```js
async function loadSleepSummary() {
  try {
    const res = await apiFetch('/api/sleep/history');
    const el = document.getElementById('sleepSummaryContent');
    if (!el) return;

    if (!res.ok || !res.data || res.data.length === 0) {
      el.innerHTML = '<a href="/sleep.html" style="color:#6366f1;">Log last night\'s sleep →</a>';
      return;
    }

    const QUALITY_EMOJIS = ['', '😩', '😴', '😐', '😊', '🤩'];
    const entry = res.data[0];
    const h = Math.floor(entry.durationMinutes / 60);
    const m = entry.durationMinutes % 60;
    const dur = m === 0 ? `${h}h` : `${h}h ${m}m`;
    const qual = QUALITY_EMOJIS[entry.quality] || '';
    const dateLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    el.innerHTML = `
      <div style="font-size:1.4rem;font-weight:700;color:#1e293b;">${dur} ${qual}</div>
      <div style="font-size:.8rem;color:#94a3b8;margin-top:2px;">${dateLabel} · <a href="/sleep.html" style="color:#6366f1;">View all →</a></div>
    `;
  } catch (e) {
    // graceful degradation — sleep card failure must not affect rest of dashboard
    console.warn('Sleep summary load failed:', e);
  }
}
```

- [ ] **Step 4: Call `loadSleepSummary()` in the DOMContentLoaded handler**

In `public/js/dashboard.js`, find the DOMContentLoaded `try` block where other sections are loaded (e.g., after `buildRecipes()` or `loadProgress()`). Add:

```js
loadSleepSummary();
```

It's wrapped in the existing `try/catch`, so a failure won't cascade.

- [ ] **Step 5: Syntax check**

```bash
node --check public/js/dashboard.js
```

Expected: no output.

- [ ] **Step 6: Run full test suite — no regressions**

```bash
npm test
```

Expected: all tests pass (36+ total, same count as after Task 4).

- [ ] **Step 7: Commit and push**

```bash
git add public/index.html public/js/dashboard.js
git commit -m "feat(sleep): add sleep summary card and nav link to dashboard

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push origin main
```

Expected: GitHub Actions passes, Azure deploys. After ~40s cold start, visit `kaha.online/sleep.html` to verify the page loads.

---

## Self-Review Checklist

- [x] Schema: `sleepEntry` with all 5 fields — covered in Task 1
- [x] Validation: 400 on missing duration/times — covered in Task 3 route + Task 4 test
- [x] Overnight sleep calc — covered in Task 3 `calcDuration` + Task 4 test
- [x] Upsert — `findOneAndUpdate` with `upsert:true` in Task 3; test in Task 4
- [x] GET /history — sorted desc, excludes no-sleep logs — Task 3 + Task 4
- [x] GET /stats — uses `computeSleepStats` — Task 3 + Task 2 unit tests
- [x] Frontend log form: times OR manual hours — Task 5
- [x] Emoji quality picker — Task 5
- [x] 7-day chart — Task 5, Chart.js bar chart with goal line
- [x] Insight cards show `—` if <3 entries — Task 5 `loadAll()` `enough` check
- [x] Recent nights table — Task 5
- [x] Dashboard card with graceful degradation — Task 6
- [x] Nav link — Task 6
- [x] `body { visibility: hidden }` pattern — Task 5 `sleep.html`
- [x] All async handlers use `try/catch + next(err)` — Task 3
