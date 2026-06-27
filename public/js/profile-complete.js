'use strict';

let _profile = {};

async function loadProfile() {
  const [profRes, checklistRes] = await Promise.all([
    apiFetch('/api/profile'),
    apiFetch('/api/profile/food-checklist')
  ]);
  if (!profRes.ok) { window.location = '/login.html'; return; }
  _profile = profRes.data;

  populateCuisineEquipment();
  populateWorkoutPrefs();
  populateConditionReview();
  populateMedicationReview();
  populateReviewPrefs();

  if (checklistRes.ok) renderFoodChecklist(checklistRes.data);
  updateCompletionBar();
}

function populateCuisineEquipment() {
  const cuisine = document.getElementById('cuisinePreference');
  if (cuisine && _profile.cuisinePreference) cuisine.value = _profile.cuisinePreference;
  (_profile.equipmentAvailable || []).forEach(val => {
    const cb = document.querySelector(`#equipmentGroup input[value="${val}"]`);
    if (cb) { cb.checked = true; cb.closest('.check-option').classList.add('selected'); }
  });
}

function populateWorkoutPrefs() {
  (_profile.workoutPreferences || []).forEach(val => {
    const cb = document.querySelector(`#workoutPrefGroup input[value="${val}"]`);
    if (cb) { cb.checked = true; cb.closest('.check-option').classList.add('selected'); }
  });
  const days = document.getElementById('workoutDays');
  if (days && _profile.workoutDaysPerWeek) days.value = _profile.workoutDaysPerWeek;
  const time = document.getElementById('workoutTime');
  if (time && _profile.workoutTime) time.value = _profile.workoutTime;
  const yoga = document.getElementById('yogaStyle');
  if (yoga && _profile.yogaStyle) yoga.value = _profile.yogaStyle;
}

function populateConditionReview() {
  const container = document.getElementById('conditionReview');
  if (!container) return;
  const conditions = _profile.healthConditions || [];
  if (conditions.length === 0) {
    container.innerHTML = '<p style="color:#6b7280">No health conditions recorded.</p>';
    return;
  }
  container.innerHTML = conditions.map((c, i) => `
    <div class="review-item" id="cond-${i}">
      <span class="review-name">${escHtml(c.name)}</span>
      <label class="toggle-label">
        <input type="checkbox" id="cond-active-${i}" ${c.active ? 'checked' : ''}
          onchange="toggleCondition(${i}, this.checked)">
        <span>${c.active ? '🟢 Active' : '✅ Resolved'}</span>
      </label>
      ${!c.active ? `<input type="date" id="cond-date-${i}" value="${c.resolvedAt ? c.resolvedAt.slice(0,10) : ''}" style="margin-left:8px">` : ''}
    </div>
  `).join('');
}

function toggleCondition(idx, active) {
  const item = document.getElementById(`cond-${idx}`);
  const span = item.querySelector('label.toggle-label span');
  span.textContent = active ? '🟢 Active' : '✅ Resolved';
  const existing = item.querySelector(`#cond-date-${idx}`);
  if (!active && !existing) {
    const d = document.createElement('input');
    d.type = 'date'; d.id = `cond-date-${idx}`; d.style.marginLeft = '8px';
    d.value = new Date().toISOString().slice(0,10);
    item.appendChild(d);
  } else if (active && existing) {
    existing.remove();
  }
}

function populateMedicationReview() {
  const container = document.getElementById('medicationReview');
  if (!container) return;
  const meds = _profile.medications || [];
  if (meds.length === 0) {
    container.innerHTML = '<p style="color:#6b7280">No medications recorded.</p>';
    return;
  }
  container.innerHTML = meds.map((m, i) => `
    <div class="review-item" id="med-${i}">
      <span class="review-name">${escHtml(m.name)}${m.dosage ? ' — ' + escHtml(m.dosage) : ''}</span>
      <label class="toggle-label">
        <input type="checkbox" id="med-active-${i}" ${m.active ? 'checked' : ''}
          onchange="toggleMed(${i}, this.checked)">
        <span>${m.active ? '🟢 Active' : '✅ Resolved'}</span>
      </label>
    </div>
  `).join('');
}

function toggleMed(idx, active) {
  const span = document.querySelector(`#med-${idx} label.toggle-label span`);
  if (span) span.textContent = active ? '🟢 Active' : '✅ Resolved';
}

function populateReviewPrefs() {
  const sel = document.getElementById('reviewReminderDays');
  if (sel && _profile.reviewReminderDays) sel.value = _profile.reviewReminderDays;
}

function renderFoodChecklist(data) {
  const container = document.getElementById('foodChecklist');
  if (!container) return;
  const userFoodSet = new Set((_profile.foodList || []).map(f => f.name));

  container.innerHTML = data.map(({ category, items }) => {
    const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
    const itemsHtml = items.map(item => {
      const checked = userFoodSet.has(item.name) || item.preSelected;
      const safeVal = item.name.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      return `<label class="food-item${checked ? ' selected' : ''}">
        <input type="checkbox" value="${safeVal}" data-category="${category}"
          ${checked ? 'checked' : ''}
          onchange="this.closest('.food-item').classList.toggle('selected', this.checked)">
        ${escHtml(item.name)}
      </label>`;
    }).join('');

    return `<details class="food-category" open>
      <summary>${catLabel}</summary>
      <div class="food-items" id="food-cat-${category}">
        ${itemsHtml}
        <div style="margin-top:6px">
          <input type="text" class="custom-food-input" placeholder="Add custom…" style="font-size:.8rem;padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px;width:60%">
          <button type="button" onclick="addCustomFood(this,'${category}')" class="btn-small">+</button>
        </div>
      </div>
    </details>`;
  }).join('');
}

function addCustomFood(btn, category) {
  const input = btn.previousElementSibling;
  const name = input.value.trim();
  if (!name) return;
  const container = document.getElementById(`food-cat-${category}`);
  const label = document.createElement('label');
  label.className = 'food-item selected';
  const safeVal = name.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  label.innerHTML = `<input type="checkbox" value="${safeVal}" data-category="${category}" checked
    onchange="this.closest('.food-item').classList.toggle('selected', this.checked)">
    ${escHtml(name)} <em style="font-size:.7rem;color:#9ca3af">(custom)</em>`;
  container.insertBefore(label, container.lastElementChild);
  input.value = '';
}

function updateCompletionBar() {
  apiFetch('/api/profile/completion').then(res => {
    if (!res.ok) return;
    const pct = res.data.percentage;
    const bar = document.getElementById('completionBar');
    const label = document.getElementById('completionPct');
    if (bar) bar.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
  });
}

async function saveAll() {
  const foodList = Array.from(document.querySelectorAll('#foodChecklist input[type=checkbox]:checked'))
    .map(cb => ({ name: cb.value, category: cb.dataset.category, custom: false }));

  const conditions = (_profile.healthConditions || []).map((c, i) => {
    const cb = document.getElementById(`cond-active-${i}`);
    const active = cb ? cb.checked : c.active;
    const dateEl = document.getElementById(`cond-date-${i}`);
    return { name: c.name, active, resolvedAt: !active && dateEl ? dateEl.value : null };
  });

  const medications = (_profile.medications || []).map((m, i) => {
    const cb = document.getElementById(`med-active-${i}`);
    const active = cb ? cb.checked : m.active;
    return { name: m.name, dosage: m.dosage, timing: m.timing, active, resolvedAt: null };
  });

  const workoutPreferences = Array.from(
    document.querySelectorAll('#workoutPrefGroup input[type=checkbox]:checked')
  ).map(cb => cb.value);

  const payload = {
    cuisinePreference: document.getElementById('cuisinePreference')?.value || undefined,
    equipmentAvailable: Array.from(
      document.querySelectorAll('#equipmentGroup input[type=checkbox]:checked')
    ).map(cb => cb.value),
    workoutPreferences,
    workoutDaysPerWeek: parseInt(document.getElementById('workoutDays')?.value) || undefined,
    workoutTime: document.getElementById('workoutTime')?.value || undefined,
    yogaStyle: document.getElementById('yogaStyle')?.value || undefined,
    foodList,
    healthConditions: conditions,
    medications,
    reviewReminderDays: parseInt(document.getElementById('reviewReminderDays')?.value) || 60
  };

  const res = await apiFetch('/api/profile', { method: 'PATCH', body: JSON.stringify(payload) });
  if (res.ok) {
    showMsg('Profile updated successfully! ✅');
    updateCompletionBar();
  } else {
    showMsg('Error saving: ' + (res.data?.error || 'Unknown error'), 'error');
  }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showMsg(text, type = 'success') {
  const el = document.getElementById('saveMsg');
  if (!el) return;
  el.textContent = text;
  el.style.color = type === 'error' ? '#dc2626' : '#16a34a';
  setTimeout(() => { el.textContent = ''; }, 3000);
}

document.addEventListener('DOMContentLoaded', loadProfile);
