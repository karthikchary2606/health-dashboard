# Personalization Engine — Design Spec
**Date:** 2026-07-02  
**Status:** Approved  
**Scope:** Recipe filtering, Workout engine rebuild, Diet phase guidance, Surya Namaskar integration

---

## Problem Statement

The application collects rich user profile data (cuisine preference, diet type, workout preferences, fitness level, equipment, yoga style, workoutDaysPerWeek) but the plan generation ignores most of it. All users receive the same hardcoded workout schedule and recipes are not filtered by cuisine or diet type correctly. The application is effectively profile-blind.

---

## Confirmed Root Causes

1. **Recipes:** `renderRecipes()` in `public/js/recipes.js` does its own naive name/tag filter. It never calls the existing `getFilteredRecipes()` function which correctly handles cuisine, diet type, cultural avoidances, health conditions, and goal-based sorting.

2. **Workouts:** `buildWorkoutPlan()` in `server/engine/plan-builder.js` uses a single hardcoded `WEEKLY_SCHEDULE` array. `workoutPreferences`, `workoutDaysPerWeek`, and `yogaStyle` from the user profile are never read. `getSuryaNamaskarRounds()` exists in `exercise-composer.js` but is never imported or called.

3. **Workout frontend:** `workout.js` reads `w.phaseLabel`, `w.note`, and `w.focus` but `buildWorkoutPlan()` never sets them — blank phase banners result.

4. **Diet:** `meal-composer.js` filtering is correct. Phase-based caloric guidance is missing.

---

## Design

### 1. Recipe Filtering Fix (`public/js/recipes.js`)

**Change:** Replace `renderRecipes()` body to delegate to `getFilteredRecipes(currentUser.profile, { limit: 200, mealType: cat !== 'all' ? cat : undefined })`.

**Behavior:**
- Cuisine preference respected: south-indian user sees south-indian recipes first. `mixed` → all cuisines.
- Diet type: vegetarian/vegan/eggetarian strictly filters out non-matching recipes using the existing `dietType` array on each recipe.
- Health conditions and cultural food avoidances applied via existing tag-matching logic.
- Goal-based sort: weight-loss → lowest calories first; muscle-gain → highest protein first.
- **Manual override:** Add "Show All Cuisines" toggle button above the recipe grid. When active, passes `{ forceMixed: true }` to `getFilteredRecipes`, bypassing the cuisine filter. Button label shows "(Showing: Your Cuisine / All Cuisines)".

**No backend changes required.** `getFilteredRecipes` is pure client-side.

---

### 2. Workout Engine Rebuild (`server/engine/plan-builder.js`)

**Replace** the static `WEEKLY_SCHEDULE` with a `buildPersonalizedSchedule(profile, goal)` function.

#### 2a. Workout Mode Detection

Derive mode from `profile.workoutPreferences` (array):
- Contains `'yoga'` only → **yoga mode**
- Contains `'gym'` → **gym mode**
- Contains `'home-workout'` (no `'gym'`) → **home mode**
- Contains both `'gym'` and `'yoga'` → **hybrid mode**
- Empty/unknown → **home mode** (safe default, no equipment assumed)

#### 2b. Day Slot Generation

Use `profile.workoutDaysPerWeek` (1–7) to determine active slots:

| Days/week | Active days             | Rest days         |
|-----------|-------------------------|-------------------|
| 3         | Mon, Wed, Fri           | Tue, Thu, Sat, Sun|
| 4         | Mon, Tue, Thu, Fri      | Wed, Sat, Sun     |
| 5         | Mon, Tue, Wed, Thu, Fri | Sat, Sun          |
| 6         | Mon–Sat                 | Sun               |
| 7         | Mon–Sun (not recommended, flag in note) | — |
| default   | 4 days                  |                   |

#### 2c. Active Day Focus Assignment (by mode)

**Gym mode (4 days example):**
- Mon: Lower Body (legs)
- Tue: Upper Body (chest)
- Thu: Back & Core (back)
- Fri: Full Body (full-body)

**Home mode:**
- Same muscle group rotation but `getExercises()` called with `profile.equipmentAvailable = []` — bodyweight exercises only (already supported by equipment filter).

**Yoga mode:**
- All active days are yoga days. Day types rotate: Hatha → Vinyasa → Pranayama-only → Hatha…
- Uses `profile.yogaStyle` to set the primary style when not rotating (e.g. if `yogaStyle = 'hatha'`, all days are hatha unless `yogaStyle = 'none'` which defaults to hatha anyway).

**Hybrid mode (6 days example):**
- Mon: Gym — Lower Body
- Tue: Yoga
- Wed: Gym — Upper Body
- Thu: Yoga
- Fri: Gym — Full Body
- Sat: Yoga / Flexibility

#### 2d. Surya Namaskar — Always First

On **every active day** (all modes), the exercise list begins with:
```js
{
  name: `Surya Namaskar (${rounds} rounds)`,
  sets: rounds,
  reps: '12 poses per round',
  note: `Age/fitness-adjusted: ${rounds} rounds · Warms up full body before training`,
  cat: 'yoga'
}
```
Where `rounds = getSuryaNamaskarRounds(profile)`.

On **rest days**, add a single optional entry:
```js
{
  name: 'Gentle Surya Namaskar (optional)',
  sets: 3,
  reps: '12 poses per round',
  note: 'Active recovery — gentle pace only',
  cat: 'yoga'
}
```

#### 2e. Yoga Day Exercise Lists

```
Hatha Yoga Day:
  1. Surya Namaskar — rounds per profile
  2. Vrikshasana (Tree Pose) — 3 sets × 30s hold
  3. Warrior II — 3 sets × 45s per side
  4. Setu Bandhasana (Bridge Pose) — 3 sets × 12 reps
  5. Shavasana — 1 set × 5 min

Vinyasa Yoga Day:
  1. Surya Namaskar Flow (faster) — rounds × 1.2 (rounded)
  2. Chaturanga → Upward Dog → Down Dog flow — 3 rounds
  3. Warrior I → II → Reverse Warrior — 3 rounds
  4. Chair Pose hold — 3 × 45s
  5. Shavasana — 1 × 3 min

Pranayama-only Day:
  1. Surya Namaskar (gentle) — 3 rounds
  2. Anulom Vilom — 1 set × 5 min
  3. Bhramari — 1 set × 5 min
  4. Kapalbhati — 3 sets × 30 cycles
  5. Shavasana — 1 set × 10 min
```

#### 2f. Monthly Phase Labels (for workout.js frontend)

Each monthly plan object must include:
```js
{
  monthLabel: 'Month 1',
  phaseLabel: 'Foundation Phase',   // required by workout.js
  focus: 'Building base strength and mobility',  // required by workout.js
  note: 'Focus on form over weight. Surya Namaskar daily.',  // required by workout.js
  schedule: [...]
}
```

Phase labels per month:
- Month 1–2: Foundation Phase
- Month 3–4: Progression Phase
- Month 5–6: Peak Phase

---

### 3. Phase-Based Diet Guidance (`server/engine/plan-builder.js`)

Add a `guidelines` array to each monthly diet plan object with phase-appropriate caloric and nutrition advice:

**Month 1–2 (Foundation):**
- "Establish 3 balanced meals + 1 snack routine"
- "Target: Moderate caloric deficit (−300 to −500 kcal) for weight-loss / surplus (+200 to +300 kcal) for muscle-gain"
- "Hydration: 2.5–3L water daily"

**Month 3–4 (Progression):**
- "Increase protein intake to support increased training load"
- "Add one pre-workout snack (banana + nut butter) on training days"
- "Monitor energy levels — adjust carb intake up if fatigue persists"

**Month 5–6 (Peak):**
- "Nutrient timing matters: protein within 45 min of workout"
- "Reduce refined carbs; increase complex carbs and vegetables"
- "Maintenance calories if goal weight is reached"

These are rendered in the diet plan's monthly banner (`dietPhaseBanner` in diet.js).

---

## Files Changed

| File | Change |
|------|--------|
| `public/js/recipes.js` | Replace `renderRecipes()` body; add "Show All Cuisines" toggle |
| `server/engine/plan-builder.js` | Replace `WEEKLY_SCHEDULE` + `buildWorkoutPlan()` with personalized schedule engine; import `getSuryaNamaskarRounds`; add phase guidelines to diet |
| `server/engine/exercise-composer.js` | Add yoga exercise data (Hatha, Vinyasa, Pranayama day lists); export from existing module |

---

## What Does NOT Change

- `meal-composer.js` — already correctly filters by cuisine + diet type
- `exercise-composer.js` `getExercises()` — already filters by equipment + fitness level + health conditions
- All Mongoose models, routes, auth, middleware
- All 225 existing tests must continue to pass

---

## Success Criteria

1. A Telugu vegetarian user sees only vegetarian south-indian recipes by default
2. A user with `workoutPreferences: ['yoga']` and `workoutDaysPerWeek: 4` gets 4 yoga days with Surya Namaskar first
3. A user with `workoutPreferences: ['gym']` and `workoutDaysPerWeek: 3` gets 3 gym days with bodyweight fallback if no equipment
4. Surya Namaskar appears as the first exercise on every non-rest day
5. The workout phase banner shows correct `phaseLabel`, `focus`, and `note`
6. Diet monthly plan shows phase-appropriate guidance text
7. All 225 tests pass after changes
