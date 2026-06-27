const express = require('express');
const HealthLog = require('../models/HealthLog');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const computeStats = require('../lib/computeStats');

const router = express.Router();
router.use(authenticate, requireProfile);

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

router.get('/data/sleep-trend', authenticate, requireProfile, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: thirtyDaysAgo.toISOString().slice(0, 10) },
      'sleepEntry.durationMinutes': { $gt: 0 }
    }).select('date sleepEntry -_id').sort({ date: 1 }).lean();
    res.json(logs.map(l => ({
      date: l.date,
      durationMinutes: l.sleepEntry.durationMinutes,
      quality: l.sleepEntry.quality || 0
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/mood-trend', authenticate, requireProfile, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: thirtyDaysAgo.toISOString().slice(0, 10) }
    }).select('date moodScore energyScore -_id').sort({ date: 1 }).lean();
    res.json(logs.filter(l => l.moodScore > 0 || l.energyScore > 0));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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

router.patch('/:date', async (req, res) => {
  const allowed = ['weight', 'waterIntake', 'completedWorkout', 'moodScore', 'energyScore', 'notes', 'meals', 'exerciseLog'];
  const update = {};
  for (const key of allowed) {
    if (key in req.body) update[key] = req.body[key];
  }
  if (!Object.keys(update).length) return res.status(400).json({ error: 'No valid fields provided' });
  try {
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user._id, date: req.params.date },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );
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

module.exports = router;
