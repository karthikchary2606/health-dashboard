# Health Dashboard — Diet Hybrid Days, Calorie Tracker & Today Dashboard
**Date:** 2026-07-04  
**Approach:** B — Full dashboard replacement + new tracker module  
**Stack:** Express + Mongoose + vanilla JS frontend

---

## 0. Competitive Positioning

### Market Research Summary
Ten major apps researched: MyFitnessPal (200M users), HealthifyMe (40M), Cronometer, Noom (50M), Fitbit/Google Health, Apple Health, Lose It! (57M), Lifesum (65M), Yazio, Google Health Connect.

### Universal Design Patterns (must-have, industry standard)
- **Calorie ring/donut** as the hero metric on the Today view — every top app uses this
- **4-slot meal log**: Breakfast / Lunch / Snack / Dinner
- **7-day bar charts** for calorie and steps trends
- **Streak badges** for consecutive logging days — Noom, Lifesum, MFP all use these
- **Macro breakdown bars** (Protein / Carbs / Fat vs. daily targets)
- **"Quick repeat" shortcuts** — Lifesum's "same as yesterday" is widely praised for reducing friction

### The Three Biggest Gaps in Every Existing App
1. **No plan-driven meal logging.** Every app makes users search a food database from scratch. Not one uses the user's pre-defined diet plan to suggest today's meals and pre-fill calories. This app will.
2. **No hybrid weekly diet patterns.** No app supports "non-veg 3 days, eggs 2 days, veg 2 days." HealthifyMe handles Indian foods better than anyone but still treats diet type as a single enum.
3. **Paywalled basics destroy trust.** MFP locked barcode scanning. Lose It! locked photo logging. Users feel cheated. This app gives all core tracking free.

### Where This App Beats the Market
| Feature | MFP | HealthifyMe | This App |
|---------|-----|-------------|----------|
| Plan-driven meal suggestions | ❌ | ❌ | ✅ |
| Hybrid weekly diet patterns | ❌ | ❌ | ✅ |
| Indian cuisine meal plans | ❌ | ✅ | ✅ |
| Calorie targets derived from health plan | ❌ | ❌ | ✅ |
| Integrated Today view (all modules) | Partial | ✅ | ✅ |
| Streak + consistency tracking | ✅ | ✅ | ✅ |
| Free core tracking (no paywalls) | Degraded | Partial | ✅ |
| Workout plan integration | ❌ | ❌ | ✅ |
| Breathing / sleep / progress modules | ❌ | ❌ | ✅ |

### UX Principles Derived from Research
- **Reduce logging friction to zero** — HealthifyMe SNAP, Lifesum "same as yesterday", Noom voice all prove this. Our equivalent: tap plan meals to confirm, calories auto-fill from plan data. No searching required.
- **One cohesive Today view** — fragmentation kills engagement. Apple Health's Summary tab is the gold standard: one screen surfaces everything relevant for the day.
- **Streak = retention** — consecutive-day streaks are the single most effective engagement mechanic across all apps studied. Noom, Yazio, MFP, HealthifyMe all use them. Loss aversion ("don't break the streak") drives daily return.
- **Visual progress over raw numbers** — calorie rings, progress bars, bar charts outperform plain text in every UX study. Numbers support visuals, not the reverse.
- **Plan adherence score** — inspired by Lifesum's food rating: show users how closely today's logged meals match their plan. A simple 0–100% score. Rewards consistency without moralizing.
- **Honest free tier** — Cronometer model, not MFP model. Full core tracking free. Charge only for genuinely advanced features. Apps that paywall basics lose users permanently.
- **Weekly summary ritual** — Apple Health Weekly Summary, Lifesum Life Score: a Sunday/Monday card reviewing the week drives re-engagement more than any other notification type.

### Features Added to This Design Based on Research
Beyond the original scope, these features will be included because market research shows they are differentiating, low-effort to add, and directly serve the user:
1. **"Repeat yesterday's meals" shortcut** — one-tap re-logging of previous day's meals (Lifesum pattern, most loved feature in reviews)
2. **Daily logging streak counter** — prominent fire-icon streak on the Today dashboard (Noom/MFP/Yazio pattern)
3. **Weekly summary card** — surfaced every Monday showing last week's avg. calories, steps, logged days, and weight change
4. **Plan adherence percentage** — shows % of plan meals logged vs. custom entries on the calorie detail page
5. **Micronutrient highlights** — surface India-critical deficiency flags: Vitamin B12 (vegetarians), Vitamin D, Iron (women). Derived from meals logged. Simple callout, not a full 82-nutrient panel.
6. **Step estimation from activity duration** — for users without wearables: "I walked 30 minutes" → estimated 3,000–3,500 steps based on standard pace. Fills the gap for the majority of Indian users who don't own smartwatches.
7. **Achievement milestone cards** — pop-up when user hits 7-day streak, 30-day streak, first week goal met, etc.

---

## 1. Hybrid Diet Days

### Problem
`dietType` is a single enum. Non-veg and eggetarian users get a uniform diet plan for all 7 days — no concept of mixed weekly patterns (e.g., 3 days non-veg + 2 egg + 2 veg).

### Data Model — `User.js` (profile schema)
Replace the numeric day-count approach with specific day arrays:

```js
nonVegDays: { type: [String], enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], default: [] },
eggDays:    { type: [String], enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], default: [] },
// vegDays derived: all days not in nonVegDays or eggDays
// Validated server-side: no day can appear in both nonVegDays and eggDays
stepGoal: { type: Number, default: 10000, min: 1000, max: 50000 },
```

`stepGoal` defaults to 10,000 for all existing users — no migration needed, Mongoose handles the default. It is editable in profile settings.

These diet-day fields are only relevant when `dietType` is `'non-vegetarian'` or `'eggetarian'`. Vegetarian and vegan profiles: both arrays remain empty, plan output is unchanged.

### Onboarding — Step 3 (Diet)
After the user selects their diet type, conditional follow-ups appear:

- **Non-Vegetarian selected:**
  1. A day-picker shows Mon–Sun as 7 toggleable chips. User taps which days they eat non-veg. Stored as `nonVegDays` (e.g., `['Saturday','Sunday']`).
  2. A second day-picker (with non-veg days greyed out) lets user pick egg days from remaining days. Stored as `eggDays`.
  3. Remaining unticked days auto-label as "Vegetarian" in a read-only summary row.
  
- **Eggetarian selected:**
  1. Day-picker: user picks which days they eat eggs → stored as `eggDays`.
  2. `nonVegDays` stays `[]`.
  3. Remaining days auto-label as "Vegetarian".

- **Vegetarian / Vegan selected:** No follow-up. Both arrays remain `[]`.

Validation: no day can appear in both `nonVegDays` and `eggDays`. At least 1 day must be selected if non-veg/eggetarian diet type is chosen.

Both onboarding and Settings (profile edit page) expose these pickers so users can change their split after initial setup.

### Meal Composer — `server/engine/meal-composer.js`

**`deriveEffectiveDiet(profile)`** is extended to return a `weeklyDietPattern` — a deterministic 7-element array of diet types assigned to the days of the week (Mon–Sun):

```js
// Example: nonVegDaysPerWeek=3, eggDaysPerWeek=2
// → ['non-veg','non-veg','non-veg','egg','egg','veg','veg']
```

**`deriveEffectiveDiet(profile)`** is extended to return a `weeklyDietPattern` — a 7-element object keyed by day name:

```js
// Example: nonVegDays=['Saturday','Sunday'], eggDays=['Wednesday']
// → { Monday:'veg', Tuesday:'veg', Wednesday:'egg', Thursday:'veg', Friday:'veg', Saturday:'non-veg', Sunday:'non-veg' }
weeklyDietPattern[day] = profile.nonVegDays.includes(day) ? 'non-veg'
                        : profile.eggDays.includes(day)   ? 'egg'
                        : 'veg';
```

**Plan builder** uses `weeklyDietPattern[dayName]` to select the food pool for each day. Day names are the DAYS array already in `plan-builder.js` (`['Monday','Tuesday',...,'Sunday']`).

**Diet tab day indicators** — each day tab in the diet UI gets a small color-coded dot: 🟢 veg, 🟠 egg, 🔴 non-veg. Pattern sourced from the plan's `weeklyDietPattern`.

**Backward compatibility:** Vegetarian and vegan profiles have `nonVegDays = []` and `eggDays = []`, so `weeklyDietPattern` is all `'veg'`. Existing plan output is unchanged.

---

## 1b. Meal Data — Calories Added to Plan Meals

### Problem
Plan meals are plain strings (`'Idli with Sambar'`). The tracker's plan-meal pre-fill feature requires calorie + macro data on each meal.

### Solution
Convert all meal entries in `server/meals/south-indian.js`, `north-indian.js`, and `continental.js` from strings to objects:

```js
// Before
'Idli with Sambar'

// After
{ name: 'Idli with Sambar', calories: 280, proteinG: 9, carbsG: 52, fatG: 3, estimated: true }
```

- `estimated: true` flags all entries as best-effort ICMR data. The UI shows a small "~" or "est." label next to pre-filled calorie values.
- Calorie values sourced from ICMR *Indian Food Composition Tables* and NIN data. ~150+ meals across 3 cuisine files.
- Plan builder and `planCache` pass meal objects through unchanged. All existing rendering logic that previously accessed a string now accesses `meal.name`.
- Any code that does string comparison on meal names (e.g., `weekdays[0].breakfast === 'Idli with Sambar'`) must be updated to use `.name`.

---

## 1c. Client-Side Date Bug Fix

### Problem
Several client JS files use `new Date().toISOString().slice(0,10)` which returns UTC date. For IST users at 12:30 AM on July 5, this returns `2026-07-04` — the wrong day. Streak calculations and meal logging break silently for late-night users.

### Fix
Replace all occurrences with a local-date helper added to `public/js/api.js`:

```js
function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
```

All files that reference `toISOString().slice(0,10)` for date-keying (not for ISO timestamps) are updated to use `localDateString()`. This is a pre-existing bug that tracker streak logic would surface; fixing it now is correct.

---

### Files Changed
| File | Action |
|------|--------|
| `public/index.html` | Full replacement |
| `public/js/dashboard.js` | Full replacement |
| `routes/dashboard.js` | Add `GET /api/logs/today` endpoint |

The route `GET /` (serving `index.html`) is unchanged.

### Layout (top → bottom)
1. **Header:** "Good [morning/afternoon/evening], [Name] 👋" + current date + "Day N of M"
2. **Logging streak badge** — "🔥 12-day streak" displayed prominently below the header. Clicking shows streak history.
3. **Calorie Ring Widget** (tappable → `/tracker`) — dynamic calorie arc (green→amber→red), consumed/target label, macro pills (P/C/F consumed vs. target). Pulls from today's HealthLog meals.
4. **Steps Widget** (tappable → `/tracker#steps`) — horizontal progress bar, step count / goal label. Pulls from `healthLog.stepCount`.
5. **Quick-stat grid (2×2):**
   - 💧 Water (L logged / goal)
   - 😴 Sleep (hours last night)
   - 💪 Workout (done / pending)
   - 😊 Mood score
   All sourced from today's HealthLog — same fields the existing sleep/mood/water logging already writes.
6. **Meal log teaser** — 4 rows (Breakfast / Lunch / Snack / Dinner), each showing logged meal name + calorie count or "not logged yet". "+ Log meal" shortcut opens tracker.
7. **Weekly summary card** (Mondays only) — appears at the bottom of Today on Monday mornings: last week's avg. calories, total steps, days logged, weight change. Dismissed with a swipe. Sourced from `GET /api/tracker/weekly-summary`.

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
- Large calorie ring (consumed / target) — color shifts green → amber → red as user approaches limit
- Macro breakdown bars: Protein, Carbs, Fat — each shows `consumed / target` with a progress bar
- **Plan adherence score** — "You've followed your plan for 3 of 4 meals today (75%)" — derived from `fromPlan` flag on logged meals
- 7-day calorie bar chart (last 7 HealthLog entries ordered by date)
- **"Repeat yesterday" shortcut** — one-tap button to copy all meal entries from yesterday's HealthLog into today. User can remove any entry they didn't eat. Calories carry over automatically.
- Meal log list — 4 plan slots + "+ Add custom meal" button:
  - **Plan meal tap:** Shows pre-filled form with today's plan meal name and estimated calories (sourced from plan data via planCache). User confirms or edits before saving. `fromPlan: true`.
  - **Custom entry:** Name field + calorie field + optional macro fields (protein/carbs/fat). Saves with `fromPlan: false`.
- **Micronutrient flags** (India-relevant only): If no dairy logged → "⚠️ Low Calcium / B12 today — add curd, milk, or paneer." If no vegetables logged by 6 PM → "⚠️ No vegetables logged yet." Maximum 2 flags per day, non-intrusive.
- Logging streak badge: consecutive days with at least one meal logged

### Tracker Page — Steps Tab
- Large step count display (today) with color feedback (green = goal met, amber = 70%+, grey = under)
- Progress bar vs. daily goal (default 10,000, editable in profile)
- Edit button → inline number input → saves to `healthLog.stepCount`
- **"I walked X minutes" estimator** — secondary input: duration (minutes) + pace (slow/moderate/brisk) → converts to estimated step count. Serves users without wearables. Formula: slow = 80 steps/min, moderate = 100, brisk = 120. User can accept the estimate or enter a custom count.
- 7-day steps bar chart

### API Routes — `routes/tracker.js`
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/tracker/today` | Today's meals, stepCount, calorie/macro totals, 7-day history, streak count, plan adherence % |
| `POST` | `/api/tracker/meals` | Add a meal entry (body: slot, name, calories, proteinG, carbsG, fatG, fromPlan) |
| `POST` | `/api/tracker/meals/repeat-yesterday` | Copy all meal entries from yesterday's HealthLog into today |
| `DELETE` | `/api/tracker/meals/:index` | Remove a meal entry by index |
| `PUT` | `/api/tracker/steps` | Update today's stepCount (body: stepCount or {durationMin, pace} for estimation) |
| `GET` | `/api/tracker/weekly-summary` | Last 7 days: avg calories, total steps, days logged, weight delta — for Monday summary card |

All routes use the existing `authenticate` middleware. All writes create or update today's HealthLog document (upsert by `userId + date`).

### Calorie Target Computation
`profile.dailyCalorieTarget` is already computed on plan generation. If it is `null` (new users or legacy profiles that haven't generated a plan), the tracker computes a **BMR-based estimate** at request time using Mifflin-St Jeor formula from profile fields (age, currentWeightKg, heightCm, sex, fitnessLevel). This estimate is returned with `estimated: true` in the API response, and the UI labels the ring target with "~" (e.g., "~2,050 kcal"). The estimate is never stored — it is computed on-the-fly until the user generates a proper plan.

### Streak Definition
A day counts toward the streak if `healthLog.meals.length >= 1` for that date. Streak is the count of consecutive calendar days (using local date string, not UTC) ending on today where this condition is true. If today has no meals yet, the streak is still valid from yesterday. A single missed day resets the streak to 0.

### "Repeat Yesterday" Behaviour
- Finds yesterday's HealthLog by `localDateString() - 1 day`.
- If no log exists or `meals.length === 0`: returns a 404-equivalent and the client shows a toast: **"No meals logged yesterday — nothing to repeat."**
- If meals exist: copies the `meals` array into today's HealthLog (upsert). Existing today meals are **not overwritten** — yesterday's meals are appended. User can then remove any they didn't eat today.

### Micronutrient Flag Logic
Flags are computed on the server in `GET /api/tracker/today`, using string-matching on logged meal names (same `DAIRY_TERMS` array already in `meal-composer.js`). Maximum 2 flags shown per day. Conditions:

| Flag | Condition | Message |
|------|-----------|---------|
| B12/Calcium | No meal name contains any of: `curd, raita, paneer, ghee, dahi, milk, cheese, yogurt, egg, chicken, fish, mutton` | "⚠️ No dairy or protein source logged yet — add curd, paneer, or eggs" |
| Vegetables | No meal name contains any of: `sabzi, curry, dal, sambar, rasam, salad, vegetable, spinach, tomato, brinjal` by 6 PM local time | "⚠️ No vegetables logged yet today" |

Flags are suppressed if the user has already logged ≥ 3 meals (reasonable to assume coverage). They are informational only — no blocking or red-warning treatment.

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

**"More" sheet mechanic:** Tapping ⋯ slides up a bottom sheet (CSS `transform: translateY`) listing secondary modules as large tappable rows. No new routing needed — these are the same in-page tab switches already handled by `bottom-nav.js`. The sheet is dismissed by tapping outside it or tapping a module link.

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
- [ ] Today dashboard: calorie ring reflects logged meals accurately and color-shifts correctly
- [ ] Today dashboard: step widget reflects `stepCount` from HealthLog
- [ ] Today dashboard: streak badge shows correct consecutive-day count
- [ ] Today dashboard: weekly summary card appears on Mondays only
- [ ] Tracker: plan meal tap pre-fills name and calories from planCache
- [ ] Tracker: custom meal entry saves correctly to HealthLog
- [ ] Tracker: "Repeat yesterday" copies yesterday's meals and sets them as today's log
- [ ] Tracker: DELETE meal removes the correct entry
- [ ] Tracker: plan adherence % calculates correctly (fromPlan meals / total meals)
- [ ] Tracker: micronutrient flags appear when relevant (B12/calcium, vegetable gap)
- [ ] Tracker: 7-day charts render with missing days shown as 0
- [ ] Tracker: logging streak increments on consecutive daily logs and resets on a missed day
- [ ] Tracker: step estimator correctly converts duration+pace to step count
- [ ] Tracker: achievement milestone card appears on 7-day and 30-day streak
- [ ] Settings: diet day split is editable and persists
- [ ] Legacy profiles (no `nonVegDaysPerWeek`): defaults to 0, plan unaffected
- [ ] `stepGoal` defaults to 10,000 for users without the field set
