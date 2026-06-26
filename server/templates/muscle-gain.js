const PHASES = [
  { label: 'Foundation', months: [1, 2], description: 'Master form, progressive overload' },
  { label: 'Hypertrophy', months: [3, 4], description: 'Volume increase, caloric surplus' },
  { label: 'Strength', months: [5, 6], description: 'Heavy compounds, deload week' }
];

function getPlanMeta(profile) {
  const startDate = profile.startDate ? new Date(profile.startDate) : new Date();
  const monthsElapsed = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24 * 30));
  const currentMonth = Math.min(6, Math.max(1, monthsElapsed + 1));
  const phase = PHASES.find(p => p.months.includes(currentMonth)) || PHASES[0];
  return {
    templateName: 'muscle-gain',
    totalMonths: 6,
    currentMonth,
    currentPhase: PHASES.indexOf(phase) + 1,
    currentPhaseLabel: phase.label,
    phases: PHASES
  };
}

exports.getDietPlan = (profile) => [{
  monthLabel: 'Month 1 — Foundation',
  weekdays: Array(7).fill(null).map(() => ({
    breakfast: 'High-protein breakfast: 4 eggs + oats + banana',
    lunch: 'Rice + dal + chicken breast 200g + salad',
    dinner: 'Roti + paneer/fish + vegetables',
    snacks: ['Protein shake', 'Mixed nuts 30g'],
    approxCalories: 2800
  })),
  guidelines: [
    'Caloric surplus of ~300 kcal above TDEE',
    'Protein target: 1.8–2.2g per kg bodyweight',
    'Distribute protein across 4–5 meals'
  ]
}, null, null, null, null, null];

exports.getWorkoutPlan = (profile) => [{
  monthLabel: 'Month 1 — Foundation',
  schedule: [
    { day: 'Monday', focus: 'Chest + Triceps', exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-10', notes: 'Progressive overload' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', notes: '' },
      { name: 'Tricep Dips', sets: 3, reps: '12', notes: '' }
    ]},
    { day: 'Tuesday', focus: 'Back + Biceps', exercises: [
      { name: 'Pull-ups', sets: 4, reps: '6-8', notes: 'Assisted if needed' },
      { name: 'Barbell Row', sets: 4, reps: '8-10', notes: '' },
      { name: 'Barbell Curl', sets: 3, reps: '10-12', notes: '' }
    ]},
    { day: 'Wednesday', focus: 'Rest / Active Recovery', exercises: [] },
    { day: 'Thursday', focus: 'Legs', exercises: [
      { name: 'Squat', sets: 4, reps: '8-10', notes: 'Full depth' },
      { name: 'Romanian Deadlift', sets: 3, reps: '10', notes: '' },
      { name: 'Leg Press', sets: 3, reps: '12', notes: '' }
    ]},
    { day: 'Friday', focus: 'Shoulders + Core', exercises: [
      { name: 'Overhead Press', sets: 4, reps: '8-10', notes: '' },
      { name: 'Lateral Raise', sets: 3, reps: '15', notes: '' },
      { name: 'Plank', sets: 3, reps: '60s', notes: '' }
    ]},
    { day: 'Saturday', focus: 'Full Body', exercises: [
      { name: 'Deadlift', sets: 3, reps: '5', notes: 'Heavy compound' },
      { name: 'Push-ups', sets: 3, reps: '15', notes: '' }
    ]},
    { day: 'Sunday', focus: 'Rest', exercises: [] }
  ]
}, null, null, null, null, null];

exports.getCardioPlan = (profile) => [{ monthLabel: 'Month 1', sessions: [], hrZones: {} }, null, null, null, null, null];

exports.getGroceryList = (profile) => [{
  monthLabel: 'Month 1',
  categories: [
    { name: 'Proteins', items: ['Chicken breast', 'Eggs', 'Whey protein', 'Paneer'] },
    { name: 'Carbs', items: ['Rice', 'Oats', 'Sweet potato', 'Whole wheat roti'] },
    { name: 'Fats', items: ['Mixed nuts', 'Olive oil', 'Avocado'] }
  ]
}, null, null, null, null, null];

exports.getDefaultChecklist = (profile) => {
  const items = [
    { category: 'diet', text: 'Hit daily protein target' },
    { category: 'workout', text: 'Complete strength session' },
    { category: 'recovery', text: 'Sleep 7-8 hours' }
  ];
  (profile.medications || []).forEach(med => {
    items.push({ category: 'medication', text: `💊 Take ${med.name} ${med.dosage} — ${med.timing}` });
  });
  return items;
};

exports.getPlanMeta = getPlanMeta;
