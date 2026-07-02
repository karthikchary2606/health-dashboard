# Dashboard Reliability + Personalization Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a reliable, profile-driven dashboard where Timeline, Diet Preview, and Recipe Preview never render generic/stale output and are protected by persona-based release gates.

**Architecture:** Add a single server contract (`/api/dashboard/overview`) that composes timeline + diet + recipe + stats from one source of truth. Move dashboard rendering to contract-driven UI states (`ready`, `empty`, `error`) and remove multi-fetch coupling. Enforce correctness with route tests, persona E2E, and visual snapshots.

**Tech Stack:** Node.js, Express, MongoDB/Mongoose, Jest + Supertest, Playwright (for persona browser E2E + screenshots), GitHub Actions.

---

## File structure map

### Create
- `routes/dashboard.js` — new overview endpoint returning a single dashboard payload.
- `server/engine/dashboard-overview.js` — composes timeline, diet preview, recipe preview, stats, completeness.
- `server/engine/personalization-rules.js` — canonical rule ordering for diet/cuisine/avoidances/food affinity.
- `tests/routes/dashboard-overview.test.js` — API contract + fallback behavior tests.
- `tests/engine/personalization-rules.test.js` — deterministic rule-engine behavior tests.
- `tests/e2e/dashboard-personas.spec.js` — browser-level persona assertions.
- `tests/e2e/fixtures/personas.json` — persona matrix data.
- `tests/e2e/README.md` — local run instructions.

### Modify
- `server.js` — register `/api/dashboard`.
- `public/js/dashboard.js` — consume `GET /api/dashboard/overview`; add explicit state transitions.
- `public/index.html` — add deterministic containers for error/empty states.
- `public/js/planCache.js` — keep for module pages; dashboard path bypasses plan stitching.
- `public/js/recipes.js` — align filtering semantics with shared rule behavior (display layer only).
- `routes/profile.js` — emit `profileUpdatedAt`/`planVersion` fields used for cache freshness.
- `.github/workflows/deploy.yml` — add persona E2E gate before deploy.
- `package.json` — add E2E scripts and Playwright dependency.
- `README.md` — update testing section with persona E2E gate and dashboard acceptance criteria.

### Existing tests to extend/run
- `tests/routes/profile-v3.test.js`
- `tests/middleware/requireProfile.test.js`
- `tests/engine/plan-builder.test.js`
- `npm test`

---

### Task 1: Build canonical personalization rule engine

**Files:**
- Create: `server/engine/personalization-rules.js`
- Test: `tests/engine/personalization-rules.test.js`

- [ ] **Step 1: Write failing tests for rule order**

```js
'use strict';
const { applyRules } = require('../../server/engine/personalization-rules');

test('diet filter runs before cuisine + affinity', () => {
  const profile = { dietType: 'vegetarian', cuisinePreference: 'south-indian', culturalFoodAvoidances: [] };
  const recipes = [
    { name: 'Chicken Curry', dietType: ['non-vegetarian'], cuisine: 'south-indian', ingredients: ['chicken'] },
    { name: 'Veg Sambar', dietType: ['vegetarian'], cuisine: 'south-indian', ingredients: ['dal'] }
  ];
  const out = applyRules(profile, recipes);
  expect(out.map(r => r.name)).toEqual(['Veg Sambar']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/engine/personalization-rules.test.js`  
Expected: FAIL with `Cannot find module '../../server/engine/personalization-rules'`

- [ ] **Step 3: Write minimal implementation**

```js
'use strict';

function applyRules(profile, recipes) {
  const diet = profile.dietType;
  const cuisine = profile.cuisinePreference || 'mixed';
  const avoidances = (profile.culturalFoodAvoidances || []).map(v => String(v).toLowerCase());
  const foodList = (profile.foodList || []).map(f => String(f.name || '').toLowerCase()).filter(Boolean);

  return recipes
    .filter(r => !diet || (r.dietType || []).includes(diet) || (diet === 'vegetarian' && (r.dietType || []).includes('vegan')))
    .filter(r => cuisine === 'mixed' || r.cuisine === cuisine)
    .filter(r => avoidances.every(a => {
      const hay = `${r.name} ${(r.ingredients || []).join(' ')}`.toLowerCase();
      return !hay.includes(a);
    }))
    .map(r => {
      const affinity = foodList.length === 0 ? 0 : (r.ingredients || []).reduce((acc, ing) => {
        const i = String(ing).toLowerCase();
        return acc + (foodList.some(f => i.includes(f) || f.includes(i)) ? 1 : 0);
      }, 0);
      return { ...r, _affinity: affinity };
    })
    .sort((a, b) => b._affinity - a._affinity);
}

module.exports = { applyRules };
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- tests/engine/personalization-rules.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/engine/personalization-rules.js tests/engine/personalization-rules.test.js
git commit -m "feat: add canonical personalization rule engine"
```

---

### Task 2: Add single dashboard overview API contract

**Files:**
- Create: `server/engine/dashboard-overview.js`
- Create: `routes/dashboard.js`
- Modify: `server.js`
- Test: `tests/routes/dashboard-overview.test.js`

- [ ] **Step 1: Write failing route contract test**

```js
test('GET /api/dashboard/overview returns timeline+dietPreview+recipePreview+stats', async () => {
  const res = await request(app).get('/api/dashboard/overview').set(authHeader(user._id));
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('timeline');
  expect(res.body).toHaveProperty('dietPreview');
  expect(res.body).toHaveProperty('recipePreview');
  expect(res.body).toHaveProperty('stats');
  expect(res.body).toHaveProperty('profileCompleteness');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/routes/dashboard-overview.test.js`  
Expected: FAIL with `Cannot GET /api/dashboard/overview`

- [ ] **Step 3: Implement overview composer + route**

```js
// routes/dashboard.js
const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const { buildOverview } = require('../server/engine/dashboard-overview');
router.get('/overview', authenticate, requireProfile, async (req, res) => {
  const payload = await buildOverview(req.user);
  res.set('Cache-Control', 'no-store');
  res.json(payload);
});
module.exports = router;
```

```js
// server.js
app.use('/api/dashboard', require('./routes/dashboard'));
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/routes/dashboard-overview.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add routes/dashboard.js server/engine/dashboard-overview.js server.js tests/routes/dashboard-overview.test.js
git commit -m "feat: add dashboard overview API contract"
```

---

### Task 3: Make dashboard UI contract-driven with explicit states

**Files:**
- Modify: `public/js/dashboard.js`
- Modify: `public/index.html`
- Test: `tests/e2e/dashboard-personas.spec.js` (first assertion)

- [ ] **Step 1: Write failing E2E assertion for loading-state deadlock**

```js
test('dashboard never remains in Loading state after overview response', async ({ page }) => {
  await loginAsPersona(page, 'veg_weight_loss_telugu');
  await page.goto('http://localhost:3000/index.html');
  await expect(page.locator('text=Daily Overview')).toBeVisible();
  await expect(page.locator('text=Loading...')).toHaveCount(0);
});
```

- [ ] **Step 2: Run E2E to verify fail**

Run: `npm run test:e2e -- --grep "never remains in Loading"`  
Expected: FAIL on at least one dashboard card

- [ ] **Step 3: Replace init flow with single overview fetch + state handlers**

```js
async function loadOverview() {
  const { ok, data } = await apiFetch('/api/dashboard/overview');
  if (!ok) return renderOverviewError();
  if (!data || !data.timeline) return renderOverviewEmpty();
  renderTimeline(data.timeline);
  renderDietPreview(data.dietPreview);
  renderRecipePreview(data.recipePreview);
  renderStats(data.stats);
}
```

- [ ] **Step 4: Re-run E2E assertion**

Run: `npm run test:e2e -- --grep "never remains in Loading"`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/js/dashboard.js tests/e2e/dashboard-personas.spec.js
git commit -m "feat: make dashboard contract-driven with explicit empty/error states"
```

---

### Task 4: Align recipe preview + diet preview with same rule engine

**Files:**
- Modify: `server/engine/dashboard-overview.js`
- Modify: `public/js/recipes.js`
- Test: `tests/routes/dashboard-overview.test.js`
- Test: `tests/engine/personalization-rules.test.js`

- [ ] **Step 1: Add failing test for diet/recipe consistency**

```js
test('overview recipePreview respects same dietType/cuisine constraints as dietPreview', async () => {
  const res = await request(app).get('/api/dashboard/overview').set(authHeader(user._id));
  expect(res.status).toBe(200);
  expect(res.body.recipePreview.every(r => r.dietType.includes('vegetarian') || r.dietType.includes('vegan'))).toBe(true);
});
```

- [ ] **Step 2: Run targeted tests**

Run: `npm test -- tests/routes/dashboard-overview.test.js tests/engine/personalization-rules.test.js`  
Expected: FAIL on consistency assertion

- [ ] **Step 3: Route preview generation through `applyRules` once**

```js
const { applyRules } = require('./personalization-rules');
const recipePreview = applyRules(profile, allRecipes).slice(0, 8);
const dietPreview = buildDietPreviewFromPlan(plan, profile);
```

- [ ] **Step 4: Re-run tests**

Run: `npm test -- tests/routes/dashboard-overview.test.js tests/engine/personalization-rules.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/engine/dashboard-overview.js public/js/recipes.js tests/routes/dashboard-overview.test.js tests/engine/personalization-rules.test.js
git commit -m "fix: unify recipe and diet personalization semantics"
```

---

### Task 5: Add freshness/versioning and cache invalidation safeguards

**Files:**
- Modify: `routes/profile.js`
- Modify: `server/engine/dashboard-overview.js`
- Modify: `public/js/planCache.js`
- Test: `tests/routes/profile-v3.test.js`
- Test: `tests/routes/dashboard-overview.test.js`

- [ ] **Step 1: Write failing tests for freshness metadata**

```js
test('overview includes profileUpdatedAt and planVersion', async () => {
  const res = await request(app).get('/api/dashboard/overview').set(authHeader(user._id));
  expect(res.body.profileUpdatedAt).toBeDefined();
  expect(res.body.planVersion).toBeDefined();
});
```

- [ ] **Step 2: Run targeted tests**

Run: `npm test -- tests/routes/dashboard-overview.test.js`  
Expected: FAIL missing metadata

- [ ] **Step 3: Implement metadata emission + client mismatch invalidation**

```js
// route payload
{ ..., profileUpdatedAt: user.updatedAt, planVersion: `${user._id}:${user.updatedAt.getTime()}` }
```

```js
// client: invalidate if version changes
if (cachedVersion && cachedVersion !== incomingVersion) window.planCache.invalidate();
```

- [ ] **Step 4: Re-run tests**

Run: `npm test -- tests/routes/dashboard-overview.test.js tests/routes/profile-v3.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add routes/profile.js server/engine/dashboard-overview.js public/js/planCache.js tests/routes/dashboard-overview.test.js tests/routes/profile-v3.test.js
git commit -m "feat: add dashboard freshness metadata and cache invalidation guard"
```

---

### Task 6: Add persona browser E2E + visual regression gate

**Files:**
- Create: `tests/e2e/fixtures/personas.json`
- Create: `tests/e2e/dashboard-personas.spec.js`
- Modify: `package.json`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add failing persona tests for required assertions**

```js
for (const persona of personas) {
  test(`persona ${persona.id} renders timeline + recipes + diet`, async ({ page }) => {
    await registerAndOnboard(page, persona);
    await page.goto('/index.html');
    await expect(page.locator('#timelineContainer .timeline-item')).toHaveCountGreaterThan(0);
    await expect(page.locator('#recipeGrid .recipe-card')).toHaveCountGreaterThan(0);
    await expect(page.locator('#calorieStat')).not.toHaveText('—');
  });
}
```

- [ ] **Step 2: Install and run Playwright locally**

Run:
```bash
npm i -D @playwright/test
npx playwright install --with-deps chromium
npx playwright test tests/e2e/dashboard-personas.spec.js
```
Expected: initial FAILs exposing current gaps.

- [ ] **Step 3: Add scripts + CI blocking step**

```json
{
  "scripts": {
    "test:e2e": "playwright test tests/e2e/dashboard-personas.spec.js",
    "test:e2e:update-snapshots": "playwright test tests/e2e/dashboard-personas.spec.js --update-snapshots"
  }
}
```

```yaml
- name: Run persona dashboard E2E gate
  run: npm run test:e2e
```

- [ ] **Step 4: Re-run CI-equivalent sequence**

Run:
```bash
npm test
npm run test:e2e
```
Expected: both PASS; deploy unblocked only on green.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e package.json .github/workflows/deploy.yml
git commit -m "test: add persona browser E2E + visual regression release gate"
```

---

### Task 7: Dashboard UX redesign on stable contract (incremental flag rollout)

**Files:**
- Modify: `public/index.html`
- Modify: `public/js/dashboard.js`
- Modify: `README.md`

- [ ] **Step 1: Write failing E2E assertions for new UX acceptance**

```js
test('dashboard v2 cards show explicit empty/error prompts', async ({ page }) => {
  await page.goto('/index.html?dashboard_v2=1');
  await expect(page.locator('[data-state=\"error\"]')).toHaveCount(0);
});
```

- [ ] **Step 2: Run assertion**

Run: `npm run test:e2e -- --grep "dashboard v2 cards"`  
Expected: FAIL before redesign.

- [ ] **Step 3: Implement v2 card layout + interaction model**

```js
const v2Enabled = new URLSearchParams(location.search).get('dashboard_v2') === '1';
if (v2Enabled) renderDashboardV2(overviewPayload);
else renderDashboardV1Compat(overviewPayload);
```

- [ ] **Step 4: Re-run E2E + snapshots**

Run:
```bash
npm run test:e2e
npm run test:e2e:update-snapshots
```
Expected: PASS with updated visual baselines.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/js/dashboard.js README.md
git commit -m "feat: ship dashboard v2 UX on stable overview contract"
```

---

### Task 8: Final verification and rollout hardening

**Files:**
- Modify: `README.md` (final runbook section)
- Optional Modify: `docs/superpowers/specs/2026-07-02-dashboard-reliability-redesign-design.md` (if implementation drift needs doc correction)

- [ ] **Step 1: Run full verification matrix**

Run:
```bash
npm test
npm run test:e2e
```
Expected:
- Jest: all suites pass.
- E2E: all persona scenarios pass.

- [ ] **Step 2: Manual production smoke checklist**

Run:
```bash
curl -s https://health.kaha.online/api/health
```
Expected: `{"status":"ok","db":"connected",...}`

Manual checks:
1. Register new user → onboarding → profile-complete → dashboard.
2. Timeline visible.
3. Recipe cards visible.
4. Diet preview personalized to selected diet/cuisine.

- [ ] **Step 3: Add README runbook updates**

```md
## Dashboard reliability gate
- Run `npm test`
- Run `npm run test:e2e`
- Do not deploy if any persona test fails
```

- [ ] **Step 4: Final commit**

```bash
git add README.md
git commit -m "docs: add dashboard reliability release runbook"
```

- [ ] **Step 5: Tag release candidate**

```bash
git tag -a dashboard-reliability-rc1 -m "Dashboard reliability + personalization redesign RC1"
git push origin dashboard-reliability-rc1
```

---

## Self-review checklist (completed)

### 1) Spec coverage
- Single overview API contract: **Task 2**
- Shared personalization rule ordering: **Task 1 + Task 4**
- Explicit loading/error/empty behavior: **Task 3**
- Persona hard release gate: **Task 6**
- Incremental feature-flag rollout: **Task 7**
- Final reliability runbook: **Task 8**

### 2) Placeholder scan
- No `TODO/TBD`.
- Each task has explicit file paths, commands, and expected outputs.

### 3) Type/interface consistency
- Canonical rule function name: `applyRules`.
- Contract endpoint: `GET /api/dashboard/overview`.
- Metadata fields: `profileUpdatedAt`, `planVersion`.
- Feature flag naming kept consistent: `dashboard_v2`.

