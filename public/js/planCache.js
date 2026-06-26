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

  function getPlan() {
    if (!_promise) {
      _promise = apiFetch('/api/profile/plan').then(({ ok, data }) => {
        if (!ok) {
          _promise = null;
          return null;
        }
        return data;
      });
    }
    return _promise;
  }

  function invalidate() {
    _promise = null;
  }

  return { getPlan, invalidate };
})();
