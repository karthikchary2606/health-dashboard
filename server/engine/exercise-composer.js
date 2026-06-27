'use strict';

const strength    = require('../exercises/strength');
const flexibility = require('../exercises/flexibility');

const ALL_EXERCISES = [...strength, ...flexibility];

const LEVEL_TIERS = {
  'sedentary':         ['beginner'],
  'lightly-active':    ['beginner', 'intermediate'],
  'moderately-active': ['intermediate'],
  'very-active':       ['intermediate', 'advanced'],
};

const TIER_PRIORITY = ['advanced', 'intermediate', 'beginner'];

const SURYA_ROUNDS = {
  under30:   { min: 12, max: 24 },
  age30to45: { min: 8,  max: 12 },
  age46to60: { min: 5,  max: 8  },
  over60:    { min: 3,  max: 5  }
};

function getSuryaNamaskarRounds(profile) {
  const age = profile.age || 30;
  const fl  = profile.fitnessLevel || 'moderately-active';
  let range;
  if (age < 30)       range = SURYA_ROUNDS.under30;
  else if (age <= 45) range = SURYA_ROUNDS.age30to45;
  else if (age <= 60) range = SURYA_ROUNDS.age46to60;
  else                range = SURYA_ROUNDS.over60;

  if (fl === 'sedentary') return range.min;
  return Math.round((range.min + range.max) / 2);
}

function highestTier(tiers) {
  return TIER_PRIORITY.find(t => tiers.includes(t));
}

function hasOverlap(a, b) {
  return a.some(v => b.includes(v));
}

function equipmentMet(ex, profile) {
  return (
    ex.equipment.length === 0 ||
    ex.equipment.every(e => (profile.equipmentAvailable || []).includes(e))
  );
}

function resolveExercise(ex, tier, profile) {
  const rawConditions = profile.healthConditions || [];
  const conditions = rawConditions
    .filter(c => typeof c === 'string' || c.active !== false)
    .map(c => (typeof c === 'object' && c !== null) ? c.name : c);
  const violated   = conditions.filter(c => ex.contraindications.includes(c));

  if (violated.length === 0) {
    return {
      name: ex.name,
      sets: ex.sets[tier],
      reps: ex.reps[tier],
      note: ex.note,
    };
  }

  // Check if any substitution exists for a violated condition
  for (const cond of violated) {
    if (ex.substitutions[cond]) {
      const substituteName = ex.substitutions[cond];
      const subEntry = ALL_EXERCISES.find(e => e.name === substituteName);
      if (subEntry && !equipmentMet(subEntry, profile)) {
        return null; // substitute requires equipment the user doesn't have
      }
      return {
        name: substituteName,
        sets: ex.sets[tier],
        reps: ex.reps[tier],
        note: ex.note,
      };
    }
  }

  // Contraindicated with no substitution — skip
  return null;
}

/**
 * Returns up to 5 resolved exercises for the given profile, muscleGroup, and goal.
 *
 * @param {object} profile        - { fitnessLevel, equipmentAvailable, healthConditions }
 * @param {string} muscleGroup    - e.g. 'legs'
 * @param {string} goal           - e.g. 'weight-loss'
 * @returns {Array<{name, sets, reps, note}>}
 */
function getExercises(profile, muscleGroup, goal) {
  const tiers = LEVEL_TIERS[profile.fitnessLevel] || ['beginner'];
  const tier  = highestTier(tiers);

  // Primary filter: muscleGroup + goal + fitnessLevel + equipment
  let candidates = ALL_EXERCISES.filter(ex =>
    ex.muscleGroup === muscleGroup &&
    ex.goals.includes(goal) &&
    hasOverlap(ex.fitnessLevels, tiers) &&
    equipmentMet(ex, profile)
  );

  // Fallback 2: relax goal only (keep equipment filter)
  if (candidates.length === 0) {
    candidates = ALL_EXERCISES.filter(ex =>
      ex.muscleGroup === muscleGroup &&
      hasOverlap(ex.fitnessLevels, tiers) &&
      equipmentMet(ex, profile)
    );
  }

  // Fallback 3: last resort — relax both goal and equipment
  if (candidates.length === 0) {
    candidates = ALL_EXERCISES.filter(ex =>
      ex.muscleGroup === muscleGroup &&
      hasOverlap(ex.fitnessLevels, tiers)
    );
  }

  return candidates
    .map(ex => resolveExercise(ex, tier, profile))
    .filter(Boolean)
    .slice(0, 5);
}

module.exports = { getExercises, getSuryaNamaskarRounds };
