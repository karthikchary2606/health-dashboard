/**
 * E2E: Onboarding flow
 * Covers: multi-step form, diet type + day-picker, avoidances, completion
 */
import { test, expect } from '@playwright/test';
const { BASE_URL, uniqueEmail } = require('./helpers');

async function loginAndGetCookies(request, email, password = 'Test@12345') {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password },
  });
  expect(res.ok()).toBe(true);
  return res.headers()['set-cookie'];
}

async function completeOnboarding(request, cookies, overrides = {}) {
  const payload = {
    age: 25, heightCm: 165, currentWeightKg: 65, goalWeightKg: 60,
    primaryGoal: 'weight-loss',
    dietType: 'non-vegetarian',
    nonVegDays: ['Saturday', 'Sunday'],
    eggDays: [],
    cuisinePreference: 'south-indian',
    fitnessLevel: 'moderately-active',
    culturalFoodAvoidances: [],
    workoutDaysPerWeek: 3,
    workoutTime: 'morning',
    stepGoal: 8000,
    waterGoalL: 2.5,
    ...overrides,
  };
  const res = await request.post(`${BASE_URL}/api/profile/onboarding`, {
    data: payload,
    headers: { Cookie: cookies },
  });
  return res;
}

async function getProfile(request, cookies) {
  const res = await request.get(`${BASE_URL}/api/profile`, {
    headers: { Cookie: cookies },
  });
  return res.json();
}

test.describe('Onboarding: Multi-step Profile Setup', () => {
  let email;

  test.beforeEach(async ({ request }) => {
    email = uniqueEmail('onboard');
    await request.post(`${BASE_URL}/api/auth/register`, {
      data: { email, password: 'Test@12345', name: 'Onboard Tester' },
    });
  });

  test('onboarding page loads for new user', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForLoadState('networkidle');
    await page.fill('#login-email', email);
    await page.fill('#login-password', 'Test@12345');
    await page.click('#form-login button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/onboarding/);
  });

  test('onboarding API: accepts full profile payload', async ({ request }) => {
    const cookies = await loginAndGetCookies(request, email);

    const profileRes = await completeOnboarding(request, cookies, {
      dietType: 'non-vegetarian',
      nonVegDays: ['Saturday', 'Sunday'],
      eggDays: ['Monday', 'Wednesday', 'Friday'],
      culturalFoodAvoidances: ['pork', 'beef', 'mutton'],
      stepGoal: 8000,
    });
    expect(profileRes.ok()).toBe(true);
    const body = await profileRes.json();
    expect(body.success).toBe(true);

    // Fetch profile to verify persisted values
    const profile = await getProfile(request, cookies);
    expect(profile.dietType).toBe('non-vegetarian');
    expect(profile.nonVegDays).toContain('Saturday');
    expect(profile.culturalFoodAvoidances).toContain('pork');
    expect(profile.stepGoal).toBe(8000);
  });

  test('onboarding API: vegetarian user has no nonVegDays', async ({ request }) => {
    const cookies = await loginAndGetCookies(request, email);

    const profileRes = await completeOnboarding(request, cookies, {
      dietType: 'vegetarian',
      nonVegDays: [],
      eggDays: [],
    });
    expect(profileRes.ok()).toBe(true);

    const profile = await getProfile(request, cookies);
    expect(profile.dietType).toBe('vegetarian');
    expect(profile.nonVegDays).toHaveLength(0);
  });

  test('onboarding API: eggetarian user can specify eggDays', async ({ request }) => {
    const cookies = await loginAndGetCookies(request, email);

    const profileRes = await completeOnboarding(request, cookies, {
      dietType: 'eggetarian',
      nonVegDays: [],
      eggDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
    });
    expect(profileRes.ok()).toBe(true);

    const profile = await getProfile(request, cookies);
    expect(profile.eggDays).toContain('Monday');
    expect(profile.eggDays).toHaveLength(4);
  });
});
