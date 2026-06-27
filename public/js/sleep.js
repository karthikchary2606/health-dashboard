// public/js/sleep.js
'use strict';

const QUALITY_EMOJIS = ['', '😩', '😴', '😐', '😊', '🤩'];
const GOAL_MINUTES = 450; // 7.5h

let _chart = null;
let _selectedQuality = 0;

function minutesToHM(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function calcDurationFromInputs() {
  const bed = document.getElementById('bedtime').value;
  const wake = document.getElementById('wakeTime').value;
  const display = document.getElementById('durationDisplay');
  if (!bed || !wake) { display.textContent = ''; return; }

  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins < bedMins) wakeMins += 1440; // overnight
  const dur = wakeMins - bedMins;
  display.textContent = minutesToHM(dur);
  display.style.color = dur >= GOAL_MINUTES ? '#16a34a' : '#dc2626';
}

function selectQuality(val) {
  _selectedQuality = val;
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    const active = parseInt(btn.dataset.val) === val;
    btn.style.opacity = active ? '1' : '0.35';
    btn.style.transform = active ? 'scale(1.25)' : 'scale(1)';
  });
}

async function saveSleep() {
  const date = document.getElementById('sleepDate').value;
  const bedtime = document.getElementById('bedtime').value || undefined;
  const wakeTime = document.getElementById('wakeTime').value || undefined;
  const manualHours = parseFloat(document.getElementById('manualHours').value);
  const notes = document.getElementById('sleepNotes').value.trim();

  const body = { date, quality: _selectedQuality || undefined, notes };

  if (bedtime && wakeTime) {
    body.bedtime = bedtime;
    body.wakeTime = wakeTime;
  } else if (manualHours > 0) {
    body.durationMinutes = Math.round(manualHours * 60);
  } else {
    showToast('Enter bedtime + wake time, or total hours');
    return;
  }

  const res = await apiFetch('/api/sleep', { method: 'POST', body });
  if (res.ok) {
    showToast('Sleep logged ✓');
    await loadAll();
  } else {
    showToast('Failed to save — try again');
  }
}

async function loadAll() {
  const [histRes, statsRes] = await Promise.all([
    apiFetch('/api/sleep/history'),
    apiFetch('/api/sleep/stats')
  ]);

  const history = histRes.ok ? histRes.data : [];
  const stats = statsRes.ok ? statsRes.data : {};
  const enough = history.length >= 3;

  // insight cards
  document.getElementById('statAvgHours').textContent =
    enough ? minutesToHM(stats.avgDurationMinutes) : '—';
  document.getElementById('statGoalNights').textContent =
    enough ? `${stats.goalNightsThisWeek}/7` : '—';
  document.getElementById('statAvgQuality').textContent =
    enough ? (QUALITY_EMOJIS[Math.round(stats.avgQuality)] || '—') : '—';
  document.getElementById('statStreak').textContent =
    history.length > 0 ? `${stats.currentStreak}🔥` : '—';

  renderChart(history);
  renderTable(history);
}

function renderChart(history) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${mo}-${dy}`);
  }
  const dayNames = days.map(dateStr => {
    const [y, mo, dy] = dateStr.split('-').map(Number);
    return new Date(y, mo - 1, dy).toLocaleDateString('en-IN', { weekday: 'short' });
  });

  const entryMap = {};
  history.forEach(e => { entryMap[e.date] = e; });

  const durations = days.map(d => {
    const e = entryMap[d];
    return e ? +(e.durationMinutes / 60).toFixed(1) : 0;
  });
  const colors = days.map(d => {
    const e = entryMap[d];
    if (!e) return '#e2e8f0';
    return e.durationMinutes >= GOAL_MINUTES ? '#22c55e' : '#6366f1';
  });

  const ctx = document.getElementById('sleepChart').getContext('2d');
  if (_chart) _chart.destroy();
  _chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dayNames,
      datasets: [{
        data: durations,
        backgroundColor: colors,
        borderRadius: 4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0, max: 10,
          ticks: { callback: v => `${v}h` }
        }
      }
    }
  });
}

function renderTable(history) {
  const tbody = document.getElementById('sleepTableBody');
  const empty = document.getElementById('sleepTableEmpty');
  if (!history.length) {
    tbody.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = history.slice(0, 7).map(e => {
    const [y, mo, dy] = e.date.split('-').map(Number);
    const dateLabel = new Date(y, mo - 1, dy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `<tr>
      <td>${dateLabel}</td>
      <td>${minutesToHM(e.durationMinutes)}</td>
      <td style="font-size:1.2rem">${QUALITY_EMOJIS[e.quality] || '—'}</td>
      <td style="color:#94a3b8;font-size:.85rem">${e.notes || '—'}</td>
    </tr>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initAuth();

    // Default date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const mo = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dy = String(yesterday.getDate()).padStart(2, '0');
    document.getElementById('sleepDate').value = `${y}-${mo}-${dy}`;

    document.getElementById('bedtime').addEventListener('input', calcDurationFromInputs);
    document.getElementById('wakeTime').addEventListener('input', calcDurationFromInputs);

    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => selectQuality(parseInt(btn.dataset.val)));
    });

    document.getElementById('saveSleepBtn').addEventListener('click', saveSleep);

    await loadAll();
  } catch (e) {
    console.error('Sleep init error:', e);
  }
});
