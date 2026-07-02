# Health Dashboard - Comprehensive Bug Hunt Report
**Generated: 2026-07-02** | **Tester: Copilot CLI**

## Executive Summary
- **Total Issues Found**: 11
- **Critical**: 3 (blocks main workflow)
- **High**: 5 (breaks features)
- **Medium**: 2 (UI/UX issues)
- **Low**: 1 (edge case)

---

## 🔴 CRITICAL ISSUES (Blocks Workflow)

### 1. **BreathingSession Technique Mismatch - API Design Flaw**
**Severity**: CRITICAL | **Category**: Data Model Integrity

**Description**:
The `/api/breathing/techniques` endpoint returns Pranayama techniques (Nadi Shodhana, Anulom Vilom, Bhramari, Kapalbhati, Uddiyana Bandha). However, `BreathingSession` model only accepts enum values: `['box', '4-7-8', 'wim-hof', 'diaphragmatic']`.

**Impact**: Users retrieve Pranayama from UI, but cannot save sessions with those techniques. API silently rejects valid UI inputs.

**Reproducible Steps**:
```javascript
// User retrieves techniques:
GET /api/breathing/techniques
// Returns: Nadi Shodhana, Anulom Vilom, Bhramari, Kapalbhati, Uddiyana Bandha

// User tries to save session with retrieved technique:
POST /api/breathing/sessions
{ "technique": "Anulom Vilom", "moodBefore": 4, "moodAfter": 5 }
// Returns: 500 error - "Anulom Vilom is not a valid enum value"
```

**Root Cause**: 
- `/server/data/pranayama.js` defines advanced breathing techniques
- `models/BreathingSession.js` defines enum with different technique names
- No mapping between the two data sources

**Fix Strategy**:
1. **Option A**: Update BreathingSession enum to include Pranayama techniques
2. **Option B**: Create a separate endpoint for Pranayama sessions vs BreathingSession
3. **Recommended**: Consolidate breathing data model (Pranayama IS BreathingSession)

---

### 2. **HealthLog Data Structure Mismatch - Stats Calculation Broken**
**Severity**: CRITICAL | **Category**: Data Model

**Description**:
`computeStats()` expects meal data in nested `meals[]` array but tests and naive API usage would store data at top-level (calories, water, protein). This causes dashboard stats to always show 0.

**Impact**: Dashboard stats are non-functional after logs are created without proper nested structure.

**Reproducible Steps**:
```javascript
// User logs food (naive approach):
POST /api/logs/2024-07-01
{ "calories": 2000, "water": 2.5, "weight": 75 }

// Dashboard calls:
GET /api/logs/data/stats
// Returns: { avgCalories: 0, avgWater: 0 }
// Expected: { avgCalories: 2000, avgWater: 2.5 }
```

**Root Cause**:
- `HealthLog` schema stores calories in nested `meals[].calories`, not top-level
- `computeStats()` only checks `meals[]` array, falls back to top-level fields that don't exist
- Logs API doesn't validate structure enforcement

**Data Structure (Current)**:
```javascript
{
  meals: [
    { mealType: 'breakfast', calories: 500, proteinG: 25, ... },
    { mealType: 'lunch', calories: 800, proteinG: 35, ... }
  ],
  waterIntake: 2.5,  // Top-level
  sleepEntry: {
    durationMinutes: 480,
    bedtime: '22:30',
    wakeTime: '06:30'
  }
}
```

**Fix Strategy**:
1. Add API validation to enforce nested structure
2. Create migration for existing logs with top-level fields
3. Add middleware to normalize incoming log data

---

### 3. **Sleep Duration Data Access Pattern - API Confusion**
**Severity**: CRITICAL | **Category**: API Design

**Description**:
Sleep data is stored under nested `sleepEntry.durationMinutes` but naive API clients expect top-level `durationMinutes`. No validation or documentation clarifies this.

**Impact**: Users cannot log sleep without understanding nested structure.

**Reproducible Steps**:
```javascript
// Naive attempt:
POST /api/logs/2024-07-01
{ "durationMinutes": 480 }
// Silently ignored - sleep not recorded

// Correct approach (not intuitive):
POST /api/sleep
{ "durationMinutes": 480 }
// Works - creates proper sleepEntry structure
```

**Root Cause**:
- Sleep has dedicated `/api/sleep` endpoint (correct)
- But generic `/api/logs/:date` has no validation or helpful error for nested structure
- Documentation doesn't clarify sleep vs logs endpoints

**Fix Strategy**:
1. Add validation in logs endpoint to reject top-level sleep fields
2. Return helpful error: "Use POST /api/sleep to log sleep. /api/logs is for meals/workouts."
3. Add API documentation with examples

---

## 🟠 HIGH SEVERITY ISSUES (Breaks Features)

### 4. **Breathing Session Mood Validation Too Strict**
**Severity**: HIGH | **Category**: Data Validation

**Description**:
`BreathingSession` mood fields accept only 1-5, but UI might allow wider ranges or require finer precision.

**Impact**: UI validation logic doesn't match backend validation, causing silent failures.

**Reproducible Steps**:
```javascript
POST /api/breathing/sessions
{ "technique": "box", "moodBefore": 0, "moodAfter": 10 }
// 400: "moodBefore must be between 1 and 5"
```

**Root Cause**: 
- Schema: `moodBefore: { min: 1, max: 5 }`
- No API documentation of constraint
- Inconsistent with 0-10 scale common in health apps

**Fix Strategy**:
1. Document constraint in API response errors
2. Align UI with backend (1-5 scale) or vice versa
3. Consider 0-10 scale for consistency with moodScore/energyScore

---

### 5. **Yoga Style Not Applied to Workout Plans**
**Severity**: HIGH | **Category**: Feature Completeness

**Description**:
User's `yogaStyle` is collected during onboarding but doesn't influence `/api/profile/plan` workout recommendations. All yoga users get the same exercises regardless of style.

**Impact**: Personalization incomplete - users with Hatha preference get Vinyasa routines.

**Reproducible Steps**:
```javascript
// Onboard user with:
{ yogaStyle: 'hatha', workoutPreferences: ['yoga'] }

// Get plan:
GET /api/profile/plan
// Returns workouts, but yogaStyle not applied to selection
// No distinction between hatha/vinyasa/pranayama-only exercises
```

**Root Cause**:
- `exercise-composer.js` has `YOGA_EXERCISES` by style
- `plan-builder.js` doesn't call `getYogaExercises(profile.yogaStyle)`
- Profile completion doesn't validate yogaStyle consistency with workoutPreferences

**Fix Strategy**:
1. Modify `plan-builder.js` to pass `profile.yogaStyle` to exercise selection
2. Add validation: if `workoutPreferences.includes('yoga')`, require `yogaStyle`
3. Test all yoga style combinations in plan generation

---

### 6. **Missing Profile Validation on Onboarding**
**Severity**: HIGH | **Category**: Data Integrity

**Description**:
Onboarding endpoint accepts invalid values (negative age, extreme weights, invalid diet types) without validation.

**Impact**: Dashboard loads with corrupted profile data. Stats calculations fail or produce invalid results.

**Reproducible Steps**:
```javascript
POST /api/profile/onboarding
{
  "age": -5,
  "startWeightKg": 500,
  "goalWeightKg": -100,
  "primaryGoal": "invalid-goal",
  "dietType": "unknown"
}
// 200 OK (should be 400)
// Profile saved with invalid data
```

**Root Cause**:
- No enum validation for `primaryGoal`, `dietType`, `fitnessLevel`
- No range validation for numeric fields (age, weight)
- Profile schema allows wide numeric ranges

**Fix Strategy**:
1. Add `enum` validators to profileSchema for all categorical fields
2. Add `min`/`max` validators: age (1-120), weight (20-300)
3. Validate consistency: `goalWeightKg` vs `startWeightKg` vs `primaryGoal`

---

### 7. **Recipe Data Diet Filtering Incomplete**
**Severity**: HIGH | **Category**: Feature Logic

**Description**:
Meal composer returns recipes without ensuring they match diet preferences across all cuisines. Edge case: some meals may have limited options for specific diet types.

**Impact**: Vegan users might see recipes with dairy despite selecting vegan diet.

**Reproducible Steps**:
```javascript
// All 3 cuisines have recipes for all diet types:
getMeals({ dietType: 'vegan', cuisinePreference: 'south-indian' }, 'breakfast', 'weight-loss', 0, 0)
// ✓ Works for hatha/vinyasa but:

getMeals({ dietType: 'vegan', culturalFoodAvoidances: ['dairy'] }, 'breakfast', ...)
// May return dishes with dairy (avoidances filter is post-facto, not comprehensive)
```

**Root Cause**:
- Meals in files include non-vegan options (dairy, ghee) in veg recipes
- `culturalFoodAvoidances` filter is basic text matching
- No vegan-specific recipe pool in south-indian/continental

**Fix Strategy**:
1. Audit meal files for non-vegan dairy in veg recipes
2. Create vegan-safe pool separate from vegetarian pool
3. Enhance filter to use ingredient taxonomy, not just name matching

---

### 8. **Date Format Inconsistency in Logs API**
**Severity**: HIGH | **Category**: API Design

**Description**:
Some date fields expect `YYYY-MM-DD` strings, others accept Date objects. No consistent validation/formatting across endpoints.

**Impact**: Client code must duplicate date formatting logic. Easy source of off-by-one timezone bugs.

**Reproducible Steps**:
```javascript
// Works:
POST /api/logs/2024-07-01
{ "weight": 75 }

// Might fail depending on timezone:
POST /api/logs
{ "date": new Date('2024-07-01') }

// Confusing behavior:
GET /api/logs/data/weekly-summary
// Queries: date: { $gte: sevenDaysAgo } — compares Date to String
```

**Root Cause**:
- HealthLog schema uses `date: String`
- Queries mix Date and String comparisons
- No DateFormatter utility

**Fix Strategy**:
1. Standardize on ISO string format throughout
2. Add middleware to normalize incoming dates
3. Document date format in API spec
4. Consider using `LocalDate` pattern (YYYY-MM-DD) for server-side

---

## 🟡 MEDIUM SEVERITY ISSUES (UI/UX)

### 9. **Surya Namaskar Rounds Not Personalized by Yoga Style**
**Severity**: MEDIUM | **Category**: UX Completeness

**Description**:
Surya Namaskar rounds vary only by age/fitness, not by yoga style (Hatha might suggest 12 rounds, Vinyasa 8). Users with Vinyasa get same recommendations as Hatha users of same age.

**Impact**: UX feels generic. Advanced Vinyasa users may be under-challenged.

**Reproducible Steps**:
```javascript
getSuryaNamaskarRounds({ age: 30, fitnessLevel: 'very-active', yogaStyle: 'hatha' })
// Returns: 10 rounds

getSuryaNamaskarRounds({ age: 30, fitnessLevel: 'very-active', yogaStyle: 'vinyasa' })
// Also returns: 10 rounds (should be 8-12 for vinyasa)
```

**Root Cause**:
- `getSuryaNamaskarRounds()` ignores `profile.yogaStyle`
- No style-specific adjustment coefficients

**Fix Strategy**:
1. Add style multipliers to SURYA_ROUNDS
2. Update `getSuryaNamaskarRounds()` to apply style-specific ranges

---

### 10. **Empty Profile Fields Don't Prevent Dashboard Load**
**Severity**: MEDIUM | **Category**: Error Handling

**Description**:
Dashboard loads with partial profile data (missing dietType, cuisinePreference, etc.). No warning or guidance to complete profile.

**Impact**: User sees incomplete meal plans, broken stats. Confusing UX with no clear remediation path.

**Reproducible Steps**:
```javascript
// User creates profile with minimal data:
POST /api/profile/onboarding
{ "age": 30, "sex": "male", "primaryGoal": "weight-loss" }

// Dashboard still loads:
GET /api/profile/plan
// Returns plan with defaults, no indication of incomplete profile
// Should: 403 or 302 /profile/complete
```

**Root Cause**:
- `profileComplete` flag doesn't correlate with required fields
- `requireProfile` middleware only checks `profileComplete` boolean
- Profile schema has few required fields

**Fix Strategy**:
1. Define required fields per profile tier (MVP, complete, full)
2. Modify `profileComplete` validation to check required fields
3. Return 302 redirect to `/profile/complete` if incomplete
4. Show profile progress indicator on dashboard

---

## 🔵 LOW SEVERITY ISSUES (Edge Cases)

### 11. **Inline Vitals Not Validated for Consistency**
**Severity**: LOW | **Category**: Data Quality

**Description**:
Weight logged as 300kg, then 70kg next day. Calorie intake 10,000+ kcal. No outlier detection or user confirmation.

**Impact**: Stats calculations produce unrealistic weight loss/gain. Trends become noise.

**Reproducible Steps**:
```javascript
POST /api/logs/2024-07-01 { "weight": 300 }
POST /api/logs/2024-07-02 { "weight": 70 }
// Stats: "Lost 230kg in 1 day" ✓ Recorded (should flag as anomaly)

POST /api/logs/2024-07-01 { "meals": [{ calories: 10000 }, ...] }
// Silently recorded, skews avg calculations
```

**Root Cause**:
- No outlier detection
- No delta validation between consecutive logs
- No confirmation for extreme values

**Fix Strategy**:
1. Add confidence scoring to outliers
2. Return 400 with warning if delta > 5kg between consecutive days
3. Optional user override checkbox for extreme values
4. Server-side flag: `possibleOutlier: true` for analysis

---

## 🧪 Test Coverage Gaps

### Untested Scenarios:
1. **Yoga-only workouts** - Never tested for plan generation
2. **Vegan diet with cultural avoidances** - Intersection not tested
3. **Sleep data with timezone offsets** - Assumes UTC
4. **Breathing session filtering by health conditions** - No negative test
5. **Profile update mid-plan** - Doesn't regenerate recommendations
6. **Concurrent log entries** - Race condition on unique index
7. **Deleted health conditions** - References aren't cleaned up

---

## 📋 Issues by Module

| Module | Issues | Severity |
|--------|--------|----------|
| Breathing | 1 | CRITICAL |
| Logs/Stats | 3 | 2 CRITICAL, 1 HIGH |
| Sleep | 1 | CRITICAL |
| Profile | 2 | 1 HIGH, 1 MEDIUM |
| Yoga/Workouts | 1 | HIGH |
| Recipes | 1 | HIGH |
| Dashboard | 1 | MEDIUM |
| API Design | 1 | LOW |
| **Total** | **11** | **3C, 5H, 2M, 1L** |

---

## 🚀 Recommended Fix Priority

**Week 1 (Critical)**:
1. Breathing technique enum mismatch (#1)
2. HealthLog stats calculation (#2)
3. Sleep data structure (#3)

**Week 2 (High)**:
4. Profile validation (#6)
5. Yoga style application (#5)
6. Recipe filtering edge case (#7)

**Week 3 (Polish)**:
7. Medium/Low issues
8. Test coverage gaps

---

## Appendix: Validation Summary

### Recipe Data
- ✅ All 3 cuisines have all 3 diet types
- ✅ Diet filtering works correctly
- ⚠️ Vegan avoidances not exhaustive

### Yoga Styles
- ✅ All styles return exercises
- ✅ Surya Namaskar rounds vary by age/fitness
- ❌ Yoga style not applied to plan

### Dashboard
- ✅ Loads for onboarded users
- ✅ Handles empty logs gracefully
- ❌ Stats calculation fails without nested structure
- ⚠️ Profile incompleteness doesn't block dashboard

### Sleep Module
- ❌ Top-level durationMinutes doesn't work
- ✅ Bedtime/wakeTime format supported
- ⚠️ Timezone handling not tested

### Breathing
- ❌ Technique enum mismatch
- ✅ Techniques filtered by age/conditions
- ⚠️ Mood range too strict (1-5)

### Grocery
- ✅ INR pricing calculations correct
- ✅ Currency formatting works

### Profile
- ✅ profileComplete flag works
- ❌ Missing field validation
- ⚠️ Yoga style not required for yoga workouts

### API Error Handling
- ⚠️ Invalid dates not rejected
- ⚠️ Out-of-range values not rejected
- ⚠️ Missing required fields not rejected

