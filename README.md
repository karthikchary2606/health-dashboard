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

```bash
npx jest --no-coverage
```

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

*Built by Karthik Chary · Powered by GitHub Copilot*
