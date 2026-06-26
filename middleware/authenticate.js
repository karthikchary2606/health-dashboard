const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const user = await User.findById(payload.id).lean();
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (!user.isApproved) return res.status(403).json({ error: 'Account pending approval' });
  req.user = user;
  next();
}

module.exports = authenticate;
