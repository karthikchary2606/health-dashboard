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

function computeMacroTargets(profile) {
  if (!profile.age || !profile.heightCm || !profile.currentWeightKg) return {};
  // Gender not captured yet — return empty rather than apply wrong constant
  // TODO: add gender field to onboarding to enable accurate BMR
  return {};
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

// Onboarding — no existing profile required
router.post('/onboarding', authenticate, async (req, res) => {
  try {
    const {
      primaryGoal, currentWeightKg, goalWeightKg, heightCm, age,
      fitnessLevel, religion, languageCommunity, culturalFoodAvoidances,
      healthConditions, medications, secondaryGoals,
      workoutPreferences, workoutDaysPerWeek, workoutTime, yogaStyle,
      foodAllergies, dietType, cuisinePreference, equipmentAvailable
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
      workoutDaysPerWeek, workoutTime, yogaStyle,
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
    res.set('Cache-Control', 'no-store');
    res.json({
      meta:      template.getPlanMeta(profile),
      diet:      template.getDietPlan(profile),
      workout:   template.getWorkoutPlan(profile),
      cardio:    template.getCardioPlan(profile),
      grocery:   template.getGroceryList(profile),
      checklist: template.getDefaultChecklist(profile)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Profile completion percentage
router.get('/completion', authenticate, requireProfile, (req, res) => {
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
router.get('/', authenticate, requireProfile, (req, res) => {
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
router.patch('/', authenticate, requireProfile, async (req, res) => {
  try {
    const VALID = ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness'];
    if (req.body.planTemplate && !VALID.includes(req.body.planTemplate)) {
      return res.status(400).json({ error: `Invalid planTemplate: ${req.body.planTemplate}` });
    }

    const allowed = [
      'currentWeightKg', 'goalWeightKg', 'heightCm', 'age', 'dietType',
      'cuisinePreference', 'foodAllergies', 'fitnessLevel', 'equipmentAvailable',
      'healthConditions', 'medications', 'secondaryGoals', 'waterGoalL', 'planTemplate',
      'religion', 'languageCommunity', 'culturalFoodAvoidances', 'foodList',
      'workoutPreferences', 'workoutDaysPerWeek', 'workoutTime', 'yogaStyle',
      'reviewReminderDays'
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
router.get('/food-checklist', authenticate, requireProfile, (req, res) => {
  const { getChecklist } = require('../server/data/food-checklist');
  const p = req.user.profile;
  res.json(getChecklist(p.languageCommunity, p.culturalFoodAvoidances));
});

module.exports = router;
