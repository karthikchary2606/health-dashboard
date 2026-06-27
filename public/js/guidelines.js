// Guidelines rendering — profile-driven, no hardcoded medications or personal health protocols.
// Populates: #seedTracker (generic seeds), #suppTiming (medications + generic schedule).

const SEEDS = [
  { name: 'Pumpkin Seeds',    daily: 8,  note: 'Rich in magnesium, zinc, and healthy fats' },
  { name: 'Sunflower Seeds',  daily: 5,  note: 'Vitamin E + selenium — antioxidant support' },
  { name: 'Flax Seeds',       daily: 5,  note: 'Grind before eating — best plant omega-3 source' },
  { name: 'White Sesame',     daily: 4,  note: 'Calcium + zinc for bone and immune health' },
  { name: 'Watermelon Seeds', daily: 4,  note: 'Magnesium + iron — good for energy metabolism' },
  { name: 'Almonds',          daily: 2,  note: 'Vitamin E + monounsaturated fats' },
  { name: 'Walnuts',          daily: 1,  note: 'Best omega-3 nut for brain and heart health' },
  { name: 'Pistachios',       daily: 1,  note: 'L-arginine for circulation + gut-friendly fibre' }
];

function buildGenericSchedule(profile) {
  const goal = profile && profile.primaryGoal;
  const hasThyroid = profile && (profile.healthConditions || []).includes('thyroid');
  const isActive = profile && (profile.fitnessLevel === 'intermediate' || profile.fitnessLevel === 'advanced');

  const schedule = [];

  if (hasThyroid) {
    schedule.push({
      time: '06:30 AM',
      item: 'Thyroid Medication',
      note: 'Take on empty stomach as prescribed. Wait 45–60 min before eating.'
    });
  }

  schedule.push({
    time: hasThyroid ? '07:30 AM' : '07:00 AM',
    item: 'Warm water (optional: 1 tsp ACV)',
    note: 'Kickstarts digestion and hydration.'
  });

  if (goal === 'muscle-gain' || isActive) {
    schedule.push({
      time: '08:30 AM',
      item: 'Pre-workout snack',
      note: 'Banana + nuts or oats 30–45 min before training.'
    });
  }

  schedule.push({
    time: '04:30 PM',
    item: 'Seed mix + Green Tea',
    note: 'Anti-inflammatory snack window — see seed tracker below.'
  });

  schedule.push({
    time: '08:30 PM',
    item: 'Chamomile / Herbal Tea',
    note: 'Wind-down routine — supports sleep quality and recovery.'
  });

  return schedule;
}

function renderMedications(medications) {
  const suppEl = document.getElementById('suppTiming');
  if (!suppEl) return;

  let html = '';

  if (medications && medications.length > 0) {
    html += `<div style="margin-bottom:10px;font-size:.78rem;font-weight:700;color:var(--text-light)">YOUR MEDICATIONS</div>`;
    html += medications.map(med => {
      const name = med.name || med;
      const dosage = med.dosage ? ` ${med.dosage}` : '';
      const timing = med.timing || 'as directed';
      return `<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--border);align-items:flex-start">
        <span style="min-width:72px;font-size:.78rem;font-weight:700;color:#dc2626">💊 Rx</span>
        <div><div style="font-size:.85rem;font-weight:600;color:var(--text)">${name}${dosage}</div><div style="font-size:.75rem;color:var(--text-light)">${timing}</div></div>
      </div>`;
    }).join('');
    html += `<div style="margin:10px 0 14px;padding:8px;background:#fef2f2;border-radius:6px;font-size:.75rem;color:#991b1b">
      Always take medications exactly as prescribed. Consult your doctor before any changes.
    </div>`;
  } else {
    html += `<div style="padding:10px 0;font-size:.83rem;color:var(--text-light);font-style:italic">
      No medications logged. <a href="settings.html" style="color:var(--primary)">Add from Settings.</a>
    </div>`;
  }

  suppEl.innerHTML = html;
}

function renderSchedule(profile) {
  const suppEl = document.getElementById('suppTiming');
  if (!suppEl) return;

  const schedule = buildGenericSchedule(profile);
  const scheduleHtml = `
    <div style="margin-top:10px;font-size:.78rem;font-weight:700;color:var(--text-light);margin-bottom:4px">DAILY SCHEDULE</div>
    ${schedule.map(s => `
      <div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--border);align-items:flex-start">
        <span style="min-width:72px;font-size:.78rem;font-weight:700;color:var(--primary)">${s.time}</span>
        <div><div style="font-size:.85rem;font-weight:600;color:var(--text)">${s.item}</div><div style="font-size:.75rem;color:var(--text-light)">${s.note}</div></div>
      </div>`).join('')}
  `;

  suppEl.innerHTML += scheduleHtml;
}

function buildGuidelines(profile) {
  // Seeds tracker
  const seedEl = document.getElementById('seedTracker');
  if (seedEl) {
    let totalDaily = 0;
    seedEl.innerHTML = SEEDS.map(s => {
      totalDaily += s.daily;
      const stockDays = Math.floor(250 / s.daily);
      return `<div class="seed-bar-wrap">
        <div class="seed-label"><span>${s.name} (${s.daily}g/day)</span><span style="color:var(--text-light)">~${stockDays}d stock · ${s.note}</span></div>
        <div class="seed-bar"><div class="seed-fill" style="width:${(s.daily / 30) * 100}%"></div></div>
      </div>`;
    }).join('') + `<div style="margin-top:10px;font-size:.8rem;font-weight:700;color:var(--primary)">Total: ${totalDaily}g/day ✅ (within 30g cap)</div>`;
  }

  // Medications + schedule in suppTiming
  renderMedications(profile ? (profile.medications || []) : []);
  renderSchedule(profile);
}

async function initGuidelines() {
  try {
    if (typeof initAuth === 'function') await initAuth();
    await window.planCache.getPlan();
    const profile = window.currentUser && window.currentUser.profile;
    buildGuidelines(profile);
  } catch (e) {
    console.error('Guidelines init error:', e);
    buildGuidelines(null);
  }
}

document.addEventListener('DOMContentLoaded', initGuidelines);
