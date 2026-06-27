'use strict';

const { getMeals }     = require('./meal-composer');
const { getExercises } = require('./exercise-composer');

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ─── Weekly workout schedule ──────────────────────────────────────────────────

const WEEKLY_SCHEDULE = [
  { day: 'Monday',    focus: 'Lower Body',    type: 'Strength',    duration: '45 min', muscleGroup: 'legs'       },
  { day: 'Tuesday',   focus: 'Upper Body',    type: 'Strength',    duration: '45 min', muscleGroup: 'chest'      },
  { day: 'Wednesday', focus: 'Cardio',        type: 'Cardio',      duration: '30 min', muscleGroup: null         },
  { day: 'Thursday',  focus: 'Back & Core',   type: 'Strength',    duration: '45 min', muscleGroup: 'back'       },
  { day: 'Friday',    focus: 'Full Body',     type: 'Strength',    duration: '45 min', muscleGroup: 'full-body'  },
  { day: 'Saturday',  focus: 'Flexibility',   type: 'Flexibility', duration: '30 min', muscleGroup: 'back'       },
  { day: 'Sunday',    focus: 'Rest',          type: 'Rest',        duration: '-',      muscleGroup: null         },
];

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
    guidelines: [],
  }));
}

// ─── buildWorkoutPlan ─────────────────────────────────────────────────────────

function buildWorkoutPlan(profile, goal) {
  return Array.from({ length: 6 }, (_, monthIndex) => ({
    monthLabel: `Month ${monthIndex + 1}`,
    schedule: WEEKLY_SCHEDULE.map(slot => ({
      day:       slot.day,
      focus:     slot.focus,
      type:      slot.type,
      duration:  slot.duration,
      exercises: slot.muscleGroup
        ? getExercises(profile, slot.muscleGroup, goal)
        : [],
    })),
  }));
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
