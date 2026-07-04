// Dashboard state
let currentMoodScore = 3;
let currentEnergyScore = 3;
let waterLevel = 0;
let _dashWeightChart = null;

function getISTDateString() {
  const ms = Date.now() + (5.5 * 60 * 60 * 1000);
  const d = new Date(ms);
  return d.getUTCFullYear() + '-'
    + String(d.getUTCMonth() + 1).padStart(2, '0') + '-'
    + String(d.getUTCDate()).padStart(2, '0');
}

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

function renderDashboardPrompt(blockKind, state) {
  const config = {
    timeline: {
      empty: {
        title: 'No timeline updates yet',
        detail: 'Complete today’s log or refresh your plan to populate this card.',
        action: '<a class="dashboard-state-action" href="#sec-diet" onclick="showSection(\'diet\');return false;">Open Diet Plan</a>'
      },
      error: {
        title: 'Couldn’t load today’s timeline',
        detail: 'We could not fetch the overview contract. Retry once network stabilizes.',
        action: '<button type="button" class="dashboard-state-action" onclick="loadDashboardOverview()">Retry</button>'
      }
    },
    sleep: {
      empty: {
        title: 'No sleep entry found',
        detail: 'Log last night’s sleep to unlock duration and quality trends.',
        action: '<a class="dashboard-state-action" href="/sleep.html">Log sleep</a>'
      },
      error: {
        title: 'Sleep summary unavailable',
        detail: 'The sleep service did not respond. Try again in a moment.',
        action: '<button type="button" class="dashboard-state-action" onclick="loadSleepSummary()">Retry</button>'
      }
    }
  };

  const entry = (config[blockKind] || {})[state];
  if (!entry) return '';
  return "<div class='dashboard-state-callout'><p class='dashboard-state-title'>" + entry.title + "</p><p class='dashboard-state-detail'>" + entry.detail + "</p>" + entry.action + "</div>";
}

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
      html: renderDashboardPrompt('timeline', DASHBOARD_BLOCK_STATE.EMPTY)
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
      html: renderDashboardPrompt('timeline', DASHBOARD_BLOCK_STATE.EMPTY)
    });
    return;
  }

  setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.READY, { html });
}

function applyOverviewStats(overview) {
  if (!overview || !overview.dietPreview) return;
  const target = overview.dietPreview.dailyCalorieTarget;
  const macros = overview.dietPreview.macros || {};

  // Legacy elements
  const calEl = document.getElementById("calorieStat");
  const subEl = document.getElementById("calorieStatSub");
  if (calEl) calEl.textContent = target ? target.toLocaleString('en-IN') : '—';
  if (subEl) subEl.textContent = 'kcal/day';

  // New CRED hero elements
  const goalEl = document.getElementById("calories-goal");
  if (goalEl && target) goalEl.textContent = target.toLocaleString('en-IN');

  const remainEl = document.getElementById("calories-remaining");
  if (remainEl && target) {
    const macroStr = macros.proteinG
      ? `P ${macros.proteinG}g · C ${macros.carbsG}g · F ${macros.fatG}g`
      : `${target.toLocaleString('en-IN')} kcal goal`;
    remainEl.textContent = macroStr;
  }
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
        html: renderDashboardPrompt('timeline', DASHBOARD_BLOCK_STATE.ERROR)
      });
      return null;
    }

    renderTimelineFromOverviewItems(data.timeline);
    applyOverviewStats(data);
    applyOverviewProfileCompleteness(data);
    if (!data.profileCompleteness) {
      await backfillProfileCompletion();
    }
    return data;
  } catch (e) {
    setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.ERROR, {
      html: renderDashboardPrompt('timeline', DASHBOARD_BLOCK_STATE.ERROR)
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
      html: renderDashboardPrompt('timeline', DASHBOARD_BLOCK_STATE.EMPTY)
    });
    return;
  }

  const { meta } = plan;
  _phaseIdx    = Math.max(0, (meta.currentPhase || 1) - 1);
  _monthIdx    = Math.max(0, (meta.currentMonth || 1) - 1);
  _weekIdx     = Math.max(0, (meta.currentWeek  || 1) - 1);
  _phaseTasks  = plan.checklist || [];
  _workoutPlan = plan.workout   || [];
  _dashDietPlan = plan.diet     || [];

  const container = document.getElementById("timelineContainer");
  container.innerHTML = "";

  // ── Phase / date banner ──
  const phaseBg     = ["#f0fdf4","#eff6ff","#fffbeb"];
  const phaseBorder = ["#bbf7d0","#bfdbfe","#fde68a"];
  const curWorkout  = _workoutPlan[_monthIdx] || {};
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" });
  const banner = document.createElement("div");
  banner.style.cssText = "background:" + phaseBg[_phaseIdx] + ";border:1px solid " + phaseBorder[_phaseIdx] + ";border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:8px";
  banner.innerHTML = "<div>"
    + "<div style='font-weight:700;font-size:.85rem;color:var(--primary)'>📅 " + dateLabel + "</div>"
    + "<div style='font-size:.72rem;color:var(--text-light);margin-top:2px'>Month " + meta.currentMonth + " of " + (meta.totalMonths || 6) + " · Week " + meta.currentWeek + " · " + meta.currentPhaseLabel + " Phase</div>"
    + "</div>"
    + "<span style='font-size:.7rem;background:var(--primary);color:#fff;padding:3px 8px;border-radius:12px;white-space:nowrap'>" + (curWorkout.phaseLabel || meta.currentPhaseLabel) + "</span>";
  container.appendChild(banner);

  // ── Resolve today's diet ──
  const todayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const md = _dashDietPlan[_monthIdx];
  let weekdays = [];
  if (md) {
    const weekData = (md.weeks && (md.weeks[_weekIdx] || md.weeks[0])) || null;
    weekdays = (weekData && weekData.weekdays) || md.weekdays || [];
  }
  const todayDay = weekdays.find(function(d) { return d.day === todayName; });

  // ── Build unified chronological events ──
  const MEAL_SLOTS = [
    { key: "breakfast", time: "07:30", icon: "🍳", label: "Breakfast" },
    { key: "lunch",     time: "13:00", icon: "🍽️", label: "Lunch"     },
    { key: "snack",     time: "16:00", icon: "🥗", label: "Snack"     },
    { key: "dinner",    time: "19:30", icon: "🌙", label: "Dinner"    }
  ];
  const HABIT_TIMES = { hydration: "08:00", sleep: "22:30", tracking: "21:00", activity: "18:00", medication: "09:00" };

  // time → sort key (minutes since midnight)
  function toMins(t) { const p = t.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]); }

  var events = [];

  // Wake-up anchor
  events.push({ sortKey: toMins("06:30"), time: "06:30", icon: "☀️", title: "Wake up & drink 1 glass of water",    type: "anchor" });

  // Meals
  MEAL_SLOTS.forEach(function(slot) {
    const mealText = todayDay && todayDay[slot.key];
    events.push({
      sortKey: toMins(slot.time),
      time:    slot.time,
      icon:    slot.icon,
      title:   slot.label,
      detail:  mealText || "No meal planned",
      type:    "meal",
      hasData: !!mealText
    });
  });

  // Hydration reminders (mid-morning, afternoon)
  events.push({ sortKey: toMins("11:00"), time: "11:00", icon: "💧", title: "Hydration check — drink 500ml", type: "anchor" });
  events.push({ sortKey: toMins("15:30"), time: "15:30", icon: "💧", title: "Hydration check — drink 500ml", type: "anchor" });

  // Workout
  const workoutFocus = curWorkout.focus || (meta.currentPhaseLabel + " workout");
  const workoutTime  = "09:00";
  events.push({
    sortKey: toMins(workoutTime),
    time:    workoutTime,
    icon:    "💪",
    title:   "Workout — " + workoutFocus,
    detail:  curWorkout.daysPerWeek ? curWorkout.daysPerWeek + " days/week · " + (curWorkout.sessionDuration || "45") + " min" : null,
    type:    "workout",
    checkIdx: -1  // handled by workoutToggle separately
  });

  // Steps goal
  events.push({ sortKey: toMins("18:00"), time: "18:00", icon: "🚶", title: "Evening walk / Steps goal", detail: "Target: 7,000+ steps", type: "steps" });

  // Sleep
  events.push({ sortKey: toMins("22:30"), time: "22:30", icon: "😴", title: "Wind down — target 7–8h sleep", type: "anchor" });

  // Checklist habits (non-meal, non-workout)
  _phaseTasks.forEach(function(task, i) {
    const cat = task.category || "tracking";
    const t   = task.time || HABIT_TIMES[cat] || "20:00";
    events.push({ sortKey: toMins(t), time: t, icon: "✅", title: task.text, type: "habit", checkIdx: i });
  });

  // Sort by time
  events.sort(function(a, b) { return a.sortKey - b.sortKey; });

  // ── Render events ──
  var nowMins = now.getHours() * 60 + now.getMinutes();

  events.forEach(function(ev) {
    var isPast = ev.sortKey < nowMins;
    var isNow  = Math.abs(ev.sortKey - nowMins) < 60;
    var div = document.createElement("div");
    div.style.cssText = "display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;border-left:3px solid "
      + (isNow ? "var(--primary)" : isPast ? "var(--success)" : "var(--border)")
      + ";background:" + (isNow ? "rgba(var(--primary-rgb,78,204,163),.06)" : isPast ? "rgba(78,204,163,.04)" : "var(--card-elevated)")
      + ";transition:all .2s";

    // Time column
    var timeEl = document.createElement("div");
    timeEl.style.cssText = "min-width:52px;font-size:.72rem;font-weight:700;color:" + (isNow ? "var(--primary)" : "var(--text-light)") + ";padding-top:2px";
    timeEl.textContent = ev.time;

    // Icon
    var iconEl = document.createElement("div");
    iconEl.style.cssText = "font-size:1rem;flex-shrink:0;padding-top:1px";
    iconEl.textContent = ev.icon;

    // Content
    var contentEl = document.createElement("div");
    contentEl.style.cssText = "flex:1;min-width:0";
    var titleEl = document.createElement("div");
    titleEl.style.cssText = "font-size:.82rem;font-weight:600;color:" + (isPast && !isNow ? "var(--text-light)" : "var(--text-dark)") + ";line-height:1.3";
    titleEl.textContent = ev.title;
    contentEl.appendChild(titleEl);
    if (ev.detail) {
      var detailEl = document.createElement("div");
      detailEl.style.cssText = "font-size:.74rem;color:var(--text-light);margin-top:2px;line-height:1.4;word-break:break-word";
      detailEl.textContent = ev.detail;
      contentEl.appendChild(detailEl);
    }

    // Checkbox for habits
    if (ev.type === "habit" && ev.checkIdx >= 0) {
      div.id = "titem-" + ev.checkIdx;
      var chk = document.createElement("input");
      chk.type = "checkbox";
      chk.id = "chk-" + ev.checkIdx;
      chk.style.cssText = "width:18px;height:18px;accent-color:var(--success);cursor:pointer;flex-shrink:0;margin-top:2px";
      chk.setAttribute("onchange", "onCheckChange(" + ev.checkIdx + ")");
      div.appendChild(timeEl); div.appendChild(iconEl); div.appendChild(contentEl); div.appendChild(chk);
    } else {
      div.appendChild(timeEl); div.appendChild(iconEl); div.appendChild(contentEl);
    }

    // "Now" pill
    if (isNow) {
      var pill = document.createElement("span");
      pill.style.cssText = "font-size:.65rem;background:var(--primary);color:#fff;padding:2px 6px;border-radius:8px;white-space:nowrap;align-self:center;flex-shrink:0";
      pill.textContent = "Now";
      div.appendChild(pill);
    }

    container.appendChild(div);
  });

  updateCheckStat();
  setDashboardBlockState('timelineContainer', DASHBOARD_BLOCK_STATE.READY);
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
  document.getElementById("checkStat") && (document.getElementById("checkStat").textContent = done + "/" + total);
}

function buildChecklistPayload() {
  if (!Array.isArray(_phaseTasks) || _phaseTasks.length === 0) return null;
  const checklist = _phaseTasks.map((_, i) => {
    const c = document.getElementById("chk-" + i);
    if (!c) return null;
    return { done: Boolean(c.checked) };
  });
  if (checklist.some((entry) => entry === null)) return null;
  return checklist;
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
  const checklist = buildChecklistPayload();
  const payload = { date, waterIntake: waterLevel, weight, completedWorkout: document.getElementById("workoutToggle").checked, moodScore: currentMoodScore, energyScore: currentEnergyScore, notes };
  if (checklist) payload.checklist = checklist;
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

  // Legacy element (old HTML)
  const legacyEl = document.getElementById("dashGreeting");
  if (legacyEl) legacyEl.textContent = `${greet}, ${name}! · ${day}`;

  // New CRED design elements
  const nameEl = document.getElementById("dashboard-user-name");
  if (nameEl) nameEl.textContent = `${greet}, ${name}!`;

  const greetLabelEl = document.querySelector(".dashboard-header__greeting");
  if (greetLabelEl && !legacyEl) greetLabelEl.textContent = greet;

  // Sidebar user display
  const sidebarUserEl = document.getElementById("sidebar-user");
  if (sidebarUserEl && currentUser) {
    sidebarUserEl.textContent = currentUser.name || currentUser.email || 'User';
  }
}

async function loadSleepSummary() {
  try {
    const res = await apiFetch('/api/sleep/history');
    const el = document.getElementById('sleepSummaryContent');
    if (!el) return;

    if (!res.ok) {
      setDashboardBlockState('sleepSummaryContent', DASHBOARD_BLOCK_STATE.ERROR, {
        html: renderDashboardPrompt('sleep', DASHBOARD_BLOCK_STATE.ERROR)
      });
      return;
    }

    if (!res.data || res.data.length === 0) {
      setDashboardBlockState('sleepSummaryContent', DASHBOARD_BLOCK_STATE.EMPTY, {
        html: renderDashboardPrompt('sleep', DASHBOARD_BLOCK_STATE.EMPTY)
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
      html: renderDashboardPrompt('sleep', DASHBOARD_BLOCK_STATE.ERROR)
    });
  }
}

async function backfillProfileCompletion() {
  const card = document.getElementById('profileCompletionCard');
  if (!card) return;
  try {
    const res = await apiFetch('/api/profile/completion');
    if (!res.ok || !res.data) return;
    const pct = res.data.percentage;
    const pctEl = document.getElementById('completionPctDash');
    if (pct < 100) {
      card.style.display = 'flex';
      if (pctEl) pctEl.textContent = pct;
    }
  } catch (e) {
    // best-effort fallback only
  }
}

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
  var today = getISTDateString();
  var res = await apiFetch('/api/logs/' + today, {
    method: 'PATCH',
    body: JSON.stringify({ weight: w })
  });
  if (res.ok) { input.value = ''; showQLMsg('Weight logged ✓'); }
  else showQLMsg('Error: ' + ((res.data && res.data.error) || ''), 'error');
}

async function logWater(litres) {
  var today = getISTDateString();
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
  var today = getISTDateString();
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
  var today = getISTDateString();
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

// Live data refresh variables
let liveDataInterval = null;

// Fetch live data from /api/logs/today and update ALL dashboard metric cards
async function initLiveData() {
  try {
    const res = await apiFetch('/api/logs/today');
    if (!res.ok || !res.data) return;
    const data = res.data;

    // ── Calorie hero ──
    const consumed      = typeof data.consumed      === 'number' ? data.consumed      : 0;
    const calorieTarget = typeof data.calorieTarget === 'number' ? data.calorieTarget : 2100;
    const remaining     = calorieTarget - consumed;
    const pct           = calorieTarget > 0 ? Math.min(100, Math.round((consumed / calorieTarget) * 100)) : 0;

    const consumedEl  = document.getElementById('calories-consumed');
    const goalEl      = document.getElementById('calories-goal');
    const remainingEl = document.getElementById('calories-remaining');
    const progressEl  = document.getElementById('calories-progress');
    if (consumedEl)  consumedEl.textContent  = consumed.toLocaleString('en-IN');
    if (goalEl)      goalEl.textContent      = calorieTarget.toLocaleString('en-IN');
    if (remainingEl) remainingEl.textContent = remaining > 0
      ? remaining.toLocaleString('en-IN') + ' kcal remaining'
      : 'Goal reached! 🎉';
    if (progressEl)  progressEl.style.width = pct + '%';

    // ── Metric cards ──
    const waterEl   = document.getElementById('metric-water');
    const stepsEl   = document.getElementById('metric-steps');
    const sleepEl   = document.getElementById('metric-sleep');
    const burnedEl  = document.getElementById('metric-burned');

    if (waterEl)  waterEl.textContent  = (data.waterIntake  || 0) + 'L';
    if (stepsEl)  stepsEl.textContent  = (data.stepCount    || 0).toLocaleString('en-IN');
    if (sleepEl)  sleepEl.textContent  = (data.sleepHours   || 0) + 'h';
    if (burnedEl) burnedEl.textContent = (data.caloriesBurned || 0).toLocaleString('en-IN');

    // ── Meal log list (dashboard quick-log section) ──
    const mealLogList = document.getElementById('mealLogList');
    if (mealLogList && Array.isArray(data.meals)) {
      if (data.meals.length === 0) {
        mealLogList.innerHTML = '<div style="color:#a0a0a0;text-align:center;padding:16px;">No meals logged today</div>';
      } else {
        mealLogList.innerHTML = data.meals.map(function(m) {
          const name = m.recipeName || m.description || m.name || m.mealType || 'Meal';
          const cal  = m.calories || 0;
          const macros = (m.proteinG || m.carbsG || m.fatG)
            ? '<span style="font-size:.7rem;color:rgba(255,255,255,.4)">&nbsp;P:' + Math.round(m.proteinG||0) + 'g C:' + Math.round(m.carbsG||0) + 'g F:' + Math.round(m.fatG||0) + 'g</span>'
            : '';
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)">'
            + '<span style="font-size:.83rem">' + name + macros + '</span>'
            + '<span style="color:#4ecca3;font-size:.83rem;white-space:nowrap">' + cal + ' kcal</span>'
            + '</div>';
        }).join('');
      }
    }
  } catch (e) {
    console.warn('Live data fetch failed:', e);
  }
}

// Initialize live data on page load and set up auto-refresh every 30 seconds
document.addEventListener('DOMContentLoaded', function() {
  initLiveData();
  if (liveDataInterval) clearInterval(liveDataInterval);
  liveDataInterval = setInterval(initLiveData, 30000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  if (liveDataInterval) clearInterval(liveDataInterval);
});
