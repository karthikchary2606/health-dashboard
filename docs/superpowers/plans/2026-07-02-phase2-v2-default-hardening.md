# Phase 2 — V2 Default, IST Timezone, Cardio Mode, Mobile Hardening

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the v2 dashboard as the default for all users, fix day-boundary bugs for Indian users (IST), route cardio-preference users to a cardio-first workout schedule, and harden mobile layouts at 375 px.

**Architecture:**
- Task 1 removes the `?dashboard_v2=1` flag gate: v2 is now unconditional, v1 dead code deleted.
- Task 2 adds a `server/utils/time.js` utility so all server-side "today" lookups use IST (UTC+5:30) instead of UTC, preventing wrong-day meal previews after 18:30 UTC.
- Task 3 extends `detectWorkoutMode` in `plan-builder.js` to return a new `'cardio'` mode and adds `buildCardioSchedule` that converts the existing `CARDIO_PHASES` data into the same `schedule` day-object shape used by other modes.
- Task 4 tightens CSS media queries in `public/index.html` for 375 px viewports.

**Tech Stack:** Node.js, Express, Jest + Supertest, vanilla JS, CSS (no frameworks).

---

## File structure map

### Create
- `server/utils/time.js` — `todayIST()` returning `{ day: 'monday', isoDate: '2026-07-03' }` in Asia/Kolkata timezone.
- `tests/utils/time.test.js` — tests for `todayIST()` across UTC/IST day boundaries.
- `tests/engine/plan-builder-cardio.test.js` — tests for cardio mode detection and schedule shape.

### Modify
- `server/engine/dashboard-overview.js` — use `todayIST().day` in `pickTodayMeals`.
- `routes/sleep.js` — use `todayIST().isoDate` as the default date (line ~33).
- `server/engine/plan-builder.js` — add `'cardio'` case to `detectWorkoutMode`; add `buildCardioSchedule(profile, monthIndex)`; wire into `buildWorkoutPlan`.
- `public/js/dashboard.js` — remove `isDashboardV2Enabled()`, `DASHBOARD_V2_ENABLED`; make `renderDashboardPrompt` unconditional (drop `.v1` fallbacks); make `applyDashboardVariant` always add the class.
- `public/index.html` — remove `.v1` fallback HTML strings; remove `body.dashboard-v2-enabled` CSS prefixes (make those rules unconditional); remove `dashboardV2Badge` element; remove `style="display:none"` guard.

---

### Task 1: Remove v2 feature flag — make v2 unconditional

**Files:**
- Modify: `public/js/dashboard.js` (lines 21–73)
- Modify: `public/index.html` (lines 181–183, 504, 989–994)

- [ ] **Step 1: Remove flag detection and const from dashboard.js**

Replace lines 21–30 in `public/js/dashboard.js`:

```js
// DELETE these lines entirely:
function isDashboardV2Enabled() {
  try {
    const raw = new URLSearchParams(window.location.search).get('dashboard_v2');
    return raw === '1' || raw === 'true' || raw === 'on';
  } catch (e) {
    return false;
  }
}

const DASHBOARD_V2_ENABLED = isDashboardV2Enabled();
```

- [ ] **Step 2: Make renderDashboardPrompt always return v2 HTML**

In `public/js/dashboard.js`, function `renderDashboardPrompt`:

Replace:
```js
function renderDashboardPrompt(blockKind, state, options) {
  const next = options || {};
  if (!DASHBOARD_V2_ENABLED) return next.v1 || '';

  const config = {
```

With:
```js
function renderDashboardPrompt(blockKind, state) {
  const config = {
```

Then at the bottom of the function, replace:
```js
  const entry = (config[blockKind] || {})[state];
  if (!entry) return next.v1 || '';
  return "<div class='dashboard-state-callout'>...
```

With:
```js
  const entry = (config[blockKind] || {})[state];
  if (!entry) return '';
  return "<div class='dashboard-state-callout'><p class='dashboard-state-title'>" + entry.title + "</p><p class='dashboard-state-detail'>" + entry.detail + "</p>" + entry.action + "</div>";
```

- [ ] **Step 3: Update all callers of renderDashboardPrompt — remove v1 option objects**

In `public/js/dashboard.js`, find all occurrences of `renderDashboardPrompt(...)` calls that pass `{ v1: ... }` and remove the options argument entirely. There are 8 call sites. For each, change:

```js
renderDashboardPrompt('timeline', DASHBOARD_BLOCK_STATE.EMPTY, {
  v1: "<p style='color:var(--text-light);font-size:.85rem'>No timeline updates yet.</p>"
})
```

To:
```js
renderDashboardPrompt('timeline', DASHBOARD_BLOCK_STATE.EMPTY)
```

Do the same for every other call site (all pass similar v1 HTML strings as the third argument).

- [ ] **Step 4: Make applyDashboardVariant unconditional**

In `public/js/dashboard.js`, replace:
```js
function applyDashboardVariant() {
  if (!DASHBOARD_V2_ENABLED) return;
  document.body.classList.add('dashboard-v2-enabled');
  const badge = document.getElementById('dashboardV2Badge');
  if (badge) badge.style.display = 'inline-flex';
}
```

With:
```js
function applyDashboardVariant() {
  document.body.classList.add('dashboard-v2-enabled');
}
```

- [ ] **Step 5: Fix callers in index.html — remove v1 fallbacks**

In `public/index.html` lines 987–996, the `catch` block calls `renderDashboardPrompt` with `v1` option objects. Replace:

```js
setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.ERROR, {
  html: renderDashboardPrompt('timeline', DASHBOARD_BLOCK_STATE.ERROR, {
    v1: "<p style='color:#b91c1c;font-size:.85rem'>Unable to load dashboard timeline.</p>"
  })
});
setDashboardBlockState('sleepSummaryContent', DASHBOARD_BLOCK_STATE.ERROR, {
  html: renderDashboardPrompt('sleep', DASHBOARD_BLOCK_STATE.ERROR, {
    v1: "<span style='color:#b91c1c;'>Unable to load sleep summary right now.</span>"
  })
});
```

With:
```js
setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.ERROR, {
  html: renderDashboardPrompt('timeline', DASHBOARD_BLOCK_STATE.ERROR)
});
setDashboardBlockState('sleepSummaryContent', DASHBOARD_BLOCK_STATE.ERROR, {
  html: renderDashboardPrompt('sleep', DASHBOARD_BLOCK_STATE.ERROR)
});
```

- [ ] **Step 6: Remove v2 badge element from index.html**

In `public/index.html` line 504, replace:
```html
<h2>Daily Overview <span id="dashboardV2Badge" style="display:none;font-size:.68rem;background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:3px 8px;border-radius:999px;vertical-align:middle">V2 preview</span></h2>
```

With:
```html
<h2>Daily Overview</h2>
```

- [ ] **Step 7: Remove body.dashboard-v2-enabled CSS prefix from index.html**

In `public/index.html` lines 181–183, replace:
```css
body.dashboard-v2-enabled #sec-dashboard .card{border-top-width:4px}
body.dashboard-v2-enabled #sec-dashboard .card-title{justify-content:space-between}
body.dashboard-v2-enabled #sec-dashboard .stat-chip{box-shadow:0 6px 18px rgba(27,67,50,.09)}
```

With:
```css
#sec-dashboard .card{border-top-width:4px}
#sec-dashboard .card-title{justify-content:space-between}
#sec-dashboard .stat-chip{box-shadow:0 6px 18px rgba(27,67,50,.09)}
```

- [ ] **Step 8: Verify no remaining DASHBOARD_V2_ENABLED or v1 key references**

Run:
```bash
grep -rn "DASHBOARD_V2_ENABLED\|dashboard_v2\|\.v1\b\|dashboardV2Badge" public/
```

Expected: no matches.

- [ ] **Step 9: Run tests**

```bash
npm test
```

Expected: all tests pass (the v2 flag was only in client JS — no server-side tests depended on it).

- [ ] **Step 10: Commit**

```bash
git add public/js/dashboard.js public/index.html
git commit -m "feat: make dashboard v2 the default — remove feature flag and v1 fallbacks"
```

---

### Task 2: IST timezone normalization

**Files:**
- Create: `server/utils/time.js`
- Create: `tests/utils/time.test.js`
- Modify: `server/engine/dashboard-overview.js`
- Modify: `routes/sleep.js`

The server runs UTC. `new Date().getDay()` returns the UTC weekday. For Indian users (IST = UTC+5:30), after 18:30 UTC the server thinks it is the *next* day, so meal previews and default sleep dates roll over one day early. Fix by computing "today" in IST.

- [ ] **Step 1: Write failing test for todayIST**

Create `tests/utils/time.test.js`:

```js
'use strict';
const { todayIST } = require('../../server/utils/time');

describe('todayIST', () => {
  test('returns day string in lowercase', () => {
    const { day } = todayIST();
    const valid = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    expect(valid).toContain(day);
  });

  test('returns isoDate in YYYY-MM-DD format', () => {
    const { isoDate } = todayIST();
    expect(isoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('IST date is UTC date shifted by +5:30', () => {
    // Simulate 18:00 UTC on a Monday → IST is 23:30 same day = still Monday
    const fake = new Date('2026-07-06T18:00:00.000Z'); // Monday 18:00 UTC = Mon 23:30 IST
    const { day, isoDate } = todayIST(fake);
    expect(day).toBe('monday');
    expect(isoDate).toBe('2026-07-06');
  });

  test('IST rolls over to next day before UTC does', () => {
    // 19:00 UTC on Monday → IST is 00:30 Tuesday
    const fake = new Date('2026-07-06T19:00:00.000Z'); // Monday 19:00 UTC = Tue 00:30 IST
    const { day, isoDate } = todayIST(fake);
    expect(day).toBe('tuesday');
    expect(isoDate).toBe('2026-07-07');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/utils/time.test.js
```

Expected: FAIL with `Cannot find module '../../server/utils/time'`

- [ ] **Step 3: Create server/utils/time.js**

```js
'use strict';

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Returns the current day/date in IST (Asia/Kolkata, UTC+5:30).
 * Accepts an optional `now` Date for testing.
 *
 * @param {Date} [now] - override for testing; defaults to new Date()
 * @returns {{ day: string, isoDate: string }}
 */
function todayIST(now) {
  const utcMs = (now || new Date()).getTime();
  const istMs = utcMs + IST_OFFSET_MS;
  const istDate = new Date(istMs);
  const day = DAY_NAMES[istDate.getUTCDay()];
  const yyyy = istDate.getUTCFullYear();
  const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(istDate.getUTCDate()).padStart(2, '0');
  return { day, isoDate: `${yyyy}-${mm}-${dd}` };
}

module.exports = { todayIST };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/utils/time.test.js
```

Expected: 4 tests PASS.

- [ ] **Step 5: Fix pickTodayMeals in dashboard-overview.js**

In `server/engine/dashboard-overview.js`, at the top add:
```js
const { todayIST } = require('../utils/time');
```

Replace line 67:
```js
const today = DAY_NAMES[new Date().getDay()];
```

With:
```js
const today = todayIST().day;
```

Then remove the `DAY_NAMES` constant on line 25 since it is no longer used here:
```js
// DELETE: const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
```

- [ ] **Step 6: Fix default date in routes/sleep.js**

In `routes/sleep.js`, add the import near the top (after `'use strict';`):
```js
const { todayIST } = require('../server/utils/time');
```

Find line ~33:
```js
if (!date) date = new Date().toISOString().slice(0, 10);
```

Replace with:
```js
if (!date) date = todayIST().isoDate;
```

- [ ] **Step 7: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add server/utils/time.js tests/utils/time.test.js server/engine/dashboard-overview.js routes/sleep.js
git commit -m "fix: use IST timezone for daily meal preview and sleep default date"
```

---

### Task 3: Cardio workout mode

**Files:**
- Modify: `server/engine/plan-builder.js` — `detectWorkoutMode`, new `buildCardioSchedule`, `buildWorkoutPlan`
- Create: `tests/engine/plan-builder-cardio.test.js`

Currently a user who selects only `cardio` as their workout preference gets a home-strength schedule. They should get a cardio-first schedule built from the existing `CARDIO_PHASES` data.

- [ ] **Step 1: Write failing tests**

Create `tests/engine/plan-builder-cardio.test.js`:

```js
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
    // At least one active day should have a session name (not just rest)
    const activeDays = month1.schedule.filter(d => d.type !== 'rest');
    expect(activeDays.length).toBeGreaterThan(0);
    // Active days should carry a session field (not a muscleGroup-driven exercises array)
    activeDays.forEach(d => {
      expect(d.session).toBeDefined();
    });
  });

  test('gym + cardio preference keeps gym mode (gym wins)', () => {
    const plan = buildPlan(cardioProfile({ workoutPreferences: ['gym', 'cardio'] }));
    const month1 = plan.workout[0];
    const activeDays = month1.schedule.filter(d => d.type !== 'rest');
    // gym mode produces exercises arrays
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
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/engine/plan-builder-cardio.test.js
```

Expected: FAIL — `d.session` is undefined; active days have `exercises` arrays (wrong mode).

- [ ] **Step 3: Update detectWorkoutMode**

In `server/engine/plan-builder.js`, replace `detectWorkoutMode`:

```js
function detectWorkoutMode(profile) {
  const prefs = profile.workoutPreferences || [];
  const hasGym  = prefs.includes('gym') ||
                  (profile.equipmentAvailable || []).includes('gym-access');
  const hasYoga = prefs.includes('yoga');
  const hasCardio = prefs.includes('cardio');
  if (hasGym && hasYoga) return 'hybrid';
  if (hasYoga)           return 'yoga';
  if (hasGym)            return 'gym';
  if (hasCardio)         return 'cardio';
  return 'home';
}
```

- [ ] **Step 4: Add buildCardioSchedule**

In `server/engine/plan-builder.js`, add this function directly below `buildHybridSchedule`:

```js
function buildCardioSchedule(profile, monthIndex) {
  const phase = CARDIO_PHASES[Math.min(monthIndex, CARDIO_PHASES.length - 1)];
  const activeSet = new Set(phase.sessions.map(s => s.day));

  // Surya Namaskar warm-up rounds
  const suryaRounds = getSuryaNamaskarRounds(profile);

  return DAYS.map(day => {
    const shortDay = day.slice(0, 3); // 'Monday' → 'Mon'
    if (!activeSet.has(shortDay)) {
      return {
        day,
        focus: 'Rest / Easy Walk',
        type: 'rest',
        duration: '-',
        session: null
      };
    }
    const phaseSession = phase.sessions.find(s => s.day === shortDay);
    return {
      day,
      focus: phaseSession.session,
      type: 'Cardio',
      duration: phaseSession.duration,
      session: phaseSession.session,
      intensity: phaseSession.intensity,
      note: phaseSession.note,
      suryaNamaskarWarmup: suryaRounds > 0
        ? `${suryaRounds} rounds Surya Namaskar warm-up before cardio`
        : null,
      hrZones: phase.hrZones
    };
  });
}
```

- [ ] **Step 5: Wire cardio mode into buildWorkoutPlan**

In `server/engine/plan-builder.js`, inside `buildWorkoutPlan`, replace:

```js
  return Array.from({ length: 6 }, (_, monthIndex) => {
    const { phaseLabel, focus, note } = phaseLabels[monthIndex] || phaseLabels[0];
    let schedule;
    if (mode === 'yoga') {
      schedule = buildYogaSchedule(profile, daysPerWeek);
    } else if (mode === 'hybrid') {
      schedule = buildHybridSchedule(profile, goal, daysPerWeek);
    } else {
      schedule = buildStrengthSchedule(profile, goal, daysPerWeek);
    }
    return { monthLabel: `Month ${monthIndex + 1}`, phaseLabel, focus, note, schedule };
  });
```

With:

```js
  return Array.from({ length: 6 }, (_, monthIndex) => {
    const { phaseLabel, focus, note } = phaseLabels[monthIndex] || phaseLabels[0];
    let schedule;
    if (mode === 'yoga') {
      schedule = buildYogaSchedule(profile, daysPerWeek);
    } else if (mode === 'hybrid') {
      schedule = buildHybridSchedule(profile, goal, daysPerWeek);
    } else if (mode === 'cardio') {
      schedule = buildCardioSchedule(profile, monthIndex);
    } else {
      schedule = buildStrengthSchedule(profile, goal, daysPerWeek);
    }
    return { monthLabel: `Month ${monthIndex + 1}`, phaseLabel, focus, note, schedule };
  });
```

- [ ] **Step 6: Run tests**

```bash
npm test -- tests/engine/plan-builder-cardio.test.js
```

Expected: 4 tests PASS.

- [ ] **Step 7: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add server/engine/plan-builder.js tests/engine/plan-builder-cardio.test.js
git commit -m "feat: add cardio workout mode — routes cardio-preference users to HIIT/run/cycle schedule"
```

---

### Task 4: Mobile responsiveness hardening at 375 px

**Files:**
- Modify: `public/index.html` — CSS media queries

Three visual problems at 375 px (iPhone SE):
1. Stat chips overflow their container (4 chips in a row at 375px is too narrow).
2. Timeline items — the `t-time` label and `t-text` span are side by side; wraps badly on narrow screens.
3. Recipe cards grid — 2-column grid at 768px is fine, but at 375px cards are too narrow (< 160px each).

- [ ] **Step 1: Fix stat chips on mobile**

In `public/index.html`, find the existing `@media(max-width:768px)` block. Add a 2×2 grid for `.stat-chips` inside it if not already present, or ensure it reads:

Find and replace (within the `@media(max-width:768px)` block or just below the existing stat-chip rule at line 110):

Current (line ~110):
```css
/* STAT CHIPS — 2x2 on mobile */
```

Ensure the rule is exactly:
```css
@media(max-width:480px){
  .stat-chips{grid-template-columns:1fr 1fr;gap:.5rem}
  .stat-chip{padding:.6rem .8rem;min-width:0}
  .stat-chip .chip-value{font-size:1.2rem}
}
```

If this block already exists with the correct content, skip the edit.

- [ ] **Step 2: Fix timeline item layout on mobile**

In `public/index.html` CSS, add to the `@media(max-width:480px)` block:

```css
.timeline-item{flex-direction:column;align-items:flex-start;gap:.2rem}
.t-time{font-size:.75rem}
.t-text{font-size:.85rem;word-break:break-word}
```

- [ ] **Step 3: Fix recipe card grid on mobile**

Find the recipe grid CSS. It currently uses `repeat(auto-fill, minmax(220px, 1fr))` or similar. Add:

```css
@media(max-width:480px){
  .recipe-grid{grid-template-columns:1fr}
  .recipe-card{min-width:0}
}
```

- [ ] **Step 4: Fix dashboard overview card padding on mobile**

Add inside `@media(max-width:480px)`:
```css
#sec-dashboard .card{padding:.75rem}
.card-title{font-size:.9rem;gap:.4rem}
```

- [ ] **Step 5: Verify no regressions in tests**

```bash
npm test
```

Expected: all tests pass (CSS changes have no server-side test impact).

- [ ] **Step 6: Commit**

```bash
git add public/index.html
git commit -m "fix: mobile layout hardening — stat chips 2×2, timeline wrap, recipe single-col at 375px"
```

---

### Task 5: Push and verify deploy

- [ ] **Step 1: Push to origin**

```bash
git push origin main
```

- [ ] **Step 2: Watch pipeline**

```bash
gh run list --limit 3
```

Expected: new run `in_progress` for each commit pushed.

- [ ] **Step 3: Confirm deploy passes persona E2E gate**

```bash
gh run view <run-id> --log | grep -E "persona-e2e|deploy"
```

Expected: both jobs show ✓.

- [ ] **Step 4: Smoke test production**

```bash
curl -s -o /dev/null -w "%{http_code}" https://health.kaha.online/api/dashboard/overview \
  -H "Authorization: Bearer <token>"
```

Expected: 200 or 401 (not 404/500).

---

## Self-review

**Spec coverage check:**
- ✅ v2 flag removed — Tasks 1 covers all 10 sub-steps
- ✅ IST timezone — Task 2, `todayIST()` utility + 2 fix sites
- ✅ Cardio mode — Task 3, mode detection + schedule builder + tests
- ✅ Mobile hardening — Task 4, 4 CSS rules
- ✅ Deploy + smoke test — Task 5

**Placeholder scan:** No TBD or TODO phrases. Every step has exact code or commands.

**Type consistency:** `todayIST()` returns `{ day, isoDate }` — consistent in utils, dashboard-overview, and sleep route. `buildCardioSchedule` returns same DAYS array structure (7 elements, each with `day`, `focus`, `type`, `duration`) as `buildStrengthSchedule` — consistent.
