const express = require('express');
const BreathingSession = require('../models/BreathingSession');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.post('/sessions', async (req, res) => {
  const { technique, durationSeconds, cyclesCompleted, moodBefore, moodAfter } = req.body;
  if (!technique) return res.status(400).json({ error: 'technique is required' });
  try {
    const session = await BreathingSession.create({
      userId: req.user.userId,
      technique, durationSeconds, cyclesCompleted, moodBefore, moodAfter
    });
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await BreathingSession.find({ userId: req.user.userId })
      .sort({ completedAt: -1 }).limit(30);
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
