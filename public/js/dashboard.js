// Dashboard state
let currentMoodScore = 3;
let currentEnergyScore = 3;
let waterLevel = 0;
let weightChartInstance = null;

// Plan data cached after first buildTimeline fetch
let _phaseTasks = [];  // checklist items from plan.checklist
let _phaseIdx   = 0;   // 0-based phase index (meta.currentPhase - 1)
let _monthIdx   = 0;   // 0-based month index (meta.currentMonth - 1)
let _weekIdx    = 0;   // 0-based week index within month (meta.currentWeek - 1)
let _workoutPlan = []; // plan.workout array
let _dashDietPlan = []; // plan.diet array (prefixed to avoid conflict with diet.js's _dietPlan)

async function buildTimeline() {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  const { meta } = plan;
  _phaseIdx   = Math.max(0, (meta.currentPhase || 1) - 1);
  _monthIdx   = Math.max(0, (meta.currentMonth || 1) - 1);
  _weekIdx    = Math.max(0, (meta.currentWeek  || 1) - 1);
  _phaseTasks = plan.checklist || [];
  _workoutPlan = plan.workout || [];
  _dashDietPlan = plan.diet || [];

  const container = document.getElementById("timelineContainer");
  container.innerHTML = "";

  // ── Phase banner ──
  const phaseBg     = ["#f0fdf4","#eff6ff","#fffbeb"];
  const phaseBorder = ["#bbf7d0","#bfdbfe","#fde68a"];
  const curWorkout  = _workoutPlan[_monthIdx] || {};
  const banner = document.createElement("div");
  banner.style.cssText = "background:" + phaseBg[_phaseIdx] + ";border:1px solid " + phaseBorder[_phaseIdx] + ";border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:8px";
  banner.innerHTML = "<div><div style='font-weight:700;font-size:.85rem;color:var(--primary)'>📅 Month " + meta.currentMonth + " of " + (meta.totalMonths || 6) + " — " + meta.currentPhaseLabel + " Phase</div><div style='font-size:.72rem;color:var(--text-light);margin-top:2px'>" + (curWorkout.focus || meta.currentPhaseLabel) + "</div></div><span style='font-size:.7rem;background:var(--primary);color:#fff;padding:3px 8px;border-radius:12px;white-space:nowrap'>" + (curWorkout.phaseLabel || meta.currentPhaseLabel) + "</span>";
  container.appendChild(banner);

  // ── Today's meals preview ──
  const todayName = new Date().toLocaleDateString("en-US",{weekday:"long"});
  const md = _dashDietPlan[_monthIdx];
  let weekdays = [];
  if (md) {
    if (md.weeks && Array.isArray(md.weeks)) {
      const weekData = md.weeks[_weekIdx] || md.weeks[0];
      weekdays = (weekData && weekData.weekdays) || [];
    } else if (md.weekdays) {
      weekdays = md.weekdays;
    }
  }
  const todayDay = weekdays.find(function(d) { return d.day === todayName; });
  if (todayDay) {
    const mealsDiv = document.createElement("div");
    mealsDiv.style.cssText = "background:#fafafa;border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:12px";
    const mealKeys = ["breakfast","lunch","snack","dinner"];
    let rows = "";
    mealKeys.forEach(function(k) {
      const mealText = todayDay[k];
      if (!mealText) return;
      rows += "<div style='display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);font-size:.75rem'>" +
        "<span><strong>" + k.charAt(0).toUpperCase() + k.slice(1) + "</strong></span>" +
        "<span style='color:var(--text-med);flex:1;text-align:left;padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'>" + mealText + "</span></div>";
    });
    mealsDiv.innerHTML = "<div style='font-weight:700;font-size:.78rem;color:var(--primary);margin-bottom:8px'>🍽️ Today's Meals — " + todayName + "</div>" + rows;
    container.appendChild(mealsDiv);
  }

  // ── Phase tasks ──
  _phaseTasks.forEach(function(task, i) {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.id = "titem-" + i;
    div.innerHTML = "<span class='t-time'>" + (task.time || "") + "</span><span class='t-text'>" + task.text + "</span><input type='checkbox' id='chk-" + i + "' onchange='onCheckChange(" + i + ")'>";
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
  const total = _phaseTasks.length;
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
    const phLen = _phaseTasks.length; for(let i=0;i<phLen;i++) {
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
  const weight = parseFloat(document.getElementById("currentWeight").value) || 0;
  const notes = document.getElementById("workoutNotes").value;
  document.getElementById("weightStat").textContent = weight;
  updateBMI(weight);
  const checklist = _phaseTasks.map((_, i) => { const c = document.getElementById("chk-"+i); return { done: c ? c.checked : false }; });
  const payload = { date, checklist, waterIntake: waterLevel, weight, completedWorkout: document.getElementById("workoutToggle").checked, moodScore: currentMoodScore, energyScore: currentEnergyScore, notes };
  try {
    const { ok } = await apiFetch("/api/logs", { method:"POST", body: payload });
    if (!ok) return;
  } catch(e) { console.warn("syncData: API offline"); }
}

async function updateCalorieStat() {
  const plan = await window.planCache.getPlan();
  if (!plan) return;
  const monthIdx = Math.max(0, (plan.meta.currentMonth || 1) - 1);
  const md = plan.diet && plan.diet[monthIdx];
  const calEl = document.getElementById("calorieStat");
  const subEl = document.getElementById("calorieStatSub");
  if (calEl && md) {
    calEl.textContent = "—";
    const phasePart = (md.monthLabel || "").split("—")[1];
    if (subEl) subEl.textContent = "kcal/day · " + (phasePart ? phasePart.trim() : "Month " + (monthIdx + 1));
  }
}

function setGreeting() {
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const day = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
  const name = (currentUser && currentUser.name) ? currentUser.name.split(" ")[0] : "there";
  document.getElementById("dashGreeting").textContent = `${greet}, ${name}! · ${day}`;
}

async function loadSleepSummary() {
  try {
    const res = await apiFetch('/api/sleep/history');
    const el = document.getElementById('sleepSummaryContent');
    if (!el) return;

    if (!res.ok || !res.data || res.data.length === 0) {
      el.innerHTML = '<a href="/sleep.html" style="color:#6366f1;">Log last night\'s sleep →</a>';
      return;
    }

    const QUALITY_EMOJIS = ['', '😩', '😴', '😐', '😊', '🤩'];
    const entry = res.data[0];
    const h = Math.floor(entry.durationMinutes / 60);
    const m = entry.durationMinutes % 60;
    const dur = m === 0 ? `${h}h` : `${h}h ${m}m`;
    const qual = QUALITY_EMOJIS[entry.quality] || '';
    const [ey, em, ed] = entry.date.split('-').map(Number);
    const dateLabel = new Date(ey, em - 1, ed).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    el.innerHTML = `
      <div style="font-size:1.4rem;font-weight:700;color:#1e293b;">${dur} ${qual}</div>
      <div style="font-size:.8rem;color:#94a3b8;margin-top:2px;">${dateLabel} · <a href="/sleep.html" style="color:#6366f1;">View all →</a></div>
    `;
  } catch (e) {
    console.warn('Sleep summary load failed:', e);
  }
}
