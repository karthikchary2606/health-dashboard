/**
 * E2E: Calorie & Steps Tracker
 * Covers: log meal, calorie math, steps, dynamic 1,420/2,100 display
 */
import { test, expect } from '@playwright/test';
const { BASE_URL, uniqueEmail, registerAndLogin, completeProfileViaAPI } = require('./helpers');

// Local date string helper (matches server's localDateString())
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

test.describe('Tracker: Calorie & Steps', () => {
  let cookies;

  test.beforeAll(async ({ request }) => {
    const auth = await registerAndLogin(request);
    cookies = auth.cookies;
    await completeProfileViaAPI(request, cookies);
  });

  test('GET /api/tracker/today returns empty state for new user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tracker/today`, {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('meals');
    expect(body).toHaveProperty('stepCount');
    expect(body).toHaveProperty('calorieTarget');
    expect(body).toHaveProperty('consumed');
    expect(body).toHaveProperty('remaining');
    expect(body.meals).toHaveLength(0);
    expect(body.consumed).toBe(0);
    expect(body.calorieTarget).toBeGreaterThan(0); // 2100 default
    expect(body.remaining).toBe(body.calorieTarget);
  });

  test('POST /api/tracker/meal logs a meal and returns mealId', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/tracker/meal`, {
      data: {
        mealType: 'breakfast',
        recipeName: 'Idli',
        calories: 96,
        fromPlan: true,
        date: todayStr(),
      },
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('mealId');
    expect(body.calories).toBe(96);
  });

  test('calorie math: consumed and remaining update correctly', async ({ request }) => {
    // Fresh user for isolated test
    const auth = await registerAndLogin(request);
    const c = auth.cookies;
    await completeProfileViaAPI(request, c);

    // Log 3 meals
    await request.post(`${BASE_URL}/api/tracker/meal`, {
      data: { mealType: 'breakfast', recipeName: 'Idli', calories: 96, fromPlan: true, date: todayStr() },
      headers: { Cookie: c },
    });
    await request.post(`${BASE_URL}/api/tracker/meal`, {
      data: { mealType: 'lunch', recipeName: 'Chicken Curry', calories: 380, fromPlan: true, date: todayStr() },
      headers: { Cookie: c },
    });
    await request.post(`${BASE_URL}/api/tracker/meal`, {
      data: { mealType: 'snack', recipeName: 'Banana', calories: 90, fromPlan: false, date: todayStr() },
      headers: { Cookie: c },
    });

    const res = await request.get(`${BASE_URL}/api/tracker/today`, {
      headers: { Cookie: c },
    });
    const body = await res.json();

    expect(body.consumed).toBe(96 + 380 + 90); // 566
    expect(body.remaining).toBe(body.calorieTarget - 566);
    expect(body.meals).toHaveLength(3);
    // Dynamic display: consumed / target format
    expect(body.consumed).toBeLessThanOrEqual(body.calorieTarget);
  });

  test('DELETE /api/tracker/meal removes meal and updates calorie count', async ({ request }) => {
    const auth = await registerAndLogin(request);
    const c = auth.cookies;
    await completeProfileViaAPI(request, c);

    const postRes = await request.post(`${BASE_URL}/api/tracker/meal`, {
      data: { mealType: 'dinner', recipeName: 'Dal Tadka', calories: 220, fromPlan: false, date: todayStr() },
      headers: { Cookie: c },
    });
    const { mealId } = await postRes.json();

    const delRes = await request.delete(`${BASE_URL}/api/tracker/meal/${mealId}`, {
      headers: { Cookie: c },
    });
    expect(delRes.ok()).toBe(true);

    const today = await request.get(`${BASE_URL}/api/tracker/today`, {
      headers: { Cookie: c },
    });
    const body = await today.json();
    expect(body.consumed).toBe(0);
    expect(body.meals).toHaveLength(0);
  });

  test('PATCH /api/tracker/steps records step count', async ({ request }) => {
    const auth = await registerAndLogin(request);
    const c = auth.cookies;
    await completeProfileViaAPI(request, c);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const res = await request.patch(`${BASE_URL}/api/tracker/steps`, {
      data: { stepCount: 5420, date: dateStr },
      headers: { Cookie: c },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.stepCount).toBe(5420);
  });

  test('GET /api/tracker/today shows updated stepCount', async ({ request }) => {
    const auth = await registerAndLogin(request);
    const c = auth.cookies;
    await completeProfileViaAPI(request, c);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    await request.patch(`${BASE_URL}/api/tracker/steps`, {
      data: { stepCount: 7800, date: dateStr },
      headers: { Cookie: c },
    });

    const res = await request.get(`${BASE_URL}/api/tracker/today`, {
      headers: { Cookie: c },
    });
    const body = await res.json();
    expect(body.stepCount).toBe(7800);
  });

  test('GET /api/tracker/summary/:date returns correct data shape', async ({ request }) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const res = await request.get(`${BASE_URL}/api/tracker/summary/${dateStr}`, {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('meals');
    expect(body).toHaveProperty('stepCount');
    expect(body).toHaveProperty('consumed');
    expect(body).toHaveProperty('remaining');
    expect(body).toHaveProperty('calorieTarget');
  });

  test('tracker requires authentication', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tracker/today`);
    expect(res.status()).toBe(401);
  });
});
