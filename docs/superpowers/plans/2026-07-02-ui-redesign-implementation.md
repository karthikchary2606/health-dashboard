# Health Dashboard UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the CRED-inspired premium minimalist redesign across all screens of the health dashboard.

**Architecture:** Mobile-first CSS design system with custom properties, reusable component library, and screen-specific stylesheets. Bottom navigation on mobile converts to sidebar on tablet/desktop. Zero external CSS frameworks — pure CSS variables for complete design control.

**Tech Stack:** CSS Custom Properties (variables), Vanilla JS, Playwright for E2E testing, Inter font (Google Fonts), HTML5 semantic markup.

---

## File Structure

**Create:**
- `public/css/design-system.css` — CSS variables: colors, typography, spacing, radii, transitions
- `public/css/components.css` — Reusable: buttons, cards, inputs, badges, progress rings
- `public/css/navigation.css` — Bottom nav (mobile), sidebar (tablet/desktop)
- `public/css/screens/dashboard.css` — Hero, metrics grid, quick stats
- `public/css/screens/diet.css` — Meal cards, filters, macro tracker
- `public/css/screens/workouts.css` — Progress rings, workout history, calendar
- `public/css/screens/onboarding.css` — Wizard steps, form layout
- `public/css/screens/settings.css` — Settings groups, toggles
- `public/js/bottom-nav.js` — Tab switching logic, active state management
- `public/js/animations.js` — Page transitions, component reveals, micro-interactions
- `tests/ui-redesign.spec.js` — Playwright E2E tests for all screens

**Modify:**
- `public/index.html` — Add nav container, dashboard section structure, link new CSS/JS
- `public/login.html` — Update to use component library styles
- `public/profile-complete.html` — Update form styling using component library
- `public/settings.html` — Restructure into settings groups
- `public/admin.html` — Minor style updates for consistency

---

### Task 1: CSS Design System Foundation

**Files:**
- Create: `public/css/design-system.css`
- Modify: `public/index.html` (link CSS in head)

- [ ] **Step 1: Create the CSS directory structure**

```bash
mkdir -p /Users/kkondoju/projects/health-dashboard/public/css/screens
```

Expected: no output, directories created.

- [ ] **Step 2: Create design-system.css with all CSS variables**

Create `public/css/design-system.css`:

```css
/* =============================================
   HEALTH DASHBOARD — DESIGN SYSTEM
   CRED-inspired Premium Minimalist
   Base unit: 4px grid
   ============================================= */

:root {
  /* --- Color Palette --- */
  --color-bg-dark: #0f0f0f;
  --color-bg-light: #faf8f5;
  --color-bg-card: #1c1c1e;
  --color-bg-elevated: #252527;

  --color-accent-gold: #c8a882;
  --color-accent-teal: #4ecca3;

  --color-text-primary: #f5f5f0;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #5a5a5a;
  --color-text-on-light: #1a1a1a;

  --color-success: #4ecca3;
  --color-warning: #ffc107;
  --color-danger: #ff6b6b;
  --color-info: #5dade2;
  --color-disabled: #5a5a5a;

  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-light: rgba(200, 168, 130, 0.2);

  /* --- Typography --- */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;

  --font-size-h1: 32px;
  --font-size-h2: 24px;
  --font-size-h3: 18px;
  --font-size-body: 16px;
  --font-size-small: 14px;
  --font-size-label: 12px;

  --font-weight-bold: 700;
  --font-weight-semibold: 600;
  --font-weight-medium: 500;
  --font-weight-regular: 400;

  --line-height-h1: 1.2;
  --line-height-h2: 1.3;
  --line-height-h3: 1.4;
  --line-height-body: 1.6;
  --line-height-small: 1.5;
  --line-height-label: 1.4;

  --letter-spacing-heading: 0.5px;
  --letter-spacing-label: 0.75px;

  /* --- Spacing (4px grid) --- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* --- Border Radius --- */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* --- Shadows --- */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-glow-teal: 0 0 20px rgba(78, 204, 163, 0.2);
  --shadow-glow-gold: 0 0 20px rgba(200, 168, 130, 0.2);

  /* --- Transitions --- */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
  --transition-bounce: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* --- Layout --- */
  --nav-height-mobile: 64px;
  --nav-width-sidebar: 240px;
  --content-max-width: 480px;
  --content-max-width-desktop: 1200px;

  /* --- Z-index layers --- */
  --z-base: 1;
  --z-nav: 100;
  --z-overlay: 200;
  --z-modal: 300;
  --z-toast: 400;
}

/* --- Desktop Scale --- */
@media (min-width: 1024px) {
  :root {
    --font-size-h1: 40px;
    --font-size-h2: 28px;
    --font-size-h3: 20px;
  }
}

/* --- Global Reset & Base --- */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
  color: var(--color-text-primary);
  background-color: var(--color-bg-dark);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* --- Typography Utilities --- */
h1, .h1 {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-h1);
  letter-spacing: var(--letter-spacing-heading);
}

h2, .h2 {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-h2);
  letter-spacing: var(--letter-spacing-heading);
}

h3, .h3 {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-h3);
}

p, .body {
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
}

.small {
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
}

.label {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-label);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
}

/* --- Accessibility: Reduced Motion --- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* --- Focus Visible --- */
:focus-visible {
  outline: 2px solid var(--color-accent-teal);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* --- Screen layout container --- */
.screen {
  min-height: 100vh;
  padding-bottom: calc(var(--nav-height-mobile) + var(--space-4));
  background-color: var(--color-bg-dark);
}

@media (min-width: 768px) {
  .screen {
    padding-bottom: 0;
    padding-left: var(--nav-width-sidebar);
  }
}

.screen__content {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
}

@media (min-width: 1024px) {
  .screen__content {
    max-width: var(--content-max-width-desktop);
    padding: var(--space-8) var(--space-12);
  }
}
```

- [ ] **Step 3: Verify CSS file is valid**

```bash
node -e "const fs = require('fs'); const css = fs.readFileSync('public/css/design-system.css', 'utf8'); console.log('Lines:', css.split('\n').length, '| Variables:', (css.match(/--[a-z]/g) || []).length); console.log('OK');"
```

Expected output:
```
Lines: 165 | Variables: 48
OK
```

- [ ] **Step 4: Link design-system.css in index.html head**

In `public/index.html`, add inside `<head>` before any existing `<link>` tags:

```html
<link rel="stylesheet" href="/css/design-system.css">
```

- [ ] **Step 5: Commit**

```bash
git add public/css/design-system.css public/index.html
git commit -m "feat: add CSS design system foundation with CRED color palette and typography scale

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Reusable Component Library

**Files:**
- Create: `public/css/components.css`
- Modify: `public/index.html` (link CSS)

- [ ] **Step 1: Create components.css with buttons, cards, inputs, badges, progress**

Create `public/css/components.css`:

```css
/* =============================================
   COMPONENT LIBRARY
   Reusable UI components built on design-system.css
   ============================================= */

/* --- Buttons --- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all var(--transition-base);
  text-decoration: none;
  white-space: nowrap;
  min-height: 44px;
  min-width: 44px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.btn--primary {
  background-color: var(--color-accent-teal);
  color: var(--color-bg-dark);
}

.btn--primary:hover {
  background-color: #3db891;
  box-shadow: var(--shadow-glow-teal);
  transform: translateY(-1px);
}

.btn--primary:active {
  transform: translateY(0);
  box-shadow: none;
}

.btn--secondary {
  background-color: transparent;
  color: var(--color-accent-gold);
  border: 1.5px solid var(--color-accent-gold);
}

.btn--secondary:hover {
  background-color: rgba(200, 168, 130, 0.08);
  box-shadow: var(--shadow-glow-gold);
}

.btn--ghost {
  background-color: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn--ghost:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.btn--danger {
  background-color: var(--color-danger);
  color: #fff;
}

.btn--sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-small);
  min-height: 36px;
}

.btn--lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--font-size-h3);
  min-height: 52px;
}

.btn--full {
  width: 100%;
}

.btn--icon {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: var(--radius-md);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* --- Cards --- */
.card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  transition: all var(--transition-base);
}

.card--elevated {
  background-color: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
}

.card--interactive {
  cursor: pointer;
}

.card--interactive:hover {
  border-color: var(--color-border-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card--interactive:active {
  transform: translateY(0);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.card__title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.card__subtitle {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

/* --- Inputs --- */
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-label {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
}

.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-bg-elevated);
  color: var(--color-text-primary);
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  min-height: 48px;
  transition: border-color var(--transition-fast);
  outline: none;
}

.input:focus {
  border-color: var(--color-accent-teal);
  box-shadow: 0 0 0 3px rgba(78, 204, 163, 0.12);
}

.input::placeholder {
  color: var(--color-text-muted);
}

.input--error {
  border-color: var(--color-danger);
}

.input-error-msg {
  font-size: var(--font-size-small);
  color: var(--color-danger);
}

/* --- Badges --- */
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
}

.badge--success {
  background-color: rgba(78, 204, 163, 0.15);
  color: var(--color-success);
}

.badge--warning {
  background-color: rgba(255, 193, 7, 0.15);
  color: var(--color-warning);
}

.badge--danger {
  background-color: rgba(255, 107, 107, 0.15);
  color: var(--color-danger);
}

.badge--info {
  background-color: rgba(93, 173, 226, 0.15);
  color: var(--color-info);
}

.badge--gold {
  background-color: rgba(200, 168, 130, 0.15);
  color: var(--color-accent-gold);
}

/* --- Progress Ring (SVG-based) --- */
.progress-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring__svg {
  transform: rotate(-90deg);
}

.progress-ring__track {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 4;
}

.progress-ring__fill {
  fill: none;
  stroke: var(--color-accent-teal);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dashoffset var(--transition-slow);
}

.progress-ring__fill--gold {
  stroke: var(--color-accent-gold);
}

.progress-ring__label {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-ring__value {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}

.progress-ring__unit {
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* --- Toggle Switch --- */
.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  min-height: 44px;
  gap: var(--space-3);
}

.toggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle__track {
  width: 48px;
  height: 28px;
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  transition: all var(--transition-base);
  position: relative;
  flex-shrink: 0;
}

.toggle__track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background-color: var(--color-text-muted);
  border-radius: var(--radius-full);
  transition: all var(--transition-bounce);
}

.toggle__input:checked + .toggle__track {
  background-color: rgba(78, 204, 163, 0.2);
  border-color: var(--color-accent-teal);
}

.toggle__input:checked + .toggle__track::after {
  transform: translateX(20px);
  background-color: var(--color-accent-teal);
}

/* --- Divider --- */
.divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--space-4) 0;
}

/* --- Avatar --- */
.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-elevated);
  border: 2px solid var(--color-accent-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-small);
  color: var(--color-accent-gold);
  flex-shrink: 0;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* --- Loading Skeleton --- */
.skeleton {
  background: linear-gradient(90deg, var(--color-bg-card) 25%, var(--color-bg-elevated) 50%, var(--color-bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 2: Link components.css in index.html after design-system.css**

In `public/index.html` `<head>`, add after the design-system.css link:

```html
<link rel="stylesheet" href="/css/components.css">
```

- [ ] **Step 3: Verify no CSS syntax errors**

```bash
node -e "const fs = require('fs'); const css = fs.readFileSync('public/css/components.css', 'utf8'); const lines = css.split('\n').length; const opens = (css.match(/\{/g)||[]).length; const closes = (css.match(/\}/g)||[]).length; console.log('Lines:', lines, '| Braces balanced:', opens === closes); if(opens !== closes) process.exit(1);"
```

Expected:
```
Lines: 220 | Braces balanced: true
```

- [ ] **Step 4: Commit**

```bash
git add public/css/components.css public/index.html
git commit -m "feat: add reusable component library (buttons, cards, inputs, badges, progress rings, toggles)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Bottom Navigation Component

**Files:**
- Create: `public/css/navigation.css`
- Create: `public/js/bottom-nav.js`
- Modify: `public/index.html` (add nav HTML, link CSS/JS)

- [ ] **Step 1: Create navigation.css with mobile bottom nav and tablet/desktop sidebar**

Create `public/css/navigation.css`:

```css
/* =============================================
   NAVIGATION COMPONENT
   Mobile: Fixed bottom bar (64px)
   Tablet+: Left sidebar (240px)
   ============================================= */

/* --- Bottom Nav (Mobile) --- */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nav-height-mobile);
  background-color: var(--color-bg-card);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 var(--space-2);
  z-index: var(--z-nav);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
  background: none;
  border: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-item__icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
  font-size: 20px;
}

.nav-item__label {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  letter-spacing: 0.5px;
  transition: color var(--transition-fast);
  white-space: nowrap;
}

.nav-item--active .nav-item__icon,
.nav-item--active .nav-item__label {
  color: var(--color-accent-teal);
}

.nav-item--active {
  background-color: rgba(78, 204, 163, 0.08);
}

.nav-item:hover .nav-item__icon,
.nav-item:hover .nav-item__label {
  color: var(--color-text-primary);
}

/* Active indicator dot */
.nav-item--active::before {
  content: '';
  position: absolute;
  top: -1px;
  width: 24px;
  height: 2px;
  background-color: var(--color-accent-teal);
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

/* --- Sidebar Nav (Tablet/Desktop) --- */
.sidebar-nav {
  display: none;
}

@media (min-width: 768px) {
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--nav-width-sidebar);
    background-color: var(--color-bg-card);
    border-right: 1px solid var(--color-border);
    padding: var(--space-8) var(--space-4);
    z-index: var(--z-nav);
    overflow-y: auto;
  }
}

.sidebar-nav__logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-3) var(--space-8);
  text-decoration: none;
}

.sidebar-nav__logo-mark {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--color-accent-teal), var(--color-accent-gold));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-body);
  color: var(--color-bg-dark);
}

.sidebar-nav__app-name {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.sidebar-nav__section {
  margin-bottom: var(--space-6);
}

.sidebar-nav__section-label {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  padding: 0 var(--space-3);
  margin-bottom: var(--space-2);
}

.sidebar-nav .nav-item {
  flex-direction: row;
  justify-content: flex-start;
  width: 100%;
  gap: var(--space-3);
  padding: var(--space-3);
  margin-bottom: 2px;
}

.sidebar-nav .nav-item--active::before {
  top: 0;
  left: -1px;
  right: auto;
  width: 3px;
  height: 100%;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.sidebar-nav .nav-item__label {
  font-size: var(--font-size-small);
  letter-spacing: 0;
}

.sidebar-nav__footer {
  margin-top: auto;
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}
```

- [ ] **Step 2: Create bottom-nav.js for tab switching**

Create `public/js/bottom-nav.js`:

```javascript
/* Bottom Navigation — Tab switching and active state management */

(function () {
  'use strict';

  const NAV_SCREENS = {
    dashboard: '/index.html',
    diet: '/diet.html',
    workouts: '/workouts.html',
    progress: '/progress.html',
    settings: '/settings.html',
  };

  function getActiveScreen() {
    const path = window.location.pathname;
    if (path.includes('diet')) return 'diet';
    if (path.includes('workout')) return 'workouts';
    if (path.includes('progress')) return 'progress';
    if (path.includes('settings')) return 'settings';
    return 'dashboard';
  }

  function setActiveNavItem(screenKey) {
    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.remove('nav-item--active');
      el.setAttribute('aria-current', 'false');
    });
    const activeEl = document.querySelector('[data-nav="' + screenKey + '"]');
    if (activeEl) {
      activeEl.classList.add('nav-item--active');
      activeEl.setAttribute('aria-current', 'page');
    }
  }

  function initNav() {
    const active = getActiveScreen();
    setActiveNavItem(active);

    document.querySelectorAll('.nav-item[data-nav]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        const key = el.getAttribute('data-nav');
        if (NAV_SCREENS[key]) {
          window.location.href = NAV_SCREENS[key];
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
```

- [ ] **Step 3: Add navigation HTML to index.html**

In `public/index.html`, add before the closing `</body>` tag:

```html
<!-- Bottom Navigation (mobile) -->
<nav class="bottom-nav" role="navigation" aria-label="Main navigation">
  <button class="nav-item" data-nav="dashboard" aria-label="Dashboard">
    <span class="nav-item__icon">⊞</span>
    <span class="nav-item__label">Home</span>
  </button>
  <button class="nav-item" data-nav="diet" aria-label="Diet">
    <span class="nav-item__icon">🥗</span>
    <span class="nav-item__label">Diet</span>
  </button>
  <button class="nav-item" data-nav="workouts" aria-label="Workouts">
    <span class="nav-item__icon">💪</span>
    <span class="nav-item__label">Workouts</span>
  </button>
  <button class="nav-item" data-nav="progress" aria-label="Progress">
    <span class="nav-item__icon">📈</span>
    <span class="nav-item__label">Progress</span>
  </button>
  <button class="nav-item" data-nav="settings" aria-label="Settings">
    <span class="nav-item__icon">⚙</span>
    <span class="nav-item__label">Settings</span>
  </button>
</nav>

<!-- Sidebar Navigation (tablet/desktop) -->
<nav class="sidebar-nav" role="navigation" aria-label="Main navigation">
  <a href="/index.html" class="sidebar-nav__logo">
    <div class="sidebar-nav__logo-mark">H</div>
    <span class="sidebar-nav__app-name">HealthPulse</span>
  </a>
  <div class="sidebar-nav__section">
    <p class="sidebar-nav__section-label">Main</p>
    <button class="nav-item" data-nav="dashboard">
      <span class="nav-item__icon">⊞</span>
      <span class="nav-item__label">Dashboard</span>
    </button>
    <button class="nav-item" data-nav="diet">
      <span class="nav-item__icon">🥗</span>
      <span class="nav-item__label">Diet</span>
    </button>
    <button class="nav-item" data-nav="workouts">
      <span class="nav-item__icon">💪</span>
      <span class="nav-item__label">Workouts</span>
    </button>
    <button class="nav-item" data-nav="progress">
      <span class="nav-item__icon">📈</span>
      <span class="nav-item__label">Progress</span>
    </button>
  </div>
  <div class="sidebar-nav__footer">
    <button class="nav-item" data-nav="settings">
      <span class="nav-item__icon">⚙</span>
      <span class="nav-item__label">Settings</span>
    </button>
  </div>
</nav>

<script src="/js/bottom-nav.js"></script>
```

Also link navigation.css in `<head>`:

```html
<link rel="stylesheet" href="/css/navigation.css">
```

- [ ] **Step 4: Commit**

```bash
git add public/css/navigation.css public/js/bottom-nav.js public/index.html
git commit -m "feat: add responsive navigation (bottom bar mobile, sidebar tablet/desktop)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 4: Dashboard Screen Redesign

**Files:**
- Create: `public/css/screens/dashboard.css`
- Modify: `public/index.html` (restructure body content)

- [ ] **Step 1: Create dashboard.css with hero, metrics grid, quick stats**

Create `public/css/screens/dashboard.css`:

```css
/* =============================================
   DASHBOARD SCREEN
   ============================================= */

/* --- Header Bar --- */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-4) var(--space-4);
  position: sticky;
  top: 0;
  background-color: var(--color-bg-dark);
  z-index: var(--z-base);
}

.dashboard-header__greeting {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
}

.dashboard-header__name {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-top: 2px;
}

.dashboard-header__actions {
  display: flex;
  gap: var(--space-2);
}

/* --- Hero Section --- */
.dashboard-hero {
  margin: 0 var(--space-4) var(--space-6);
  padding: var(--space-6);
  background: linear-gradient(135deg, var(--color-bg-elevated) 0%, rgba(78, 204, 163, 0.08) 100%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}

.dashboard-hero::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, rgba(78, 204, 163, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.dashboard-hero__label {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  color: var(--color-accent-teal);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}

.dashboard-hero__value {
  font-size: 48px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
  letter-spacing: -1px;
}

.dashboard-hero__unit {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-regular);
  color: var(--color-text-secondary);
  margin-left: var(--space-1);
}

.dashboard-hero__subtitle {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
}

.dashboard-hero__progress {
  margin-top: var(--space-4);
  height: 4px;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.dashboard-hero__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent-teal), var(--color-accent-gold));
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

/* --- Metrics Grid --- */
.metrics-section {
  padding: 0 var(--space-4) var(--space-6);
}

.metrics-section__title {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  margin-bottom: var(--space-3);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

@media (min-width: 480px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.metric-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  transition: all var(--transition-base);
}

.metric-card:hover {
  border-color: var(--color-border-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.metric-card__icon {
  font-size: 20px;
  margin-bottom: var(--space-3);
  display: block;
}

.metric-card__value {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1.2;
}

.metric-card__label {
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  margin-top: var(--space-1);
}

.metric-card__delta {
  font-size: var(--font-size-small);
  margin-top: var(--space-2);
}

.metric-card__delta--up {
  color: var(--color-success);
}

.metric-card__delta--down {
  color: var(--color-danger);
}

/* --- Today's Plan Section --- */
.today-section {
  padding: 0 var(--space-4) var(--space-6);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.section-link {
  font-size: var(--font-size-small);
  color: var(--color-accent-teal);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
}

.today-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-3);
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}

.today-card__icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: rgba(78, 204, 163, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.today-card__icon-wrap--gold {
  background-color: rgba(200, 168, 130, 0.1);
}

.today-card__content {
  flex: 1;
}

.today-card__title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.today-card__meta {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.today-card__action {
  flex-shrink: 0;
}
```

- [ ] **Step 2: Restructure public/index.html body with new dashboard layout**

Replace the inner body content (between nav tags) with:

```html
<div class="screen" id="dashboard-screen">
  <div class="screen__content">
    <!-- Header -->
    <header class="dashboard-header">
      <div>
        <p class="dashboard-header__greeting">Good morning</p>
        <h1 class="dashboard-header__name" id="dashboard-user-name">Karthik</h1>
      </div>
      <div class="dashboard-header__actions">
        <button class="btn btn--icon btn--ghost" aria-label="Notifications">🔔</button>
        <div class="avatar" id="dashboard-avatar">K</div>
      </div>
    </header>

    <!-- Hero: Daily Calories -->
    <section class="dashboard-hero" aria-label="Daily calorie goal">
      <p class="dashboard-hero__label">Today's Calories</p>
      <div>
        <span class="dashboard-hero__value" id="calories-consumed">0</span>
        <span class="dashboard-hero__unit">/ <span id="calories-goal">2000</span> kcal</span>
      </div>
      <p class="dashboard-hero__subtitle" id="calories-remaining">Loading your plan…</p>
      <div class="dashboard-hero__progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
        <div class="dashboard-hero__progress-fill" id="calories-progress" style="width: 0%"></div>
      </div>
    </section>

    <!-- Metrics Grid -->
    <section class="metrics-section" aria-label="Today's metrics">
      <p class="metrics-section__title">Today's Stats</p>
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-card__icon">💧</span>
          <p class="metric-card__value" id="metric-water">0</p>
          <p class="metric-card__label">Water (L)</p>
        </div>
        <div class="metric-card">
          <span class="metric-card__icon">🏃</span>
          <p class="metric-card__value" id="metric-steps">0</p>
          <p class="metric-card__label">Steps</p>
        </div>
        <div class="metric-card">
          <span class="metric-card__icon">😴</span>
          <p class="metric-card__value" id="metric-sleep">0h</p>
          <p class="metric-card__label">Sleep</p>
        </div>
        <div class="metric-card">
          <span class="metric-card__icon">🔥</span>
          <p class="metric-card__value" id="metric-burned">0</p>
          <p class="metric-card__label">Burned</p>
        </div>
      </div>
    </section>

    <!-- Today's Plan -->
    <section class="today-section" aria-label="Today's plan">
      <div class="section-header">
        <h2 class="section-title">Today's Plan</h2>
        <a href="/diet.html" class="section-link">See all</a>
      </div>
      <div id="today-plan-container">
        <!-- Populated by dashboard.js -->
      </div>
    </section>
  </div>
</div>
```

Also link the new CSS in `<head>`:

```html
<link rel="stylesheet" href="/css/screens/dashboard.css">
```

- [ ] **Step 3: Commit**

```bash
git add public/css/screens/dashboard.css public/index.html
git commit -m "feat: redesign dashboard screen with hero, metrics grid, and today's plan sections

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: Diet/Meals Screen Redesign

**Files:**
- Create: `public/css/screens/diet.css`
- Modify: `public/index.html` (diet section if inline) or create `public/diet.html`

- [ ] **Step 1: Create diet.css with meal cards, filters, macro tracker**

Create `public/css/screens/diet.css`:

```css
/* =============================================
   DIET / MEALS SCREEN
   ============================================= */

/* --- Screen Header --- */
.diet-header {
  padding: var(--space-5) var(--space-4) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.diet-header__title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* --- Macro Tracker --- */
.macro-tracker {
  margin: 0 var(--space-4) var(--space-6);
  padding: var(--space-5);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.macro-tracker__title {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  margin-bottom: var(--space-4);
}

.macro-tracker__row {
  display: flex;
  gap: var(--space-4);
  align-items: flex-end;
}

.macro-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.macro-bar-group__label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.macro-bar-group__name {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.macro-bar-group__value {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.macro-bar {
  height: 6px;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.macro-bar__fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.macro-bar__fill--carbs {
  background-color: var(--color-accent-teal);
}

.macro-bar__fill--protein {
  background-color: var(--color-accent-gold);
}

.macro-bar__fill--fat {
  background-color: var(--color-info);
}

.macro-tracker__total {
  display: flex;
  justify-content: space-between;
  padding-top: var(--space-4);
  margin-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.macro-tracker__total-label {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.macro-tracker__total-value {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* --- Meal Filters --- */
.diet-filters {
  display: flex;
  gap: var(--space-2);
  padding: 0 var(--space-4) var(--space-4);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.diet-filters::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  border: 1.5px solid var(--color-border);
  background-color: transparent;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
}

.filter-chip:hover {
  border-color: var(--color-accent-teal);
  color: var(--color-accent-teal);
}

.filter-chip--active {
  background-color: rgba(78, 204, 163, 0.12);
  border-color: var(--color-accent-teal);
  color: var(--color-accent-teal);
}

/* --- Meal Time Sections --- */
.meal-time-section {
  padding: 0 var(--space-4) var(--space-4);
}

.meal-time-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.meal-time-section__title {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
}

.meal-time-section__calories {
  font-size: var(--font-size-small);
  color: var(--color-accent-gold);
  font-weight: var(--font-weight-medium);
}

/* --- Meal Card --- */
.meal-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-3);
  display: flex;
  gap: var(--space-3);
  align-items: center;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.meal-card:hover {
  border-color: var(--color-border-light);
  transform: translateX(2px);
}

.meal-card__image {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-elevated);
  object-fit: cover;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.meal-card__info {
  flex: 1;
  min-width: 0;
}

.meal-card__name {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meal-card__details {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-1);
}

.meal-card__detail {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.meal-card__macros {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.macro-pill {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  background-color: var(--color-bg-elevated);
  color: var(--color-text-secondary);
}

.macro-pill--c { color: var(--color-accent-teal); }
.macro-pill--p { color: var(--color-accent-gold); }
.macro-pill--f { color: var(--color-info); }

.meal-card__calories {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.meal-card__calories-unit {
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-regular);
}

/* Add Meal Button */
.add-meal-btn {
  width: 100%;
  padding: var(--space-4);
  background-color: transparent;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 52px;
}

.add-meal-btn:hover {
  border-color: var(--color-accent-teal);
  color: var(--color-accent-teal);
  background-color: rgba(78, 204, 163, 0.04);
}
```

- [ ] **Step 2: Verify CSS braces are balanced**

```bash
node -e "const fs = require('fs'); const css = fs.readFileSync('public/css/screens/diet.css', 'utf8'); const opens = (css.match(/\{/g)||[]).length; const closes = (css.match(/\}/g)||[]).length; console.log('Braces balanced:', opens === closes, '| opens:', opens, '| closes:', closes); if(opens !== closes) process.exit(1);"
```

Expected:
```
Braces balanced: true | opens: 40 | closes: 40
```

- [ ] **Step 3: Link diet.css in the relevant HTML and commit**

In any HTML file that uses diet screen (e.g., `public/index.html` or create `public/diet.html` if separate):

```html
<link rel="stylesheet" href="/css/screens/diet.css">
```

- [ ] **Step 4: Commit**

```bash
git add public/css/screens/diet.css
git commit -m "feat: add diet/meals screen styles with meal cards, macro tracker, and filter chips

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 6: Workouts Screen Redesign

**Files:**
- Create: `public/css/screens/workouts.css`

- [ ] **Step 1: Create workouts.css**

Create `public/css/screens/workouts.css`:

```css
/* =============================================
   WORKOUTS SCREEN
   ============================================= */

/* --- Screen Header --- */
.workouts-header {
  padding: var(--space-5) var(--space-4) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.workouts-header__title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* --- Weekly Summary Rings --- */
.workout-summary {
  margin: 0 var(--space-4) var(--space-6);
  padding: var(--space-5);
  background: linear-gradient(135deg, var(--color-bg-elevated), rgba(200, 168, 130, 0.06));
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.workout-summary__rings {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: var(--space-4);
}

.workout-ring-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.workout-ring-wrap__label {
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  text-align: center;
}

/* --- Weekly Activity Bar Chart --- */
.weekly-activity {
  padding: 0 var(--space-4) var(--space-6);
}

.activity-bars {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  height: 80px;
}

.activity-bar-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  height: 100%;
  justify-content: flex-end;
}

.activity-bar-day__bar {
  width: 100%;
  border-radius: var(--radius-sm) var(--radius-sm) 2px 2px;
  background-color: var(--color-border);
  min-height: 8px;
  transition: height var(--transition-slow);
}

.activity-bar-day--active .activity-bar-day__bar {
  background: linear-gradient(180deg, var(--color-accent-teal), rgba(78, 204, 163, 0.5));
}

.activity-bar-day--today .activity-bar-day__bar {
  background: linear-gradient(180deg, var(--color-accent-gold), rgba(200, 168, 130, 0.5));
}

.activity-bar-day__label {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.activity-bar-day--today .activity-bar-day__label {
  color: var(--color-accent-gold);
}

/* --- Workout History List --- */
.workout-history {
  padding: 0 var(--space-4) var(--space-6);
}

.workout-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.workout-card:hover {
  border-color: var(--color-border-light);
  transform: translateX(2px);
}

.workout-card__icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: rgba(200, 168, 130, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.workout-card__content {
  flex: 1;
}

.workout-card__name {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.workout-card__meta {
  display: flex;
  gap: var(--space-4);
}

.workout-card__stat {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.workout-card__intensity {
  flex-shrink: 0;
}

/* --- Intensity Indicators --- */
.intensity {
  display: flex;
  gap: 3px;
  align-items: center;
}

.intensity__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--color-border);
}

.intensity--low .intensity__dot:nth-child(1) { background-color: var(--color-success); }
.intensity--medium .intensity__dot:nth-child(-n+2) { background-color: var(--color-warning); }
.intensity--high .intensity__dot { background-color: var(--color-danger); }

/* --- Workout Start CTA --- */
.workout-start-card {
  margin: 0 var(--space-4) var(--space-6);
  padding: var(--space-6);
  background: linear-gradient(135deg, rgba(78, 204, 163, 0.12), rgba(200, 168, 130, 0.06));
  border-radius: var(--radius-xl);
  border: 1px solid rgba(78, 204, 163, 0.2);
  text-align: center;
}

.workout-start-card__title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.workout-start-card__subtitle {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-5);
}
```

- [ ] **Step 2: Verify CSS**

```bash
node -e "const fs = require('fs'); const css = fs.readFileSync('public/css/screens/workouts.css', 'utf8'); const opens = (css.match(/\{/g)||[]).length; const closes = (css.match(/\}/g)||[]).length; console.log('Braces balanced:', opens === closes); if(opens !== closes) process.exit(1); console.log('OK');"
```

Expected: `Braces balanced: true` then `OK`

- [ ] **Step 3: Commit**

```bash
git add public/css/screens/workouts.css
git commit -m "feat: add workouts screen styles with progress rings, activity bars, and workout history cards

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: Onboarding Wizard Redesign

**Files:**
- Create: `public/css/screens/onboarding.css`
- Modify: `public/profile-complete.html` (link CSS)

- [ ] **Step 1: Create onboarding.css with wizard steps, progress, form layout**

Create `public/css/screens/onboarding.css`:

```css
/* =============================================
   ONBOARDING WIZARD
   ============================================= */

.onboarding-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-dark);
  padding: var(--space-6) var(--space-4);
  max-width: var(--content-max-width);
  margin: 0 auto;
}

/* --- Step Progress Indicator --- */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background-color: var(--color-border);
  transition: all var(--transition-base);
  cursor: default;
}

.step-dot--completed {
  background-color: var(--color-accent-teal);
  width: 24px;
  border-radius: 4px;
}

.step-dot--active {
  background-color: var(--color-accent-teal);
  width: 16px;
  border-radius: 4px;
  box-shadow: var(--shadow-glow-teal);
}

.step-counter {
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  margin-bottom: var(--space-3);
  display: block;
}

/* --- Wizard Content --- */
.wizard-heading {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-h1);
  letter-spacing: var(--letter-spacing-heading);
  margin-bottom: var(--space-2);
}

.wizard-subheading {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-body);
  margin-bottom: var(--space-8);
}

.wizard-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* --- Option Cards (for selections like goals, diet type) --- */
.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.option-card {
  padding: var(--space-4);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  -webkit-tap-highlight-color: transparent;
}

.option-card:hover {
  border-color: var(--color-accent-teal);
  background-color: rgba(78, 204, 163, 0.04);
}

.option-card--selected {
  border-color: var(--color-accent-teal);
  background-color: rgba(78, 204, 163, 0.08);
}

.option-card__icon {
  font-size: 28px;
}

.option-card__label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* --- Step Navigation Buttons --- */
.wizard-nav {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-8);
  padding-top: var(--space-5);
}

.wizard-nav .btn--back {
  flex-shrink: 0;
}

.wizard-nav .btn--next {
  flex: 1;
}

/* --- Dietary Exception Toggle Row --- */
.diet-exception-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.diet-exception-row__info {
  flex: 1;
}

.diet-exception-row__label {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.diet-exception-row__desc {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin-top: 2px;
}
```

- [ ] **Step 2: Link onboarding.css in profile-complete.html**

In `public/profile-complete.html`, add inside `<head>`:

```html
<link rel="stylesheet" href="/css/design-system.css">
<link rel="stylesheet" href="/css/components.css">
<link rel="stylesheet" href="/css/screens/onboarding.css">
```

- [ ] **Step 3: Commit**

```bash
git add public/css/screens/onboarding.css public/profile-complete.html
git commit -m "feat: add onboarding wizard styles with step indicators, option cards, and navigation

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 8: Settings Screen Redesign

**Files:**
- Create: `public/css/screens/settings.css`
- Modify: `public/settings.html` (link CSS)

- [ ] **Step 1: Create settings.css with settings groups and items**

Create `public/css/screens/settings.css`:

```css
/* =============================================
   SETTINGS SCREEN
   ============================================= */

.settings-header {
  padding: var(--space-5) var(--space-4) var(--space-6);
}

.settings-header__title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* --- Profile Banner --- */
.settings-profile {
  margin: 0 var(--space-4) var(--space-6);
  padding: var(--space-5);
  background-color: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.settings-profile__avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-elevated);
  border: 2px solid var(--color-accent-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent-gold);
  flex-shrink: 0;
}

.settings-profile__info {
  flex: 1;
}

.settings-profile__name {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.settings-profile__email {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* --- Settings Groups --- */
.settings-group {
  margin: 0 var(--space-4) var(--space-5);
}

.settings-group__label {
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
  padding: 0 var(--space-1);
  margin-bottom: var(--space-2);
  display: block;
}

.settings-list {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

/* --- Settings Item --- */
.settings-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  min-height: 56px;
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
}

.settings-item + .settings-item {
  border-top: 1px solid var(--color-border);
}

.settings-item:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.settings-item:active {
  background-color: rgba(255, 255, 255, 0.05);
}

.settings-item__icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background-color: var(--color-bg-elevated);
}

.settings-item__icon-wrap--teal {
  background-color: rgba(78, 204, 163, 0.12);
}

.settings-item__icon-wrap--gold {
  background-color: rgba(200, 168, 130, 0.12);
}

.settings-item__icon-wrap--danger {
  background-color: rgba(255, 107, 107, 0.12);
}

.settings-item__content {
  flex: 1;
}

.settings-item__label {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.settings-item__desc {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.settings-item--danger .settings-item__label {
  color: var(--color-danger);
}

.settings-item__trailing {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.settings-item__chevron {
  color: var(--color-text-muted);
  font-size: 16px;
}

.settings-item__value {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

/* --- App Version Footer --- */
.settings-footer {
  padding: var(--space-6) var(--space-4) var(--space-8);
  text-align: center;
}

.settings-footer__version {
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
}
```

- [ ] **Step 2: Link settings.css in settings.html**

In `public/settings.html`, add inside `<head>`:

```html
<link rel="stylesheet" href="/css/design-system.css">
<link rel="stylesheet" href="/css/components.css">
<link rel="stylesheet" href="/css/screens/settings.css">
```

- [ ] **Step 3: Commit**

```bash
git add public/css/screens/settings.css public/settings.html
git commit -m "feat: add settings screen styles with profile banner, grouped items, and toggles

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 9: Login Screen Update

**Files:**
- Modify: `public/login.html` (link CSS, update layout)

- [ ] **Step 1: Update login.html to use design system and component library**

In `public/login.html` `<head>`, add:

```html
<link rel="stylesheet" href="/css/design-system.css">
<link rel="stylesheet" href="/css/components.css">
```

Replace existing inline styles and class names with:

```html
<body>
  <div class="login-screen" style="
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-6) var(--space-4);
    background-color: var(--color-bg-dark);
  ">
    <!-- Brand Logo -->
    <div style="
      width: 64px;
      height: 64px;
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, var(--color-accent-teal), var(--color-accent-gold));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: var(--font-weight-bold);
      color: var(--color-bg-dark);
      margin-bottom: var(--space-8);
    ">H</div>

    <!-- Heading -->
    <h1 style="
      font-size: var(--font-size-h1);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin-bottom: var(--space-2);
      text-align: center;
    ">Welcome back</h1>
    <p style="
      font-size: var(--font-size-body);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-8);
      text-align: center;
    ">Sign in to your health dashboard</p>

    <!-- Form -->
    <form id="login-form" style="width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: var(--space-4);">
      <div class="input-group">
        <label class="input-label" for="email">Email</label>
        <input class="input" type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" required>
      </div>
      <div class="input-group">
        <label class="input-label" for="password">Password</label>
        <input class="input" type="password" id="password" name="password" placeholder="Your password" autocomplete="current-password" required>
      </div>
      <button type="submit" class="btn btn--primary btn--full btn--lg" style="margin-top: var(--space-2);">
        Sign In
      </button>
    </form>

    <p style="
      margin-top: var(--space-6);
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      text-align: center;
    ">
      Don't have an account?
      <a href="/profile-complete.html" style="color: var(--color-accent-teal); text-decoration: none; font-weight: var(--font-weight-medium);">Get started</a>
    </p>
  </div>
</body>
```

- [ ] **Step 2: Commit**

```bash
git add public/login.html
git commit -m "refactor: update login screen to use design system components and CRED-inspired layout

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 10: Animations & Micro-interactions

**Files:**
- Create: `public/js/animations.js`
- Modify: `public/index.html` (link animations.js)

- [ ] **Step 1: Create animations.js with page transitions and reveal animations**

Create `public/js/animations.js`:

```javascript
/* Animations & Micro-interactions
 * Page entry reveals, component animations, interactive feedback
 */

(function () {
  'use strict';

  /* --- Intersection Observer: Reveal on Scroll --- */
  function initRevealAnimations() {
    const style = document.createElement('style');
    style.textContent = [
      '.reveal { opacity: 0; transform: translateY(16px); transition: opacity 0.4s ease, transform 0.4s ease; }',
      '.reveal--visible { opacity: 1; transform: translateY(0); }',
      '.reveal--delay-1 { transition-delay: 0.05s; }',
      '.reveal--delay-2 { transition-delay: 0.10s; }',
      '.reveal--delay-3 { transition-delay: 0.15s; }',
      '.reveal--delay-4 { transition-delay: 0.20s; }',
    ].join('\n');
    document.head.appendChild(style);

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* --- Progress Ring Animation --- */
  function animateProgressRing(svgEl, targetPercent) {
    var fill = svgEl.querySelector('.progress-ring__fill');
    if (!fill) return;
    var r = parseFloat(fill.getAttribute('r') || 36);
    var circumference = 2 * Math.PI * r;
    fill.style.strokeDasharray = circumference;
    fill.style.strokeDashoffset = circumference;
    requestAnimationFrame(function () {
      var offset = circumference - (targetPercent / 100) * circumference;
      fill.style.strokeDashoffset = offset;
    });
  }

  /* --- Counter Animation --- */
  function animateCounter(el, targetValue, duration, suffix) {
    suffix = suffix || '';
    var start = 0;
    var startTime = null;
    var isFloat = String(targetValue).includes('.');
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = start + (targetValue - start) * eased;
      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* --- Button Press Ripple --- */
  function initButtonRipples() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn');
      if (!btn || btn.disabled) return;
      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement('span');
      var size = Math.max(rect.width, rect.height);
      ripple.style.cssText = [
        'position: absolute',
        'border-radius: 50%',
        'width: ' + size + 'px',
        'height: ' + size + 'px',
        'left: ' + (e.clientX - rect.left - size / 2) + 'px',
        'top: ' + (e.clientY - rect.top - size / 2) + 'px',
        'background: rgba(255,255,255,0.15)',
        'transform: scale(0)',
        'animation: ripple-expand 0.4s ease forwards',
        'pointer-events: none',
      ].join('; ');
      if (getComputedStyle(btn).position === 'static') {
        btn.style.position = 'relative';
      }
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 450);
    });

    var rippleStyle = document.createElement('style');
    rippleStyle.textContent = '@keyframes ripple-expand { to { transform: scale(2.5); opacity: 0; } }';
    document.head.appendChild(rippleStyle);
  }

  /* --- Page Entry Animation --- */
  function initPageEntry() {
    var screen = document.querySelector('.screen, .onboarding-screen, .login-screen');
    if (!screen) return;
    screen.style.opacity = '0';
    screen.style.transform = 'translateY(8px)';
    screen.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        screen.style.opacity = '1';
        screen.style.transform = 'translateY(0)';
      });
    });
  }

  /* --- Public API --- */
  window.HealthAnimations = {
    animateProgressRing: animateProgressRing,
    animateCounter: animateCounter,
    initRevealAnimations: initRevealAnimations,
  };

  /* --- Auto-init --- */
  function init() {
    initRevealAnimations();
    initButtonRipples();
    initPageEntry();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 2: Link animations.js in index.html before closing body**

In `public/index.html` before `</body>`:

```html
<script src="/js/animations.js"></script>
```

- [ ] **Step 3: Verify file is valid JavaScript**

```bash
node -e "require('./public/js/animations.js'); console.log('JS syntax OK');" 2>&1 | grep -E "(OK|Error|SyntaxError)"
```

Expected: `JS syntax OK`

- [ ] **Step 4: Commit**

```bash
git add public/js/animations.js public/index.html
git commit -m "feat: add animations module with scroll reveals, counter animations, button ripples, and page transitions

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 11: Accessibility Audit

**Files:**
- Modify: `public/index.html` (aria labels, semantic HTML, focus management)
- Modify: `public/login.html` (form accessibility)
- Modify: `public/css/design-system.css` (ensure focus styles present)

- [ ] **Step 1: Audit index.html for missing ARIA roles and labels**

```bash
grep -n 'role=\|aria-\|<nav\|<main\|<header\|<footer\|<section' public/index.html | head -30
```

Expected: Should see aria-label on `<nav>`, `role="main"` on content area, section labels.

- [ ] **Step 2: Add missing ARIA landmarks and labels to index.html**

Ensure `public/index.html` has these attributes:
- `<nav class="bottom-nav" role="navigation" aria-label="Main navigation">` — already present from Task 3
- `<div class="screen" id="dashboard-screen">` → `<main class="screen" id="dashboard-screen" role="main">`
- Each `<section>` must have `aria-label` attribute describing its content
- All interactive buttons must have `aria-label` if icon-only

Update the screen wrapper in `public/index.html`:

```html
<main class="screen" id="dashboard-screen" role="main" aria-label="Dashboard">
```

Update icon-only buttons in the dashboard header:

```html
<button class="btn btn--icon btn--ghost" aria-label="View notifications">🔔</button>
```

- [ ] **Step 3: Verify focus-visible styles are present in design-system.css**

```bash
grep -n 'focus-visible' public/css/design-system.css
```

Expected output (line numbers may differ):
```
92::focus-visible {
```

If missing, add to `public/css/design-system.css` inside `:root` block:

```css
:focus-visible {
  outline: 2px solid var(--color-accent-teal);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 4: Verify all input elements have associated labels**

```bash
grep -n '<input' public/login.html
```

Expected: Each `<input>` should have a corresponding `<label for="...">` with matching `id`.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/login.html public/css/design-system.css
git commit -m "fix: accessibility audit - add ARIA landmarks, labels, and keyboard navigation support

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 12: Playwright E2E Tests & Responsive Validation

**Files:**
- Create: `tests/ui-redesign.spec.js`

- [ ] **Step 1: Create Playwright test file covering all redesigned screens**

Create `tests/ui-redesign.spec.js`:

```javascript
const { test, expect, devices } = require('@playwright/test');

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
```

- [ ] **Step 2: Run tests to verify they can be collected (some will fail before HTML updates)**

```bash
cd /Users/kkondoju/projects/health-dashboard && npx playwright test tests/ui-redesign.spec.js --list 2>&1 | tail -20
```

Expected: List of test names without syntax errors.

- [ ] **Step 3: Run the design system tests (should pass once CSS files are in place)**

```bash
cd /Users/kkondoju/projects/health-dashboard && npx playwright test tests/ui-redesign.spec.js --grep "Design System" 2>&1 | tail -15
```

Expected: All 3 Design System tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/ui-redesign.spec.js
git commit -m "test: add Playwright E2E tests for UI redesign (design system, navigation, dashboard, login, accessibility, responsive)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Self-Review Checklist

### Spec Coverage
- [x] Color palette (9 colors) — Task 1 defines all as CSS variables
- [x] Typography scale (6 levels) — Task 1 defines font-size, weight, line-height vars
- [x] Spacing grid (4px base) — Task 1 defines --space-1 through --space-16
- [x] Bottom navigation — Task 3 (mobile) + sidebar (tablet/desktop)
- [x] Buttons (primary, secondary, ghost, danger) — Task 2
- [x] Cards (default, elevated, interactive) — Task 2
- [x] Inputs with labels — Task 2 + Task 9 (login form)
- [x] Badges (success, warning, danger, info, gold) — Task 2
- [x] Progress rings — Task 2 (CSS) + Task 10 (JS animation)
- [x] Toggle switches — Task 2
- [x] Dashboard screen — Task 4 (hero, metrics, plan)
- [x] Diet/Meals screen — Task 5 (cards, filters, macro tracker)
- [x] Workouts screen — Task 6 (rings, bars, history)
- [x] Onboarding wizard — Task 7 (step dots, option cards, nav)
- [x] Settings screen — Task 8 (groups, items, toggles)
- [x] Login screen — Task 9
- [x] Animations (page entry, scroll reveal, button ripple, counter) — Task 10
- [x] Accessibility (ARIA, focus-visible, keyboard nav) — Task 11
- [x] Responsive testing (Playwright, 3 viewports) — Task 12
- [x] prefers-reduced-motion — Task 1 (global reset section)

### Type Consistency Check
- `animateProgressRing(svgEl, targetPercent)` defined and used consistently — Task 10
- `animateCounter(el, targetValue, duration, suffix)` defined and used consistently — Task 10
- `.nav-item--active` class used consistently in bottom-nav.js (Task 3) and navigation.css (Task 3)
- CSS variable names prefixed `--color-*`, `--font-*`, `--space-*`, `--transition-*`, `--radius-*` — consistent across all tasks
- `data-nav` attribute used in both HTML (Task 3) and bottom-nav.js (Task 3) — consistent
