# Profile & Onboarding V2 — Design Spec
**Date:** 2026-06-27  
**Status:** Approved  
**Scope:** Profile data model extension, onboarding wizard redesign, deep-profile dashboard page, plan engine integration, periodic condition review system

---

## 1. Problem Statement

The current onboarding captures a single diet-type label (vegetarian / eggetarian / non-vegetarian / vegan) and a cuisine preference. This is too coarse:

- Users with mixed diets (e.g., mostly vegetarian + chicken twice a week) have no way to express that
- Cultural food norms (religious avoidances, regional cuisine) are not captured
- Health conditions and medications are permanent once entered — no way to mark them resolved
- The plan engine generates meals from cuisine pools, not from what the user actually eats
- No preference history — plan changes cannot be traced to profile changes

---

## 2. Approach

**A + C hybrid:**
- **A:** Extend `User` model with new fields; add a lean Phase 2 "Complete Your Profile" dashboard page
- **C:** Add a `ProfileSnapshot` collection for versioned preference history — written on onboarding completion, every settings save, and periodic check-in responses

---

## 3. Data Model

### 3.1 User Model — New Fields

```js
// Cultural identity
religion:               String   // 'Hindu' | 'Muslim' | 'Christian' | 'Jain' | 'Sikh' | 'Other'
languageCommunity:      String   // 'Telugu' | 'Tamil' | 'Kannada' | 'Malayalam' | 'Hindi' | 'Other'
culturalFoodAvoidances: [String] // e.g. ['beef', 'pork', 'onion', 'garlic', 'alcohol']

// Food list — what the user actually eats
foodList: [{
  name:     String,   // 'Pesarattu', 'Chicken curry', 'Idli'
  category: String,   // 'grains' | 'vegetables' | 'proteins' | 'dairy' | 'snacks' | 'beverages'
  custom:   Boolean   // true = user typed it; false = selected from checklist
}]

// Periodic review
reviewReminderDays: Number   // 30 | 60 | 90 (default: 60)
lastReviewedAt:     Date

// Workout preferences
workoutPreferences:  [String]  // ['gym', 'yoga', 'walking', 'running', 'home-bodyweight', 'sports', 'swimming']
workoutDaysPerWeek:  Number    // 2–6
workoutTime:         String    // 'morning' | 'afternoon' | 'evening'
yogaStyle:           String    // 'hatha' | 'vinyasa' | 'pranayama-only' | 'none'
```

### 3.2 Existing Fields — Modified

**healthConditions** — change from `[String]` to structured objects:
```js
healthConditions: [{
  name:       String,
  active:     Boolean,  // true = still affects plan; false = resolved
  resolvedAt: Date      // set when user marks as resolved
}]
```

**medications** — same pattern:
```js
medications: [{
  name:       String,
  dosage:     String,
  timing:     String,
  active:     Boolean,
  resolvedAt: Date
}]
```

### 3.3 New Collection — ProfileSnapshot

```js
{
  userId:     ObjectId,  // ref: User
  snapshotAt: Date,
  reason:     String,    // 'onboarding' | 'user-edit' | 'periodic-review'
  data:       Object     // full profile copy at time of snapshot
}
```

**Snapshot triggers:**
1. Onboarding wizard submit
2. Any save on Phase 2 "Complete Your Profile" page
3. Periodic check-in response (user reviews conditions)

---

## 4. Phase 1 Wizard — Registration (8 Steps)

Goal: capture only what is needed to generate a first usable plan. Everything deeper goes to Phase 2.

| Step | Content |
|------|---------|
| 1 | Name, Email, Password |
| 2 | Age, Height, Current weight, Goal weight |
| 3 | Primary goal: weight-loss / muscle-gain / maintenance / general-fitness |
| 4 | Fitness level + Activity level |
| 5 | Health conditions (multi-select checklist, each starts `active: true`) |
| 6 | Medications (add/remove rows: name, dosage, timing — each starts `active: true`) |
| 7 | Religion + Language community + Cultural food avoidances (multi-select: beef, pork, onion, garlic, alcohol + "Add custom avoidance" input) |
| 8 | Review & Submit |

**Removed from wizard:** cuisine preference and equipment (moved to Phase 2 — require more thought than registration flow allows).

**On submit:**
- Creates user + profile in DB
- Writes first `ProfileSnapshot` with `reason: 'onboarding'`
- Redirects to dashboard with Phase 2 completion prompt visible

---

## 5. Phase 2 — "Complete Your Profile" Dashboard Page

Accessible from a persistent completion card on the dashboard:
> *"Your profile is X% complete — finish to get a fully personalised plan"*

Percentage = fields filled / total Phase 2 fields.

### 5.1 Sections

**Cuisine & Equipment**
- Cuisine preference: south-indian / north-indian / continental / mixed
- Equipment available: 7-option checkbox group (same as current onboarding step 4)

**Workout Preferences**
- Preferred workout types (multi-select): Gym workout / Yoga / Walking / Running / Home bodyweight / Sports / Swimming
- Workout days per week: 2 / 3 / 4 / 5 / 6
- Preferred workout time: Morning / Afternoon / Evening (display scheduling only)
- Yoga style (shown only if Yoga selected): Hatha / Vinyasa / Pranayama-only / No preference

**Your Food List**
- Categorised checklist: Grains, Vegetables, Proteins, Dairy, Snacks, Beverages
- Each category expandable — shows common items for that category pre-populated based on `languageCommunity` (e.g., Telugu users see Pesarattu, Gongura, Pulusu in Vegetables)
- "Add custom food" input at bottom of each category
- User checks items they eat; unchecked = not consumed

**Health Conditions Review**
- Each condition from Phase 1 listed with:
  - Active / Resolved toggle
  - "Resolved on" date picker (appears when toggled to resolved)

**Medications Review**
- Same active/resolved toggle per medication

**Periodic Review Preference**
- Reminder frequency: Every 30 / 60 / 90 days
- "Last reviewed" date shown

**Every save on this page:**
- PATCHes the profile
- Writes a `ProfileSnapshot` with `reason: 'user-edit'`

---

## 6. Plan Engine Integration

### 6.1 Food List → Meal Selection

- When `foodList` has ≥ 10 items: meal composer filters meals so all ingredients are within the user's food list
- When `foodList` is empty (Phase 2 not completed): falls back to current cuisine-pool logic
- `culturalFoodAvoidances[]` is always a hard exclude — any meal containing an avoided ingredient is never shown, regardless of food list state

### 6.2 Active/Resolved Conditions → Plan Constraints

- Plan engine reads only `healthConditions` where `active === true`
- Resolved conditions are ignored in contraindication checks (exercise restrictions, dietary flags)
- Same for medications: only `active === true` medications affect plan

### 6.3 Plan Versioning

- Each generated plan records `snapshotId` (the ProfileSnapshot it was generated from)
- On profile save: if any plan-relevant field changed (foodList, avoidances, active conditions, goal), plan cache is invalidated and regenerated on next load

### 6.4 Religion + Language → Checklist Pre-population

- Phase 2 food checklist pre-selects commonly eaten foods based on `languageCommunity`:
  - Telugu: Idli, Dosa, Pesarattu, Gongura, Pulusu, Boorelu, Pongal, Rayalaseema items
  - Tamil: Pongal, Sambar, Rasam, Kozhukattai, Chettinad items
  - Kannada: Bisi bele bath, Ragi mudde, Coorg items
  - Others: generic South Indian / North Indian sets
- User can uncheck any pre-selected item
- `culturalFoodAvoidances` from Phase 1 are pre-checked in avoidances list

### 6.5 Age + Medication → Workout Personalisation

**Age tiers:**
| Age range | Workout profile |
|-----------|----------------|
| < 30 | All types available; advanced intensity unlocked |
| 30–45 | All types; moderate-advanced intensity; yoga recommended as supplement |
| 46–60 | Gym/yoga/walking preferred; high-impact exercises flagged with caution; pranayama included in every plan |
| 60+ | Walking, yoga, pranayama primary; gym exercises replaced with chair/resistance-band alternatives; no high-impact moves |

**Workout type → plan composition:**
- If `workoutPreferences` includes `yoga`: yoga sessions replace 1–2 cardio days; pranayama block added to every day
- If only `walking`: cardio plan becomes structured walking (duration, pace zones, step targets) — no gym exercises
- If `gym` or `home-bodyweight`: existing strength/flexibility composer used
- Mixed selections: rotated across `workoutDaysPerWeek` — e.g., 3 gym + 2 yoga if both selected

**Medication contraindications on exercise:**
- Beta-blockers → cap target heart rate at 60% max; no HIIT
- Statins → flag muscle soreness risk; reduce initial intensity; no extreme leg-day volume
- Blood thinners → no contact sports; avoid high-fall-risk exercises
- Diabetes medication → post-meal exercise timing warnings; carry snack reminders
- These are flags on the exercise plan UI — not hard blocks (user is responsible)

**Breathing exercises (pranayama) — Indian yoga standards:**
- Nadi Shodhana (alternate nostril): all ages, anxiety/stress, hypertension
- Kapalabhati: 18–55 only; not for hypertension, pregnancy, or heart conditions
- Bhramari: all ages; especially for anxiety, insomnia
- Anulom Vilom: all ages; diabetes, BP management
- Bhastrika: 18–45 only; not for heart conditions
- Age 60+: only Nadi Shodhana, Bhramari, Anulom Vilom
- Each pranayama tagged with: `ageMin`, `ageMax`, `contraindicatedConditions[]`, `contraindicatedMedications[]`

---

## 7. Periodic Review System

### 7.1 Check-in Flow

- Server-side: daily cron job (or on-login check) compares `lastReviewedAt + reviewReminderDays` against current date
- If overdue: dashboard shows dismissible banner:
  > *"It's been 60 days since you reviewed your health conditions. Take 2 minutes to update."*
- Clicking opens the Health Conditions Review section of the Phase 2 page
- On save: `lastReviewedAt` updated, `ProfileSnapshot` written with `reason: 'periodic-review'`

### 7.2 Dismiss Without Reviewing

- User can dismiss banner for 7 days ("Remind me later")
- After 3 consecutive dismissals, banner becomes non-dismissible until reviewed

---

## 8. API Changes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PATCH | `/api/profile` | Extended to accept all new fields |
| GET | `/api/profile/snapshots` | Returns snapshot history for a user |
| POST | `/api/profile/review` | Marks periodic review complete, writes snapshot |
| GET | `/api/profile/completion` | Returns % complete for Phase 2 prompt |

---

## 9. Progress Page — Personalised Dashboard

### 9.1 Problems with current progress page
- Shows very few data points
- Same layout regardless of goal
- No macro breakdown, no workout adherence, no streaks

### 9.2 Progress page sections (goal-aware)

**Always visible:**
- **Weight trend chart** — line chart, last 30 / 90 / 180 days; target weight line overlaid
- **Streak cards** — workout streak (days), breathing streak (days), water goal streak (days)
- **This week at a glance** — workouts completed / planned, calories logged / target, water intake

**Goal-specific sections:**

| Goal | Additional sections shown |
|------|--------------------------|
| weight-loss | Calorie deficit chart (daily intake vs target), body weight % change, fat-loss pace estimate |
| muscle-gain | Strength progression (lift weights logged over time per muscle group), protein intake vs target, muscle group coverage heatmap |
| maintenance | Macro balance (carbs/protein/fat %), consistency score (% days on plan), 6-month weight stability band |
| general-fitness | VO2 proxy (cardio minutes/week trend), flexibility sessions completed, mood/energy log |

**Monthly summary card:**
- Auto-generated on 1st of each month
- "Last month: lost 1.2kg, hit workout target 18/20 days, avg 7.2h sleep"

### 9.3 Data sources
- Weight: from `HealthLog` (user logs daily/weekly)
- Workouts: from `HealthLog` workout entries
- Calories/macros: from `HealthLog` food entries (requires calorie data on meals — see Section 11)
- Sleep: from existing sleep tracker
- Water: from `HealthLog` water entries
- Breathing: from `BreathingSession`

### 9.4 Logging improvements needed
- `HealthLog` must support: food entries with calorie + macro fields, water entries, weight entries, workout entries (exercise name, sets, reps, weight used)
- Log entry form on dashboard — quick-add panel for each type

---

## 10. Recipes — Preference-Driven Expansion

### 10.1 Problems with current recipes
- Only 71 recipes (fixed list)
- Not filtered by user's actual food list
- No nutritional info (calories, protein, carbs, fat)
- No meal-type tagging (breakfast / lunch / dinner / snack)

### 10.2 Recipe data model

Each recipe must have:
```js
{
  name:        String,
  cuisine:     String,           // 'south-indian' | 'north-indian' | 'continental'
  mealType:    [String],         // ['breakfast'] | ['lunch','dinner'] etc.
  dietType:    [String],         // existing tags
  ingredients: [String],         // ingredient names — matched against user's foodList
  nutrition: {
    caloriesPer100g: Number,
    proteinG:        Number,
    carbsG:          Number,
    fatG:            Number,
    servingSizeG:    Number
  },
  prepTimeMin: Number,
  tags:        [String]          // 'high-protein' | 'quick' | 'festive' | 'diabetic-friendly' etc.
}
```

### 10.3 Filtering logic

`getFilteredRecipes(profile)` must apply all of the following in order:

1. **Hard exclude** any recipe containing an ingredient in `culturalFoodAvoidances[]`
2. **Food list filter** (when `foodList.length >= 10`): only show recipes where all ingredients are in user's food list
3. **Cuisine filter**: match `cuisinePreference` (or all cuisines if 'mixed')
4. **Meal type filter**: caller passes `mealType` parameter to get breakfast / lunch etc.
5. **Goal filter**: tag-based boost — weight-loss users see 'low-calorie' tagged recipes first; muscle-gain users see 'high-protein' first

### 10.4 Recipe count targets

| Cuisine | Current | Target |
|---------|---------|--------|
| South Indian | 31 | 80 |
| North Indian | 25 | 60 |
| Continental | 15 | 40 |
| **Total** | **71** | **180** |

New recipes must have `ingredients[]` and `nutrition{}` fields — existing 71 recipes need these fields backfilled.

### 10.5 Community-specific recipes

Based on `languageCommunity`, additional recipes surfaced:
- Telugu: Gongura pachadi, Pesarattu, Pulihora, Boorelu, Gutti Vankaya, Rayalaseema Ragi Sangati
- Tamil: Pongal, Kozhukattai, Chettinad Chicken, Vazhaipoo Vadai
- Kannada: Bisi Bele Bath, Ragi Mudde, Neer Dosa, Coorg Pandi Curry

These are tagged `community: 'telugu'` etc. and surfaced when `languageCommunity` matches.

---

## 11. Calorie & Macro Calculation

### 11.1 Per-user daily targets (derived at plan generation)

Using Mifflin-St Jeor BMR formula:
- Male BMR = 10 × weightKg + 6.25 × heightCm − 5 × age + 5
- Female BMR = 10 × weightKg + 6.25 × heightCm − 5 × age − 161
- TDEE = BMR × activity multiplier (sedentary 1.2 → very-active 1.725)
- Goal adjustments: weight-loss → TDEE − 500 kcal; muscle-gain → TDEE + 300 kcal; maintenance → TDEE

Macro split by goal:
| Goal | Protein | Carbs | Fat |
|------|---------|-------|-----|
| weight-loss | 35% | 40% | 25% |
| muscle-gain | 40% | 40% | 20% |
| maintenance | 30% | 45% | 25% |
| general-fitness | 30% | 45% | 25% |

### 11.2 Stored on User model

```js
dailyCalorieTarget: Number,   // computed and stored on plan generation
dailyProteinG:      Number,
dailyCarbsG:        Number,
dailyFatG:          Number
```

### 11.3 Diet plan calorie display

Each day's meal plan shows total estimated calories and macros — summed from recipe `nutrition` fields of assigned meals. Displayed in diet page and progress page.

---

## 12. Grocery List — Preference-Driven Generation

### 12.1 Problem
Current grocery list is static — same items regardless of what the user actually eats.

### 12.2 New logic

Grocery list is derived from the current week's meal plan:
1. Collect all recipes assigned to the user's meal plan for the week
2. Extract `ingredients[]` from each recipe
3. Deduplicate and group by category (Grains, Vegetables, Proteins, Dairy, Spices, Snacks)
4. Apply quantity estimation: based on servings × days × household size (default: 1 person)
5. Hard-exclude any ingredient in `culturalFoodAvoidances[]`

### 12.3 User control
- User can check off items as purchased (persisted per-week)
- User can add custom items ("Add to list")
- User can remove items they already have ("Already have it")

---

## 13. API Changes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PATCH | `/api/profile` | Extended to accept all new fields incl. workout prefs |
| GET | `/api/profile/snapshots` | Returns snapshot history for a user |
| POST | `/api/profile/review` | Marks periodic review complete, writes snapshot |
| GET | `/api/profile/completion` | Returns % complete for Phase 2 prompt |
| GET | `/api/recipes` | Returns filtered recipes for current user |
| GET | `/api/recipes/:id` | Single recipe with full nutrition + ingredients |
| GET | `/api/progress/summary` | Goal-aware progress summary (weight trend, streaks, macros) |
| GET | `/api/progress/monthly/:month` | Monthly summary card data |
| POST | `/api/logs` | Log entry (food, water, weight, workout) |
| GET | `/api/grocery/week` | Current week's generated grocery list |
| PATCH | `/api/grocery/week/:itemId` | Mark grocery item purchased / remove |

---

## 14. Migration

Existing users:
- `healthConditions: [String]` → migrated to `[{ name, active: true }]` (all assumed active)
- `medications: [{ name, dosage, timing }]` → add `active: true, resolvedAt: null` to each
- `foodList`: empty array (Phase 2 not yet completed — falls back to cuisine pool)
- `culturalFoodAvoidances`: empty array
- `religion`, `languageCommunity`: null (Phase 2 prompts for these)

Migration script: `scripts/migrate-profile-v2.js`

---

## 15. Testing

- Unit: ProfileSnapshot writes on each trigger
- Unit: Plan engine reads only `active: true` conditions/medications
- Unit: `culturalFoodAvoidances` hard-excludes from meal and recipe results
- Unit: foodList filter returns no meals/recipes with avoided ingredients
- Unit: Mifflin-St Jeor BMR calculation correct for male/female/age/weight/height
- Unit: Grocery list derived from week's meals — correct deduplication and grouping
- Unit: Pranayama age/condition filter — Kapalabhati excluded for 60+, hypertension
- Integration: Full onboarding wizard submit → ProfileSnapshot created
- Integration: Phase 2 save → snapshot written + plan cache invalidated
- Integration: Periodic review banner logic (overdue, dismiss, non-dismissible after 3)
- Integration: Recipe filter — cultural avoidances always excluded, food list filter when ≥10 items
- Integration: Progress summary returns goal-appropriate sections
- Migration: existing user data shape preserved and extended correctly
