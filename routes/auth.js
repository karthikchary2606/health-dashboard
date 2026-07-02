const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, try again in 15 minutes' }
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts, try again in 15 minutes' }
});

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
};

router.post('/register', registerLimiter, async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: email.toLowerCase(), passwordHash, name, isApproved: true });
    res.status(201).json({ message: 'Registration successful. Please complete your profile to get started.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.isApproved) return res.status(403).json({ error: 'Your account is awaiting admin approval.' });
    await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('health_token', token, COOKIE_OPTS);
    res.json({ name: user.name, role: user.role, profile: user.profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('health_token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ message: 'Logged out' });
});

const TIER1 = ['primaryGoal', 'age', 'currentWeightKg', 'heightCm', 'dietType'];

router.get('/me', authenticate, async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select('-passwordHash').lean();
    if (!user || !user.isApproved) return res.status(401).json({ error: 'Not authenticated' });

    // Self-heal: if Tier 1 fields are present but profileComplete is false, fix it
    if (!user.profileComplete && user.profile) {
      const isTier1Done = TIER1.every(f => {
        const v = user.profile[f];
        return v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && isNaN(v));
      });
      if (isTier1Done) {
        await User.findByIdAndUpdate(user._id, { profileComplete: true });
        user = { ...user, profileComplete: true };
      }
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
