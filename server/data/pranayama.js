'use strict';

const PRANAYAMA = [
  {
    id: 'nadi-shodhana',
    name: 'Nadi Shodhana',
    sanskrit: 'नाडी शोधन',
    aka: 'Alternate Nostril Breathing',
    ageMin: 0, ageMax: 120,
    contraindicatedConditions: [],
    contraindicatedMedications: [],
    rounds: 10,
    durationMin: 10,
    bestTime: 'morning',
    benefits: ['Calms nervous system', 'Reduces anxiety', 'Balances left-right brain', 'Lowers blood pressure'],
    steps: [
      'Sit comfortably with spine erect.',
      'Close right nostril with right thumb. Inhale slowly through left nostril for 4 counts.',
      'Close both nostrils. Hold for 4 counts.',
      'Release right nostril. Exhale through right nostril for 4 counts.',
      'Inhale through right nostril for 4 counts.',
      'Close both nostrils. Hold for 4 counts.',
      'Release left nostril. Exhale through left nostril for 4 counts.',
      'This completes one round. Repeat 10 rounds.'
    ]
  },
  {
    id: 'anulom-vilom',
    name: 'Anulom Vilom',
    sanskrit: 'अनुलोम विलोम',
    aka: 'Alternate Nostril Breathing (without retention)',
    ageMin: 0, ageMax: 120,
    contraindicatedConditions: [],
    contraindicatedMedications: [],
    rounds: 15,
    durationMin: 10,
    bestTime: 'morning',
    benefits: ['Manages blood pressure', 'Supports diabetes management', 'Improves lung capacity', 'Reduces stress'],
    steps: [
      'Sit in Sukhasana or Padmasana with eyes closed.',
      'Place left hand on left knee, right hand in Nasagra mudra.',
      'Close right nostril with right thumb. Inhale through left nostril for 4 counts.',
      'Close left nostril with ring finger. Exhale through right nostril for 4 counts.',
      'Inhale through right nostril for 4 counts.',
      'Close right nostril. Exhale through left nostril for 4 counts.',
      'This completes one round. Repeat 15 rounds.'
    ]
  },
  {
    id: 'bhramari',
    name: 'Bhramari',
    sanskrit: 'भ्रामरी',
    aka: 'Humming Bee Breath',
    ageMin: 0, ageMax: 120,
    contraindicatedConditions: [],
    contraindicatedMedications: [],
    rounds: 7,
    durationMin: 5,
    bestTime: 'evening',
    benefits: ['Relieves anxiety and anger', 'Improves sleep quality', 'Reduces headache', 'Calms the mind instantly'],
    steps: [
      'Sit comfortably. Close eyes.',
      'Place thumbs on ears, index fingers above eyebrows, remaining fingers covering eyes.',
      'Breathe in deeply through both nostrils.',
      'On exhale, make a humming sound like a bee — "hmmm" — feel the vibration.',
      'Keep mouth closed throughout. Repeat 7 times.'
    ]
  },
  {
    id: 'kapalabhati',
    name: 'Kapalabhati',
    sanskrit: 'कपालभाति',
    aka: 'Skull Shining Breath',
    ageMin: 18, ageMax: 55,
    contraindicatedConditions: ['hypertension', 'heart-disease', 'epilepsy', 'hernia', 'acid-reflux'],
    contraindicatedMedications: ['blood-thinners'],
    rounds: 3,
    durationMin: 5,
    bestTime: 'morning',
    benefits: ['Detoxifies respiratory system', 'Boosts metabolism', 'Strengthens abdominal muscles', 'Increases energy'],
    steps: [
      'Sit with spine erect. Take a deep breath in.',
      'Exhale forcefully through nose, pulling abdomen in sharply.',
      'Inhalation is passive — just relax abdomen after each exhale.',
      'Start with 30 strokes/minute, gradually increase to 60–120.',
      'Do 3 rounds of 30 strokes each, with 30-second rest between rounds.'
    ]
  },
  {
    id: 'bhastrika',
    name: 'Bhastrika',
    sanskrit: 'भस्त्रिका',
    aka: 'Bellows Breath',
    ageMin: 18, ageMax: 45,
    contraindicatedConditions: ['hypertension', 'heart-disease', 'epilepsy', 'pregnancy'],
    contraindicatedMedications: [],
    rounds: 3,
    durationMin: 5,
    bestTime: 'morning',
    benefits: ['Energises the body', 'Strengthens lungs', 'Improves digestion', 'Generates body heat'],
    steps: [
      'Sit comfortably with spine erect.',
      'Inhale forcefully and deeply through both nostrils — chest expands fully.',
      'Exhale forcefully through both nostrils — abdomen contracts.',
      'Both inhale and exhale are active and forceful (unlike Kapalabhati).',
      'Maintain pace of 1 breath/second. Do 10 breaths, then rest. Repeat 3 rounds.'
    ]
  },
  {
    id: 'ujjayi',
    name: 'Ujjayi',
    sanskrit: 'उज्जायी',
    aka: 'Ocean Breath / Victorious Breath',
    ageMin: 0, ageMax: 120,
    contraindicatedConditions: [],
    contraindicatedMedications: [],
    rounds: 10,
    durationMin: 5,
    bestTime: 'morning',
    benefits: ['Builds heat in body', 'Improves concentration', 'Calms the mind', 'Regulates blood pressure'],
    steps: [
      'Sit or lie down comfortably.',
      "Slightly constrict the back of the throat as if you're about to whisper \"ha\".",
      'Breathe in slowly through nose — you should hear a soft hissing sound.',
      'Exhale slowly through nose with the same throat constriction.',
      'Inhale 4 counts, exhale 6 counts. Repeat 10 rounds.'
    ]
  }
];

function getFilteredPranayama(profile) {
  const age = profile.age || 30;
  const activeConditions = (profile.healthConditions || [])
    .filter(c => typeof c === 'string' || c.active !== false)
    .map(c => (typeof c === 'string' ? c : c.name));
  const activeMeds = (profile.medications || [])
    .filter(m => typeof m === 'string' || m.active !== false)
    .map(m => (typeof m === 'string' ? m : m.name));

  return PRANAYAMA.filter(tech => {
    if (age < tech.ageMin || age > tech.ageMax) return false;
    if (tech.contraindicatedConditions.some(c => activeConditions.includes(c))) return false;
    if (tech.contraindicatedMedications.some(m => activeMeds.includes(m))) return false;
    return true;
  });
}

module.exports = { PRANAYAMA, getFilteredPranayama };
