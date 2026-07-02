'use strict';

const { getMeals }          = require('./meal-composer');
const { getExercises, getSuryaNamaskarRounds, getYogaExercises } = require('./exercise-composer');

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ─── Cardio phases ────────────────────────────────────────────────────────────

const CARDIO_PHASES = [
  {
    phaseLabel: 'Phase 1 - Foundation',
    sessions: [
      { day: 'Mon', session: 'Brisk Walk', duration: '20 min', intensity: 'Low',  note: 'Zone 2 effort'  },
      { day: 'Wed', session: 'Cycling',    duration: '20 min', intensity: 'Low',  note: 'Steady pace'    },
      { day: 'Fri', session: 'Walk',       duration: '25 min', intensity: 'Low',  note: 'Easy pace'      },
    ],
    hrZones: { zone2: '120-135 bpm' },
  },
  {
    phaseLabel: 'Phase 2 - Build',
    sessions: [
      { day: 'Mon', session: 'Jog/Walk', duration: '25 min', intensity: 'Moderate', note: 'Alternate 1 min jog 2 min walk' },
      { day: 'Wed', session: 'Cycling',  duration: '30 min', intensity: 'Moderate', note: ''                               },
      { day: 'Fri', session: 'Jog',      duration: '25 min', intensity: 'Moderate', note: 'Zone 3 effort'                  },
    ],
    hrZones: { zone3: '135-155 bpm' },
  },
  {
    phaseLabel: 'Phase 3 - Intensity',
    sessions: [
      { day: 'Mon', session: 'HIIT Walk-Sprint', duration: '25 min', intensity: 'High',     note: '30s sprint 90s walk x8' },
      { day: 'Wed', session: 'Steady Run',       duration: '30 min', intensity: 'Moderate', note: ''                       },
      { day: 'Fri', session: 'HIIT',             duration: '25 min', intensity: 'High',     note: ''                       },
    ],
    hrZones: { zone4: '155-170 bpm' },
  },
  {
    phaseLabel: 'Phase 4 - Performance',
    sessions: [
      { day: 'Mon', session: 'Interval Run',   duration: '30 min', intensity: 'High', note: '1 min hard 1 min easy' },
      { day: 'Wed', session: 'Tempo Run',      duration: '30 min', intensity: 'High', note: 'Comfortably hard pace' },
      { day: 'Sat', session: 'Long Easy Run',  duration: '45 min', intensity: 'Low',  note: 'Conversational pace'  },
    ],
    hrZones: { zone4: '155-170 bpm', zone5: '170+ bpm' },
  },
  {
    phaseLabel: 'Phase 5 - Peak',
    sessions: [
      { day: 'Mon', session: 'Race Pace Run', duration: '35 min', intensity: 'High',     note: '' },
      { day: 'Thu', session: 'Tempo Run',     duration: '30 min', intensity: 'High',     note: '' },
      { day: 'Sat', session: 'Long Run',      duration: '50 min', intensity: 'Moderate', note: '' },
    ],
    hrZones: { zone4: '155-170 bpm', zone5: '170+ bpm' },
  },
  {
    phaseLabel: 'Phase 6 - Maintenance',
    sessions: [
      { day: 'Mon', session: 'Steady Run',    duration: '30 min', intensity: 'Moderate', note: '' },
      { day: 'Wed', session: 'Easy Run',      duration: '25 min', intensity: 'Low',      note: '' },
      { day: 'Sat', session: 'Long Easy Run', duration: '40 min', intensity: 'Low',      note: '' },
    ],
    hrZones: { zone3: '135-155 bpm' },
  },
];

// ─── Grocery categories ───────────────────────────────────────────────────────

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
  const hasYoga = prefs.includes('yoga');
  if (hasGym && hasYoga) return 'hybrid';
  if (hasYoga)           return 'yoga';
  if (hasGym)            return 'gym';
  return 'home';
}

function suryaEntry(profile, gentle) {
  const rounds = getSuryaNamaskarRounds(profile);
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

function buildStrengthSchedule(profile, goal, daysPerWeek) {
  const slots    = GYM_HOME_SLOTS[daysPerWeek] || GYM_HOME_SLOTS[4];
  const activeSet = new Set(slots.map(s => s.day));

  return DAYS.map(day => {
    if (!activeSet.has(day)) {
      return {
        day, focus: 'Rest', type: 'rest', duration: '-',
        exercises: [suryaEntry(profile, true)]
      };
    }
    const slot = slots.find(s => s.day === day);
    const exercises = slot.muscleGroup
      ? [suryaEntry(profile, false), ...getExercises(profile, slot.muscleGroup, goal)]
      : [suryaEntry(profile, false)];
    return {
      day,
      focus:     slot.focus,
      type:      slot.muscleGroup ? 'Strength' : 'Cardio',
      duration:  slot.duration,
      exercises
    };
  });
}

function buildYogaSchedule(profile, daysPerWeek) {
  const activeDays = new Set(YOGA_SLOTS[daysPerWeek] || YOGA_SLOTS[4]);
  let yogaDayIndex = 0;

  return DAYS.map(day => {
    if (!activeDays.has(day)) {
      return {
        day, focus: 'Rest', type: 'rest', duration: '-',
        exercises: [suryaEntry(profile, true)]
      };
    }
    // If yogaStyle is explicitly set and valid, use it for ALL yoga days
    const style = profile.yogaStyle;
    const yogaType = (style && style !== 'none' && ['hatha','vinyasa','pranayama-only'].includes(style))
      ? style
      : ['hatha','vinyasa','pranayama-only'][yogaDayIndex % 3];
    yogaDayIndex++;
    return {
      day,
      focus:     `Yoga — ${yogaType.charAt(0).toUpperCase() + yogaType.slice(1)}`,
      type:      'Yoga',
      duration:  '45 min',
      exercises: [suryaEntry(profile, false), ...getYogaExercises(yogaType)]
    };
  });
}

function buildHybridSchedule(profile, goal, daysPerWeek) {
  const activeDaysArr = YOGA_SLOTS[daysPerWeek] || YOGA_SLOTS[4];
  const activeSet     = new Set(activeDaysArr);
  const strengthDaySet = HYBRID_STRENGTH_DAYS[daysPerWeek] || HYBRID_STRENGTH_DAYS[4];
  let yogaDayIndex = 0;

  return DAYS.map(day => {
    if (!activeSet.has(day)) {
      return {
        day, focus: 'Rest', type: 'rest', duration: '-',
        exercises: [suryaEntry(profile, true)]
      };
    }
    if (strengthDaySet.has(day)) {
      // Get muscle group for this strength day from the full slot template
      const allStrengthSlots = GYM_HOME_SLOTS[daysPerWeek] || GYM_HOME_SLOTS[4];
      const slot = allStrengthSlots.find(s => s.day === day);
      const muscleGroup = slot ? slot.muscleGroup : 'full-body';
      const slotFocus   = slot ? slot.focus       : 'Full Body';
      const exercises = muscleGroup
        ? [suryaEntry(profile, false), ...getExercises(profile, muscleGroup, goal)]
        : [suryaEntry(profile, false)];
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
      : ['hatha','vinyasa','pranayama-only'][yogaDayIndex % 3];
    yogaDayIndex++;
    return {
      day,
      focus:     `Yoga — ${yogaType.charAt(0).toUpperCase() + yogaType.slice(1)}`,
      type:      'Yoga',
      duration:  '45 min',
      exercises: [suryaEntry(profile, false), ...getYogaExercises(yogaType)]
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
    const { phaseLabel, focus, note } = phaseLabels[monthIndex] || phaseLabels[0];
    let schedule;
    if (mode === 'yoga') {
      schedule = buildYogaSchedule(profile, daysPerWeek);
    } else if (mode === 'hybrid') {
      schedule = buildHybridSchedule(profile, goal, daysPerWeek);
    } else {
      schedule = buildStrengthSchedule(profile, goal, daysPerWeek);
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
  return Array.from({ length: 6 }, (_, mi) => ({
    monthLabel: `Month ${mi + 1}`,
    budget: '₹3000–₹4000/week',
    categories: getGroceryCategories(profile.dietType).map(cat => ({
      name: cat.name,
      items: [...cat.items]   // fresh array per month so mutations don't propagate
    }))
  }));
}

module.exports = { buildDietPlan, buildWorkoutPlan, buildCardioPlan, buildGroceryList };
