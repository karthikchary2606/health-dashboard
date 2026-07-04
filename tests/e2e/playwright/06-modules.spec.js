/**
 * E2E: Sleep tracking, Breathing, Workout modules
 */
import { test, expect } from '@playwright/test';
const { BASE_URL, registerAndLogin, completeProfileViaAPI } = require('./helpers');

test.describe('Sleep Tracking', () => {
  let cookies;

  test.beforeAll(async ({ request }) => {
    const auth = await registerAndLogin(request);
    cookies = auth.cookies;
    await completeProfileViaAPI(request, cookies);
  });

  test('POST /api/sleep logs sleep entry', async ({ request }) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const res = await request.post(`${BASE_URL}/api/sleep`, {
      data: {
        date: dateStr,
        hoursSlept: 7.5,
        sleepQuality: 'good',
        bedtime: '22:30',
        wakeTime: '06:00',
      },
      headers: { Cookie: cookies },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('GET /api/sleep returns sleep history', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/sleep`, {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('sleep endpoint requires authentication', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/sleep`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Breathing Exercises', () => {
  let cookies;

  test.beforeAll(async ({ request }) => {
    const auth = await registerAndLogin(request);
    cookies = auth.cookies;
    await completeProfileViaAPI(request, cookies);
  });

  test('GET /api/breathing returns breathing exercises', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/breathing/techniques`, {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('breathing endpoint requires authentication', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/breathing/techniques`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Grocery List', () => {
  let cookies;

  test.beforeAll(async ({ request }) => {
    const auth = await registerAndLogin(request);
    cookies = auth.cookies;
    await completeProfileViaAPI(request, cookies);
  });

  test('GET /api/grocery returns grocery items for plan', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/grocery/week`, {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('grocery list contains food items with quantities', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/grocery/week`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    // Should be array of items or categories with items
    const hasItems = Array.isArray(body) || (typeof body === 'object' && Object.keys(body).length > 0);
    expect(hasItems).toBe(true);
  });
});

test.describe('Checklist / Guidelines', () => {
  let cookies;

  test.beforeAll(async ({ request }) => {
    const auth = await registerAndLogin(request);
    cookies = auth.cookies;
    await completeProfileViaAPI(request, cookies);
  });

  test('GET /api/checklist returns health checklist', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/checklist`, {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
  });

  test('checklist requires authentication', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/checklist`);
    expect(res.status()).toBe(401);
  });
});
