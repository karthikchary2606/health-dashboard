const express = require('express');
const HealthLog = require('../models/HealthLog');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const computeStats = require('../lib/computeStats');

const router = express.Router();
router.use(authenticate, requireProfile);

// Date normalization utility
// Converts Date objects or ISO strings to YYYY-MM-DD format
function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  // If it's already a string in YYYY-MM-DD format, return it
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  
  // Convert Date object or ISO string to YYYY-MM-DD
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date)) {
    return null;
  }
  
  // Use UTC date to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

router.get('/data/weight-history', async (req, res) => {
  try {
    const logs = await HealthLog.find({ userId: req.user._id, weight: { $gt: 0 } })
      .sort({ date: 1 }).select('date weight -_id');
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/stats', async (req, res) => {
  try {
    const logs = await HealthLog.find({ userId: req.user._id }).lean();
    const stats = computeStats(logs, req.user.profile);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/data/weekly-summary', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateThreshold = normalizeDate(sevenDaysAgo);
    
    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: dateThreshold }
    }).lean();
    const stats = computeStats(logs, req.user.profile);
    res.json({ period: 'last-7-days', ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/data/sleep-trend', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateThreshold = normalizeDate(thirtyDaysAgo);
    
    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: dateThreshold },
      'sleepEntry.durationMinutes': { $gt: 0 }
    }).select('date sleepEntry -_id').sort({ date: 1 }).lean();
    res.json(logs.map(l => ({
      date: l.date,
      durationMinutes: l.sleepEntry.durationMinutes,
      quality: l.sleepEntry.quality || 0
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/mood-trend', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateThreshold = normalizeDate(thirtyDaysAgo);
    
    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: dateThreshold }
    }).select('date moodScore energyScore -_id').sort({ date: 1 }).lean();
    res.json(logs.filter(l => l.moodScore > 0 || l.energyScore > 0));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get('/:date', async (req, res) => {
  if (!DATE_RE.test(req.params.date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format (no timezone)' });
  }
  try {
    let log = await HealthLog.findOne({ userId: req.user._id, date: req.params.date });
    if (!log) {
      log = new HealthLog({ userId: req.user._id, date: req.params.date });
      await log.save();
    }
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:date', async (req, res) => {
  if (!DATE_RE.test(req.params.date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format (no timezone)' });
  }
  
  // Validate meals structure if present
  if ('meals' in req.body) {
    if (!Array.isArray(req.body.meals)) {
      return res.status(400).json({ error: 'meals must be an array of meal objects' });
    }
    for (const meal of req.body.meals) {
      if (typeof meal !== 'object' || meal === null) {
        return res.status(400).json({ error: 'Each meal must be an object with {mealType, calories, proteinG, carbsG, fatG}' });
      }
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (meal.mealType && !validMealTypes.includes(meal.mealType)) {
        return res.status(400).json({ error: `mealType must be one of: ${validMealTypes.join(', ')}` });
      }
    }
  }
  
  // Validate durationMinutes is not sent at top level
  if ('durationMinutes' in req.body) {
    return res.status(400).json({ error: 'Sleep duration must be logged via nested sleepEntry.durationMinutes or use POST /api/sleep. See API docs for format.' });
  }

  const allowed = ['weight', 'waterIntake', 'completedWorkout', 'moodScore', 'energyScore', 'notes', 'meals', 'exerciseLog', 'sleepEntry'];
  const update = {};
  for (const key of allowed) {
    if (key in req.body) update[key] = req.body[key];
  }
  if (!Object.keys(update).length) return res.status(400).json({ error: 'No valid fields provided' });
  
  try {
    let outlierDetected = false;
    let outlierType = null;
    let outlierMessage = null;
    
    // Check for weight outliers if weight is being updated
    if ('weight' in update && update.weight > 0) {
      const newWeight = update.weight;
      
      // Get the most recent previous log
      const previousLog = await HealthLog.findOne({
        userId: req.user._id,
        date: { $lt: req.params.date },
        weight: { $gt: 0 }
      }).sort({ date: -1 }).select('weight date');
      
      if (previousLog && previousLog.weight > 0) {
        const delta = Math.abs(newWeight - previousLog.weight);
        // Flag if weight change is unrealistic (> 5kg in one day)
        if (delta > 5) {
          outlierDetected = true;
          outlierType = 'weight-delta';
          outlierMessage = `Weight change of ${delta.toFixed(1)}kg in one day. Previous weight: ${previousLog.weight}kg. Please verify.`;
        }
      }
    }
    
    // Check for other outliers: calorie intake > 10,000 kcal
    if ('meals' in update && Array.isArray(update.meals)) {
      const totalCalories = update.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      if (totalCalories > 10000) {
        outlierDetected = true;
        outlierType = 'calorie-intake';
        outlierMessage = `Total calorie intake of ${totalCalories}kcal is unusually high. Please verify.`;
      }
    }
    
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user._id, date: req.params.date },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );
    
    const response = log.toObject ? log.toObject() : log;
    if (outlierDetected) {
      response.outlierDetected = true;
      response.outlierType = outlierType;
      response.message = outlierMessage;
      response.allowConfirm = true;
    }
    res.json(response);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  let { date, checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes } = req.body;
  
  // Normalize date to YYYY-MM-DD format
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate || !DATE_RE.test(normalizedDate)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format (no timezone). Documentation: All dates are stored as YYYY-MM-DD strings with no timezone conversion.' });
  }
  
  try {
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user._id, date: normalizedDate },
      { checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
