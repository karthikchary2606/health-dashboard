# Design: Per-User Health Profiles & Profile-Driven API

**Date:** 2026-06-26  
**Status:** Approved  
**Repo:** karthikchary2606/health-dashboard  

---

## Problem

The application was built as a personal health tracker for one person (Karthik). All content — diet plans, workout schedules, cardio plans, grocery lists, medication schedules, calorie targets, weight goals, and program start dates — is hardcoded as static JavaScript constants in the browser. Every user who logs in sees identical content tailored to Karthik's body stats, Telugu cuisine preferences, lower back pain condition, and specific medications (Thyronorm 12.5mg).

The database layer (HealthLog, ChecklistItem, BreathingSession) is already correctly user-scoped. The gap is that nothing above the DB layer uses the authenticated user's profile.

---

## Goals

1. Every user has a unique health profile stored in MongoDB.
2. All content (diet, workout, cardio, grocery, medications, goals, milestones) is derived from that profile — no hardcoded personal data in the browser.
3. New users are guided through a 6-step onboarding wizard before accessing the dashboard.
4. Existing users (including Karthik) retain their data — no data loss during migration.
5. Users can update their profile and switch plan templates at any time via a settings page.

---

## Non-Goals

- AI-generated or nutritionist-verified meal plans (templates are developer-authored)
- Social features (sharing progress, leaderboards)
- Mobile app / push notifications
- Calorie tracking via food logging (beyond what's in the existing diet tab)

---

## Architecture

### Approach: Profile-Driven API

Plan data moves from static browser JS files to server-side template modules. The frontend fetches a computed JSON plan via `/api/profile/plan` and renders from it. No new MongoDB collections — plan data is computed at request time from templates.

```
User (MongoDB)
  └── profile (embedded sub-document)  ← source of truth
        ├── goal, body stats, dietary prefs
        ├── fitness level, health conditions
        ├── medications []
        └── planTemplate

server/templates/
  ├── weight-loss.js        ← getDietPlan(profile), getWorkoutPlan(profile), ...
  ├── muscle-gain.js
  ├── maintenance.js
  └── general-fitness.js

/api/profile
  ├── POST /onboarding      ← saves wizard result, sets profileComplete=true
  ├── GET  /                ← returns full user profile
  ├── PATCH /               ← update any profile field (settings page)
  └── GET  /plan            ← returns full computed plan as JSON

Frontend (public/js/)
  ├── planCache.js          ← NEW: fetches /api/profile/plan once, shared across tabs
  ├── diet.js               ← rewritten: renders from planCache
  ├── workout.js            ← rewritten: renders from planCache
  ├── cardio.js             ← rewritten: renders from planCache
  ├── grocery.js            ← rewritten: renders from planCache
  ├── guidelines.js         ← rewritten: medications from profile, seeds from planCache
  └── dashboard.js          ← rewritten: phase/month from profile.startDate
```

---

## Data Model

### User.profile — extended fields (additions only, backwards compatible)

```javascript
profile: {
  // Existing fields (unchanged)
  age: Number,
  heightCm: Number,
  startWeightKg: Number,
  goalWeightKg: Number,
  startDate: Date,
  dietaryPreferences: [String],

  // NEW: Goal
  primaryGoal: {
    type: String,
    enum: ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness']
  },
  secondaryGoals: [String], // e.g. ['stress-reduction', 'better-sleep', 'chronic-pain']

  // NEW: Body
  currentWeightKg: Number, // separate from startWeightKg — updated over time

  // NEW: Dietary
  dietType: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan', 'keto', 'mediterranean']
  },
  cuisinePreference: {
    type: String,
    enum: ['south-indian', 'north-indian', 'continental', 'no-preference']
  },
  foodAllergies: [String],

  // NEW: Fitness
  fitnessLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  equipmentAvailable: {
    type: String,
    enum: ['home', 'gym', 'both']
  },
  healthConditions: [String], // e.g. ['lower-back-pain', 'hypertension', 'diabetes']

  // NEW: Medications
  medications: [{
    name: String,
    dose: String,
    timing: String,
    note: String
  }],

  // NEW: Plan assignment
  planTemplate: {
    type: String,
    enum: ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness']
  }
},

// NEW: top-level flag — gates onboarding wizard
profileComplete: { type: Boolean, default: false }
```

---

## Plan Templates

Four server-side template modules in `server/templates/`. Each exports four functions:

```javascript
// signature for all templates
getDietPlan(profile)     → { months: [...], notes: [...] }
getWorkoutPlan(profile)  → { schedule: { Monday: {...}, ... }, phases: [...] }
getCardioPlan(profile)   → { table: [...], phases: [...], hrZones: [...] }
getGroceryList(profile)  → { months: [...] }
```

Templates filter content based on:
- `profile.cuisinePreference` — determines meal names and ingredients
- `profile.healthConditions` — e.g. `lower-back-pain` → spine-safe exercises, no heavy barbell loading
- `profile.equipmentAvailable` — home templates use dumbbells/bodyweight only
- `profile.fitnessLevel` — beginner templates use lower volume, more rest
- `profile.dietType` — veg/vegan templates exclude meat; keto removes rice/grains

The `weight-loss` template with `south-indian` cuisine and `lower-back-pain` produces output equivalent to the current hardcoded Karthik-specific data. This is how Karthik's account is migrated with zero visible change.

---

## API Routes

### `/api/profile`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/profile/onboarding` | verifyToken | Save wizard result; sets `profileComplete: true` |
| GET | `/api/profile` | verifyToken | Return full user profile (minus passwordHash) |
| PATCH | `/api/profile` | verifyToken | Update any profile field; re-fetching /plan reflects changes immediately |
| GET | `/api/profile/plan` | verifyToken | Run template with user's profile, return full plan JSON |

### Auth middleware change

`middleware/auth.js` — after verifying JWT, check `user.profileComplete`. If `false` and the request is not to `/api/profile/onboarding` or `/api/auth/*`, respond 403 with `{ redirect: '/onboarding' }`. The frontend intercepts this and navigates to the wizard.

---

## Onboarding Wizard

**File:** `public/onboarding.html`  
**Trigger:** First login when `profileComplete === false` (or direct nav to `/onboarding`)  
**Blocks:** Dashboard, diet, workout, all content tabs  

### Steps

1. **Goal** — primary goal (weight-loss/muscle-gain/maintenance/general-fitness), optional secondary goals
2. **Body Stats** — age, height, current weight, target weight, program start date
3. **Dietary Preferences** — diet type, cuisine preference, allergies/avoidances
4. **Fitness Level & Health Conditions** — experience level, equipment, health conditions (multi-select)
5. **Plan Assignment** — suggest 1–2 templates based on inputs; user confirms or picks manually
6. **Medications** — add 0 or more medications with name, dose, timing, note; skippable

On completion: `POST /api/profile/onboarding` → success → redirect to `/` (dashboard).

---

## Frontend Changes

### New: `public/js/planCache.js`
- On load, calls `GET /api/profile/plan` once
- Stores result in module-level `planData` object
- Exports `getPlan()` — all other JS files call this instead of reading local constants
- If plan fetch fails (403 → redirect to onboarding; 503 → show offline warning)

### Files rewritten (hardcoded constants removed, render from planCache)

| File | What changes |
|------|-------------|
| `diet.js` | Remove `MONTHLY_DIET`. Render from `getPlan().diet` |
| `workout.js` | Remove `WORKOUT_PLAN`, `WORKOUT_PHASES`. Render from `getPlan().workout` |
| `cardio.js` | Remove `CARDIO_TABLE`, `CARDIO_PHASES`, `HR_ZONES`. Render from `getPlan().cardio` |
| `grocery.js` | Remove `GROCERY_PLAN`. Render from `getPlan().grocery` |
| `guidelines.js` | Remove `SEEDS`, `SUPP_TIMING`. Seeds from `getPlan().seeds`. Medications from `getPlan().medications` (profile data) |
| `dashboard.js` | Remove `PROGRAM_START = new Date(...)`. Use `getPlan().startDate` for phase/month calc |
| `progress.js` | Replace hardcoded `75` and `95` with `getPlan().profile.goalWeightKg` and `profile.currentWeightKg` |

---

## New Features

### 1. Profile & Settings Page
- **File:** `public/settings.html`
- Shows all profile fields; user can edit any field and save
- Switching `planTemplate` triggers a reload of planCache
- Accessible via nav at all times post-onboarding

### 2. BMI & TDEE Card (Dashboard)
- Computed server-side from `profile.age`, `profile.heightCm`, `profile.currentWeightKg`
- Displayed as a card on the dashboard alongside existing stats
- Updates automatically as user logs weight

### 3. Medication Schedule (Guidelines Tab)
- Medications rendered from `profile.medications[]` — not hardcoded
- User manages their medication list from the settings page
- Guidelines tab shows timing schedule built from profile data

### 4. Weekly Progress Summary
- Every Monday, dashboard shows a summary card for the prior 7 days
- Data from existing HealthLog (no new model needed): workouts completed, avg water, mood trend, weight delta
- Computed via `GET /api/logs/data/weekly-summary` (new endpoint)

### 5. Personalised Milestones (Progress Page)
- Milestones derived from `profile.startWeightKg` and `profile.goalWeightKg`
- Examples: "Lost first 2kg", "25% to goal", "Halfway there", "Goal reached!"
- No hardcoded `95kg` or `75kg` values

### 6. Smart Checklist Seeding
- `routes/checklist.js` — replace `DEFAULT_ITEMS` with `getDefaultChecklist(profile)` from plan template
- Seeds items appropriate to user's goal and fitness level (e.g. weight-loss → water intake, steps; muscle-gain → protein intake, workout completion)

---

## Migration Plan

### Karthik's account (existing admin user)
Run once after deployment:
```javascript
// scripts/migrate-karthik-profile.js
await User.findOneAndUpdate(
  { email: 'karthik@...' },
  {
    'profile.primaryGoal': 'weight-loss',
    'profile.dietType': 'non-veg',
    'profile.cuisinePreference': 'south-indian',
    'profile.fitnessLevel': 'intermediate',
    'profile.equipmentAvailable': 'home',
    'profile.healthConditions': ['lower-back-pain'],
    'profile.planTemplate': 'weight-loss',
    'profile.currentWeightKg': 95,
    'profileComplete': true,
    'profile.medications': [
      { name: 'Thyronorm', dose: '12.5mg', timing: '06:30 AM', note: 'Strict empty stomach. 45-min wait.' }
    ]
  }
);
```

### Other existing users
No migration needed. `profileComplete: false` by default → wizard shown on next login.

---

## Error Handling

- `GET /api/profile/plan` with incomplete profile → 400 with field-level errors indicating what's missing
- Onboarding wizard validates each step before advancing; no partial submissions to API
- `planCache.js` — if plan fetch returns 503 (DB offline), show graceful offline banner; do not crash
- Template functions — if a profile field used for filtering is missing, fall back to the most general variant of the template

---

## Testing Approach

- Unit tests for each template function (`getDietPlan`, `getWorkoutPlan`, etc.) with varied profile inputs
- Integration tests for `/api/profile/onboarding` (complete flow, partial data, duplicate submission)
- Integration tests for `/api/profile/plan` verifying template filtering (LBP → no deadlifts; veg → no meat)
- Frontend smoke tests: new user → wizard → dashboard shows profile-derived content; settings update → plan re-renders

---

## Implementation Phases

| Phase | Scope | Dependencies |
|-------|-------|-------------|
| 1 | Data model, migration script, /api/profile routes, auth middleware gate | None |
| 2 | Plan template modules (server/templates/), /api/profile/plan endpoint | Phase 1 |
| 3 | planCache.js, rewrite all 7 frontend JS files | Phase 2 |
| 4 | Onboarding wizard (onboarding.html) | Phase 1 + 2 |
| 5 | New features: settings page, BMI card, weekly summary, milestones, smart checklist, medications tab | Phase 3 + 4 |
