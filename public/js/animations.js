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
