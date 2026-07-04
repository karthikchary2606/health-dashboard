const express = require('express');
const mongoose = require('mongoose');
const HealthLog = require('../models/HealthLog');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');

const router = express.Router();
router.use(authenticate, requireProfile);

// Helper to normalize date to YYYY-MM-DD
function localDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// POST /api/tracker/meal
// Body: { fromPlan: Boolean, recipeName: String, calories: Number, mealType: String, date: String }
// Returns: { mealId, calories, logged }
router.post('/meal', async (req, res) => {
  try {
    const { fromPlan, recipeName, calories, mealType, date } = req.body;

    // Validate required fields
    if (!recipeName || calories === undefined || !mealType || !date) {
      return res.status(400).json({ error: 'Missing required fields: recipeName, calories, mealType, date' });
    }

    // Find or create HealthLog for the given date
    let log = await HealthLog.findOne({ userId: req.user._id, date });
    if (!log) {
      log = new HealthLog({
        userId: req.user._id,
        date,
        meals: []
      });
    }

    // Create new meal entry
    const mealEntry = {
      mealType,
      recipeName,
      calories,
      fromPlan: fromPlan || false,
      proteinG: 0,
      carbsG: 0,
      fatG: 0
    };

    log.meals.push(mealEntry);
    await log.save();

    // Return mealId, calories, logged
    const addedMeal = log.meals[log.meals.length - 1];
    res.json({
      mealId: addedMeal._id.toString(),
      calories,
      logged: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tracker/today
// Returns: { meals: [], stepCount: 0, calorieTarget: 2100, consumed: sum, remaining: target - consumed }
router.get('/today', async (req, res) => {
  try {
    const today = localDateString();
    const log = await HealthLog.findOne({ userId: req.user._id, date: today });

    const meals = log ? log.meals : [];
    const stepCount = log ? log.stepCount : 0;
    const calorieTarget = 2100; // Fixed as per spec

    // Calculate consumed and remaining calories
    const consumed = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const remaining = calorieTarget - consumed;

    res.json({
      meals,
      stepCount,
      calorieTarget,
      consumed,
      remaining
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tracker/meal/:mealId
// Returns: { deleted: true }
router.delete('/meal/:mealId', async (req, res) => {
  try {
    const { mealId } = req.params;
    const today = localDateString();

    // Find the meal in today's log
    const log = await HealthLog.findOne({ userId: req.user._id, date: today });
    if (!log) {
      return res.status(404).json({ error: 'No log for today' });
    }

    const mealIndex = log.meals.findIndex(m => m._id.toString() === mealId);
    if (mealIndex === -1) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    log.meals.splice(mealIndex, 1);
    await log.save();

    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tracker/meal/:mealId
// Body: { recipeName, calories, mealType }
// Returns: { ...updated meal }
router.patch('/meal/:mealId', async (req, res) => {
  try {
    const { mealId } = req.params;
    const { recipeName, calories, mealType } = req.body;
    const today = localDateString();

    // Find the meal in today's log
    const log = await HealthLog.findOne({ userId: req.user._id, date: today });
    if (!log) {
      return res.status(404).json({ error: 'No log for today' });
    }

    const meal = log.meals.find(m => m._id.toString() === mealId);
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Update fields if provided
    if (recipeName !== undefined) meal.recipeName = recipeName;
    if (calories !== undefined) meal.calories = calories;
    if (mealType !== undefined) meal.mealType = mealType;

    await log.save();

    res.json(meal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tracker/steps
// Body: { stepCount: Number, date: String }
// Returns: { stepCount, date }
router.patch('/steps', async (req, res) => {
  try {
    const { stepCount, date } = req.body;

    // Validate required fields
    if (stepCount === undefined || !date) {
      return res.status(400).json({ error: 'Missing required fields: stepCount, date' });
    }

    // Find or create HealthLog for the given date
    let log = await HealthLog.findOne({ userId: req.user._id, date });
    if (!log) {
      log = new HealthLog({
        userId: req.user._id,
        date,
        stepCount
      });
    } else {
      log.stepCount = stepCount;
    }

    await log.save();

    res.json({ stepCount, date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tracker/summary/:date
// Returns: { meals, stepCount, calorieTarget, consumed, remaining }
router.get('/summary/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const log = await HealthLog.findOne({ userId: req.user._id, date });

    const meals = log ? log.meals : [];
    const stepCount = log ? log.stepCount : 0;
    const calorieTarget = 2100; // Fixed as per spec

    // Calculate consumed and remaining calories
    const consumed = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const remaining = calorieTarget - consumed;

    res.json({
      date,
      meals,
      stepCount,
      calorieTarget,
      consumed,
      remaining
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
