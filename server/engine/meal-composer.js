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

/**
 * Returns a deterministic meal string for the given inputs.
 *
 * @param {object} profile        - { cuisinePreference, dietType, healthConditions }
 * @param {string} mealType       - 'breakfast' | 'lunch' | 'snack' | 'dinner'
 * @param {string} goal           - e.g. 'weight-loss' (reserved for future use)
 * @param {number} weekIndex      - 0-based week number
 * @param {number} dayIndex       - 0–6 (day within the week)
 * @returns {string}
 */
function getMeals(profile, mealType, goal, weekIndex, dayIndex) {
  const cuisine  = resolveCuisine(profile, weekIndex);
  const poolKey  = resolvePool(profile.dietType);
  const pool     = cuisine[mealType][poolKey];

  const index = (weekIndex * 7 + dayIndex) % pool.length;
  return pool[index];
}

module.exports = { getMeals };
