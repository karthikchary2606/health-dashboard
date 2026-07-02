# Phase 3 — Functional Fixes

**Branch:** `feature/phase3-functional-fixes`
**Worktree:** `~/.config/superpowers/worktrees/health-dashboard/feature/phase3-functional-fixes`

## Root Cause Summary

| Issue | Root Cause |
|---|---|
| Dashboard broken for existing users (harika) | `profileComplete: false` in DB causes all API routes to return 403. `initAuth()` doesn't check this flag — no redirect to onboarding. User sees broken dashboard. |
| Diet feels generic | Plan IS personalized. But harika's profile has stale/wrong preferences from before fixes. `auth.js` should self-heal `profileComplete` + redirect if incomplete. |
| Recipes empty for north-indian users | Only 25 north-indian + 15 continental recipes. Filtered by cuisine + dietType + meal type = often near-zero. |
| Guidelines useless for healthy users | Condition cards only show for users WITH health conditions. Healthy users see nothing about their goal. |
| Grocery not personalized | `GROCERY_CATEGORIES` ignores `cuisinePreference`. Same list for north-indian vs south-indian users. |
| CI Node 20 deprecation | `actions/checkout@v4` and `actions/setup-node@v4` use Node 20 internally. GitHub deprecated Node 20 runner. |

---

## Task 0 — CI: Upgrade to Node 24 actions (DONE BY CONTROLLER)
Simple 2-line change in `.github/workflows/deploy.yml`.

## Task 1 — Dashboard: Profile incomplete self-heal + redirect

**Files:** `public/js/auth.js`, `routes/auth.js`

### Spec

**`routes/auth.js` — GET `/api/auth/me` (self-heal)**
- After fetching user, if `user.profileComplete === false` AND Tier 1 fields (`primaryGoal`, `age`, `currentWeightKg`, `heightCm`, `dietType`) are ALL present in `user.profile`, then:
  - Auto-set `profileComplete: true` in DB: `User.findByIdAndUpdate(user._id, { profileComplete: true })`
  - Set `user.profileComplete = true` on the returned object
- Return `{ name, email, role, profileComplete, profile: { ... } }` — include `profileComplete` in response

**`public/js/auth.js` — `initAuth()` redirect**
- After `currentUser = data`, check: `if (currentUser.profileComplete === false && window.location.pathname === '/')`
  - Show toast-style banner: "⚠️ Please complete your profile to unlock all features" with a CTA button linking to `/onboarding.html`
  - Do NOT hard redirect (user might want to browse)
- If `currentUser.profileComplete === false`, set a `window._profileIncomplete = true` flag

**`public/js/planCache.js` — graceful 403**
- When `apiFetch('/api/profile/plan')` returns `ok: false`, check if `window._profileIncomplete` is true
- If yes, log a console info message (not error) and return null without console.error

### Tests
- Unit test for self-heal logic in `routes/auth.js` (mock user with Tier 1 fields present but `profileComplete: false`)
- Verify GET `/api/auth/me` response includes `profileComplete` field
- Verify `initAuth()` sets `window._profileIncomplete` when `profileComplete: false`

---

## Task 2 — Grocery: Cuisine-personalized lists

**File:** `server/engine/plan-builder.js`

### Spec

Replace the flat `GROCERY_CATEGORIES` constant (keyed by dietType only) with a two-level lookup: `getCuisineGrocery(dietType, cuisinePreference)`.

**New `CUISINE_GROCERY` structure:**
```
CUISINE_GROCERY = {
  'south-indian': {
    base: ['idli rice', 'urad dal', 'tamarind', 'coconut', 'curry leaves', 'mustard seeds', 'sambar powder', 'rasam powder', 'red chillies', 'rice flour'],
    nonVeg: ['fish (pomfret/rohu)', 'prawns', 'chicken'],
    veg: ['raw banana', 'drumstick (murungakkai)', 'ash gourd', 'kootu vegetables'],
  },
  'north-indian': {
    base: ['whole wheat atta', 'ghee', 'garam masala', 'coriander powder', 'jeera', 'kasuri methi', 'amchur', 'anardana'],
    nonVeg: ['chicken', 'mutton (optional)', 'eggs'],
    veg: ['paneer', 'rajma', 'chole', 'sarson saag (seasonal)'],
  },
  'continental': {
    base: ['extra virgin olive oil', 'pasta (penne/spaghetti)', 'sourdough bread', 'mixed herbs', 'balsamic vinegar', 'dijon mustard'],
    nonVeg: ['salmon fillets', 'chicken breast', 'eggs'],
    veg: ['mozzarella', 'cherry tomatoes', 'zucchini', 'aubergine', 'mixed salad greens'],
  },
  'mixed': {
    base: ['brown rice', 'whole wheat atta', 'oats', 'mixed dal'],
    nonVeg: ['chicken breast 500g/week', 'fish 2-3 portions/week', 'eggs 4-5/week'],
    veg: ['paneer 100g/day', 'greek yogurt', 'tofu'],
  },
}
```

**`getCuisineGrocery(dietType, cuisinePreference)`:**
- Pick cuisine block from `CUISINE_GROCERY[cuisinePreference] || CUISINE_GROCERY['mixed']`
- Build items list: always include `base`; include `nonVeg` unless dietType is 'vegetarian', 'vegan', or 'eggetarian'; include `veg` always
- Add standard `Vegetables`, `Fruits`, `Fats & Oils` categories that already exist (keep those generic)
- Replace only the cuisine-specific categories

**`buildGroceryList(profile, goal)` changes:**
- Call `getCuisineGrocery(profile.dietType || 'non-vegetarian', profile.cuisinePreference || 'mixed')` to get cuisine items
- Merge into the standard grocery structure: cuisine-specific protein/grains replace the generic ones
- Filter out any item that appears in `profile.foodAllergies` or `profile.culturalFoodAvoidances` (case-insensitive substring match)

### Tests
- Test `getCuisineGrocery('non-vegetarian', 'south-indian')` → includes south-indian base items + fish/chicken
- Test `getCuisineGrocery('vegetarian', 'north-indian')` → includes paneer/rajma, no chicken
- Test `getCuisineGrocery('vegan', 'continental')` → includes olive oil/pasta, no salmon/mozzarella
- Test `buildGroceryList` with `foodAllergies: ['prawns']` → prawns excluded from south-indian list

---

## Task 3 — Recipes: Expand north-indian and continental coverage

**File:** `public/js/recipes.js`

### Spec

Add recipes to the `RECIPES` array to achieve better coverage for non-south-indian users.

**Target counts after additions:**
- North-indian: 25 → 45 (add 20 more)
- Continental: 15 → 30 (add 15 more)

**Recipe object format (copy from existing recipes in RECIPES array — maintain exact same fields):**
```js
{
  id: 'ni-...',    // unique kebab-case id
  name: '...',
  cuisine: 'north-indian',
  dietType: ['vegetarian'],   // or ['non-vegetarian'] or ['vegetarian','eggetarian'] etc
  category: 'breakfast',      // breakfast|lunch|dinner|snack|smoothie
  prepTime: '...',
  calories: 000,
  protein: 00,
  carbs: 00,
  fat: 00,
  ingredients: ['...'],
  steps: ['...'],
  tags: ['...'],
  benefits: '...',
  image: '🥘'                 // appropriate emoji
}
```

**North-indian additions (20 recipes):**
- Breakfast: Dal Paratha, Aloo Puri, Sooji Halwa, Egg Bhurji with Roti, Missi Roti, Chole Bhature, Sarson Saag with Makki Roti
- Lunch: Rajma Chawal, Dal Makhani with Roti, Palak Paneer, Butter Chicken with Naan, Kadhi Pakora with Rice, Chicken Biryani (Lucknawi)
- Dinner: Matar Paneer, Shahi Paneer, Chicken Tikka Masala with Roti, Dal Tadka with Jeera Rice, Aloo Gobi, Baingan Bharta
- Snack: Chana Chaat, Dahi Bhalle

**Continental additions (15 recipes):**
- Breakfast: Avocado Toast, Eggs Benedict, Overnight Oats, Smoothie Bowl, French Toast, Greek Yogurt Parfait
- Lunch: Caesar Salad with Grilled Chicken, Pasta Primavera, Caprese Salad, Grilled Salmon with Vegetables, Chicken Wrap, Minestrone Soup
- Dinner: Spaghetti Bolognese, Grilled Chicken with Roasted Vegetables, Baked Salmon with Asparagus
- Snack: Hummus with Veggie Sticks, Protein Smoothie

All new recipes must have realistic macros, 3-5 ingredients, 2-4 steps, and appropriate tags.

### Tests
- Count total `RECIPES` with `cuisine: 'north-indian'` ≥ 45
- Count total `RECIPES` with `cuisine: 'continental'` ≥ 30
- All new recipes have required fields: `id`, `name`, `cuisine`, `dietType`, `category`, `calories`, `protein`

---

## Task 4 — Guidelines: Goal-specific content for all users

**File:** `public/js/guidelines.js`

### Spec

Add a new section at the top of the guidelines page showing goal-specific wellness tips. This shows for ALL users regardless of health conditions.

**New `GOAL_GUIDELINES` map:**
```js
const GOAL_GUIDELINES = {
  'weight-loss': {
    title: '🔥 Weight Loss Strategy',
    tips: [
      'Maintain a 300–500 kcal daily deficit — crash diets spike cortisol and kill muscle.',
      'Eat protein with every meal (30-40g target) — preserves muscle during fat loss.',
      'Cardio after strength training burns more fat (glycogen depleted).',
      'Sleep 7-8h — ghrelin spikes on less sleep, killing satiety.',
      'Weigh yourself weekly (same day, same time) — not daily.',
    ],
    metric: (p) => p.goalWeightKg ? `Target: ${p.goalWeightKg}kg (currently ${p.currentWeightKg}kg — ${Math.abs(p.currentWeightKg - p.goalWeightKg).toFixed(1)}kg to go)` : null,
  },
  'muscle-gain': {
    title: '💪 Muscle Building Strategy',
    tips: [
      'Protein target: 1.6–2.2g per kg of bodyweight daily.',
      'Progressive overload is the only driver of muscle growth — add load or reps weekly.',
      'Eat 200-300 kcal surplus — more than this builds fat, not muscle.',
      'Sleep 8h minimum — 70% of growth hormone released during deep sleep.',
      'Pre-workout meal: complex carbs + protein 1.5-2h before training.',
    ],
    metric: (p) => p.currentWeightKg ? `Daily protein target: ${Math.round((p.currentWeightKg || 70) * 1.8)}g` : null,
  },
  'maintenance': {
    title: '⚖️ Maintenance Strategy',
    tips: [
      'Caloric maintenance: eat = burn. Track for 2 weeks to find your true TDEE.',
      'Vary training stimulus every 4-6 weeks to prevent adaptation.',
      'Prioritise sleep and recovery — maintenance is about sustainability.',
      'Recomp is possible at maintenance: lose fat + gain muscle simultaneously.',
      'Monthly check-in: assess energy, strength, and body composition.',
    ],
    metric: (p) => p.dailyCalorieTarget ? `Your maintenance calories: ~${p.dailyCalorieTarget} kcal/day` : null,
  },
  'general-fitness': {
    title: '🏃 General Fitness Strategy',
    tips: [
      'Consistency > intensity — 3 sessions per week beats sporadic intense sessions.',
      'Mix cardio + resistance training for optimal health markers.',
      'Hydration: minimum 8 glasses/day, more on training days.',
      '10,000 steps daily is a proven baseline for cardiovascular health.',
      'Flexibility work (10 min stretching) prevents injury and improves performance.',
    ],
    metric: (p) => null,
  },
};
```

**New `renderGoalGuidelines(profile)` function:**
- Reads `profile.primaryGoal`
- Gets matching entry from `GOAL_GUIDELINES`
- Renders into `#goalGuidelines` element (add this ID to the HTML section)
- Shows: colored title, 5 bullet tips, metric line (if applicable)
- Fallback: if no primaryGoal or no matching entry, show general fitness guidelines

**`buildGuidelines(profile)` changes:**
- Call `renderGoalGuidelines(profile)` at the START (before condition cards)

**`public/index.html` changes:**
- Add `<div id="goalGuidelines" style="margin-bottom:16px"></div>` at the top of the guidelines section (before `#conditionCards`)

### Tests
- `renderGoalGuidelines` with weight-loss profile renders tips with "deficit" mention
- `renderGoalGuidelines` with muscle-gain profile renders protein target calculation
- `renderGoalGuidelines` with null primaryGoal renders general-fitness fallback
- `#goalGuidelines` element has content after `buildGuidelines()` runs

---

## Success Criteria

- [ ] CI pipeline runs without Node 20 deprecation warnings
- [ ] harika@kaha.online (or any user with profileComplete:false) sees profile completion banner instead of broken dashboard
- [ ] North-indian users see 45+ recipes; continental users see 30+
- [ ] Grocery list for south-indian non-veg user includes coconut, curry leaves, fish
- [ ] Grocery list for north-indian veg user includes atta, ghee, paneer, no chicken
- [ ] Guidelines section shows goal-specific tips for healthy users with no health conditions
- [ ] All 318+ tests still pass
- [ ] Pipeline deploys successfully to production
