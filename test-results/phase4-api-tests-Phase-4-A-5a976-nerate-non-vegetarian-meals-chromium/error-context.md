# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase4-api-tests.spec.js >> Phase 4: API-Based Validation >> Phase 4.1: Vegetarian + Chicken/Eggs should generate non-vegetarian meals
- Location: tests/e2e/phase4-api-tests.spec.js:89:7

# Error details

```
TypeError: foodChecklistResponse.ok is not a function
```

# Test source

```ts
  24  |       headers: { 'Content-Type': 'application/json' },
  25  |       body: JSON.stringify({
  26  |         email,
  27  |         password: 'Password@123',
  28  |         name: 'Test User',
  29  |       }),
  30  |     });
  31  |     return response;
  32  |   }
  33  | 
  34  |   // Helper: Complete onboarding
  35  |   async function completeOnboarding(email, preferences) {
  36  |     const response = await fetch(`${baseURL}/api/profile/onboarding`, {
  37  |       method: 'POST',
  38  |       headers: {
  39  |         'Content-Type': 'application/json',
  40  |         Cookie: authCookie,
  41  |       },
  42  |       body: JSON.stringify({
  43  |         age: preferences.age || 30,
  44  |         heightCm: preferences.heightCm || 170,
  45  |         currentWeightKg: preferences.currentWeightKg || 75,
  46  |         goalWeightKg: preferences.goalWeightKg || 70,
  47  |         primaryGoal: preferences.goal || 'maintenance',
  48  |         fitnessLevel: preferences.fitnessLevel || 'moderately-active',
  49  |         dietType: preferences.dietType || 'vegetarian',
  50  |         cuisinePreference: preferences.cuisine || 'south-indian',
  51  |         religion: preferences.religion || 'hindu',
  52  |         languageCommunity: preferences.language || 'telugu',
  53  |       }),
  54  |     });
  55  |     return response;
  56  |   }
  57  | 
  58  |   // Helper: Update food checklist
  59  |   async function updateFoodChecklist(foodList) {
  60  |     const response = await fetch(`${baseURL}/api/profile/food-checklist`, {
  61  |       method: 'PATCH',
  62  |       headers: {
  63  |         'Content-Type': 'application/json',
  64  |         Cookie: authCookie,
  65  |       },
  66  |       body: JSON.stringify({ foodList }),
  67  |     });
  68  |     return response;
  69  |   }
  70  | 
  71  |   // Helper: Complete profile with workout preferences
  72  |   async function completeProfileSettings() {
  73  |     const response = await fetch(`${baseURL}/api/profile`, {
  74  |       method: 'PATCH',
  75  |       headers: {
  76  |         'Content-Type': 'application/json',
  77  |         Cookie: authCookie,
  78  |       },
  79  |       body: JSON.stringify({
  80  |         workoutMode: 'hybrid',
  81  |         yogaStyle: 'hatha',
  82  |         workoutDaysPerWeek: 5,
  83  |         cuisinePreference: 'south-indian',
  84  |       }),
  85  |     });
  86  |     return response;
  87  |   }
  88  | 
  89  |   test('Phase 4.1: Vegetarian + Chicken/Eggs should generate non-vegetarian meals', async ({
  90  |     page,
  91  |   }) => {
  92  |     const email = `veg-chicken-${Date.now()}@kaha.online`;
  93  | 
  94  |     // Register and onboard
  95  |     await registerUser(email);
  96  | 
  97  |     // Get auth cookie by logging in
  98  |     const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
  99  |       data: {
  100 |         email,
  101 |         password: 'Password@123',
  102 |       },
  103 |     });
  104 |     const setCookie = loginResponse.headers()['set-cookie'];
  105 |     authCookie = setCookie ? setCookie.split(';')[0] : '';
  106 | 
  107 |     // Complete onboarding
  108 |     await completeOnboarding(email, {
  109 |       age: 28,
  110 |       dietType: 'vegetarian',
  111 |       goal: 'maintenance',
  112 |     });
  113 | 
  114 |     // Update food checklist: include chicken and eggs
  115 |     const foodChecklistResponse = await updateFoodChecklist([
  116 |       'idli',
  117 |       'dosa',
  118 |       'Chicken',
  119 |       'Eggs',
  120 |       'sambar',
  121 |       'rasam',
  122 |     ]);
  123 | 
> 124 |     expect(foodChecklistResponse.ok()).toBeTruthy();
      |                                  ^ TypeError: foodChecklistResponse.ok is not a function
  125 | 
  126 |     // Complete profile settings
  127 |     await completeProfileSettings();
  128 | 
  129 |     // Fetch plan via API
  130 |     const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
  131 |       headers: { Cookie: authCookie },
  132 |     });
  133 | 
  134 |     expect(planResponse.ok()).toBeTruthy();
  135 | 
  136 |     const plan = await planResponse.json();
  137 | 
  138 |     // Validate: Plan should have meals
  139 |     expect(plan.diet).toBeDefined();
  140 |     expect(plan.diet.meals).toBeDefined();
  141 |     expect(plan.diet.meals.length).toBeGreaterThan(0);
  142 | 
  143 |     // Count meals containing chicken or egg keywords
  144 |     const nonVegMeals = plan.diet.meals.filter((meal) =>
  145 |       /chicken|egg|fish|meat|mutton/i.test(meal.name || ''),
  146 |     );
  147 | 
  148 |     console.log(
  149 |       `Vegetarian + Chicken/Eggs user: Found ${nonVegMeals.length} non-veg meals out of ${plan.diet.meals.length}`,
  150 |     );
  151 | 
  152 |     // Should have at least some non-veg meals (effective diet upgrade worked)
  153 |     expect(nonVegMeals.length).toBeGreaterThan(0);
  154 |   });
  155 | 
  156 |   test('Phase 4.2: Strict Vegan should exclude all dairy products', async ({ page }) => {
  157 |     const email = `strict-vegan-${Date.now()}@kaha.online`;
  158 | 
  159 |     // Register and onboard
  160 |     await registerUser(email);
  161 | 
  162 |     // Get auth cookie
  163 |     const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
  164 |       data: {
  165 |         email,
  166 |         password: 'Password@123',
  167 |       },
  168 |     });
  169 |     const setCookie = loginResponse.headers()['set-cookie'];
  170 |     authCookie = setCookie ? setCookie.split(';')[0] : '';
  171 | 
  172 |     // Complete onboarding as vegan
  173 |     await completeOnboarding(email, {
  174 |       age: 32,
  175 |       dietType: 'vegan',
  176 |       goal: 'weight-loss',
  177 |     });
  178 | 
  179 |     // Update food checklist: only vegan items
  180 |     await updateFoodChecklist(['spinach', 'broccoli', 'rice', 'lentils', 'beans']);
  181 | 
  182 |     // Complete profile settings
  183 |     await completeProfileSettings();
  184 | 
  185 |     // Fetch plan via API
  186 |     const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
  187 |       headers: { Cookie: authCookie },
  188 |     });
  189 | 
  190 |     expect(planResponse.ok()).toBeTruthy();
  191 | 
  192 |     const plan = await planResponse.json();
  193 | 
  194 |     // Validate: No dairy in vegan meals
  195 |     const dairyMeals = plan.diet.meals.filter((meal) =>
  196 |       /milk|ghee|paneer|butter|curd|yogurt|dairy|cheese|cream/i.test(meal.name || ''),
  197 |     );
  198 | 
  199 |     console.log(
  200 |       `Strict Vegan: Found ${dairyMeals.length} dairy meals out of ${plan.diet.meals.length}`,
  201 |     );
  202 | 
  203 |     // Should have 0 dairy meals
  204 |     expect(dairyMeals.length).toBe(0);
  205 |   });
  206 | 
  207 |   test('Phase 4.3: Week-to-Week Meal Rotation - Week 0 vs Week 4 should differ', async ({
  208 |     page,
  209 |   }) => {
  210 |     const email = `meal-rotation-${Date.now()}@kaha.online`;
  211 | 
  212 |     // Register and onboard
  213 |     await registerUser(email);
  214 | 
  215 |     // Get auth cookie
  216 |     const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
  217 |       data: {
  218 |         email,
  219 |         password: 'Password@123',
  220 |       },
  221 |     });
  222 |     const setCookie = loginResponse.headers()['set-cookie'];
  223 |     authCookie = setCookie ? setCookie.split(';')[0] : '';
  224 | 
```