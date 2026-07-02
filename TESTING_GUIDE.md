# Health Dashboard - Comprehensive Testing Guide

This guide walks you through testing all features of the health dashboard application end-to-end with multiple user profiles.

## Why This Matters

The application is built on personalization. If the personalization engine doesn't deliver different plans to different users, the app fails. This testing guide ensures:

1. **Different profiles get different plans** (not cookie-cutter responses)
2. **All modules work for all user types** (diet, workouts, sleep, breathing, grocery)
3. **Data integrity is maintained** (no invalid values accepted)
4. **Multi-language support works** (Telugu, Tamil, Hindi, Kannada)

---

## Part 1: Create Test User Profiles

### Quick Setup with curl

Replace `https://health.kaha.online` with your domain. For local testing, use `http://localhost:3000`.

#### **Profile 1: Vegetarian, Weight Loss, Male, Telugu, Gym**

```bash
# Phase 1 Onboarding
curl -X POST http://localhost:3000/api/profile/onboarding \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "primaryGoal": "weight-loss",
    "age": 32,
    "currentWeightKg": 85,
    "goalWeightKg": 75,
    "heightCm": 175,
    "dietType": "vegetarian",
    "sex": "male",
    "fitnessLevel": "intermediate"
  }'

# Phase 2 Preferences
curl -X PATCH http://localhost:3000/api/profile/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "workoutPreferences": ["gym", "cardio"],
    "cuisinePreference": "south-indian",
    "foodList": ["vegetables", "dal", "rice", "roti"],
    "religion": "hindu",
    "languageCommunity": "telugu"
  }'

# Expected result: Profile marked 100% complete
```

#### **Profile 2: Non-Vegetarian, Muscle Gain, Female, Tamil, Yoga**

```bash
# Phase 1 Onboarding
curl -X POST http://localhost:3000/api/profile/onboarding \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "primaryGoal": "muscle-gain",
    "age": 28,
    "currentWeightKg": 62,
    "goalWeightKg": 68,
    "heightCm": 165,
    "dietType": "non-vegetarian",
    "sex": "female",
    "fitnessLevel": "advanced"
  }'

# Phase 2 Preferences  
curl -X PATCH http://localhost:3000/api/profile/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "workoutPreferences": ["yoga"],
    "yogaStyle": "vinyasa",
    "cuisinePreference": "south-indian",
    "foodList": ["chicken", "fish", "eggs", "vegetables"],
    "religion": "christian",
    "languageCommunity": "tamil"
  }'

# Expected result: Profile marked 100% complete, includes Vinyasa yoga
```

#### **Profile 3: Vegan, Maintenance, Non-Binary, Hindi, Hybrid**

```bash
# Phase 1 Onboarding
curl -X POST http://localhost:3000/api/profile/onboarding \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "primaryGoal": "maintenance",
    "age": 42,
    "currentWeightKg": 72,
    "goalWeightKg": 72,
    "heightCm": 170,
    "dietType": "vegan",
    "sex": "other",
    "fitnessLevel": "beginner"
  }'

# Phase 2 Preferences
curl -X PATCH http://localhost:3000/api/profile/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "workoutPreferences": ["gym", "yoga"],
    "yogaStyle": "hatha",
    "cuisinePreference": "north-indian",
    "foodList": ["vegetables", "fruits", "nuts", "seeds"],
    "religion": "agnostic",
    "languageCommunity": "hindi"
  }'

# Expected result: Profile marked 100% complete, hybrid workouts with Hatha yoga
```

---

## Part 2: Feature Testing Checklist

### **Module 1: Dashboard**
*(Endpoint: GET /)*

**Test steps for EACH profile:**

1. Login with the profile
2. Navigate to dashboard (`/`)
3. Check "Daily Overview" section:
   - ✅ Greeting shows correctly (morning/afternoon/evening based on time)
   - ✅ User's name and primary goal displayed
   - ✅ Profile completion percentage shown
   - ✅ Water intake goal matches profile
   - ✅ Calorie target matches goal (deficit for weight-loss, surplus for muscle-gain)

**Expected differences:**
- Profile 1 (weight-loss): Calorie target ~2200 (deficit)
- Profile 2 (muscle-gain): Calorie target ~2800 (surplus)
- Profile 3 (maintenance): Calorie target ~2500 (neutral)

**Failure scenarios to test:**
- Dashboard doesn't load → Bug in rendering
- Stats show all zeros → Bug in computeStats
- Greeting stuck on "Loading..." → Event listener issue

---

### **Module 2: Diet Plan**
*(Endpoint: GET /api/profile/plan)*

**Test steps for EACH profile:**

1. Go to diet/meal plan section
2. Get meal suggestions for a day
3. Verify macro targets:
   - Profile 1 (weight-loss): 30% protein / 45% carbs / 25% fat
   - Profile 2 (muscle-gain): 35% protein / 45% carbs / 20% fat
   - Profile 3 (maintenance): 30% protein / 45% carbs / 25% fat

4. Verify meals match dietary preferences:
   ```bash
   curl http://localhost:3000/api/profile/plan -H "Cookie: connect.sid=YOUR_SESSION" | jq '.diet.meals'
   ```

5. **Verify diet type filtering:**
   - Profile 1 (vegetarian): Should NOT see meat, eggs
   - Profile 2 (non-vegetarian): Should see all types
   - Profile 3 (vegan): Should NOT see dairy (ghee, paneer, milk, yogurt), eggs, or meat

**Test specific recipes:**
```bash
# Check if vegan recipes contain dairy keywords
curl http://localhost:3000/api/profile/plan | jq '.diet.meals[] | select(.dietType | contains("vegan"))'
```

**Failure scenarios:**
- Vegetarians see meat recipes → Recipe data not filtered correctly
- Vegans see dairy → Vegan filter incomplete

---

### **Module 3: Recipes Endpoint**
*(Endpoint: GET /api/recipes?dietType=X&mealType=Y)*

Test filtering for each diet type:

```bash
# Test vegetarian filtering
curl "http://localhost:3000/api/recipes?dietType=vegetarian" | jq '.[] | .name, .dietType'

# Test vegan filtering
curl "http://localhost:3000/api/recipes?dietType=vegan" | jq '.[] | .name, .dietType'

# Test non-vegetarian filtering
curl "http://localhost:3000/api/recipes?dietType=non-vegetarian" | jq '.[] | .name, .dietType'

# Test eggetarian filtering
curl "http://localhost:3000/api/recipes?dietType=eggetarian" | jq '.[] | .name, .dietType'
```

**Verify no cross-contamination:**
- Vegetarian recipes don't include non-vegetarian items
- Vegan recipes don't include dairy (ghee, paneer, milk, yogurt) or eggs
- Each recipe returned matches the requested dietType

---

### **Module 4: Workout Plan**
*(Endpoint: GET /api/profile/plan)*

**Test steps for EACH profile:**

1. Get workout plan:
   ```bash
   curl http://localhost:3000/api/profile/plan | jq '.workouts'
   ```

2. Verify workout types match preferences:
   - Profile 1 (gym): Should have strength + cardio exercises
   - Profile 2 (yoga): Should have yoga sequences (vinyasa style)
   - Profile 3 (hybrid): Should have mix of gym and yoga (hatha)

3. **Verify Surya Namaskar personalization:**
   ```bash
   curl http://localhost:3000/api/profile/plan | jq '.workouts[] | select(.type == "yoga") | .exercises[] | select(.name | contains("Surya"))'
   ```

   Expected:
   - Profile 2 (vinyasa): ~12 rounds
   - Profile 3 (hatha): ~10 rounds (0.8x multiplier)
   - Check: hatha user should have FEWER rounds than vinyasa

4. **Verify Surya Namaskar NOT present for non-yoga:**
   - Profile 1 (gym/cardio): Should NOT see Surya Namaskar

**Failure scenarios:**
- Gym users see yoga exercises → Profile preference not applied
- All yoga users get same exercises → Yoga style not used
- Yoga-only users don't get Surya Namaskar → Bug in plan generation

---

### **Module 5: Grocery List**
*(Endpoint: GET /api/profile/plan)*

**Test steps:**

1. Get grocery list:
   ```bash
   curl http://localhost:3000/api/profile/plan | jq '.groceryList'
   ```

2. Verify ingredients match diet type:
   - Profile 1 (vegetarian): No meat, fish
   - Profile 2 (non-vegetarian): Includes meat items
   - Profile 3 (vegan): No dairy, meat, eggs

3. Verify pricing is in INR (Indian Rupees):
   ```bash
   curl http://localhost:3000/api/profile/plan | jq '.groceryList[] | {item: .name, price: .priceINR}'
   ```

4. Verify quantities match meal plan

**Failure scenarios:**
- Grocery list prices are wrong → Calculation issue
- Non-vegetarian items appear for vegans → Filtering broken

---

### **Module 6: Sleep Module**
*(Endpoint: POST /api/sleep or PATCH /api/logs/:date)*

**Test logging sleep:**

```bash
# Correct nested format (works)
curl -X PATCH http://localhost:3000/api/logs/2024-07-02 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "sleepEntry": {
      "bedtime": "23:00",
      "wakeTime": "07:00",
      "durationMinutes": 480,
      "quality": 4
    }
  }'

# Incorrect flat format (should reject with helpful error)
curl -X PATCH http://localhost:3000/api/logs/2024-07-02 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "durationMinutes": 480
  }'
# Expected: 400 error "Sleep duration must be logged via nested sleepEntry..."
```

**Test sleep stats:**
```bash
curl http://localhost:3000/api/logs/data/stats | jq '.avgSleepMinutes'
# Should reflect logged sleep, not 0
```

---

### **Module 7: Breathing Techniques**
*(Endpoint: GET /api/breathing/techniques & POST /api/breathing/sessions)*

**List available techniques:**
```bash
curl http://localhost:3000/api/breathing/techniques | jq '.[]'
```

Expected: Should include classical breathing techniques like Nadi Shodhana, Anulom Vilom, Bhramari, etc.

**Test all technique types:**

```bash
# Test Western technique (box breathing)
curl -X POST http://localhost:3000/api/breathing/sessions \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "technique": "box",
    "durationSeconds": 300,
    "moodBefore": 2,
    "moodAfter": 4
  }'

# Test Pranayama technique (should work now)
curl -X POST http://localhost:3000/api/breathing/sessions \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "technique": "nadi-shodhana",
    "durationSeconds": 300,
    "moodBefore": 2,
    "moodAfter": 4
  }'

# Test invalid mood (should reject 0 and 6)
curl -X POST http://localhost:3000/api/breathing/sessions \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "technique": "box",
    "moodBefore": 0,
    "moodAfter": 6
  }'
# Expected: 400 error "moodBefore must be between 1 and 5"
```

---

### **Module 8: Food Checklist**
*(Endpoint: GET /api/profile/food-checklist)*

**Test language-specific items:**

```bash
# Profile 1 (Telugu)
curl http://localhost:3000/api/profile/food-checklist | jq '.items[] | select(.name | contains("telugu"))'

# Profile 2 (Tamil)
curl http://localhost:3000/api/profile/food-checklist | jq '.items[] | select(.name | contains("tamil"))'

# Profile 3 (Hindi)
curl http://localhost:3000/api/profile/food-checklist | jq '.items[] | select(.name | contains("hindi"))'
```

Verify:
- Telugu profile gets South Indian items (idli, dosa, etc.)
- Tamil profile gets Tamil items (sambar, chutney, etc.)
- Hindi profile gets North Indian items (paratha, dal makhani, etc.)

---

## Part 3: Data Validation Testing

### **Test Invalid Profile Values**

All should return 400 errors:

```bash
# Invalid age
curl -X POST http://localhost:3000/api/profile/onboarding \
  -d '{"age": -5, ...}' 
# Expected: 400 "age must be between 1 and 120"

# Invalid weight
curl -X POST http://localhost:3000/api/profile/onboarding \
  -d '{"currentWeightKg": 500, ...}' 
# Expected: 400 "weight must be between 20 and 300 kg"

# Invalid goal type
curl -X POST http://localhost:3000/api/profile/onboarding \
  -d '{"primaryGoal": "invalid-goal", ...}'
# Expected: 400 "primaryGoal must be one of: weight-loss, muscle-gain, maintenance, general-fitness"

# Invalid diet type
curl -X POST http://localhost:3000/api/profile/onboarding \
  -d '{"dietType": "unknown", ...}'
# Expected: 400 "dietType must be one of: vegetarian, vegan, eggetarian, non-vegetarian"

# Goal/weight mismatch (weight-loss but goal > start)
curl -X POST http://localhost:3000/api/profile/onboarding \
  -d '{
    "primaryGoal": "weight-loss",
    "currentWeightKg": 80,
    "goalWeightKg": 90,
    ...
  }'
# Expected: 400 "For weight-loss, goalWeightKg must be less than currentWeightKg"
```

---

### **Test Outlier Detection**

Log extreme values and verify warnings:

```bash
# Extreme weight change
curl -X PATCH http://localhost:3000/api/logs/2024-07-02 \
  -H "Content-Type: application/json" \
  -d '{"weight": 300}'

# Expected: 200 OK with warning:
# {
#   "saved": true,
#   "outlierDetected": true,
#   "outlierType": "weight-delta",
#   "message": "Weight change of 230kg in one day. Please verify."
# }

# Extreme calorie intake
curl -X PATCH http://localhost:3000/api/logs/2024-07-02 \
  -d '{
    "meals": [
      {"calories": 3000, ...},
      {"calories": 4000, ...},
      {"calories": 3500, ...}
    ]
  }'
# Expected: warning if total > 10,000 kcal
```

---

## Part 4: Multi-User Comparison Testing

**Create scenarios where profiles SHOULD have different results:**

### Scenario 1: Same goal, different diet types

Create two weight-loss profiles:
- User A: vegetarian
- User B: non-vegetarian

```bash
# Get both meal plans
curl http://localhost:3000/api/profile/plan?userId=A | jq '.diet.meals[].name'
curl http://localhost:3000/api/profile/plan?userId=B | jq '.diet.meals[].name'

# Verify DIFFERENCE in recipes:
# User A should have MORE vegetable-based meals
# User B should have MEAT-BASED options User A does not
```

### Scenario 2: Same diet, different goals

Create two vegetarian profiles:
- User C: weight-loss goal
- User D: muscle-gain goal

```bash
# Get both plans
curl http://localhost:3000/api/profile/plan?userId=C | jq '.diet.macroCals'
curl http://localhost:3000/api/profile/plan?userId=D | jq '.diet.macroCals'

# Verify DIFFERENCE in calories:
# User C: calorie deficit (~2200 kcal)
# User D: calorie surplus (~2800 kcal)

# Protein macros should be different:
# User C: 30% protein
# User D: 35% protein
```

### Scenario 3: Yoga style personalization

Create two yoga profiles:
- User E: hatha (beginner-friendly)
- User F: vinyasa (advanced, flowing)

```bash
# Get both workout plans
curl http://localhost:3000/api/profile/plan?userId=E | jq '.workouts[] | select(.type == "yoga") | .exercises[].name'
curl http://localhost:3000/api/profile/plan?userId=F | jq '.workouts[] | select(.type == "yoga") | .exercises[].name'

# Verify Surya Namaskar rounds different:
curl http://localhost:3000/api/profile/plan?userId=E | jq '.workouts[] | select(.type == "yoga") | .exercises[] | select(.name | contains("Surya")) | .reps'
# Should be ~10

curl http://localhost:3000/api/profile/plan?userId=F | jq '.workouts[] | select(.type == "yoga") | .exercises[] | select(.name | contains("Surya")) | .reps'
# Should be ~12 (1.2x multiplier for vinyasa)
```

---

## Part 5: End-to-End User Journey

Follow a complete user flow for ONE profile:

1. **Day 1: Signup & Onboarding**
   - Create account
   - Fill Phase 1 profile (goal, weight, diet, fitness)
   - Fill Phase 2 preferences (workouts, cuisine, language)
   - Verify profile is 100% complete

2. **Day 2: Log Health Data**
   - Log breakfast, lunch, dinner with correct meal structure
   - Log workout completion
   - Log sleep with nested format
   - Log water intake
   - Check dashboard stats update correctly

3. **Day 3: Use Features**
   - View meal recommendations (should match diet type)
   - View workout plan (should match preferences)
   - Start breathing session (should accept technique)
   - View grocery list (should match cuisine + diet)
   - Review sleep trends

4. **Day 4: Verify Data**
   - Check stats calculation:
     - avgCalories ≠ 0
     - avgWater ≠ 0
     - avgSleepMinutes ≠ 0
   - Verify no invalid data accepted

---

## Part 6: Regression Testing

After each change, run these checks:

```bash
# 1. Test all profiles still load
for profile in {1..3}; do
  curl http://localhost:3000/api/profile/$profile | jq -e '.primaryGoal' && echo "Profile $profile OK"
done

# 2. Test all plans generate without error
for profile in {1..3}; do
  curl http://localhost:3000/api/profile/$profile/plan | jq -e '.diet' && echo "Diet plan $profile OK"
done

# 3. Verify tests still pass
npm test 2>&1 | grep "passed\|failed"

# 4. Check no 500 errors in logs
tail -100 logs/app.log | grep "500" && echo "ERRORS FOUND" || echo "No 500 errors"
```

---

## Part 7: Checklist for Production Readiness

Before deploying to production, verify:

- [ ] **All 3 test profiles created successfully**
- [ ] **Dashboard loads without "Loading..." stuck state**
- [ ] **Stats show non-zero values** (avgCalories, avgWater, avgSleepMinutes)
- [ ] **Diet filters work correctly** (vegetarians don't see meat, vegans don't see dairy)
- [ ] **Yoga styles produce different plans** (hatha vs vinyasa)
- [ ] **Invalid data rejected** (negative age, impossible weights)
- [ ] **All modules accessible** (diet, workouts, sleep, breathing, grocery, checklist)
- [ ] **Multi-language support works** (Telugu, Tamil, Hindi, Kannada food items appear)
- [ ] **Sleep logging uses nested format** (top-level format rejected with helpful error)
- [ ] **Breathing techniques include Pranayama** (not just Western techniques)
- [ ] **Outlier detection works** (warns about impossible values)
- [ ] **All tests pass** (npm test = 291 passing, 0 failing)
- [ ] **No regressions** (changes don't break existing features)

---

## Quick Command Reference

```bash
# Get all stats for logged user
curl http://localhost:3000/api/logs/data/stats

# Get current user profile
curl http://localhost:3000/api/profile

# Get complete personalized plan
curl http://localhost:3000/api/profile/plan | jq '.'

# List all available techniques
curl http://localhost:3000/api/breathing/techniques

# Get food checklist (language-specific)
curl http://localhost:3000/api/profile/food-checklist

# Test API health
curl http://localhost:3000/health

# View recent logs
curl http://localhost:3000/api/logs/data/weight-history
curl http://localhost:3000/api/logs/data/sleep-trend
curl http://localhost:3000/api/logs/data/mood-trend
```

---

## Troubleshooting Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Loading..." stuck on dashboard | Event listener not firing | Check browser console for errors, verify DOMContentLoaded listener exists |
| Stats all zeros | Logs not in nested format | Verify meals saved as `{meals: [{mealType, calories, ...}]}` not flat |
| Vegetarians seeing meat | Diet filter broken | Check if recipes have all 4 diet types incorrectly |
| Yoga user doesn't get Surya | Plan builder skipping yoga | Verify yogaStyle passed to exercise composer |
| Profile won't complete | Missing required fields | Check Tier 1 fields: primaryGoal, age, weight, height, dietType |
| API returns 500 error | Data validation failed | Check error message, likely invalid enum value or range |

---

## When to Consider App Ready for Production

✅ **All 11 bugs fixed and tests passing**
✅ **All 3 test profiles work end-to-end**
✅ **Dashboard loads, stats calculate, plans personalize**
✅ **Multi-language support verified**
✅ **Invalid data rejected gracefully**
✅ **Performance acceptable** (API responses < 1 second)
✅ **No console errors in browser**

**You are now ready to invite real users.**

