const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  // Support both cookie-based auth (browser) and Bearer token (API clients)
  const authHeader = req.headers.authorization;
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.health_token) {
    token = req.cookies.health_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const user = await User.findById(payload.userId).select('-passwordHash').lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.isApproved) return res.status(403).json({ error: 'Account pending approval' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
