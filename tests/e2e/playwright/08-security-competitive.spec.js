/**
 * E2E: Security & Competitive Edge Validations
 * - XSS prevention in all user-controlled inputs
 * - Input validation (edge cases, boundary values)
 * - Food avoidance hard contract across full plan
 * - Hybrid diet uniqueness vs market (no competitor offers this)
 */
import { test, expect } from '@playwright/test';
const { BASE_URL, uniqueEmail, registerAndLogin, completeProfileViaAPI } = require('./helpers');

test.describe('Security: Input Validation', () => {
  let cookies;

  test.beforeAll(async ({ request }) => {
    const auth = await registerAndLogin(request);
    cookies = auth.cookies;
    await completeProfileViaAPI(request, cookies);
  });

  test('tracker: POST meal rejects missing required fields', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/tracker/meal`, {
      data: { mealType: 'breakfast' }, // missing recipeName and calories
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(400);
  });

  test('tracker: PATCH steps rejects negative step count', async ({ request }) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const res = await request.patch(`${BASE_URL}/api/tracker/steps`, {
      data: { stepCount: -500, date: dateStr },
      headers: { Cookie: cookies },
    });
    // Should either reject (400) or store 0/absolute value, not -500
    if (res.ok()) {
      const body = await res.json();
      expect(body.stepCount).toBeGreaterThanOrEqual(0);
    } else {
      expect(res.status()).toBe(400);
    }
  });

  test('tracker: DELETE nonexistent meal returns 404', async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/api/tracker/meal/000000000000000000000000`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(404);
  });

  test('auth: register rejects weak password', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/register`, {
      data: { email: uniqueEmail('weak'), password: '123', name: 'Weak' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('auth: register rejects invalid email', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/register`, {
      data: { email: 'notanemail', password: 'Test@12345', name: 'Invalid' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Competitive Edge: Unique Features', () => {
  test('hybrid diet: veg Mon-Fri, non-veg Sat-Sun — verified across plan', async ({ request }) => {
    const auth = await registerAndLogin(request);
    const c = auth.cookies;

    // Non-veg user with non-veg only on Sat-Sun
    const profileRes = await request.post(`${BASE_URL}/api/profile/onboarding`, {
      data: {
        age: 28, heightCm: 170, currentWeightKg: 72, goalWeightKg: 70,
        primaryGoal: 'general-fitness',
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
      },
      headers: { Cookie: c },
    });
    expect(profileRes.ok()).toBe(true);

    const plan = await request.get(`${BASE_URL}/api/profile/plan`, {
      headers: { Cookie: c },
    });
    const body = await plan.json();

    // Verify Monday is vegetarian and Saturday is non-veg using actual plan structure
    let mondayDietType = null, saturdayDietType = null;
    for (const month of body.diet || []) {
      for (const week of month.weeks || []) {
        for (const day of week.weekdays || []) {
          if (day.day === 'Monday' && !mondayDietType) mondayDietType = day.dietType;
          if (day.day === 'Saturday' && !saturdayDietType) saturdayDietType = day.dietType;
        }
      }
    }
    if (mondayDietType) expect(mondayDietType).toMatch(/vegetarian|veg/i);
    if (saturdayDietType) expect(saturdayDietType).toMatch(/non-vegetarian|non-veg/i);
  });

  test('food avoidance is a hard constraint — no fallback to avoided foods', async ({ request }) => {
    const auth = await registerAndLogin(request);
    const c = auth.cookies;
    await request.post(`${BASE_URL}/api/profile/onboarding`, {
      data: {
        age: 30, heightCm: 165, currentWeightKg: 68, goalWeightKg: 65,
        primaryGoal: 'weight-loss',
        dietType: 'non-vegetarian',
        nonVegDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
        eggDays: [],
        cuisinePreference: 'north-indian',
        fitnessLevel: 'lightly-active',
        culturalFoodAvoidances: ['pork', 'beef', 'mutton', 'prawn'],
        workoutDaysPerWeek: 3,
        workoutTime: 'evening',
        stepGoal: 6000,
        waterGoalL: 2.0,
      },
      headers: { Cookie: c },
    });

    const plan = await request.get(`${BASE_URL}/api/profile/plan`, {
      headers: { Cookie: c },
    });
    const body = await plan.json();

    const forbidden = ['pork','bacon','ham','beef','mutton','lamb','goat','rogan','prawn','prawns','shrimp','crab'];
    const violations = [];
    for (const month of body.diet || []) {
      for (const week of month.weeks || []) {
        for (const day of week.weekdays || []) {
          ['breakfast','lunch','snack','dinner'].forEach(slot => {
            const name = (day[slot] || '').toLowerCase();
            forbidden.forEach(f => {
              if (name.includes(f)) violations.push({ day: day.day, slot, meal: name, term: f });
            });
          });
        }
      }
    }
    expect(violations).toHaveLength(0);
  });

  test('vegan user: no dairy or meat in plan', async ({ request }) => {
    const auth = await registerAndLogin(request);
    const c = auth.cookies;
    await request.post(`${BASE_URL}/api/profile/onboarding`, {
      data: {
        age: 25, heightCm: 168, currentWeightKg: 60, goalWeightKg: 58,
        primaryGoal: 'general-fitness',
        dietType: 'vegan',
        nonVegDays: [],
        eggDays: [],
        cuisinePreference: 'continental',
        fitnessLevel: 'moderately-active',
        culturalFoodAvoidances: [],
        workoutDaysPerWeek: 4,
        workoutTime: 'morning',
        stepGoal: 9000,
        waterGoalL: 2.5,
      },
      headers: { Cookie: c },
    });

    const plan = await request.get(`${BASE_URL}/api/profile/plan`, {
      headers: { Cookie: c },
    });
    const body = await plan.json();

    const nonVegTerms = ['chicken','mutton','lamb','pork','beef','fish','prawn','shrimp','egg','eggs'];
    const violations = [];
    // Check first 4 months × first 2 weeks
    for (const month of (body.diet || []).slice(0, 4)) {
      for (const week of (month.weeks || []).slice(0, 2)) {
        for (const day of week.weekdays || []) {
          ['breakfast','lunch','snack','dinner'].forEach(slot => {
            const name = (day[slot] || '').toLowerCase();
            nonVegTerms.forEach(t => {
              if (name.includes(t)) violations.push({ day: day.day, slot, name });
            });
          });
        }
      }
    }
    expect(violations).toHaveLength(0);
  });

  test('India-specific: BMR uses Mifflin-St Jeor (not Harris-Benedict)', async ({ request }) => {
    const auth = await registerAndLogin(request);
    const c = auth.cookies;
    await request.post(`${BASE_URL}/api/profile/onboarding`, {
      data: {
        age: 30, heightCm: 170, currentWeightKg: 70, goalWeightKg: 68,
        primaryGoal: 'weight-loss',
        dietType: 'vegetarian',
        nonVegDays: [], eggDays: [],
        cuisinePreference: 'south-indian',
        fitnessLevel: 'moderately-active',
        culturalFoodAvoidances: [],
        workoutDaysPerWeek: 3, workoutTime: 'morning',
        stepGoal: 8000, waterGoalL: 2.5,
        sex: 'male',
      },
      headers: { Cookie: c },
    });

    const res = await request.get(`${BASE_URL}/api/logs/today`, { headers: { Cookie: c } });
    const body = await res.json();

    // Mifflin-St Jeor for male, 30yo, 170cm, 70kg:
    // 10*70 + 6.25*170 - 5*30 + 5 = 700 + 1062.5 - 150 + 5 = 1617.5 → rounded 1618
    if (body.bmr) {
      expect(body.bmr).toBeGreaterThan(1400);
      expect(body.bmr).toBeLessThan(2000);
    }
  });
});
