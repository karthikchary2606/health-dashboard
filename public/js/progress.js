async function loadProgress() {
  try {
    const [history, stats] = await Promise.all([apiFetch('/api/logs/data/weight-history').then(r=>r.json()), apiFetch('/api/logs/data/stats').then(r=>r.json())]);
    renderWeightChart(history);
    document.getElementById("workoutStreakVal").textContent = stats.workoutStreak || 0;
    document.getElementById("waterStreakVal").textContent = stats.waterStreak || 0;
    document.getElementById("completionVal").textContent = (stats.avgCompletion || 0) + "%";
    const lost = stats.weightLost || 0;
    document.getElementById("weightLostVal").textContent = (lost > 0 ? "-" : "") + Math.abs(lost) + "kg";
    const w = stats.currentWeight || 95;
    updateBMI(w);
    renderStats(stats);
    renderMilestones(w);
  } catch(e) {
    console.warn("Progress API offline");
    renderWeightChart([]);
    renderMilestones(parseFloat(document.getElementById("currentWeight").value)||95);
  }
}

function renderWeightChart(data) {
  const ctx = document.getElementById("weightChart").getContext("2d");
  const labels = data.map(d => d.date);
  const weights = data.map(d => d.weight);
  const targetLine = data.map(() => 75);
  if(weightChartInstance) weightChartInstance.destroy();
  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.length ? labels : ["Start"],
      datasets: [
        { label:"Weight (kg)", data: weights.length ? weights : [95], borderColor:"#1b4332", backgroundColor:"rgba(27,67,50,0.1)", borderWidth:2.5, pointBackgroundColor:"#1b4332", pointRadius:4, tension:0.3, fill:true },
        { label:"Target (75kg)", data: targetLine.length ? targetLine : [75], borderColor:"#52b788", borderDash:[6,3], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: { legend:{ labels:{ font:{ family:"Inter", size:11 } } }, tooltip:{ callbacks:{ label: ctx => ` ${ctx.parsed.y} kg` } } },
      scales: {
        y: { min:80, max:100, grid:{ color:"rgba(0,0,0,0.05)" }, ticks:{ font:{family:"Inter",size:10} } },
        x: { grid:{ color:"rgba(0,0,0,0.05)" }, ticks:{ font:{family:"Inter",size:10}, maxTicksLimit:10 } }
      }
    }
  });
}

function renderMilestones(currentW) {
  const ms = [
    { weight:94, label:"-1kg First Drop",      icon:"🌱", month:"Week 2" },
    { weight:92, label:"-3kg Month 1 Done",    icon:"⚡", month:"Month 1" },
    { weight:89, label:"-6kg Building Steam",  icon:"🔥", month:"Month 2" },
    { weight:86, label:"-9kg Halfway!",        icon:"🏅", month:"Month 3" },
    { weight:83, label:"-12kg Strong & Lean",  icon:"💪", month:"Month 4" },
    { weight:80, label:"-15kg Final Phase",    icon:"🎯", month:"Month 5" },
    { weight:77, label:"-18kg Almost There!",  icon:"🚀", month:"Month 5+" },
    { weight:75, label:"-20kg 🎉 GOAL! 75kg", icon:"🏆", month:"Month 6" }
  ];
  const grid = document.getElementById("milestoneGrid");
  grid.innerHTML = ms.map(m => {
    const unlocked = currentW <= m.weight;
    const current = !unlocked && currentW > m.weight && currentW <= m.weight + 3;
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
