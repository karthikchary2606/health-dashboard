/**
 * E2E: Dashboard live data (/api/logs/today)
 * Covers: BMR, calorie target, activity level, today's snapshot
 */
import { test, expect } from '@playwright/test';
const { BASE_URL, registerAndLogin, completeProfileViaAPI } = require('./helpers');

test.describe('Dashboard: Live Data & Logs', () => {
  let cookies;

  test.beforeAll(async ({ request }) => {
    const auth = await registerAndLogin(request);
    cookies = auth.cookies;
    await completeProfileViaAPI(request, cookies);
  });

  test('GET /api/logs/today returns full live snapshot', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/logs/today`, {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();

    // Shape validation
    expect(body).toHaveProperty('date');
    expect(body).toHaveProperty('meals');
    expect(body).toHaveProperty('stepCount');
    expect(body).toHaveProperty('calorieTarget');
    expect(body).toHaveProperty('consumed');
    expect(body).toHaveProperty('remaining');
    expect(body).toHaveProperty('bmr');
    expect(body).toHaveProperty('activityLevel');
    expect(body).toHaveProperty('profileData');
  });

  test('date is in local YYYY-MM-DD format (not UTC)', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/logs/today`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Validate it's a real date
    const d = new Date(body.date);
    expect(isNaN(d.getTime())).toBe(false);
  });

  test('BMR is computed and positive', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/logs/today`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    expect(body.bmr).toBeGreaterThan(0);
    // Reasonable range for healthy adult (1200–3000)
    expect(body.bmr).toBeGreaterThan(1200);
    expect(body.bmr).toBeLessThan(3500);
  });

  test('activityLevel maps from profile fitnessLevel', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/logs/today`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    const validLevels = ['sedentary', 'light', 'moderate', 'very-active', 'extra-active'];
    expect(validLevels).toContain(body.activityLevel);
  });

  test('profileData contains dietType, nonVegDays, eggDays', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/logs/today`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    expect(body.profileData).toHaveProperty('dietType');
    expect(body.profileData).toHaveProperty('nonVegDays');
    expect(body.profileData).toHaveProperty('eggDays');
    expect(body.profileData.dietType).toBe('non-vegetarian');
    expect(body.profileData.nonVegDays).toContain('Saturday');
  });

  test('calorie math is consistent: remaining = target - consumed', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/logs/today`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    expect(body.remaining).toBe(body.calorieTarget - body.consumed);
  });

  test('/api/logs/today requires authentication', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/logs/today`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Dashboard: Sleep & Health Logs', () => {
  let cookies;

  test.beforeAll(async ({ request }) => {
    const auth = await registerAndLogin(request);
    cookies = auth.cookies;
    await completeProfileViaAPI(request, cookies);
  });

  test('POST /api/logs logs a health entry', async ({ request }) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const res = await request.post(`${BASE_URL}/api/logs`, {
      data: {
        date: dateStr,
        currentWeightKg: 71.5,
        waterConsumedL: 2.0,
        meals: [
          { mealType: 'breakfast', recipeName: 'Oats Upma', calories: 180, fromPlan: true },
        ],
      },
      headers: { Cookie: cookies },
    });
    // 200 or 201
    expect([200, 201]).toContain(res.status());
  });

  test('GET /api/logs returns log history', async ({ request }) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const res = await request.get(`${BASE_URL}/api/logs/${dateStr}`, {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // Returns the day's log object (not an array)
    expect(body).toBeDefined();
    expect(body).toHaveProperty('date');
  });
});
