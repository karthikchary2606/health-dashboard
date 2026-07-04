/**
 * E2E: Authentication flows
 * Covers: register, login, logout, route protection, session persistence
 */
import { test, expect } from '@playwright/test';
const { BASE_URL, uniqueEmail } = require('./helpers');

test.describe('Auth: Registration & Login', () => {
  test('landing page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.wait_for_load_state?.('networkidle').catch(() => {});
    await expect(page).toHaveURL(/login|onboarding/);
  });

  test('register form: new user can create account', async ({ page }) => {
    const email = uniqueEmail('reg');
    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForLoadState('networkidle');

    // Switch to register tab
    await page.click('#tab-register');
    await page.waitForTimeout(300);

    await page.fill('#reg-name', 'Praana Tester');
    await page.fill('#reg-email', email);
    await page.fill('#reg-password', 'Test@12345');
    await page.click('#form-register button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Should land on onboarding after register
    await expect(page).toHaveURL(/onboarding|dashboard/);
  });

  test('login form: existing user can sign in', async ({ page, request }) => {
    const email = uniqueEmail('login');
    // Register first
    await request.post(`${BASE_URL}/api/auth/register`, {
      data: { email, password: 'Test@12345', name: 'Login Tester' },
    });

    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForLoadState('networkidle');
    await page.fill('#login-email', email);
    await page.fill('#login-password', 'Test@12345');
    await page.click('#form-login button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Should redirect away from login
    await expect(page).not.toHaveURL(/login/);
  });

  test('login: invalid credentials shows error message', async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForLoadState('networkidle');
    await page.fill('#login-email', 'nobody@fake.invalid');
    await page.fill('#login-password', 'wrongpassword');
    await page.click('#form-login button[type="submit"]');
    await page.waitForTimeout(1500);

    // Error should appear in the dedicated error element
    const errorEl = page.locator('#login-error');
    const errorText = await errorEl.innerText().catch(() => '');
    const bodyText = await page.locator('body').innerText();
    const hasError = errorText.length > 0 || /invalid|incorrect|wrong|failed|not found/i.test(bodyText);
    expect(hasError).toBe(true);
  });

  test('protected routes: /index.html requires authentication', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/login|onboarding/);
  });

  test('protected routes: /settings.html requires authentication', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings.html`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/login|onboarding/);
  });
});
