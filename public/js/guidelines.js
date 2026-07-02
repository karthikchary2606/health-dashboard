// Guidelines rendering — fully profile-driven.
// Populates: #goalGuidelines, #conditionCards, #seedTracker, #suppTiming, #foodGuidelines, #groceryNote

const GOAL_GUIDELINES = {
  'weight-loss': {
    title: '🔥 Weight Loss Strategy',
    color: '#fef3c7',
    border: '#fde68a',
    titleColor: '#92400e',
    tips: [
      'Maintain a <strong>300–500 kcal daily deficit</strong> — crash diets spike cortisol and kill muscle.',
      'Eat <strong>protein with every meal</strong> (30–40g target per meal) — preserves lean mass during fat loss.',
      'Cardio <em>after</em> strength training burns more fat — glycogen is depleted so the body taps fat immediately.',
      'Sleep <strong>7–8 hours</strong> — ghrelin spikes on poor sleep, killing satiety and triggering cravings.',
      'Weigh yourself <strong>weekly</strong> (same day, same time) — daily weight fluctuates by 1–2 kg due to water.',
    ],
    metric: function(p) {
      if (p && p.goalWeightKg && p.currentWeightKg) {
        var diff = Math.abs(p.currentWeightKg - p.goalWeightKg).toFixed(1);
        return '🎯 Target: ' + p.goalWeightKg + ' kg · Currently: ' + p.currentWeightKg + ' kg · ' + diff + ' kg to go';
      }
      return null;
    },
  },
  'muscle-gain': {
    title: '💪 Muscle Building Strategy',
    color: '#eff6ff',
    border: '#bfdbfe',
    titleColor: '#1e40af',
    tips: [
      'Protein target: <strong>1.6–2.2g per kg of bodyweight</strong> daily — this is the proven anabolic ceiling.',
      '<strong>Progressive overload</strong> is the only driver of hypertrophy — add load or reps every week.',
      'Eat a <strong>200–300 kcal surplus</strong> — more than this builds fat, not extra muscle.',
      'Sleep <strong>8 hours minimum</strong> — 70% of growth hormone is released during deep sleep.',
      'Pre-workout meal: <strong>complex carbs + protein</strong> 1.5–2 hours before training for sustained energy.',
    ],
    metric: function(p) {
      if (p && p.currentWeightKg) {
        return '🥩 Daily protein target: ' + Math.round(p.currentWeightKg * 1.8) + 'g (' + p.currentWeightKg + ' kg × 1.8g)';
      }
      return null;
    },
  },
  'maintenance': {
    title: '⚖️ Maintenance Strategy',
    color: '#f0fdf4',
    border: '#bbf7d0',
    titleColor: '#166534',
    tips: [
      'Caloric maintenance: <strong>energy in = energy out</strong>. Track for 2 weeks to find your true TDEE.',
      'Vary your training stimulus <strong>every 4–6 weeks</strong> to prevent adaptation and plateau.',
      'Prioritise <strong>sleep and recovery</strong> — long-term maintenance is about sustainability, not heroics.',
      'Body recomposition is possible at maintenance: lose fat AND gain muscle simultaneously.',
      'Monthly check-in: assess energy levels, strength, and how clothes fit — not just scale weight.',
    ],
    metric: function(p) {
      if (p && p.dailyCalorieTarget) {
        return '⚡ Your estimated maintenance: ~' + p.dailyCalorieTarget + ' kcal/day';
      }
      return null;
    },
  },
  'general-fitness': {
    title: '🏃 General Fitness Strategy',
    color: '#faf5ff',
    border: '#e9d5ff',
    titleColor: '#6b21a8',
    tips: [
      '<strong>Consistency beats intensity</strong> — 3 moderate sessions per week outperforms sporadic extreme workouts.',
      'Mix <strong>cardio + resistance training</strong> for optimal cardiovascular health and metabolic rate.',
      'Hydration: minimum <strong>8 glasses/day</strong>, more on training days and hot weather.',
      '<strong>10,000 steps daily</strong> is a proven baseline for cardiovascular health — use a step counter.',
      '10 min of <strong>stretching or flexibility work</strong> prevents injury and improves movement quality.',
    ],
    metric: function(p) {
      return null;
    },
  },
};

function renderGoalGuidelines(profile) {
  var el = document.getElementById('goalGuidelines');
  if (!el) return;
  var goal = profile && profile.primaryGoal;
  var g = GOAL_GUIDELINES[goal] || GOAL_GUIDELINES['general-fitness'];
  var metricLine = g.metric(profile);
  el.innerHTML =
    '<div style="background:' + g.color + ';border:1px solid ' + g.border + ';border-radius:10px;padding:14px 16px">' +
      '<div style="font-weight:700;font-size:.95rem;color:' + g.titleColor + ';margin-bottom:10px">' + g.title + '</div>' +
      '<ul style="padding-left:16px;margin:0 0 8px;font-size:.82rem;color:var(--text-med)">' +
        g.tips.map(function(t) { return '<li style="margin-bottom:6px">' + t + '</li>'; }).join('') +
      '</ul>' +
      (metricLine ? '<div style="font-size:.8rem;font-weight:600;color:' + g.titleColor + ';padding:6px 10px;background:rgba(0,0,0,.04);border-radius:6px;margin-top:6px">' + metricLine + '</div>' : '') +
    '</div>';
}

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

const CONDITION_CARDS = {
  thyroid: {
    cls: 'danger',
    title: '🔴 Thyroid Disorder (Hypothyroid)',
    items: [
      'Take thyroid medication at <strong>06:30 AM</strong> on empty stomach · Wait 45–60 min before eating',
      '<strong>Zero Soy/Soya</strong> — blocks hormone absorption (soy milk, tofu, soya chunks all avoided)',
      'Cruciferous vegetables (cauliflower, broccoli, cabbage) — <strong>ALWAYS fully steamed/cooked</strong> to deactivate goitrogens',
      'High selenium foods encouraged: eggs, brazil nuts (1–2/day max)',
      'Recheck thyroid levels every 3 months as advised by your doctor'
    ]
  },
  diabetes: {
    cls: 'warning',
    title: '🟡 Diabetes Management',
    items: [
      '<strong>Zero refined sugars</strong> — avoid jaggery, glucose syrups, sweetened beverages',
      'Prefer low-GI foods: oats, millets, legumes, non-starchy vegetables',
      'Eat every 3–4 hours — avoid long fasting windows that cause blood sugar spikes',
      'Monitor blood glucose as directed by your doctor',
      'Include fibre with every meal to slow glucose absorption'
    ]
  },
  hypertension: {
    cls: 'warning',
    title: '🟠 Hypertension Management',
    items: [
      'Limit sodium to <strong>&lt;2,300mg/day</strong> — avoid processed foods, pickles, papad',
      'DASH diet principles: fruits, vegetables, whole grains, low-fat dairy',
      'Limit caffeine and alcohol',
      'Daily 30-min moderate aerobic activity (walking, cycling) is highly effective',
      'Monitor blood pressure regularly; take medications as prescribed'
    ]
  },
  'lower-back-pain': {
    cls: '',
    style: 'border-top-color:#3b82f6',
    title: '🔵 Lower Back Pain (Mechanical LBP)',
    items: [
      'No heavy axial loading — barbell back squats &amp; conventional deadlifts avoided',
      'Core stability work (Cat-Cow, Bird-Dog, Dead Bug) before every gym session',
      'Sleep posture: side-lying with pillow between knees recommended',
      'Desk setup: monitor at eye level, lumbar-supported chair',
      'Glute activation (bridges) daily — weak glutes are the primary driver of mechanical LBP'
    ]
  }
};

function buildGenericSchedule(profile) {
  const goal = profile && profile.primaryGoal;
  const _conds = (profile && profile.healthConditions || []).map(c => (typeof c === 'object' && c !== null) ? c.name : c);
  const hasThyroid = profile && _conds.includes('thyroid');
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

var COMMUNITY_NOTES = {
  'Telugu': [
    '🌿 <strong>Ragi (finger millet)</strong> is highly recommended — rich in calcium and fibre. Use for rotis or porridge.',
    '🌿 <strong>Gongura (sorrel leaves)</strong> are iron-rich and support anaemia prevention — include 2-3x/week.',
    '🌿 <strong>Raw turmeric</strong> (fresh Haridra) in morning milk or tea supports inflammation reduction.',
    '🌿 <strong>Neem leaves</strong> — 5-6 leaves on empty stomach weekly supports blood sugar and skin.',
    '🌿 Prefer <strong>cold-pressed coconut oil or sesame oil (gingelly oil)</strong> over refined oils.'
  ],
  'Tamil': [
    '🌿 <strong>Kollu (horse gram)</strong> — high protein legume; include weekly for weight management.',
    '🌿 <strong>Sesame seeds (til)</strong> — excellent calcium source; add to rice, ladoo, or chutney.',
    '🌿 <strong>Moringa (murungai keerai)</strong> leaves — exceptionally high in iron, calcium, Vitamin C.',
    '🌿 Prefer <strong>gingelly oil (sesame oil)</strong> for cooking — heart-healthy monounsaturated fats.'
  ],
  'Kannada': [
    '🌿 <strong>Ragi (Raagi)</strong> is the staple grain of Karnataka — excellent for bone health and weight management.',
    '🌿 <strong>Bisi bele bath</strong> with ghee — complete protein + carb meal; ideal post-workout.',
    '🌿 Prefer <strong>coconut oil</strong> for coastal Karnataka cooking and <strong>groundnut oil</strong> for northern Karnataka.'
  ],
  'Malayalam': [
    '🌿 <strong>Coconut</strong> (fresh, coconut milk, coconut oil) is central to Kerala cuisine and provides healthy MCTs.',
    '🌿 <strong>Moringa (muringakka)</strong> and <strong>drumstick</strong> are dietary staples; include regularly.',
    '🌿 <strong>Fish</strong> (especially sardines and mackerel) — omega-3 rich; 3-4x/week recommended.'
  ]
};

function renderConditionCards(profile) {
  const cardEl = document.getElementById('conditionCards');
  if (!cardEl) return;

  // Only show cards for active conditions (strings are always active; objects need active !== false)
  const activeConditionNames = (profile ? (profile.healthConditions || []) : [])
    .filter(c => typeof c === 'string' || c.active !== false)
    .map(c => (typeof c === 'string' ? c : c.name).toLowerCase());

  const cardsToShow = Object.entries(CONDITION_CARDS).filter(([key]) =>
    activeConditionNames.some(ac => ac.includes(key) || key.includes(ac))
  );

  if (cardsToShow.length > 0) {
    cardEl.innerHTML = cardsToShow.map(([key, c]) => {
      const styleAttr = c.style ? ` style="${c.style}"` : '';
      return `<div class="card ${c.cls}"${styleAttr}>
        <div class="card-title">${c.title}</div>
        <ul style="padding-left:18px;font-size:.83rem;color:var(--text-med)">
          ${c.items.map(i => `<li style="margin-bottom:6px">${i}</li>`).join('')}
        </ul>
      </div>`;
    }).join('');
  } else {
    cardEl.innerHTML = `<div class="card" style="border-top-color:#6b7280">
      <div class="card-title">✅ No Active Health Conditions</div>
      <p style="font-size:.83rem;color:var(--text-light)">
        Great news — no active health conditions on record. If you have any, 
        <a href="settings.html" style="color:var(--primary)">add them in Settings</a> to get personalised guardrails.
      </p>
    </div>`;
  }

  // Update subtitle to reflect active conditions
  const subtitleEl = document.getElementById('guidelinesSubtitle');
  if (subtitleEl) {
    const labels = cardsToShow.map(([, c]) => c.title.replace(/^[^\s]+\s/, '').split('(')[0].trim());
    subtitleEl.textContent = labels.length
      ? `Clinical guardrails · ${labels.join(', ')}`
      : 'Clinical guardrails · Your personal health protocols';
  }
}

function renderCommunityNotes(profile) {
  const container = document.getElementById('communityNotes');
  if (!container) return;
  const community = profile && profile.languageCommunity;
  const notes = COMMUNITY_NOTES[community];
  if (!notes || !notes.length) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  container.innerHTML =
    `<h4 style="font-weight:700;margin-bottom:8px">🍽️ ${community} Community Nutritional Tips</h4>` +
    `<ul style="padding-left:16px">` +
    notes.map(n => `<li style="margin-bottom:6px;font-size:.85rem">${n}</li>`).join('') +
    `</ul>`;
}

function buildGuidelines(profile) {
  const conditions = (profile ? (profile.healthConditions || []) : [])
    .filter(c => typeof c === 'string' || c.active !== false)
    .map(c => (typeof c === 'object' && c !== null) ? c.name : c);
  const dietType   = profile ? (profile.dietType || 'non-vegetarian') : 'non-vegetarian';

  renderGoalGuidelines(profile);
  renderConditionCards(profile);
  renderCommunityNotes(profile);

  // Food guidelines — based on dietType + health conditions
  const foodEl = document.getElementById('foodGuidelines');
  if (foodEl) {
    const eatList  = ['Eggs (all forms)', 'Paneer (full fat)', 'Ghee, Butter', 'Coconut oil/milk', 'Leafy greens', 'Cucumber, Zucchini', 'Bell peppers', 'Nuts & seeds', 'Green tea'];
    const avoidList = ['Sugar & sweetened drinks', 'Processed / packaged snacks', 'Refined seed oils', 'Alcohol'];

    if (dietType === 'vegan') {
      eatList.splice(0, 2, 'Tofu / Tempeh', 'Legumes, lentils', 'Oat milk, Almond milk');
      avoidList.push('All animal products (meat, eggs, dairy)');
    } else if (dietType === 'vegetarian') {
      eatList.splice(0, 1);
      avoidList.push('Meat, Fish, Poultry');
    } else if (dietType === 'eggetarian') {
      avoidList.push('Meat, Fish, Poultry');
    } else {
      eatList.unshift('Chicken / Fish / Eggs');
    }

    if (conditions.includes('thyroid')) {
      avoidList.unshift('ALL soy products (tofu, soya chunks, soy milk)');
      avoidList.push('Raw cruciferous vegetables (cook them fully)');
    }
    if (conditions.includes('diabetes') || conditions.includes('hypertension')) {
      avoidList.push('High-GI foods: white rice, white bread, fruit juices');
    }
    if (conditions.includes('hypertension')) {
      avoidList.push('High-sodium foods: pickles, papad, processed meats');
    }

    foodEl.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div>
        <div style="font-size:.78rem;font-weight:700;color:#166534;margin-bottom:8px">✅ EAT FREELY</div>
        <ul style="padding-left:14px;font-size:.78rem;color:var(--text-med)">
          ${eatList.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>
      <div>
        <div style="font-size:.78rem;font-weight:700;color:#991b1b;margin-bottom:8px">⚠️ LIMIT / AVOID</div>
        <ul style="padding-left:14px;font-size:.78rem;color:var(--text-med)">
          ${avoidList.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>
    </div>`;
  }

  // Grocery note — only show thyroid rules when user has thyroid condition
  const groceryNoteEl = document.getElementById('groceryNote');
  if (groceryNoteEl) {
    if (conditions.includes('thyroid')) {
      groceryNoteEl.className = 'thyroid-note';
      groceryNoteEl.innerHTML = '🔬 <strong>Thyroid Shopping Rules:</strong> Always buy iodized salt. Choose full-fat paneer. Buy eggs in bulk. ALL cruciferous veg must be cooked, never raw. Ghee preferred over refined oils. <strong>Zero soy products.</strong>';
    } else {
      groceryNoteEl.innerHTML = '';
    }
  }

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
