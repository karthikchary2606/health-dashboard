'use strict';

const { getMeals, deriveEffectiveDiet, hashSeed } = require('./meal-composer');
const { getExercises, getSuryaNamaskarRounds, getYogaExercises } = require('./exercise-composer');

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ─── Workout block rotation (4-week / per-month blocks) ───────────────────────

/**
 * Computes a deterministic variation offset for a given profile at a given
 * workout month/block. Each `monthLabel` in the 6-month plan already spans a
 * 4-week block, so monthIndex doubles as the block index. The seed folds in
 * user/profile traits (userId, workoutPreferences, yogaStyle) plus the block
 * index, so the same profile within the same month is always deterministic,
 * while moving to a new month/block shifts the rotation pattern (varying
 * slot ordering, yoga style progression, and cardio session order) without
 * any randomness.
 *
 * @param {object} profile    - { userId, workoutPreferences, yogaStyle, ... }
 * @param {number} monthIndex - 0-based month/block index (0..5)
 * @returns {number} rotation offset (non-negative integer)
 */
function workoutVariantOffset(profile, monthIndex) {
  const seedParts = [
    profile.userId || profile.id || 'anon',
    (profile.workoutPreferences || []).join(','),
    profile.yogaStyle || '',
    'workout-block',
    monthIndex,
  ];
  return hashSeed(seedParts.join('|'));
}

/**
 * Left-rotates an array by `offset` positions (deterministic, no mutation).
 * @param {Array} arr
 * @param {number} offset
 * @returns {Array}
 */
function rotateArray(arr, offset) {
  const n = arr.length;
  if (n === 0) return arr;
  const k = ((offset % n) + n) % n;
  return arr.slice(k).concat(arr.slice(0, k));
}

// ─── Cardio phases ────────────────────────────────────────────────────────────

const CARDIO_PHASES = [
  {
    phaseLabel: 'Phase 1 - Foundation',
    focus: 'Build aerobic base with easy effort',
    note: 'Zone 2 only — you should be able to hold a conversation throughout.',
    sessions: [
      { day: 'Mon', session: 'Brisk Walk', duration: '20 min', intensity: 'Low',  note: 'Zone 2 effort'  },
      { day: 'Wed', session: 'Cycling',    duration: '20 min', intensity: 'Low',  note: 'Steady pace'    },
      { day: 'Fri', session: 'Walk',       duration: '25 min', intensity: 'Low',  note: 'Easy pace'      },
    ],
    hrZones: { zone2: '120-135 bpm' },
  },
  {
    phaseLabel: 'Phase 2 - Build',
    focus: 'Introduce continuous jogging',
    note: 'Aim for 20 min non-stop jog by end of month.',
    sessions: [
      { day: 'Mon', session: 'Jog/Walk', duration: '25 min', intensity: 'Moderate', note: 'Alternate 1 min jog 2 min walk' },
      { day: 'Wed', session: 'Cycling',  duration: '30 min', intensity: 'Moderate', note: ''                               },
      { day: 'Fri', session: 'Jog',      duration: '25 min', intensity: 'Moderate', note: 'Zone 3 effort'                  },
    ],
    hrZones: { zone3: '135-155 bpm' },
  },
  {
    phaseLabel: 'Phase 3 - Intensity',
    focus: 'Add HIIT to raise VO2 max',
    note: 'Maximum effort sprints — full recovery between intervals.',
    sessions: [
      { day: 'Mon', session: 'HIIT Walk-Sprint', duration: '25 min', intensity: 'High',     note: '30s sprint 90s walk x8' },
      { day: 'Wed', session: 'Steady Run',       duration: '30 min', intensity: 'Moderate', note: ''                       },
      { day: 'Fri', session: 'HIIT',             duration: '25 min', intensity: 'High',     note: ''                       },
    ],
    hrZones: { zone4: '155-170 bpm' },
  },
  {
    phaseLabel: 'Phase 4 - Performance',
    focus: 'Tempo and interval work for speed',
    note: 'Hard effort should feel "comfortably hard" — controlled, not all-out.',
    sessions: [
      { day: 'Mon', session: 'Interval Run',   duration: '30 min', intensity: 'High', note: '1 min hard 1 min easy' },
      { day: 'Wed', session: 'Tempo Run',      duration: '30 min', intensity: 'High', note: 'Comfortably hard pace' },
      { day: 'Sat', session: 'Long Easy Run',  duration: '45 min', intensity: 'Low',  note: 'Conversational pace'  },
    ],
    hrZones: { zone4: '155-170 bpm', zone5: '170+ bpm' },
  },
  {
    phaseLabel: 'Phase 5 - Peak',
    focus: 'Race-pace efforts and long runs',
    note: 'Prioritise sleep and nutrition — recovery drives peak performance.',
    sessions: [
      { day: 'Mon', session: 'Race Pace Run', duration: '35 min', intensity: 'High',     note: '' },
      { day: 'Thu', session: 'Tempo Run',     duration: '30 min', intensity: 'High',     note: '' },
      { day: 'Sat', session: 'Long Run',      duration: '50 min', intensity: 'Moderate', note: '' },
    ],
    hrZones: { zone4: '155-170 bpm', zone5: '170+ bpm' },
  },
  {
    phaseLabel: 'Phase 6 - Maintenance',
    focus: 'Sustain fitness with enjoyable running',
    note: 'You have built a solid base — protect it with consistent easy miles.',
    sessions: [
      { day: 'Mon', session: 'Steady Run',    duration: '30 min', intensity: 'Moderate', note: '' },
      { day: 'Wed', session: 'Easy Run',      duration: '25 min', intensity: 'Low',      note: '' },
      { day: 'Sat', session: 'Long Easy Run', duration: '40 min', intensity: 'Low',      note: '' },
    ],
    hrZones: { zone3: '135-155 bpm' },
  },
];

// ─── Grocery categories ───────────────────────────────────────────────────────

// Kept for backwards-compatibility — no longer used by buildGroceryList.
const GROCERY_CATEGORIES = {
  'non-vegetarian': [
    { name: 'Grains & Legumes', items: ['brown rice', 'dal', 'oats'] },
    { name: 'Proteins',         items: ['chicken breast 500g/week', 'fish 2-3 portions/week', 'eggs 4-5/week'] },
    { name: 'Vegetables',       items: ['spinach', 'broccoli', 'carrots', 'tomatoes', 'onions', 'garlic'] },
    { name: 'Fruits',           items: ['banana', 'apple', 'orange', 'papaya'] },
    { name: 'Fats & Oils',      items: ['coconut oil', 'nuts', 'seeds'] },
  ],
  'vegetarian': [
    { name: 'Grains & Legumes',  items: ['brown rice', 'dal', 'oats'] },
    { name: 'Vegetables',        items: ['spinach', 'broccoli', 'carrots', 'tomatoes', 'onions', 'garlic'] },
    { name: 'Fruits',            items: ['banana', 'apple', 'orange', 'papaya'] },
    { name: 'Dairy & Protein',   items: ['paneer 100g/day', 'greek yogurt', 'tofu', 'lentils'] },
    { name: 'Fats & Oils',       items: ['coconut oil', 'nuts', 'seeds'] },
  ],
  'vegan': [
    { name: 'Grains & Legumes',  items: ['brown rice', 'dal', 'oats'] },
    { name: 'Vegetables',        items: ['spinach', 'broccoli', 'carrots', 'tomatoes', 'onions', 'garlic'] },
    { name: 'Fruits',            items: ['banana', 'apple', 'orange', 'papaya'] },
    { name: 'Dairy & Protein',   items: ['tofu', 'tempeh', 'lentils', 'chickpeas'] },
    { name: 'Fats & Oils',       items: ['coconut oil', 'nuts', 'seeds'] },
  ],
  'eggetarian': [
    { name: 'Grains & Legumes', items: ['brown rice', 'dal', 'oats'] },
    { name: 'Proteins',         items: ['eggs 6-8/week', 'paneer', 'greek yogurt', 'tofu', 'lentils'] },
    { name: 'Vegetables',       items: ['spinach', 'broccoli', 'carrots', 'tomatoes', 'onions', 'garlic'] },
    { name: 'Fruits',           items: ['banana', 'apple', 'orange', 'papaya'] },
    { name: 'Fats & Oils',      items: ['coconut oil', 'nuts', 'seeds'] },
  ],
};

// ─── Cuisine-specific pantry staples ─────────────────────────────────────────

const CUISINE_STAPLES = {
  'south-indian': {
    grains: ['idli rice', 'urad dal', 'tamarind', 'rice flour', 'poha (beaten rice)'],
    aromatics: ['curry leaves', 'mustard seeds', 'sambar powder', 'rasam powder', 'dried red chillies', 'coconut (grated/milk)', 'asafoetida (hing)'],
    nonVegProteins: ['fish (pomfret/rohu/tilapia)', 'prawns', 'chicken curry cut'],
    vegProteins: ['raw banana', 'drumstick (murungakkai)', 'ash gourd', 'colocasia (arbi)'],
  },
  'north-indian': {
    grains: ['whole wheat atta', 'besan (chickpea flour)', 'rajma', 'chole (chickpeas)', 'moong dal'],
    aromatics: ['ghee', 'garam masala', 'coriander powder', 'jeera (cumin)', 'kasuri methi', 'amchur powder', 'turmeric'],
    nonVegProteins: ['chicken (whole/curry cut)', 'eggs'],
    vegProteins: ['paneer 200g', 'sarson (mustard greens, seasonal)'],
  },
  'continental': {
    grains: ['pasta (penne/spaghetti)', 'sourdough bread', 'quinoa', 'rolled oats'],
    aromatics: ['extra virgin olive oil', 'mixed Italian herbs', 'balsamic vinegar', 'dijon mustard', 'garlic powder'],
    nonVegProteins: ['salmon fillets', 'chicken breast (boneless)', 'eggs'],
    vegProteins: ['mozzarella', 'cherry tomatoes', 'zucchini', 'aubergine (eggplant)', 'mixed salad greens'],
  },
  'mixed': {
    grains: ['brown rice', 'whole wheat atta', 'oats', 'mixed dal'],
    aromatics: ['turmeric', 'cumin', 'coriander powder', 'garlic', 'ginger'],
    nonVegProteins: ['chicken breast 500g/week', 'fish 2-3 portions/week', 'eggs 4-5/week'],
    vegProteins: ['paneer 100g/day', 'tofu', 'greek yogurt'],
  },
};

function getCuisineGrocery(dietType, cuisinePreference) {
  const isVeg = ['vegetarian', 'vegan', 'eggetarian'].includes(dietType);
  const isVegan = dietType === 'vegan';
  const staples = CUISINE_STAPLES[cuisinePreference] || CUISINE_STAPLES['mixed'];

  const dairyTerms = ['mozzarella', 'paneer', 'yogurt', 'milk', 'ghee', 'butter', 'cream', 'cheese'];

  let proteinItems = isVeg
    ? staples.vegProteins
    : [...staples.nonVegProteins, ...staples.vegProteins.slice(0, 2)];

  if (isVegan) {
    proteinItems = proteinItems.filter(
      item => !dairyTerms.some(d => item.toLowerCase().includes(d))
    );
  }

  const categories = [
    { name: 'Grains & Pantry', items: staples.grains },
    { name: 'Aromatics & Oils', items: staples.aromatics },
    { name: 'Proteins', items: proteinItems },
    { name: 'Vegetables', items: ['spinach', 'broccoli', 'carrots', 'tomatoes', 'onions', 'capsicum'] },
    { name: 'Fruits', items: ['banana', 'apple', 'orange', 'papaya', 'pomegranate'] },
  ];

  if (isVegan) {
    return categories.map(cat => ({
      ...cat,
      items: cat.items.filter(item => !dairyTerms.some(d => item.toLowerCase().includes(d))),
    }));
  }

  return categories;
}

function filterOutAvoidances(categories, foodAllergies = [], culturalFoodAvoidances = []) {
  const avoidTerms = [...(foodAllergies || []), ...(culturalFoodAvoidances || [])]
    .map(s => (s || '').toLowerCase().trim())
    .filter(Boolean);
  if (!avoidTerms.length) return categories;
  return categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !avoidTerms.some(term => item.toLowerCase().includes(term))
    ),
  }));
}

// ─── Phase labels per goal ────────────────────────────────────────────────────

const PHASE_LABELS = {
  'weight-loss': [
    { phaseLabel: 'Foundation Phase',  focus: 'Build habits, establish routine',      note: 'Form over speed. Surya Namaskar every session.' },
    { phaseLabel: 'Foundation Phase',  focus: 'Increase consistency',                  note: 'Track energy and recovery daily.' },
    { phaseLabel: 'Progression Phase', focus: 'Progressive overload begins',           note: 'Add one rep or 0.5kg each week.' },
    { phaseLabel: 'Progression Phase', focus: 'Push intensity moderately',             note: 'Pre-workout snack on training days.' },
    { phaseLabel: 'Peak Phase',        focus: 'Maximum effort, peak performance',      note: 'Protein within 45 min post-workout.' },
    { phaseLabel: 'Peak Phase',        focus: 'Maintain and consolidate gains',        note: 'Reduce refined carbs. Hold the discipline.' },
  ],
  'muscle-gain': [
    { phaseLabel: 'Hypertrophy Foundation', focus: 'Build muscle-mind connection',    note: 'Slow negatives, controlled reps.' },
    { phaseLabel: 'Hypertrophy Foundation', focus: 'Volume accumulation',              note: 'Hit protein target every day.' },
    { phaseLabel: 'Progressive Overload',   focus: 'Increase load weekly',             note: 'Log every lift. Linear progression.' },
    { phaseLabel: 'Progressive Overload',   focus: 'Peak volume block',                note: 'Sleep 8h — muscle grows during recovery.' },
    { phaseLabel: 'Strength Peak',          focus: 'Intensity over volume',            note: 'Lower reps, heavier weight.' },
    { phaseLabel: 'Strength Peak',          focus: 'Test maxes and consolidate',       note: 'Deload week at end of month 6.' },
  ],
  'maintenance': [
    { phaseLabel: 'Stabilize',  focus: 'Re-establish consistent routine',     note: 'Consistency beats perfection.' },
    { phaseLabel: 'Stabilize',  focus: 'Fine-tune habits',                    note: 'Track energy weekly.' },
    { phaseLabel: 'Optimize',   focus: 'Improve weak areas',                  note: 'Add one new challenge per week.' },
    { phaseLabel: 'Optimize',   focus: 'Sustain without burn-out',            note: 'Rest is part of the programme.' },
    { phaseLabel: 'Sustain',    focus: 'Long-term sustainable movement',      note: 'Enjoy the process.' },
    { phaseLabel: 'Sustain',    focus: 'Lifestyle integration',               note: 'Make this permanent.' },
  ],
  'general-fitness': [
    { phaseLabel: 'Establish Routine',    focus: 'Build the habit first',            note: 'Show up even when motivation is low.' },
    { phaseLabel: 'Establish Routine',    focus: 'Add structure',                    note: 'Hydration and sleep matter as much as reps.' },
    { phaseLabel: 'Build Consistency',    focus: 'Progressive challenge',            note: 'Small improvements compound fast.' },
    { phaseLabel: 'Build Consistency',    focus: 'Push past plateaus',               note: 'Try one new exercise per week.' },
    { phaseLabel: 'Advance & Maintain',   focus: 'Higher intensity sessions',        note: 'Form check — video yourself once a month.' },
    { phaseLabel: 'Advance & Maintain',   focus: 'Lifelong fitness foundation',      note: 'You have built something real.' },
  ],
};

// ─── Day slot templates by workoutDaysPerWeek ─────────────────────────────────

const GYM_HOME_SLOTS = {
  3: [
    { day: 'Monday',    muscleGroup: 'full-body', focus: 'Full Body',   duration: '45 min' },
    { day: 'Wednesday', muscleGroup: 'chest',     focus: 'Upper Body',  duration: '45 min' },
    { day: 'Friday',    muscleGroup: 'legs',      focus: 'Lower Body',  duration: '45 min' },
  ],
  4: [
    { day: 'Monday',   muscleGroup: 'legs',      focus: 'Lower Body',   duration: '45 min' },
    { day: 'Tuesday',  muscleGroup: 'chest',     focus: 'Upper Body',   duration: '45 min' },
    { day: 'Thursday', muscleGroup: 'back',      focus: 'Back & Core',  duration: '45 min' },
    { day: 'Friday',   muscleGroup: 'full-body', focus: 'Full Body',    duration: '45 min' },
  ],
  5: [
    { day: 'Monday',    muscleGroup: 'legs',      focus: 'Lower Body',   duration: '45 min' },
    { day: 'Tuesday',   muscleGroup: 'chest',     focus: 'Upper Body',   duration: '45 min' },
    { day: 'Wednesday', muscleGroup: 'back',      focus: 'Back & Core',  duration: '30 min' },
    { day: 'Thursday',  muscleGroup: 'full-body', focus: 'Full Body',    duration: '45 min' },
    { day: 'Friday',    muscleGroup: null,         focus: 'Cardio',      duration: '30 min' },
  ],
  6: [
    { day: 'Monday',    muscleGroup: 'legs',      focus: 'Lower Body',    duration: '45 min' },
    { day: 'Tuesday',   muscleGroup: 'chest',     focus: 'Upper Body',    duration: '45 min' },
    { day: 'Wednesday', muscleGroup: 'back',      focus: 'Back & Core',   duration: '45 min' },
    { day: 'Thursday',  muscleGroup: 'full-body', focus: 'Full Body',     duration: '45 min' },
    { day: 'Friday',    muscleGroup: null,         focus: 'Cardio',       duration: '30 min' },
    { day: 'Saturday',  muscleGroup: 'back',      focus: 'Flexibility',   duration: '30 min' },
  ],
  7: [
    { day: 'Monday',    muscleGroup: 'legs',      focus: 'Lower Body',    duration: '45 min' },
    { day: 'Tuesday',   muscleGroup: 'chest',     focus: 'Upper Body',    duration: '45 min' },
    { day: 'Wednesday', muscleGroup: 'back',      focus: 'Back & Core',   duration: '45 min' },
    { day: 'Thursday',  muscleGroup: 'full-body', focus: 'Full Body',     duration: '45 min' },
    { day: 'Friday',    muscleGroup: null,         focus: 'Cardio',       duration: '30 min' },
    { day: 'Saturday',  muscleGroup: 'back',      focus: 'Flexibility',   duration: '30 min' },
    { day: 'Sunday',    muscleGroup: 'back',      focus: 'Active Recovery', duration: '20 min' },
  ],
};

const YOGA_SLOTS = {
  3: ['Monday','Wednesday','Friday'],
  4: ['Monday','Tuesday','Thursday','Friday'],
  5: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
  6: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  7: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
};

// Strength days within hybrid schedule — subset of YOGA_SLOTS[n] to use for strength training.
// Remaining active days (YOGA_SLOTS[n] minus these) become yoga days.
const HYBRID_STRENGTH_DAYS = {
  3: new Set(['Monday', 'Wednesday']),                              // 2 strength + 1 yoga (Fri)
  4: new Set(['Monday', 'Thursday']),                              // 2 strength + 2 yoga (Tue, Fri)
  5: new Set(['Monday', 'Wednesday', 'Thursday']),                 // 3 strength + 2 yoga (Tue, Fri)
  6: new Set(['Monday', 'Wednesday', 'Thursday']),                 // 3 strength + 3 yoga (Tue, Fri, Sat)
  7: new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday']),     // 4 strength + 3 yoga (Fri, Sat, Sun)
};

function detectWorkoutMode(profile) {
  const prefs = profile.workoutPreferences || [];
  const hasGym  = prefs.includes('gym') ||
                  (profile.equipmentAvailable || []).includes('gym-access');
  // home-workout + legacy value 'home-bodyweight' both mean home-strength
  const hasHomeStrength = prefs.includes('home-workout') || prefs.includes('home-bodyweight');
  const hasYoga = prefs.includes('yoga');
  const hasCardio = prefs.includes('cardio');
  const hasStrength = hasGym || hasHomeStrength;
  if (hasStrength && hasYoga) return 'hybrid';
  if (hasYoga)                return 'yoga';
  if (hasGym)                 return 'gym';
  if (hasHomeStrength)        return 'home';
  if (hasCardio)              return 'cardio';
  return 'home';
}

function suryaEntry(profile, gentle) {
  const rounds = getSuryaNamaskarRounds(profile);
  
  // Skip Surya Namaskar for pranayama-only (rounds = 0)
  if (rounds === 0 && !gentle) {
    return null;
  }
  
  if (gentle && rounds === 0) {
    // Skip gentle variant too for pranayama-only
    return null;
  }
  
  if (gentle) {
    return {
      name: 'Gentle Surya Namaskar (optional)',
      sets: 3,
      reps: '12 poses per round',
      note: 'Active recovery — slow gentle pace only',
      cat: 'yoga'
    };
  }
  return {
    name: `Surya Namaskar — ${rounds} rounds`,
    sets: rounds,
    reps: '12 poses per round',
    note: 'Age/fitness-adjusted warm-up. Full-body activation before training.',
    cat: 'yoga'
  };
}

// Rotates the (muscleGroup, focus, duration) tuples across "true" strength
// slots — i.e. slots that carry a real muscleGroup and aren't a
// Cardio/Flexibility/Active-Recovery placeholder — while leaving those
// placeholder slots untouched. Days themselves never move, so schedule
// shape (which days are active, rest, cardio, etc.) stays identical; only
// which muscle-group focus lands on which strength day shifts per block.
function rotateStrengthSlots(slots, offset) {
  const idxs = slots
    .map((s, i) => i)
    .filter(i => slots[i].muscleGroup && !/flexibility|active recovery/i.test(slots[i].focus || ''));
  if (idxs.length < 2) return slots;

  const tuples  = idxs.map(i => ({
    muscleGroup: slots[i].muscleGroup,
    focus:       slots[i].focus,
    duration:    slots[i].duration,
  }));
  const rotated = rotateArray(tuples, offset);

  return slots.map((s, i) => {
    const pos = idxs.indexOf(i);
    return pos === -1 ? s : { ...s, ...rotated[pos] };
  });
}

function buildStrengthSchedule(profile, goal, daysPerWeek, monthIndex = 0) {
  const baseSlots = GYM_HOME_SLOTS[daysPerWeek] || GYM_HOME_SLOTS[4];
  const offset    = workoutVariantOffset(profile, monthIndex);
  const slots     = rotateStrengthSlots(baseSlots, offset);
  const activeSet = new Set(slots.map(s => s.day));

  return DAYS.map(day => {
    if (!activeSet.has(day)) {
      return {
        day, focus: 'Rest', type: 'rest', duration: '-',
        exercises: [suryaEntry(profile, true)].filter(Boolean)
      };
    }
    const slot = slots.find(s => s.day === day);
    const exercises = slot.muscleGroup
      ? [suryaEntry(profile, false), ...getExercises(profile, slot.muscleGroup, goal)].filter(Boolean)
      : [suryaEntry(profile, false)].filter(Boolean);
    return {
      day,
      focus:     slot.focus,
      type:      slot.muscleGroup ? 'Strength' : 'Cardio',
      duration:  slot.duration,
      exercises
    };
  });
}

function buildYogaSchedule(profile, daysPerWeek, monthIndex = 0) {
  const activeDays  = new Set(YOGA_SLOTS[daysPerWeek] || YOGA_SLOTS[4]);
  const styleOffset = workoutVariantOffset(profile, monthIndex);
  let yogaDayIndex = 0;

  return DAYS.map(day => {
    if (!activeDays.has(day)) {
      return {
        day, focus: 'Rest', type: 'rest', duration: '-',
        exercises: [suryaEntry(profile, true)].filter(Boolean)
      };
    }
    // If yogaStyle is explicitly set and valid, use it for ALL yoga days.
    // Otherwise, cycle hatha/vinyasa/pranayama-only, shifted by the
    // per-block styleOffset so the progression differs across months.
    const style = profile.yogaStyle;
    const yogaType = (style && style !== 'none' && ['hatha','vinyasa','pranayama-only'].includes(style))
      ? style
      : ['hatha','vinyasa','pranayama-only'][(yogaDayIndex + styleOffset) % 3];
    yogaDayIndex++;
    return {
      day,
      focus:     `Yoga — ${yogaType.charAt(0).toUpperCase() + yogaType.slice(1)}`,
      type:      'Yoga',
      duration:  '45 min',
      exercises: [suryaEntry(profile, false), ...getYogaExercises(yogaType)].filter(Boolean)
    };
  });
}

function buildHybridSchedule(profile, goal, daysPerWeek, monthIndex = 0) {
  const activeDaysArr = YOGA_SLOTS[daysPerWeek] || YOGA_SLOTS[4];
  const activeSet     = new Set(activeDaysArr);
  const strengthDaySet = HYBRID_STRENGTH_DAYS[daysPerWeek] || HYBRID_STRENGTH_DAYS[4];
  const offset      = workoutVariantOffset(profile, monthIndex);
  const styleOffset = offset;
  let yogaDayIndex = 0;

  return DAYS.map(day => {
    if (!activeSet.has(day)) {
      return {
        day, focus: 'Rest', type: 'rest', duration: '-',
        exercises: [suryaEntry(profile, true)].filter(Boolean)
      };
    }
    if (strengthDaySet.has(day)) {
      // Get muscle group for this strength day from the rotated slot template
      // — rotation shifts which muscle-group focus lands on which strength
      // day per month/block, without changing which days are strength days.
      const allStrengthSlots = rotateStrengthSlots(
        GYM_HOME_SLOTS[daysPerWeek] || GYM_HOME_SLOTS[4],
        offset
      );
      const slot = allStrengthSlots.find(s => s.day === day);
      const muscleGroup = slot ? slot.muscleGroup : 'full-body';
      const slotFocus   = slot ? slot.focus       : 'Full Body';
      const exercises = muscleGroup
        ? [suryaEntry(profile, false), ...getExercises(profile, muscleGroup, goal)].filter(Boolean)
        : [suryaEntry(profile, false)].filter(Boolean);
      return {
        day,
        focus:     slotFocus,
        type:      muscleGroup ? 'Strength' : 'Cardio',
        duration:  '45 min',
        exercises
      };
    }
    const style = profile.yogaStyle;
    const yogaType = (style && style !== 'none' && ['hatha','vinyasa','pranayama-only'].includes(style))
      ? style
      : ['hatha','vinyasa','pranayama-only'][(yogaDayIndex + styleOffset) % 3];
    yogaDayIndex++;
    return {
      day,
      focus:     `Yoga — ${yogaType.charAt(0).toUpperCase() + yogaType.slice(1)}`,
      type:      'Yoga',
      duration:  '45 min',
      exercises: [suryaEntry(profile, false), ...getYogaExercises(yogaType)].filter(Boolean)
    };
  });
}

// Rotates the (session, duration, intensity, note) content across a phase's
// session days, keeping the same set of active days but shifting which
// session lands on which day per month/block.
function rotateCardioSessions(sessions, offset) {
  if (sessions.length < 2) return sessions;
  const tuples = sessions.map(s => ({
    session: s.session, duration: s.duration, intensity: s.intensity, note: s.note,
  }));
  const rotated = rotateArray(tuples, offset);
  return sessions.map((s, i) => ({ ...s, ...rotated[i] }));
}

function buildCardioSchedule(profile, monthIndex) {
  const phase = CARDIO_PHASES[Math.min(monthIndex, CARDIO_PHASES.length - 1)];
  const offset = workoutVariantOffset(profile, monthIndex);
  const sessions = rotateCardioSessions(phase.sessions, offset);
  const activeSet = new Set(sessions.map(s => s.day));
  const suryaRounds = getSuryaNamaskarRounds(profile);

  return DAYS.map(day => {
    const shortDay = day.slice(0, 3); // 'Monday' → 'Mon'
    if (!activeSet.has(shortDay)) {
      return {
        day,
        focus: 'Rest / Easy Walk',
        type: 'rest',
        duration: '-',
        session: null
      };
    }
    const phaseSession = sessions.find(s => s.day === shortDay);
    return {
      day,
      focus: phaseSession.session,
      type: 'cardio',
      duration: phaseSession.duration,
      session: phaseSession.session,
      intensity: phaseSession.intensity,
      note: phaseSession.note,
      suryaNamaskarWarmup: suryaRounds > 0
        ? `${suryaRounds} rounds Surya Namaskar warm-up before cardio`
        : null,
      hrZones: phase.hrZones
    };
  });
}

// ─── Diet phase guidelines ────────────────────────────────────────────────────

const DIET_GUIDELINES = {
  foundation: [
    'Establish 3 balanced meals + 1 snack per day',
    'Caloric target: −300 kcal deficit (weight-loss) / +300 surplus (muscle-gain) / maintenance (other goals)',
    'Hydration: drink 2.5–3L water daily',
    'Avoid processed foods and sugar-sweetened beverages this month',
  ],
  progression: [
    'Increase protein to support higher training volume (aim for 1.6–2g per kg body weight)',
    'Add a pre-workout snack on training days: banana + tablespoon of nut butter',
    'If energy is low, slightly increase complex carbs (oats, brown rice, sweet potato)',
    'Continue hydration: 3L water on training days',
  ],
  peak: [
    'Protein within 45 minutes post-workout for optimal muscle repair',
    'Reduce refined carbs; prioritise complex carbs and dark leafy greens',
    'If goal weight is reached, shift to maintenance calories',
    'Monitor sleep — inadequate sleep undermines nutrition and performance',
  ],
};

function getMonthGuidelines(monthIndex) {
  if (monthIndex <= 1) return DIET_GUIDELINES.foundation;
  if (monthIndex <= 3) return DIET_GUIDELINES.progression;
  return DIET_GUIDELINES.peak;
}

// ─── buildDietPlan ────────────────────────────────────────────────────────────

function buildDietPlan(profile, goal) {
  return Array.from({ length: 6 }, (_, monthIndex) => ({
    monthLabel: `Month ${monthIndex + 1}`,
    weeks: Array.from({ length: 4 }, (_, weekIdx) => {
      const globalWeekIndex = monthIndex * 4 + weekIdx;
      return {
        weekLabel: `Week ${weekIdx + 1}`,
        weekdays: DAYS.map((day, dayIndex) => ({
          day,
          breakfast: getMeals(profile, 'breakfast', goal, globalWeekIndex, dayIndex),
          lunch:     getMeals(profile, 'lunch',     goal, globalWeekIndex, dayIndex),
          snack:     getMeals(profile, 'snack',     goal, globalWeekIndex, dayIndex),
          dinner:    getMeals(profile, 'dinner',    goal, globalWeekIndex, dayIndex),
        })),
      };
    }),
    guidelines: getMonthGuidelines(monthIndex),
  }));
}

// ─── buildWorkoutPlan ─────────────────────────────────────────────────────────

function buildWorkoutPlan(profile, goal) {
  const mode        = detectWorkoutMode(profile);
  const daysPerWeek = Math.min(7, Math.max(3, profile.workoutDaysPerWeek || 4));
  const phaseLabels = PHASE_LABELS[goal] || PHASE_LABELS['general-fitness'];

  return Array.from({ length: 6 }, (_, monthIndex) => {
    let phaseLabel, focus, note, schedule;
    if (mode === 'cardio') {
      const cardioPhase = CARDIO_PHASES[Math.min(monthIndex, CARDIO_PHASES.length - 1)];
      phaseLabel = cardioPhase.phaseLabel;
      focus      = cardioPhase.focus;
      note       = cardioPhase.note;
      schedule   = buildCardioSchedule(profile, monthIndex);
    } else {
      ({ phaseLabel, focus, note } = phaseLabels[monthIndex] || phaseLabels[0]);
      if (mode === 'yoga') {
        schedule = buildYogaSchedule(profile, daysPerWeek, monthIndex);
      } else if (mode === 'hybrid') {
        schedule = buildHybridSchedule(profile, goal, daysPerWeek, monthIndex);
      } else {
        schedule = buildStrengthSchedule(profile, goal, daysPerWeek, monthIndex);
      }
    }
    return { monthLabel: `Month ${monthIndex + 1}`, phaseLabel, focus, note, schedule };
  });
}

// ─── buildCardioPlan ──────────────────────────────────────────────────────────

function buildCardioPlan(profile, goal) {
  return Array.from({ length: 6 }, (_, mi) => ({
    monthLabel: `Month ${mi + 1}`,
    phaseLabel: CARDIO_PHASES[mi].phaseLabel,
    sessions: [...CARDIO_PHASES[mi].sessions],       // shallow copy — session objects are immutable
    hrZones: { ...CARDIO_PHASES[mi].hrZones }        // shallow copy of flat object
  }));
}

// ─── buildGroceryList ─────────────────────────────────────────────────────────

function getGroceryCategories(dietType) {
  return GROCERY_CATEGORIES[dietType] || GROCERY_CATEGORIES['vegetarian'];
}

function buildGroceryList(profile, goal) {
  const dietType = deriveEffectiveDiet({ ...profile, dietType: profile.dietType || 'non-vegetarian' });
  const cuisinePreference = profile.cuisinePreference || 'mixed';
  const categories = getCuisineGrocery(dietType, cuisinePreference);
  return filterOutAvoidances(categories, profile.foodAllergies, profile.culturalFoodAvoidances);
}

function buildPlan(profile) {
  const goal = profile.primaryGoal || 'general-fitness';
  return {
    workout: buildWorkoutPlan(profile, goal),
    diet:    buildDietPlan(profile, goal),
    grocery: buildGroceryList(profile, goal),
  };
}

module.exports = {
  buildDietPlan,
  buildWorkoutPlan,
  buildCardioPlan,
  buildGroceryList,
  buildPlan,
  workoutVariantOffset,
};
