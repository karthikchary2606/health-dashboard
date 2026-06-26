// Hardcoded phase/checklist data — shared with dashboard rendering
// (workout.js was the original home; moved here as dashboard.js is the sole consumer)
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
  { month:"Month 1", phase:"Phase 1 – Foundation",  focus:"Light weights · Form mastery · 3 sets",          note:"Focus on correct form. 2 min rest between sets. Walk 20 min daily." },
  { month:"Month 2", phase:"Phase 1 – Foundation+", focus:"Add 1 set · Increase reps by 2",                 note:"Increase reps by 2 each week. Add 5 min brisk walk." },
  { month:"Month 3", phase:"Phase 2 – Strength",    focus:"Progressive overload · 4 sets",                  note:"Add 1–2 kg weight each week. Protein target: 90g+/day." },
  { month:"Month 4", phase:"Phase 2 – Strength+",   focus:"Compound lifts · Supersets",                     note:"Pair upper/lower supersets. 90 sec rest max. Hit PRs." },
  { month:"Month 5", phase:"Phase 3 – Cut",          focus:"High reps · Low rest · HIIT 2x/week",            note:"30–45 sec rest between sets. Add 10 min HIIT Mon+Thu." },
  { month:"Month 6", phase:"Phase 3 – Peak Cut",     focus:"Max intensity · HIIT 3x/week",                   note:"Target 100g+ protein. Stay in calorie deficit. Final push!" }
];

// Dashboard state
let currentMoodScore = 3;
let currentEnergyScore = 3;
let waterLevel = 0;
let weightChartInstance = null;

function buildTimeline() {
  const phaseIdx = getUserPhaseIndex();
  const curMonthIdx = getUserMonthIndex();
  const phaseTasks = PHASE_TASKS[phaseIdx];
  const container = document.getElementById("timelineContainer");
  container.innerHTML = "";

  // ── Phase banner ──
  const phaseNames = ["Foundation","Strength","Cut Phase"];
  const phaseBg = ["#f0fdf4","#eff6ff","#fffbeb"];
  const phaseBorder = ["#bbf7d0","#bfdbfe","#fde68a"];
  const banner = document.createElement("div");
  banner.style.cssText = "background:" + phaseBg[phaseIdx] + ";border:1px solid " + phaseBorder[phaseIdx] + ";border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:8px";
  banner.innerHTML = "<div><div style='font-weight:700;font-size:.85rem;color:var(--primary)'>📅 Month " + (curMonthIdx+1) + " of 6 — " + phaseNames[phaseIdx] + " Phase</div><div style='font-size:.72rem;color:var(--text-light);margin-top:2px'>" + WORKOUT_PHASES[curMonthIdx].focus + "</div></div><span style='font-size:.7rem;background:var(--primary);color:#fff;padding:3px 8px;border-radius:12px;white-space:nowrap'>" + WORKOUT_PHASES[curMonthIdx].phase + "</span>";
  container.appendChild(banner);

  // ── Today's meals preview ──
  const todayName = new Date().toLocaleDateString("en-US",{weekday:"long"});
  const md = MONTHLY_DIET[curMonthIdx];
  const todayMeals = md && md.days && md.days[todayName];
  if (todayMeals) {
    const mealsDiv = document.createElement("div");
    mealsDiv.style.cssText = "background:#fafafa;border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:12px";
    const mealKeys = ["breakfast","lunch","snack","dinner"];
    let totalCal = 0;
    let rows = "";
    mealKeys.forEach(function(k) {
      const m = todayMeals.meals[k];
      if (!m) return;
      totalCal += (m.cal || 0);
      rows += "<div style='display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);font-size:.75rem'>" +
        "<span>" + m.icon + " <strong>" + k.charAt(0).toUpperCase() + k.slice(1) + "</strong></span>" +
        "<span style='color:var(--text-med);flex:1;text-align:center;padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'>" + m.name + "</span>" +
        "<span style='color:var(--accent-dark);font-weight:600;white-space:nowrap'>" + m.cal + " kcal</span></div>";
    });
    mealsDiv.innerHTML = "<div style='font-weight:700;font-size:.78rem;color:var(--primary);margin-bottom:8px'>🍽️ Today's Meals — " + todayName + "</div>" + rows +
      "<div style='font-size:.72rem;font-weight:700;color:var(--primary);margin-top:6px;text-align:right'>Total: ~" + totalCal + " kcal</div>";
    container.appendChild(mealsDiv);
  }

  // ── Phase tasks ──
  phaseTasks.forEach(function(task, i) {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.id = "titem-" + i;
    div.innerHTML = "<span class='t-time'>" + task.time + "</span><span class='t-text'>" + task.text + "</span><input type='checkbox' id='chk-" + i + "' onchange='onCheckChange(" + i + ")'>";
    container.appendChild(div);
  });
  updateCheckStat();
}

function onCheckChange(i) {
  const chk = document.getElementById("chk-" + i);
  document.getElementById("titem-" + i).classList.toggle("done", chk.checked);
  updateCheckStat();
  syncData();
}

function updateCheckStat() {
  const total = PHASE_TASKS[getUserPhaseIndex()].length;
  let done = 0;
  for(let i=0;i<total;i++) {
    const c = document.getElementById("chk-"+i);
    if(c && c.checked) done++;
  }
  document.getElementById("checkStat").textContent = done + "/" + total;
}

function toggleWater(l) {
  waterLevel = (waterLevel === l) ? l - 1 : l;
  for(let i=1;i<=4;i++) {
    document.getElementById("w"+i).classList.toggle("filled", i <= waterLevel);
  }
  document.getElementById("waterStat").textContent = waterLevel + "/4L";
  syncData();
}

function setScore(type, val, btn) {
  if(type === "mood") {
    currentMoodScore = val;
    document.querySelectorAll("#moodRow .score-btn").forEach(b => b.classList.remove("sel"));
  } else {
    currentEnergyScore = val;
    document.querySelectorAll("#energyRow .score-btn").forEach(b => b.classList.remove("sel"));
  }
  btn.classList.add("sel");
  syncData();
}

async function loadDateData() {
  const date = document.getElementById("logDate").value;
  try {
    const { ok, data } = await apiFetch("/api/logs/" + date);
    if (!ok) return;
    // Sync checklist
    const phLen = PHASE_TASKS[getUserPhaseIndex()].length; for(let i=0;i<phLen;i++) {
      const chk = document.getElementById("chk-"+i);
      if(chk) {
      chk.checked = (data.checklist && data.checklist[i] && data.checklist[i].done) || false;
        document.getElementById("titem-"+i).classList.toggle("done", chk.checked);
      }
    }
    // Weight
    if(data.weight > 0) {
      document.getElementById("currentWeight").value = data.weight;
      document.getElementById("weightStat").textContent = data.weight;
      updateBMI(data.weight);
    }
    // Water
    waterLevel = data.waterIntake || 0;
    for(let i=1;i<=4;i++) document.getElementById("w"+i).classList.toggle("filled", i <= waterLevel);
    document.getElementById("waterStat").textContent = waterLevel + "/4L";
    // Workout
    document.getElementById("workoutToggle").checked = data.completedWorkout || false;
    document.getElementById("workoutNotes").value = data.workoutNotes || data.notes || "";
    // Mood & Energy
    currentMoodScore = data.moodScore || 3;
    currentEnergyScore = data.energyScore || 3;
    document.querySelectorAll("#moodRow .score-btn").forEach((b,i) => b.classList.toggle("sel", i+1===currentMoodScore));
    document.querySelectorAll("#energyRow .score-btn").forEach((b,i) => b.classList.toggle("sel", i+1===currentEnergyScore));
    updateCheckStat();
  } catch(e) {
    console.warn("loadDateData: API offline");
  }
}

async function syncData() {
  const date = document.getElementById("logDate").value;
  const weight = parseFloat(document.getElementById("currentWeight").value) || 95;
  const notes = document.getElementById("workoutNotes").value;
  document.getElementById("weightStat").textContent = weight;
  updateBMI(weight);
  const pTasks = PHASE_TASKS[getUserPhaseIndex()]; const checklist = pTasks.map((_, i) => { const c = document.getElementById("chk-"+i); return { done: c ? c.checked : false }; });
  const payload = { date, checklist, waterIntake: waterLevel, weight, completedWorkout: document.getElementById("workoutToggle").checked, moodScore: currentMoodScore, energyScore: currentEnergyScore, notes };
  try {
    const { ok } = await apiFetch("/api/logs", { method:"POST", body: payload });
    if (!ok) return;
  } catch(e) { console.warn("syncData: API offline"); }
}

function updateCalorieStat() {
  const curM = getUserMonthIndex();
  const md = MONTHLY_DIET[curM];
  const calEl = document.getElementById("calorieStat");
  const subEl = document.getElementById("calorieStatSub");
  if (calEl && md) {
    const cal = (md.calories || "").replace("~","").replace(" kcal/day","").replace("/day","").trim();
    calEl.textContent = cal;
    const phasePart = (md.name || "").split("—")[1];
    if (subEl) subEl.textContent = "kcal/day · " + (phasePart ? phasePart.trim() : "Month " + (curM+1));
  }
}

function setGreeting() {
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const day = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
  document.getElementById("dashGreeting").textContent = `${greet}, Karthik! · ${day}`;
}
