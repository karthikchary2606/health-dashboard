# Personalization Engine — Design Spec
**Date:** 2026-07-02  
**Status:** Approved + Extended (full audit)  
**Scope:** Onboarding step 4, recipe filtering, workout engine rebuild, Surya Namaskar, diet phase guidance, macro targets

---

## Complete Issue Inventory

### P0 — Data never collected (root cause of most personalization failures)

**BUG-1: Onboarding step 4 missing**  
The onboarding flow jumps 1→2→3→5→6→7→8. Step 4 (Workout Preferences) doesn't exist in the HTML. `workoutPreferences`, `workoutDaysPerWeek`, `workoutTime`, `yogaStyle` are defined in the User model and exist in `profile-complete.html`, but are **never collected in onboarding**. `submitProfile()` doesn't include them. Draft persistence doesn't save them. The workout engine therefore has no user preferences to work with.

**BUG-2: Gender field collected but never saved**  
Step 1 has `f-sex` (gender) selector. `submitProfile()` does not include it in the payload. `computeMacroTargets()` in `profile.js` has a TODO for gender — the data would be available if wired.

### P0 — Filtering broken

**BUG-3: Recipe rendering bypasses `getFilteredRecipes()`**  
`renderRecipes()` in `public/js/recipes.js` does its own naive tag/name heuristic filter. `getFilteredRecipes()` already exists and correctly handles cuisine, diet type pool, cultural avoidances, health condition tags, and goal-based sort — but is never called from the render function. Cuisine filter never applies.

**BUG-4: `renderRecipes()` diet filter is unreliable**  
The naive filter checks `r.tags.some(t => ['chicken', 'meat', ...])` — this misses recipes where the non-veg ingredient is in the name or ingredients, not the tags. `getFilteredRecipes()` uses the `r.dietType` array which is explicit and reliable.

### P0 — Workout personalization missing

**BUG-5: `buildWorkoutPlan()` ignores all profile preferences**  
One hardcoded `WEEKLY_SCHEDULE` array serves all users. `workoutPreferences`, `workoutDaysPerWeek`, `yogaStyle`, `fitnessLevel` (for scheduling), `equipmentAvailable` are not used to shape the schedule structure. `getExercises()` does use `fitnessLevel` + `equipmentAvailable` + `healthConditions` per-exercise — the per-exercise logic works but the schedule structure is hardcoded.

**BUG-6: `getSuryaNamaskarRounds()` never used**  
The function exists in `exercise-composer.js` and is tested but never imported or called from `plan-builder.js`. Surya Namaskar never appears in any workout plan.

**BUG-7: Monthly workout objects missing `phaseLabel`, `note`, `focus`**  
`workout.js` renders `w.phaseLabel`, `w.note`, `w.focus` — all `undefined` because `buildWorkoutPlan()` only returns `{ monthLabel, schedule }`. Phase banners show blank.

### P1 — Diet guidance missing

**BUG-8: No phase-based diet guidance**  
Diet monthly plan objects lack guidance text. The `dietPhaseBanner` in `diet.js` renders only the `monthLabel` and `guidelines` array — `guidelines` is always empty.

**BUG-9: `computeMacroTargets()` always returns `{}`**  
Gender field was intentionally deferred but gender is now captured in onboarding. With gender wired up, macro targets (BMR-based calorie, protein, carb, fat targets) can be computed and returned as profile fields, feeding the macro chart in progress.js.

---

## Design

### Fix 1: Add Step 4 to Onboarding — Workout Preferences

**File:** `public/onboarding.html`

Insert a new `<div class="step" id="step-4">` between step 3 and step 5, containing:

1. **Workout preferences** (multi-select checkboxes, `name="workoutPref"`):
   - `gym` — Gym workouts
   - `home-workout` — Home / bodyweight
   - `yoga` — Yoga & mindfulness
   - `cardio` — Cardio focus (running, cycling)

2. **Days per week** (select, id=`f-workoutDays`): options 2–7, default 4

3. **Preferred time** (select, id=`f-workoutTime`): Morning / Afternoon / Evening

4. **Yoga style** (select, id=`f-yogaStyle`, shown only if yoga is checked):
   - Hatha / Vinyasa / Pranayama-only / None

**Navigation fix:**
- Step 3 next button: `goTo(3)` → `goTo(4)`
- Step 4 back: `goTo(3)`, next: `goTo(5)`
- Step 5 back button: `goTo(3)` → `goTo(4)`
- Update progress label from "8" to "9" total steps and update `TOTAL_STEPS = 9`
- Update `goTo()` progress percentage calculation

**`submitProfile()` additions:**
```js
workoutPreferences: checkedBoxes('workoutPref'),
workoutDaysPerWeek: parseInt(val('f-workoutDays')) || 4,
workoutTime:        val('f-workoutTime') || undefined,
yogaStyle:          val('f-yogaStyle') || undefined,
sex:                val('f-sex') || undefined,   // wire gender too (BUG-2)
```

**`saveDraft()` / `loadDraft()` additions:** Include all new fields.

---

### Fix 2: Wire Gender → Macro Targets

**File:** `server/routes/profile.js` — `computeMacroTargets(profile)`

Add `sex` field to User schema (extend `profileSchema`). Compute BMR using Mifflin-St Jeor:
- Male: BMR = 10×weight + 6.25×height − 5×age + 5
- Female: BMR = 10×weight + 6.25×height − 5×age − 161

Apply activity multiplier from `fitnessLevel`, then adjust by goal:
- weight-loss: −300 kcal deficit
- muscle-gain: +300 kcal surplus
- maintenance/general-fitness: TDEE

Return `{ dailyCalorieTarget, dailyProteinG, dailyCarbsG, dailyFatG }` and save to profile.

**File:** `models/User.js` — add `sex: { type: String, enum: ['male', 'female', 'other'] }` to profileSchema.

---

### Fix 3: Recipe Filtering

**File:** `public/js/recipes.js`

Replace `renderRecipes(cat)` body:
```js
function renderRecipes(cat) {
  const profile = (currentUser && currentUser.profile) || {};
  const showAll = window._recipeShowAll || false;
  const profileOverride = showAll ? { ...profile, cuisinePreference: 'mixed' } : profile;

  const recs = getFilteredRecipes(profileOverride, {
    limit: 200,
    mealType: cat !== 'all' ? cat : undefined
  });

  // render recs …
}
```

Add "Show All Cuisines" toggle button above recipe grid:
```html
<button id="toggleCuisineBtn" onclick="toggleCuisineFilter(this)">🌍 Show All Cuisines</button>
```
```js
window._recipeShowAll = false;
function toggleCuisineFilter(btn) {
  window._recipeShowAll = !window._recipeShowAll;
  btn.textContent = window._recipeShowAll ? '🍛 My Cuisine Only' : '🌍 Show All Cuisines';
  renderRecipes(currentRecipeFilter);
}
```

---

### Fix 4: Workout Engine Rebuild

**File:** `server/engine/plan-builder.js`

Replace `WEEKLY_SCHEDULE` constant and `buildWorkoutPlan()` with profile-driven generation.

#### 4a. Detect workout mode
```js
function detectWorkoutMode(profile) {
  const prefs = profile.workoutPreferences || [];
  const hasGym  = prefs.includes('gym') || (profile.equipmentAvailable || []).includes('gym-access');
  const hasYoga = prefs.includes('yoga');
  if (hasGym && hasYoga) return 'hybrid';
  if (hasYoga) return 'yoga';
  if (hasGym) return 'gym';
  return 'home'; // default: bodyweight
}
```

#### 4b. Generate day slots by `workoutDaysPerWeek`
```
3 days → Mon, Wed, Fri
4 days → Mon, Tue, Thu, Fri  (default)
5 days → Mon–Fri
6 days → Mon–Sat
7 days → Mon–Sun
default → 4 days
```

Rest days use type `'rest'` with optional Surya Namaskar entry.

#### 4c. Assign focus per mode

**Gym/Home mode** — rotation of muscle groups across active days:
- If 3 days: [Full Body, Upper Body, Lower Body]
- If 4 days: [Lower Body, Upper Body, Back & Core, Full Body]
- If 5 days: [Lower Body, Upper Body, Back & Core, Full Body, Cardio]
- If 6+ days: [Lower Body, Upper Body, Back & Core, Full Body, Cardio, Flexibility]

**Yoga mode** — cycle: Hatha → Vinyasa → Pranayama-only → Hatha…
- `yogaStyle = 'hatha'` → all days Hatha
- `yogaStyle = 'vinyasa'` → all days Vinyasa
- `yogaStyle = 'pranayama-only'` → all days Pranayama
- `yogaStyle = 'none'` or empty → Hatha fallback
- Default (no preference) → cycle Hatha/Vinyasa/Pranayama

**Hybrid mode** — alternating Gym → Yoga → Gym → Yoga by active day index

#### 4d. Surya Namaskar — always first

```js
import { getSuryaNamaskarRounds } from './exercise-composer';

function suryaWarmup(profile) {
  const rounds = getSuryaNamaskarRounds(profile);
  return {
    name: `Surya Namaskar — ${rounds} rounds`,
    sets: rounds,
    reps: '12 poses per round',
    note: `Age/fitness-adjusted warm-up. Engages full body before training.`,
    cat: 'yoga'
  };
}
```

Prepend to every active day's exercise list. Rest days include:
```js
{ name: 'Gentle Surya Namaskar (optional)', sets: 3, reps: '12 poses per round', note: 'Active recovery', cat: 'yoga' }
```

#### 4e. Yoga day exercise lists

Define `YOGA_EXERCISES` object in `exercise-composer.js`:
```js
const YOGA_EXERCISES = {
  hatha: [
    { name: 'Vrikshasana (Tree Pose)',        sets: 3, reps: '30s hold per side', note: 'Balance and focus', cat: 'yoga' },
    { name: 'Warrior II (Virabhadrasana II)', sets: 3, reps: '45s hold per side', note: 'Hip strength',      cat: 'yoga' },
    { name: 'Setu Bandhasana (Bridge Pose)',  sets: 3, reps: '12 reps',           note: 'Glute activation', cat: 'yoga' },
    { name: 'Paschimottanasana (Seated Forward Fold)', sets: 3, reps: '30s hold', note: 'Hamstring stretch', cat: 'yoga' },
    { name: 'Shavasana (Corpse Pose)',        sets: 1, reps: '5 min',             note: 'Full relaxation',  cat: 'yoga' },
  ],
  vinyasa: [
    { name: 'Chaturanga → Up Dog → Down Dog Flow', sets: 3, reps: '5 rounds',    note: 'Core + upper body', cat: 'yoga' },
    { name: 'Warrior I → II → Reverse Warrior',    sets: 3, reps: 'per side',    note: 'Full body flow',   cat: 'yoga' },
    { name: 'Chair Pose (Utkatasana)',              sets: 3, reps: '45s hold',    note: 'Thigh strength',   cat: 'yoga' },
    { name: 'Plank → Side Plank',                  sets: 3, reps: '30s each',    note: 'Core stability',   cat: 'yoga' },
    { name: 'Shavasana',                           sets: 1, reps: '3 min',       note: 'Recovery',         cat: 'yoga' },
  ],
  'pranayama-only': [
    { name: 'Anulom Vilom (Alternate Nostril Breathing)', sets: 1, reps: '5 min',         note: 'Balance nervous system', cat: 'yoga' },
    { name: 'Bhramari (Humming Bee Breath)',              sets: 1, reps: '5 min',         note: 'Reduce stress',          cat: 'yoga' },
    { name: 'Kapalbhati (Skull-Shining Breath)',          sets: 3, reps: '30 cycles',     note: 'Energize & detox',       cat: 'yoga' },
    { name: 'Uddiyana Bandha',                           sets: 3, reps: '10 contractions',note: 'Abdominal strength',     cat: 'yoga' },
    { name: 'Shavasana',                                 sets: 1, reps: '10 min',         note: 'Deep relaxation',        cat: 'yoga' },
  ]
};
```

Export `getYogaExercises(yogaType)` from `exercise-composer.js`.

#### 4f. Monthly workout objects — required fields for frontend

Each monthly plan entry must include:
```js
{
  monthLabel: 'Month 1',        // existing
  phaseLabel: 'Foundation Phase',   // NEW — required by workout.js
  focus: 'Building base strength and mobility', // NEW — required by workout.js
  note: 'Focus on form. Surya Namaskar every session.', // NEW — required by workout.js
  schedule: [...]
}
```

Phase labels by goal and month:

| Goal | M1–2 | M3–4 | M5–6 |
|------|------|------|------|
| weight-loss | Foundation | Progression | Peak |
| muscle-gain | Hypertrophy Foundation | Progressive Overload | Strength Peak |
| maintenance | Stabilize | Optimize | Sustain |
| general-fitness | Establish Routine | Build Consistency | Advance & Maintain |

---

### Fix 5: Phase-Based Diet Guidance

**File:** `server/engine/plan-builder.js` — `buildDietPlan()`

Add `guidelines` array to each monthly diet plan object:

**Foundation (M1–2):**
- "Establish 3 balanced meals + 1 snack"
- "Caloric target: -300 kcal deficit (weight-loss) / +300 surplus (muscle-gain)"
- "Hydration: 2.5–3L water daily"

**Progression (M3–4):**
- "Increase protein to support higher training volume"
- "Pre-workout snack on training days (banana + nut butter)"
- "Adjust carbs up if energy is low"

**Peak (M5–6):**
- "Protein within 45 min post-workout"
- "Reduce refined carbs; increase complex carbs and leafy greens"
- "Maintenance calories if goal weight is reached"

---

## Files Changed

| File | Change |
|------|--------|
| `public/onboarding.html` | Add step 4 (workout prefs), fix step numbering 3→4→5, wire `sex` + workout fields to `submitProfile()` and draft |
| `models/User.js` | Add `sex` field to profileSchema |
| `server/routes/profile.js` | Implement `computeMacroTargets()` with Mifflin-St Jeor + goal adjustment |
| `server/engine/exercise-composer.js` | Add `YOGA_EXERCISES` data, export `getYogaExercises()`, keep existing exports |
| `server/engine/plan-builder.js` | Replace `WEEKLY_SCHEDULE` + `buildWorkoutPlan()` with profile-driven engine; import `getSuryaNamaskarRounds` + `getYogaExercises`; add phase labels and guidelines to diet plan |
| `public/js/recipes.js` | Replace `renderRecipes()` to use `getFilteredRecipes()`; add cuisine toggle button |

---

## What Does NOT Change

- `meal-composer.js` — diet filtering already correct
- `exercise-composer.js` `getExercises()` — per-exercise filtering already correct
- All Mongoose models except User.js (adding `sex` field)
- All routes except `profile.js` (`computeMacroTargets`)
- All 225 existing tests must pass after changes

---

## Success Criteria

1. Onboarding step 4 collects `workoutPreferences`, `workoutDaysPerWeek`, `workoutTime`, `yogaStyle`
2. After onboarding, profile contains all workout preference fields
3. A yoga-only user with 4 days/week gets 4 yoga days in their workout plan
4. A gym user with 3 days/week gets 3 gym days (Lower Body, Upper Body, Full Body)
5. Surya Namaskar is the first exercise on every non-rest day
6. Workout phase banners show correct `phaseLabel`, `focus`, `note`
7. A vegetarian south-indian user sees only vegetarian south-indian recipes by default
8. "Show All Cuisines" button overrides cuisine filter
9. Diet monthly plan shows phase-appropriate guidance text
10. Macro targets computed when gender + weight + height + age all present
11. All 225 existing tests pass
