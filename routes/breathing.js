const express = require('express');
const BreathingSession = require('../models/BreathingSession');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const { getFilteredPranayama } = require('../server/data/pranayama');

const router = express.Router();
router.use(authenticate, requireProfile);

router.get('/techniques', (req, res) => {
  res.json(getFilteredPranayama(req.user.profile));
});

router.post('/sessions', async (req, res, next) => {
  const { technique, durationSeconds, cyclesCompleted, moodBefore, moodAfter } = req.body;
  if (!technique) return res.status(400).json({ error: 'technique is required' });
  try {
    const session = await BreathingSession.create({
      userId: req.user._id,
      technique, durationSeconds, cyclesCompleted, moodBefore, moodAfter
    });
    res.status(201).json(session);
  } catch (err) { next(err); }
});

router.get('/sessions', async (req, res, next) => {
  try {
    const sessions = await BreathingSession.find({ userId: req.user._id })
      .sort({ completedAt: -1 }).limit(30);
    res.json(sessions);
  } catch (err) { next(err); }
});

module.exports = router;
