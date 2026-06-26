const express = require('express');
const HealthLog = require('../models/HealthLog');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const computeStats = require('../lib/computeStats');

const router = express.Router();
router.use(authenticate, requireProfile);

router.get('/:date', async (req, res) => {
  try {
    let log = await HealthLog.findOne({ userId: req.user._id, date: req.params.date });
    if (!log) {
      log = new HealthLog({ userId: req.user._id, date: req.params.date });
      await log.save();
    }
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { date, checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes } = req.body;
  try {
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user._id, date },
      { checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/weight-history', async (req, res) => {
  try {
    const logs = await HealthLog.find({ userId: req.user._id, weight: { $gt: 0 } })
      .sort({ date: 1 }).select('date weight -_id');
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/stats', authenticate, requireProfile, async (req, res) => {
  try {
    const logs = await HealthLog.find({ userId: req.user._id }).lean();
    const stats = computeStats(logs, req.user.profile);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/data/weekly-summary', authenticate, requireProfile, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: sevenDaysAgo }
    }).lean();
    const stats = computeStats(logs, req.user.profile);
    res.json({ period: 'last-7-days', ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
