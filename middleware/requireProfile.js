// Tier 1 (MVP) - minimum required fields for a complete profile
const TIER1_FIELDS = [
  'primaryGoal',
  'age',
  'currentWeightKg',
  'heightCm',
  'dietType'
];

function isTier1Complete(profile) {
  if (!profile) return true; // If no profile object, assume it's okay (legacy behavior)
  return TIER1_FIELDS.every(field => {
    const value = profile[field];
    // Check field is not null, undefined, empty string, or NaN
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'number' && isNaN(value)) return false;
    return true;
  });
}

function requireProfile(req, res, next) {
  if (req.user.role === 'admin') return next();
  
  // Check if profileComplete flag is set
  if (!req.user.profileComplete) {
    return res.status(403).json({ error: 'Profile incomplete', redirect: '/onboarding.html' });
  }
  
  // Check if Tier 1 critical fields are actually filled (only if profile object exists)
  if (req.user.profile && !isTier1Complete(req.user.profile)) {
    const profile = req.user.profile || {};
    const missingFields = TIER1_FIELDS.filter(field => {
      const value = profile[field];
      if (value === null || value === undefined || value === '') return true;
      if (typeof value === 'number' && isNaN(value)) return true;
      return false;
    });
    
    return res.status(403).json({
      error: 'Profile incomplete: missing critical fields',
      profileComplete: true,
      missingFields,
      message: `Please complete these fields: ${missingFields.join(', ')}`,
      redirect: '/profile'
    });
  }
  
  return next();
}

module.exports = requireProfile;
