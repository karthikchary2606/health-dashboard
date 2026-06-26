const PHASES = [
  { label: 'Stabilise', months: [1, 2], description: 'Lock in maintenance calories' },
  { label: 'Optimise', months: [3, 4], description: 'Fine-tune macros and training' },
  { label: 'Sustain', months: [5, 6], description: 'Long-term habit formation' }
];

function getPlanMeta(profile) {
  const startDate = profile.startDate ? new Date(profile.startDate) : new Date();
  const monthsElapsed = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24 * 30));
  const currentMonth = Math.min(6, Math.max(1, monthsElapsed + 1));
  const phase = PHASES.find(p => p.months.includes(currentMonth)) || PHASES[0];
  return {
    templateName: 'maintenance',
    totalMonths: 6,
    currentMonth,
    currentPhase: PHASES.indexOf(phase) + 1,
    currentPhaseLabel: phase.label,
    phases: PHASES
  };
}

exports.getDietPlan = (profile) => [{
  monthLabel: 'Month 1 — Stabilise',
  weekdays: Array(7).fill(null).map(() => ({
    breakfast: 'Mediterranean-style: Greek yogurt + berries + granola + honey',
    lunch: 'Grilled fish + brown rice + olive oil drizzle + greens',
    dinner: 'Lean meat + pasta + tomato sauce + vegetables',
    snacks: ['Mixed nuts & dried fruit', 'Fruit'],
    approxCalories: 2100
  })),
  guidelines: [
    'Maintenance calories: 2000–2200 kcal daily',
    'Balanced macros: 40% carbs, 30% protein, 30% fats',
    '3 meals + 2 snacks daily for steady energy'
  ]
}, null, null, null, null, null];

exports.getWorkoutPlan = (profile) => [{
  monthLabel: 'Month 1 — Stabilise',
  schedule: [
    { day: 'Monday', focus: 'Full Body Circuit', exercises: [
      { name: 'Squats', sets: 3, reps: '12', notes: 'Moderate weight' },
      { name: 'Push-ups', sets: 3, reps: '12', notes: '' },
      { name: 'Rows', sets: 3, reps: '12', notes: '' },
      { name: 'Plank', sets: 2, reps: '45s', notes: '' }
    ]},
    { day: 'Tuesday', focus: 'Rest / Yoga', exercises: [] },
    { day: 'Wednesday', focus: 'Full Body Circuit', exercises: [
      { name: 'Deadlifts', sets: 3, reps: '10', notes: 'Moderate weight' },
      { name: 'Bench Press', sets: 3, reps: '10', notes: '' },
      { name: 'Pull-ups', sets: 3, reps: '10', notes: 'Assisted if needed' },
      { name: 'Leg Raises', sets: 2, reps: '12', notes: '' }
    ]},
    { day: 'Thursday', focus: 'Rest / Walking', exercises: [] },
    { day: 'Friday', focus: 'Full Body Circuit', exercises: [
      { name: 'Lunges', sets: 3, reps: '12 per leg', notes: 'Bodyweight or light dumbbell' },
      { name: 'Dumbbell Press', sets: 3, reps: '12', notes: '' },
      { name: 'Lat Pulldown', sets: 3, reps: '12', notes: '' },
      { name: 'Mountain Climbers', sets: 2, reps: '20', notes: '' }
    ]},
    { day: 'Saturday', focus: 'Rest', exercises: [] },
    { day: 'Sunday', focus: 'Rest', exercises: [] }
  ]
}, null, null, null, null, null];

exports.getCardioPlan = (profile) => [{ monthLabel: 'Month 1', sessions: [], hrZones: {} }, null, null, null, null, null];

exports.getGroceryList = (profile) => [{
  monthLabel: 'Month 1',
  categories: [
    { name: 'Proteins', items: ['Chicken breast', 'Fish (salmon, cod)', 'Eggs', 'Greek yogurt', 'Beans'] },
    { name: 'Carbs', items: ['Brown rice', 'Whole wheat pasta', 'Oats', 'Sweet potato', 'Whole grain bread'] },
    { name: 'Fats & Vegetables', items: ['Olive oil', 'Mixed vegetables', 'Berries', 'Nuts', 'Avocado'] }
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
