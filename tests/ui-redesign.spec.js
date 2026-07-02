const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/* --- Design System Validation --- */
test.describe('Design System', () => {
  test('design-system.css loads and exports CSS variables', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg-dark').trim()
    );
    expect(bgColor).toBe('#0f0f0f');
  });

  test('teal accent variable is set correctly', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const teal = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent-teal').trim()
    );
    expect(teal).toBe('#4ecca3');
  });

  test('gold accent variable is set correctly', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const gold = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent-gold').trim()
    );
    expect(gold).toBe('#c8a882');
  });
});

/* --- Navigation: Mobile Bottom Bar --- */
test.describe('Navigation — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('bottom nav is visible on mobile', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const nav = page.locator('.bottom-nav');
    await expect(nav).toBeVisible();
  });

  test('bottom nav has 5 items', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const items = page.locator('.bottom-nav .nav-item');
    await expect(items).toHaveCount(5);
  });

  test('dashboard nav item is active by default on index page', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const activeItem = page.locator('.nav-item--active[data-nav="dashboard"]');
    await expect(activeItem).toBeVisible();
  });
});

/* --- Navigation: Desktop Sidebar --- */
test.describe('Navigation — Desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('sidebar nav is visible on desktop', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const sidebar = page.locator('.sidebar-nav');
    await expect(sidebar).toBeVisible();
  });

  test('bottom nav is hidden on desktop', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeHidden();
  });
});

/* --- Dashboard Screen --- */
test.describe('Dashboard Screen', () => {
  test('dashboard hero section exists', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const hero = page.locator('.dashboard-hero');
    await expect(hero).toBeVisible();
  });

  test('metrics grid has 4 metric cards', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const cards = page.locator('.metric-card');
    await expect(cards).toHaveCount(4);
  });

  test('today plan section renders', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const section = page.locator('.today-section');
    await expect(section).toBeVisible();
  });
});

/* --- Login Screen --- */
test.describe('Login Screen', () => {
  test('login form renders with email and password inputs', async ({ page }) => {
    await page.goto(BASE_URL + '/login.html');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login submit button is visible', async ({ page }) => {
    await page.goto(BASE_URL + '/login.html');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('email input has associated label', async ({ page }) => {
    await page.goto(BASE_URL + '/login.html');
    const emailId = await page.locator('input[type="email"]').getAttribute('id');
    const label = page.locator('label[for="' + emailId + '"]');
    await expect(label).toBeVisible();
  });
});

/* --- Accessibility --- */
test.describe('Accessibility', () => {
  test('main content area has role=main', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('navigation has aria-label', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const nav = page.locator('nav[aria-label]').first();
    await expect(nav).toBeVisible();
  });

  test('all buttons have accessible names', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const buttons = await page.locator('button:not([aria-hidden])').all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      expect(text?.trim() || ariaLabel, 'Button must have text or aria-label').toBeTruthy();
    }
  });

  test('focus-visible outline present on interactive elements', async ({ page }) => {
    await page.goto(BASE_URL + '/index.html');
    const focusStyle = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.selectorText && rule.selectorText.includes('focus-visible')) {
              return rule.cssText;
            }
          }
        } catch (e) { /* cross-origin */ }
      }
      return null;
    });
    expect(focusStyle).toBeTruthy();
    expect(focusStyle).toContain('outline');
  });
});

/* --- Responsive: Component Library --- */
test.describe('Component Library — Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test('buttons render correctly at ' + vp.name, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE_URL + '/index.html');
      const btns = page.locator('.btn');
      const count = await btns.count();
      if (count > 0) {
        const firstBtn = btns.first();
        const height = await firstBtn.evaluate(el => el.offsetHeight);
        expect(height).toBeGreaterThanOrEqual(36);
      }
    });
  }
});
