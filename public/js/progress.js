async function loadProgress() {
  try {
    const [histRes, statsRes, profileRes] = await Promise.all([
      apiFetch('/api/logs/data/weight-history'),
      apiFetch('/api/logs/data/stats'),
      apiFetch('/api/profile')
    ]);
    if (!histRes.ok || !statsRes.ok) return; // redirected to login
    const history = histRes.data;
    const stats = statsRes.data;
    const profile = (profileRes.ok && profileRes.data) || {};
    const targetWeight = profile.goalWeightKg || null;
    const startWeight  = profile.currentWeightKg || null;
    const currentW = stats.latestWeight || startWeight || 0;
    renderWeightChart(history, targetWeight);
    document.getElementById("workoutStreakVal").textContent = stats.workoutStreak || 0;
    document.getElementById("waterStreakVal").textContent = stats.waterStreak || 0;
    document.getElementById("completionVal").textContent = (stats.avgCompletion || 0) + "%";
    const lost = stats.weightLost || 0;
    document.getElementById("weightLostVal").textContent = (lost > 0 ? "-" : "") + Math.abs(lost) + "kg";
    updateBMI(currentW);
    renderStats(stats);
    renderMilestones(currentW, startWeight, targetWeight);
  } catch(e) {
    console.warn("Progress API offline");
    renderWeightChart([], null);
    renderMilestones(0, null, null);
  }
}

function renderWeightChart(data, targetWeight) {
  const ctx = document.getElementById("weightChart").getContext("2d");
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

function updateBMI(w) {
  const bmi = (w / (1.80 * 1.80)).toFixed(1); // Karthik: 5'11" = 1.80m
  const bmiEl = document.getElementById("bmiVal");
  const catEl = document.getElementById("bmiCat");
  const markerEl = document.getElementById("bmiMarker");
  const displayEl = document.getElementById("bmiWeightDisplay");
  if(bmiEl) { bmiEl.textContent = bmi; displayEl.textContent = w+"kg"; }
  let cat = "Normal", color = "#22c55e";
  if(bmi >= 30) { cat="Obese"; color="#ef4444"; }
  else if(bmi >= 25) { cat="Overweight"; color="#f59e0b"; }
  if(catEl) { catEl.textContent = cat; catEl.style.color = color; }
  const pct = Math.min(100, Math.max(0, ((bmi - 20) / 15) * 100));
  if(markerEl) markerEl.style.left = pct + "%";
}
