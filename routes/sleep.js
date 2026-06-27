// routes/sleep.js
'use strict';
const express = require('express');
const HealthLog = require('../models/HealthLog');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const { computeSleepStats } = require('../lib/sleepStats');

const router = express.Router();
router.use(authenticate, requireProfile);

// Parse "HH:MM" into minutes-since-midnight
function timeToMinutes(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

// Calculate durationMinutes from bedtime/wakeTime strings ("HH:MM"), handling overnight
function calcDuration(bedtime, wakeTime) {
  let bed = timeToMinutes(bedtime);
  let wake = timeToMinutes(wakeTime);
  if (wake <= bed) wake += 24 * 60; // overnight
  return wake - bed;
}

// POST /api/sleep — create or update sleep entry for a given date
router.post('/', async (req, res, next) => {
  try {
    const { bedtime, wakeTime, quality, notes } = req.body;
    let { date, durationMinutes } = req.body;

    // Default date to today
    if (!date) date = new Date().toISOString().slice(0, 10);

    // Calculate duration from times if provided
    if (bedtime && wakeTime) {
      durationMinutes = calcDuration(bedtime, wakeTime);
    }

    // Validate
    if (!durationMinutes || durationMinutes <= 0) {
      return res.status(400).json({ error: 'Provide durationMinutes or both bedtime and wakeTime' });
    }
    if (quality !== undefined && (quality < 1 || quality > 5)) {
      return res.status(400).json({ error: 'quality must be between 1 and 5' });
    }

    const sleepEntry = { durationMinutes, quality: quality || null, notes: notes || '' };
    if (bedtime) sleepEntry.bedtime = bedtime;
    if (wakeTime) sleepEntry.wakeTime = wakeTime;

    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user._id, date },
      { $set: { sleepEntry } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(log.sleepEntry);
  } catch (err) { next(err); }
});

// GET /api/sleep/history — last 30 days of sleep entries, newest first
router.get('/history', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: cutoff },
      'sleepEntry.durationMinutes': { $gt: 0 }
    }).sort({ date: -1 }).select('date sleepEntry -_id').lean();

    const entries = logs.map(l => ({
      date: l.date,
      durationMinutes: l.sleepEntry.durationMinutes,
      quality: l.sleepEntry.quality,
      bedtime: l.sleepEntry.bedtime || null,
      wakeTime: l.sleepEntry.wakeTime || null,
      notes: l.sleepEntry.notes || ''
    }));

    res.json(entries);
  } catch (err) { next(err); }
});

// GET /api/sleep/stats — aggregated stats
router.get('/stats', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

    const logs = await HealthLog.find({
      userId: req.user._id,
      date: { $gte: cutoff },
      'sleepEntry.durationMinutes': { $gt: 0 }
    }).sort({ date: -1 }).select('date sleepEntry -_id').lean();

    const entries = logs.map(l => ({
      date: l.date,
      durationMinutes: l.sleepEntry.durationMinutes,
      quality: l.sleepEntry.quality
    }));

    res.json(computeSleepStats(entries));
  } catch (err) { next(err); }
});

module.exports = router;
