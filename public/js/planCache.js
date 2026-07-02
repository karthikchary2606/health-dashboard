/**
 * planCache — singleton that fetches and caches GET /api/profile/plan.
 *
 * Usage:
 *   const plan = await window.planCache.getPlan();
 *   plan.meta.currentMonth  // 1-based
 *   plan.diet[0]            // Month 1 diet (or null if stub)
 *   plan.workout[0]         // Month 1 workout
 *
 *   window.planCache.invalidate();  // call after profile changes
 */
window.planCache = (() => {
  let _promise = null;
  let _cachedPlanVersion = null;
  let _expectedPlanVersion = null;

  function normalizeVersion(version) {
    if (version === undefined || version === null || version === '') return null;
    return String(version);
  }

  function readPlanVersion(plan) {
    if (!plan) return null;
    return normalizeVersion(
      (plan.meta && plan.meta.planVersion) || plan.planVersion
    );
  }

  function setExpectedPlanVersion(version) {
    const normalized = normalizeVersion(version);
    if (!normalized) return;
    _expectedPlanVersion = normalized;
    if (_cachedPlanVersion && _cachedPlanVersion !== normalized) {
      invalidate();
    }
  }

  function getPlan(options = {}) {
    if (Object.prototype.hasOwnProperty.call(options, 'planVersion')) {
      setExpectedPlanVersion(options.planVersion);
    } else if (Object.prototype.hasOwnProperty.call(options, 'expectedPlanVersion')) {
      setExpectedPlanVersion(options.expectedPlanVersion);
    }

    if (!_promise) {
      const p = apiFetch('/api/profile/plan?v=' + Date.now()).then(({ ok, data }) => {
        if (!ok) {
          if (_promise === p) _promise = null;
          return null;
        }
        _cachedPlanVersion = readPlanVersion(data);
        if (_expectedPlanVersion && _cachedPlanVersion && _expectedPlanVersion !== _cachedPlanVersion) {
          if (_promise === p) _promise = null;
          return null;
        }
        return data;
      });
      _promise = p;
    }
    return _promise;
  }

  function invalidate() {
    _promise = null;
    _cachedPlanVersion = null;
    _expectedPlanVersion = null;
  }

  function getCachedPlanVersion() {
    return _cachedPlanVersion;
  }

  return { getPlan, invalidate, setExpectedPlanVersion, getCachedPlanVersion };
})();
