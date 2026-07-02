/* Bottom Navigation — Tab switching and active state management */

(function () {
  'use strict';

  // Pages that require full navigation (separate .html files)
  const PAGE_NAV = {
    settings: '/settings.html',
  };

  // Sections within index.html (use showSection)
  const SECTION_MAP = {
    dashboard: 'dashboard',
    diet:      'diet',
    workouts:  'workout',
    progress:  'progress',
  };

  function getActiveScreen() {
    const path = window.location.pathname;
    if (path.includes('settings')) return 'settings';
    if (path.includes('index') || path === '/' || path.endsWith('.html') === false) return 'dashboard';
    return 'dashboard';
  }

  function setActiveNavItem(screenKey) {
    document.querySelectorAll('.nav-item[data-nav]').forEach(function (el) {
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
    setActiveNavItem(getActiveScreen());

    document.querySelectorAll('.nav-item[data-nav]').forEach(function (el) {
      el.addEventListener('click', function () {
        const key = el.getAttribute('data-nav');

        // Full-page navigation for separate pages
        if (PAGE_NAV[key]) {
          window.location.href = PAGE_NAV[key];
          return;
        }

        // In-page section switch
        const sectionId = SECTION_MAP[key];
        if (sectionId && typeof window.showSection === 'function') {
          window.showSection(sectionId, null);
          setActiveNavItem(key);
        }
      });
    });
  }

  // Expose so showSection can update active nav state
  window.setActiveNavItem = setActiveNavItem;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
