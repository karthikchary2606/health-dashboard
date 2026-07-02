# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase4-api-tests.spec.js >> Phase 4: API-Based Validation >> Phase 4.5: Backward Compatibility - Strict Vegetarian without animal products
- Location: tests/e2e/phase4-api-tests.spec.js:326:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
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
  291 |     await updateFoodChecklist(['chicken', 'fish', 'eggs', 'rice', 'dal']);
  292 | 
  293 |     // Complete profile settings
  294 |     await completeProfileSettings();
  295 | 
  296 |     // Fetch plan via API
  297 |     const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
  298 |       headers: { Cookie: authCookie },
  299 |     });
  300 | 
  301 |     expect(planResponse.ok()).toBeTruthy();
  302 | 
  303 |     const plan = await planResponse.json();
  304 | 
  305 |     // Get strength exercises for month 1
  306 |     const month1Strength = plan.workouts[0]?.exercises
  307 |       ?.filter((ex) => ex.category === 'strength')
  308 |       ?.map((ex) => ex.muscleGroup || ex.name)
  309 |       ?.sort();
  310 | 
  311 |     // Get strength exercises for month 2
  312 |     const month2Strength = plan.workouts[1]?.exercises
  313 |       ?.filter((ex) => ex.category === 'strength')
  314 |       ?.map((ex) => ex.muscleGroup || ex.name)
  315 |       ?.sort();
  316 | 
  317 |     console.log(`Month 1 strength: ${month1Strength?.join(', ')}`);
  318 |     console.log(`Month 2 strength: ${month2Strength?.join(', ')}`);
  319 | 
  320 |     // Month 1 and Month 2 should have different workout focus
  321 |     if (month1Strength && month2Strength) {
  322 |       expect(month1Strength.join()).not.toBe(month2Strength.join());
  323 |     }
  324 |   });
  325 | 
  326 |   test('Phase 4.5: Backward Compatibility - Strict Vegetarian without animal products', async ({
  327 |     page,
  328 |   }) => {
  329 |     const email = `strict-veg-${Date.now()}@kaha.online`;
  330 | 
  331 |     // Register and onboard
  332 |     await registerUser(email);
  333 | 
  334 |     // Get auth cookie
  335 |     const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
  336 |       data: {
  337 |         email,
  338 |         password: 'Password@123',
  339 |       },
  340 |     });
  341 |     const setCookie = loginResponse.headers()['set-cookie'];
  342 |     authCookie = setCookie ? setCookie.split(';')[0] : '';
  343 | 
  344 |     // Complete onboarding as vegetarian
  345 |     await completeOnboarding(email, {
  346 |       age: 35,
  347 |       dietType: 'vegetarian',
  348 |       goal: 'muscle-gain',
  349 |     });
  350 | 
  351 |     // Update food checklist: ONLY vegetarian items (no chicken, no eggs)
  352 |     await updateFoodChecklist(['paneer', 'milk', 'rice', 'dal', 'vegetables', 'curd', 'ghee']);
  353 | 
  354 |     // Complete profile settings
  355 |     await completeProfileSettings();
  356 | 
  357 |     // Fetch plan via API
  358 |     const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
  359 |       headers: { Cookie: authCookie },
  360 |     });
  361 | 
> 362 |     expect(planResponse.ok()).toBeTruthy();
      |                               ^ Error: expect(received).toBeTruthy()
  363 | 
  364 |     const plan = await planResponse.json();
  365 | 
  366 |     // Count meals with meat/chicken
  367 |     const meatMeals = plan.diet.meals.filter((meal) =>
  368 |       /chicken|fish|meat|mutton|eggs/i.test(meal.name || ''),
  369 |     );
  370 | 
  371 |     console.log(`Strict Vegetarian: Found ${meatMeals.length} meat/egg meals out of ${plan.diet.meals.length}`);
  372 | 
  373 |     // Should have 0 meat/egg meals (backward compatibility preserved)
  374 |     expect(meatMeals.length).toBe(0);
  375 |   });
  376 | 
  377 |   test('Phase 4.6: API Health Check - Plan endpoint returns valid structure', async ({
  378 |     page,
  379 |   }) => {
  380 |     const email = `health-check-${Date.now()}@kaha.online`;
  381 | 
  382 |     // Register and onboard
  383 |     await registerUser(email);
  384 | 
  385 |     // Get auth cookie
  386 |     const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
  387 |       data: {
  388 |         email,
  389 |         password: 'Password@123',
  390 |       },
  391 |     });
  392 |     const setCookie = loginResponse.headers()['set-cookie'];
  393 |     authCookie = setCookie ? setCookie.split(';')[0] : '';
  394 | 
  395 |     // Complete onboarding
  396 |     await completeOnboarding(email, {});
  397 | 
  398 |     // Update food checklist
  399 |     await updateFoodChecklist(['idli', 'dosa', 'sambar']);
  400 | 
  401 |     // Complete profile settings
  402 |     await completeProfileSettings();
  403 | 
  404 |     // Fetch plan via API
  405 |     const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
  406 |       headers: { Cookie: authCookie },
  407 |     });
  408 | 
  409 |     expect(planResponse.ok()).toBeTruthy();
  410 | 
  411 |     const plan = await planResponse.json();
  412 | 
  413 |     // Validate plan structure
  414 |     expect(plan.diet).toBeDefined();
  415 |     expect(plan.diet.meals).toBeDefined();
  416 |     expect(Array.isArray(plan.diet.meals)).toBe(true);
  417 |     expect(plan.diet.meals.length).toBeGreaterThan(0);
  418 | 
  419 |     expect(plan.workouts).toBeDefined();
  420 |     expect(Array.isArray(plan.workouts)).toBe(true);
  421 |     expect(plan.workouts.length).toBeGreaterThan(0);
  422 | 
  423 |     // Validate meal structure
  424 |     const meal = plan.diet.meals[0];
  425 |     expect(meal.name).toBeDefined();
  426 |     expect(meal.mealType).toBeDefined(); // breakfast, lunch, snack, dinner
  427 | 
  428 |     // Validate workout structure
  429 |     const workout = plan.workouts[0];
  430 |     expect(workout.monthIndex).toBeDefined();
  431 |     expect(Array.isArray(workout.exercises)).toBe(true);
  432 | 
  433 |     console.log('✓ Plan API structure is valid');
  434 |   });
  435 | });
  436 | 
```