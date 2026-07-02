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

// Yoga style multipliers for Surya Namaskar rounds
const YOGA_STYLE_MULTIPLIERS = {
  'hatha':         0.8,
  'vinyasa':       1.2,
  'pranayama-only': 0
};

function getSuryaNamaskarRounds(profile) {
  const age = profile.age || 30;
  const fl  = profile.fitnessLevel || 'moderately-active';
  const yogaStyle = profile.yogaStyle;
  
  // Pranayama-only: skip Surya Namaskar entirely
  if (yogaStyle === 'pranayama-only') {
    return 0;
  }
  
  let range;
  if (age < 30)       range = SURYA_ROUNDS.under30;
  else if (age <= 45) range = SURYA_ROUNDS.age30to45;
  else if (age <= 60) range = SURYA_ROUNDS.age46to60;
  else                range = SURYA_ROUNDS.over60;

  let baseRounds;
  if (fl === 'sedentary') {
    baseRounds = range.min;
  } else {
    baseRounds = Math.round((range.min + range.max) / 2);
  }

  // Apply yoga style multiplier only if explicitly provided and valid
  if (yogaStyle && yogaStyle !== 'none' && YOGA_STYLE_MULTIPLIERS.hasOwnProperty(yogaStyle)) {
    const multiplier = YOGA_STYLE_MULTIPLIERS[yogaStyle];
    const finalRounds = Math.round(baseRounds * multiplier);
    return Math.max(finalRounds, 0);
  }
  
  return baseRounds;
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

const YOGA_EXERCISES = {
  hatha: [
    { name: 'Vrikshasana (Tree Pose)',               sets: 3, reps: '30s hold per side', note: 'Balance and mental focus — arms above head',      cat: 'yoga' },
    { name: 'Virabhadrasana II (Warrior II)',        sets: 3, reps: '45s hold per side', note: 'Hip strength and chest opening',                   cat: 'yoga' },
    { name: 'Setu Bandhasana (Bridge Pose)',         sets: 3, reps: '12 reps',           note: 'Glute activation — squeeze at the top',            cat: 'yoga' },
    { name: 'Paschimottanasana (Forward Fold)',      sets: 3, reps: '30s hold',          note: 'Hamstring and spine stretch — breathe into hold',  cat: 'yoga' },
    { name: 'Shavasana (Corpse Pose)',               sets: 1, reps: '5 min',             note: 'Full-body relaxation — do not skip',               cat: 'yoga' },
  ],
  vinyasa: [
    { name: 'Chaturanga → Up Dog → Down Dog Flow',  sets: 3, reps: '5 rounds',          note: 'Core and upper body — maintain straight spine',    cat: 'yoga' },
    { name: 'Warrior I → II → Reverse Warrior',     sets: 3, reps: '45s per side',      note: 'Full-body flow — synchronise breath with movement', cat: 'yoga' },
    { name: 'Utkatasana (Chair Pose)',               sets: 3, reps: '45s hold',          note: 'Thigh and glute strength',                         cat: 'yoga' },
    { name: 'Phalakasana → Vasisthasana (Plank → Side Plank)', sets: 3, reps: '30s each side', note: 'Core stability', cat: 'yoga' },
    { name: 'Shavasana',                            sets: 1, reps: '3 min',             note: 'Recovery — let heart rate settle',                  cat: 'yoga' },
  ],
  'pranayama-only': [
    { name: 'Anulom Vilom (Alternate Nostril)',      sets: 1, reps: '5 min',            note: 'Inhale left (thumb closes right) → exhale right (ring finger closes left) → inhale right → exhale left. One round = 4 breaths', cat: 'yoga' },
    { name: 'Bhramari (Humming Bee Breath)',         sets: 1, reps: '5 min',            note: 'Thumbs on ear tragus (to close ears), fingers resting on face — hum on exhale, reduces anxiety', cat: 'yoga' },
    { name: 'Kapalbhati (Skull-Shining Breath)',     sets: 3, reps: '30 cycles',        note: 'Forceful exhale through nose, passive inhale — energising', cat: 'yoga' },
    { name: 'Uddiyana Bandha (Abdominal Lock)',      sets: 3, reps: '10 contractions',  note: 'Exhale fully, suck abdomen in and up — empty stomach only', cat: 'yoga' },
    { name: 'Shavasana',                            sets: 1, reps: '10 min',            note: 'Deep relaxation — close eyes, no movement',         cat: 'yoga' },
  ],
};

/**
 * Returns the yoga exercise list for the given yoga style.
 * Falls back to hatha for unknown styles.
 *
 * @param {string} yogaType - 'hatha' | 'vinyasa' | 'pranayama-only'
 * @returns {Array<{name, sets, reps, note, cat}>}
 */
function getYogaExercises(yogaType) {
  return (YOGA_EXERCISES[yogaType] || YOGA_EXERCISES.hatha).map(ex => ({ ...ex }));
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

module.exports = { getExercises, getSuryaNamaskarRounds, getYogaExercises };
