# Personalization Engine Design

**Date:** 2026-06-27  
**Status:** Approved  
**Scope:** Full per-user plan generation — diet, workout, recipes — driven by profile preferences

---

## Problem Statement

The health dashboard was built around a single user's (Karthik's) specific profile: south-Indian non-vegetarian cuisine, lower-back-pain protocol, thyroid medication restrictions, and a specific weight-loss trajectory. Any new user registering gets Karthik's exact meal plan, exercise program, and recipes regardless of their stated preferences.

The three concrete gaps:
1. **Diet plan** — All meals are Andhra Telugu south-Indian dishes. A north-Indian or continental user sees completely irrelevant food.
2. **Workout plan** — Exercises are hardcoded for lower-back-pain safe protocol. A healthy beginner with no equipment gets the same plan as an advanced gym user.
3. **Recipes** — 40+ static south-Indian recipes. No filtering by cuisine or diet type. Non-vegetarian users see veg recipes and vice versa.

---

## Design Goals

- Every user gets a diet plan that matches their cuisine preference AND diet type (veg/non-veg/vegan/eggetarian)
- Every user gets a workout plan calibrated to their goal, fitness level, available equipment, and health conditions
- Every user sees recipes from their cuisine pool, filtered for their diet type, ranked by macro fit
- Adding a new cuisine or exercise set requires adding data objects only — no logic changes
- All existing functionality (plan cache, template selection, 4-week rotation) stays intact

---

## Architecture

### Current State (Problem)

```
server/templates/weight-loss.js   ← 600+ lines of hardcoded Karthik-specific data
server/templates/muscle-gain.js   ← stub with minimal data
server/templates/maintenance.js   ← stub with minimal data
server/templates/general-fitness.js ← stub with minimal data
public/js/recipes.js              ← 39KB static file, all south-Indian, no tags
```

### Target State

```
server/
  meals/
    south-indian.js     — breakfast/lunch/dinner/snack options, tagged by dietType + goal
    north-indian.js
    continental.js
  exercises/
    strength.js         — tagged by equipment, fitnessLevel, goal, contraindications
    cardio.js
    flexibility.js
  engine/
    meal-composer.js    — getMeals(profile, mealType, goal, weekIndex, dayIndex)
    exercise-composer.js — getExercises(profile, muscleGroup, goal)
    plan-builder.js     — assembles full {weeks:[...]} plan from composers
  templates/
    weight-loss.js      — thin: calls plan-builder, sets goal-specific params
    muscle-gain.js
    maintenance.js
    general-fitness.js

public/js/
  recipes.js            — recipe objects gain cuisine + dietType + macros tags; filter logic added
```

Templates become thin orchestrators. All data lives in `meals/`, `exercises/`. All composition logic lives in `engine/`.

---

## Data Models

### Meal Object

```js
{
  id: 'pesarattu-upma',
  name: 'Pesarattu with Upma',
  cuisine: 'south-indian',         // 'south-indian' | 'north-indian' | 'continental'
  dietType: ['vegetarian', 'vegan', 'non-vegetarian', 'eggetarian'],
  mealType: 'breakfast',           // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  goals: ['weight-loss', 'maintenance', 'general-fitness'],
  macros: { protein: 12, carbs: 45, fat: 8, calories: 295 },
  tags: ['high-protein', 'low-gi'],
  recipeId: 'pesarattu-upma'        // links to recipe in recipes.js; null if no recipe
}
```

**Minimum meal coverage per cuisine × dietType × mealType:** 7 options each (enough for a non-repeating week).

### Exercise Object

```js
{
  id: 'goblet-squat',
  name: 'Goblet Squat',
  muscleGroup: 'legs',             // 'chest' | 'back' | 'legs' | 'shoulders' | 'core' | 'arms' | 'full-body'
  equipment: ['dumbbells'],        // [] means bodyweight only
  fitnessLevel: ['beginner', 'intermediate'],
  goals: ['weight-loss', 'muscle-gain', 'general-fitness'],
  contraindications: [],           // health conditions that exclude this exercise
  substitutes: {
    'lower-back-pain': 'seated-leg-press'  // substitute exercise id
  },
  sets: {
    sedentary: '3×10',
    'lightly-active': '3×12',
    'moderately-active': '4×12',
    'very-active': '5×5'
  },
  rest: '60s',
  notes: ''                        // optional safety/form notes
}
```

### Profile Fields Used for Personalization

These fields already exist in the User schema. All must be collected during onboarding and editable in settings:

| Field | Type | Values |
|---|---|---|
| `cuisinePreference` | string | `'south-indian'` \| `'north-indian'` \| `'continental'` \| `'mixed'` |
| `dietType` | string | `'vegetarian'` \| `'non-vegetarian'` \| `'vegan'` \| `'eggetarian'` |
| `primaryGoal` | string | `'weight-loss'` \| `'muscle-gain'` \| `'maintenance'` \| `'general-fitness'` |
| `fitnessLevel` | string | `'sedentary'` \| `'lightly-active'` \| `'moderately-active'` \| `'very-active'` |
| `equipmentAvailable` | string[] | `['dumbbells', 'gym', 'resistance-bands']` or `[]` |
| `healthConditions` | string[] | `['lower-back-pain', 'thyroid', 'diabetes', 'hypertension']` |

---

## Engine: Composition Logic

### `meal-composer.js` — `getMeals(profile, mealType, goal, weekIndex, dayIndex)`

1. Load meal pool for `profile.cuisinePreference`
2. Filter: `meal.mealType === mealType && meal.goals.includes(goal) && meal.dietType.includes(profile.dietType)`
3. Sort by macro fit:
   - `weight-loss`: ascending by calories
   - `muscle-gain`: descending by protein
   - `maintenance`, `general-fitness`: no sort, pool order
4. Select deterministically: `pool[(weekIndex * 7 + dayIndex) % pool.length]`
   - Same user always gets the same meal on the same week/day — no randomness
5. Return meal object

### `exercise-composer.js` — `getExercises(profile, muscleGroup, goal)`

1. Load full exercise pool from `strength.js` / `flexibility.js`
2. Filter by goal: `exercise.goals.includes(goal)`
3. Filter by fitness level mapping:
   - `sedentary` → beginner exercises
   - `lightly-active` → beginner + intermediate exercises
   - `moderately-active` → intermediate exercises
   - `very-active` → intermediate + advanced exercises
4. Filter by equipment: `exercise.equipment.length === 0 || exercise.equipment.some(e => profile.equipmentAvailable.includes(e))`
5. Exclude contraindications: remove any exercise where `exercise.contraindications.some(c => profile.healthConditions.includes(c))`
6. Apply substitutions: for remaining exercises, if a substitute exists for a user condition, replace `exercise.id` with the substitute
7. Map sets/rest to `profile.fitnessLevel`
8. Return exercise list

### `plan-builder.js` — `buildDietPlan(profile, goal, monthCount)`

Replaces the 600-line hardcoded blocks in `weight-loss.js`. Builds:
```js
{
  monthLabel: 'Month 1 — Weight Loss',
  weeks: [
    {
      weekLabel: 'Week 1',
      weekdays: [
        { day: 'Monday', breakfast: '...', lunch: '...', snack: '...', dinner: '...' },
        // × 7 days
      ]
    }
    // × 4 weeks
  ],
  guidelines: []  // from template, not composer
}
```

Templates call `buildDietPlan(profile, 'weight-loss', 3)` and inject goal-specific guidelines.

---

## Template Redesign

Each template becomes:

```js
// weight-loss.js
const { buildDietPlan, buildWorkoutPlan } = require('../engine/plan-builder');

function getDietPlan(profile) {
  const plan = buildDietPlan(profile, 'weight-loss', 3);
  plan.guidelines = getWeightLossGuidelines(profile);  // goal-specific, still personalized
  return plan;
}

function getWorkoutPlan(profile) {
  return buildWorkoutPlan(profile, 'weight-loss');
}

function getWeightLossGuidelines(profile) {
  const g = [
    'Maintain 500-calorie daily deficit',
    'Eat protein first at every meal',
  ];
  if (profile.healthConditions.includes('thyroid')) {
    g.push('Avoid raw cruciferous vegetables (thyroid protocol)');
    g.push('Limit chicken to Wed/Fri to avoid medication interaction');
  }
  if (profile.healthConditions.includes('diabetes')) {
    g.push('Avoid refined carbs — use brown rice, oats, millets');
  }
  return g;
}
```

All 4 templates follow this pattern. The only goal-specific code in a template is guidelines and any goal-specific cardio phase parameters.

---

## Recipe Personalization

### Tag Existing Recipes

Every recipe in `recipes.js` gains:
```js
cuisine: 'south-indian',
dietType: ['vegetarian'],  // or ['non-vegetarian'], or both
macros: { protein: 12, carbs: 45, fat: 8, calories: 295 }
```

### New Recipe Sets

| Cuisine | New Recipes Needed | Examples |
|---|---|---|
| South Indian | ~10 non-veg | Chicken Chettinad, Egg Curry, Fish Fry, Prawn Masala |
| North Indian Veg | ~20 | Dal Tadka, Rajma, Paneer Tikka, Chole, Aloo Paratha, Palak Paneer, Methi Thepla |
| North Indian Non-Veg | ~15 | Chicken Curry, Mutton Rogan Josh, Egg Bhurji, Keema Matar |
| Continental Veg | ~10 | Greek Salad, Overnight Oats, Quinoa Bowl, Hummus Wrap |
| Continental Non-Veg | ~10 | Chicken Stir-Fry, Tuna Salad, Egg White Omelette, Grilled Salmon |

### Filter Logic (added to `recipes.js`)

```js
function getFilteredRecipes(profile) {
  return RECIPES
    .filter(r => r.cuisine === profile.cuisinePreference)
    .filter(r => r.dietType.includes(profile.dietType))
    .sort((a, b) => macroScore(b, profile) - macroScore(a, profile));
}
```

`macroScore` ranks by:
- `weight-loss`: higher protein-to-calorie ratio = better
- `muscle-gain`: higher absolute protein = better
- Others: no sort

### "Suggested for Today" Section

The recipes page shows a "Suggested for Today" section: recipes whose `recipeId` matches any meal in today's plan (from planCache). This closes the loop between diet plan and recipes.

---

## Onboarding Wizard Changes

### New Steps Added

**Step: Cuisine Preference** (after diet type step)
> What cuisine style do you prefer for your meals?
> ○ South Indian — rice, dosa, sambar-based
> ○ North Indian — roti, dal, sabzi-based
> ○ Continental — salads, oats, Mediterranean-style
> ○ Mixed — variety from all cuisines

**Step: Equipment Available** (after fitness level step)
> What equipment do you have access to?
> ☐ No equipment (bodyweight only)
> ☐ Dumbbells or resistance bands
> ☐ Full gym access

### Settings Page Updates

Both fields added to the Profile Settings section. Changing either calls `planCache.invalidate()` before saving.

### Plan Cache Invalidation

`planCache.invalidate()` is called whenever any of these profile fields change: `cuisinePreference`, `dietType`, `fitnessLevel`, `equipmentAvailable`, `healthConditions`, `primaryGoal`.

---

## Meal Data Coverage Required

Minimum to avoid repetition in a 4-week plan (28 days × 4 meals = 112 slots per month):

| Cuisine | Veg Breakfasts | Non-Veg Breakfasts | Veg Lunches | Non-Veg Lunches | Veg Dinners | Non-Veg Dinners | Snacks |
|---|---|---|---|---|---|---|---|
| South Indian | 8 | 5 | 8 | 8 | 8 | 8 | 6 |
| North Indian | 8 | 5 | 8 | 8 | 8 | 8 | 6 |
| Continental | 6 | 4 | 6 | 6 | 6 | 6 | 5 |

Eggetarian = vegetarian meals + egg-inclusive options (eggs count as non-veg for meal selection).

---

## Out of Scope

- Real-time calorie tracking (users log meals, system doesn't calculate against actuals)
- AI-generated meal suggestions
- User-uploaded recipes
- Multi-cuisine mixing within a day (one cuisine per user, set in profile)
- Allergen/ingredient-level filtering (tagged by cuisine + dietType is sufficient for v1)

---

## Testing Approach

1. Unit tests for `meal-composer.js` — verify correct filtering for each profile combination
2. Unit tests for `exercise-composer.js` — verify contraindication exclusion, substitution logic, equipment filtering
3. Integration tests: each template's `getDietPlan(profile)` returns valid structure for all 12 profile combos (3 cuisines × 2 diet types × 2 relevant combos)
4. Existing 46 tests continue passing — plan structure contract unchanged
5. Onboarding wizard: Playwright/manual test that a new user completing onboarding gets a plan matching their stated preferences (not Karthik's)

---

## Migration Notes

- Existing users without `cuisinePreference` set: already defaulted to `'mixed'` by schema. `'mixed'` behaviour: composer draws from all cuisines equally, rotating through them across weeks.
- Existing users without `equipmentAvailable` set: default to `[]` (bodyweight only — safe default)
- No database migration required — both fields are optional in current schema with defaults already set.
