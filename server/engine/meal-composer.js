'use strict';

const southIndian  = require('../meals/south-indian');
const northIndian  = require('../meals/north-indian');
const continental  = require('../meals/continental');

const CUISINE_MAP = {
  'south-indian': southIndian,
  'north-indian': northIndian,
  'continental':  continental,
};

// Mixed rotates by weekIndex % 3
const MIXED_ROTATION = ['south-indian', 'north-indian', 'continental'];

function activeConditions(profile) {
  const conditions = profile.healthConditions || [];
  return conditions
    .filter(c => typeof c === 'string' || c.active !== false)
    .map(c => (typeof c === 'string' ? c : c.name));
}

function resolveCuisine(profile, weekIndex) {
  const pref = profile.cuisinePreference;
  if (!pref || pref === 'mixed') {
    // mixed: rotate south-indian → north-indian → continental
    if (pref === 'mixed') return CUISINE_MAP[MIXED_ROTATION[weekIndex % 3]];
    return CUISINE_MAP['south-indian']; // safe default for undefined/missing
  }
  const known = ['south-indian', 'north-indian', 'continental'];
  return CUISINE_MAP[known.includes(pref) ? pref : 'south-indian'];
}

function resolvePool(dietType) {
  if (dietType === 'vegetarian' || dietType === 'vegan') return 'veg';
  if (dietType === 'eggetarian') return 'eggetarian';
  if (dietType === 'non-vegetarian') return 'non-veg';
  return 'veg'; // safe default for unknown/legacy values
}

const DAIRY_TERMS = ['curd', 'raita', 'paneer', 'ghee', 'butter', 'yogurt', 'dahi', 'cheese', 'cream'];

function isVeganFriendly(meal) {
  // "coconut milk" is vegan-safe — strip it before checking
  const text = meal.toLowerCase().replace('coconut milk', '');
  return !DAIRY_TERMS.some(d => text.includes(d));
}

/**
 * Deterministically hashes an arbitrary string into a non-negative 32-bit
 * integer. Uses a simple, stable multiplicative (djb2-style) hash — no
 * randomness, no platform-dependent behavior.
 *
 * @param {string|number} input
 * @returns {number} non-negative integer hash
 */
function hashSeed(input) {
  const str = String(input);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // hash * 33 + charCode, kept within unsigned 32-bit range
    hash = ((hash * 33) ^ str.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Computes a deterministic rotation offset for a given profile/mealType at
 * the current 4-week rotation block. The block advances every 4 weeks
 * (blockIndex = floor(weekIndex / 4)), so all weeks within the same block
 * share the same offset (stable pattern), while a new block yields a new
 * seed — and therefore a new offset — shifting the meal-selection cycle.
 *
 * The seed incorporates user/profile traits (userId, dietType,
 * cuisinePreference) plus mealType and blockIndex, so the same profile in
 * the same block is always deterministic, and different profiles/blocks
 * diverge.
 *
 * @param {object} profile   - { userId, dietType, cuisinePreference, ... }
 * @param {number} weekIndex - 0-based global week number
 * @param {string} mealType  - 'breakfast' | 'lunch' | 'snack' | 'dinner'
 * @returns {number} rotation offset (non-negative integer)
 */
function getRotationOffset(profile, weekIndex, mealType) {
  const blockIndex = Math.floor(weekIndex / 4);
  const seedParts = [
    profile.userId || profile.id || 'anon',
    profile.dietType || '',
    profile.cuisinePreference || '',
    mealType,
    blockIndex,
  ];
  return hashSeed(seedParts.join('|'));
}

/**
 * Returns a deterministic meal string for the given inputs.
 *
 * @param {object} profile        - { cuisinePreference, dietType, healthConditions }
 * @param {string} mealType       - 'breakfast' | 'lunch' | 'snack' | 'dinner'
 * @param {string} goal           - e.g. 'weight-loss' (reserved for future use)
 * @param {number} weekIndex      - 0-based week number
 * @param {number} dayIndex       - 0–6 (day within the week)
 * @param {string} [dietType]     - optional override diet type (e.g. from weekly pattern)
 * @returns {string}
 */
function getMeals(profile, mealType, goal, weekIndex, dayIndex, dietType) {
  const effectiveDiet = dietType || deriveEffectiveDiet(profile);
  const cuisine  = resolveCuisine(profile, weekIndex);
  const poolKey  = resolvePool(effectiveDiet);
  const pool     = cuisine[mealType][poolKey];

  // Expand avoidance keywords to cover related terms in meal names.
  // e.g. "mutton" also covers lamb, goat, rogan josh; "prawn" covers seafood.
  const AVOIDANCE_EXPANSION = {
    mutton:  ['mutton', 'lamb', 'goat', 'rogan josh', 'keema', 'seekh'],
    prawn:   ['prawn', 'prawns', 'shrimp', 'crab', 'seafood', 'lobster'],
    beef:    ['beef'],
    pork:    ['pork', 'bacon', 'ham', 'sausage'],
    'non-veg': NON_VEG_TERMS,
  };

  const rawAvoidances = (profile.culturalFoodAvoidances || []).map(a => a.toLowerCase());
  const expandedAvoidances = rawAvoidances.flatMap(a => AVOIDANCE_EXPANSION[a] || [a]);

  const meetsAvoidances = (meal) =>
    !expandedAvoidances.some(a => meal.name.toLowerCase().includes(a));

  let filteredPool = expandedAvoidances.length > 0
    ? pool.filter(meetsAvoidances)
    : pool;

  // If the non-veg pool is fully filtered (e.g. user avoids all meat types),
  // fall back to the veg pool from the same cuisine — never reintroduce avoided foods.
  if (filteredPool.length === 0) {
    const vegPool = cuisine[mealType]['veg'] || [];
    filteredPool = vegPool.length > 0 ? vegPool : pool.filter(meetsAvoidances);
  }

  // Last resort: if still empty (shouldn't happen with current meal data), use full pool
  // so the app doesn't crash — but log a warning for investigation.
  if (filteredPool.length === 0) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[meal-composer] No meals left after avoidance filtering for ${mealType}/${poolKey} — using unfiltered pool`);
    }
    filteredPool = pool;
  }

  // Strip dairy items for vegan users
  if (effectiveDiet === 'vegan') {
    const veganPool = filteredPool.filter(meal => isVeganFriendly(meal.name));
    if (veganPool.length > 0) filteredPool = veganPool;
  }

  const usePool = filteredPool;

  // activeConditions available for future goal/condition-based filtering
  const _active = activeConditions(profile); // eslint-disable-line no-unused-vars

  const offset = getRotationOffset(profile, weekIndex, mealType);
  const index = (weekIndex * 7 + dayIndex + offset) % usePool.length;
  return usePool[index];
}

const NON_VEG_TERMS = [
  'chicken', 'mutton', 'lamb', 'goat', 'pork', 'beef',
  'fish', 'prawn', 'shrimp', 'crab', 'salmon', 'tuna',
  'keema', 'meat', 'bacon', 'ham', 'sausage',
];
const EGG_TERMS = ['egg', 'eggs'];

/**
 * Escapes regex special characters in a literal string.
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks whether any of the given terms appears as a whole word in the
 * token string, using word-boundary matching instead of loose substring
 * matching. This prevents false positives such as 'vegetable stew'
 * matching 'stew' or 'eggplant' matching 'egg'.
 *
 * @param {string} token
 * @param {string[]} terms
 * @returns {boolean}
 */
function matchesAnyTerm(token, terms) {
  return terms.some(term => new RegExp(`\\b${escapeRegExp(term)}\\b`).test(token));
}

/**
 * Normalizes a foodList (array of strings and/or {name} objects) into an
 * array of lowercase string tokens for keyword matching.
 *
 * @param {Array<string|{name:string}>} foodList
 * @returns {string[]}
 */
function normalizeFoodTokens(foodList) {
  if (!Array.isArray(foodList)) return [];
  return foodList
    .map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item.name === 'string') return item.name;
      return '';
    })
    .map(token => token.toLowerCase().trim())
    .filter(token => token.length > 0);
}

/**
 * Derives the effective diet type for a profile by cross-referencing the
 * declared dietType with any non-veg/egg terms present in the user's
 * foodList (e.g. a "vegetarian" who has logged chicken stew is treated as
 * non-vegetarian for meal generation purposes).
 *
 * Rules:
 *  - vegan is a strict, non-negotiable preference and never upgrades.
 *  - Presence of any non-veg term upgrades vegetarian/eggetarian -> non-vegetarian.
 *  - Presence of an egg term (with no non-veg term) upgrades vegetarian -> eggetarian.
 *  - non-vegetarian stays non-vegetarian.
 *
 * @param {object} profile - { dietType, foodList }
 * @returns {string} effective diet type
 */
function deriveEffectiveDiet(profile) {
  if (!profile) return undefined;

  const baseDiet = profile.dietType || 'vegetarian';

  // Strict dietary preferences are never overridden by food history.
  // If a user explicitly chose vegetarian or vegan, respect that unconditionally.
  if (baseDiet === 'vegan' || baseDiet === 'vegetarian') return baseDiet;

  const tokens = normalizeFoodTokens(profile.foodList);
  if (tokens.length === 0) return baseDiet;

  const hasNonVeg = tokens.some(token => matchesAnyTerm(token, NON_VEG_TERMS));
  if (hasNonVeg) return 'non-vegetarian';

  if (baseDiet === 'non-vegetarian') return 'non-vegetarian';

  const hasEgg = tokens.some(token => matchesAnyTerm(token, EGG_TERMS));
  if (hasEgg) return 'eggetarian';

  return baseDiet;
}

/**
 * Derives a weekly diet pattern for a user based on their profile.
 * Returns an object with day names as keys and diet types as values.
 *
 * Rules:
 *  - If vegetarian: all days are 'vegetarian' (strict preference)
 *  - Otherwise: default all days to user's dietType
 *    - Override days in eggDays to 'eggetarian'
 *    - Override days in nonVegDays to 'non-vegetarian'
 *
 * @param {object} user - { profile: { dietType, eggDays, nonVegDays, ... } }
 * @returns {object} weekly pattern: { Monday: 'veg', ..., Sunday: 'non-veg' }
 */
function deriveWeeklyDietPattern(user) {
  if (!user || !user.profile) return {};

  const dietType = user.profile.dietType || 'vegetarian';
  const eggDays = user.profile.eggDays || [];
  const nonVegDays = user.profile.nonVegDays || [];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const pattern = {};

  // Strict preferences (vegetarian/vegan) are never overridden
  if (dietType === 'vegetarian' || dietType === 'vegan') {
    days.forEach(day => {
      pattern[day] = dietType;
    });
    return pattern;
  }

  // For other diet types, build the weekly pattern with overrides
  days.forEach(day => {
    // Start with the default diet type
    pattern[day] = dietType;

    // Apply overrides: eggDays takes priority
    if (eggDays.includes(day)) {
      pattern[day] = 'eggetarian';
    }

    // Apply overrides: nonVegDays overrides everything
    if (nonVegDays.includes(day)) {
      pattern[day] = 'non-vegetarian';
    }
  });

  return pattern;
}

module.exports = {
  getMeals,
  activeConditions,
  deriveEffectiveDiet,
  deriveWeeklyDietPattern,
  normalizeFoodTokens,
  hashSeed,
  getRotationOffset,
};
