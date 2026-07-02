import { test, expect } from '@playwright/test';

/**
 * Phase 4: Effective Diet Inference + Deterministic Rotation E2E Tests
 *
 * Personas:
 * 1. Vegetarian + Chicken/Eggs: Verify effective diet upgrade to non-vegetarian
 * 2. Strict Vegan: Verify no dairy/meat meals appear
 * 3. Week-to-Week Variation: Verify meals differ between week 0 and week 4
 * 4. Month-to-Month Workout Rotation: Verify different workout focus per month
 */

// Helper: Register and onboard a user with specific preferences
async function registerAndOnboard(page, email, preferences) {
  // Register
  await page.goto('/register.html');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'Password@123');
  await page.fill('input[name="name"]', preferences.name || 'Test User');
  await page.click('button:has-text("Register")');
  await page.waitForURL(/login/);

  // Login
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button:has-text("Login")');

  // Onboarding step 1: Body stats
  await page.waitForSelector('button:has-text("Next")');
  await page.fill('input[name="age"]', preferences.age?.toString() || '30');
  await page.fill('input[name="heightCm"]', preferences.heightCm?.toString() || '170');
  await page.fill('input[name="currentWeightKg"]', preferences.currentWeightKg?.toString() || '75');
  await page.fill('input[name="goalWeightKg"]', preferences.goalWeightKg?.toString() || '70');
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  // Step 2: Primary goal
  await page.selectOption('select[name="primaryGoal"]', preferences.goal || 'maintenance');
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  // Step 3: Fitness level
  await page.selectOption('select[name="fitnessLevel"]', preferences.fitnessLevel || 'moderately-active');
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  // Step 4: Diet type
  await page.selectOption('select[name="dietType"]', preferences.dietType || 'vegetarian');
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  // Step 5: Cuisine preference
  await page.selectOption('select[name="cuisinePreference"]', preferences.cuisine || 'south-indian');
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  // Step 6: Health conditions
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  // Step 7: Religion & language
  await page.selectOption('select[name="religion"]', preferences.religion || 'hindu');
  await page.selectOption('select[name="languageCommunity"]', preferences.language || 'telugu');
  await page.click('button:has-text("Next")');
  await page.waitForTimeout(500);

  // Step 8: Review & Submit
  await page.click('button:has-text("Submit")');
  await page.waitForURL(/dashboard|profile-complete/);
}

// Helper: Complete profile with food checklist and workout preferences
async function completeProfile(page, foodItems) {
  // Click "Complete Profile" if needed
  const completeBtn = await page.$('button:has-text("Complete Profile")');
  if (completeBtn) {
    await completeBtn.click();
    await page.waitForURL(/profile-complete/);
  }

  // Food checklist: select specified items
  for (const item of foodItems) {
    const checkbox = await page.$(`input[value="${item}"]`);
    if (checkbox) {
      const isChecked = await checkbox.isChecked();
      if (!isChecked) await checkbox.click();
    }
  }

  // Workout preferences: hybrid (gym + yoga)
  await page.selectOption('select[name="workoutMode"]', 'hybrid');
  await page.selectOption('select[name="yogaStyle"]', 'hatha');
  await page.fill('input[name="workoutDaysPerWeek"]', '5');

  // Save
  await page.click('button:has-text("Save")');
  await page.waitForURL(/dashboard|profile-complete/);
  await page.waitForTimeout(1000);
}

// Helper: Verify meals match expected diet type
async function verifyMealsMatchDiet(page, expectedDietType) {
  await page.click('text=Diet');
  await page.waitForSelector('text=Week 1');

  const mealsText = await page.locator('.diet-section').textContent();

  if (expectedDietType === 'vegetarian-with-chicken') {
    // Should contain chicken items
    expect(mealsText).toMatch(/chicken|egg/i);
  } else if (expectedDietType === 'vegan') {
    // Should NOT contain dairy keywords
    expect(mealsText).not.toMatch(/milk|ghee|paneer|butter|curd|yogurt|dairy/i);
  } else if (expectedDietType === 'vegetarian') {
    // Should NOT contain meat
    expect(mealsText).not.toMatch(/chicken|fish|meat|mutton/i);
  }
}

// Helper: Verify week-to-week meal variation
async function verifyMealRotation(page) {
  await page.click('text=Diet');
  await page.waitForSelector('text=Week 1');

  // Get breakfast items for week 0 (first 7 days)
  const week0Breakfasts = await page
    .locator('.meal-day:nth-child(1) .meal:has-text("Breakfast")')
    .allTextContents();

  // Scroll to week 4
  await page.evaluate(() => {
    const element = document.querySelector('.diet-section');
    if (element) element.scrollTop += 3000;
  });
  await page.waitForTimeout(500);

  // Get breakfast items for week 4 (days 21-27)
  const week4Breakfasts = await page
    .locator('.meal-day:nth-child(22) .meal:has-text("Breakfast")')
    .allTextContents();

  // Verify they're different
  expect(week0Breakfasts.join()).not.toBe(week4Breakfasts.join());
}

// Helper: Verify month-to-month workout variation
async function verifyWorkoutRotation(page) {
  await page.click('text=Workout');
  await page.waitForSelector('text=Month 1');

  // Get strength exercises for month 1
  const month1Strength = await page
    .locator('.workout-month:nth-child(1) .exercise:has-text("Strength")')
    .allTextContents();

  // Scroll to month 2
  await page.evaluate(() => {
    const element = document.querySelector('.workout-section');
    if (element) element.scrollTop += 1500;
  });
  await page.waitForTimeout(500);

  // Get strength exercises for month 2
  const month2Strength = await page
    .locator('.workout-month:nth-child(2) .exercise:has-text("Strength")')
    .allTextContents();

  // Verify muscle groups differ (e.g., chest in month 1, back in month 2)
  expect(month1Strength.join()).not.toBe(month2Strength.join());
}

test.describe('Phase 4: Effective Diet Inference + Deterministic Rotation', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure server is running
    await page.goto('/');
  });

  test('Persona 1: Vegetarian with Chicken/Eggs should receive non-vegetarian meals', async ({
    page,
  }) => {
    const email = `veg-with-chicken-${Date.now()}@kaha.online`;

    await registerAndOnboard(page, email, {
      name: 'Vegetarian + Chicken',
      age: 28,
      dietType: 'vegetarian',
      goal: 'maintenance',
    });

    // Complete profile: select chicken and eggs in food checklist
    await completeProfile(page, ['idli', 'dosa', 'Chicken', 'Eggs', 'sambar']);

    // Verify diet plan includes non-vegetarian meals
    await verifyMealsMatchDiet(page, 'vegetarian-with-chicken');

    // Take screenshot
    await page.screenshot({ path: `tests/e2e/screenshots/persona1-veg-with-chicken.png` });
  });

  test('Persona 2: Strict Vegan should have no dairy items', async ({ page }) => {
    const email = `strict-vegan-${Date.now()}@kaha.online`;

    await registerAndOnboard(page, email, {
      name: 'Strict Vegan',
      age: 32,
      dietType: 'vegan',
      goal: 'weight-loss',
    });

    // Complete profile: no animal products
    await completeProfile(page, ['spinach', 'broccoli', 'rice', 'lentils', 'beans']);

    // Verify diet plan excludes dairy
    await verifyMealsMatchDiet(page, 'vegan');

    // Take screenshot
    await page.screenshot({ path: `tests/e2e/screenshots/persona2-strict-vegan.png` });
  });

  test('Persona 3: Vegetarian without special items should have only veg meals', async ({
    page,
  }) => {
    const email = `strict-vegetarian-${Date.now()}@kaha.online`;

    await registerAndOnboard(page, email, {
      name: 'Strict Vegetarian',
      age: 35,
      dietType: 'vegetarian',
      goal: 'muscle-gain',
    });

    // Complete profile: only vegetarian items
    await completeProfile(page, ['paneer', 'milk', 'rice', 'dal', 'vegetables']);

    // Verify diet plan has no meat/chicken
    await verifyMealsMatchDiet(page, 'vegetarian');

    // Take screenshot
    await page.screenshot({ path: `tests/e2e/screenshots/persona3-strict-veg.png` });
  });

  test('Week-to-Week Meal Rotation: Week 0 and Week 4 should differ', async ({ page }) => {
    const email = `meal-rotation-${Date.now()}@kaha.online`;

    await registerAndOnboard(page, email, {
      name: 'Meal Rotation Test',
      age: 30,
      dietType: 'vegetarian',
    });

    await completeProfile(page, ['idli', 'dosa', 'sambar', 'rasam']);

    // Verify rotation
    await verifyMealRotation(page);

    // Take screenshot
    await page.screenshot({ path: `tests/e2e/screenshots/meal-rotation.png` });
  });

  test('Month-to-Month Workout Rotation: Month 1 and Month 2 should differ', async ({
    page,
  }) => {
    const email = `workout-rotation-${Date.now()}@kaha.online`;

    await registerAndOnboard(page, email, {
      name: 'Workout Rotation Test',
      age: 29,
      dietType: 'non-vegetarian',
    });

    await completeProfile(page, ['chicken', 'fish', 'eggs', 'rice']);

    // Verify rotation
    await verifyWorkoutRotation(page);

    // Take screenshot
    await page.screenshot({ path: `tests/e2e/screenshots/workout-rotation.png` });
  });

  test('End-to-End Dashboard Load for Vegetarian + Chicken user', async ({ page }) => {
    const email = `dashboard-e2e-${Date.now()}@kaha.online`;

    await registerAndOnboard(page, email, {
      name: 'Dashboard E2E',
      dietType: 'vegetarian',
    });

    await completeProfile(page, ['Chicken', 'Eggs', 'idli', 'dosa']);

    // Verify dashboard loads with all sections
    await expect(page.locator('text=Daily Overview')).toBeVisible();
    await expect(page.locator('text=Daily Timeline')).toBeVisible();
    await expect(page.locator('text=Diet')).toBeVisible();
    await expect(page.locator('text=Workout')).toBeVisible();

    // Verify plan API returns correct data
    const response = await page.request.get('/api/profile/plan');
    expect(response.ok()).toBeTruthy();

    const planData = await response.json();
    expect(planData.diet).toBeDefined();
    expect(planData.diet.meals.length).toBeGreaterThan(0);
    expect(planData.workouts).toBeDefined();
    expect(planData.workouts.length).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({ path: `tests/e2e/screenshots/dashboard-e2e.png` });
  });
});
