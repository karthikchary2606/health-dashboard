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

const DASHBOARD_BLOCK_STATE = {
  READY: 'ready',
  EMPTY: 'empty',
  ERROR: 'error'
};

function setDashboardBlockState(blockId, state, options) {
  const block = document.getElementById(blockId);
  if (!block) return;
  block.dataset.state = state;

  const next = options || {};
  if (Object.prototype.hasOwnProperty.call(next, 'html')) {
    block.innerHTML = next.html;
  } else if (Object.prototype.hasOwnProperty.call(next, 'text')) {
    block.textContent = next.text;
  }
}

function renderTimelineFromOverviewItems(items) {
  const timelineItems = Array.isArray(items) ? items : [];
  if (timelineItems.length === 0) {
    setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.EMPTY, {
      html: "<p style='color:var(--text-light);font-size:.85rem'>No timeline updates yet.</p>"
    });
    return;
  }

  let html = '';
  timelineItems.forEach((item) => {
    if (item.type === 'meal') {
      html += "<div class='timeline-item'><span class='t-time'>🍽️ " + item.label + "</span><span class='t-text'>" + (item.value || '—') + "</span></div>";
      return;
    }
    if (item.type === 'habit') {
      html += "<div class='timeline-item" + (item.completed ? " done" : "") + "'><span class='t-time'>✅ Habit</span><span class='t-text'>" + item.label + "</span><input type='checkbox' " + (item.completed ? "checked" : "") + " disabled></div>";
    }
  });

  if (!html) {
    setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.EMPTY, {
      html: "<p style='color:var(--text-light);font-size:.85rem'>No timeline updates yet.</p>"
    });
    return;
  }

  setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.READY, { html });
}

function applyOverviewStats(overview) {
  if (!overview || !overview.dietPreview) return;
  const calEl = document.getElementById("calorieStat");
  const subEl = document.getElementById("calorieStatSub");
  const target = overview.dietPreview.dailyCalorieTarget;
  if (calEl) calEl.textContent = target ? target.toLocaleString('en-IN') : '—';
  if (subEl) subEl.textContent = 'kcal/day';
}

function applyOverviewProfileCompleteness(overview) {
  if (!overview || !overview.profileCompleteness) return;
  const pct = overview.profileCompleteness.percentage;
  const card = document.getElementById('profileCompletionCard');
  const pctEl = document.getElementById('completionPctDash');
  if (!card) return;
  if (pct < 100) {
    card.style.display = 'flex';
    if (pctEl) pctEl.textContent = pct;
  } else {
    card.style.display = 'none';
  }
}

async function loadDashboardOverview() {
  try {
    const { ok, data } = await apiFetch('/api/dashboard/overview');
    if (!ok || !data) {
      setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.ERROR, {
        html: "<p style='color:#b91c1c;font-size:.85rem'>Could not load timeline. Please refresh.</p>"
      });
      return null;
    }

    renderTimelineFromOverviewItems(data.timeline);
    applyOverviewStats(data);
    applyOverviewProfileCompleteness(data);
    return data;
  } catch (e) {
    setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.ERROR, {
      html: "<p style='color:#b91c1c;font-size:.85rem'>Could not load timeline. Please refresh.</p>"
    });
    return null;
  }
}

async function buildTimeline() {
  const plan = await window.planCache.getPlan();
  if (!plan) {
    _phaseTasks = [];
    updateCheckStat();
    setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.EMPTY, {
      html: "<p style='color:var(--text-light);font-size:.85rem'>No timeline available yet.</p>"
    });
    return;
  }

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
  if (_phaseTasks.length === 0) {
    setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.EMPTY, {
      html: "<p style='color:var(--text-light);font-size:.85rem'>No checklist tasks for today.</p>"
    });
  } else {
    setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.READY);
  }
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
  if (calEl) {
    const calorieTarget = currentUser && currentUser.profile && currentUser.profile.dailyCalorieTarget;
    calEl.textContent = calorieTarget ? calorieTarget.toLocaleString('en-IN') : '—';
    if (subEl) {
      const phasePart = md && (md.monthLabel || "").split("—")[1];
      subEl.textContent = "kcal/day · " + (phasePart ? phasePart.trim() : "Month " + (monthIdx + 1));
    }
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
      setDashboardBlockState('sleepSummaryContent', DASHBOARD_BLOCK_STATE.EMPTY, {
        html: '<a href="/sleep.html" style="color:#6366f1;">Log last night\'s sleep →</a>'
      });
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

    setDashboardBlockState('sleepSummaryContent', DASHBOARD_BLOCK_STATE.READY, { html: `
      <div style="font-size:1.4rem;font-weight:700;color:#1e293b;">${dur} ${qual}</div>
      <div style="font-size:.8rem;color:#94a3b8;margin-top:2px;">${dateLabel} · <a href="/sleep.html" style="color:#6366f1;">View all →</a></div>
    ` });
  } catch (e) {
    console.warn('Sleep summary load failed:', e);
    setDashboardBlockState('sleepSummaryContent', DASHBOARD_BLOCK_STATE.ERROR, {
      html: '<span style="color:#b91c1c;">Unable to load sleep summary right now.</span>'
    });
  }
}

// Profile completion card
apiFetch('/api/profile/completion').then(res => {
  if (!res.ok) return;
  const pct = res.data.percentage;
  const card = document.getElementById('profileCompletionCard');
  const pctEl = document.getElementById('completionPctDash');
  if (card && pct < 100) {
    card.style.display = 'flex';
    if (pctEl) pctEl.textContent = pct;
  }
});

// Show auto-calculated water goal based on weight — called after initAuth sets currentUser
function updateWaterGoalDisplay() {
  var p = (window.currentUser && window.currentUser.profile) || {};
  var goalEl = document.getElementById('waterGoalDisplay');
  if (goalEl && p.waterGoalL) {
    goalEl.textContent = p.waterGoalL + 'L';
  }
  var hint = document.getElementById('waterGoalHint');
  if (hint && p.currentWeightKg) {
    hint.textContent = 'Based on your weight (' + p.currentWeightKg + 'kg × 30ml)';
  }
}

// Review reminder banner — called after initAuth sets currentUser
function checkReviewBanner() {
  const p = (window.currentUser || {}).profile;
  if (!p || !p.lastReviewedAt || !p.reviewReminderDays) return;
  const daysSince = Math.floor((Date.now() - new Date(p.lastReviewedAt)) / 86400000);
  let snoozeUntil = 0, dismissCount = 0;
  try {
    snoozeUntil  = parseInt(localStorage.getItem('reviewBannerSnoozeUntil') || '0');
    dismissCount = parseInt(localStorage.getItem('reviewBannerDismissCount') || '0');
  } catch (e) { /* storage unavailable — show banner anyway */ }
  const banner = document.getElementById('reviewBanner');
  if (!banner) return;
  const isOverdue  = daysSince >= p.reviewReminderDays;
  const isSnoozed  = Date.now() < snoozeUntil;
  const forceShow  = dismissCount >= 3;
  if (isOverdue && (!isSnoozed || forceShow)) {
    banner.style.display = 'flex';
    const dismissBtn = banner.querySelector('button');
    if (forceShow && dismissBtn) {
      dismissBtn.style.display = 'none';
      const hint = document.createElement('span');
      hint.style.cssText = 'font-size:.75rem;color:#6b7280;margin-left:8px';
      hint.textContent = 'Please review when you can';
      banner.appendChild(hint);
    }
  }
}

function dismissReviewBanner() {
  const banner = document.getElementById('reviewBanner');
  if (banner) banner.style.display = 'none';
  try {
    const count = parseInt(localStorage.getItem('reviewBannerDismissCount') || '0') + 1;
    localStorage.setItem('reviewBannerDismissCount', count);
    localStorage.setItem('reviewBannerSnoozeUntil', Date.now() + 7 * 86400000);
  } catch (e) {
    // Storage unavailable (private browsing, quota exceeded) — dismiss is still visual
  }
}

async function logWeight() {
  var input = document.getElementById('qlWeight');
  var w = parseFloat(input.value);
  if (!w || w < 20 || w > 300) { showQLMsg('Enter a valid weight (20–300 kg)', 'error'); return; }
  var today = new Date().toISOString().slice(0, 10);
  var res = await apiFetch('/api/logs/' + today, {
    method: 'PATCH',
    body: JSON.stringify({ weight: w })
  });
  if (res.ok) { input.value = ''; showQLMsg('Weight logged ✓'); }
  else showQLMsg('Error: ' + ((res.data && res.data.error) || ''), 'error');
}

async function logWater(litres) {
  var today = new Date().toISOString().slice(0, 10);
  var logRes = await apiFetch('/api/logs/' + today);
  var current = (logRes.ok && logRes.data) ? (logRes.data.waterIntake || 0) : 0;
  var res = await apiFetch('/api/logs/' + today, {
    method: 'PATCH',
    body: JSON.stringify({ waterIntake: parseFloat((current + litres).toFixed(2)) })
  });
  if (res.ok) showQLMsg('+' + Math.round(litres * 1000) + 'ml logged ✓');
  else showQLMsg('Error logging water', 'error');
}

async function toggleWorkoutLog() {
  var detail = document.getElementById('exerciseDetail');
  var btn = document.getElementById('workoutLogBtn');
  var today = new Date().toISOString().slice(0, 10);
  await apiFetch('/api/logs/' + today, {
    method: 'PATCH',
    body: JSON.stringify({ completedWorkout: true })
  });
  btn.textContent = '✅ Workout done!';
  btn.style.background = '#f0fdf4';
  detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
  if (!document.getElementById('exerciseRows').children.length) addExerciseRow();
  showQLMsg('Workout marked done ✓');
}

function addExerciseRow() {
  var rows = document.getElementById('exerciseRows');
  var row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap';
  row.innerHTML =
    '<input placeholder="Exercise name" style="flex:2;min-width:120px;padding:4px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem">' +
    '<input type="number" placeholder="Sets" style="width:50px;padding:4px 6px;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem">' +
    '<input type="number" placeholder="Reps" style="width:50px;padding:4px 6px;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem">' +
    '<input type="number" step="0.5" placeholder="kg" style="width:55px;padding:4px 6px;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem">';
  rows.appendChild(row);
}

async function saveExerciseLog() {
  var rows = Array.from(document.getElementById('exerciseRows').children);
  var exerciseLog = rows.map(function(row) {
    var inputs = row.querySelectorAll('input');
    return {
      exerciseName: inputs[0].value.trim(),
      sets:     parseInt(inputs[1].value) || 0,
      reps:     parseInt(inputs[2].value) || 0,
      weightKg: parseFloat(inputs[3].value) || 0,
      durationMin: 0
    };
  }).filter(function(e) { return e.exerciseName; });

  if (!exerciseLog.length) { showQLMsg('No exercises to save', 'error'); return; }
  var today = new Date().toISOString().slice(0, 10);
  var res = await apiFetch('/api/logs/' + today, {
    method: 'PATCH',
    body: JSON.stringify({ exerciseLog: exerciseLog })
  });
  if (res.ok) showQLMsg('Exercise log saved ✓');
  else showQLMsg('Error saving', 'error');
}

function showQLMsg(text, type) {
  var el = document.getElementById('qlMsg');
  if (!el) return;
  el.textContent = text;
  el.style.color = (type === 'error') ? '#dc2626' : '#16a34a';
  setTimeout(function() { if (el) el.textContent = ''; }, 3000);
}
