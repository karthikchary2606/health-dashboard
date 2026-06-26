// Cardio rendering — data sourced from window.planCache.getPlan()

let _cardioPlan = null;
let _currentCardioMonth = 0; // 0-based; set by initCardio from plan.meta.currentMonth

async function initCardio() {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  _cardioPlan = plan.cardio;
  _currentCardioMonth = plan.meta.currentMonth - 1; // server is 1-based, convert to 0-based
  buildCardio();
}

function buildCardio() {
  if (!_cardioPlan) return;

  const cardio = _cardioPlan[_currentCardioMonth];
  if (!cardio) return;

  const tbody = document.getElementById("cardioTableBody");
  tbody.innerHTML = cardio.sessions.map(r =>
    `<tr><td><strong>${r.day}</strong></td><td>${r.session}</td><td>${r.duration}</td><td>${r.intensity}</td></tr>`
  ).join("");

  const phasesEl = document.getElementById("cardioPhases");
  phasesEl.innerHTML = _cardioPlan.map(function(m, i) {
    if (!m) return ''; // skip stub months
    const isCurrent = i === _currentCardioMonth;
    const isPast = i < _currentCardioMonth;
    return '<div style="padding:10px 12px;border-radius:8px;margin-bottom:8px;background:' + (isCurrent?'#f0fdf4':isPast?'#fafafa':'#f8f9fa') + ';border:1px solid ' + (isCurrent?'#bbf7d0':isPast?'#d1fae5':'var(--border)') + '">' +
      '<div style="font-size:.8rem;font-weight:700;color:' + (isCurrent?'#166534':isPast?'#6b7280':'var(--text-med)') + '">' +
      (isCurrent ? '✅ CURRENT ' : isPast ? '✔️ Done ' : '⏳ ') + m.monthLabel + ': ' + m.phaseLabel +
      '</div></div>';
  }).join("");

  const hrEl = document.getElementById("hrZones");
  const zones = Object.values(cardio.hrZones);
  hrEl.innerHTML = zones.map(z =>
    `<div style="display:flex;justify-content:space-between;padding:8px 10px;border-radius:6px;background:#f8fafb;margin-bottom:6px;font-size:.8rem">
      <span style="font-weight:600;color:var(--primary)">${z.label}</span>
      <span style="color:var(--accent-dark);font-weight:700">${z.range}</span>
    </div>
    <div style="font-size:.72rem;color:var(--text-light);margin:-2px 0 6px 10px">${z.purpose}</div>`
  ).join("");
}

document.addEventListener('DOMContentLoaded', initCardio);

function selectCardioMonth(idx) {
  const m = _cardioPlan[idx];
  if (!m) return; // stub month
  _currentCardioMonth = idx;
  buildCardio();
}
