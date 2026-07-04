/**
 * E2E: Diet Plan — hybrid diet, food avoidances, weekly rotation
 * Competitive edge: unique hybrid diet support no competitor offers
 */
import { test, expect } from '@playwright/test';
const { BASE_URL, uniqueEmail, registerAndLogin, completeProfileViaAPI } = require('./helpers');

// Helper: flatten all meal name strings from the plan
function allMealNames(body) {
  const names = [];
  for (const month of body.diet || []) {
    for (const week of month.weeks || []) {
      for (const day of week.weekdays || []) {
        ['breakfast', 'lunch', 'snack', 'dinner'].forEach(slot => {
          if (day[slot]) names.push(day[slot].toLowerCase());
        });
      }
    }
  }
  return names;
}

// Helper: find days matching a given day name across the plan
function findDays(body, dayName) {
  const result = [];
  for (const month of body.diet || []) {
    for (const week of month.weeks || []) {
      for (const day of week.weekdays || []) {
        if (day.day === dayName) result.push(day);
      }
    }
  }
  return result;
}

test.describe('Diet Plan: Hybrid Diet & Avoidances', () => {
  let cookies;

  test.beforeAll(async ({ request }) => {
    const auth = await registerAndLogin(request);
    cookies = auth.cookies;
    await completeProfileViaAPI(request, cookies);
  });

  test('GET /api/profile/plan returns 6-month plan', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/profile/plan`, {
      headers: { Cookie: cookies },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // Plan has diet, workout, meta at top level
    expect(body).toHaveProperty('diet');
    expect(body).toHaveProperty('meta');
    expect(Array.isArray(body.diet)).toBe(true);
    expect(body.diet.length).toBeGreaterThanOrEqual(6); // 6 months
  });

  test('diet plan respects non-veg days: Saturday has non-veg meals', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/profile/plan`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();

    const saturdays = findDays(body, 'Saturday');
    expect(saturdays.length).toBeGreaterThan(0);

    // Saturday should have non-veg dietType (nonVegDays: ['Saturday', 'Sunday'] in helper)
    const allNonVeg = saturdays.every(d => d.dietType === 'non-vegetarian');
    expect(allNonVeg).toBe(true);
  });

  test('diet plan: avoided foods (pork, beef) never appear in full plan', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/profile/plan`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();

    const names = allMealNames(body);
    expect(names.length).toBeGreaterThan(0);

    // CRITICAL: pork and beef must NEVER appear (from culturalFoodAvoidances)
    const forbidden = names.filter(n => /\bpork\b|\bbeef\b|\bbacon\b|\bham\b/.test(n));
    expect(forbidden).toHaveLength(0);
  });

  test('Monday is vegetarian: non-veg meals should not appear on non-specified days', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/profile/plan`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();

    const mondays = findDays(body, 'Monday');
    if (mondays.length === 0) return;

    // Monday is NOT in nonVegDays (['Saturday','Sunday']) — should be vegetarian
    const hasBadDietType = mondays.some(d => d.dietType === 'non-vegetarian');
    expect(hasBadDietType).toBe(false);
  });

  test('plan has color-coded dietType on each day', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/profile/plan`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    const firstWeek = body.diet?.[0]?.weeks?.[0];
    expect(firstWeek).toBeDefined();

    const days = firstWeek.weekdays || [];
    expect(days.length).toBeGreaterThan(0);
    const hasDietType = days.every(d => d.dietType !== undefined);
    expect(hasDietType).toBe(true);
  });

  test('plan rotates meals — week 1 and week 4 differ', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/profile/plan`, {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    const w1 = body.diet?.[0]?.weeks?.[0]?.weekdays?.[0];
    const w4 = body.diet?.[0]?.weeks?.[3]?.weekdays?.[0];
    if (!w1 || !w4) return; // not enough weeks

    expect(JSON.stringify(w1)).not.toBe(JSON.stringify(w4));
  });
});
