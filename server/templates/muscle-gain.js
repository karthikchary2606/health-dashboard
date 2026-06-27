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
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor((Date.now() - startDate) / msPerWeek);
  const currentWeek = (weeksElapsed % 4) + 1;
  return {
    templateName: 'muscle-gain',
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

  const dairyOrAlt = (dairy, alt) => isVegan ? alt : dairy;

  const month1 = {
    monthLabel: 'Month 1 — Foundation',
    weeks: [
      {
        weekLabel: 'Week 1',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Oats porridge 60g + banana + ${dairyOrAlt('dahi 100g', 'coconut yogurt 100g')}` : '4-egg omelette + oats 60g + banana',
            lunch: isVeg ? `Rajma curry + 1.5 cups rice + ${dairyOrAlt('cucumber raita', 'cucumber salad')}` : 'Chicken breast 200g + 1.5 cups rice + dal + salad',
            snack: 'Mixed nuts 30g + green tea',
            dinner: isVeg ? `${dairyOrAlt('Paneer bhurji 150g', 'Tofu bhurji 150g')} + 2 rotis + sabzi` : 'Egg bhurji (3 eggs) + 2 rotis + sabzi'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `${dairyOrAlt('Dahi 150g', 'Coconut yogurt 150g')} + poha 60g + apple` : 'Boiled eggs (3) + poha 60g + apple',
            lunch: isVeg ? `Chana masala + 1.5 cups rice + salad` : 'Fish curry 200g + 1.5 cups rice + salad',
            snack: `${dairyOrAlt('Chaas 250ml', 'Nimbu paani')} + roasted chana 40g`,
            dinner: isVeg ? `Dal makhani + 2 rotis + mixed sabzi` : 'Chicken stir-fry 150g + 2 rotis + dal'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Idli 4pcs + sambar + coconut chutney` : 'Egg dosa (2 eggs) + sambar + chutney',
            lunch: isVeg ? `${dairyOrAlt('Palak paneer 150g', 'Palak tofu 150g')} + 1.5 cups rice` : 'Chicken curry 200g + 1.5 cups rice + salad',
            snack: 'Banana + peanut butter 1.5 tbsp',
            dinner: isVeg ? `${dairyOrAlt('Paneer tikka 150g', 'Tofu tikka 150g')} + dal + 1 roti` : '2-egg omelette + dal + 1 roti + sabzi'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Besan chilla 3pcs + green chutney` : '4-egg omelette + 2 slices toast',
            lunch: isVeg ? `Mixed dal + 1.5 cups rice + sabzi` : 'Egg curry (3 eggs) + 1.5 cups rice + salad',
            snack: `${dairyOrAlt('Greek yogurt / dahi 150g', 'Coconut yogurt 150g')} + pumpkin seeds 20g`,
            dinner: isVeg ? `${dairyOrAlt('Paneer', 'Tofu')} stir-fry 150g + 1.5 cups rice` : 'Grilled chicken 200g + vegetables + 1 roti'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Upma 60g + coconut chutney + fruits` : 'Egg white omelette (4 whites + 1 yolk) + upma 40g',
            lunch: isVeg ? `Chole + 1.5 cups rice + ${dairyOrAlt('raita', 'tomato salad')}` : 'Chicken breast 200g + 1.5 cups rice + dal',
            snack: `Banana + ${dairyOrAlt('milk 250ml', 'soy milk 250ml')}`,
            dinner: isVeg ? `${dairyOrAlt('Paneer tikka', 'Tofu tikka')} + salad + 1 roti` : 'Boiled eggs (3) + salad + 1 roti'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Pesarattu 3pcs + ginger chutney` : 'Egg bhurji (3 eggs) + 2 slices toast',
            lunch: isVeg ? `${dairyOrAlt('Dal makhani', 'Rajma')} + 1.5 cups rice + salad` : 'Chicken breast 200g + sweet potato 150g + greens',
            snack: `${dairyOrAlt('Chaas 250ml', 'Nimbu paani')} + roasted chana 40g`,
            dinner: isVeg ? `Mixed veg curry + 2 rotis` : 'Egg fried rice 1.5 cups + vegetables (light oil)'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `${dairyOrAlt('Dahi 200g', 'Coconut yogurt 200g')} + fruits + granola 40g` : 'Eggs (3) + fruits + oats 60g',
            lunch: isVeg ? `Vegetable biryani (brown rice 1.5 cups) + ${dairyOrAlt('raita', 'salad')}` : 'Chicken biryani (small) + raita',
            snack: 'Green tea + mixed nuts 30g',
            dinner: isVeg ? `${dairyOrAlt('Palak paneer 150g', 'Palak tofu 150g')} + 2 rotis` : 'Grilled fish/chicken 200g + salad'
          }
        ]
      },
      {
        weekLabel: 'Week 2',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Moong dal chilla 3pcs + mint chutney` : 'Scrambled eggs (4) + 2 slices whole wheat toast',
            lunch: isVeg ? `${dairyOrAlt('Paneer curry 150g', 'Tofu curry 150g')} + 1.5 cups rice + salad` : 'Chicken breast 200g + 1.5 cups brown rice + broccoli',
            snack: `${dairyOrAlt('Dahi 150g', 'Coconut yogurt 150g')} + flax seeds 1 tsp`,
            dinner: isVeg ? `Dal tadka + 2 rotis + baingan sabzi` : 'Fish fillet 200g + 2 rotis + dal'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Poha 80g + ${dairyOrAlt('dahi', 'coconut yogurt')} + mango` : 'Omelette (3 eggs) + poha 80g + banana',
            lunch: isVeg ? `Kidney beans + 1.5 cups rice + ${dairyOrAlt('lassi small', 'nimbu paani')}` : 'Mutton keema 150g + 1.5 cups rice + raita',
            snack: 'Apple + peanut butter 2 tbsp',
            dinner: isVeg ? `${dairyOrAlt('Paneer bhurji 150g', 'Tofu bhurji 150g')} + 2 rotis + salad` : '3-egg bhurji + 2 rotis + salad'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Rava dosa 2pcs + sambar + ${dairyOrAlt('dahi', 'coconut chutney')}` : 'Egg dosa (2 eggs) + sambar',
            lunch: isVeg ? `Chana dal + 1.5 cups rice + sabzi` : 'Chicken stew 200g + 1.5 cups rice + salad',
            snack: 'Mixed nuts 35g + green tea',
            dinner: isVeg ? `${dairyOrAlt('Cottage cheese salad 150g', 'Tofu salad 150g')} + 1 roti` : 'Grilled chicken 200g + vegetables'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Idli 4pcs + coconut chutney + sambar` : 'Boiled eggs (4) + idli 2pcs + sambar',
            lunch: isVeg ? `Palak dal + 1.5 cups rice + ${dairyOrAlt('cucumber raita', 'cucumber salad')}` : 'Egg curry 3 eggs + 1.5 cups rice + salad',
            snack: `${dairyOrAlt('Milk 300ml', 'Soy milk 300ml')} + banana`,
            dinner: isVeg ? `Mixed dal + 2 rotis + capsicum sabzi` : '3-egg omelette + dal + 2 rotis'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Oats porridge 60g + berries + ${dairyOrAlt('dahi 100g', 'coconut yogurt 100g')}` : '3-egg bhurji + oats 60g + orange',
            lunch: isVeg ? `${dairyOrAlt('Paneer matar 150g', 'Tofu matar 150g')} + 1.5 cups rice` : 'Chicken pulao 1.5 cups + raita + salad',
            snack: `Roasted chana 50g + ${dairyOrAlt('chaas 200ml', 'nimbu paani')}`,
            dinner: isVeg ? `Baingan bharta + 2 rotis + dal` : 'Boiled eggs (3) + sabzi + 2 rotis'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Pesarattu 3pcs + allam chutney` : '4-egg omelette + wheat bread 2 slices',
            lunch: isVeg ? `Rajma + 1.5 cups rice + salad` : 'Fish curry 200g + 1.5 cups rice + dal',
            snack: `${dairyOrAlt('Greek yogurt 150g', 'Coconut yogurt 150g')} + mixed seeds 20g`,
            dinner: isVeg ? `${dairyOrAlt('Dahi', 'Coconut yogurt')} rice + pickle + sabzi` : 'Chicken tikka 150g + salad + 1 roti'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `Upma 70g + coconut chutney + fruits` : 'Eggs (3) + upma 50g + fruits',
            lunch: isVeg ? `Veg biryani (brown rice) + ${dairyOrAlt('raita', 'salad')}` : 'Chicken biryani small + raita + salad',
            snack: 'Green tea + almonds 20g + walnuts 10g',
            dinner: isVeg ? `${dairyOrAlt('Paneer', 'Tofu')} sabzi + 2 rotis + dal` : 'Grilled fish 200g + 2 rotis + salad'
          }
        ]
      },
      {
        weekLabel: 'Week 3',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Besan chilla 3pcs + tomato chutney` : '4-egg omelette + besan chilla 1pc',
            lunch: isVeg ? `Chole masala + 1.5 cups rice + ${dairyOrAlt('raita', 'salad')}` : 'Chicken breast 200g + 1.5 cups rice + raita',
            snack: `${dairyOrAlt('Chaas 250ml', 'Nimbu paani')} + makhana 30g`,
            dinner: isVeg ? `${dairyOrAlt('Paneer bhurji 150g', 'Tofu bhurji 150g')} + 2 rotis` : '3-egg bhurji + 2 rotis + sabzi'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Moong sprout salad 100g + ${dairyOrAlt('dahi 100g', 'coconut yogurt 100g')} + toast` : 'Boiled eggs (3) + moong sprouts 80g + toast',
            lunch: isVeg ? `Lentil soup + 1.5 cups rice + sabzi` : 'Mutton curry 150g + 1.5 cups rice + salad',
            snack: `Banana + ${dairyOrAlt('milk 250ml', 'soy milk 250ml')}`,
            dinner: isVeg ? `Dal palak + 2 rotis + mixed sabzi` : 'Fish tikka 150g + dal + 1 roti'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Idli 4pcs + sambar + mint chutney` : 'Egg dosa + sambar + chutney',
            lunch: isVeg ? `${dairyOrAlt('Paneer tikka masala 150g', 'Tofu tikka masala 150g')} + 1.5 cups rice` : 'Chicken stir-fry 200g + 1.5 cups brown rice',
            snack: `Mixed nuts 35g + ${dairyOrAlt('green tea', 'green tea')}`,
            dinner: isVeg ? `Dal + 2 rotis + baingan sabzi` : '3-egg omelette + dal + 2 rotis'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Oats 60g + ${dairyOrAlt('dahi', 'coconut yogurt')} + mango + seeds 15g` : 'Scrambled eggs (4) + oats 40g + banana',
            lunch: isVeg ? `Masoor dal + 1.5 cups rice + ${dairyOrAlt('cucumber raita', 'cucumber salad')}` : 'Egg fried rice 1.5 cups + vegetables',
            snack: `${dairyOrAlt('Paneer 50g raw', 'Tofu 80g')} + fruits`,
            dinner: isVeg ? `${dairyOrAlt('Palak paneer 150g', 'Palak tofu 150g')} + 2 rotis` : 'Grilled chicken 200g + salad + 1 roti'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Pesarattu 3pcs + coconut chutney` : '3-egg bhurji + pesarattu 1pc',
            lunch: isVeg ? `Rajma + 1.5 cups rice + salad` : 'Chicken curry 200g + 1.5 cups rice + dal',
            snack: `${dairyOrAlt('Greek yogurt 150g', 'Coconut yogurt 150g')} + pumpkin seeds 20g`,
            dinner: isVeg ? `Mixed dal + 2 rotis + capsicum sabzi` : 'Fish curry 200g + 2 rotis + salad'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Rava upma 70g + coconut chutney + orange` : '4-egg omelette + rava upma 50g',
            lunch: isVeg ? `Veg pulao + ${dairyOrAlt('raita', 'salad')}` : 'Chicken pulao + raita + salad',
            snack: `Roasted chana 50g + ${dairyOrAlt('chaas 200ml', 'nimbu paani')}`,
            dinner: isVeg ? `${dairyOrAlt('Paneer matar', 'Tofu matar')} + 2 rotis` : '3-egg bhurji + vegetables + 1 roti'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `${dairyOrAlt('Dahi 200g', 'Coconut yogurt 200g')} + granola 40g + mixed fruits` : 'Eggs (3) + granola 40g + fruits',
            lunch: isVeg ? `Veg biryani (brown rice) + ${dairyOrAlt('raita', 'salad')}` : 'Fish biryani small + raita',
            snack: 'Green tea + walnuts 15g + almonds 10g',
            dinner: isVeg ? `Dal makhani + 2 rotis + salad` : 'Chicken tikka 200g + dal + salad'
          }
        ]
      },
      {
        weekLabel: 'Week 4',
        weekdays: [
          {
            day: 'Monday',
            breakfast: isVeg ? `Moong dal chilla 3pcs + mint chutney` : '4-egg bhurji + toast 2 slices',
            lunch: isVeg ? `Chole + 1.5 cups rice + ${dairyOrAlt('raita', 'salad')}` : 'Chicken breast 200g + 1.5 cups brown rice + salad',
            snack: `Mixed nuts 35g + ${dairyOrAlt('dahi 100g', 'coconut yogurt 100g')}`,
            dinner: isVeg ? `${dairyOrAlt('Paneer bhurji 150g', 'Tofu bhurji 150g')} + 2 rotis + sabzi` : '3-egg omelette + 2 rotis + dal'
          },
          {
            day: 'Tuesday',
            breakfast: isVeg ? `Idli 4pcs + sambar + coconut chutney` : 'Boiled eggs (3) + idli 2pcs + sambar',
            lunch: isVeg ? `Palak dal + 1.5 cups rice + sabzi` : 'Mutton/chicken curry 200g + 1.5 cups rice + dal',
            snack: `${dairyOrAlt('Chaas 250ml', 'Nimbu paani')} + makhana 30g`,
            dinner: isVeg ? `Mixed dal + 2 rotis + capsicum sabzi` : 'Fish stir-fry 150g + 2 rotis + salad'
          },
          {
            day: 'Wednesday',
            breakfast: isVeg ? `Poha 80g + ${dairyOrAlt('dahi', 'coconut yogurt')} + apple` : 'Egg poha (2 eggs + 60g poha) + fruits',
            lunch: isVeg ? `${dairyOrAlt('Paneer curry 150g', 'Tofu curry 150g')} + 1.5 cups rice + salad` : 'Chicken fried rice 1.5 cups + vegetables',
            snack: `Banana + ${dairyOrAlt('milk 300ml', 'soy milk 300ml')}`,
            dinner: isVeg ? `${dairyOrAlt('Palak paneer 150g', 'Palak tofu 150g')} + 2 rotis` : '3-egg bhurji + dal + 2 rotis'
          },
          {
            day: 'Thursday',
            breakfast: isVeg ? `Oats porridge 60g + berries + ${dairyOrAlt('dahi 100g', 'coconut yogurt 100g')}` : '3-egg omelette + oats 60g + orange',
            lunch: isVeg ? `Rajma + 1.5 cups rice + ${dairyOrAlt('lassi small', 'salad')}` : 'Chicken breast 200g + 1.5 cups rice + raita',
            snack: `${dairyOrAlt('Greek yogurt 150g', 'Coconut yogurt 150g')} + seeds mix 20g`,
            dinner: isVeg ? `Dal tadka + 2 rotis + mixed sabzi` : 'Grilled chicken 200g + vegetables + 1 roti'
          },
          {
            day: 'Friday',
            breakfast: isVeg ? `Pesarattu 3pcs + gongura chutney` : '4-egg bhurji + pesarattu 2pcs',
            lunch: isVeg ? `Masoor dal + 1.5 cups rice + ${dairyOrAlt('raita', 'cucumber salad')}` : 'Fish curry 200g + 1.5 cups rice + dal',
            snack: `Roasted chana 50g + ${dairyOrAlt('chaas 200ml', 'nimbu paani')}`,
            dinner: isVeg ? `${dairyOrAlt('Paneer matar', 'Tofu matar')} + 2 rotis + salad` : 'Egg curry 3 eggs + 2 rotis + sabzi'
          },
          {
            day: 'Saturday',
            breakfast: isVeg ? `Rava upma 70g + tomato chutney + fruits` : 'Omelette (3 eggs) + rava upma 50g + mango',
            lunch: isVeg ? `Veg biryani + ${dairyOrAlt('raita', 'salad')}` : 'Mutton/chicken biryani small + raita',
            snack: `Mixed nuts 30g + ${dairyOrAlt('green tea', 'green tea')}`,
            dinner: isVeg ? `Baingan bharta + 2 rotis + dal` : 'Grilled fish 200g + 2 rotis + salad'
          },
          {
            day: 'Sunday',
            breakfast: isVeg ? `${dairyOrAlt('Dahi 200g', 'Coconut yogurt 200g')} + fruits + granola 40g` : 'Eggs (3) + fruits + oats 60g',
            lunch: isVeg ? `Chole biryani + ${dairyOrAlt('raita', 'salad')}` : 'Chicken biryani small + raita + salad',
            snack: 'Green tea + almonds 20g + walnuts 10g',
            dinner: isVeg ? `Dal makhani + 2 rotis + salad` : 'Chicken stir-fry 200g + 1 roti + dal'
          }
        ]
      }
    ],
    guidelines: [
      'Caloric surplus of ~300 kcal above TDEE (~2800 kcal target)',
      'Protein target: 1.8–2.2g per kg bodyweight',
      'Distribute protein across 4–5 meals',
      'Post-workout meal within 45 min of training',
      'Hydration: minimum 3L water on training days'
    ]
  };

  return [month1, null, null, null, null, null];
};

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

exports.getCardioPlan = (profile) => {
  const mhr = profile.age ? 220 - profile.age : 180;
  return [{
    monthLabel: 'Month 1',
    sessions: [
      { day: 'Wednesday', type: 'LISS', duration: 20, intensity: 'Low', notes: 'Active recovery walk' },
      { day: 'Saturday',  type: 'LISS', duration: 30, intensity: 'Low', notes: 'Light jog or cycling' }
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
    items.push({ category: 'medication', text: `💊 Take ${med.name}${med.dosage ? ` ${med.dosage}` : ''} — ${med.timing || 'as directed'}` });
  });
  return items;
};

exports.getPlanMeta = getPlanMeta;
