# 🏋️ Health Engine — Multi-User Health Dashboard

A full-stack personalized health management app. Each user gets a **unique plan** built from their profile: goals, cuisine, diet type, health conditions, age, fitness level, religion, and language community.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Setup
```bash
git clone https://github.com/karthikchary2606/health-dashboard
cd health-dashboard
npm install
cp .env.example .env   # add MONGODB_URI and JWT_SECRET
node server.js
```
Open http://localhost:3000

---

## 👤 First-Time User Flow

### Step 1 — Register
Go to `/register.html`, create your account. An admin must approve your account before you can log in (or approve yourself via the admin panel at `/admin.html`).

### Step 2 — Complete Onboarding (8 steps)
After first login you'll be redirected to `/onboarding.html`:

| Step | What you set |
|------|-------------|
| 1 | Body stats — age, height, current weight, goal weight |
| 2 | Primary goal — weight loss / muscle gain / maintenance / general fitness |
| 3 | Fitness level — sedentary / lightly active / moderately active / very active |
| 4 | Diet type — vegetarian / vegan / eggetarian / non-vegetarian |
| 5 | Cuisine preference — south-indian / north-indian / continental / mixed |
| 6 | Health conditions + medications |
| 7 | Religion + language community (Telugu, Tamil, Kannada, Malayalam) + cultural food avoidances |
| 8 | Review + Submit |

After submission, your **personalized plan is generated immediately**.

### Step 3 — Complete Your Profile (profile-complete.html)
Click "Complete Profile" on the dashboard (shown when < 100%). Fill in:
- Food checklist (select items you eat — community-specific preselection)
- Workout preferences, equipment available, days/week, time of day
- Yoga style preference
- Review reminder frequency

Once all fields are filled, your profile reaches **100% completion**.

---

## 📱 App Sections

| Section | URL | What you get |
|---------|-----|-------------|
| 🏠 Dashboard | `/` | Today's timeline, quick-log panel, water tracker, mood/energy check-in |
| 🥗 Diet Plan | Diet tab | 6-month personalized meal plan (breakfast/lunch/snack/dinner) based on your cuisine + diet type |
| 🍳 Recipes | Recipes tab | Filtered recipes matching your food list and cultural avoidances |
| 💪 Workout | Workout tab | Age-appropriate exercises, Surya Namaskar rounds personalized to your age/fitness |
| 🏃 Cardio | Cardio tab | Phase-based cardio plan with heart rate zones |
| 😴 Sleep | Sleep tab | Sleep tracker with quality and duration logging |
| 📈 Progress | Progress tab | Weight chart, macro nutrition, sleep trend, mood/energy trends |
| 🛡️ Guidelines | Guidelines tab | Active health condition cards + community-specific nutritional tips |
| 🧘 Breathing | Breathing tab | Pranayama techniques filtered by your age and health conditions |
| 🛒 Grocery | `/api/grocery/week` | Weekly grocery list with quantities and INR prices |

---

## ⚡ Quick Log (Dashboard)

The **Quick Log** panel on the dashboard lets you log:
- **Weight** — enter kg and tap Log
- **Water** — tap +250ml or +500ml buttons
- **Workout** — tap "Mark Done ✓", then optionally expand to log individual exercises (name, sets, reps, weight)

### Dashboard v2 incremental rollout (`dashboard_v2`)
- Default experience remains **v1** for compatibility.
- Opt in to v2 UX with `/?dashboard_v2=1`.
- v2 keeps the same stable `GET /api/dashboard/overview` contract and only backfills profile completion when needed.
- Timeline and sleep cards now show explicit empty/error prompts with retry/CTA actions in v2.

---

## 🕉️ Pranayama (Breathing Tab)

6 techniques filtered to your age and active health conditions:
- Nadi Shodhana, Anulom Vilom, Bhramari (all ages)
- Kapalabhati (age 18–55, no hypertension/heart disease)
- Bhastrika (age 18–45, no hypertension)
- Ujjayi (all ages)

Each technique shows benefits, rounds, duration, and step-by-step instructions.

---

## 🛒 Grocery List

`GET /api/grocery/week` returns your weekly grocery list with:
- **Category** (Grains & Legumes, Vegetables, Fruits, Dairy & Protein, Fats & Oils, Spices)
- **Quantity** (suggested weekly purchase: "1 kg", "500 g", "1 dozen", etc.)
- **Estimated Price (INR)** (approximate Indian retail price)

Mark items purchased/removed via `PATCH /api/grocery/week/item`. Add custom items via `POST /api/grocery/week/custom`.

---

## 🌍 Cultural Personalization

When you select your **language community** in onboarding, the app personalizes:
- **Food checklist** pre-selects community-specific ingredients (e.g., Pesarattu, Gongura for Telugu)
- **Guidelines page** shows community nutritional tips (e.g., ragi for Telugu/Kannada, horse gram for Tamil)
- **Cultural food avoidances** filter out avoided ingredients from your diet plan and recipes

---

## 👑 Admin Panel

Go to `/admin.html` (requires `role: admin`). To promote yourself to admin:
```bash
node scripts/seed-admin.js
```
Enter your registered email — it promotes the account to admin with full access.

---

## 🔧 Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose (Atlas M0 free) |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript (SPA) |
| Auth | JWT (cookie-based) |
| Charts | Chart.js |
| Tests | Jest + Supertest + MongoMemoryServer |

---

## 🧪 Running Tests

### Automated Tests
```bash
npm test
```
Expected: 291 tests passing, 25 test suites, 0 failures

### Module-by-Module Testing Guide

See **TESTING_GUIDE.md** for comprehensive end-to-end testing with real users. Below is quick reference for each module.

---

## 📋 Module-by-Module Testing Checklist

### 1️⃣ Dashboard Module
**URL**: `https://health.kaha.online` (after login)

**What to test**:
- [ ] Page loads in <1 second (no stuck "Loading..." state)
- [ ] Greeting shows correct time of day (morning/afternoon/evening)
- [ ] Profile completion % displays (0-100%)
- [ ] Daily stats show non-zero values:
  - `avgCalories` > 0 ✅
  - `avgWater` > 0 ✅
  - `avgSleep` > 0 ✅
  - `avgMood` > 0 ✅

**Quick Log Panel** (dashboard):
- [ ] Water +250ml button works
- [ ] Water +500ml button works
- [ ] Weight input logs correctly
- [ ] Workout checkbox logs completion
- [ ] All data persists after refresh

**curl test** (after creating user and logging data):
```bash
curl http://localhost:3000/api/logs/data/stats \
  -H "Cookie: connect.sid=YOUR_SESSION"
```
Expected: Stats object with non-zero values

---

### 2️⃣ Diet Plan Module
**URL**: `https://health.kaha.online/` → Diet Tab

**What to test**:
- [ ] Diet plan loads without errors
- [ ] Meals show for all 6 months
- [ ] Macro targets match user's goal:
  - Weight-loss: Calorie deficit (~2200 kcal) ✅
  - Muscle-gain: Calorie surplus (~2800 kcal) ✅
  - Maintenance: No adjustment (~2500 kcal) ✅
- [ ] Meals match diet type:
  - Vegetarian: 0 meat, 0 eggs
  - Vegan: 0 dairy (ghee, paneer, milk, yogurt), 0 eggs, 0 meat
  - Non-vegetarian: All options available
- [ ] Cuisine preference respected (meals from chosen cuisine)

**curl test**:
```bash
curl http://localhost:3000/api/profile/plan \
  -H "Cookie: connect.sid=YOUR_SESSION" | jq '.diet'
```
Expected: `{ meals: [...], macroCals: {...}, calorieTarget: ... }`

---

### 3️⃣ Recipes Module
**URL**: `https://health.kaha.online/` → Recipes Tab

**What to test**:
- [ ] Recipes load for selected diet type
- [ ] No cross-contamination:
  - Vegetarian users: 0 meat recipes
  - Vegan users: 0 dairy + 0 meat + 0 eggs
  - Non-vegetarian users: All options

**curl tests**:
```bash
# Vegetarian recipes
curl "http://localhost:3000/api/recipes?dietType=vegetarian" | jq '.[] | .name'

# Vegan recipes (should NOT contain dairy keywords)
curl "http://localhost:3000/api/recipes?dietType=vegan" | jq '.[] | .name'

# Non-vegetarian recipes (should include meat)
curl "http://localhost:3000/api/recipes?dietType=non-vegetarian" | jq '.[] | .name'
```

**Verify in database**:
- ✅ No vegan recipe contains: ghee, butter, paneer, milk, curd, yogurt, cream
- ✅ No vegetarian recipe contains: meat, chicken, fish, eggs
- ✅ Eggetarian recipes contain eggs but no meat

---

### 4️⃣ Workout Module
**URL**: `https://health.kaha.online/` → Workout Tab

**What to test**:

**For Gym Users**:
- [ ] Shows strength exercises (no yoga)
- [ ] Shows cardio exercises
- [ ] Exercise names are appropriate (bench press, squats, running, etc.)

**For Yoga Users**:
- [ ] Shows yoga poses only (no gym)
- [ ] Surya Namaskar rounds vary by style:
  - Hatha: 8 rounds (0.8x multiplier)
  - Vinyasa: 12 rounds (1.2x multiplier)
  - Pranayama-only: 0 rounds (skip Surya)

**For Hybrid Users (Gym + Yoga)**:
- [ ] Shows both gym exercises AND yoga
- [ ] Yoga portion respects style preference
- [ ] Surya Namaskar correctly personalized

**curl test**:
```bash
curl http://localhost:3000/api/profile/plan \
  -H "Cookie: connect.sid=YOUR_SESSION" | jq '.workouts'
```

**Verification**:
```bash
# Check Surya Namaskar rounds for different yoga styles
curl ... | jq '.workouts[] | select(.type == "yoga") | .exercises[] | select(.name | contains("Surya"))'
```

---

### 5️⃣ Grocery Module
**URL**: `https://health.kaha.online/` → Grocery Tab (or `/api/grocery/week`)

**What to test**:
- [ ] Grocery list loads
- [ ] All items have prices in INR
- [ ] Quantities are reasonable (kg, g, dozen, etc.)
- [ ] Ingredients match diet type:
  - Vegetarian: 0 meat items
  - Vegan: 0 dairy, 0 meat, 0 eggs
  - Non-vegetarian: Includes meat options
- [ ] Can toggle "Purchased" status
- [ ] Prices vary by goal:
  - Weight-loss: Different from muscle-gain (different portions)
  - Muscle-gain: Higher protein items

**curl test**:
```bash
curl http://localhost:3000/api/grocery/week \
  -H "Cookie: connect.sid=YOUR_SESSION" | jq '.'
```

Expected response:
```json
{
  "items": [
    {"category": "Grains & Legumes", "item": "Rice", "quantity": "2 kg", "priceINR": 120},
    ...
  ]
}
```

---

### 6️⃣ Sleep Module
**URL**: `https://health.kaha.online/` → Sleep Tab

**What to test**:
- [ ] Sleep tab loads
- [ ] Can log sleep via correct nested format
- [ ] Flat format rejected with helpful error
- [ ] Sleep stats calculate correctly

**Test: Correct Format (Should Work) ✅**
```bash
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
```
Expected: 200 OK

**Test: Wrong Format (Should Reject) ❌**
```bash
curl -X PATCH http://localhost:3000/api/logs/2024-07-02 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{"durationMinutes": 480}'
```
Expected: 400 error "Sleep duration must be logged via nested sleepEntry..."

**Test: Stats Calculation**
```bash
curl http://localhost:3000/api/logs/data/stats \
  -H "Cookie: connect.sid=YOUR_SESSION" | jq '.avgSleepMinutes'
```
Expected: Non-zero value (should reflect logged sleep)

---

### 7️⃣ Breathing Module
**URL**: `https://health.kaha.online/` → Breathing Tab

**What to test**:
- [ ] Breathing techniques load
- [ ] All 10 techniques available:
  - Western: box, 4-7-8, wim-hof, diaphragmatic
  - Pranayama: nadi-shodhana, anulom-vilom, bhramari, kapalabhati, bhastrika, ujjayi
- [ ] Can start session with any technique
- [ ] Mood before/after must be 1-5 range
- [ ] Invalid mood (0 or 6) rejected with clear error

**Test: List Techniques**
```bash
curl http://localhost:3000/api/breathing/techniques \
  -H "Cookie: connect.sid=YOUR_SESSION" | jq '.[]'
```
Expected: 10 techniques listed

**Test: Valid Session ✅**
```bash
curl -X POST http://localhost:3000/api/breathing/sessions \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "technique": "nadi-shodhana",
    "durationSeconds": 300,
    "moodBefore": 2,
    "moodAfter": 4
  }'
```
Expected: 200 OK

**Test: Invalid Mood ❌**
```bash
curl -X POST http://localhost:3000/api/breathing/sessions \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "technique": "box",
    "moodBefore": 0,
    "moodAfter": 6
  }'
```
Expected: 400 error "moodBefore must be between 1 and 5"

---

### 8️⃣ Food Checklist Module
**URL**: `https://health.kaha.online/` → Food Checklist (or `/api/profile/food-checklist`)

**What to test**:
- [ ] Checklist loads with language-specific items
- [ ] Telugu user gets Telugu items (idli, dosa, sambar, etc.)
- [ ] Tamil user gets Tamil items (murukku, adhirasam, etc.)
- [ ] Hindi user gets Hindi items (paratha, dal makhani, etc.)
- [ ] Can check/uncheck items
- [ ] Selection persists

**curl test**:
```bash
curl http://localhost:3000/api/profile/food-checklist \
  -H "Cookie: connect.sid=YOUR_SESSION" | jq '.items[] | {name, checked}'
```

Expected: Items in user's language community

---

### 🔐 Data Validation Testing

**Test: Invalid Age ❌**
```bash
curl -X POST http://localhost:3000/api/profile/onboarding \
  -H "Content-Type: application/json" \
  -d '{"age": -5, "currentWeightKg": 80, ...}'
```
Expected: 400 "age must be between 1 and 120"

**Test: Invalid Weight ❌**
```bash
curl -X POST http://localhost:3000/api/profile/onboarding \
  -H "Content-Type: application/json" \
  -d '{"currentWeightKg": 500, ...}'
```
Expected: 400 "weight must be between 20 and 300 kg"

**Test: Invalid Goal ❌**
```bash
curl -X POST http://localhost:3000/api/profile/onboarding \
  -H "Content-Type: application/json" \
  -d '{"primaryGoal": "invalid-goal", ...}'
```
Expected: 400 "primaryGoal must be one of: weight-loss, muscle-gain, maintenance, general-fitness"

**Test: Weight-Loss Goal Consistency ❌**
```bash
curl -X POST http://localhost:3000/api/profile/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "primaryGoal": "weight-loss",
    "currentWeightKg": 80,
    "goalWeightKg": 90,
    ...
  }'
```
Expected: 400 "For weight-loss, goalWeightKg must be less than currentWeightKg"

---

### 🎯 Multi-Profile Comparison Testing

Create 3 test users with different preferences and verify they get different plans:

**Profile 1: Vegetarian, Weight-Loss, Male, Telugu, Gym**
```bash
# Expected diet meals: all vegetarian (0 meat, 0 eggs)
# Expected calories: ~2200 (deficit for weight-loss)
# Expected workout: Gym (strength + cardio, 0 yoga)
# Expected food: Telugu items
```

**Profile 2: Non-Vegetarian, Muscle-Gain, Female, Tamil, Yoga (Vinyasa)**
```bash
# Expected diet meals: includes meat, fish, eggs
# Expected calories: ~2800 (surplus for muscle-gain)
# Expected workout: Yoga only (vinyasa style, flowing)
# Expected Surya Namaskar: 12 rounds
# Expected food: Tamil items
```

**Profile 3: Vegan, Maintenance, Non-Binary, Hindi, Hybrid (Hatha)**
```bash
# Expected diet meals: all vegan (0 meat, 0 dairy, 0 eggs)
# Expected calories: ~2500 (no adjustment for maintenance)
# Expected workout: Gym + Yoga (hatha style, static)
# Expected Surya Namaskar: 8 rounds
# Expected food: Hindi items
```

**Verification**:
```bash
# Profile 1 and 2 should have DIFFERENT calorie targets
curl .../profile/1/plan | jq '.diet.calorieTarget'  # ~2200
curl .../profile/2/plan | jq '.diet.calorieTarget'  # ~2800

# Profile 2 and 3 should have DIFFERENT Surya rounds
curl .../profile/2/plan | jq '.workouts[] | select(.type=="yoga") | .exercises[] | select(.name | contains("Surya")) | .reps'  # 12
curl .../profile/3/plan | jq '.workouts[] | select(.type=="yoga") | .exercises[] | select(.name | contains("Surya")) | .reps'  # 8
```

---

## 📊 Testing Checklist Summary

**Before considering the app ready for production**:

- [ ] All 8 modules load without errors
- [ ] Dashboard stats are non-zero
- [ ] Diet filters by type (no vegan→dairy, no vegetarian→meat)
- [ ] Yoga styles produce different workouts (hatha vs vinyasa)
- [ ] Invalid data rejected with clear errors
- [ ] All 3+ test profiles work end-to-end
- [ ] Multi-language support verified
- [ ] Sleep logging works with correct format
- [ ] All 10 breathing techniques available
- [ ] All 291 automated tests passing

**Status**: ✅ All tests passing (see test results in TESTING_COMPLETE.md)

---

## 🗂️ Project Structure

```
health-dashboard/
├── models/           # Mongoose schemas (User, HealthLog, ProfileSnapshot, etc.)
├── routes/           # Express routers (profile, logs, auth, breathing, grocery, etc.)
├── server/
│   ├── engine/       # Plan builders (meal-composer, exercise-composer)
│   ├── templates/    # Goal-specific plan templates (weight-loss, muscle-gain, etc.)
│   ├── meals/        # Cuisine meal pools (south-indian, north-indian, continental)
│   └── data/         # Static data (pranayama, food-checklist)
├── lib/              # computeStats, etc.
├── middleware/       # authenticate, requireProfile
├── public/           # Frontend (HTML, CSS, JS)
│   └── js/           # diet.js, workout.js, progress.js, guidelines.js, breathing.js, etc.
├── tests/            # Jest test suites
└── scripts/          # Migration and seed scripts
```

---

## 📊 Profile Completion

Your profile completion % is based on 11 key fields:

**Phase 1 (Onboarding):** primaryGoal, dietType, age, currentWeightKg, heightCm, fitnessLevel

**Phase 2 (Profile Complete page):** cuisinePreference, workoutPreferences, foodList, religion, languageCommunity

Fill all 11 to reach **100%**. The dashboard shows a completion card with direct link to `/profile-complete.html` when < 100%.

---

## 📚 Testing Resources & Documentation

### Quick Start Testing
- **2 min**: Run `npm test` → 291 tests should pass
- **10 min**: Create one test profile and verify dashboard loads
- **30 min**: Follow **TESTING_GUIDE.md** for comprehensive E2E testing

### Comprehensive Guides
| Document | Purpose | Read Time |
|----------|---------|-----------|
| **TESTING_GUIDE.md** | Step-by-step testing for all modules with 3 profiles | 30 min |
| **TESTING_COMPLETE.md** | Full E2E test results (327 tests documented) | 10 min |
| **BUG_FIX_SUMMARY.md** | What was broken and how it was fixed | 10 min |
| **FIXES_DEPLOYED.md** | Technical details of all 11 bug fixes | 20 min |
| **DEPLOYMENT_READY.md** | Quick deployment action guide | 5 min |
| **E2E_TESTING_REPORT.md** | Detailed phase-by-phase testing results | 15 min |
| **ISSUES_SUMMARY.txt** | Complete inventory of all 11 bugs | 15 min |

### What's Been Tested ✅
- ✅ **291 automated tests** passing (25 test suites)
- ✅ **36 E2E tests** across all 8 modules
- ✅ **3 diverse user profiles** verified end-to-end
- ✅ **11 bugs fixed** and verified
- ✅ **0 regressions** detected
- ✅ **327 total tests** = 100% pass rate

### Production Status
- ✅ **LIVE** at https://health.kaha.online
- ✅ **Domain responsive** (HTTP/1.1 200 OK)
- ✅ **All modules functional**
- ✅ **Ready for users**

---

*Built by Karthik Chary · Powered by GitHub Copilot*
