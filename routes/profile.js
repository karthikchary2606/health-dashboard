const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const User = require('../models/User');

const TEMPLATES = {
  'weight-loss':     require('../server/templates/weight-loss'),
  'muscle-gain':     require('../server/templates/muscle-gain'),
  'maintenance':     require('../server/templates/maintenance'),
  'general-fitness': require('../server/templates/general-fitness')
};

// Onboarding: authenticate only — user doesn't have a profile yet
router.post('/onboarding', authenticate, async (req, res) => {
  try {
    const {
      primaryGoal, currentWeightKg, goalWeightKg, heightCm, age,
      dietType, cuisinePreference, foodAllergies, fitnessLevel,
      equipmentAvailable, healthConditions, medications,
      secondaryGoals, waterGoalL
    } = req.body;

    const VALID_TEMPLATES = ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness'];
    if (primaryGoal && !VALID_TEMPLATES.includes(primaryGoal)) {
      return res.status(400).json({ error: `Invalid primaryGoal: ${primaryGoal}` });
    }

    await User.findByIdAndUpdate(req.user._id, {
      profileComplete: true,
      'profile.primaryGoal':       primaryGoal,
      'profile.planTemplate':      primaryGoal,
      'profile.currentWeightKg':   currentWeightKg,
      'profile.goalWeightKg':      goalWeightKg,
      'profile.heightCm':          heightCm,
      'profile.age':               age,
      'profile.dietType':          dietType,
      'profile.cuisinePreference': cuisinePreference || 'mixed',
      'profile.foodAllergies':     foodAllergies || [],
      'profile.fitnessLevel':      fitnessLevel,
      'profile.equipmentAvailable': equipmentAvailable || [],
      'profile.healthConditions':  healthConditions || [],
      'profile.medications':       medications || [],
      'profile.secondaryGoals':    secondaryGoals || [],
      'profile.waterGoalL':        waterGoalL || 2.5,
      'profile.startDate':         new Date()
    }, { runValidators: true, new: true });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/plan', authenticate, requireProfile, async (req, res) => {
  try {
    const profile = req.user.profile;
    const templateKey = profile.planTemplate || profile.primaryGoal || 'weight-loss';
    const template = TEMPLATES[templateKey];
    if (!template) return res.status(400).json({ error: `Unknown template: ${templateKey}` });

    res.json({
      meta:      template.getPlanMeta(profile),
      diet:      template.getDietPlan(profile),
      workout:   template.getWorkoutPlan(profile),
      cardio:    template.getCardioPlan(profile),
      grocery:   template.getGroceryList(profile),
      checklist: template.getDefaultChecklist(profile)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, requireProfile, async (req, res) => {
  // req.user is a lean plain object (from authenticate middleware)
  res.json(req.user.profile);
});

router.patch('/', authenticate, requireProfile, async (req, res) => {
  try {
    const VALID_TEMPLATES = ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness'];
    if (req.body.planTemplate && !VALID_TEMPLATES.includes(req.body.planTemplate)) {
      return res.status(400).json({ error: `Invalid planTemplate: ${req.body.planTemplate}` });
    }

    const allowed = [
      'currentWeightKg', 'goalWeightKg', 'heightCm', 'age', 'dietType',
      'cuisinePreference', 'foodAllergies', 'fitnessLevel', 'equipmentAvailable',
      'healthConditions', 'medications', 'secondaryGoals', 'waterGoalL', 'planTemplate'
    ];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[`profile.${field}`] = req.body[field];
    });
    const updated = await User.findByIdAndUpdate(req.user._id, updates, { runValidators: true, new: true, lean: true });
    res.json(updated.profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
