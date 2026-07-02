import { test, expect } from '@playwright/test';

/**
 * Phase 4 API-Based E2E Tests
 *
 * Validates effective diet inference and deterministic rotation through API responses
 * More reliable than UI-based tests as it directly validates the core features
 */

test.describe('Phase 4: API-Based Validation', () => {
  let baseURL = process.env.BASE_URL || 'http://localhost:3000';
  let authCookie = '';

  test.beforeAll(async () => {
    // Ensure server is running
    const response = await fetch(`${baseURL}/`);
    expect(response.status).toBeLessThan(500);
  });

  // Helper: Register a user
  async function registerUser(email) {
    const response = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Password@123',
        name: 'Test User',
      }),
    });
    return response;
  }

  // Helper: Complete onboarding
  async function completeOnboarding(email, preferences) {
    const response = await fetch(`${baseURL}/api/profile/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        age: preferences.age || 30,
        heightCm: preferences.heightCm || 170,
        currentWeightKg: preferences.currentWeightKg || 75,
        goalWeightKg: preferences.goalWeightKg || 70,
        primaryGoal: preferences.goal || 'maintenance',
        fitnessLevel: preferences.fitnessLevel || 'moderately-active',
        dietType: preferences.dietType || 'vegetarian',
        cuisinePreference: preferences.cuisine || 'south-indian',
        religion: preferences.religion || 'hindu',
        languageCommunity: preferences.language || 'telugu',
      }),
    });
    return response;
  }

  // Helper: Update food checklist
  async function updateFoodChecklist(foodList) {
    const response = await fetch(`${baseURL}/api/profile/food-checklist`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({ foodList }),
    });
    return response;
  }

  // Helper: Complete profile with workout preferences
  async function completeProfileSettings() {
    const response = await fetch(`${baseURL}/api/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        workoutMode: 'hybrid',
        yogaStyle: 'hatha',
        workoutDaysPerWeek: 5,
        cuisinePreference: 'south-indian',
      }),
    });
    return response;
  }

  test('Phase 4.1: Vegetarian + Chicken/Eggs should generate non-vegetarian meals', async ({
    page,
  }) => {
    const email = `veg-chicken-${Date.now()}@kaha.online`;

    // Register and onboard
    await registerUser(email);

    // Get auth cookie by logging in
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email,
        password: 'Password@123',
      },
    });
    const setCookie = loginResponse.headers()['set-cookie'];
    authCookie = setCookie ? setCookie.split(';')[0] : '';

    // Complete onboarding
    await completeOnboarding(email, {
      age: 28,
      dietType: 'vegetarian',
      goal: 'maintenance',
    });

    // Update food checklist: include chicken and eggs
    const foodChecklistResponse = await updateFoodChecklist([
      'idli',
      'dosa',
      'Chicken',
      'Eggs',
      'sambar',
      'rasam',
    ]);

    expect(foodChecklistResponse.ok()).toBeTruthy();

    // Complete profile settings
    await completeProfileSettings();

    // Fetch plan via API
    const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
      headers: { Cookie: authCookie },
    });

    expect(planResponse.ok()).toBeTruthy();

    const plan = await planResponse.json();

    // Validate: Plan should have meals
    expect(plan.diet).toBeDefined();
    expect(plan.diet.meals).toBeDefined();
    expect(plan.diet.meals.length).toBeGreaterThan(0);

    // Count meals containing chicken or egg keywords
    const nonVegMeals = plan.diet.meals.filter((meal) =>
      /chicken|egg|fish|meat|mutton/i.test(meal.name || ''),
    );

    console.log(
      `Vegetarian + Chicken/Eggs user: Found ${nonVegMeals.length} non-veg meals out of ${plan.diet.meals.length}`,
    );

    // Should have at least some non-veg meals (effective diet upgrade worked)
    expect(nonVegMeals.length).toBeGreaterThan(0);
  });

  test('Phase 4.2: Strict Vegan should exclude all dairy products', async ({ page }) => {
    const email = `strict-vegan-${Date.now()}@kaha.online`;

    // Register and onboard
    await registerUser(email);

    // Get auth cookie
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email,
        password: 'Password@123',
      },
    });
    const setCookie = loginResponse.headers()['set-cookie'];
    authCookie = setCookie ? setCookie.split(';')[0] : '';

    // Complete onboarding as vegan
    await completeOnboarding(email, {
      age: 32,
      dietType: 'vegan',
      goal: 'weight-loss',
    });

    // Update food checklist: only vegan items
    await updateFoodChecklist(['spinach', 'broccoli', 'rice', 'lentils', 'beans']);

    // Complete profile settings
    await completeProfileSettings();

    // Fetch plan via API
    const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
      headers: { Cookie: authCookie },
    });

    expect(planResponse.ok()).toBeTruthy();

    const plan = await planResponse.json();

    // Validate: No dairy in vegan meals
    const dairyMeals = plan.diet.meals.filter((meal) =>
      /milk|ghee|paneer|butter|curd|yogurt|dairy|cheese|cream/i.test(meal.name || ''),
    );

    console.log(
      `Strict Vegan: Found ${dairyMeals.length} dairy meals out of ${plan.diet.meals.length}`,
    );

    // Should have 0 dairy meals
    expect(dairyMeals.length).toBe(0);
  });

  test('Phase 4.3: Week-to-Week Meal Rotation - Week 0 vs Week 4 should differ', async ({
    page,
  }) => {
    const email = `meal-rotation-${Date.now()}@kaha.online`;

    // Register and onboard
    await registerUser(email);

    // Get auth cookie
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email,
        password: 'Password@123',
      },
    });
    const setCookie = loginResponse.headers()['set-cookie'];
    authCookie = setCookie ? setCookie.split(';')[0] : '';

    // Complete onboarding
    await completeOnboarding(email, {
      age: 30,
      dietType: 'vegetarian',
      cuisine: 'south-indian',
    });

    // Update food checklist
    await updateFoodChecklist(['idli', 'dosa', 'sambar', 'rasam', 'pesarattu']);

    // Complete profile settings
    await completeProfileSettings();

    // Fetch plan via API
    const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
      headers: { Cookie: authCookie },
    });

    expect(planResponse.ok()).toBeTruthy();

    const plan = await planResponse.json();

    // Get breakfast meals for week 0 (days 0-6)
    const week0Breakfasts = plan.diet.meals
      .filter((meal) => meal.weekIndex === 0 && meal.mealType === 'breakfast')
      .map((m) => m.name)
      .sort();

    // Get breakfast meals for week 4 (days 28-34)
    const week4Breakfasts = plan.diet.meals
      .filter((meal) => meal.weekIndex === 4 && meal.mealType === 'breakfast')
      .map((m) => m.name)
      .sort();

    console.log(`Week 0 breakfasts: ${week0Breakfasts.join(', ')}`);
    console.log(`Week 4 breakfasts: ${week4Breakfasts.join(', ')}`);

    // Week 0 and Week 4 should have different meal selections
    expect(week0Breakfasts.join()).not.toBe(week4Breakfasts.join());
  });

  test('Phase 4.4: Month-to-Month Workout Rotation - Month 1 vs Month 2 should differ', async ({
    page,
  }) => {
    const email = `workout-rotation-${Date.now()}@kaha.online`;

    // Register and onboard
    await registerUser(email);

    // Get auth cookie
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email,
        password: 'Password@123',
      },
    });
    const setCookie = loginResponse.headers()['set-cookie'];
    authCookie = setCookie ? setCookie.split(';')[0] : '';

    // Complete onboarding
    await completeOnboarding(email, {
      age: 29,
      dietType: 'non-vegetarian',
    });

    // Update food checklist
    await updateFoodChecklist(['chicken', 'fish', 'eggs', 'rice', 'dal']);

    // Complete profile settings
    await completeProfileSettings();

    // Fetch plan via API
    const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
      headers: { Cookie: authCookie },
    });

    expect(planResponse.ok()).toBeTruthy();

    const plan = await planResponse.json();

    // Get strength exercises for month 1
    const month1Strength = plan.workouts[0]?.exercises
      ?.filter((ex) => ex.category === 'strength')
      ?.map((ex) => ex.muscleGroup || ex.name)
      ?.sort();

    // Get strength exercises for month 2
    const month2Strength = plan.workouts[1]?.exercises
      ?.filter((ex) => ex.category === 'strength')
      ?.map((ex) => ex.muscleGroup || ex.name)
      ?.sort();

    console.log(`Month 1 strength: ${month1Strength?.join(', ')}`);
    console.log(`Month 2 strength: ${month2Strength?.join(', ')}`);

    // Month 1 and Month 2 should have different workout focus
    if (month1Strength && month2Strength) {
      expect(month1Strength.join()).not.toBe(month2Strength.join());
    }
  });

  test('Phase 4.5: Backward Compatibility - Strict Vegetarian without animal products', async ({
    page,
  }) => {
    const email = `strict-veg-${Date.now()}@kaha.online`;

    // Register and onboard
    await registerUser(email);

    // Get auth cookie
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email,
        password: 'Password@123',
      },
    });
    const setCookie = loginResponse.headers()['set-cookie'];
    authCookie = setCookie ? setCookie.split(';')[0] : '';

    // Complete onboarding as vegetarian
    await completeOnboarding(email, {
      age: 35,
      dietType: 'vegetarian',
      goal: 'muscle-gain',
    });

    // Update food checklist: ONLY vegetarian items (no chicken, no eggs)
    await updateFoodChecklist(['paneer', 'milk', 'rice', 'dal', 'vegetables', 'curd', 'ghee']);

    // Complete profile settings
    await completeProfileSettings();

    // Fetch plan via API
    const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
      headers: { Cookie: authCookie },
    });

    expect(planResponse.ok()).toBeTruthy();

    const plan = await planResponse.json();

    // Count meals with meat/chicken
    const meatMeals = plan.diet.meals.filter((meal) =>
      /chicken|fish|meat|mutton|eggs/i.test(meal.name || ''),
    );

    console.log(`Strict Vegetarian: Found ${meatMeals.length} meat/egg meals out of ${plan.diet.meals.length}`);

    // Should have 0 meat/egg meals (backward compatibility preserved)
    expect(meatMeals.length).toBe(0);
  });

  test('Phase 4.6: API Health Check - Plan endpoint returns valid structure', async ({
    page,
  }) => {
    const email = `health-check-${Date.now()}@kaha.online`;

    // Register and onboard
    await registerUser(email);

    // Get auth cookie
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email,
        password: 'Password@123',
      },
    });
    const setCookie = loginResponse.headers()['set-cookie'];
    authCookie = setCookie ? setCookie.split(';')[0] : '';

    // Complete onboarding
    await completeOnboarding(email, {});

    // Update food checklist
    await updateFoodChecklist(['idli', 'dosa', 'sambar']);

    // Complete profile settings
    await completeProfileSettings();

    // Fetch plan via API
    const planResponse = await page.request.get(`${baseURL}/api/profile/plan`, {
      headers: { Cookie: authCookie },
    });

    expect(planResponse.ok()).toBeTruthy();

    const plan = await planResponse.json();

    // Validate plan structure
    expect(plan.diet).toBeDefined();
    expect(plan.diet.meals).toBeDefined();
    expect(Array.isArray(plan.diet.meals)).toBe(true);
    expect(plan.diet.meals.length).toBeGreaterThan(0);

    expect(plan.workouts).toBeDefined();
    expect(Array.isArray(plan.workouts)).toBe(true);
    expect(plan.workouts.length).toBeGreaterThan(0);

    // Validate meal structure
    const meal = plan.diet.meals[0];
    expect(meal.name).toBeDefined();
    expect(meal.mealType).toBeDefined(); // breakfast, lunch, snack, dinner

    // Validate workout structure
    const workout = plan.workouts[0];
    expect(workout.monthIndex).toBeDefined();
    expect(Array.isArray(workout.exercises)).toBe(true);

    console.log('✓ Plan API structure is valid');
  });
});
