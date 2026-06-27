const TECHNIQUES = {
  box: {
    name: 'Box Breathing', icon: '⬜', color: '#3b82f6',
    description: 'Stress relief & focus. Inhale, hold, exhale, hold — equal counts.',
    use: 'Stress, focus, pre-meeting',
    phases: [
      { label: 'Inhale', duration: 4, scale: 1.4 },
      { label: 'Hold',   duration: 4, scale: 1.4 },
      { label: 'Exhale', duration: 4, scale: 1.0 },
      { label: 'Hold',   duration: 4, scale: 1.0 }
    ]
  },
  '4-7-8': {
    name: '4-7-8 Breathing', icon: '💤', color: '#8b5cf6',
    description: 'Activates parasympathetic nervous system. Ideal before sleep.',
    use: 'Sleep, anxiety, calming',
    phases: [
      { label: 'Inhale', duration: 4, scale: 1.4 },
      { label: 'Hold',   duration: 7, scale: 1.4 },
      { label: 'Exhale', duration: 8, scale: 1.0 }
    ]
  },
  'wim-hof': {
    name: 'Wim Hof Method', icon: '❄️', color: '#06b6d4',
    description: '30 deep power breaths, then extended exhale hold.',
    use: 'Energy boost, cold exposure prep',
    phases: [
      { label: 'Power Inhale', duration: 2, scale: 1.5 },
      { label: 'Exhale',       duration: 2, scale: 1.0 },
    ]
  },
  diaphragmatic: {
    name: 'Diaphragmatic', icon: '🫁', color: '#10b981',
    description: 'Deep belly breathing. Reduces cortisol, improves oxygen flow.',
    use: 'Relaxation, daily practice',
    phases: [
      { label: 'Belly Inhale', duration: 4, scale: 1.4 },
      { label: 'Exhale',       duration: 6, scale: 1.0 }
    ]
  }
};

let breathState = {
  technique: null,
  cycles: 5,
  moodBefore: 3,
  moodAfter: 3,
  currentCycle: 0,
  currentPhase: 0,
  countdown: 0,
  timer: null,
  startedAt: null,
  durationSeconds: 0
};

function buildBreathingSection() {
  const cards = document.getElementById('technique-cards');
  if (!cards) return;
  cards.innerHTML = Object.entries(TECHNIQUES).map(([key, t]) => `
    <div class="card" style="cursor:pointer;border-top-color:${t.color}" onclick="selectTechnique('${key}')">
      <div class="card-title" style="color:${t.color}">${t.icon} ${t.name}</div>
      <p style="font-size:.82rem;color:var(--text-med);margin-bottom:8px">${t.description}</p>
      <div style="font-size:.75rem;color:var(--text-light)">Best for: ${t.use}</div>
    </div>`).join('');
  loadBreathingHistory();
  loadPranayama();
}

async function loadPranayama() {
  var container = document.getElementById('pranayamaSection');
  if (!container) return;

  var res = await apiFetch('/api/breathing/techniques');
  if (!res.ok || !res.data || !res.data.length) {
    container.innerHTML = '<h3 style="font-size:1rem;font-weight:700;color:#1b4332;margin-bottom:4px">🕉️ Indian Pranayama</h3>' +
      '<p style="color:#6b7280;font-size:.85rem">No pranayama techniques available for your profile.</p>';
    return;
  }

  container.innerHTML = '<h3 style="font-size:1rem;font-weight:700;color:#1b4332;margin-bottom:4px">🕉️ Indian Pranayama</h3>' +
    '<p style="font-size:.82rem;color:#6b7280;margin-bottom:12px">Personalised for your age and health conditions</p>' +
    res.data.map(function(tech) {
      return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div>' +
            '<h4 style="font-weight:700;color:#1b4332;margin:0 0 2px">' + tech.name + '</h4>' +
            '<div style="font-size:.78rem;color:#6b7280">' + tech.sanskrit + ' · ' + tech.aka + '</div>' +
          '</div>' +
          '<div style="font-size:.78rem;background:#f0fdf4;color:#1b4332;padding:3px 8px;border-radius:8px">' + tech.bestTime + '</div>' +
        '</div>' +
        '<div style="margin-top:8px;font-size:.82rem;color:#374151">' +
          '<strong>Benefits:</strong> ' + tech.benefits.slice(0, 2).join(' · ') +
        '</div>' +
        '<div style="margin-top:6px;font-size:.82rem">' +
          '<strong>' + tech.rounds + ' rounds · ' + tech.durationMin + ' min</strong>' +
        '</div>' +
        '<details style="margin-top:8px">' +
          '<summary style="cursor:pointer;font-size:.82rem;color:#1b4332;font-weight:600">How to practise ▸</summary>' +
          '<ol style="margin-top:6px;padding-left:16px">' +
            tech.steps.map(function(s) { return '<li style="margin-bottom:4px;font-size:.82rem">' + s + '</li>'; }).join('') +
          '</ol>' +
        '</details>' +
      '</div>';
    }).join('');
}

function selectTechnique(key) {
  breathState.technique = key;
  const t = TECHNIQUES[key];
  document.getElementById('config-title').textContent = `${t.icon} ${t.name}`;
  document.getElementById('breathing-config').style.display = 'block';
  document.getElementById('breathing-config').scrollIntoView({ behavior: 'smooth' });
}

function cancelBreathingConfig() {
  breathState.technique = null;
  document.getElementById('breathing-config').style.display = 'none';
}

function adjustCycles(delta) {
  breathState.cycles = Math.max(1, Math.min(30, breathState.cycles + delta));
  document.getElementById('cycle-count').textContent = breathState.cycles;
}

function setMoodBefore(val, btn) {
  breathState.moodBefore = val;
  document.querySelectorAll('#mood-before-row .score-btn').forEach((b, i) => b.classList.toggle('sel', i + 1 === val));
}

function setMoodAfter(val, btn) {
  breathState.moodAfter = val;
  document.querySelectorAll('#mood-after-row .score-btn').forEach((b, i) => b.classList.toggle('sel', i + 1 === val));
}

function startBreathingSession() {
  document.getElementById('breathing-config').style.display = 'none';
  document.getElementById('breathing-session').style.display = 'block';
  breathState.currentCycle = 0;
  breathState.currentPhase = 0;
  breathState.startedAt = Date.now();
  runPhase();
}

function runPhase() {
  const t = TECHNIQUES[breathState.technique];
  const phase = t.phases[breathState.currentPhase];
  breathState.countdown = phase.duration;

  const circle = document.getElementById('breath-circle');
  circle.style.transform = `scale(${phase.scale})`;
  document.getElementById('breath-phase').textContent = phase.label;
  document.getElementById('breath-cycle-info').textContent =
    `Round ${breathState.currentCycle + 1} of ${breathState.cycles}`;

  breathState.timer = setInterval(() => {
    document.getElementById('breath-countdown').textContent = breathState.countdown;
    breathState.countdown--;
    if (breathState.countdown < 0) {
      clearInterval(breathState.timer);
      nextPhase();
    }
  }, 1000);
}

function nextPhase() {
  const t = TECHNIQUES[breathState.technique];
  breathState.currentPhase++;
  if (breathState.currentPhase >= t.phases.length) {
    breathState.currentPhase = 0;
    breathState.currentCycle++;
    if (breathState.currentCycle >= breathState.cycles) {
      completeSession();
      return;
    }
  }
  runPhase();
}

function stopBreathingSession() {
  clearInterval(breathState.timer);
  breathState.durationSeconds = Math.floor((Date.now() - breathState.startedAt) / 1000);
  document.getElementById('breathing-session').style.display = 'none';
  showCompletion();
}

function completeSession() {
  breathState.durationSeconds = Math.floor((Date.now() - breathState.startedAt) / 1000);
  document.getElementById('breath-countdown').textContent = '✓';
  document.getElementById('breath-phase').textContent = 'Done!';
  setTimeout(() => {
    document.getElementById('breathing-session').style.display = 'none';
    showCompletion();
  }, 1200);
}

function showCompletion() {
  const t = TECHNIQUES[breathState.technique];
  const mins = Math.floor(breathState.durationSeconds / 60);
  const secs = breathState.durationSeconds % 60;
  document.getElementById('complete-summary').textContent =
    `${t.name} · ${breathState.currentCycle} cycle${breathState.currentCycle !== 1 ? 's' : ''} · ${mins}m ${secs}s`;
  document.getElementById('breathing-complete').style.display = 'block';
}

async function saveBreathingSession() {
  const { ok, data } = await apiFetch('/api/breathing/sessions', {
    method: 'POST',
    body: {
      technique: breathState.technique,
      durationSeconds: breathState.durationSeconds,
      cyclesCompleted: breathState.currentCycle,
      moodBefore: breathState.moodBefore,
      moodAfter: breathState.moodAfter
    }
  });
  if (ok) {
    resetBreathing();
    loadBreathingHistory();
  }
}

function resetBreathing() {
  clearInterval(breathState.timer);
  breathState = { technique: null, cycles: 5, moodBefore: 3, moodAfter: 3, currentCycle: 0, currentPhase: 0, countdown: 0, timer: null, startedAt: null, durationSeconds: 0 };
  document.getElementById('breathing-complete').style.display = 'none';
  document.getElementById('breathing-session').style.display = 'none';
  document.getElementById('breathing-config').style.display = 'none';
  document.getElementById('cycle-count').textContent = '5';
}

async function loadBreathingHistory() {
  const { ok, data: sessions } = await apiFetch('/api/breathing/sessions');
  if (!ok || !sessions) return;
  const el = document.getElementById('breathing-history');
  if (sessions.length === 0) {
    el.innerHTML = '<p style="color:var(--text-light);font-size:.85rem">No sessions yet. Start your first one above.</p>';
    return;
  }
  const thisWeek = sessions.filter(s => {
    const d = new Date(s.completedAt);
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });
  const avgMoodImprove = sessions.filter(s => s.moodBefore && s.moodAfter)
    .reduce((acc, s) => acc + (s.moodAfter - s.moodBefore), 0) /
    (sessions.filter(s => s.moodBefore && s.moodAfter).length || 1);

  el.innerHTML = `
    <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
      <div class="stat-chip" style="border-left-color:var(--info);flex:1;min-width:120px">
        <div class="label">This Week</div>
        <div class="value">${thisWeek.length}</div>
        <div class="sub">sessions</div>
      </div>
      <div class="stat-chip" style="border-left-color:var(--success);flex:1;min-width:120px">
        <div class="label">Avg Mood Lift</div>
        <div class="value">${avgMoodImprove >= 0 ? '+' : ''}${avgMoodImprove.toFixed(1)}</div>
        <div class="sub">mood score delta</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:.82rem">
      <thead><tr style="background:#f8fafb">
        <th style="padding:8px 10px;text-align:left;color:var(--primary);font-size:.76rem;border-bottom:2px solid var(--border)">Date</th>
        <th style="padding:8px 10px;text-align:left;color:var(--primary);font-size:.76rem;border-bottom:2px solid var(--border)">Technique</th>
        <th style="padding:8px 10px;text-align:left;color:var(--primary);font-size:.76rem;border-bottom:2px solid var(--border)">Duration</th>
        <th style="padding:8px 10px;text-align:left;color:var(--primary);font-size:.76rem;border-bottom:2px solid var(--border)">Mood</th>
      </tr></thead>
      <tbody>${sessions.map(s => {
        const t = TECHNIQUES[s.technique] || {};
        const mins = Math.floor((s.durationSeconds || 0) / 60);
        const secs = (s.durationSeconds || 0) % 60;
        const moodDelta = s.moodBefore && s.moodAfter ? s.moodAfter - s.moodBefore : null;
        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid var(--border)">${new Date(s.completedAt).toLocaleDateString()}</td>
          <td style="padding:8px 10px;border-bottom:1px solid var(--border)">${t.icon || ''} ${t.name || s.technique}</td>
          <td style="padding:8px 10px;border-bottom:1px solid var(--border)">${mins}m ${secs}s · ${s.cyclesCompleted} cycles</td>
          <td style="padding:8px 10px;border-bottom:1px solid var(--border)">${s.moodBefore || '—'} → ${s.moodAfter || '—'}${moodDelta !== null ? ` <span style="color:${moodDelta > 0 ? '#166534' : moodDelta < 0 ? '#991b1b' : '#718096'}">(${moodDelta > 0 ? '+' : ''}${moodDelta})</span>` : ''}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}
