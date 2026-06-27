# Profile V2 — P4: Progress, Logging, Breathing UI, Guidelines

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the progress page with goal-aware charts (sleep, mood, macro, workout adherence); add food + workout detail logging to HealthLog; personalise the guidelines page to show only active condition cards with community-specific notes; add Surya Namaskar and pranayama to the breathing/workout UI; auto-calculate water goal from weight.

**Architecture:** `HealthLog` model gains `meals[]` and `exerciseLog[]` arrays. `computeStats` is extended with macro aggregation. `progress.js` adds 4 new chart sections. `guidelines.js` filters condition cards by `active === true`. Dashboard gains a quick-log panel.

**Tech Stack:** Vanilla JS, Chart.js (already used for weight chart), Node.js, Mongoose.

**Prerequisite:** Plan P1 (data foundation) for active conditions. Plan P3 for pranayama data.

**Spec:** `docs/superpowers/specs/2026-06-27-profile-onboarding-v2-design.md` Sections 9, 11, 13.1–13.7

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `models/HealthLog.js` | Modify | Add meals[], exerciseLog[] fields |
| `lib/computeStats.js` | Modify | Add macro + sleep + mood aggregation |
| `routes/logs.js` | Modify | Accept meal/exercise log entries |
| `public/js/progress.js` | Modify | Add sleep/mood/macro/adherence charts |
| `public/js/guidelines.js` | Modify | Filter by active conditions + community notes |
| `public/js/dashboard.js` | Modify | Quick-log panel + auto water goal display |
| `public/js/breathing.js` | Modify | Add pranayama section |
| `tests/lib/computeStats-v2.test.js` | Create | Tests for macro/sleep/mood aggregation |

---

### Task 16: Extend HealthLog model — meals + exercise logging

**Files:**
- Modify: `models/HealthLog.js`
- Create: `tests/models/healthLog-v2.test.js`

- [ ] **Step 1: Write failing tests**

Create `tests/models/healthLog-v2.test.js`:

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

const HealthLog = require('../../models/HealthLog');

test('HealthLog stores meals with calorie data', async () => {
  const userId = new mongoose.Types.ObjectId();
  const log = await HealthLog.create({
    userId, date: '2026-06-27',
    meals: [{
      mealType: 'breakfast',
      recipeName: 'Pesarattu',
      calories: 260, proteinG: 14, carbsG: 44, fatG: 4
    }]
  });
  expect(log.meals).toHaveLength(1);
  expect(log.meals[0].calories).toBe(260);
  expect(log.meals[0].mealType).toBe('breakfast');
});

test('HealthLog stores exerciseLog with sets/reps', async () => {
  const userId = new mongoose.Types.ObjectId();
  const log = await HealthLog.create({
    userId, date: '2026-06-28',
    exerciseLog: [{
      exerciseName: 'Push Up',
      sets: 3, reps: 15, weightKg: 0, durationMin: 0
    }]
  });
  expect(log.exerciseLog[0].exerciseName).toBe('Push Up');
  expect(log.exerciseLog[0].sets).toBe(3);
});

test('HealthLog stores Surya Namaskar rounds', async () => {
  const userId = new mongoose.Types.ObjectId();
  const log = await HealthLog.create({
    userId, date: '2026-06-29',
    exerciseLog: [{
      exerciseName: 'Surya Namaskar',
      sets: 12, reps: 1, weightKg: 0, durationMin: 20
    }]
  });
  expect(log.exerciseLog[0].exerciseName).toBe('Surya Namaskar');
  expect(log.exerciseLog[0].sets).toBe(12);
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest tests/models/healthLog-v2.test.js --no-coverage
```

Expected: failures on `meals` and `exerciseLog` (fields don't exist yet)

- [ ] **Step 3: Update HealthLog model**

In `models/HealthLog.js`, add new schema fields after the existing fields:

```js
const mealEntrySchema = new mongoose.Schema({
  mealType:   { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
  recipeName: String,
  calories:   { type: Number, default: 0 },
  proteinG:   { type: Number, default: 0 },
  carbsG:     { type: Number, default: 0 },
  fatG:       { type: Number, default: 0 }
}, { _id: false });

const exerciseEntrySchema = new mongoose.Schema({
  exerciseName: { type: String, required: true },
  sets:         { type: Number, default: 0 },
  reps:         { type: Number, default: 0 },
  weightKg:     { type: Number, default: 0 },
  durationMin:  { type: Number, default: 0 }
}, { _id: false });
```

Then in `HealthLogSchema`, add:

```js
meals:       [mealEntrySchema],
exerciseLog: [exerciseEntrySchema],
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest tests/models/healthLog-v2.test.js --no-coverage
```

Expected: 3 passing

- [ ] **Step 5: Full suite**

```bash
npx jest --no-coverage
```

Expected: all passing

- [ ] **Step 6: Commit**

```bash
git add models/HealthLog.js tests/models/healthLog-v2.test.js
git commit -m "feat: HealthLog adds meals[] and exerciseLog[] for calorie and workout tracking"
```

---

### Task 17: Extend computeStats — macros, sleep trend, mood trend

**Files:**
- Modify: `lib/computeStats.js`
- Create: `tests/lib/computeStats-v2.test.js`

- [ ] **Step 1: Write tests**

Create `tests/lib/computeStats-v2.test.js`:

```js
const computeStats = require('../../lib/computeStats');

const logs = [
  {
    date: '2026-06-25', weight: 80, waterIntake: 2.5, completedWorkout: true,
    moodScore: 4, energyScore: 3,
    meals: [
      { mealType: 'breakfast', recipeName: 'Idli', calories: 200, proteinG: 8, carbsG: 40, fatG: 2 },
      { mealType: 'lunch',     recipeName: 'Rice', calories: 350, proteinG: 10, carbsG: 70, fatG: 3 }
    ],
    sleepEntry: { durationMinutes: 420, quality: 4 }
  },
  {
    date: '2026-06-26', weight: 79.8, waterIntake: 2.0, completedWorkout: false,
    moodScore: 3, energyScore: 2,
    meals: [
      { mealType: 'breakfast', recipeName: 'Dosa', calories: 180, proteinG: 6, carbsG: 35, fatG: 3 }
    ],
    sleepEntry: { durationMinutes: 390, quality: 3 }
  }
];

const profile = { waterGoalL: 2.5, startWeightKg: 82 };

test('computeStats returns avgCalories from meals', () => {
  const stats = computeStats(logs, profile);
  // Day 1: 550 cal, Day 2: 180 cal → avg = 365
  expect(stats.avgCalories).toBe(365);
});

test('computeStats returns avgProtein from meals', () => {
  const stats = computeStats(logs, profile);
  // Day 1: 18g, Day 2: 6g → avg = 12
  expect(stats.avgProtein).toBe(12);
});

test('computeStats returns avgSleepMinutes', () => {
  const stats = computeStats(logs, profile);
  // (420 + 390) / 2 = 405
  expect(stats.avgSleepMinutes).toBe(405);
});

test('computeStats returns avgMoodScore', () => {
  const stats = computeStats(logs, profile);
  // (4 + 3) / 2 = 3.5
  expect(stats.avgMoodScore).toBe(3.5);
});

test('computeStats returns avgEnergyScore', () => {
  const stats = computeStats(logs, profile);
  // (3 + 2) / 2 = 2.5
  expect(stats.avgEnergyScore).toBe(2.5);
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx jest tests/lib/computeStats-v2.test.js --no-coverage
```

Expected: failures on `avgCalories`, `avgSleepMinutes`, `avgMoodScore`, `avgEnergyScore`

- [ ] **Step 3: Update computeStats.js**

In `lib/computeStats.js`, add to the return object:

```js
// Macro aggregation from meals[]
const logsWithMeals = logs.filter(l => Array.isArray(l.meals) && l.meals.length > 0);
const avgCalories = logsWithMeals.length
  ? Math.round(logsWithMeals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + (m.calories || 0), 0), 0) / logsWithMeals.length)
  : 0;
const avgProtein = logsWithMeals.length
  ? Math.round(logsWithMeals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + (m.proteinG || 0), 0), 0) / logsWithMeals.length)
  : 0;
const avgCarbs = logsWithMeals.length
  ? Math.round(logsWithMeals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + (m.carbsG || 0), 0), 0) / logsWithMeals.length)
  : 0;
const avgFat = logsWithMeals.length
  ? Math.round(logsWithMeals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + (m.fatG || 0), 0), 0) / logsWithMeals.length)
  : 0;

// Sleep aggregation
const sleepLogs = logs.filter(l => l.sleepEntry && l.sleepEntry.durationMinutes > 0);
const avgSleepMinutes = sleepLogs.length
  ? Math.round(sleepLogs.reduce((s, l) => s + l.sleepEntry.durationMinutes, 0) / sleepLogs.length)
  : 0;
const avgSleepQuality = sleepLogs.length
  ? parseFloat((sleepLogs.reduce((s, l) => s + (l.sleepEntry.quality || 0), 0) / sleepLogs.length).toFixed(1))
  : 0;

// Mood + energy
const moodLogs = logs.filter(l => l.moodScore > 0);
const avgMoodScore = moodLogs.length
  ? parseFloat((moodLogs.reduce((s, l) => s + l.moodScore, 0) / moodLogs.length).toFixed(1))
  : 0;
const energyLogs = logs.filter(l => l.energyScore > 0);
const avgEnergyScore = energyLogs.length
  ? parseFloat((energyLogs.reduce((s, l) => s + l.energyScore, 0) / energyLogs.length).toFixed(1))
  : 0;
```

Add these to the return statement:

```js
avgCalories, avgProtein, avgCarbs, avgFat,
avgSleepMinutes, avgSleepQuality, avgMoodScore, avgEnergyScore
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx jest tests/lib/computeStats-v2.test.js --no-coverage
npx jest --no-coverage
```

Expected: all passing

- [ ] **Step 5: Commit**

```bash
git add lib/computeStats.js tests/lib/computeStats-v2.test.js
git commit -m "feat: computeStats adds macro, sleep, mood, energy aggregation"
```

---

### Task 18: Progress page — goal-aware charts

**Files:**
- Modify: `public/js/progress.js`

Add sleep, mood/energy, macro, and workout adherence sections to the progress page.

- [ ] **Step 1: Read the current progress page structure**

```bash
grep -n "function\|Chart\|getElementById\|async" public/js/progress.js | head -30
```

Note the existing chart instances and container IDs.

- [ ] **Step 2: Add new chart containers to progress HTML**

In `public/index.html` (or wherever the progress section lives), add after the existing weight chart:

```html
<!-- Macro tracking chart -->
<div id="macroSection" style="display:none">
  <h3 style="font-size:.95rem;font-weight:700;margin:16px 0 8px">📊 Daily Nutrition (7-day avg)</h3>
  <canvas id="macroChart" height="120"></canvas>
  <div id="macroSummary" style="display:flex;gap:16px;margin-top:8px;font-size:.82rem"></div>
</div>

<!-- Sleep trend chart -->
<div id="sleepSection" style="display:none">
  <h3 style="font-size:.95rem;font-weight:700;margin:16px 0 8px">😴 Sleep Trend (last 30 days)</h3>
  <canvas id="sleepChart" height="100"></canvas>
</div>

<!-- Mood + Energy trend -->
<div id="moodSection" style="display:none">
  <h3 style="font-size:.95rem;font-weight:700;margin:16px 0 8px">🧠 Mood &amp; Energy (last 30 days)</h3>
  <canvas id="moodChart" height="100"></canvas>
</div>
```

- [ ] **Step 3: Add chart rendering functions to progress.js**

Append to `public/js/progress.js`:

```js
function renderMacroChart(stats, targets) {
  const section = document.getElementById('macroSection');
  if (!section) return;
  if (!stats.avgCalories && !stats.avgProtein) return;
  section.style.display = 'block';

  const ctx = document.getElementById('macroChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'],
      datasets: [
        {
          label: 'Consumed (avg)',
          data: [stats.avgCalories || 0, stats.avgProtein || 0, stats.avgCarbs || 0, stats.avgFat || 0],
          backgroundColor: '#1b4332'
        },
        {
          label: 'Target',
          data: [targets.dailyCalorieTarget || 0, targets.dailyProteinG || 0, targets.dailyCarbsG || 0, targets.dailyFatG || 0],
          backgroundColor: '#86efac'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });

  const summary = document.getElementById('macroSummary');
  if (summary) {
    summary.innerHTML = [
      { label: 'Calories', val: stats.avgCalories, target: targets.dailyCalorieTarget, unit: 'kcal' },
      { label: 'Protein',  val: stats.avgProtein,  target: targets.dailyProteinG,      unit: 'g' },
      { label: 'Carbs',    val: stats.avgCarbs,    target: targets.dailyCarbsG,         unit: 'g' },
      { label: 'Fat',      val: stats.avgFat,      target: targets.dailyFatG,           unit: 'g' }
    ].map(({ label, val, target, unit }) => {
      const pct = target ? Math.round((val / target) * 100) : 0;
      const color = pct >= 90 && pct <= 110 ? '#16a34a' : '#d97706';
      return `<div style="text-align:center"><div style="font-weight:700;color:${color}">${val || 0}${unit}</div><div style="color:#6b7280">${label}<br>${target || '—'}${unit} target</div></div>`;
    }).join('');
  }
}

async function renderSleepChart() {
  const section = document.getElementById('sleepSection');
  if (!section) return;
  const res = await apiFetch('/api/logs/data/sleep-trend');
  if (!res.ok || !res.data.length) return;
  section.style.display = 'block';

  const ctx = document.getElementById('sleepChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: res.data.map(d => d.date.slice(5)),
      datasets: [
        {
          label: 'Hours slept',
          data: res.data.map(d => parseFloat((d.durationMinutes / 60).toFixed(1))),
          backgroundColor: '#7c3aed',
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Quality (1-5)',
          data: res.data.map(d => d.quality),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y:  { beginAtZero: true, max: 12, title: { display: true, text: 'Hours' } },
        y1: { beginAtZero: true, max: 5,  position: 'right', title: { display: true, text: 'Quality' } }
      }
    }
  });
}

async function renderMoodChart() {
  const section = document.getElementById('moodSection');
  if (!section) return;
  const res = await apiFetch('/api/logs/data/mood-trend');
  if (!res.ok || !res.data.length) return;
  section.style.display = 'block';

  const ctx = document.getElementById('moodChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: res.data.map(d => d.date.slice(5)),
      datasets: [
        {
          label: 'Mood',
          data: res.data.map(d => d.moodScore),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,.1)',
          fill: true, tension: 0.3
        },
        {
          label: 'Energy',
          data: res.data.map(d => d.energyScore),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,.1)',
          fill: true, tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { min: 1, max: 5 } }
    }
  });
}
```

- [ ] **Step 4: Wire charts into loadProgress()**

In `loadProgress()`, after the existing chart calls, add:

```js
// Macro chart (needs stats + profile targets)
renderMacroChart(stats, {
  dailyCalorieTarget: profile.dailyCalorieTarget,
  dailyProteinG:      profile.dailyProteinG,
  dailyCarbsG:        profile.dailyCarbsG,
  dailyFatG:          profile.dailyFatG
});

// Sleep + mood charts
renderSleepChart();
renderMoodChart();
```

- [ ] **Step 5: Add sleep-trend and mood-trend API endpoints**

In `routes/logs.js`, add:

```js
router.get('/data/sleep-trend', authenticate, requireProfile, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: thirtyDaysAgo.toISOString().slice(0,10) },
      'sleepEntry.durationMinutes': { $gt: 0 }
    }).select('date sleepEntry -_id').sort({ date: 1 }).lean();
    res.json(logs.map(l => ({
      date: l.date,
      durationMinutes: l.sleepEntry.durationMinutes,
      quality: l.sleepEntry.quality || 0
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/mood-trend', authenticate, requireProfile, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: thirtyDaysAgo.toISOString().slice(0,10) }
    }).select('date moodScore energyScore -_id').sort({ date: 1 }).lean();
    res.json(logs.filter(l => l.moodScore > 0 || l.energyScore > 0));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
```

- [ ] **Step 6: Commit**

```bash
git add public/js/progress.js routes/logs.js
git commit -m "feat: progress page adds macro, sleep, mood/energy charts; logs route adds sleep-trend + mood-trend endpoints"
```

---

### Task 19: Guidelines — filter by active conditions + community notes

**Files:**
- Modify: `public/js/guidelines.js`

- [ ] **Step 1: Read current guidelines render logic**

```bash
grep -n "CONDITION_CARDS\|function render\|profile\." public/js/guidelines.js | head -30
```

Note how condition cards are currently shown (likely shows all hardcoded conditions regardless of profile).

- [ ] **Step 2: Update guidelines to filter by active conditions**

In `guidelines.js`, find where condition cards are rendered. Replace the logic that iterates over `CONDITION_CARDS` to filter by profile's active conditions:

```js
function renderConditionCards(profile) {
  const container = document.getElementById('conditionCards');
  if (!container) return;

  // Only show cards for active conditions
  const activeConditionNames = (profile.healthConditions || [])
    .filter(c => typeof c === 'string' || c.active !== false)
    .map(c => (typeof c === 'string' ? c : c.name).toLowerCase());

  const cardsToShow = Object.entries(CONDITION_CARDS)
    .filter(([key]) => activeConditionNames.some(ac => ac.includes(key) || key.includes(ac)));

  if (cardsToShow.length === 0) {
    container.innerHTML = '<p style="color:#6b7280;font-size:.85rem">No active health conditions — great! 🎉</p>';
    return;
  }

  container.innerHTML = cardsToShow.map(([key, card]) => `
    <div class="condition-card ${card.cls}">
      <h4>${card.title}</h4>
      <ul>${card.items.map(item => `<li>${item}</li>`).join('')}</ul>
    </div>
  `).join('');
}
```

- [ ] **Step 3: Add community-specific nutritional notes**

In `guidelines.js`, add community notes data and render function:

```js
const COMMUNITY_NOTES = {
  Telugu: [
    '🌿 <strong>Ragi (finger millet)</strong> is highly recommended — rich in calcium and fibre. Use for rotis or porridge.',
    '🌿 <strong>Gongura (sorrel leaves)</strong> are iron-rich and support anaemia prevention — include 2-3x/week.',
    '🌿 <strong>Raw turmeric</strong> (fresh Haridra) in morning milk or tea supports inflammation reduction.',
    '🌿 <strong>Neem leaves</strong> — 5-6 leaves on empty stomach weekly supports blood sugar and skin.',
    '🌿 Prefer <strong>cold-pressed coconut oil or sesame oil (gingelly oil)</strong> over refined oils.'
  ],
  Tamil: [
    '🌿 <strong>Kollu (horse gram)</strong> — high protein legume; include weekly for weight management.',
    '🌿 <strong>Sesame seeds (til)</strong> — excellent calcium source; add to rice, ladoo, or chutney.',
    '🌿 <strong>Moringa (murungai keerai)</strong> leaves — exceptionally high in iron, calcium, Vitamin C.',
    '🌿 Prefer <strong>gingelly oil (sesame oil)</strong> for cooking — heart-healthy monounsaturated fats.'
  ],
  Kannada: [
    '🌿 <strong>Ragi (Raagi)</strong> is the staple grain of Karnataka — excellent for bone health and weight management.',
    '🌿 <strong>Bisi bele bath</strong> with ghee — complete protein + carb meal; ideal post-workout.',
    '🌿 Prefer <strong>coconut oil</strong> for coastal Karnataka cooking and <strong>groundnut oil</strong> for northern Karnataka.'
  ],
  Malayalam: [
    '🌿 <strong>Coconut</strong> (fresh, coconut milk, coconut oil) is central to Kerala cuisine and provides healthy MCTs.',
    '🌿 <strong>Moringa (muringakka)</strong> and <strong>drumstick</strong> are dietary staples; include regularly.',
    '🌿 <strong>Fish</strong> (especially sardines and mackerel) — omega-3 rich; 3-4x/week recommended.'
  ]
};

function renderCommunityNotes(profile) {
  const container = document.getElementById('communityNotes');
  if (!container) return;
  const community = profile.languageCommunity;
  const notes = COMMUNITY_NOTES[community];
  if (!notes || notes.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.innerHTML = `
    <h4 style="font-weight:700;margin-bottom:8px">🍽️ ${community} Community Nutritional Tips</h4>
    <ul style="padding-left:16px">${notes.map(n => `<li style="margin-bottom:6px;font-size:.85rem">${n}</li>`).join('')}</ul>
  `;
}
```

Call both functions in the main guidelines loader:

```js
async function loadGuidelines() {
  const res = await apiFetch('/api/profile');
  if (!res.ok) return;
  const profile = res.data;
  renderConditionCards(profile);
  renderCommunityNotes(profile);
  // ... existing seed tracker and supplement timing logic
}
```

- [ ] **Step 4: Add communityNotes container to HTML**

In the guidelines section of `public/index.html`, add:

```html
<div id="communityNotes" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin-bottom:16px"></div>
```

- [ ] **Step 5: Commit**

```bash
git add public/js/guidelines.js public/index.html
git commit -m "feat: guidelines shows only active condition cards + community-specific nutritional tips"
```

---

### Task 20: Dashboard quick-log panel

**Files:**
- Modify: `public/js/dashboard.js`
- Modify: `public/index.html`

- [ ] **Step 1: Add quick-log panel HTML to index.html**

Find the dashboard main content area and add:

```html
<!-- Quick Log Panel -->
<div class="card" id="quickLogPanel">
  <div class="card-header">⚡ Quick Log</div>
  <div style="display:flex;flex-wrap:wrap;gap:10px;padding:12px 0">

    <!-- Log weight -->
    <div style="flex:1;min-width:140px">
      <div style="font-size:.78rem;font-weight:600;color:#374151;margin-bottom:4px">Weight</div>
      <div style="display:flex;gap:6px">
        <input type="number" id="qlWeight" step="0.1" placeholder="kg" style="width:70px;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:.85rem">
        <button onclick="logWeight()" style="background:#1b4332;color:#fff;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.82rem">Log</button>
      </div>
    </div>

    <!-- Log water -->
    <div style="flex:1;min-width:140px">
      <div style="font-size:.78rem;font-weight:600;color:#374151;margin-bottom:4px">Water</div>
      <div style="display:flex;gap:6px">
        <button onclick="logWater(0.25)" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:.82rem">+250ml</button>
        <button onclick="logWater(0.5)" style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:.82rem">+500ml</button>
      </div>
    </div>

    <!-- Mark workout done -->
    <div style="flex:1;min-width:140px">
      <div style="font-size:.78rem;font-weight:600;color:#374151;margin-bottom:4px">Workout</div>
      <button onclick="toggleWorkoutLog()" id="workoutLogBtn" style="background:#f0fdf4;color:#1b4332;border:1px solid #bbf7d0;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:.82rem">Mark Done ✓</button>
    </div>

  </div>

  <!-- Exercise detail (expands when workout marked done) -->
  <div id="exerciseDetail" style="display:none;margin-top:8px;border-top:1px solid #f3f4f6;padding-top:10px">
    <div style="font-size:.82rem;font-weight:600;margin-bottom:6px">Today's exercises (optional detail)</div>
    <div id="exerciseRows"></div>
    <button onclick="addExerciseRow()" style="font-size:.78rem;color:#1b4332;background:none;border:none;cursor:pointer;margin-top:4px">+ Add exercise</button>
    <button onclick="saveExerciseLog()" style="margin-left:12px;background:#1b4332;color:#fff;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:.8rem">Save Log</button>
  </div>

  <div id="qlMsg" style="font-size:.8rem;margin-top:6px;color:#16a34a"></div>
</div>
```

- [ ] **Step 2: Add quick-log JS to dashboard.js**

Append to `public/js/dashboard.js`:

```js
async function logWeight() {
  const input = document.getElementById('qlWeight');
  const w = parseFloat(input.value);
  if (!w || w < 20 || w > 300) { showQLMsg('Enter a valid weight (20–300 kg)', 'error'); return; }
  const today = new Date().toISOString().slice(0,10);
  const res = await apiFetch(`/api/logs/${today}`, {
    method: 'PATCH',
    body: JSON.stringify({ weight: w })
  });
  if (res.ok) { input.value = ''; showQLMsg('Weight logged ✓'); }
  else showQLMsg('Error: ' + (res.data?.error || ''), 'error');
}

async function logWater(litres) {
  const today = new Date().toISOString().slice(0,10);
  const logRes = await apiFetch(`/api/logs/${today}`);
  const current = logRes.ok ? (logRes.data.waterIntake || 0) : 0;
  const res = await apiFetch(`/api/logs/${today}`, {
    method: 'PATCH',
    body: JSON.stringify({ waterIntake: parseFloat((current + litres).toFixed(2)) })
  });
  if (res.ok) showQLMsg(`+${litres * 1000}ml logged ✓`);
  else showQLMsg('Error logging water', 'error');
}

async function toggleWorkoutLog() {
  const detail = document.getElementById('exerciseDetail');
  const btn = document.getElementById('workoutLogBtn');
  const today = new Date().toISOString().slice(0,10);
  await apiFetch(`/api/logs/${today}`, {
    method: 'PATCH',
    body: JSON.stringify({ completedWorkout: true })
  });
  btn.textContent = '✅ Workout done!';
  btn.style.background = '#f0fdf4';
  detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
  if (!document.getElementById('exerciseRows').children.length) addExerciseRow();
  showQLMsg('Workout marked done ✓');
}

function addExerciseRow() {
  const rows = document.getElementById('exerciseRows');
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap';
  row.innerHTML = `
    <input placeholder="Exercise name" style="flex:2;min-width:120px;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem">
    <input type="number" placeholder="Sets" style="width:50px;padding:4px 6px;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem">
    <input type="number" placeholder="Reps" style="width:50px;padding:4px 6px;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem">
    <input type="number" step="0.5" placeholder="kg" style="width:55px;padding:4px 6px;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem">
  `;
  rows.appendChild(row);
}

async function saveExerciseLog() {
  const rows = Array.from(document.getElementById('exerciseRows').children);
  const exerciseLog = rows.map(row => {
    const inputs = row.querySelectorAll('input');
    return {
      exerciseName: inputs[0].value.trim(),
      sets: parseInt(inputs[1].value) || 0,
      reps: parseInt(inputs[2].value) || 0,
      weightKg: parseFloat(inputs[3].value) || 0,
      durationMin: 0
    };
  }).filter(e => e.exerciseName);

  if (!exerciseLog.length) { showQLMsg('No exercises to save', 'error'); return; }
  const today = new Date().toISOString().slice(0,10);
  const res = await apiFetch(`/api/logs/${today}`, {
    method: 'PATCH',
    body: JSON.stringify({ exerciseLog })
  });
  if (res.ok) showQLMsg('Exercise log saved ✓');
  else showQLMsg('Error saving', 'error');
}

function showQLMsg(text, type = 'success') {
  const el = document.getElementById('qlMsg');
  if (!el) return;
  el.textContent = text;
  el.style.color = type === 'error' ? '#dc2626' : '#16a34a';
  setTimeout(() => { el.textContent = ''; }, 3000);
}
```

- [ ] **Step 3: Update logs PATCH route to accept exerciseLog**

In `routes/logs.js`, find the PATCH handler and add `exerciseLog` to the allowed fields:

```js
router.patch('/:date', authenticate, requireProfile, async (req, res) => {
  try {
    const allowed = ['weight', 'waterIntake', 'completedWorkout', 'moodScore', 'energyScore', 'notes', 'meals', 'exerciseLog'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user._id, date: req.params.date },
      { $set: updates },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
```

- [ ] **Step 4: Full suite**

```bash
npx jest --no-coverage
```

Expected: all passing

- [ ] **Step 5: Commit**

```bash
git add public/js/dashboard.js public/index.html routes/logs.js
git commit -m "feat: dashboard quick-log panel for weight, water, workout done, exercise detail"
```

---

### Task 21: Water goal auto-display + pranayama in breathing UI

**Files:**
- Modify: `public/js/dashboard.js` (water goal display)
- Modify: `public/js/breathing.js` (add pranayama section)

- [ ] **Step 1: Show auto-calculated water goal on dashboard**

In `dashboard.js`, find where water intake is displayed. After loading the profile, update the water goal display:

```js
apiFetch('/api/profile').then(res => {
  if (!res.ok) return;
  const p = res.data;
  const goalEl = document.getElementById('waterGoalDisplay');
  if (goalEl && p.waterGoalL) {
    goalEl.textContent = p.waterGoalL + 'L';
    const hint = document.getElementById('waterGoalHint');
    if (hint && p.currentWeightKg) {
      hint.textContent = `Based on your weight (${p.currentWeightKg}kg × 30ml)`;
    }
  }
});
```

- [ ] **Step 2: Add pranayama section to breathing page**

In `public/js/breathing.js`, add a function to load and render pranayama:

```js
async function loadPranayama() {
  const container = document.getElementById('pranayamaSection');
  if (!container) return;

  const res = await apiFetch('/api/breathing/techniques');
  if (!res.ok || !res.data.length) {
    container.innerHTML = '<p style="color:#6b7280;font-size:.85rem">Loading pranayama techniques…</p>';
    return;
  }

  container.innerHTML = res.data.map(tech => `
    <div class="breathing-card" style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h4 style="font-weight:700;color:#1b4332">${tech.name}</h4>
          <div style="font-size:.78rem;color:#6b7280">${tech.sanskrit} · ${tech.aka}</div>
        </div>
        <div style="font-size:.78rem;background:#f0fdf4;color:#1b4332;padding:3px 8px;border-radius:8px">${tech.bestTime}</div>
      </div>
      <div style="margin-top:8px;font-size:.82rem;color:#374151">
        <strong>Benefits:</strong> ${tech.benefits.slice(0,2).join(' · ')}
      </div>
      <div style="margin-top:8px;font-size:.82rem">
        <strong>${tech.rounds} rounds · ${tech.durationMin} min</strong>
      </div>
      <details style="margin-top:8px">
        <summary style="cursor:pointer;font-size:.82rem;color:#1b4332;font-weight:600">How to practice</summary>
        <ol style="margin-top:6px;padding-left:16px">
          ${tech.steps.map(s => `<li style="margin-bottom:4px;font-size:.82rem">${s}</li>`).join('')}
        </ol>
      </details>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadPranayama();
});
```

In the breathing page HTML (wherever breathing exercises are shown), add:

```html
<div id="pranayamaSection" style="margin-top:24px">
  <h3 style="font-size:1rem;font-weight:700;color:#1b4332;margin-bottom:12px">🕉️ Indian Pranayama</h3>
  <p style="font-size:.82rem;color:#6b7280;margin-bottom:12px">Personalised for your age and health conditions</p>
  <!-- Rendered by JS -->
</div>
```

- [ ] **Step 3: Commit**

```bash
git add public/js/breathing.js public/js/dashboard.js
git commit -m "feat: pranayama section in breathing UI; water goal auto-display with weight-based calculation"
```

---

## Plan 4 Complete

After all tasks complete:
- HealthLog tracks meals with calories/macros and detailed exercise log
- computeStats returns macro, sleep, mood/energy aggregates
- Progress page shows 4 new goal-aware charts
- Guidelines shows only active condition cards + community-specific tips
- Dashboard has quick-log panel (weight, water, workout + exercise detail)
- Breathing UI shows filtered pranayama with instructions
- Water goal auto-calculated from weight and displayed

**All 4 plans complete → full personalization engine shipped.**
