// Workout data and rendering

let currentWorkoutMonth = getUserMonthIndex();
let currentWorkoutDay = "Monday";

const WORKOUT_PLAN = {
  Monday: {
    name:"Upper Push + Core", type:"strength", icon:"💪", duration:"45 min",
    exercises:[
      { cat:"core",  name:"Cat-Cow Stretch",         sets:"3", reps:"10",    note:"Spinal mobility warm-up — mandatory start" },
      { cat:"core",  name:"Bird-Dog",                 sets:"3", reps:"10 ea", note:"Anti-rotation core stability — key for LBP" },
      { cat:"core",  name:"Dead Bug",                 sets:"3", reps:"10",    note:"Core anti-extension — back stays flat on floor" },
      { cat:"glute", name:"Glute Bridge",             sets:"3", reps:"15",    note:"Posterior chain activation before pressing" },
      { cat:"push",  name:"DB Floor Press",           sets:"3", reps:"12",    note:"Floor limits ROM — spine-safe chest press" },
      { cat:"push",  name:"DB Seated Shoulder Press", sets:"3", reps:"10",    note:"Seated preferred over standing — less spinal load" },
      { cat:"push",  name:"DB Lateral Raise",         sets:"3", reps:"15",    note:"4–6 kg. Controlled tempo 2:0:2" },
      { cat:"push",  name:"DB Tricep Extension",      sets:"3", reps:"12",    note:"Overhead if no pain, else lying skull crusher" }
    ]
  },
  Tuesday: {
    name:"Lower Body Glute Focus + Core", type:"strength", icon:"🍑", duration:"40 min",
    exercises:[
      { cat:"core",     name:"Cat-Cow Stretch",          sets:"3", reps:"10",    note:"Mandatory spinal warm-up" },
      { cat:"core",     name:"Bird-Dog",                  sets:"3", reps:"10 ea", note:"Slow and controlled, 3-sec hold at top" },
      { cat:"glute",    name:"Glute Bridge with Barbell", sets:"4", reps:"15",    note:"Bar on hips (padded). Hip thrust variation — spine-safe" },
      { cat:"glute",    name:"DB Romanian Deadlift",      sets:"3", reps:"12",    note:"HINGE not squat. Back straight, hips back. Light to start." },
      { cat:"compound", name:"Bulgarian Split Squat",     sets:"3", reps:"10 ea", note:"Rear foot elevated. Upright torso. Very spine-friendly" },
      { cat:"glute",    name:"DB Lateral Lunge",          sets:"3", reps:"10 ea", note:"Slow eccentric (3 sec down). Good for hip abductors" },
      { cat:"core",     name:"Calf Raise (Standing)",     sets:"3", reps:"20",    note:"Bodyweight or hold dumbbells" }
    ]
  },
  Wednesday: {
    name:"REST / Active Recovery", type:"rest", icon:"🧘", duration:"20–30 min walk",
    exercises:[
      { cat:"cardio", name:"Fasted Morning Walk", sets:"1", reps:"20–30 min", note:"Low intensity. HR 100–120 BPM. Burns fat optimally" },
      { cat:"core",   name:"Cat-Cow Stretch",     sets:"2", reps:"10",        note:"Morning mobility only" },
      { cat:"core",   name:"Pigeon Pose Stretch", sets:"2", reps:"30s ea",    note:"Hip flexor relief after motorbike commute" }
    ]
  },
  Thursday: {
    name:"Upper Pull + Core", type:"strength", icon:"🦵", duration:"45 min",
    exercises:[
      { cat:"core",  name:"Cat-Cow Stretch",         sets:"3", reps:"10",    note:"Mandatory spinal warm-up" },
      { cat:"core",  name:"Dead Bug",                 sets:"3", reps:"10",    note:"Core stability before pulling work" },
      { cat:"glute", name:"Glute Bridge",             sets:"3", reps:"15",    note:"Activation set" },
      { cat:"pull",  name:"DB Bent-Over Row",         sets:"3", reps:"12",    note:"Neutral spine. One hand braced on bench for support" },
      { cat:"pull",  name:"DB Bicep Curl",            sets:"3", reps:"12",    note:"Supinated grip. Full ROM. No swinging." },
      { cat:"pull",  name:"DB Hammer Curl",           sets:"3", reps:"12",    note:"Neutral grip. Hits brachialis and brachioradialis" },
      { cat:"pull",  name:"DB Rear Delt Fly",         sets:"3", reps:"15",    note:"Inclined at 45°. 3–4 kg. Fixes posture from desk work" },
      { cat:"pull",  name:"DB Shrug",                 sets:"3", reps:"15",    note:"Slow eccentric 3 sec. Trapezius activation" }
    ]
  },
  Friday: {
    name:"Full Body Compound + Core", type:"strength", icon:"🔥", duration:"50 min",
    exercises:[
      { cat:"core",     name:"Cat-Cow Stretch",          sets:"3", reps:"10",    note:"Mandatory" },
      { cat:"core",     name:"Bird-Dog",                  sets:"3", reps:"10 ea", note:"Stability focus" },
      { cat:"core",     name:"Dead Bug",                  sets:"3", reps:"10",    note:"Mandatory" },
      { cat:"glute",    name:"Barbell Hip Thrust",        sets:"4", reps:"12",    note:"Primary strength builder. Bar padded on hips." },
      { cat:"compound", name:"DB Romanian Deadlift",      sets:"4", reps:"10",    note:"Heaviest weights this week. Progressive overload." },
      { cat:"push",     name:"DB Floor Press",            sets:"3", reps:"12",    note:"Increase weight by 1–2kg vs Monday" },
      { cat:"pull",     name:"DB Bent-Over Row",          sets:"3", reps:"12",    note:"Heavy row — challenge yourself" },
      { cat:"push",     name:"DB Shoulder Press",         sets:"3", reps:"10",    note:"Seated. Compound finisher." }
    ]
  },
  Saturday: {
    name:"Active Recovery (Walk)", type:"cardio", icon:"🚶", duration:"30 min walk",
    exercises:[
      { cat:"cardio", name:"Fasted Morning Walk",    sets:"1", reps:"25–35 min", note:"Brisk pace. Arm swing. HR 110–130 BPM." },
      { cat:"core",   name:"Cat-Cow Stretch",        sets:"2", reps:"10",        note:"Morning routine" },
      { cat:"core",   name:"Hip Flexor Stretch",     sets:"2", reps:"30s ea",    note:"Counteracts sitting 9+ hrs at desk" }
    ]
  },
  Sunday: {
    name:"Full REST + Mobility", type:"rest", icon:"🛌", duration:"Mobility only",
    exercises:[
      { cat:"core",   name:"Full Body Stretching",    sets:"1", reps:"15 min",  note:"Entire body stretch sequence. No loading." },
      { cat:"core",   name:"Cat-Cow Stretch",         sets:"2", reps:"10",      note:"Spine health maintenance" },
      { cat:"core",   name:"Child Pose",              sets:"2", reps:"60s",     note:"Lower back decompression — esp. after weekly rides" },
      { cat:"core",   name:"Supine Twist",            sets:"2", reps:"30s ea",  note:"Thoracic rotation. Lie on back, knees to one side." }
    ]
  }
};

const PHASE_TASKS = [
  // ── Phase 1: Month 1–2 | Foundation | ~1200 kcal | Walk 20 min ──
  [
    { time:"06:30 AM", text:"💊 Thyronorm 12.5mg — Empty stomach. Set timer for 45 min before eating.", category:"medication" },
    { time:"07:00 AM", text:"🚿 Cold-warm shower + 10-min morning mobility (Cat-Cow, hip circles, neck rolls).", category:"routine" },
    { time:"07:30 AM", text:"🍵 Metabolic Primer: 1 glass warm water + 1 tsp ACV. Kickstarts digestion.", category:"nutrition" },
    { time:"08:15 AM", text:"💪 Foundation Workout (3 sets) — FORM first, weight second. 2-min rest between sets.", category:"workout" },
    { time:"09:30 AM", text:"🌅 Breakfast: High-protein start (~300 kcal). See Today's Meals above for exact dish.", category:"nutrition" },
    { time:"11:00 AM", text:"💧 Mid-morning: 500ml water. Drink before you feel thirsty — thyroid loves hydration.", category:"hydration" },
    { time:"01:30 PM", text:"☀️ Lunch: Dal + Rice or Phulka as per today's plan. Eat slowly, stop at 80% full.", category:"nutrition" },
    { time:"04:00 PM", text:"💧 Afternoon: 500ml water. Desk job — stand up, roll shoulders, take a 2-min walk.", category:"hydration" },
    { time:"04:30 PM", text:"🍎 Snack: Green Tea + Seed Mix (30g) or Chaas. Don't skip — keeps metabolism active.", category:"nutrition" },
    { time:"06:00 PM", text:"🚶 Evening Walk: 20 min brisk. No phone — deep breathing, light pace. Builds the base.", category:"cardio" },
    { time:"07:30 PM", text:"🌙 Dinner: Light meal (~300 kcal). Finish eating by 8:00 PM sharp.", category:"nutrition" },
    { time:"08:30 PM", text:"🌙 Wind-down: Chamomile tea. Dim lights. No screens 30 min before bed. Sleep by 10:30 PM.", category:"routine" }
  ],
  // ── Phase 2: Month 3–4 | Strength | ~1100 kcal | Walk 25–30 min | Protein 90g+ ──
  [
    { time:"06:30 AM", text:"💊 Thyronorm 12.5mg — Empty stomach. 45-min wait. Consistency is thyroid health.", category:"medication" },
    { time:"07:00 AM", text:"🚿 Shower + 15-min mobility — add hip flexor holds & spinal rotation. Prep body for load.", category:"routine" },
    { time:"07:30 AM", text:"🍵 Metabolic Primer: Warm water + 1 tsp ACV + pinch of cinnamon. Pre-workout fuel.", category:"nutrition" },
    { time:"08:00 AM", text:"💪 Strength Session (4 sets) — Progressive overload. Add 1–2 kg vs last week. 90-sec rest.", category:"workout" },
    { time:"09:30 AM", text:"🌅 Post-Workout Breakfast: Prioritize 25g+ protein. Check Today's Meals. Recovery window!", category:"nutrition" },
    { time:"11:00 AM", text:"💧 Mid-morning: 500ml water. Are you hitting 90g+ protein today? Track it mentally.", category:"hydration" },
    { time:"01:00 PM", text:"☀️ Lunch: Protein-forward — Dal + Egg or Paneer + Phulka. Avoid second helping of rice.", category:"nutrition" },
    { time:"04:00 PM", text:"💧 Afternoon: 500ml water. 5-min desk stretch — shoulder rolls, neck turns, wrist circles.", category:"hydration" },
    { time:"04:30 PM", text:"🍎 Snack: Chaas 200ml + Seed Mix 20g. High protein, low calorie — best afternoon combo.", category:"nutrition" },
    { time:"06:00 PM", text:"🚶 Evening Walk: 25–30 min brisk at 100+ steps/min. Meaningful weekly calorie burn.", category:"cardio" },
    { time:"07:30 PM", text:"🌙 Dinner: Light — dal + 1 Phulka or Egg Curry only. No carbs after 7:30 PM.", category:"nutrition" },
    { time:"08:30 PM", text:"🌙 Sleep by 10:30 PM. Muscle is built DURING sleep — 7–8 hrs is non-negotiable.", category:"routine" }
  ],
  // ── Phase 3: Month 5–6 | Cut Phase | ~1050 kcal | Fasted Walk 30–45 min | HIIT ──
  [
    { time:"06:00 AM", text:"💊 Thyronorm 12.5mg — Earlier wake-up for cut phase. Empty stomach. 45-min wait.", category:"medication" },
    { time:"06:30 AM", text:"🔥 FASTED WALK: 30–45 min before any food. Peak fat-burning window. Water only.", category:"cardio" },
    { time:"07:30 AM", text:"🍵 Break fast: Warm water + 1 tsp ACV + squeeze of lemon. Rehydrate after walk.", category:"nutrition" },
    { time:"08:30 AM", text:"💪 High-Intensity Session — High reps (15–20), 30–45 sec rest. HIIT on Mon & Thu.", category:"workout" },
    { time:"09:45 AM", text:"🌅 Post-Workout Breakfast: 30g+ protein focus (~300 kcal max). Check Today's Meals.", category:"nutrition" },
    { time:"11:30 AM", text:"💧 Mid-morning: 500ml water. TRACK every calorie this phase — deficit is everything.", category:"hydration" },
    { time:"01:00 PM", text:"☀️ Lunch: Controlled portion (~400 kcal). Less rice, more protein and vegetables.", category:"nutrition" },
    { time:"04:00 PM", text:"💧 Afternoon: 500ml water. You're in the final phase — visualize 75 kg. Stay focused!", category:"hydration" },
    { time:"04:30 PM", text:"🍎 Snack: ONLY Green Tea + 15g Seed Mix. Strict calorie budget — every gram counts.", category:"nutrition" },
    { time:"07:00 PM", text:"🌙 Early Dinner: Very light (~300 kcal). Done by 7:30 PM. Extended overnight fast = fat burn.", category:"nutrition" },
    { time:"08:00 PM", text:"🌙 Early wind-down: Chamomile tea. 10 PM sleep + 6 AM wake = optimal cut protocol.", category:"routine" }
  ]
];

const WORKOUT_PHASES = [
  { month:"Month 1", phase:"Phase 1 – Foundation", focus:"Light weights · Form mastery · 3 sets", note:"Focus on correct form. 2 min rest between sets. Walk 20 min daily." },
  { month:"Month 2", phase:"Phase 1 – Foundation+", focus:"Add 1 set · Increase reps by 2", note:"Increase reps by 2 each week. Add 5 min brisk walk." },
  { month:"Month 3", phase:"Phase 2 – Strength", focus:"Progressive overload · 4 sets", note:"Add 1–2 kg weight each week. Protein target: 90g+/day." },
  { month:"Month 4", phase:"Phase 2 – Strength+", focus:"Compound lifts · Supersets", note:"Pair upper/lower supersets. 90 sec rest max. Hit PRs." },
  { month:"Month 5", phase:"Phase 3 – Cut", focus:"High reps · Low rest · HIIT 2x/week", note:"30–45 sec rest between sets. Add 10 min HIIT Mon+Thu." },
  { month:"Month 6", phase:"Phase 3 – Peak Cut", focus:"Max intensity · HIIT 3x/week", note:"Target 100g+ protein. Stay in calorie deficit. Final push!" }
];


function buildWorkout() {
  const curM = getUserMonthIndex();
  const mSel = document.getElementById("workoutMonthSelector");
  mSel.innerHTML = WORKOUT_PHASES.map((p,i) =>
    `<button class="month-btn${currentWorkoutMonth===i?" active":""}${i===curM?" current-month":""}" onclick="selectWorkoutMonth(${i})">${p.month}${i===curM?" ←":""}</button>`
  ).join("");
  renderWorkoutMonthBanner();
  renderWorkoutDayGrid();
}
function selectWorkoutMonth(m) {
  currentWorkoutMonth = m;
  document.querySelectorAll("#workoutMonthSelector .month-btn").forEach((b,i) => b.classList.toggle("active", i===m));
  renderWorkoutMonthBanner();
  renderWorkoutDayGrid();
}
function renderWorkoutMonthBanner() {
  const p = WORKOUT_PHASES[currentWorkoutMonth];
  document.getElementById("workoutPhaseBanner").innerHTML = `<div class="phase-banner"><div><h4>💪 ${p.phase}</h4><p>${p.focus}</p></div><div><span class="phase-pill">💡 ${p.note}</span></div></div>`;
}
function renderWorkoutDayGrid() {
  const days = Object.keys(WORKOUT_PLAN);
  const grid = document.getElementById("workoutDayGrid");
  grid.innerHTML = "";
  const today = new Date().toLocaleDateString("en-US",{weekday:"long"});
  days.forEach(day => {
    const w = WORKOUT_PLAN[day];
    const isRest = w.type==="rest"||w.type==="cardio";
    const div = document.createElement("div");
    div.className = `wday${isRest?" rest":""}${day===today?" active":""}`;
    div.id = "wd-"+day;
    div.innerHTML = `<div class="wd-name">${day.substring(0,3)}</div><div class="wd-icon">${w.icon}</div><div class="wd-type" style="font-size:.62rem">${w.name.split(" ")[0]}</div>`;
    div.onclick = () => selectWorkoutDay(day);
    grid.appendChild(div);
  });
  selectWorkoutDay(today in WORKOUT_PLAN ? today : "Monday");
}


function selectWorkoutDay(day) {
  currentWorkoutDay = day;
  document.querySelectorAll(".wday").forEach(d => d.classList.remove("active"));
  const el = document.getElementById("wd-"+day);
  if(el) el.classList.add("active");
  renderWorkoutDay(day);
}

function renderWorkoutDay(day) {
  const w = WORKOUT_PLAN[day];
  let wHtml = '<div class="card"><div class="card-title">' + w.icon + ' ' + day + ': ' + w.name +
    '<span style="margin-left:auto;font-size:.72rem;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;padding:3px 8px;border-radius:8px;font-weight:600">⏱️ ' + w.duration + '</span>' +
    '<span class="spine-badge" style="margin-left:8px">🦴 Spine-Safe</span></div><div class="exercise-list">';
  w.exercises.forEach(ex => {
    wHtml += '<div class="exercise-item ' + ex.cat + '"><span class="exercise-cat">' + ex.cat + '</span><div>' +
      '<div class="exercise-name">' + ex.name + '</div>' +
      '<div class="exercise-detail">📊 ' + ex.sets + ' sets × ' + ex.reps + '</div>' +
      '<div class="exercise-note">' + ex.note + '</div></div></div>';
  });
  wHtml += '</div></div>';
  document.getElementById("workoutDayContent").innerHTML = wHtml;
}
