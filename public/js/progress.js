let weightChartInstance = null;
let macroChartInstance  = null;
let sleepChartInstance  = null;
let moodChartInstance   = null;

async function loadProgress() {
  try {
    const [histRes, statsRes, profileRes] = await Promise.all([
      apiFetch('/api/logs/data/weight-history'),
      apiFetch('/api/logs/data/stats'),
      apiFetch('/api/profile')
    ]);
    if (!histRes.ok || !statsRes.ok) {
      renderWeightChart([], null);
      renderMilestones(0, null, null);
      return;
    }
    const history = histRes.data;
    const stats = statsRes.data;
    const profile = (profileRes.ok && profileRes.data) || {};
    const targetWeight = profile.goalWeightKg || null;
    const startWeight  = profile.startWeightKg || profile.currentWeightKg || null;
    // Always fall back to profile currentWeightKg so BMI shows even for new users
    const currentW = stats.latestWeight || profile.currentWeightKg || startWeight || 0;

    // Update dynamic subtitle
    const goalLabels = { 'weight-loss': 'Weight Loss Journey', 'muscle-gain': 'Muscle Gain Journey', 'maintenance': 'Maintenance Journey', 'general-fitness': 'Fitness Journey' };
    const subtitleEl = document.getElementById('progressSubtitle');
    if (subtitleEl && profile.primaryGoal) {
      const goalLabel = goalLabels[profile.primaryGoal] || 'Your Health Journey';
      const startW = startWeight ? startWeight + 'kg' : '—';
      const tgtW = targetWeight ? ' → ' + targetWeight + 'kg' : '';
      subtitleEl.textContent = goalLabel + ' · ' + startW + tgtW + ' · 6-month program';
    }

    // Chart target note
    const noteEl = document.getElementById('chartTargetNote');
    if (noteEl) noteEl.textContent = targetWeight ? 'Green dashed line = ' + targetWeight + 'kg target' : '';

    renderWeightChart(history, targetWeight);
    document.getElementById("workoutStreakVal").textContent = stats.workoutStreak || 0;
    document.getElementById("waterStreakVal").textContent = stats.waterStreak || 0;
    document.getElementById("completionVal").textContent = (stats.avgCompletion || 0) + "%";
    const lost = stats.weightLost || 0;
    document.getElementById("weightLostVal").textContent = (lost > 0 ? "-" : (lost < 0 ? "+" : "")) + Math.abs(lost) + "kg";
    updateBMI(currentW, profile);
    renderStats(stats);
    renderMilestones(currentW, startWeight, targetWeight);
    // V2 charts
    renderMacroChart(stats, {
      dailyCalorieTarget: profile.dailyCalorieTarget,
      dailyProteinG:      profile.dailyProteinG,
      dailyCarbsG:        profile.dailyCarbsG,
      dailyFatG:          profile.dailyFatG
    });
    renderSleepChart();
    renderMoodChart();
  } catch(e) {
    console.warn("Progress API offline");
    renderWeightChart([], null);
    renderMilestones(0, null, null);
  }
}

function renderWeightChart(data, targetWeight) {
  const el = document.getElementById("weightChart");
  if (!el) return;
  const ctx = el.getContext("2d");
  const labels = data.map(d => d.date);
  const weights = data.map(d => d.weight);
  const targetLine = targetWeight != null ? data.map(() => targetWeight) : [];
  const targetLabel = targetWeight != null ? "Target (" + targetWeight + "kg)" : "Target";
  const allWeights = [...weights, ...(targetWeight != null ? [targetWeight] : [])].filter(Boolean);
  const minY = allWeights.length ? Math.floor(Math.min(...allWeights) - 2) : 60;
  const maxY = allWeights.length ? Math.ceil(Math.max(...allWeights) + 2) : 110;
  if(weightChartInstance) weightChartInstance.destroy();
  const datasets = [
    { label:"Weight (kg)", data: weights.length ? weights : [], borderColor:"#1b4332", backgroundColor:"rgba(27,67,50,0.1)", borderWidth:2.5, pointBackgroundColor:"#1b4332", pointRadius:4, tension:0.3, fill:true }
  ];
  if (targetWeight != null) {
    datasets.push({ label: targetLabel, data: targetLine.length ? targetLine : [targetWeight], borderColor:"#52b788", borderDash:[6,3], borderWidth:1.5, pointRadius:0, fill:false });
  }
  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.length ? labels : ["Start"],
      datasets
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: { legend:{ labels:{ font:{ family:"Inter", size:11 } } }, tooltip:{ callbacks:{ label: ctx => ` ${ctx.parsed.y} kg` } } },
      scales: {
        y: { min:minY, max:maxY, grid:{ color:"rgba(0,0,0,0.05)" }, ticks:{ font:{family:"Inter",size:10} } },
        x: { grid:{ color:"rgba(0,0,0,0.05)" }, ticks:{ font:{family:"Inter",size:10}, maxTicksLimit:10 } }
      }
    }
  });
}

function renderMilestones(currentW, startW, targetW) {
  const start = startW || 0;
  const target = targetW || 0;
  const total = Math.round(start - target);
  const steps = total > 0 ? [
    { drop: Math.round(total * 0.05), label: "First Drop",     icon: "🌱", month: "Week 2"  },
    { drop: Math.round(total * 0.15), label: "Month 1 Done",   icon: "⚡", month: "Month 1" },
    { drop: Math.round(total * 0.30), label: "Building Steam", icon: "🔥", month: "Month 2" },
    { drop: Math.round(total * 0.45), label: "Halfway!",       icon: "🏅", month: "Month 3" },
    { drop: Math.round(total * 0.60), label: "Strong & Lean",  icon: "💪", month: "Month 4" },
    { drop: Math.round(total * 0.75), label: "Final Phase",    icon: "🎯", month: "Month 5" },
    { drop: Math.round(total * 0.90), label: "Almost There!",  icon: "🚀", month: "Month 5+"},
    { drop: total,                    label: "🎉 GOAL! " + target + "kg", icon: "🏆", month: "Month 6" }
  ] : [];
  const ms = steps.map(s => ({ weight: start - s.drop, label: "-" + s.drop + "kg " + s.label, icon: s.icon, month: s.month }));
  const grid = document.getElementById("milestoneGrid");
  grid.innerHTML = ms.map(m => {
    const unlocked = currentW > 0 && currentW <= m.weight;
    return '<div class="milestone' + (unlocked?" unlocked":"") + '">' +
      '<div class="m-icon">' + m.icon + '</div>' +
      '<div class="m-label">' + m.label + '</div>' +
      '<div class="m-weight">' + m.weight + 'kg · ' + m.month + '</div>' +
      '</div>';
  }).join("");
}
function renderStats(stats) {
  document.getElementById("statDetails").innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${[
        ["📅 Days Logged", stats.totalDaysLogged||0],
        ["💪 Workouts Done", stats.workoutStreak||0],
        ["💧 Avg Water", (stats.avgWater||0)+"L/day"],
        ["📋 Avg Checklist", (stats.avgCompletion||0)+"%"]
      ].map(([l,v])=>`<div style="background:#f8f9fa;border-radius:8px;padding:10px;text-align:center"><div style="font-size:.72rem;color:var(--text-light)">${l}</div><div style="font-size:1.1rem;font-weight:800;color:var(--primary)">${v}</div></div>`).join("")}
    </div>`;
}

function updateBMI(w, profile) {
  const p = profile || (currentUser && currentUser.profile) || {};
  const heightM = p.heightCm ? p.heightCm / 100 : 1.75;
  const bmi = w > 0 ? (w / (heightM * heightM)).toFixed(1) : '—';
  const bmiEl = document.getElementById("bmiVal");
  const catEl = document.getElementById("bmiCat");
  const markerEl = document.getElementById("bmiMarker");
  const detailsEl = document.getElementById("bmiDetails");
  const displayEl = document.getElementById("bmiWeightDisplay"); // legacy — may not exist
  if (bmiEl) bmiEl.textContent = bmi;
  if (displayEl) displayEl.textContent = w + "kg";
  let cat = "Normal", color = "#22c55e";
  if (bmi !== '—') {
    if (bmi < 18.5)  { cat = "Underweight"; color = "#3b82f6"; }
    else if (bmi >= 30) { cat = "Obese"; color = "#ef4444"; }
    else if (bmi >= 25) { cat = "Overweight"; color = "#f59e0b"; }
  }
  if (catEl) { catEl.textContent = cat; catEl.style.color = color; }
  // Marker: BMI 15→0%, BMI 40→100% — left=underweight, right=obese (intuitive, matches gradient)
  const pct = w > 0 ? Math.min(100, Math.max(0, ((parseFloat(bmi) - 15) / 25) * 100)) : 0;
  if (markerEl) markerEl.style.left = pct + "%";
  if (detailsEl) {
    const heightCm = p.heightCm || '—';
    const goalW = p.goalWeightKg;
    const goalBmi = goalW && p.heightCm ? (goalW / (heightM * heightM)).toFixed(1) : null;
    detailsEl.innerHTML = `Height: ${heightCm}cm · Current: ${w > 0 ? w + 'kg' : '—'}`
      + (goalBmi ? `<br>Target BMI at ${goalW}kg: <strong>${goalBmi}</strong>` : '');
  }
}

function renderMacroChart(stats, targets) {
  var section = document.getElementById('macroSection');
  if (!section) return;
  if (!stats.avgCalories && !stats.avgProtein) return;
  section.style.display = 'block';

  var el = document.getElementById('macroChart');
  if (!el) return;
  if (macroChartInstance) macroChartInstance.destroy();
  var ctx = el.getContext('2d');
  macroChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'],
      datasets: [
        {
          label: 'Consumed (avg)',
          data: [stats.avgCalories || 0, stats.avgProtein || 0, stats.avgCarbs || 0, stats.avgFat || 0],
          backgroundColor: '#1b4332'
        },
        {
          label: 'Target',
          data: [targets.dailyCalorieTarget || 0, targets.dailyProteinG || 0, targets.dailyCarbsG || 0, targets.dailyFatG || 0],
          backgroundColor: '#86efac'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });

  var summary = document.getElementById('macroSummary');
  if (summary) {
    summary.innerHTML = [
      { label: 'Calories', val: stats.avgCalories, target: targets.dailyCalorieTarget, unit: 'kcal' },
      { label: 'Protein',  val: stats.avgProtein,  target: targets.dailyProteinG,      unit: 'g' },
      { label: 'Carbs',    val: stats.avgCarbs,    target: targets.dailyCarbsG,         unit: 'g' },
      { label: 'Fat',      val: stats.avgFat,      target: targets.dailyFatG,           unit: 'g' }
    ].map(function(m) {
      var pct = m.target ? Math.round((m.val / m.target) * 100) : 0;
      var color = (pct >= 90 && pct <= 110) ? '#16a34a' : '#d97706';
      return '<div style="text-align:center"><div style="font-weight:700;color:' + color + '">' + (m.val || 0) + m.unit + '</div><div style="color:#6b7280">' + m.label + '<br>' + (m.target || '—') + m.unit + ' target</div></div>';
    }).join('');
  }
}

async function renderSleepChart() {
  var section = document.getElementById('sleepSection');
  if (!section) return;
  var res = await apiFetch('/api/logs/data/sleep-trend');
  if (!res.ok || !res.data || !res.data.length) return;
  section.style.display = 'block';

  var el = document.getElementById('sleepChart');
  if (!el) return;
  if (sleepChartInstance) sleepChartInstance.destroy();
  var ctx = el.getContext('2d');
  sleepChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: res.data.map(function(d){ return d.date.slice(5); }),
      datasets: [
        {
          label: 'Hours slept',
          data: res.data.map(function(d){ return parseFloat((d.durationMinutes / 60).toFixed(1)); }),
          backgroundColor: '#7c3aed',
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Quality (1-5)',
          data: res.data.map(function(d){ return d.quality; }),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y:  { beginAtZero: true, max: 12, title: { display: true, text: 'Hours' } },
        y1: { beginAtZero: true, max: 5, position: 'right', title: { display: true, text: 'Quality' } }
      }
    }
  });
}

async function renderMoodChart() {
  var section = document.getElementById('moodSection');
  if (!section) return;
  var res = await apiFetch('/api/logs/data/mood-trend');
  if (!res.ok || !res.data || !res.data.length) return;
  section.style.display = 'block';

  var el = document.getElementById('moodChart');
  if (!el) return;
  if (moodChartInstance) moodChartInstance.destroy();
  var ctx = el.getContext('2d');
  moodChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: res.data.map(function(d){ return d.date.slice(5); }),
      datasets: [
        {
          label: 'Mood',
          data: res.data.map(function(d){ return d.moodScore; }),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,.1)',
          fill: true, tension: 0.3
        },
        {
          label: 'Energy',
          data: res.data.map(function(d){ return d.energyScore; }),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,.1)',
          fill: true, tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { min: 1, max: 5 } }
    }
  });
}
