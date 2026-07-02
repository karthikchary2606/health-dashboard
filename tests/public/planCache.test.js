'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadPlanCache(apiFetch) {
  const source = fs.readFileSync(
    path.join(__dirname, '../../public/js/planCache.js'),
    'utf8'
  );
  const sandbox = {
    window: {},
    apiFetch,
    Date: { now: () => 1700000000000 }
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.planCache;
}

describe('planCache invalidate behavior', () => {
  test('getPlan recovers after invalidate following version mismatch', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        data: { meta: { planVersion: '2' }, diet: [], workout: [] }
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { meta: { planVersion: '3' }, diet: [], workout: [] }
      });

    const planCache = loadPlanCache(apiFetch);

    const firstPlan = await planCache.getPlan({ planVersion: '1' });
    expect(firstPlan).toBeNull();

    planCache.invalidate();

    const recoveredPlan = await planCache.getPlan();
    expect(recoveredPlan).toEqual({ meta: { planVersion: '3' }, diet: [], workout: [] });
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
