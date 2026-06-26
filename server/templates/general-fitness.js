const PHASES = [
  { label: 'Active', months: [1, 2], description: 'Build consistent exercise habit' },
  { label: 'Progress', months: [3, 4], description: 'Increase intensity and variety' },
  { label: 'Performance', months: [5, 6], description: 'Peak fitness and endurance' }
];

function getPlanMeta(profile) {
  const startDate = profile.startDate ? new Date(profile.startDate) : new Date();
  const monthsElapsed = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24 * 30));
  const currentMonth = Math.min(6, Math.max(1, monthsElapsed + 1));
  const phase = PHASES.find(p => p.months.includes(currentMonth)) || PHASES[0];
  return {
    templateName: 'general-fitness',
    totalMonths: 6,
    currentMonth,
    currentPhase: PHASES.indexOf(phase) + 1,
    currentPhaseLabel: phase.label,
    phases: PHASES
  };
}

exports.getDietPlan = (profile) => [{
  monthLabel: 'Month 1 — Active',
  weekdays: Array(7).fill(null).map(() => ({
    breakfast: 'Oatmeal with fruit and yogurt',
    lunch: 'Lean meat or tofu + vegetables + whole grain rice',
    dinner: 'Fish or chicken + sweet potato + steamed greens',
    snacks: ['Fruit', 'String cheese or nuts'],
    approxCalories: 2200
  })),
  guidelines: [
    'Balanced nutrition: ~2200 kcal daily',
    'Protein target: 1.2–1.5g per kg bodyweight',
    '3 meals + 2 snacks to fuel activity and recovery'
  ]
}, null, null, null, null, null];

exports.getWorkoutPlan = (profile) => [{
  monthLabel: 'Month 1 — Active',
  schedule: [
    { day: 'Monday', focus: 'Cardio + Core', exercises: [
      { name: 'Running / Cycling', sets: 1, reps: '20–30 min', notes: 'Moderate intensity' },
      { name: 'Plank', sets: 3, reps: '30s', notes: '' },
      { name: 'Crunches', sets: 3, reps: '15', notes: '' }
    ]},
    { day: 'Tuesday', focus: 'Strength', exercises: [
      { name: 'Bench Press', sets: 3, reps: '10', notes: 'Moderate weight' },
      { name: 'Rows', sets: 3, reps: '10', notes: '' },
      { name: 'Squats', sets: 3, reps: '12', notes: '' }
    ]},
    { day: 'Wednesday', focus: 'Cardio + Flexibility', exercises: [
      { name: 'Walking / Light jogging', sets: 1, reps: '25 min', notes: 'Steady pace' },
      { name: 'Yoga or Stretching', sets: 1, reps: '15 min', notes: '' }
    ]},
    { day: 'Thursday', focus: 'Strength', exercises: [
      { name: 'Deadlifts', sets: 3, reps: '8', notes: 'Controlled form' },
      { name: 'Push-ups', sets: 3, reps: '12', notes: '' },
      { name: 'Lunges', sets: 3, reps: '10 per leg', notes: '' }
    ]},
    { day: 'Friday', focus: 'Cardio + Core', exercises: [
      { name: 'Swimming or Cycling', sets: 1, reps: '30 min', notes: 'Moderate intensity' },
      { name: 'Mountain Climbers', sets: 3, reps: '15', notes: '' }
    ]},
    { day: 'Saturday', focus: 'Rest / Active Recovery', exercises: [] },
    { day: 'Sunday', focus: 'Rest', exercises: [] }
  ]
}, null, null, null, null, null];

exports.getCardioPlan = (profile) => [{ monthLabel: 'Month 1', sessions: [], hrZones: {} }, null, null, null, null, null];

exports.getGroceryList = (profile) => [{
  monthLabel: 'Month 1',
  categories: [
    { name: 'Proteins', items: ['Chicken', 'Fish (tuna, salmon)', 'Eggs', 'Tofu', 'Beans', 'Lentils'] },
    { name: 'Carbs', items: ['Brown rice', 'Sweet potato', 'Whole wheat bread', 'Oats', 'Pasta'] },
    { name: 'Fruits & Vegetables', items: ['Bananas', 'Berries', 'Leafy greens', 'Broccoli', 'Carrots', 'Peppers'] }
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
