const express = require('express');
const HealthLog = require('../models/HealthLog');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/:date', async (req, res) => {
  try {
    let log = await HealthLog.findOne({ userId: req.user.userId, date: req.params.date });
    if (!log) {
      log = new HealthLog({ userId: req.user.userId, date: req.params.date });
      await log.save();
    }
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { date, checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes } = req.body;
  try {
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user.userId, date },
      { checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/weight-history', async (req, res) => {
  try {
    const logs = await HealthLog.find({ userId: req.user.userId, weight: { $gt: 0 } })
      .sort({ date: 1 }).select('date weight -_id');
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/stats', async (req, res) => {
  try {
    const last30 = await HealthLog.find({ userId: req.user.userId })
      .sort({ date: -1 }).limit(30).select('date weight waterIntake completedWorkout checklist');
    const allWeights = last30.filter(l => l.weight > 0).map(l => l.weight);
    const currentWeight = allWeights[0] || 0;
    const startWeight = allWeights[allWeights.length - 1] || 0;
    let workoutStreak = 0, waterStreak = 0;
    for (const log of last30) { if (log.completedWorkout) workoutStreak++; else break; }
    for (const log of last30) { if (log.waterIntake >= 3) waterStreak++; else break; }
    const completionRates = last30.map(l =>
      l.checklist.length ? (l.checklist.filter(c => c.done).length / l.checklist.length) * 100 : 0
    );
    const avgCompletion = completionRates.length
      ? completionRates.reduce((s, v) => s + v, 0) / completionRates.length : 0;
    res.json({
      currentWeight, startWeight,
      weightLost: parseFloat((startWeight - currentWeight).toFixed(1)),
      workoutStreak, waterStreak,
      avgCompletion: parseFloat(avgCompletion.toFixed(0)),
      totalDaysLogged: last30.length
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
