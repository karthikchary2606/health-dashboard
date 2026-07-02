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
