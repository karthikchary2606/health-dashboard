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
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor((Date.now() - startDate) / msPerWeek);
  const currentWeek = (weeksElapsed % 4) + 1;
  return {
    templateName: 'general-fitness',
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
    monthLabel: 'Month 1 — Active',
    weeks: [
      {
        weekLabel: 'Week 1',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Oats 50g + ${dairy('dahi 100g', 'coconut yogurt 100g')} + banana` : 'Omelette (2 eggs) + oats 50g + banana',
            lunch: isVeg ? `${dairy('Paneer bhurji 120g', 'Tofu bhurji 120g')} + 1 cup rice + salad` : 'Chicken breast 150g + 1 cup rice + salad',
            snack: 'Banana + mixed nuts 25g',
            dinner: isVeg ? `Dal + 2 rotis + mixed sabzi` : 'Grilled fish 150g + 2 rotis + sabzi'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Idli 3pcs + sambar + coconut chutney` : 'Boiled eggs (2) + idli 2pcs + sambar',
            lunch: isVeg ? `Chole + 1 cup brown rice + ${dairy('raita', 'salad')}` : 'Tuna / fish 150g + brown rice 1 cup + vegetables',
            snack: `${dairy('Chaas 200ml', 'Nimbu paani')} + roasted chana 30g`,
            dinner: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 2 rotis` : 'Egg curry (2) + 2 rotis + sabzi'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Poha 70g + ${dairy('dahi', 'coconut yogurt')} + apple` : '2-egg bhurji + poha 70g + apple',
            lunch: isVeg ? `Rajma + 1 cup rice + salad` : 'Chicken curry 150g + 1 cup rice + salad',
            snack: `${dairy('Greek yogurt 120g', 'Coconut yogurt 120g')} + seeds 15g`,
            dinner: isVeg ? `Mixed dal + 2 rotis + capsicum sabzi` : 'Baked fish 150g + vegetables + 1 roti'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Pesarattu 2pcs + mint chutney` : 'Omelette (2 eggs) + pesarattu 1pc + chutney',
            lunch: isVeg ? `Masoor dal + 1 cup rice + sabzi` : 'Grilled chicken 150g + sweet potato + greens',
            snack: 'Mixed nuts 25g + green tea',
            dinner: isVeg ? `${dairy('Paneer tikka 120g', 'Tofu tikka 120g')} + salad + 1 roti` : '2-egg omelette + salad + 1 roti'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Upma 60g + coconut chutney + fruits` : 'Boiled eggs (2) + upma 50g + orange',
            lunch: isVeg ? `${dairy('Dahi rice + pickle', 'Coconut yogurt rice + pickle')} + sabzi` : 'Fish fillet 150g + 1 cup rice + salad',
            snack: `Roasted chana 30g + ${dairy('chaas 200ml', 'nimbu paani')}`,
            dinner: isVeg ? `Dal makhani + 2 rotis + sabzi` : 'Chicken stir-fry 150g + 1 roti + salad'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + granola 30g + berries` : '2-egg bhurji + granola 30g + fruits',
            lunch: isVeg ? `Veg biryani + ${dairy('raita', 'salad')}` : 'Chicken biryani small + raita + salad',
            snack: `${dairy('Dahi 100g', 'Coconut yogurt 100g')} + flax seeds 1 tsp`,
            dinner: isVeg ? `Baingan bharta + 2 rotis + dal` : 'Grilled fish 150g + salad + 1 roti'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `Besan chilla 2pcs + mint chutney + fruits` : 'Scrambled eggs (2) + toast + fruits',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 1 cup rice + salad` : 'Grilled chicken 150g + pasta + tomato sauce',
            snack: 'Green tea + almonds 20g',
            dinner: isVeg ? `Dal + sabzi + 2 rotis` : 'Egg fried rice 1 cup + vegetables'
          }
        ]
      },
      {
        weekLabel: 'Week 2',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Oats 50g + ${dairy('milk', 'oat milk')} + banana + almonds 10g` : 'Omelette (2) + oats 50g + orange',
            lunch: isVeg ? `Chana masala + 1 cup rice + ${dairy('raita', 'salad')}` : 'Fish curry 150g + 1 cup rice + salad',
            snack: `${dairy('Chaas 200ml', 'Nimbu paani')} + makhana 25g`,
            dinner: isVeg ? `${dairy('Paneer matar 120g', 'Tofu matar 120g')} + 2 rotis + sabzi` : 'Chicken stir-fry 150g + 2 rotis + salad'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Idli 3pcs + sambar + mint chutney` : 'Boiled eggs (2) + idli 2pcs + sambar',
            lunch: isVeg ? `Masoor dal + 1 cup rice + salad` : 'Grilled chicken 150g + sweet potato + greens',
            snack: 'Apple + peanut butter 1 tbsp',
            dinner: isVeg ? `Dal tadka + 2 rotis + baingan sabzi` : '2-egg omelette + dal + 2 rotis'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Moong dal chilla 2pcs + tomato chutney` : '2-egg bhurji + toast 2 slices',
            lunch: isVeg ? `Rajma + 1 cup rice + salad` : 'Fish 150g + brown rice 1 cup + salad',
            snack: `${dairy('Greek yogurt 120g', 'Coconut yogurt 120g')} + seeds 15g`,
            dinner: isVeg ? `Mixed veg curry + 2 rotis + dal` : 'Baked chicken 150g + vegetables + 1 roti'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Poha 70g + ${dairy('dahi', 'coconut yogurt')} + mango` : 'Scrambled eggs (2) + poha 70g + apple',
            lunch: isVeg ? `Chole + 1 cup rice + ${dairy('lassi small', 'salad')}` : 'Chicken breast 150g + pasta + tomato sauce',
            snack: 'Mixed nuts 25g + green tea',
            dinner: isVeg ? `Palak dal + 2 rotis + sabzi` : 'Egg bhurji (2) + sabzi + 1 roti'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Rava upma 60g + coconut chutney + fruits` : 'Omelette (2) + upma 50g + banana',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 1 cup rice + salad` : 'Tuna / fish 150g + 1 cup rice + salad',
            snack: `Roasted chana 30g + ${dairy('chaas 200ml', 'nimbu paani')}`,
            dinner: isVeg ? `Dal makhani + 2 rotis + sabzi` : 'Chicken tikka 150g + salad + 1 roti'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Pesarattu 2pcs + allam chutney + fruits` : '2-egg omelette + pesarattu 1pc + mango',
            lunch: isVeg ? `Veg pulao 1 cup + ${dairy('raita', 'salad')}` : 'Fish biryani small + raita',
            snack: `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + flax seeds 1 tsp`,
            dinner: isVeg ? `Mixed dal + 2 rotis + capsicum sabzi` : 'Grilled fish 150g + 2 rotis + sabzi'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `${dairy('Greek yogurt 150g', 'Coconut yogurt 150g')} + granola 30g + kiwi` : 'Eggs (2) + granola 30g + fruits',
            lunch: isVeg ? `Veg biryani + ${dairy('raita', 'salad')}` : 'Chicken biryani small + raita + salad',
            snack: 'Green tea + almonds 20g + walnuts 10g',
            dinner: isVeg ? `Sabzi + dal + 2 rotis` : 'Egg fried rice 1 cup + vegetables'
          }
        ]
      },
      {
        weekLabel: 'Week 3',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Oats 50g + ${dairy('dahi 100g', 'coconut yogurt 100g')} + berries` : '2-egg omelette + oats 50g + banana',
            lunch: isVeg ? `${dairy('Paneer curry 120g', 'Tofu curry 120g')} + 1 cup rice + salad` : 'Grilled chicken 150g + 1 cup rice + dal',
            snack: `${dairy('Chaas 200ml', 'Nimbu paani')} + makhana 25g`,
            dinner: isVeg ? `Dal + 2 rotis + baingan sabzi` : 'Fish stir-fry 150g + 2 rotis + salad'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Besan chilla 2pcs + tomato chutney` : 'Boiled eggs (2) + besan chilla 1pc',
            lunch: isVeg ? `Masoor dal + 1 cup rice + ${dairy('raita', 'salad')}` : 'Chicken wrap + vegetables + hummus',
            snack: 'Apple + cashews 20g',
            dinner: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 2 rotis + sabzi` : '2-egg bhurji + 2 rotis + sabzi'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Idli 3pcs + sambar + coconut chutney` : 'Egg dosa + sambar + chutney',
            lunch: isVeg ? `Rajma + 1 cup rice + salad` : 'Fish curry 150g + 1 cup rice + salad',
            snack: `${dairy('Greek yogurt 120g', 'Coconut yogurt 120g')} + seeds 15g`,
            dinner: isVeg ? `Mixed dal + 2 rotis + sabzi` : 'Grilled chicken 150g + salad + 1 roti'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Poha 70g + ${dairy('dahi', 'coconut yogurt')} + orange` : 'Scrambled eggs (2) + poha 70g + mango',
            lunch: isVeg ? `Chole + 1 cup brown rice + ${dairy('raita', 'salad')}` : 'Chicken breast 150g + pasta + vegetables',
            snack: 'Mixed nuts 25g + green tea',
            dinner: isVeg ? `${dairy('Paneer bhurji 120g', 'Tofu bhurji 120g')} + 2 rotis + sabzi` : 'Egg curry (2) + dal + 2 rotis'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Pesarattu 2pcs + gongura chutney + fruits` : '2-egg omelette + pesarattu 1pc + fruits',
            lunch: isVeg ? `Veg pulao 1 cup + ${dairy('raita', 'salad')}` : 'Fish fillet 150g + brown rice + salad',
            snack: `Roasted chana 30g + ${dairy('chaas 200ml', 'nimbu paani')}`,
            dinner: isVeg ? `Dal palak + 2 rotis + capsicum sabzi` : 'Chicken tikka 150g + salad + 1 roti'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Rava upma 60g + coconut chutney + fruits` : '2-egg bhurji + upma 50g + banana',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 1 cup rice + salad` : 'Chicken biryani small + raita',
            snack: `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + flax seeds 1 tsp`,
            dinner: isVeg ? `Dal makhani + 2 rotis + sabzi` : 'Baked fish 150g + vegetables + 1 roti'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + fruits + granola 30g` : 'Eggs (2) + fruits + toast',
            lunch: isVeg ? `Veg biryani + ${dairy('raita', 'salad')}` : 'Grilled chicken 150g + sweet potato + greens',
            snack: 'Green tea + almonds 20g + walnuts 10g',
            dinner: isVeg ? `Sabzi + 2 rotis + dal` : 'Egg fried rice 1 cup + vegetables'
          }
        ]
      },
      {
        weekLabel: 'Week 4',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Oats 50g + ${dairy('milk', 'oat milk')} + banana` : 'Scrambled eggs (2) + oats 50g + orange',
            lunch: isVeg ? `Chana masala + 1 cup rice + ${dairy('raita', 'salad')}` : 'Chicken breast 150g + 1 cup rice + salad',
            snack: `${dairy('Chaas 200ml', 'Nimbu paani')} + roasted chana 30g`,
            dinner: isVeg ? `${dairy('Paneer curry 120g', 'Tofu curry 120g')} + 2 rotis + sabzi` : 'Fish curry 150g + 2 rotis + salad'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Moong dal chilla 2pcs + mint chutney + fruits` : '2-egg bhurji + toast 2 slices + fruits',
            lunch: isVeg ? `Masoor dal + 1 cup rice + ${dairy('raita', 'salad')}` : 'Grilled chicken 150g + brown rice + greens',
            snack: 'Apple + peanut butter 1 tbsp',
            dinner: isVeg ? `Dal tadka + 2 rotis + baingan sabzi` : '2-egg omelette + dal + 1 roti'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Idli 3pcs + sambar + mint chutney` : 'Boiled eggs (2) + idli 2pcs + sambar',
            lunch: isVeg ? `Rajma + 1 cup rice + salad` : 'Fish stir-fry 150g + 1 cup rice + salad',
            snack: `${dairy('Greek yogurt 120g', 'Coconut yogurt 120g')} + seeds 15g`,
            dinner: isVeg ? `Mixed veg curry + 2 rotis + dal` : 'Chicken tikka 150g + salad + 1 roti'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `${dairy('Greek yogurt 150g', 'Coconut yogurt 150g')} + granola 30g + mango` : 'Omelette (2) + granola 30g + fruits',
            lunch: isVeg ? `Chole + 1 cup rice + salad` : 'Chicken breast 150g + pasta + tomato sauce',
            snack: `Mixed nuts 25g + ${dairy('dahi 100g', 'coconut yogurt 100g')}`,
            dinner: isVeg ? `Palak dal + 2 rotis + sabzi` : 'Egg bhurji (2) + 2 rotis + salad'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Pesarattu 2pcs + allam chutney + fruits` : '2-egg bhurji + pesarattu 1pc + banana',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 1 cup rice + salad` : 'Tuna / fish 150g + 1 cup brown rice + salad',
            snack: `Roasted chana 30g + ${dairy('chaas 200ml', 'nimbu paani')}`,
            dinner: isVeg ? `Dal makhani + 2 rotis + sabzi` : 'Grilled fish 150g + salad + 1 roti'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Poha 70g + ${dairy('dahi', 'coconut yogurt')} + orange` : 'Scrambled eggs (2) + poha 70g + apple',
            lunch: isVeg ? `Veg biryani + ${dairy('raita', 'salad')}` : 'Chicken biryani small + raita + salad',
            snack: `${dairy('Dahi 150g', 'Coconut yogurt 150g')} + flax seeds 1 tsp`,
            dinner: isVeg ? `Mixed dal + 2 rotis + capsicum sabzi` : 'Baked chicken 150g + vegetables + 1 roti'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `Rava upma 60g + coconut chutney + fruits` : '2-egg omelette + upma 50g + mango',
            lunch: isVeg ? `${dairy('Palak paneer 120g', 'Palak tofu 120g')} + 1 cup rice + salad` : 'Grilled chicken 150g + sweet potato + greens',
            snack: 'Green tea + almonds 20g + walnuts 10g',
            dinner: isVeg ? `Sabzi + 2 rotis + dal` : 'Egg fried rice 1 cup + vegetables + salad'
          }
        ]
      }
    ],
    guidelines: [
      'Balanced nutrition: ~2200 kcal daily',
      'Protein target: 1.2–1.5g per kg bodyweight',
      '3 meals + 2 snacks to fuel activity and recovery',
      'Pre-workout snack 30–45 min before training',
      'Hydration: 2.5–3L water daily'
    ]
  };

  return [month1, null, null, null, null, null];
};

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

exports.getCardioPlan = (profile) => {
  const mhr = profile.age ? 220 - profile.age : 180;
  return [{
    monthLabel: 'Month 1',
    sessions: [
      { day: 'Monday',    type: 'LISS', duration: 30, intensity: 'Moderate', notes: 'Running or cycling' },
      { day: 'Wednesday', type: 'HIIT', duration: 25, intensity: 'High',     notes: 'Interval training' },
      { day: 'Friday',    type: 'LISS', duration: 35, intensity: 'Moderate', notes: 'Swimming or jogging' },
      { day: 'Sunday',    type: 'LISS', duration: 20, intensity: 'Low',      notes: 'Yoga or light walk' }
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
    items.push({ category: 'medication', text: `💊 Take ${med.name}${med.dosage ? ` ${med.dosage}` : ''} — ${med.timing || 'as directed'}` });
  });
  return items;
};

exports.getPlanMeta = getPlanMeta;
