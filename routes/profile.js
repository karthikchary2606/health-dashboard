const express = require('express');
const router  = express.Router();
const authenticate   = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const User            = require('../models/User');
const ProfileSnapshot = require('../models/ProfileSnapshot');

const TEMPLATES = {
  'weight-loss':     require('../server/templates/weight-loss'),
  'muscle-gain':     require('../server/templates/muscle-gain'),
  'maintenance':     require('../server/templates/maintenance'),
  'general-fitness': require('../server/templates/general-fitness')
};

// ── helpers ──────────────────────────────────────────────────────────────────

function computeWaterGoal(weightKg) {
  if (!weightKg) return 2.5;
  return Math.round((weightKg * 30) / 1000 * 10) / 10;
}

// Activity multipliers (Mifflin-St Jeor)
const ACTIVITY_MULTIPLIERS = {
  'sedentary':          1.2,
  'lightly-active':     1.375,
  'moderately-active':  1.55,
  'very-active':        1.725,
};

// Goal caloric adjustments
const GOAL_ADJUSTMENTS = {
  'weight-loss':     -300,
  'muscle-gain':     +300,
  'maintenance':      0,
  'general-fitness':  0,
};

function computeMacroTargets(profile) {
  const { age, heightCm, currentWeightKg, fitnessLevel, primaryGoal } = profile;
  const sex = profile.sex || 'other'; // default to 'other' so calories are always computed
  if (!age || !heightCm || !currentWeightKg) return {};

  // Mifflin-St Jeor BMR
  const base = 10 * currentWeightKg + 6.25 * heightCm - 5 * age;
  const bmr  = sex === 'female' ? base - 161 : base + 5; // male/other use +5

  const multiplier = ACTIVITY_MULTIPLIERS[fitnessLevel] || 1.375;
  const tdee       = Math.round(bmr * multiplier);
  const adjustment = GOAL_ADJUSTMENTS[primaryGoal] || 0;
  const calories   = tdee + adjustment;

  // Macro split: 30% protein, 45% carbs, 25% fat (weight-loss / general)
  // muscle-gain: 35% protein, 45% carbs, 20% fat
  const proteinPct = primaryGoal === 'muscle-gain' ? 0.35 : 0.30;
  const carbsPct   = 0.45;
  const fatPct     = 1 - proteinPct - carbsPct;

  return {
    dailyCalorieTarget: calories,
    dailyProteinG:      Math.round((calories * proteinPct) / 4),  // 4 kcal/g
    dailyCarbsG:        Math.round((calories * carbsPct)   / 4),
    dailyFatG:          Math.round((calories * fatPct)     / 9),  // 9 kcal/g
  };
}

const PHASE2_FIELDS = [
  // Phase 1 (onboarding core)
  'primaryGoal', 'dietType', 'age', 'currentWeightKg', 'heightCm', 'fitnessLevel',
  // Phase 2 (profile-complete page)
  'cuisinePreference', 'workoutPreferences', 'foodList', 'religion', 'languageCommunity'
];

function computeCompletionPct(profile) {
  const filled = PHASE2_FIELDS.filter(f => {
    const v = profile[f];
    if (v === null || v === undefined) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
  return Math.round((filled.length / PHASE2_FIELDS.length) * 100);
}

async function writeSnapshot(userId, profile, reason) {
  await ProfileSnapshot.create({ userId, reason, data: profile });
}

function normaliseConditions(arr) {
  return (arr || []).map(c =>
    typeof c === 'string' ? { name: c, active: true } : { ...c, active: c.active !== false }
  );
}

function normaliseMeds(arr) {
  return (arr || []).map(m =>
    typeof m === 'string' ? { name: m, active: true } : { ...m, active: m.active !== false }
  );
}

// ── routes ────────────────────────────────────────────────────────────────────

// Validation helper
function validateOnboardingInput(req) {
  const {
    primaryGoal, currentWeightKg, goalWeightKg, heightCm, age,
    fitnessLevel, dietType, yogaStyle, workoutDaysPerWeek
  } = req.body;

  const errors = [];

  // Validate age
  if (age !== undefined && (age < 1 || age > 120)) {
    errors.push('age must be between 1 and 120');
  }

  // Validate weights
  if (currentWeightKg !== undefined && (currentWeightKg < 20 || currentWeightKg > 300)) {
    errors.push('currentWeightKg must be between 20 and 300 kg');
  }
  if (goalWeightKg !== undefined && (goalWeightKg < 20 || goalWeightKg > 300)) {
    errors.push('goalWeightKg must be between 20 and 300 kg');
  }

  // Validate primaryGoal
  const VALID_GOALS = ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness'];
  if (primaryGoal && !VALID_GOALS.includes(primaryGoal)) {
    errors.push(`primaryGoal must be one of: ${VALID_GOALS.join(', ')}`);
  }

  // Validate dietType
  const VALID_DIET_TYPES = ['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian'];
  if (dietType && !VALID_DIET_TYPES.includes(dietType)) {
    errors.push(`dietType must be one of: ${VALID_DIET_TYPES.join(', ')}`);
  }

  // Validate fitnessLevel
  const VALID_FITNESS = ['sedentary', 'lightly-active', 'moderately-active', 'very-active'];
  if (fitnessLevel && !VALID_FITNESS.includes(fitnessLevel)) {
    errors.push(`fitnessLevel must be one of: ${VALID_FITNESS.join(', ')}`);
  }

  // Validate yogaStyle
  const VALID_YOGA = ['hatha', 'vinyasa', 'pranayama-only', 'none'];
  if (yogaStyle && !VALID_YOGA.includes(yogaStyle)) {
    errors.push(`yogaStyle must be one of: ${VALID_YOGA.join(', ')}`);
  }

  // Validate workoutDaysPerWeek
  if (workoutDaysPerWeek !== undefined && (workoutDaysPerWeek < 1 || workoutDaysPerWeek > 7)) {
    errors.push('workoutDaysPerWeek must be between 1 and 7');
  }

  return errors.length > 0 ? errors : null;
}

// Onboarding — no existing profile required
router.post('/onboarding', authenticate, async (req, res) => {
  try {
    // Validate input
    const validationErrors = validateOnboardingInput(req);
    if (validationErrors) {
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }

    const {
      primaryGoal, currentWeightKg, goalWeightKg, heightCm, age,
      fitnessLevel, religion, languageCommunity, culturalFoodAvoidances,
      healthConditions, medications, secondaryGoals,
      workoutPreferences, workoutDaysPerWeek, workoutTime, yogaStyle,
      foodAllergies, dietType, cuisinePreference, equipmentAvailable, sex
    } = req.body;

    const VALID = ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness'];
    if (primaryGoal && !VALID.includes(primaryGoal)) {
      return res.status(400).json({ error: `Invalid primaryGoal: ${primaryGoal}` });
    }

    const partialProfile = {
      primaryGoal, planTemplate: primaryGoal,
      currentWeightKg, startWeightKg: currentWeightKg,
      goalWeightKg, heightCm, age, fitnessLevel,
      religion, languageCommunity,
      culturalFoodAvoidances: culturalFoodAvoidances || [],
      healthConditions: normaliseConditions(healthConditions),
      medications:      normaliseMeds(medications),
      secondaryGoals:   secondaryGoals || [],
      foodAllergies:    foodAllergies  || [],
      dietType,
      cuisinePreference:  cuisinePreference  || 'mixed',
      equipmentAvailable: equipmentAvailable || [],
      workoutPreferences: workoutPreferences || [],
      workoutDaysPerWeek, workoutTime, sex,
      // Default yogaStyle to 'hatha' if user does yoga/hybrid but doesn't specify style
      yogaStyle: yogaStyle || (workoutPreferences && (workoutPreferences.includes('yoga') || workoutPreferences.includes('hybrid')) ? 'hatha' : 'none'),
      startDate: new Date()
    };

    partialProfile.waterGoalL = computeWaterGoal(currentWeightKg);
    Object.assign(partialProfile, computeMacroTargets(partialProfile));

    const updates = {};
    Object.entries(partialProfile).forEach(([k, v]) => {
      if (v !== undefined) updates[`profile.${k}`] = v;
    });
    updates.profileComplete = true;

    const updated = await User.findByIdAndUpdate(
      req.user._id, updates, { runValidators: true, new: true, lean: true }
    );

    try {
      await writeSnapshot(req.user._id, updated.profile, 'onboarding');
    } catch (snapErr) {
      console.error('[ProfileSnapshot] write failed:', snapErr.message);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Plan generation
router.get('/plan', authenticate, requireProfile, async (req, res) => {
  try {
    const profile = req.user.profile;
    const templateKey = profile.planTemplate || profile.primaryGoal || 'weight-loss';
    const template = TEMPLATES[templateKey];
    if (!template) return res.status(400).json({ error: `Unknown template: ${templateKey}` });
    const profileUpdatedAt = req.user.updatedAt ? new Date(req.user.updatedAt).toISOString() : null;
    const planVersion = profileUpdatedAt;

    // Self-heal: recompute macros if dailyCalorieTarget is missing (e.g. user registered before sex field added)
    if (!profile.dailyCalorieTarget) {
      const macros = computeMacroTargets(profile);
      if (macros.dailyCalorieTarget) {
        Object.assign(profile, macros);
        // Persist the fix silently so future requests don't need recomputing
        const macroUpdates = {};
        Object.entries(macros).forEach(([k, v]) => { macroUpdates[`profile.${k}`] = v; });
        User.findByIdAndUpdate(req.user._id, macroUpdates).catch(() => {});
      }
    }

    res.set('Cache-Control', 'no-store');
    const planMeta = template.getPlanMeta(profile);
    res.json({
      profileUpdatedAt,
      planVersion,
      meta:      { ...planMeta, profileUpdatedAt, planVersion },
      diet:      template.getDietPlan(profile),
      workout:   template.getWorkoutPlan(profile),
      cardio:    template.getCardioPlan(profile),
      grocery:   template.getGroceryList(profile),
      checklist: template.getDefaultChecklist(profile)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Profile completion percentage
router.get('/completion', authenticate, (req, res) => {
  const pct = computeCompletionPct(req.user.profile);
  const missing = PHASE2_FIELDS.filter(f => {
    const v = req.user.profile[f];
    if (v === null || v === undefined) return true;
    if (Array.isArray(v)) return v.length === 0;
    return false;
  });
  res.json({ percentage: pct, missingFields: missing });
});

// Snapshot history
router.get('/snapshots', authenticate, requireProfile, async (req, res) => {
  try {
    const snaps = await ProfileSnapshot.find({ userId: req.user._id })
      .sort({ snapshotAt: -1, _id: -1 }).limit(20).lean();
    res.json(snaps);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get profile
router.get('/', authenticate, (req, res) => {
  res.json(req.user.profile);
});

// Periodic review submission
router.post('/review', authenticate, requireProfile, async (req, res) => {
  try {
    const updates = { 'profile.lastReviewedAt': new Date() };
    if (req.body.healthConditions) {
      updates['profile.healthConditions'] = normaliseConditions(req.body.healthConditions);
    }
    if (req.body.medications) {
      updates['profile.medications'] = normaliseMeds(req.body.medications);
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id, updates, { runValidators: true, new: true, lean: true }
    );
    try {
      await writeSnapshot(req.user._id, updated.profile, 'periodic-review');
    } catch (snapErr) {
      console.error('[ProfileSnapshot] write failed:', snapErr.message);
    }
    res.json({ success: true, lastReviewedAt: updated.profile.lastReviewedAt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH profile (settings + phase 2 updates)
router.patch('/', authenticate, async (req, res) => {
  try {
    const VALID = ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness'];
    if (req.body.planTemplate && !VALID.includes(req.body.planTemplate)) {
      return res.status(400).json({ error: `Invalid planTemplate: ${req.body.planTemplate}` });
    }

    const allowed = [
      'currentWeightKg', 'goalWeightKg', 'heightCm', 'age', 'dietType',
      'cuisinePreference', 'foodAllergies', 'fitnessLevel', 'equipmentAvailable',
      'healthConditions', 'medications', 'secondaryGoals', 'waterGoalL', 'planTemplate',
      'primaryGoal', 'religion', 'languageCommunity', 'culturalFoodAvoidances', 'foodList',
      'workoutPreferences', 'workoutDaysPerWeek', 'workoutTime', 'yogaStyle',
      'reviewReminderDays', 'sex'
    ];

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] === undefined) return;
      if (field === 'healthConditions') {
        updates[`profile.${field}`] = normaliseConditions(req.body[field]);
      } else if (field === 'medications') {
        updates[`profile.${field}`] = normaliseMeds(req.body[field]);
      } else {
        updates[`profile.${field}`] = req.body[field];
      }
    });

    if (req.body.currentWeightKg && req.body.waterGoalL === undefined) {
      updates['profile.waterGoalL'] = computeWaterGoal(req.body.currentWeightKg);
    }

    const currentProfile = req.user.profile || {};
    const patchedFields = {};
    Object.entries(updates).forEach(([k, v]) => {
      if (k.startsWith('profile.')) patchedFields[k.slice('profile.'.length)] = v;
    });
    const mergedProfile = { ...currentProfile, ...patchedFields };
    const macros = computeMacroTargets(mergedProfile);
    if (Object.keys(macros).length > 0) {
      Object.entries(macros).forEach(([k, v]) => { updates[`profile.${k}`] = v; });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id, updates, { runValidators: true, new: true, lean: true }
    );

    const snapshotFieldPaths = ['foodList', 'culturalFoodAvoidances', 'healthConditions',
                                 'medications', 'religion', 'languageCommunity'];
    const hasSignificantUpdate = snapshotFieldPaths.some(f => updates[`profile.${f}`] !== undefined);
    if (hasSignificantUpdate) {
      try {
        await writeSnapshot(req.user._id, updated.profile, 'user-edit');
      } catch (snapErr) {
        console.error('[ProfileSnapshot] write failed:', snapErr.message);
      }
    }

    res.json(updated.profile);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Food checklist — returns items pre-selected for user's community
router.get('/food-checklist', authenticate, (req, res) => {
  try {
    const { getChecklist } = require('../server/data/food-checklist');
    const p = req.user.profile;
    res.json(getChecklist(p.languageCommunity, p.culturalFoodAvoidances));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
