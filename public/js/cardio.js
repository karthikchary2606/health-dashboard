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

  // Current phase banner — dynamic
  const phaseEl = document.getElementById("cardioCurrentPhase");
  if (phaseEl) {
    const phaseTitle = cardio.phaseLabel || cardio.monthLabel || 'Month ' + (_currentCardioMonth + 1);
    const phaseDesc  = cardio.description || '';
    phaseEl.innerHTML = `<div class="phase-card">
      <h3>🏃 ${phaseTitle}</h3>
      ${phaseDesc ? `<p>${phaseDesc}</p>` : ''}
      <span class="phase-badge">CURRENT PHASE</span>
    </div>`;
  }

  // Session table — handle both weight-loss (r.session) and stub templates (r.type)
  const tbody = document.getElementById("cardioTableBody");
  tbody.innerHTML = cardio.sessions.map(r => {
    const sessionName = r.session || r.type || '—';
    const duration    = r.duration ? r.duration + (typeof r.duration === 'number' ? ' min' : '') : '—';
    const intensity   = r.intensity || '—';
    const notes       = r.notes || r.mode || '';
    return `<tr>
      <td><strong>${r.day}</strong></td>
      <td>${sessionName}${notes ? `<br><small style="color:var(--text-light)">${notes}</small>` : ''}</td>
      <td>${duration}</td>
      <td>${intensity}</td>
    </tr>`;
  }).join("");

  // Phase progression
  const phasesEl = document.getElementById("cardioPhases");
  phasesEl.innerHTML = _cardioPlan.map(function(m, i) {
    if (!m) return '';
    const isCurrent = i === _currentCardioMonth;
    const isPast = i < _currentCardioMonth;
    const label = m.phaseLabel || m.monthLabel || 'Month ' + (i + 1);
    return '<div style="padding:10px 12px;border-radius:8px;margin-bottom:8px;background:' + (isCurrent?'#f0fdf4':isPast?'#fafafa':'#f8f9fa') + ';border:1px solid ' + (isCurrent?'#bbf7d0':isPast?'#d1fae5':'var(--border)') + '">' +
      '<div style="font-size:.8rem;font-weight:700;color:' + (isCurrent?'#166534':isPast?'#6b7280':'var(--text-med)') + '">' +
      (isCurrent ? '✅ CURRENT ' : isPast ? '✔️ Done ' : '⏳ ') + (m.monthLabel || 'Month '+(i+1)) + ': ' + label +
      '</div></div>';
  }).join("");

  // HR zones — handle both string values and object values
  const hrEl = document.getElementById("hrZones");
  if (cardio.hrZones) {
    const zoneEntries = Object.entries(cardio.hrZones);
    const zoneLabels = { warmup: 'Warm-up', fat_burn: 'Fat Burn', cardio: 'Cardio', peak: 'Peak' };
    hrEl.innerHTML = zoneEntries.map(([key, val]) => {
      const label = zoneLabels[key] || key;
      const display = typeof val === 'string' ? val : (val.range || JSON.stringify(val));
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:6px;background:#f8fafb;margin-bottom:6px;font-size:.8rem">
        <span style="font-weight:600;color:var(--primary)">${label}</span>
        <span style="color:var(--accent-dark);font-weight:700">${display}</span>
      </div>`;
    }).join("");
  }
}

document.addEventListener('DOMContentLoaded', initCardio);

function selectCardioMonth(idx) {
  const m = _cardioPlan[idx];
  if (!m) return; // stub month
  _currentCardioMonth = idx;
  buildCardio();
}
