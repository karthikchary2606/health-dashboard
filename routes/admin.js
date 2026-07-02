const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const ChecklistItem = require('../models/ChecklistItem');
const BreathingSession = require('../models/BreathingSession');
const ProfileSnapshot = require('../models/ProfileSnapshot');
const authenticate = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    const counts = await HealthLog.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { if (c._id) countMap[c._id.toString()] = c.count; });
    const result = users.map(u => ({
      ...u.toObject(),
      logCount: countMap[u._id.toString()] || 0
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/users/:id/approve', async (req, res) => {
  try {
    const { approved } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: approved !== false },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/users', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(), passwordHash, name,
      role: role === 'admin' ? 'admin' : 'user',
      isApproved: true
    });
    res.status(201).json({ _id: user._id, email: user.email, name: user.name, role: user.role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    await HealthLog.deleteMany({ userId: req.params.id });
    await ChecklistItem.deleteMany({ userId: req.params.id });
    await BreathingSession.deleteMany({ userId: req.params.id });
    await ProfileSnapshot.deleteMany({ userId: req.params.id });
    res.json({ message: 'User and their data deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/users/:id/password', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(req.params.id, { passwordHash }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
