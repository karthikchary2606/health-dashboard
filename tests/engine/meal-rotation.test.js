'use strict';

const {
  getMeals,
  hashSeed,
  getRotationOffset,
} = require('../../server/engine/meal-composer');

const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

/**
 * Builds the full-day meal tuple (breakfast, lunch, snack, dinner) for a
 * given profile/goal/week/day combination.
 */
function dayTuple(profile, goal, weekIndex, dayIndex) {
  return MEAL_TYPES.map(mt => getMeals(profile, mt, goal, weekIndex, dayIndex));
}

const profile = {
  userId: 'user-rotation-1',
  cuisinePreference: 'south-indian',
  dietType: 'vegetarian',
  healthConditions: [],
  culturalFoodAvoidances: [],
  foodList: [],
};

describe('hashSeed', () => {
  test('is a function', () => {
    expect(typeof hashSeed).toBe('function');
  });

  test('is deterministic for the same input', () => {
    expect(hashSeed('user-1|vegetarian|south-indian|lunch|0')).toBe(
      hashSeed('user-1|vegetarian|south-indian|lunch|0')
    );
  });

  test('produces different hashes for different inputs', () => {
    expect(hashSeed('user-1|vegetarian|south-indian|lunch|0')).not.toBe(
      hashSeed('user-1|vegetarian|south-indian|lunch|1')
    );
  });

  test('returns a non-negative integer', () => {
    const h = hashSeed('some-arbitrary-seed-string');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
  });
});

describe('getRotationOffset', () => {
  test('is a function', () => {
    expect(typeof getRotationOffset).toBe('function');
  });

  test('is stable for every week within the same 4-week block (block 0: weeks 0-3)', () => {
    const offsets = [0, 1, 2, 3].map(w => getRotationOffset(profile, w, 'lunch'));
    expect(offsets[0]).toBe(offsets[1]);
    expect(offsets[0]).toBe(offsets[2]);
    expect(offsets[0]).toBe(offsets[3]);
  });

  test('is stable for every week within block 1 (weeks 4-7), matching each other but not block 0', () => {
    const block1Offsets = [4, 5, 6, 7].map(w => getRotationOffset(profile, w, 'lunch'));
    expect(block1Offsets[0]).toBe(block1Offsets[1]);
    expect(block1Offsets[0]).toBe(block1Offsets[2]);
    expect(block1Offsets[0]).toBe(block1Offsets[3]);

    const block0Offset = getRotationOffset(profile, 0, 'lunch');
    expect(block1Offsets[0]).not.toBe(block0Offset);
  });

  test('is deterministic across repeated calls with identical arguments', () => {
    const a = getRotationOffset(profile, 5, 'dinner');
    const b = getRotationOffset(profile, 5, 'dinner');
    expect(a).toBe(b);
  });

  test('incorporates profile identity — different users can get different offsets in the same block', () => {
    const profileB = { ...profile, userId: 'user-rotation-2' };
    const offsetA = getRotationOffset(profile, 0, 'lunch');
    const offsetB = getRotationOffset(profileB, 0, 'lunch');
    // Different seed inputs (different userId) must not be forced into
    // collapsing to the same offset by construction.
    expect(offsetA).not.toBe(offsetB);
  });
});

describe('4-week meal rotation — full-day tuple behavior', () => {
  test('week 0 and week 4 (different rotation blocks) produce a different full-day tuple for the same day', () => {
    const week0 = dayTuple(profile, 'weight-loss', 0, 0);
    const week4 = dayTuple(profile, 'weight-loss', 4, 0);
    expect(week0).not.toEqual(week4);
  });

  test('rotation offset breaks a naive-formula tie: week 0 and week 24 land on the same raw cycle index but different blocks, so the tuple must differ', () => {
    // With south-indian pools of length 8/8/6/8, (weekIndex*7 + dayIndex) % length
    // ties exactly for weekIndex 0 and 24 on day 3 (24*7 = 168 is a multiple of
    // both 8 and 6). Without block-seeded rotation, week 0 and week 24 would
    // produce an *identical* full-day tuple. Block rotation (blockIndex =
    // floor(weekIndex/4): 0 vs 6) must break this tie.
    const week0 = dayTuple(profile, 'weight-loss', 0, 3);
    const week24 = dayTuple(profile, 'weight-loss', 24, 3);
    expect(week0).not.toEqual(week24);
  });

  test('same block stays deterministic: repeated calls for the same week/day return the same tuple', () => {
    const first = dayTuple(profile, 'weight-loss', 1, 2);
    const second = dayTuple(profile, 'weight-loss', 1, 2);
    expect(first).toEqual(second);
  });

  test('same profile/week/day always yields the same tuple across many repeated calls', () => {
    const callA = dayTuple(profile, 'weight-loss', 4, 3);
    const callB = dayTuple(profile, 'weight-loss', 4, 3);
    const callC = dayTuple(profile, 'weight-loss', 4, 3);
    expect(callA).toEqual(callB);
    expect(callB).toEqual(callC);
  });
});
