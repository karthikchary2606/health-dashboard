/**
 * Shared test helpers for Praana health dashboard E2E tests.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Unique email per test run to avoid collisions
let _counter = 0;
function uniqueEmail(prefix = 'e2e') {
  return `${prefix}+${Date.now()}${_counter++}@test.local`;
}

/**
 * Register a new user via API and return cookie string.
 */
async function registerAndLogin(request, overrides = {}) {
  const email = uniqueEmail();
  const reg = await request.post(`${BASE_URL}/api/auth/register`, {
    data: { email, password: 'Test@12345', name: 'Praana Tester', ...overrides },
  });
  if (!reg.ok()) throw new Error(`Register failed: ${reg.status()} ${await reg.text()}`);

  // Register doesn't set a cookie — login separately
  const login = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password: 'Test@12345' },
  });
  if (!login.ok()) throw new Error(`Login failed: ${login.status()} ${await login.text()}`);
  const cookies = login.headers()['set-cookie'];
  return { email, cookies };
}

/**
 * Complete onboarding profile via API (bypasses multi-step UI for speed).
 */
async function completeProfileViaAPI(request, cookies) {
  const payload = {
    age: 28,
    heightCm: 170,
    currentWeightKg: 72,
    goalWeightKg: 68,
    primaryGoal: 'weight-loss',
    dietType: 'non-vegetarian',
    nonVegDays: ['Saturday', 'Sunday'],
    eggDays: ['Monday', 'Wednesday'],
    cuisinePreference: 'south-indian',
    fitnessLevel: 'moderately-active',
    culturalFoodAvoidances: ['pork', 'beef'],
    workoutDaysPerWeek: 4,
    workoutTime: 'morning',
    stepGoal: 8000,
    waterGoalL: 2.5,
  };
  const res = await request.post(`${BASE_URL}/api/profile/onboarding`, {
    data: payload,
    headers: { Cookie: cookies },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Profile complete failed: ${res.status()} ${body}`);
  }
  return res;
}

/**
 * Set cookie on a page context.
 */
async function setCookieOnPage(page, cookies) {
  if (!cookies) return;
  const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
  const parts = cookieStr.split(';')[0].split('=');
  await page.context().addCookies([{
    name: parts[0].trim(),
    value: parts.slice(1).join('=').trim(),
    domain: 'localhost',
    path: '/',
  }]);
}

module.exports = { BASE_URL, uniqueEmail, registerAndLogin, completeProfileViaAPI, setCookieOnPage };
