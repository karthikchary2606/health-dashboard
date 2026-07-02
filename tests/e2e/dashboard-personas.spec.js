const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const http = require('http');

const personas = require('./fixtures/personas.json');
const HOST = '127.0.0.1';
const PORT = Number(process.env.E2E_PORT || 4173);
const BASE_URL = process.env.E2E_BASE_URL || `http://${HOST}:${PORT}`;

function createStaticServer() {
  const publicDir = path.resolve(__dirname, '../../public');
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
  };

  return http.createServer((req, res) => {
    const reqPath = req.url.split('?')[0];
    if (reqPath === '/js/progress.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end('function loadProgress() {} function updateBMI() {}');
      return;
    }
    if (reqPath === '/js/breathing.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end('function buildBreathingSection() {}');
      return;
    }

    const relative = reqPath === '/' ? '/index.html' : reqPath;
    const filePath = path.normalize(path.join(publicDir, relative));

    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

let server;

test.beforeAll(async () => {
  server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, HOST, resolve);
  });
});

test.afterAll(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
});

function normalize(value) {
  return String(value || '').toLowerCase();
}

async function setupPersonaRoutes(page, persona) {
  const fallbackCompletion = { percentage: 100, missingFields: [] };

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname === '/api/auth/me') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(persona.user) });
      return;
    }

    if (pathname === '/api/dashboard/overview') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(persona.overview) });
      return;
    }

    if (pathname === '/api/profile/plan') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(persona.plan) });
      return;
    }

    if (pathname === '/api/profile/completion') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(persona.overview.profileCompleteness || fallbackCompletion)
      });
      return;
    }

    if (pathname === '/api/sleep/history') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }

    if (pathname === '/api/logs' || pathname.startsWith('/api/logs/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      return;
    }

    if (pathname.startsWith('/api/breathing')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
}

for (const persona of personas) {
  test(`dashboard persona matrix: ${persona.id}`, async ({ page }) => {
    await setupPersonaRoutes(page, persona);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const timeline = page.locator('#timelineContainer');
    await expect(timeline).toHaveAttribute('data-state', 'ready');
    const timelineCount = await timeline.locator('.timeline-item').count();
    expect(timelineCount).toBeGreaterThan(0);

    await page.click('li.nav-item:has-text("Recipes")');
    await expect(page.locator('#recipeGrid .recipe-card').first()).toBeVisible();

    const mealTexts = await timeline.locator('.timeline-item .t-text').allTextContents();
    const mealsJoined = mealTexts.join(' ').toLowerCase();

    for (const term of (persona.constraints.mustExclude || [])) {
      expect(mealsJoined).not.toContain(normalize(term));
    }

    const includes = (persona.constraints.mustIncludeAny || []).map(normalize);
    if (includes.length > 0) {
      expect(includes.some((term) => mealsJoined.includes(term))).toBeTruthy();
    }

    const calorieTarget = (await page.locator('#calorieStat').innerText()).trim();
    expect(calorieTarget).not.toBe('—');
    expect(calorieTarget).not.toBe('-');
    expect(calorieTarget).not.toBe('');
    expect(calorieTarget).toMatch(/[0-9]/);
  });
}
