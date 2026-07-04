# Health Dashboard — Diet Hybrid Days, Calorie Tracker & Today Dashboard
**Date:** 2026-07-04  
**Approach:** B — Full dashboard replacement + new tracker module  
**Stack:** Express + Mongoose + vanilla JS frontend

---

## 1. Hybrid Diet Days

### Problem
`dietType` is a single enum. Non-veg and eggetarian users get a uniform diet plan for all 7 days — no concept of mixed weekly patterns (e.g., 3 days non-veg + 2 egg + 2 veg).

### Data Model — `User.js` (profile schema)
Add three fields:

```js
nonVegDaysPerWeek: { type: Number, min: 0, max: 7, default: 0 },
eggDaysPerWeek:    { type: Number, min: 0, max: 7, default: 0 },
// vegDaysPerWeek is derived: 7 - nonVegDaysPerWeek - eggDaysPerWeek
// Validated server-side: nonVegDaysPerWeek + eggDaysPerWeek <= 7
```

These fields are only relevant when `dietType` is `'non-vegetarian'` or `'eggetarian'`. Vegetarian and vegan profiles ignore them.

### Onboarding — Step 3 (Diet)
After the user selects their diet type, conditional follow-ups appear:

- **Non-Vegetarian selected:**
  1. "How many days a week do you eat non-veg?" → number picker (1–7), stored as `nonVegDaysPerWeek`
  2. "Of the remaining days, how many include eggs?" → number picker (0 to 7−nonVegDays), stored as `eggDaysPerWeek`
  3. Remaining days (7 − nonVeg − egg) auto-display as vegetarian days (read-only label)
  
- **Eggetarian selected:**
  1. "How many days a week do you eat eggs?" → number picker (1–7), stored as `eggDaysPerWeek`
  2. `nonVegDaysPerWeek` stays 0
  3. Remaining days auto-display as vegetarian (read-only label)

- **Vegetarian / Vegan selected:** No follow-up. Both day fields remain 0.

Validation: `nonVegDaysPerWeek + eggDaysPerWeek` must be ≤ 7. If the sum equals 7 exactly, no pure veg days remain — this is valid.

Both onboarding and Settings (profile edit page) expose these pickers so users can change their split after initial setup.

### Meal Composer — `server/engine/meal-composer.js`

**`deriveEffectiveDiet(profile)`** is extended to return a `weeklyDietPattern` — a deterministic 7-element array of diet types assigned to the days of the week (Mon–Sun):

```js
// Example: nonVegDaysPerWeek=3, eggDaysPerWeek=2
// → ['non-veg','non-veg','non-veg','egg','egg','veg','veg']
```

Distribution logic:
1. Fill the first `nonVegDaysPerWeek` slots with `'non-veg'`
2. Fill the next `eggDaysPerWeek` slots with `'egg'`
3. Fill remaining slots with `'veg'`

The array maps index 0 → Monday through index 6 → Sunday. This is deterministic — no randomness.

**Plan builder** uses `weeklyDietPattern[dayIndex]` instead of a single `effectiveDiet` to select the food pool for each day's meal generation. Each day in the weekly plan is generated with its own pool:
- `'non-veg'` → non-veg meal pool
- `'egg'` → eggetarian meal pool  
- `'veg'` → vegetarian meal pool

**Backward compatibility:** Pure vegetarian and vegan profiles have `nonVegDaysPerWeek = 0` and `eggDaysPerWeek = 0`, so `weeklyDietPattern` = `['veg','veg','veg','veg','veg','veg','veg']`. Existing plan output is unchanged.

---

## 2. Today Dashboard (replaces current dashboard)

### Files Changed
| File | Action |
|------|--------|
| `public/index.html` | Full replacement |
| `public/js/dashboard.js` | Full replacement |
| `routes/dashboard.js` | Add `GET /api/logs/today` endpoint |

The route `GET /` (serving `index.html`) is unchanged.

### Layout (top → bottom)
1. **Header:** "Good [morning/afternoon/evening], [Name] 👋" + current date + "Day N of M"
2. **Calorie Ring Widget** (tappable → `/tracker`) — dynamic calorie arc, consumed/target label, macro pills (P/C/F consumed vs. target). Pulls from today's HealthLog meals.
3. **Steps Widget** (tappable → `/tracker#steps`) — horizontal progress bar, step count / goal label. Pulls from `healthLog.stepCount`.
4. **Quick-stat grid (2×2):**
   - 💧 Water (L logged / goal)
   - 😴 Sleep (hours last night)
   - 💪 Workout (done / pending)
   - 😊 Mood score
   All sourced from today's HealthLog — same fields the existing sleep/mood/water logging already writes.
5. **Meal log teaser** — 4 rows (Breakfast / Lunch / Snack / Dinner), each showing logged meal name + calorie count or "not logged yet". "+ Log meal" shortcut opens tracker.

### Data Fetch
Dashboard JS makes a single `GET /api/logs/today` on load. This returns:

```json
{
  "log": { "meals": [...], "stepCount": 0, "waterL": 0, "sleepH": 0, "workoutDone": false, "moodScore": null },
  "plan": { "dailyCalorieTarget": 2100, "dailyProteinG": 120, "dailyCarbsG": 220, "dailyFatG": 65, "stepGoal": 10000 },
  "meta": { "dayNumber": 47, "totalDays": 180, "greeting": "morning" }
}
```

No changes to existing sleep, water, or mood logging routes — they continue writing to HealthLog as before. The today endpoint just reads the combined state.

---

## 3. Calorie & Steps Tracker Module

### New Files
| File | Purpose |
|------|---------|
| `public/tracker.html` | Tracker page (calorie + steps, tab-switched) |
| `public/js/tracker.js` | All tracker frontend logic |
| `routes/tracker.js` | Tracker API routes |

### HealthLog Model Extension — `models/HealthLog.js`
Add to existing schema:

```js
meals: [{
  slot:      { type: String, enum: ['breakfast','lunch','snack','dinner','custom'] },
  name:      { type: String, required: true },
  calories:  { type: Number, required: true, min: 0 },
  proteinG:  { type: Number, default: 0 },
  carbsG:    { type: Number, default: 0 },
  fatG:      { type: Number, default: 0 },
  fromPlan:  { type: Boolean, default: false },  // true = tapped from today's plan
  _id:       false
}],
stepCount: { type: Number, default: 0, min: 0 }
```

All existing HealthLog fields (water, weight, workout, mood, notes, checklist) are untouched.

### Tracker Page — Calorie Tab
- Large calorie ring (consumed / target)
- Macro breakdown bars: Protein, Carbs, Fat — each shows `consumed / target` with a progress bar
- 7-day calorie bar chart (last 7 HealthLog entries ordered by date)
- Meal log list — 4 plan slots + "+ Add custom meal" button:
  - **Plan meal tap:** Shows pre-filled form with today's plan meal name and estimated calories (sourced from plan data via planCache). User confirms or edits before saving.
  - **Custom entry:** Name field + calorie field + optional macro fields (protein/carbs/fat). Saves with `fromPlan: false`.
- Logging streak badge: consecutive days with at least one meal logged

### Tracker Page — Steps Tab
- Large step count display (today)
- Progress bar vs. daily goal (default 10,000, editable in profile)
- Edit button → inline number input → saves to `healthLog.stepCount`
- 7-day steps bar chart

### API Routes — `routes/tracker.js`
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/tracker/today` | Today's meals, stepCount, calorie/macro totals, 7-day history |
| `POST` | `/api/tracker/meals` | Add a meal entry (body: slot, name, calories, proteinG, carbsG, fatG, fromPlan) |
| `DELETE` | `/api/tracker/meals/:index` | Remove a meal entry by index |
| `PUT` | `/api/tracker/steps` | Update today's stepCount (body: stepCount) |

All routes use the existing `authenticate` middleware. All writes create or update today's HealthLog document (upsert by `userId + date`).

### Calorie Target Computation
`profile.dailyCalorieTarget` is already computed on plan generation. If it's missing (legacy profiles), the tracker falls back to a BMR-based estimate using existing profile fields (age, weight, height, sex, fitnessLevel). No new computation logic needed — uses what's already there.

---

## 4. Navigation Changes

**Bottom nav** (mobile, `bottom-nav.js`):
| Tab | Icon | Target |
|-----|------|--------|
| Today | 📅 | `/` (dashboard) |
| Diet | 🥗 | diet section |
| Workout | 💪 | workout section |
| Sleep | 😴 | sleep section |
| More | ⋯ | opens a sheet with: Breathing, Progress, Recipes, Guidelines, Grocery, Tracker |

Tracker is accessible from the "More" sheet and directly via tap-through from the Today dashboard widgets. This avoids overcrowding the bottom nav while keeping the tracker one tap away from the dashboard.

---

## 5. Out of Scope
- Device step sync (HealthKit, Google Fit) — manual entry only for now
- Barcode/food database lookup for calories — manual entry only
- Push notifications for logging reminders
- Historical diet pattern analytics
- Social/sharing features

---

## 6. Testing Checklist
- [ ] Onboarding: non-veg day picker appears only for non-veg/eggetarian selections
- [ ] Onboarding: day counts validate to ≤ 7 total
- [ ] Meal composer: Monday–Sunday each get the correct food pool per `weeklyDietPattern`
- [ ] Vegetarian/vegan profiles: plan output identical to pre-change baseline
- [ ] Today dashboard: calorie ring reflects logged meals accurately
- [ ] Today dashboard: step widget reflects `stepCount` from HealthLog
- [ ] Tracker: plan meal tap pre-fills name and calories from planCache
- [ ] Tracker: custom meal entry saves correctly to HealthLog
- [ ] Tracker: DELETE meal removes the correct entry
- [ ] Tracker: 7-day charts render with missing days shown as 0
- [ ] Tracker: logging streak increments on consecutive daily logs
- [ ] Settings: diet day split is editable and persists
- [ ] Legacy profiles (no `nonVegDaysPerWeek`): defaults to 0, plan unaffected
