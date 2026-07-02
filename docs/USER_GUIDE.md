# Praana — Complete User Guide

> **Praana** (Sanskrit: *life force*) is a personalised AI-powered health dashboard for managing diet, workouts, weight, hydration, sleep, and mindfulness — all in one place.
> Live at: **https://health.kaha.online**

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Navigation](#2-navigation)
3. [Dashboard](#3-dashboard)
4. [Diet Plan](#4-diet-plan)
5. [Recipes](#5-recipes)
6. [Workouts](#6-workouts)
7. [Cardio Plan](#7-cardio-plan)
8. [Progress Tracking](#8-progress-tracking)
9. [Health Guidelines](#9-health-guidelines)
10. [Grocery List](#10-grocery-list)
11. [Breathing & Pranayama](#11-breathing--pranayama)
12. [Sleep Tracker](#12-sleep-tracker)
13. [Settings & Profile](#13-settings--profile)
14. [Full Use-Case Scenarios](#14-full-use-case-scenarios)
15. [FAQ / Troubleshooting](#15-faq--troubleshooting)

---

## 1. Getting Started

### Registration
1. Visit **https://health.kaha.online/login.html**
2. Click **"Create account"**
3. Enter your name, email, and password (min 8 chars, must include uppercase + number)
4. After registering, you are redirected to **Onboarding**

### Onboarding (Profile Setup)
Onboarding collects all data needed to generate your personalised 6-month plan:

| Field | Why it matters |
|-------|---------------|
| Age, Sex, Height, Current weight | BMR calculation, macro targets |
| Primary goal | Chooses plan template: Weight Loss / Muscle Gain / Maintenance / General Fitness |
| Diet type | Vegetarian / Vegan / Eggetarian / Non-Vegetarian — **strictly respected, never overridden** |
| Cuisine preference | South Indian / North Indian / Continental / Mixed |
| Health conditions | Hypertension, diabetes, PCOS, back pain, etc. — adjusts meals and exercises |
| Medications | Used for supplement timing in guidelines |
| Fitness level | Sedentary → Very Active — sets workout intensity |
| Workout days per week | 3–7 days |
| Equipment available | Gym / Home / Bodyweight |
| Yoga style | Hatha / Vinyasa / Pranayama-only / None |
| Food list | Foods you commonly eat (filtered by diet type — vegetarians won't see non-veg items) |
| Water goal | Auto-calculated from weight (body weight × 30ml) |
| Review reminder | 30 / 60 / 90 days — prompts periodic plan refresh |

After completing onboarding, your **6-month AI plan** is generated automatically.

---

## 2. Navigation

### Mobile (< 768px)
- **Bottom tab bar** — 5 tabs: Home · Diet · Workouts · Progress · Settings
- **Hamburger (☰)** — top-left button opens the full sidebar drawer with ALL sections including Recipes, Cardio, Guidelines, Grocery, Breathing, Sleep
- **Sign Out** — visible at the bottom of the hamburger drawer

### Desktop (≥ 768px)
- **Left sidebar** (240px, always visible) — all sections listed
- **Sign Out** button — at the bottom of the sidebar

### Section Map

| Nav label | Section |
|-----------|---------|
| Home / Dashboard | Today's overview, Quick Log |
| Diet | 6-month personalised meal plan |
| Recipes | Personalised recipe cards |
| Workouts | 6-month workout programme |
| Cardio | 6-month cardio phases |
| Progress | Weight, nutrition, mood trends |
| Guidelines | Health rules, seed tracker, supplements |
| Grocery | Weekly shopping list |
| Breathing | Guided breathing sessions + Pranayama |
| Sleep | Sleep journal (separate page) |
| Settings | Edit profile, update plan |

---

## 3. Dashboard

The dashboard is your **daily control centre**.

### Topbar
- **Date picker** — change the date to view or log data for any past/future day
- **Weight input** — logs today's weight (seeds from your profile weight; overridden by today's logged value)

### Hero Cards
- **Calorie goal** — daily kcal target computed from your BMR + goal
- **Macros** — protein (g) · carbs (g) · fat (g) targets

### Stat Chips (4 metrics)
| Chip | What it shows |
|------|--------------|
| Calories | Daily kcal target |
| Water Target | Goal in litres (auto from weight × 30ml) |
| Checklist | Tasks completed today (e.g., 3/8) |
| (4th) | Varies by profile |

### Daily Timeline / Checklist
- Auto-generated from your plan for today's workout day
- Check off tasks as you complete them
- Saved per date — tomorrow's checklist resets

### Water Tracker
- 4 cups (each = 500ml by default, target = your waterGoalL)
- Tap a cup to mark it filled
- **Quick Log** also has +250ml / +500ml buttons

### Mood & Energy
- Rate mood (1–5) and energy (1–5) each day
- Feeds into the Progress chart

### Quick Log Panel
| Item | Action |
|------|--------|
| Weight | Type kg and it auto-saves + updates BMI |
| Water | Tap +250ml or +500ml buttons |
| Workout | Toggle "Mark Done ✓" |

### Profile Completion Banner
- Shows if your profile is < 100% complete
- Click **"Complete →"** to add missing fields

---

## 4. Diet Plan

A **6-month, 4-week rolling meal plan** generated from your profile.

### Structure
- 6 months × 4 weeks × 7 days × 4 meals (Breakfast, Lunch, Snack, Dinner)
- Meals rotate deterministically based on your userId — same day always gets the same meal

### Using the Diet Plan
1. Navigate to **Diet** section
2. Use the **day tabs** (Mon–Sun) to switch days
3. Each day shows:
   - **Day theme** badge (e.g., "High Protein Day")
   - 4 meal cards with name, time, and macro pills (Cal · P · C · F)
   - **Total bar** — daily totals
4. Tap any meal card to expand for serving size / notes

### Diet Filters
- **Diet type** is locked to what you set in profile
- Vegetarians only see vegetarian meals (guaranteed — foodList cannot override this)
- Vegan users see dairy-free options
- Cultural avoidances (e.g., beef for Hindus) are excluded

---

## 5. Recipes

Personalised recipes scored by affinity to your food list.

### Using Recipes
1. Navigate to **Recipes** (hamburger → Recipes on mobile)
2. Use **filter pills** (All / Breakfast / Lunch / Dinner / Snack) to filter
3. Each recipe card shows:
   - Name, prep time, tags (veg/non-veg, cuisine)
   - Macro summary
4. Tap **"Show recipe"** to expand ingredients + method + pro tip

---

## 6. Workouts

A **6-month progressive workout plan** tailored to your fitness level, equipment, and goal.

### Structure
- 6 months × 4 weeks
- Each week has a schedule of training days
- Each day: muscle group focus + list of exercises with sets/reps/rest

### Exercise Detail
Each exercise card shows:
- Exercise name + category (Push / Pull / Core / Compound / Cardio)
- Sets × Reps or Duration
- Form notes + modifications for health conditions (e.g., no heavy squat for back pain)
- **Spine-safe badge** 🔴 on exercises modified for spinal conditions

### Workout Modes
Detected automatically from your profile:
- **Gym** — barbell, machine exercises
- **Home** — dumbbell, resistance band
- **Bodyweight** — no equipment

### Logging Workouts
Use the **Quick Log** on the dashboard → "Mark Done ✓" to log workout completion for the day.

---

## 7. Cardio Plan

A **6-phase progressive cardio programme** (one phase per month).

| Phase | Focus |
|-------|-------|
| 1 | Foundation — Zone 2, easy effort |
| 2 | Base building |
| 3 | Aerobic development |
| 4 | Threshold work |
| 5 | Peak conditioning |
| 6 | Maintenance / taper |

Each phase card shows:
- Weekly sessions (Day, Session type, Duration, Intensity)
- Heart rate zones (bpm targets)
- Phase focus note

---

## 8. Progress Tracking

Visualises your health data over time.

### Charts available
| Chart | Data source |
|-------|------------|
| Weight trend | Daily weight logs |
| BMI trajectory | Calculated from weight + height |
| Daily nutrition avg | Calorie target vs profile |
| Sleep trend (30 days) | Sleep log entries |
| Mood & Energy (30 days) | Daily mood/energy scores |

### Streak Chips
- 🏆 **Workout streak** — consecutive days with workout marked done
- 💧 **Water streak** — consecutive days water goal met
- ⚖️ **Weight change** — delta from start weight to latest log

### Stats Cards
- Average sleep duration
- Average mood / energy
- Days logged this month

---

## 9. Health Guidelines

Personalised health rules based on your conditions.

### Sections
- **Seed & Nut Allocation** — 30g daily cap across 8 seeds (helps manage weight without surplus)
- **Medication & Supplement Timing** — when to take each supplement/medication relative to meals
- **Foods Recommended vs Avoided** — personalised by health conditions
- **Condition-specific notes** — e.g., PCOS guidelines, hypertension sodium limits, diabetes GI guidance

---

## 10. Grocery List

Auto-generated weekly grocery list from your meal plan.

### Features
- Grouped by category (Grains · Vegetables · Proteins · Dairy · Snacks)
- Each item has a checkbox — tick off as you shop
- **Add custom item** — type a name and add it to any category
- Items reset each week (Monday)
- Filtered by diet type + cuisine preference

---

## 11. Breathing & Pranayama

### Guided Breathing Sessions
1. Navigate to **Breathing**
2. Choose a technique (Box Breathing, 4-7-8, Deep Belly, etc.)
3. Tap **Start Session**
4. The animated circle guides you through Inhale → Hold → Exhale → Hold cycles
5. Session completion asks: "How do you feel now?" (mood score)

### Pranayama
- Personalised for your age and health conditions
- Listed below the breathing session cards
- Includes technique name, duration, and benefit notes

### Session History
- Saved automatically after each session
- Shows technique, duration, cycles completed

---

## 12. Sleep Tracker

Available at **/sleep.html** (separate page — tap Sleep in sidebar).

### Logging Sleep
1. Click **"Log Sleep"** or the + button
2. Enter:
   - Bedtime and wake time
   - Sleep quality (1–5)
   - Notes (optional)
3. Duration calculated automatically

### Sleep Stats
| Stat | What it shows |
|------|--------------|
| Current streak | Consecutive nights logged |
| Avg duration | Rolling 30-day average |
| Goal nights | Nights this week ≥ your target duration |
| Quality avg | Average quality score |

### Sleep History
- Calendar-style or list view
- Each entry shows bed/wake time, duration, quality

---

## 13. Settings & Profile

Available at **/settings.html** (tap Settings in nav).

### What you can update
- Personal stats: age, weight, height, sex
- Health conditions and medications
- Dietary preferences (diet type, cuisine, food allergies, cultural avoidances)
- Workout preferences (days/week, time, equipment, yoga style)
- Water goal
- Review reminder frequency
- Password change

### Triggering a Plan Refresh
After updating your profile, your **6-month plan regenerates automatically** the next time you load it (cache is invalidated by `planVersion`).

### Periodic Review
When your review reminder is due (30/60/90 days), a banner appears on the dashboard. Clicking it opens a review form where you log:
- Current weight
- How the plan has been going
- Any changes needed

---

## 14. Full Use-Case Scenarios

### Scenario 1 — New User, Vegetarian, Weight Loss Goal

1. Register → complete onboarding with `dietType: vegetarian`, `goal: weight-loss`
2. App generates 6-month weight-loss plan — all meals are 100% vegetarian
3. Each morning: open Dashboard → check today's timeline
4. Log weight in topbar → today's BMI updates
5. Tap water cups as you drink through the day
6. After workout: Quick Log → "Mark Done ✓"
7. End of day: rate Mood and Energy (1–5)
8. Check Diet section → follow today's meal plan
9. Shop from Grocery section every Sunday
10. After 30 days: review banner appears → log updated weight → plan recalibrates

---

### Scenario 2 — Existing User, Non-Veg, Muscle Gain

1. Dashboard loads → calorie goal shows 2,800 kcal (muscle gain surplus)
2. Workouts section → follow today's chest/back programme
3. Diet section → high-protein meals including chicken, fish, eggs
4. Guidelines → see seed allocation + supplement timing (e.g., creatine post-workout)
5. Progress → watch weight trend going up week-on-week
6. After 6 weeks → streak chips show 🏆 Workout Streak: 42 days

---

### Scenario 3 — PCOS / Hormonal Health (Female)

1. Onboarding: select health condition `PCOS`
2. Diet plan automatically avoids high-GI foods, includes anti-inflammatory options
3. Guidelines section shows PCOS-specific food rules (seed cycling, low-dairy, etc.)
4. Cardio plan: moderate intensity only, no high-impact until Phase 3
5. Sleep tracker: log sleep quality — PCOS often correlates with poor sleep
6. Progress: mood/energy chart helps identify hormonal cycles

---

### Scenario 4 — Hypertension + Diabetes Management

1. Onboarding: select `hypertension` + `type 2 diabetes`
2. Diet meals avoid high-sodium and high-GI foods
3. Guidelines show sodium limit (< 2g/day) and GI-ranked foods
4. Recipes filter to low-GI, heart-healthy options
5. Medication timing card shows when to take metformin / antihypertensives relative to meals
6. Water goal auto-calculated — stays high (2.5–3L) for kidney health

---

### Scenario 5 — Home Workout, No Equipment

1. Onboarding: equipment = `bodyweight`, fitnessLevel = `lightly-active`
2. Workout plan uses only bodyweight exercises: push-ups, squats, planks
3. Surya Namaskar included daily (yoga style if selected)
4. Cardio plan: brisk walk, stair climbing, cycling — no gym required
5. Quick Log → mark workout done from dashboard

---

### Scenario 6 — Back Pain (Spinal Condition)

1. Onboarding: health condition = `back pain / herniated disc`
2. All exercises flagged with 🔴 Spine-safe badge where modified
3. No heavy deadlifts, barbell squats — replaced with goblet squats, Romanian deadlifts with light weight
4. Yoga style: Hatha (gentle) auto-selected if not set
5. Breathing section: pranayama techniques that strengthen core without spine stress

---

## 15. FAQ / Troubleshooting

**Q: Why does my diet plan show the wrong cuisine?**
A: Go to Settings → update Cuisine Preference → your plan refreshes automatically.

**Q: How do I change my diet from Vegetarian to Non-Vegetarian?**
A: Settings → Diet Type → update → plan regenerates. Your food checklist will then show meat/fish options.

**Q: The app shows my weight as the same every day.**
A: You need to log your weight daily via the topbar input or Quick Log panel. It does not pull weight automatically from any wearable.

**Q: I completed onboarding but the plan isn't showing.**
A: Navigate to any section (Diet, Workouts). The plan generates on first load. If it fails, refresh the page.

**Q: Water cups reset every day — is that correct?**
A: Yes. Hydration resets daily at midnight. Yesterday's logs are preserved in the Progress section.

**Q: How do I sign out?**
A: Desktop — bottom of the left sidebar. Mobile — open the hamburger menu (☰) → scroll to bottom → "Sign Out".

**Q: The breathing session timer seems off.**
A: The session timer uses your device clock. If your device is slow, the animation may lag but the count is correct.

**Q: I don't see the Admin Panel.**
A: Admin panel is only visible to accounts with `role: admin`. Contact Karthik to be granted admin access.

**Q: My review reminder keeps showing.**
A: After completing the review, tap "Done for now" to dismiss. It will return in 30/60/90 days based on your setting.

---

*Last updated: 2026-07-03 | App version: Praana v1.0 | Maintained by Karthik*
