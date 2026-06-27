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
  const conditions = profile.healthConditions || [];
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
      return {
        name: ex.substitutions[cond],
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

  // Fallback: relax goal + equipment filters if nothing matched
  if (candidates.length === 0) {
    candidates = ALL_EXERCISES.filter(ex =>
      ex.muscleGroup === muscleGroup &&
      hasOverlap(ex.fitnessLevels, tiers)
    );
  }

  // Last resort: any exercise in the muscleGroup
  if (candidates.length === 0) {
    candidates = ALL_EXERCISES.filter(ex => ex.muscleGroup === muscleGroup);
  }

  return candidates
    .map(ex => resolveExercise(ex, tier, profile))
    .filter(Boolean)
    .slice(0, 5);
}

module.exports = { getExercises };
