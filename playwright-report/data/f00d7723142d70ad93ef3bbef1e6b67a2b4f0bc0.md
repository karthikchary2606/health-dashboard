# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase4-api-tests.spec.js >> Phase 4: API-Based Validation >> Phase 4.2: Strict Vegan should exclude all dairy products
- Location: tests/e2e/phase4-api-tests.spec.js:156:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
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
  124 |     expect(foodChecklistResponse.ok()).toBeTruthy();
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
> 190 |     expect(planResponse.ok()).toBeTruthy();
      |                               ^ Error: expect(received).toBeTruthy()
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
  225 |     // Complete onboarding
  226 |     await completeOnboarding(email, {
  227 |       age: 30,
  228 |       dietType: 'vegetarian',
  229 |       cuisine: 'south-indian',
  230 |     });
  231 | 
  232 |     // Update food checklist
  233 |     await updateFoodChecklist(['idli', 'dosa', 'sambar', 'rasam', 'pesarattu']);
  234 | 
  235 |     // Complete profile settings
  236 |     await completeProfileSettings();
  237 | 
  238 |     // Fetch plan via API
  239 |     const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
  240 |       headers: { Cookie: authCookie },
  241 |     });
  242 | 
  243 |     expect(planResponse.ok()).toBeTruthy();
  244 | 
  245 |     const plan = await planResponse.json();
  246 | 
  247 |     // Get breakfast meals for week 0 (days 0-6)
  248 |     const week0Breakfasts = plan.diet.meals
  249 |       .filter((meal) => meal.weekIndex === 0 && meal.mealType === 'breakfast')
  250 |       .map((m) => m.name)
  251 |       .sort();
  252 | 
  253 |     // Get breakfast meals for week 4 (days 28-34)
  254 |     const week4Breakfasts = plan.diet.meals
  255 |       .filter((meal) => meal.weekIndex === 4 && meal.mealType === 'breakfast')
  256 |       .map((m) => m.name)
  257 |       .sort();
  258 | 
  259 |     console.log(`Week 0 breakfasts: ${week0Breakfasts.join(', ')}`);
  260 |     console.log(`Week 4 breakfasts: ${week4Breakfasts.join(', ')}`);
  261 | 
  262 |     // Week 0 and Week 4 should have different meal selections
  263 |     expect(week0Breakfasts.join()).not.toBe(week4Breakfasts.join());
  264 |   });
  265 | 
  266 |   test('Phase 4.4: Month-to-Month Workout Rotation - Month 1 vs Month 2 should differ', async ({
  267 |     page,
  268 |   }) => {
  269 |     const email = `workout-rotation-${Date.now()}@kaha.online`;
  270 | 
  271 |     // Register and onboard
  272 |     await registerUser(email);
  273 | 
  274 |     // Get auth cookie
  275 |     const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
  276 |       data: {
  277 |         email,
  278 |         password: 'Password@123',
  279 |       },
  280 |     });
  281 |     const setCookie = loginResponse.headers()['set-cookie'];
  282 |     authCookie = setCookie ? setCookie.split(';')[0] : '';
  283 | 
  284 |     // Complete onboarding
  285 |     await completeOnboarding(email, {
  286 |       age: 29,
  287 |       dietType: 'non-vegetarian',
  288 |     });
  289 | 
  290 |     // Update food checklist
```