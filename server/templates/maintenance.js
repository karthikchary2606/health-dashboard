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
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor((Date.now() - startDate) / msPerWeek);
  const currentWeek = (weeksElapsed % 4) + 1;
  return {
    templateName: 'maintenance',
    totalMonths: 6,
    currentMonth,
    currentWeek,
    currentPhase: PHASES.indexOf(phase) + 1,
    currentPhaseLabel: phase.label,
    phases: PHASES
  };
}

exports.getDietPlan = (profile) => {
  const isVeg = profile.dietType === 'vegetarian' || profile.dietType === 'vegan';
  const isVegan = profile.dietType === 'vegan';

  const dairy = (d, v) => isVegan ? v : d;

  const month1 = {
    monthLabel: 'Month 1 — Stabilise',
    weeks: [
      {
        weekLabel: 'Week 1',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `${dairy('Greek yogurt 150g', 'Coconut yogurt 150g')} + berries + granola 30g` : 'Scrambled eggs (2) + whole wheat toast + berries',
            lunch: isVeg ? `${dairy('Paneer tikka 120g', 'Tofu tikka 120g')} + brown rice 1 cup + greens` : 'Grilled chicken 150g + brown rice 1 cup + greens',
            snack: `${dairy('Chaas 200ml', 'Nimbu paani')} + mixed nuts 25g`,
            dinner: isVeg ? `Dal + sabzi + 2 rotis + salad` : 'Baked fish 150g + roasted vegetables + 1 roti'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Oats 50g + ${dairy('milk', 'oat milk')} + banana + seeds 10g` : 'Boiled eggs (2) + oats 50g + apple',
            lunch: isVeg ? `Rajma + brown rice 1 cup + ${dairy('raita', 'salad')}` : 'Tuna salad / fish 150g + brown rice + salad',
            snack: 'Apple + almond butter 1 tbsp',
            dinner: isVeg ? `${dairy('Paneer bhurji 120g', 'Tofu bhurji 120g')} + 2 rotis + salad` : 'Chicken stir-fry 150g + 1 roti + salad'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Idli 3pcs + sambar + coconut chutney` : 'Egg dosa + sambar + chutney',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 1 cup rice + salad` : 'Lean chicken curry 150g + 1 cup rice + salad',
            snack: `${dairy('Greek yogurt 120g', 'Coconut yogurt 120g')} + walnuts 15g`,
            dinner: isVeg ? `Vegetable soup + 2 rotis` : 'Grilled fish 150g + steamed vegetables + 1 roti'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Upma 60g + fruits + ${dairy('dahi 100g', 'coconut yogurt 100g')}` : '2-egg omelette + upma 50g + orange',
            lunch: isVeg ? `Chana masala + 1 cup rice + salad` : 'Turkey/chicken mince 150g + pasta + tomato sauce',
            snack: `Roasted chana 30g + ${dairy('chaas 200ml', 'nimbu paani')}`,
            dinner: isVeg ? `${dairy('Dahi rice 1 cup + pickle', 'Coconut yogurt rice + pickle')} + sabzi` : '2-egg omelette + mixed sabzi + 1 roti'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Pesarattu 2pcs + ginger chutney` : 'Boiled eggs (2) + pesarattu 1pc + chutney',
            lunch: isVeg ? `Chole + 1 cup brown rice + ${dairy('lassi small', 'salad')}` : 'Fish 150g + brown rice 1 cup + vegetables',
            snack: 'Mixed nuts 25g + green tea',
            dinner: isVeg ? `Dal makhani + 2 rotis + salad` : 'Chicken salad 150g + whole wheat bread 2 slices'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Besan chilla 2pcs + mint chutney + fruits` : '2-egg bhurji + whole wheat toast + fruits',
            lunch: isVeg ? `Veg biryani (brown rice) + ${dairy('raita', 'salad')}` : 'Chicken biryani small + raita + salad',
            snack: `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + seeds 15g`,
            dinner: isVeg ? `Mixed dal + 2 rotis + baingan sabzi` : 'Baked salmon/fish 150g + salad + 1 roti'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + fruits + granola 30g + honey` : 'Eggs (2) + whole wheat pancake + fruits',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 1 cup rice + salad` : 'Grilled chicken 150g + sweet potato + greens',
            snack: 'Green tea + almonds 20g',
            dinner: isVeg ? `Sabzi + 2 rotis + dal` : 'Chicken wrap + salad'
          }
        ]
      },
      {
        weekLabel: 'Week 2',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Poha 70g + ${dairy('dahi', 'coconut yogurt')} + orange` : '2-egg bhurji + poha 70g + apple',
            lunch: isVeg ? `${dairy('Paneer matar 120g', 'Tofu matar 120g')} + 1 cup rice + salad` : 'Grilled fish 150g + 1 cup brown rice + salad',
            snack: `${dairy('Chaas 200ml', 'Nimbu paani')} + makhana 25g`,
            dinner: isVeg ? `Dal tadka + 2 rotis + capsicum sabzi` : 'Turkey/chicken mince + 2 rotis + salad'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Oats 50g + berries + ${dairy('milk', 'almond milk')} + seeds` : 'Boiled eggs (2) + oats 50g + banana',
            lunch: isVeg ? `Masoor dal + 1 cup rice + ${dairy('raita', 'salad')}` : 'Chicken breast 150g + pasta + tomato sauce',
            snack: 'Apple + cashews 20g',
            dinner: isVeg ? `${dairy('Paneer tikka 120g', 'Tofu tikka 120g')} + salad + 1 roti` : '2-egg omelette + salad + 1 roti'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Rava upma 60g + coconut chutney + fruits` : 'Omelette (2 eggs) + upma 50g + mango',
            lunch: isVeg ? `Veg pulao + ${dairy('raita', 'salad')}` : 'Fish curry 150g + 1 cup rice + salad',
            snack: `${dairy('Greek yogurt 120g', 'Coconut yogurt 120g')} + almonds 15g`,
            dinner: isVeg ? `Palak dal + 2 rotis + sabzi` : 'Chicken stew 150g + 1 roti + salad'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Idli 3pcs + coconut chutney + sambar` : 'Boiled eggs (2) + idli 2pcs + sambar',
            lunch: isVeg ? `Chole + 1 cup rice + salad` : 'Egg curry (2 eggs) + 1 cup rice + salad',
            snack: `Roasted chana 30g + ${dairy('chaas 200ml', 'nimbu paani')}`,
            dinner: isVeg ? `Mixed veg curry + 2 rotis + dal` : 'Baked chicken 150g + roasted vegetables'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `${dairy('Greek yogurt 150g', 'Coconut yogurt 150g')} + granola 30g + kiwi` : 'Eggs (2) + granola 30g + fruits',
            lunch: isVeg ? `Rajma + brown rice 1 cup + ${dairy('lassi small', 'salad')}` : 'Grilled chicken 150g + brown rice + salad',
            snack: 'Mixed nuts 25g + green tea',
            dinner: isVeg ? `Dal + baingan bharta + 2 rotis` : 'Fish fillet 150g + sabzi + 1 roti'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Moong dal chilla 2pcs + tomato chutney` : '2-egg bhurji + toast 2 slices',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 1 cup rice + salad` : 'Chicken salad 150g + whole wheat bread',
            snack: `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + seeds 15g`,
            dinner: isVeg ? `Dal makhani + 2 rotis + salad` : 'Grilled fish 150g + 2 rotis + salad'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `Pesarattu 2pcs + allam chutney + fruits` : 'Omelette (2 eggs) + whole wheat toast + fruits',
            lunch: isVeg ? `Veg biryani + ${dairy('raita', 'salad')}` : 'Chicken biryani small + raita',
            snack: 'Green tea + walnuts 15g',
            dinner: isVeg ? `Sabzi + dal + 2 rotis` : 'Chicken wrap + salad + hummus'
          }
        ]
      },
      {
        weekLabel: 'Week 3',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Oats 50g + ${dairy('dahi 100g', 'coconut yogurt 100g')} + mango` : '2-egg omelette + oats 50g + orange',
            lunch: isVeg ? `${dairy('Paneer curry 120g', 'Tofu curry 120g')} + brown rice 1 cup + salad` : 'Grilled chicken 150g + brown rice + greens',
            snack: `${dairy('Chaas 200ml', 'Nimbu paani')} + makhana 25g`,
            dinner: isVeg ? `Dal tadka + 2 rotis + capsicum sabzi` : 'Fish tikka 150g + salad + 1 roti'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Idli 3pcs + sambar + mint chutney` : 'Boiled eggs (2) + idli 2pcs + sambar',
            lunch: isVeg ? `Masoor dal + 1 cup rice + salad` : 'Chicken wrap + vegetables + hummus',
            snack: 'Apple + peanut butter 1 tbsp',
            dinner: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 2 rotis + salad` : '2-egg bhurji + 2 rotis + salad'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Besan chilla 2pcs + mint chutney + fruits` : '2-egg omelette + whole wheat toast + fruits',
            lunch: isVeg ? `Chole + 1 cup rice + ${dairy('raita', 'salad')}` : 'Fish curry 150g + 1 cup rice + dal',
            snack: `${dairy('Greek yogurt 120g', 'Coconut yogurt 120g')} + mixed seeds 15g`,
            dinner: isVeg ? `Mixed dal + 2 rotis + baingan sabzi` : 'Chicken stir-fry 150g + 1 roti + salad'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Poha 70g + ${dairy('dahi', 'coconut yogurt')} + apple` : 'Scrambled eggs (2) + poha 70g + mango',
            lunch: isVeg ? `Rajma + 1 cup rice + ${dairy('lassi small', 'salad')}` : 'Grilled chicken 150g + sweet potato + greens',
            snack: 'Roasted chana 30g + green tea',
            dinner: isVeg ? `${dairy('Paneer matar 120g', 'Tofu matar 120g')} + 2 rotis + sabzi` : 'Baked fish 150g + vegetables + 1 roti'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Rava upma 60g + coconut chutney + fruits` : '2-egg bhurji + upma 50g + banana',
            lunch: isVeg ? `Veg pulao 1 cup + ${dairy('raita', 'salad')}` : 'Chicken breast 150g + pasta + tomato sauce + vegetables',
            snack: `Mixed nuts 25g + ${dairy('dahi 100g', 'coconut yogurt 100g')}`,
            dinner: isVeg ? `Dal palak + 2 rotis + salad` : 'Egg curry (2) + 2 rotis + salad'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + granola 30g + berries` : 'Omelette (2) + granola 30g + fruits',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + brown rice 1 cup + salad` : 'Fish fillet 150g + brown rice + salad',
            snack: `${dairy('Chaas 200ml', 'Nimbu paani')} + roasted chana 25g`,
            dinner: isVeg ? `Mixed veg curry + 2 rotis + dal` : 'Chicken tikka 150g + salad + 1 roti'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `Pesarattu 2pcs + coconut chutney + fruits` : 'Boiled eggs (2) + pesarattu 1pc + fruits',
            lunch: isVeg ? `Veg biryani + ${dairy('raita', 'salad')}` : 'Chicken biryani small + raita + salad',
            snack: 'Green tea + almonds 20g + walnuts 10g',
            dinner: isVeg ? `Dal + sabzi + 2 rotis` : 'Grilled fish 150g + 2 rotis + salad'
          }
        ]
      },
      {
        weekLabel: 'Week 4',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Oats 50g + ${dairy('milk', 'oat milk')} + banana + almonds 10g` : 'Scrambled eggs (2) + oats 50g + apple',
            lunch: isVeg ? `Chana masala + 1 cup rice + salad` : 'Grilled chicken 150g + 1 cup rice + salad',
            snack: `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + seeds 15g`,
            dinner: isVeg ? `Dal tadka + 2 rotis + mixed sabzi` : 'Fish fillet 150g + vegetables + 1 roti'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Idli 3pcs + sambar + coconut chutney` : '2-egg bhurji + idli 2pcs + sambar',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 1 cup rice + salad` : 'Turkey/chicken mince + pasta + tomato sauce',
            snack: 'Apple + cashews 20g',
            dinner: isVeg ? `${dairy('Paneer bhurji 120g', 'Tofu bhurji 120g')} + 2 rotis + salad` : '2-egg omelette + sabzi + 1 roti'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Moong dal chilla 2pcs + mint chutney + orange` : 'Omelette (2) + toast 2 slices + fruits',
            lunch: isVeg ? `Rajma + brown rice 1 cup + ${dairy('raita', 'salad')}` : 'Fish curry 150g + 1 cup rice + dal',
            snack: `${dairy('Chaas 200ml', 'Nimbu paani')} + makhana 25g`,
            dinner: isVeg ? `Masoor dal + 2 rotis + baingan sabzi` : 'Chicken stir-fry 150g + 1 roti + salad'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `${dairy('Greek yogurt 150g', 'Coconut yogurt 150g')} + granola 30g + kiwi` : 'Boiled eggs (2) + granola 30g + fruits',
            lunch: isVeg ? `Chole + 1 cup rice + salad` : 'Chicken breast 150g + sweet potato + greens',
            snack: 'Roasted chana 30g + green tea',
            dinner: isVeg ? `Dal makhani + 2 rotis + sabzi` : 'Baked chicken 150g + salad + 1 roti'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Poha 70g + ${dairy('dahi', 'coconut yogurt')} + mango` : '2-egg omelette + poha 70g + apple',
            lunch: isVeg ? `Veg pulao 1 cup + ${dairy('raita', 'salad')}` : 'Grilled fish 150g + brown rice + salad',
            snack: `Mixed nuts 25g + ${dairy('dahi 100g', 'coconut yogurt 100g')}`,
            dinner: isVeg ? `Mixed veg curry + 2 rotis + dal` : 'Egg curry (2) + 2 rotis + sabzi'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Pesarattu 2pcs + gongura chutney + fruits` : 'Omelette (2) + pesarattu 1pc + banana',
            lunch: isVeg ? `${dairy('Paneer matar 120g', 'Tofu matar 120g')} + 1 cup rice + salad` : 'Chicken salad 150g + whole wheat bread',
            snack: `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + seeds 15g`,
            dinner: isVeg ? `Palak dal + 2 rotis + salad` : 'Grilled fish 150g + salad + 1 roti'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `Rava upma 60g + coconut chutney + fruits` : '2-egg bhurji + upma 50g + orange',
            lunch: isVeg ? `Veg biryani + ${dairy('raita', 'salad')}` : 'Chicken biryani small + raita + salad',
            snack: 'Green tea + almonds 20g',
            dinner: isVeg ? `Dal + sabzi + 2 rotis` : 'Chicken wrap + salad + hummus'
          }
        ]
      }
    ],
    guidelines: [
      'Maintenance calories: 2000–2200 kcal daily',
      'Balanced macros: 40% carbs, 30% protein, 30% fats',
      '3 meals + 2 snacks daily for steady energy',
      'Focus on whole foods, minimise ultra-processed items',
      'Hydration: 2.5–3L water daily'
    ]
  };

  return [month1, null, null, null, null, null];
};

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

exports.getCardioPlan = (profile) => {
  const mhr = profile.age ? 220 - profile.age : 180;
  return [{
    monthLabel: 'Month 1',
    sessions: [
      { day: 'Monday',    type: 'LISS', duration: 30, intensity: 'Moderate', notes: 'Brisk walk' },
      { day: 'Wednesday', type: 'HIIT', duration: 20, intensity: 'High',     notes: '30s on / 30s off intervals' },
      { day: 'Friday',    type: 'LISS', duration: 30, intensity: 'Moderate', notes: 'Cycling or swimming' }
    ],
    hrZones: {
      warmup:   `${Math.round(mhr * 0.50)}–${Math.round(mhr * 0.60)} bpm (50-60% MHR)`,
      fat_burn: `${Math.round(mhr * 0.60)}–${Math.round(mhr * 0.70)} bpm (60-70% MHR)`,
      cardio:   `${Math.round(mhr * 0.70)}–${Math.round(mhr * 0.80)} bpm (70-80% MHR)`,
      peak:     `${Math.round(mhr * 0.80)}–${Math.round(mhr * 0.90)} bpm (80-90% MHR)`
    }
  }, null, null, null, null, null];
};

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
    items.push({ category: 'medication', text: `💊 Take ${med.name}${med.dosage ? ` ${med.dosage}` : ''} — ${med.timing || 'as directed'}` });
  });
  return items;
};

exports.getPlanMeta = getPlanMeta;
