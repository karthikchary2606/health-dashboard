function requireProfile(req, res, next) {
  if (req.user.role === 'admin' || req.user.profileComplete) return next();
  return res.status(403).json({ error: 'Profile incomplete', redirect: '/onboarding.html' });
}

module.exports = requireProfile;
