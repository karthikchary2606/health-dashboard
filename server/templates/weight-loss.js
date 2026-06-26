// Weight-loss plan template — south Indian cuisine, LBP-safe, thyroid-aware
// Source of truth: public/js/{diet,workout,cardio,grocery,guidelines}.js

// ─── Diet data (from public/js/diet.js MONTHLY_DIET) ─────────────────────────

const MONTHLY_DIET = [
  {
    name: 'Month 1 — Foundation',
    guidelines: [
      'Telugu comfort food — build the habit',
      'Chicken only Wed & Fri',
      '1 cup rice/day maximum',
      'Walk 20–30 min daily fasted'
    ],
    weekdays: [
      { day: 'Monday',    breakfast: 'Pesarattu (2 pcs) + Allam Chutney',           lunch: 'Palakura Pappu + 1 Cup Rice + Bendakaya Fry',           snack: 'Green Tea + 10 Almonds + Nuvvulu Mix (20g)',        dinner: '3-Egg Capsicum Omelet in Ghee' },
      { day: 'Tuesday',   breakfast: '3-Egg Bhurji (onion, tomato, ghee)',           lunch: 'Rajma Curry + 1 Cup Rice + Palakura Stir-fry',          snack: 'Chaas (200ml) + Roasted Chana (30g)',               dinner: 'Paneer Bhurji + 1 Phulka' },
      { day: 'Wednesday', breakfast: 'Rava Upma (small) + Coconut Chutney',          lunch: 'Chicken Curry (150g) + 1 Cup Rice + Raita',             snack: 'Green Tea + Pumpkin Seeds Mix (20g)',               dinner: 'Palakura Pappu + 1 Phulka' },
      { day: 'Thursday',  breakfast: 'Pesarattu (2 pcs) + Gongura Chutney',          lunch: 'Kandi Pappu + 1 Cup Rice + Vankaya Fry',                snack: 'Chaas (200ml) + 10 Almonds',                        dinner: '2-Egg Omelet + Mixed Veggie Stir-fry' },
      { day: 'Friday',    breakfast: '3-Egg Omelet + Nuvvulu (Sesame) Chutney',      lunch: 'Chicken Curry (150g) + 1 Cup Rice + Bendakaya Fry',     snack: 'Green Tea + Seed Mix (20g)',                        dinner: 'Palakura Pappu + 1 Phulka' },
      { day: 'Saturday',  breakfast: '3-Egg Omelet + Curry Leaves Tadka',            lunch: 'Rajma Curry + 1 Cup Rice + Cucumber Raita',             snack: 'Chaas (200ml) + Walnuts (5 pcs)',                   dinner: 'Paneer Curry + 1 Phulka' },
      { day: 'Sunday',    breakfast: 'Idli (3 pcs) + Sambar + Coconut Chutney',      lunch: 'Kandi Pappu + 1 Cup Rice + Sorakaya Curry',             snack: 'Green Tea + Roasted Chana (30g)',                   dinner: '2-Egg Bhurji + Phulka' }
    ]
  },
  {
    name: 'Month 2 — Foundation+',
    guidelines: [
      'Reduce rice to ¾ cup',
      'Increase protein: add extra egg or 50g more paneer',
      'Add 30-min brisk walk daily',
      'Soyabean 2x/week cooked'
    ],
    weekdays: [
      { day: 'Monday',    breakfast: '2-Egg Bhurji + 1 Pesarattu',                   lunch: 'Palakura Pappu + ¾ Cup Rice + Bendakaya Fry',           snack: 'Green Tea + 10 Almonds + Nuvvulu Mix (20g)',        dinner: '3-Egg Capsicum Omelet' },
      { day: 'Tuesday',   breakfast: 'Oats Upma (40g dry) + Coconut Chutney',        lunch: 'Rajma + ¾ Cup Rice + Cucumber Raita',                   snack: 'Chaas (200ml) + Roasted Chana (30g)',               dinner: 'Paneer Bhurji + 1 Phulka' },
      { day: 'Wednesday', breakfast: '3-Egg Omelet + Green Chutney',                 lunch: 'Chicken Curry (150g) + ¾ Cup Rice + Salad',             snack: 'Green Tea + Pumpkin Seeds Mix (20g)',               dinner: 'Palakura Pappu + 1 Phulka' },
      { day: 'Thursday',  breakfast: 'Pesarattu (2 pcs) + Allam Chutney',            lunch: 'Kandi Pappu + ¾ Cup Rice + Vankaya Fry',                snack: 'Chaas (200ml) + 10 Almonds',                        dinner: 'Soyabean Curry + 1 Phulka' },
      { day: 'Friday',    breakfast: '2 Idli + Sambar + Chutney',                    lunch: 'Chicken Curry (150g) + ¾ Cup Rice + Bendakaya',         snack: 'Green Tea + Seed Mix (20g)',                        dinner: '3-Egg Omelet + Salad' },
      { day: 'Saturday',  breakfast: '3-Egg Bhurji + Nuvvulu Chutney',               lunch: 'Rajma + ¾ Cup Rice + Palakura Stir-fry',                snack: 'Chaas (200ml) + Walnuts (5 pcs)',                   dinner: 'Paneer Bhurji + 1 Phulka' },
      { day: 'Sunday',    breakfast: 'Upma (small) + Tomato Chutney',                lunch: 'Kandi Pappu + ¾ Cup Rice + Mixed Veggie Curry',         snack: 'Green Tea + Roasted Chana (30g)',                   dinner: '2-Egg Bhurji + 1 Phulka' }
    ]
  },
  {
    name: 'Month 3 — Strength',
    guidelines: [
      'Replace rice with phulka for dinner',
      '½ cup rice at lunch only',
      'Increase protein to 90g+/day',
      '4-day workout with progressive overload'
    ],
    weekdays: [
      { day: 'Monday',    breakfast: 'Pesarattu (2 pcs) + Allam Chutney',            lunch: 'Palakura Pappu + ½ Cup Rice + Bendakaya Fry',           snack: 'Green Tea + 10 Almonds + Seed Mix (20g)',           dinner: '3-Egg Capsicum Omelet' },
      { day: 'Tuesday',   breakfast: '3-Egg Bhurji + 1 Pesarattu',                   lunch: 'Rajma + ½ Cup Rice + Cucumber Raita',                   snack: 'Chaas (200ml) + Roasted Chana (25g)',               dinner: 'Paneer Bhurji + 1 Phulka' },
      { day: 'Wednesday', breakfast: '2-Egg Bhurji + Upma (small)',                  lunch: 'Chicken Curry (180g) + ½ Cup Rice + Salad',             snack: 'Green Tea + Pumpkin Seeds Mix (20g)',               dinner: 'Palakura Pappu + 1 Phulka' },
      { day: 'Thursday',  breakfast: 'Pesarattu (2 pcs) + Coconut Chutney',          lunch: 'Kandi Pappu + ½ Cup Rice + Vankaya Fry',                snack: 'Chaas (200ml) + 10 Almonds',                        dinner: 'Soyabean Curry + 1 Phulka' },
      { day: 'Friday',    breakfast: '3-Egg Omelet + Nuvvulu Chutney',               lunch: 'Chicken Curry (180g) + ½ Cup Rice + Bendakaya',         snack: 'Green Tea + Seed Mix (20g)',                        dinner: '3-Egg Omelet + Salad' },
      { day: 'Saturday',  breakfast: 'Oats (40g) + Boiled Egg (1)',                  lunch: 'Rajma + ½ Cup Rice + Palakura Stir-fry',                snack: 'Chaas (200ml) + Walnuts (5 pcs)',                   dinner: 'Paneer + 1 Phulka' },
      { day: 'Sunday',    breakfast: 'Idli (2 pcs) + Sambar + Chutney',              lunch: 'Kandi Pappu + ½ Cup Rice + Mixed Veggie Curry',         snack: 'Green Tea + Roasted Chana (25g)',                   dinner: '2-Egg Bhurji + 1 Phulka' }
    ]
  },
  {
    name: 'Month 4 — Strength+',
    guidelines: [
      'No rice at all — phulka only (2 per meal max)',
      'Protein target: 95g+/day',
      'Supersets in workout',
      'Reduce snack calories'
    ],
    weekdays: [
      { day: 'Monday',    breakfast: '3-Egg Bhurji + Pesarattu (1 pc)',              lunch: 'Palakura Pappu + 2 Phulka + Bendakaya Fry',             snack: 'Green Tea + 10 Almonds',                            dinner: '3-Egg Omelet + Salad' },
      { day: 'Tuesday',   breakfast: 'Oats (40g) + 2 Boiled Eggs',                  lunch: 'Rajma + 2 Phulka + Cucumber Raita',                     snack: 'Chaas (200ml) + Roasted Chana (20g)',               dinner: 'Paneer Bhurji + 1 Phulka' },
      { day: 'Wednesday', breakfast: '2 Idli + Sambar (light)',                      lunch: 'Chicken Curry (180g) + 2 Phulka + Salad',               snack: 'Green Tea + Pumpkin Seeds (15g)',                   dinner: 'Palakura Pappu + 1 Phulka' },
      { day: 'Thursday',  breakfast: 'Pesarattu (2 pcs) + Allam Chutney',            lunch: 'Kandi Pappu + 2 Phulka + Vankaya Fry',                  snack: 'Chaas (200ml) + Walnuts (3 pcs)',                   dinner: 'Soyabean Curry + 1 Phulka' },
      { day: 'Friday',    breakfast: '3-Egg Bhurji + Nuvvulu Chutney',               lunch: 'Chicken Curry (180g) + 2 Phulka + Bendakaya',           snack: 'Green Tea + Seed Mix (15g)',                        dinner: '3-Egg Capsicum Omelet' },
      { day: 'Saturday',  breakfast: 'Upma (small) + Boiled Egg (1)',                lunch: 'Rajma + 2 Phulka + Palakura Stir-fry',                  snack: 'Chaas (200ml) + 10 Almonds',                        dinner: 'Paneer + 1 Phulka' },
      { day: 'Sunday',    breakfast: '1 Banana + Boiled Egg (2)',                    lunch: 'Kandi Pappu + 2 Phulka + Mixed Veggie Curry',           snack: 'Green Tea + Roasted Chana (20g)',                   dinner: '2-Egg Bhurji + 1 Phulka' }
    ]
  },
  {
    name: 'Month 5 — Cut Phase',
    guidelines: [
      'No rice at all — zero',
      'Phulka 1 per meal only',
      'Add 10-min HIIT twice a week',
      'High protein, low carb'
    ],
    weekdays: [
      { day: 'Monday',    breakfast: '3-Egg Bhurji + Pesarattu (1 pc)',              lunch: 'Palakura Pappu + 1 Phulka + Bendakaya Fry',             snack: 'Green Tea + 15g Seed Mix',                          dinner: '3-Egg Omelet + Salad' },
      { day: 'Tuesday',   breakfast: 'Oats (30g) + 2 Boiled Eggs',                  lunch: 'Rajma + 1 Phulka + Cucumber Raita',                     snack: 'Chaas (200ml) + 10 Almonds',                        dinner: 'Paneer Bhurji (light)' },
      { day: 'Wednesday', breakfast: 'Pesarattu (1 pc) + Boiled Egg (1)',            lunch: 'Chicken Curry (200g) + 1 Phulka + Salad',               snack: 'Green Tea + Pumpkin Seeds (15g)',                   dinner: 'Palakura Pappu + 1 Phulka' },
      { day: 'Thursday',  breakfast: '3-Egg Bhurji + Nuvvulu Chutney',               lunch: 'Kandi Pappu + 1 Phulka + Vankaya Fry',                  snack: 'Chaas (200ml)',                                     dinner: 'Soyabean Curry (light)' },
      { day: 'Friday',    breakfast: '2-Egg Omelet + 1 Pesarattu',                   lunch: 'Chicken Curry (200g) + 1 Phulka + Bendakaya',           snack: 'Green Tea + 15g Seed Mix',                          dinner: '3-Egg Capsicum Omelet' },
      { day: 'Saturday',  breakfast: '1 Pesarattu + Boiled Egg (2)',                 lunch: 'Rajma + 1 Phulka + Palakura Stir-fry',                  snack: 'Chaas (200ml) + Walnuts (3 pcs)',                   dinner: 'Palakura Pappu (light)' },
      { day: 'Sunday',    breakfast: 'Boiled Eggs (2) + Green Tea',                  lunch: 'Kandi Pappu + 1 Phulka + Mixed Veggie Curry',           snack: 'Green Tea + 10 Almonds',                            dinner: '2-Egg Omelet + Salad' }
    ]
  },
  {
    name: 'Month 6 — Peak Cut',
    guidelines: [
      'Zero rice — phulka only',
      'Max 1 phulka per meal',
      'HIIT 3x/week',
      'Final push — stay committed!'
    ],
    weekdays: [
      { day: 'Monday',    breakfast: '3-Egg Bhurji + Allam Chutney',                 lunch: 'Palakura Pappu + 1 Phulka + Bendakaya Fry',             snack: 'Green Tea + 10g Seed Mix',                          dinner: '3-Egg Omelet + Salad' },
      { day: 'Tuesday',   breakfast: '2 Boiled Eggs + Pesarattu (1 pc)',             lunch: 'Rajma + 1 Phulka + Cucumber Raita',                     snack: 'Chaas (200ml)',                                     dinner: 'Paneer Bhurji (light)' },
      { day: 'Wednesday', breakfast: 'Pesarattu (1 pc) + Allam Chutney',             lunch: 'Chicken Curry (200g) + 1 Phulka + Salad',               snack: 'Green Tea + Pumpkin Seeds (10g)',                   dinner: 'Palakura Pappu + 1 Phulka' },
      { day: 'Thursday',  breakfast: '3-Egg Bhurji + Nuvvulu Chutney',               lunch: 'Kandi Pappu + 1 Phulka + Vankaya Fry',                  snack: 'Chaas (150ml)',                                     dinner: 'Soyabean Curry (light)' },
      { day: 'Friday',    breakfast: '2-Egg Omelet + Green Chutney',                 lunch: 'Chicken Curry (200g) + 1 Phulka + Bendakaya',           snack: 'Green Tea + 10g Seed Mix',                          dinner: '3-Egg Capsicum Omelet' },
      { day: 'Saturday',  breakfast: '2 Boiled Eggs + Green Tea',                    lunch: 'Rajma + 1 Phulka + Palakura Stir-fry',                  snack: 'Green Tea only',                                    dinner: 'Palakura Pappu (minimal)' },
      { day: 'Sunday',    breakfast: 'Boiled Eggs (2) + Green Tea',                  lunch: 'Kandi Pappu + 1 Phulka + Mixed Veggie Curry',           snack: 'Green Tea + 10 Almonds',                            dinner: '2-Egg Omelet + Salad' }
    ]
  }
];

// ─── Workout data (from public/js/workout.js WORKOUT_PLAN + WORKOUT_PHASES) ──

const WORKOUT_DAYS = [
  {
    day: 'Monday', name: 'Upper Push + Core', type: 'strength', duration: '45 min',
    exercises: [
      { name: 'Cat-Cow Stretch',          sets: '3', reps: '10',     note: 'Spinal mobility warm-up — mandatory start' },
      { name: 'Bird-Dog',                 sets: '3', reps: '10 ea',  note: 'Anti-rotation core stability — key for LBP' },
      { name: 'Dead Bug',                 sets: '3', reps: '10',     note: 'Core anti-extension — back stays flat on floor' },
      { name: 'Glute Bridge',             sets: '3', reps: '15',     note: 'Posterior chain activation before pressing' },
      { name: 'DB Floor Press',           sets: '3', reps: '12',     note: 'Floor limits ROM — spine-safe chest press' },
      { name: 'DB Seated Shoulder Press', sets: '3', reps: '10',     note: 'Seated preferred over standing — less spinal load' },
      { name: 'DB Lateral Raise',         sets: '3', reps: '15',     note: '4–6 kg. Controlled tempo 2:0:2' },
      { name: 'DB Tricep Extension',      sets: '3', reps: '12',     note: 'Overhead if no pain, else lying skull crusher' }
    ]
  },
  {
    day: 'Tuesday', name: 'Lower Body Glute Focus + Core', type: 'strength', duration: '40 min',
    exercises: [
      { name: 'Cat-Cow Stretch',          sets: '3', reps: '10',     note: 'Mandatory spinal warm-up' },
      { name: 'Bird-Dog',                 sets: '3', reps: '10 ea',  note: 'Slow and controlled, 3-sec hold at top' },
      { name: 'Glute Bridge with Barbell',sets: '4', reps: '15',     note: 'Bar on hips (padded). Hip thrust variation — spine-safe' },
      { name: 'DB Romanian Deadlift',     sets: '3', reps: '12',     note: 'HINGE not squat. Back straight, hips back. Light to start.' },
      { name: 'Bulgarian Split Squat',    sets: '3', reps: '10 ea',  note: 'Rear foot elevated. Upright torso. Very spine-friendly' },
      { name: 'DB Lateral Lunge',         sets: '3', reps: '10 ea',  note: 'Slow eccentric (3 sec down). Good for hip abductors' },
      { name: 'Calf Raise (Standing)',    sets: '3', reps: '20',     note: 'Bodyweight or hold dumbbells' }
    ]
  },
  {
    day: 'Wednesday', name: 'REST / Active Recovery', type: 'rest', duration: '20–30 min walk',
    exercises: [
      { name: 'Fasted Morning Walk', sets: '1', reps: '20–30 min', note: 'Low intensity. HR 100–120 BPM. Burns fat optimally' },
      { name: 'Cat-Cow Stretch',     sets: '2', reps: '10',        note: 'Morning mobility only' },
      { name: 'Pigeon Pose Stretch', sets: '2', reps: '30s ea',    note: 'Hip flexor relief after motorbike commute' }
    ]
  },
  {
    day: 'Thursday', name: 'Upper Pull + Core', type: 'strength', duration: '45 min',
    exercises: [
      { name: 'Cat-Cow Stretch',         sets: '3', reps: '10',    note: 'Mandatory spinal warm-up' },
      { name: 'Dead Bug',                sets: '3', reps: '10',    note: 'Core stability before pulling work' },
      { name: 'Glute Bridge',            sets: '3', reps: '15',    note: 'Activation set' },
      { name: 'DB Bent-Over Row',        sets: '3', reps: '12',    note: 'Neutral spine. One hand braced on bench for support' },
      { name: 'DB Bicep Curl',           sets: '3', reps: '12',    note: 'Supinated grip. Full ROM. No swinging.' },
      { name: 'DB Hammer Curl',          sets: '3', reps: '12',    note: 'Neutral grip. Hits brachialis and brachioradialis' },
      { name: 'DB Rear Delt Fly',        sets: '3', reps: '15',    note: 'Inclined at 45°. 3–4 kg. Fixes posture from desk work' },
      { name: 'DB Shrug',                sets: '3', reps: '15',    note: 'Slow eccentric 3 sec. Trapezius activation' }
    ]
  },
  {
    day: 'Friday', name: 'Full Body Compound + Core', type: 'strength', duration: '50 min',
    exercises: [
      { name: 'Cat-Cow Stretch',          sets: '3', reps: '10',    note: 'Mandatory' },
      { name: 'Bird-Dog',                 sets: '3', reps: '10 ea', note: 'Stability focus' },
      { name: 'Dead Bug',                 sets: '3', reps: '10',    note: 'Mandatory' },
      { name: 'Barbell Hip Thrust',       sets: '4', reps: '12',    note: 'Primary strength builder. Bar padded on hips.' },
      { name: 'DB Romanian Deadlift',     sets: '4', reps: '10',    note: 'Heaviest weights this week. Progressive overload.' },
      { name: 'DB Floor Press',           sets: '3', reps: '12',    note: 'Increase weight by 1–2kg vs Monday' },
      { name: 'DB Bent-Over Row',         sets: '3', reps: '12',    note: 'Heavy row — challenge yourself' },
      { name: 'DB Shoulder Press',        sets: '3', reps: '10',    note: 'Seated. Compound finisher.' }
    ]
  },
  {
    day: 'Saturday', name: 'Active Recovery (Walk)', type: 'cardio', duration: '30 min walk',
    exercises: [
      { name: 'Fasted Morning Walk', sets: '1', reps: '25–35 min', note: 'Brisk pace. Arm swing. HR 110–130 BPM.' },
      { name: 'Cat-Cow Stretch',     sets: '2', reps: '10',        note: 'Morning routine' },
      { name: 'Hip Flexor Stretch',  sets: '2', reps: '30s ea',    note: 'Counteracts sitting 9+ hrs at desk' }
    ]
  },
  {
    day: 'Sunday', name: 'Full REST + Mobility', type: 'rest', duration: 'Mobility only',
    exercises: [
      { name: 'Full Body Stretching', sets: '1', reps: '15 min',  note: 'Entire body stretch sequence. No loading.' },
      { name: 'Cat-Cow Stretch',      sets: '2', reps: '10',      note: 'Spine health maintenance' },
      { name: 'Child Pose',           sets: '2', reps: '60s',     note: 'Lower back decompression — esp. after weekly rides' },
      { name: 'Supine Twist',         sets: '2', reps: '30s ea',  note: 'Thoracic rotation. Lie on back, knees to one side.' }
    ]
  }
];

const WORKOUT_PHASES = [
  { month: 'Month 1', label: 'Phase 1 – Foundation',  focus: 'Light weights · Form mastery · 3 sets',          note: 'Focus on correct form. 2 min rest between sets. Walk 20 min daily.' },
  { month: 'Month 2', label: 'Phase 1 – Foundation+', focus: 'Add 1 set · Increase reps by 2',                 note: 'Increase reps by 2 each week. Add 5 min brisk walk.' },
  { month: 'Month 3', label: 'Phase 2 – Strength',    focus: 'Progressive overload · 4 sets',                  note: 'Add 1–2 kg weight each week. Protein target: 90g+/day.' },
  { month: 'Month 4', label: 'Phase 2 – Strength+',   focus: 'Compound lifts · Supersets',                     note: 'Pair upper/lower supersets. 90 sec rest max. Hit PRs.' },
  { month: 'Month 5', label: 'Phase 3 – Cut',         focus: 'High reps · Low rest · HIIT 2x/week',            note: '30–45 sec rest between sets. Add 10 min HIIT Mon+Thu.' },
  { month: 'Month 6', label: 'Phase 3 – Peak Cut',    focus: 'Max intensity · HIIT 3x/week',                   note: 'Target 100g+ protein. Stay in calorie deficit. Final push!' }
];

// ─── Cardio data (from public/js/cardio.js) ───────────────────────────────────

const CARDIO_SESSIONS = [
  { day: 'Monday',    session: 'Fasted Walk', duration: '20–25 min', intensity: 'Light (HR 95–115)',       note: 'Pre-workout or standalone' },
  { day: 'Tuesday',   session: 'REST',        duration: '—',          intensity: '—',                       note: 'Lower body day — skip cardio' },
  { day: 'Wednesday', session: 'Fasted Walk', duration: '25–30 min', intensity: 'Moderate (HR 110–125)',   note: 'Active recovery day' },
  { day: 'Thursday',  session: 'REST',        duration: '—',          intensity: '—',                       note: 'Upper pull day — skip cardio' },
  { day: 'Friday',    session: 'Fasted Walk', duration: '20 min',    intensity: 'Light (HR 95–110)',        note: 'Before full body session' },
  { day: 'Saturday',  session: 'Brisk Walk',  duration: '30–35 min', intensity: 'Moderate (HR 115–130)',   note: 'Dedicated cardio day' },
  { day: 'Sunday',    session: 'Easy Walk',   duration: '20–30 min', intensity: 'Very Light (HR 90–105)',  note: 'Recovery — enjoy outdoors' }
];

const CARDIO_HR_ZONES = {
  zone1: { label: 'Zone 1 – Recovery', range: '95–110 BPM',  purpose: 'Active recovery, fat utilization' },
  zone2: { label: 'Zone 2 – Fat Burn', range: '110–130 BPM', purpose: 'Primary fat-burning zone — TARGET' },
  zone3: { label: 'Zone 3 – Aerobic',  range: '130–150 BPM', purpose: 'Cardiovascular conditioning (future)' }
};

const CARDIO_PHASE_LABELS = [
  'Foundation Walking',
  'Foundation Walking',
  'Extended + Incline / Interval Walking',
  'Extended + Incline / LISS + Light Cycling',
  'LISS + Light Cycling / HIIT 2x',
  'HIIT 3x / Peak Fat Burn'
];

// ─── Grocery data (from public/js/grocery.js GROCERY_PLAN) ───────────────────
// Source has 4 entries: M1, M2, M3–4, M5–6 → expand to 6

const GROCERY_PLAN_RAW = [
  {
    month: 'Month 1', budget: 5200,
    categories: [
      { name: 'Proteins (Eggs, Paneer, Chicken)', items: ['Eggs — 30 pcs', 'Paneer (full-fat) — 400g', 'Chicken (skinless) — 600g', 'Soyabean (dry) — 200g'] },
      { name: 'Dal & Legumes', items: ['Kandi Pappu (Toor Dal) — 500g', 'Palakura Pappu (Chana Dal) — 500g', 'Senagapappu (Chickpeas) — 500g', 'Rajma — 250g'] },
      { name: 'Vegetables', items: ['Palakura (Spinach) — 500g', 'Bendakaya (Okra) — 500g', 'Vankaya (Brinjal) — 500g', 'Sorakaya (Bottle Gourd) — 1 kg', 'Tomato — 1 kg', 'Onion — 1 kg', 'Capsicum — 300g', 'Green Chillies — 100g', 'Curry Leaves — 2 bunches'] },
      { name: 'Grains & Flour', items: ['Rice (raw) — 1 kg', 'Wheat Atta — 1 kg', 'Rava (Semolina) — 500g', 'Oats (plain) — 500g'] },
      { name: 'Dairy & Fats', items: ['Ghee — 200g', 'Curd (plain) — 500g', 'Buttermilk (Majjiga) — 1 L'] },
      { name: 'Nuts, Seeds & Spices', items: ['Almonds — 100g', 'Walnuts — 100g', 'Pumpkin Seeds — 100g', 'Sesame (Nuvvulu) — 100g', 'Ginger (Allam) — 100g', 'Iodized Salt — 1 kg', 'Turmeric, Cumin, Coriander — assorted'] },
      { name: 'Beverages & Other', items: ['Green Tea — 50 bags', 'Coconut (for chutney) — 2 pcs', 'Gongura (Sorrel leaves) — 200g'] }
    ]
  },
  {
    month: 'Month 2', budget: 5100,
    categories: [
      { name: 'Proteins', items: ['Eggs — 30 pcs', 'Paneer — 300g', 'Chicken — 600g', 'Soyabean (dry) — 200g'] },
      { name: 'Dal & Legumes', items: ['Kandi Pappu — 500g', 'Palakura Pappu — 500g', 'Rajma — 250g', 'Roasted Chana — 300g'] },
      { name: 'Vegetables', items: ['Palakura — 500g', 'Bendakaya — 500g', 'Gutti Vankaya — 500g', 'Tomato — 1 kg', 'Onion — 1 kg', 'Cucumber — 500g'] },
      { name: 'Grains & Flour', items: ['Rice (raw) — 750g', 'Wheat Atta — 1 kg', 'Oats — 500g'] },
      { name: 'Dairy & Fats', items: ['Ghee — 200g', 'Curd — 500g', 'Buttermilk — 1 L'] },
      { name: 'Nuts, Seeds & Spices', items: ['Almonds — 100g', 'Walnuts — 100g', 'Pumpkin Seeds — 100g', 'Sesame — 100g', 'Iodized Salt, Spice Mix — assorted'] },
      { name: 'Beverages & Other', items: ['Green Tea — 50 bags', 'Coconut — 2 pcs', 'Gongura — 200g'] }
    ]
  },
  {
    month: 'Month 3', budget: 5000,
    categories: [
      { name: 'Proteins', items: ['Eggs — 35 pcs', 'Paneer — 300g', 'Chicken — 600g', 'Soyabean (dry) — 200g'] },
      { name: 'Dal & Legumes', items: ['Kandi Pappu — 500g', 'Palakura Pappu — 500g', 'Senagapappu — 500g', 'Roasted Chana — 200g'] },
      { name: 'Vegetables', items: ['Palakura — 500g', 'Bendakaya — 500g', 'Vankaya/Sorakaya — 1 kg', 'Tomato, Onion — 1.5 kg', 'Cucumber — 500g'] },
      { name: 'Grains (Atta only — no rice)', items: ['Wheat Atta — 1.5 kg', 'Oats — 500g'] },
      { name: 'Dairy & Fats', items: ['Ghee — 200g', 'Curd — 500g', 'Buttermilk — 1 L'] },
      { name: 'Nuts, Seeds & Spices', items: ['Almonds — 100g', 'Pumpkin Seeds — 100g', 'Sesame — 100g', 'Spices + Iodized Salt — assorted'] },
      { name: 'Beverages & Other', items: ['Green Tea — 50 bags', 'Coconut — 2 pcs', 'Gongura — 200g'] }
    ]
  },
  {
    month: 'Month 4', budget: 5000,
    categories: [
      { name: 'Proteins', items: ['Eggs — 35 pcs', 'Paneer — 300g', 'Chicken — 600g', 'Soyabean (dry) — 200g'] },
      { name: 'Dal & Legumes', items: ['Kandi Pappu — 500g', 'Palakura Pappu — 500g', 'Senagapappu — 500g', 'Roasted Chana — 200g'] },
      { name: 'Vegetables', items: ['Palakura — 500g', 'Bendakaya — 500g', 'Vankaya/Sorakaya — 1 kg', 'Tomato, Onion — 1.5 kg', 'Cucumber — 500g'] },
      { name: 'Grains (Atta only — no rice)', items: ['Wheat Atta — 1.5 kg', 'Oats — 500g'] },
      { name: 'Dairy & Fats', items: ['Ghee — 200g', 'Curd — 500g', 'Buttermilk — 1 L'] },
      { name: 'Nuts, Seeds & Spices', items: ['Almonds — 100g', 'Pumpkin Seeds — 100g', 'Sesame — 100g', 'Spices + Iodized Salt — assorted'] },
      { name: 'Beverages & Other', items: ['Green Tea — 50 bags', 'Coconut — 2 pcs', 'Gongura — 200g'] }
    ]
  },
  {
    month: 'Month 5', budget: 4900,
    categories: [
      { name: 'Proteins', items: ['Eggs — 40 pcs', 'Paneer — 250g', 'Chicken — 600g', 'Soyabean — 100g'] },
      { name: 'Dal & Legumes', items: ['Kandi Pappu — 500g', 'Palakura Pappu — 500g', 'Senagapappu — 250g'] },
      { name: 'Vegetables', items: ['Palakura (Spinach) — 500g', 'Mixed Vegetables — 1.5 kg', 'Tomato, Onion — 1 kg', 'Cucumber — 500g'] },
      { name: 'Grains (Minimal)', items: ['Wheat Atta — 1 kg', 'Oats — 250g'] },
      { name: 'Dairy & Fats', items: ['Ghee — 150g', 'Curd — 500g', 'Buttermilk — 1 L'] },
      { name: 'Nuts & Seeds', items: ['Almonds — 100g', 'Pumpkin Seeds — 100g', 'Spices + Iodized Salt — assorted'] },
      { name: 'Beverages & Other', items: ['Green Tea — 50 bags', 'Coconut — 1 pc', 'Gongura — 100g'] }
    ]
  },
  {
    month: 'Month 6', budget: 4900,
    categories: [
      { name: 'Proteins', items: ['Eggs — 40 pcs', 'Paneer — 250g', 'Chicken — 600g', 'Soyabean — 100g'] },
      { name: 'Dal & Legumes', items: ['Kandi Pappu — 500g', 'Palakura Pappu — 500g', 'Senagapappu — 250g'] },
      { name: 'Vegetables', items: ['Palakura (Spinach) — 500g', 'Mixed Vegetables — 1.5 kg', 'Tomato, Onion — 1 kg', 'Cucumber — 500g'] },
      { name: 'Grains (Minimal)', items: ['Wheat Atta — 1 kg', 'Oats — 250g'] },
      { name: 'Dairy & Fats', items: ['Ghee — 150g', 'Curd — 500g', 'Buttermilk — 1 L'] },
      { name: 'Nuts & Seeds', items: ['Almonds — 100g', 'Pumpkin Seeds — 100g', 'Spices + Iodized Salt — assorted'] },
      { name: 'Beverages & Other', items: ['Green Tea — 50 bags', 'Coconut — 1 pc', 'Gongura — 100g'] }
    ]
  }
];

// ─── Plan meta (phases) ───────────────────────────────────────────────────────

const WEIGHT_LOSS_PHASES = [
  { label: 'Foundation',   months: [1, 2], description: 'Build habits, reduce inflammation' },
  { label: 'Acceleration', months: [3, 4], description: 'Intensify training, track closely' },
  { label: 'Peak',         months: [5, 6], description: 'Push toward goal weight' }
];

// ─── Exported functions ───────────────────────────────────────────────────────

function getDietPlan(profile) {
  return MONTHLY_DIET.map(month => ({
    monthLabel: month.name,
    weekdays: month.weekdays,
    guidelines: month.guidelines
  }));
}

function getWorkoutPlan(profile) {
  const hasLBP = Array.isArray(profile.healthConditions) &&
    profile.healthConditions.includes('lower-back-pain');

  return WORKOUT_PHASES.map((phase, i) => {
    const schedule = WORKOUT_DAYS.map(dayData => {
      let exercises = [...dayData.exercises];
      // Month 1: filter deadlifts for LBP patients
      if (hasLBP && i === 0) {
        exercises = exercises.filter(e => !e.name.toLowerCase().includes('deadlift'));
      }
      return {
        day: dayData.day,
        focus: dayData.name,
        type: dayData.type,
        duration: dayData.duration,
        exercises
      };
    });
    return {
      monthLabel: phase.month,
      phaseLabel: phase.label,
      focus: phase.focus,
      note: phase.note,
      schedule
    };
  });
}

function getCardioPlan(profile) {
  return CARDIO_PHASE_LABELS.map((label, i) => ({
    monthLabel: `Month ${i + 1}`,
    phaseLabel: label,
    sessions: [...CARDIO_SESSIONS],
    hrZones: { ...CARDIO_HR_ZONES }
  }));
}

function getGroceryList(profile) {
  return GROCERY_PLAN_RAW.map(g => ({
    monthLabel: g.month,
    budget: g.budget,
    categories: g.categories.map(cat => ({ ...cat, items: [...cat.items] }))
  }));
}

function getDefaultChecklist(profile) {
  const items = [
    { category: 'nutrition',  text: '🍽️ Follow today\'s meal plan — hit protein target' },
    { category: 'hydration',  text: `💧 Drink ${(profile.waterGoalL || 2.5)}L water throughout the day` },
    { category: 'workout',    text: '💪 Complete today\'s workout session' },
    { category: 'cardio',     text: '🚶 Evening walk — 20–30 min fasted or post-dinner' },
    { category: 'routine',    text: '🌙 Sleep by 10:30 PM — 7–8 hrs minimum' }
  ];

  (profile.medications || []).forEach(med => {
    items.unshift({
      category: 'medication',
      text: `💊 Take ${med.name}${med.dosage ? ` ${med.dosage}` : ''} — ${med.timing || 'as directed'}`
    });
  });

  return items;
}

function getPlanMeta(profile) {
  const startDate = profile.startDate ? new Date(profile.startDate) : new Date();
  const monthsElapsed = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24 * 30));
  const currentMonth = Math.min(6, Math.max(1, monthsElapsed + 1));
  const phase = WEIGHT_LOSS_PHASES.find(p => p.months.includes(currentMonth)) || WEIGHT_LOSS_PHASES[0];
  return {
    templateName: 'weight-loss',
    totalMonths: 6,
    currentMonth,
    currentPhase: WEIGHT_LOSS_PHASES.indexOf(phase) + 1,
    currentPhaseLabel: phase.label,
    phases: WEIGHT_LOSS_PHASES
  };
}

module.exports = {
  getDietPlan,
  getWorkoutPlan,
  getCardioPlan,
  getGroceryList,
  getDefaultChecklist,
  getPlanMeta
};
