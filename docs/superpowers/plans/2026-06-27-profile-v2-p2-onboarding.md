# Profile V2 — P2: Onboarding Wizard + Phase 2 Profile Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the 7-step onboarding wizard to 8 steps capturing religion, language community, and cultural food avoidances; remove dietType label in favour of the new model; and build a "Complete Your Profile" Phase 2 dashboard page with food checklist, workout preferences, and condition review.

**Architecture:** `public/onboarding.html` is a single-file wizard (HTML + inline JS). Step 7 (new) replaces the old cuisine/equipment step and captures religion + language + cultural avoidances. The Phase 2 page is a new `public/profile-complete.html` with its own JS file. The dashboard gains a profile completion card that links to it.

**Tech Stack:** Vanilla JS, HTML5, existing CSS patterns from onboarding.html, `/api/profile` endpoints from Plan P1.

**Prerequisite:** Plan P1 (data foundation) must be complete before this plan.

**Spec:** `docs/superpowers/specs/2026-06-27-profile-onboarding-v2-design.md` Sections 4, 5

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `public/onboarding.html` | Modify | 8-step wizard: new step 7 (religion/language/avoidances), remove dietType label step |
| `public/profile-complete.html` | Create | Phase 2 deep-profile page |
| `public/js/profile-complete.js` | Create | JS for Phase 2 page |
| `server/data/food-checklist.js` | Create | Food items by language community + category |
| `public/js/dashboard.js` | Modify | Add profile completion card + review reminder banner |

---

### Task 7: Rewrite onboarding wizard — 8 steps

**Files:**
- Modify: `public/onboarding.html`

The current wizard has 7 steps. The new wizard has 8 steps:

| Step | Content |
|------|---------|
| 1 | Name, Email, Password |
| 2 | Age, Height, Current weight, Goal weight |
| 3 | Primary goal (radio) |
| 4 | Fitness level (radio) |
| 5 | Health conditions (multi-select, now `[{name}]` format) |
| 6 | Medications (add/remove rows) |
| 7 | **NEW** — Religion (radio) + Language community (radio) + Cultural food avoidances (checkboxes) |
| 8 | Review & Submit |

- [ ] **Step 1: Read current wizard structure**

```bash
grep -n "TOTAL_STEPS\|step-\|goTo\|function submit\|function saveDraft" public/onboarding.html | head -40
```

Expected: see `TOTAL_STEPS = 7`, steps 1–7 with nav buttons.

- [ ] **Step 2: Update TOTAL_STEPS and add step 7 HTML**

Find `const TOTAL_STEPS = 7;` and change to:

```js
const TOTAL_STEPS = 8;
```

Find the current step-7 (Review step) and insert the new step-7 before it. The new step HTML (insert before `<!-- ── STEP 7: Review ── -->`):

```html
<!-- ── STEP 7: Culture & Food Avoidances ── -->
<div class="step" id="step-7" style="display:none;">
  <h2>Culture &amp; Food Avoidances</h2>
  <p class="step-description">We use this to personalise your meal plan and avoid foods that don't suit you.</p>

  <div class="form-group">
    <label>Religion</label>
    <div class="radio-group" id="rg-religion">
      <label class="radio-option" onclick="selectRadio('rg-religion','Hindu',this)"><input type="radio" name="religion" value="Hindu"> Hindu</label>
      <label class="radio-option" onclick="selectRadio('rg-religion','Muslim',this)"><input type="radio" name="religion" value="Muslim"> Muslim</label>
      <label class="radio-option" onclick="selectRadio('rg-religion','Christian',this)"><input type="radio" name="religion" value="Christian"> Christian</label>
      <label class="radio-option" onclick="selectRadio('rg-religion','Jain',this)"><input type="radio" name="religion" value="Jain"> Jain</label>
      <label class="radio-option" onclick="selectRadio('rg-religion','Sikh',this)"><input type="radio" name="religion" value="Sikh"> Sikh</label>
      <label class="radio-option" onclick="selectRadio('rg-religion','Other',this)"><input type="radio" name="religion" value="Other"> Other / Prefer not to say</label>
    </div>
  </div>

  <div class="form-group">
    <label>Language Community</label>
    <div class="radio-group" id="rg-languageCommunity">
      <label class="radio-option" onclick="selectRadio('rg-languageCommunity','Telugu',this)"><input type="radio" name="languageCommunity" value="Telugu"> Telugu</label>
      <label class="radio-option" onclick="selectRadio('rg-languageCommunity','Tamil',this)"><input type="radio" name="languageCommunity" value="Tamil"> Tamil</label>
      <label class="radio-option" onclick="selectRadio('rg-languageCommunity','Kannada',this)"><input type="radio" name="languageCommunity" value="Kannada"> Kannada</label>
      <label class="radio-option" onclick="selectRadio('rg-languageCommunity','Malayalam',this)"><input type="radio" name="languageCommunity" value="Malayalam"> Malayalam</label>
      <label class="radio-option" onclick="selectRadio('rg-languageCommunity','Hindi',this)"><input type="radio" name="languageCommunity" value="Hindi"> Hindi</label>
      <label class="radio-option" onclick="selectRadio('rg-languageCommunity','Other',this)"><input type="radio" name="languageCommunity" value="Other"> Other</label>
    </div>
  </div>

  <div class="form-group">
    <label>Foods I never eat <span class="hint">(for religious or cultural reasons)</span></label>
    <div class="checkbox-group" id="cg-avoidances">
      <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="avoidance" value="beef"> Beef</label>
      <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="avoidance" value="pork"> Pork</label>
      <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="avoidance" value="onion"> Onion</label>
      <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="avoidance" value="garlic"> Garlic</label>
      <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="avoidance" value="alcohol"> Alcohol</label>
      <label class="check-option" onclick="toggleCheck(this)"><input type="checkbox" name="avoidance" value="non-veg"> All non-vegetarian</label>
    </div>
    <div style="margin-top:8px">
      <input type="text" id="customAvoidance" class="mock-input" placeholder="Add custom avoidance…" style="width:70%">
      <button type="button" onclick="addCustomAvoidance()" class="btn-small">Add</button>
    </div>
    <div id="customAvoidanceList" style="margin-top:6px;font-size:.8rem;color:var(--text-light)"></div>
  </div>

  <div class="step-actions">
    <button type="button" onclick="goTo(6)">← Back</button>
    <button type="button" onclick="goTo(8)" class="btn-primary">Next →</button>
  </div>
</div>
```

- [ ] **Step 3: Rename old step-7 to step-8**

Find `id="step-7"` for the Review step and change it to `id="step-8"`. Update its Back button from `goTo(6)` to `goTo(7)`.

- [ ] **Step 4: Add JS helpers for new step**

In the `<script>` section, add:

```js
let _customAvoidances = [];

function addCustomAvoidance() {
  const input = document.getElementById('customAvoidance');
  const val = input.value.trim().toLowerCase();
  if (!val || _customAvoidances.includes(val)) { input.value = ''; return; }
  _customAvoidances.push(val);
  input.value = '';
  renderCustomAvoidances();
}

function renderCustomAvoidances() {
  const container = document.getElementById('customAvoidanceList');
  container.innerHTML = _customAvoidances.map(a =>
    `<span style="display:inline-block;background:#f3f4f6;border-radius:4px;padding:2px 8px;margin:2px;cursor:pointer" onclick="removeAvoidance('${a}')">${a} ×</span>`
  ).join('');
}

function removeAvoidance(val) {
  _customAvoidances = _customAvoidances.filter(a => a !== val);
  renderCustomAvoidances();
}
```

- [ ] **Step 5: Update saveDraft() to include new step-7 fields**

Find `saveDraft()` and add:

```js
religion:               getRadio('rg-religion'),
languageCommunity:      getRadio('rg-languageCommunity'),
culturalFoodAvoidances: [
  ...Array.from(document.querySelectorAll('#cg-avoidances .check-option.selected input')).map(i => i.value),
  ..._customAvoidances
],
```

- [ ] **Step 6: Update loadDraft() to restore step-7 fields**

In `loadDraft()`, add:

```js
if (d.religion)          setRadio('rg-religion', d.religion);
if (d.languageCommunity) setRadio('rg-languageCommunity', d.languageCommunity);
if (d.culturalFoodAvoidances && d.culturalFoodAvoidances.length) {
  const standard = ['beef','pork','onion','garlic','alcohol','non-veg'];
  d.culturalFoodAvoidances.forEach(val => {
    if (standard.includes(val)) {
      const cb = document.querySelector(`#cg-avoidances input[value="${val}"]`);
      if (cb) cb.closest('.check-option').classList.add('selected');
    } else {
      if (!_customAvoidances.includes(val)) _customAvoidances.push(val);
    }
  });
  renderCustomAvoidances();
}
```

- [ ] **Step 7: Update submitProfile() to send new fields**

In `submitProfile()`, add to the request body:

```js
religion:               getRadio('rg-religion'),
languageCommunity:      getRadio('rg-languageCommunity'),
culturalFoodAvoidances: [
  ...Array.from(document.querySelectorAll('#cg-avoidances .check-option.selected input')).map(i => i.value),
  ..._customAvoidances
],
```

- [ ] **Step 8: Update buildSummary() to show step-7 data**

In `buildSummary()`, add:

```js
const religion = draft.religion || '—';
const community = draft.languageCommunity || '—';
const avoidances = (draft.culturalFoodAvoidances || []).join(', ') || 'None';
// Add to summary HTML: Religion, Community, Avoidances rows
```

- [ ] **Step 9: Manual test in browser**

```bash
node server.js &
open http://localhost:3000/onboarding.html
```

Walk through all 8 steps. Verify step 7 shows religion/language/avoidances. Verify draft saves and restores on page reload.

- [ ] **Step 10: Commit**

```bash
git add public/onboarding.html
git commit -m "feat: add step 7 (religion/language/cultural avoidances) to onboarding wizard, 7→8 steps"
```

---

### Task 8: Food checklist data by language community

**Files:**
- Create: `server/data/food-checklist.js`
- Test: inline verification

The Phase 2 food checklist pre-populates based on `languageCommunity`. This file is the data source.

- [ ] **Step 1: Create the data file**

Create `server/data/food-checklist.js`:

```js
'use strict';

// Food checklist items grouped by category.
// Each item has: name, communities (which language communities eat it commonly), default (shown for all)

const FOOD_ITEMS = {
  grains: [
    { name: 'Rice',           communities: ['Telugu','Tamil','Kannada','Malayalam'], default: true },
    { name: 'Idli',           communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Dosa',           communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Pesarattu',      communities: ['Telugu'] },
    { name: 'Upma',           communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Pongal',         communities: ['Telugu','Tamil'] },
    { name: 'Ragi Mudde',     communities: ['Kannada'] },
    { name: 'Appam',          communities: ['Malayalam','Tamil'] },
    { name: 'Puttu',          communities: ['Malayalam','Tamil'] },
    { name: 'Chapati / Roti', communities: ['Hindi'],              default: true },
    { name: 'Paratha',        communities: ['Hindi'] },
    { name: 'Poha',           communities: ['Hindi'] },
    { name: 'Bread',          communities: [],                     default: true },
    { name: 'Oats',           communities: [],                     default: true },
    { name: 'Millet (Jowar/Bajra)', communities: ['Hindi','Telugu'] },
    { name: 'Semolina (Rava)',communities: ['Telugu','Tamil','Kannada'] },
  ],
  vegetables: [
    { name: 'Tomato',         communities: [], default: true },
    { name: 'Onion',          communities: [], default: true },
    { name: 'Spinach',        communities: [], default: true },
    { name: 'Brinjal (Eggplant)', communities: ['Telugu','Tamil','Kannada'] },
    { name: 'Gongura (Sorrel Leaves)', communities: ['Telugu'] },
    { name: 'Raw Banana',     communities: ['Telugu','Tamil','Malayalam'] },
    { name: 'Drumstick',      communities: ['Telugu','Tamil'] },
    { name: 'Bitter Gourd',   communities: ['Telugu','Tamil','Kannada'] },
    { name: 'Ridge Gourd',    communities: ['Telugu','Tamil'] },
    { name: 'Bottle Gourd',   communities: ['Hindi','Telugu'] },
    { name: 'Cauliflower',    communities: ['Hindi'],             default: true },
    { name: 'Cabbage',        communities: [], default: true },
    { name: 'Carrot',         communities: [], default: true },
    { name: 'Potato',         communities: [], default: true },
    { name: 'Beans',          communities: [], default: true },
    { name: 'Pumpkin',        communities: ['Telugu','Malayalam'] },
    { name: 'Ash Gourd',      communities: ['Tamil','Kannada','Malayalam'] },
    { name: 'Taro Root (Colocasia)', communities: ['Telugu','Tamil','Malayalam'] },
  ],
  proteins: [
    { name: 'Eggs',           communities: [], default: true },
    { name: 'Chicken',        communities: [], default: true },
    { name: 'Mutton',         communities: ['Telugu','Tamil'] },
    { name: 'Fish',           communities: ['Telugu','Tamil','Malayalam','Kannada'] },
    { name: 'Prawns',         communities: ['Telugu','Tamil','Malayalam'] },
    { name: 'Lentils (Dal)',  communities: [], default: true },
    { name: 'Chana Dal',      communities: ['Telugu','Tamil','Hindi'] },
    { name: 'Toor Dal',       communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Urad Dal',       communities: ['Telugu','Tamil','Kannada'] },
    { name: 'Moong Dal',      communities: [], default: true },
    { name: 'Rajma',          communities: ['Hindi'] },
    { name: 'Chhole',         communities: ['Hindi'] },
    { name: 'Soya Chunks',    communities: ['Telugu','Hindi'] },
    { name: 'Paneer',         communities: ['Hindi'],             default: true },
    { name: 'Tofu',           communities: [] },
  ],
  dairy: [
    { name: 'Milk',           communities: [], default: true },
    { name: 'Curd / Yoghurt', communities: [], default: true },
    { name: 'Buttermilk',     communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Ghee',           communities: ['Telugu','Tamil','Kannada','Hindi'], default: true },
    { name: 'Cheese',         communities: [] },
    { name: 'Butter',         communities: [], default: true },
  ],
  snacks: [
    { name: 'Murukku',        communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Mixture',        communities: ['Telugu','Tamil'] },
    { name: 'Biscuits',       communities: [], default: true },
    { name: 'Peanuts',        communities: [], default: true },
    { name: 'Banana',         communities: [], default: true },
    { name: 'Apple',          communities: [], default: true },
    { name: 'Puffed Rice (Murmura)', communities: ['Telugu','Hindi'] },
    { name: 'Chikki',         communities: ['Hindi','Telugu'] },
    { name: 'Boiled Chickpeas', communities: ['Telugu','Tamil'] },
  ],
  beverages: [
    { name: 'Tea',            communities: [], default: true },
    { name: 'Coffee',         communities: ['Telugu','Tamil','Kannada','Malayalam'], default: true },
    { name: 'Coconut Water',  communities: ['Telugu','Tamil','Malayalam','Kannada'] },
    { name: 'Buttermilk',     communities: ['Telugu','Tamil','Kannada','Malayalam'] },
    { name: 'Fruit Juice',    communities: [], default: true },
    { name: 'Water',          communities: [], default: true },
  ]
};

/**
 * Returns checklist items for each category, pre-selected based on languageCommunity.
 * Items are sorted: community-specific first, then defaults.
 *
 * @param {string} languageCommunity - e.g. 'Telugu', 'Tamil', 'Hindi', 'Other'
 * @param {string[]} culturalFoodAvoidances - hard-excluded items
 * @returns {{ category: string, items: { name: string, preSelected: boolean }[] }[]}
 */
function getChecklist(languageCommunity, culturalFoodAvoidances = []) {
  const avoidSet = new Set((culturalFoodAvoidances || []).map(a => a.toLowerCase()));

  return Object.entries(FOOD_ITEMS).map(([category, items]) => {
    const filtered = items.filter(item =>
      !avoidSet.has(item.name.toLowerCase())
    );
    const enriched = filtered.map(item => ({
      name: item.name,
      preSelected: item.communities.includes(languageCommunity) || (item.default === true && !item.communities.length)
    }));
    // Sort: community-specific pre-selected first, then defaults, then rest
    enriched.sort((a, b) => (b.preSelected ? 1 : 0) - (a.preSelected ? 1 : 0));
    return { category, items: enriched };
  });
}

module.exports = { getChecklist, FOOD_ITEMS };
```

- [ ] **Step 2: Add API endpoint for food checklist**

In `routes/profile.js`, add before `module.exports`:

```js
// Food checklist — returns items pre-selected for user's community
router.get('/food-checklist', authenticate, requireProfile, (req, res) => {
  const { getChecklist } = require('../server/data/food-checklist');
  const p = req.user.profile;
  const checklist = getChecklist(p.languageCommunity, p.culturalFoodAvoidances);
  res.json(checklist);
});
```

- [ ] **Step 3: Quick verify**

```bash
node -e "
const { getChecklist } = require('./server/data/food-checklist');
const result = getChecklist('Telugu', ['beef']);
result.forEach(cat => {
  const pre = cat.items.filter(i => i.preSelected).map(i => i.name);
  console.log(cat.category + ':', pre.slice(0,3).join(', '));
});
"
```

Expected: Telugu-specific items (Pesarattu, Gongura, Idli etc.) appear pre-selected.

- [ ] **Step 4: Commit**

```bash
git add server/data/food-checklist.js routes/profile.js
git commit -m "feat: food checklist data by language community + /api/profile/food-checklist endpoint"
```

---

### Task 9: Build Phase 2 "Complete Your Profile" page

**Files:**
- Create: `public/profile-complete.html`
- Create: `public/js/profile-complete.js`

- [ ] **Step 1: Create the JS file**

Create `public/js/profile-complete.js`:

```js
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

  if (checklistRes.ok) {
    renderFoodChecklist(checklistRes.data);
  }
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
    container.innerHTML = '<p style="color:var(--text-light)">No health conditions recorded.</p>';
    return;
  }
  container.innerHTML = conditions.map((c, i) => `
    <div class="review-item" id="cond-${i}">
      <span class="review-name">${c.name}</span>
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
  const span = item.querySelector('span:last-of-type');
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
    container.innerHTML = '<p style="color:var(--text-light)">No medications recorded.</p>';
    return;
  }
  container.innerHTML = meds.map((m, i) => `
    <div class="review-item" id="med-${i}">
      <span class="review-name">${m.name}${m.dosage ? ' — ' + m.dosage : ''}</span>
      <label class="toggle-label">
        <input type="checkbox" id="med-active-${i}" ${m.active ? 'checked' : ''}
          onchange="toggleMed(${i}, this.checked)">
        <span>${m.active ? '🟢 Active' : '✅ Resolved'}</span>
      </label>
    </div>
  `).join('');
}

function toggleMed(idx, active) {
  const span = document.querySelector(`#med-${idx} span:last-of-type`);
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

  container.innerHTML = data.map(({ category, items }) => `
    <details class="food-category" open>
      <summary>${category.charAt(0).toUpperCase() + category.slice(1)}</summary>
      <div class="food-items">
        ${items.map(item => `
          <label class="food-item ${userFoodSet.has(item.name) || item.preSelected ? 'selected' : ''}">
            <input type="checkbox" value="${item.name}" data-category="${category}"
              ${userFoodSet.has(item.name) || item.preSelected ? 'checked' : ''}
              onchange="this.closest('.food-item').classList.toggle('selected', this.checked)">
            ${item.name}
          </label>
        `).join('')}
        <div style="margin-top:6px">
          <input type="text" class="custom-food-input" placeholder="Add custom…" style="font-size:.8rem;padding:4px 8px;border:1px solid #e5e7eb;border-radius:6px;width:60%">
          <button type="button" onclick="addCustomFood(this,'${category}')" class="btn-small">+</button>
        </div>
      </div>
    </details>
  `).join('');
}

function addCustomFood(btn, category) {
  const input = btn.previousElementSibling;
  const name = input.value.trim();
  if (!name) return;
  const container = btn.closest('.food-items');
  const label = document.createElement('label');
  label.className = 'food-item selected';
  label.innerHTML = `<input type="checkbox" value="${name}" data-category="${category}" checked onchange="this.closest('.food-item').classList.toggle('selected', this.checked)"> ${name} <em style="font-size:.7rem;color:#9ca3af">(custom)</em>`;
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

function showMsg(text, type = 'success') {
  const el = document.getElementById('saveMsg');
  if (!el) return;
  el.textContent = text;
  el.style.color = type === 'error' ? '#dc2626' : '#16a34a';
  setTimeout(() => { el.textContent = ''; }, 3000);
}

document.addEventListener('DOMContentLoaded', loadProfile);
```

- [ ] **Step 2: Create the HTML page**

Create `public/profile-complete.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Profile — Health Dashboard</title>
  <style>
    :root { --primary:#1b4332; --text-light:#6b7280; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:system-ui,sans-serif; background:#f9fafb; color:#111827; }
    .header { background:var(--primary); color:#fff; padding:12px 20px; display:flex; align-items:center; gap:12px; }
    .header a { color:#fff; text-decoration:none; font-size:.85rem; opacity:.8; }
    .container { max-width:720px; margin:0 auto; padding:24px 16px; }
    .completion-card { background:#fff; border-radius:12px; padding:16px 20px; margin-bottom:24px; border:1px solid #e5e7eb; }
    .progress-bar-bg { background:#e5e7eb; border-radius:8px; height:10px; margin-top:8px; }
    .progress-bar-fill { background:var(--primary); height:10px; border-radius:8px; transition:width .4s; }
    .section-card { background:#fff; border-radius:12px; padding:20px; margin-bottom:16px; border:1px solid #e5e7eb; }
    .section-card h3 { font-size:1rem; color:var(--primary); margin-bottom:12px; border-bottom:1px solid #f3f4f6; padding-bottom:8px; }
    .form-group { margin-bottom:14px; }
    .form-group label { font-size:.85rem; font-weight:600; color:#374151; display:block; margin-bottom:6px; }
    select, input[type=number] { width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; font-size:.9rem; }
    .check-group { display:flex; flex-wrap:wrap; gap:8px; }
    .check-option { display:flex; align-items:center; gap:6px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:6px 12px; cursor:pointer; font-size:.85rem; }
    .check-option.selected { background:#f0fdf4; border-color:var(--primary); color:var(--primary); font-weight:600; }
    .food-category { border:1px solid #e5e7eb; border-radius:8px; margin-bottom:8px; overflow:hidden; }
    .food-category summary { padding:10px 14px; cursor:pointer; font-weight:600; font-size:.9rem; background:#f9fafb; }
    .food-items { padding:10px 14px; display:flex; flex-wrap:wrap; gap:6px; }
    .food-item { display:flex; align-items:center; gap:5px; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:6px; padding:4px 10px; cursor:pointer; font-size:.82rem; }
    .food-item.selected { background:#f0fdf4; border-color:var(--primary); color:var(--primary); }
    .review-item { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #f3f4f6; }
    .review-name { flex:1; font-size:.9rem; }
    .toggle-label { display:flex; align-items:center; gap:6px; cursor:pointer; font-size:.85rem; }
    .btn-primary { background:var(--primary); color:#fff; border:none; padding:10px 24px; border-radius:8px; font-size:.9rem; cursor:pointer; }
    .btn-small { background:#e5e7eb; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:.8rem; margin-left:6px; }
    #saveMsg { font-size:.85rem; margin-left:12px; }
    .hint { font-size:.75rem; font-weight:400; color:var(--text-light); }
  </style>
</head>
<body>
  <div class="header">
    <a href="/">← Dashboard</a>
    <span style="font-weight:700">Complete Your Profile</span>
  </div>

  <div class="container">
    <!-- Completion bar -->
    <div class="completion-card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:700">Profile Completeness</span>
        <span id="completionPct" style="font-weight:700;color:var(--primary)">—</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="completionBar" style="width:0%"></div>
      </div>
    </div>

    <!-- Cuisine & Equipment -->
    <div class="section-card">
      <h3>🍽️ Cuisine &amp; Equipment</h3>
      <div class="form-group">
        <label for="cuisinePreference">Cuisine Preference</label>
        <select id="cuisinePreference">
          <option value="">Select…</option>
          <option value="south-indian">South Indian</option>
          <option value="north-indian">North Indian</option>
          <option value="continental">Continental</option>
          <option value="mixed">Mixed (Rotates weekly)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Equipment Available</label>
        <div class="check-group" id="equipmentGroup">
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="dumbbells"> Dumbbells</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="barbell"> Barbell</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="pull-up-bar"> Pull-Up Bar</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="resistance-bands"> Resistance Bands</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="kettlebell"> Kettlebell</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="treadmill"> Treadmill</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="gym-access"> Full Gym Access</label>
        </div>
      </div>
    </div>

    <!-- Workout Preferences -->
    <div class="section-card">
      <h3>🏋️ Workout Preferences</h3>
      <div class="form-group">
        <label>Preferred Workout Types <span class="hint">(select all that apply)</span></label>
        <div class="check-group" id="workoutPrefGroup">
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="gym"> Gym Workout</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="yoga"> Yoga</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="surya-namaskar"> Surya Namaskar</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="walking"> Walking</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="running"> Running</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="home-bodyweight"> Home Bodyweight</label>
          <label class="check-option" onclick="this.classList.toggle('selected')"><input type="checkbox" value="swimming"> Swimming</label>
        </div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div class="form-group" style="flex:1;min-width:140px">
          <label for="workoutDays">Days per week</label>
          <select id="workoutDays">
            <option value="">Select…</option>
            <option value="2">2 days</option>
            <option value="3">3 days</option>
            <option value="4">4 days</option>
            <option value="5">5 days</option>
            <option value="6">6 days</option>
          </select>
        </div>
        <div class="form-group" style="flex:1;min-width:140px">
          <label for="workoutTime">Preferred time</label>
          <select id="workoutTime">
            <option value="">Select…</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        <div class="form-group" style="flex:1;min-width:140px">
          <label for="yogaStyle">Yoga style</label>
          <select id="yogaStyle">
            <option value="">Select…</option>
            <option value="hatha">Hatha</option>
            <option value="vinyasa">Vinyasa</option>
            <option value="pranayama-only">Pranayama only</option>
            <option value="none">No preference</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Food List -->
    <div class="section-card">
      <h3>🥗 Your Food List</h3>
      <p style="font-size:.85rem;color:var(--text-light);margin-bottom:12px">Check the foods you eat regularly. This personalises your meal plan.</p>
      <div id="foodChecklist">Loading…</div>
    </div>

    <!-- Health Conditions Review -->
    <div class="section-card">
      <h3>🩺 Health Conditions Review</h3>
      <p style="font-size:.85rem;color:var(--text-light);margin-bottom:12px">Mark conditions as resolved if they no longer apply — this affects your plan.</p>
      <div id="conditionReview">Loading…</div>
    </div>

    <!-- Medications Review -->
    <div class="section-card">
      <h3>💊 Medications Review</h3>
      <div id="medicationReview">Loading…</div>
    </div>

    <!-- Review reminder -->
    <div class="section-card">
      <h3>🔔 Review Reminder</h3>
      <div class="form-group">
        <label for="reviewReminderDays">Remind me to review health conditions every</label>
        <select id="reviewReminderDays" style="width:auto">
          <option value="30">30 days</option>
          <option value="60" selected>60 days</option>
          <option value="90">90 days</option>
        </select>
      </div>
    </div>

    <!-- Save -->
    <div style="display:flex;align-items:center;margin-top:8px">
      <button class="btn-primary" onclick="saveAll()">Save Changes</button>
      <span id="saveMsg"></span>
    </div>
  </div>

  <script src="/js/api.js"></script>
  <script src="/js/auth.js"></script>
  <script src="/js/profile-complete.js"></script>
</body>
</html>
```

- [ ] **Step 3: Manual smoke test**

```bash
open http://localhost:3000/profile-complete.html
```

- Login as admin, navigate to page
- Verify food checklist loads, sections render
- Make a change and Save — check network tab for PATCH /api/profile

- [ ] **Step 4: Commit**

```bash
git add public/profile-complete.html public/js/profile-complete.js
git commit -m "feat: Phase 2 Complete Your Profile page with food checklist, workout prefs, condition review"
```

---

### Task 10: Dashboard completion card + review reminder banner

**Files:**
- Modify: `public/js/dashboard.js`
- Modify: `public/index.html` (add banner + card elements)

- [ ] **Step 1: Add completion card and review banner to dashboard HTML**

In `public/index.html`, find the dashboard card container and add:

```html
<!-- Profile completion card (shown when < 100%) -->
<div id="profileCompletionCard" style="display:none;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
  <div>
    <div style="font-weight:700;font-size:.9rem">Your profile is <span id="completionPctDash">—</span>% complete</div>
    <div style="font-size:.8rem;color:#92400e;margin-top:2px">Finish setup to get a fully personalised plan</div>
  </div>
  <a href="/profile-complete.html" style="background:#d97706;color:#fff;padding:6px 14px;border-radius:8px;font-size:.82rem;text-decoration:none">Complete →</a>
</div>

<!-- Review reminder banner (shown when overdue) -->
<div id="reviewBanner" style="display:none;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
  <div style="font-size:.85rem;color:#1e40af">
    🔔 It's been a while since you reviewed your health conditions.
    <a href="/profile-complete.html#conditions" style="color:#1e40af;font-weight:700"> Review now →</a>
  </div>
  <button onclick="dismissReviewBanner()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:#6b7280">×</button>
</div>
```

- [ ] **Step 2: Add JS to dashboard.js**

At the end of the `DOMContentLoaded` handler in `dashboard.js`, add:

```js
// Profile completion card
apiFetch('/api/profile/completion').then(res => {
  if (!res.ok) return;
  const pct = res.data.percentage;
  const card = document.getElementById('profileCompletionCard');
  const pctEl = document.getElementById('completionPctDash');
  if (card && pct < 100) {
    card.style.display = 'flex';
    if (pctEl) pctEl.textContent = pct;
  }
});

// Review reminder banner
apiFetch('/api/profile').then(res => {
  if (!res.ok) return;
  const p = res.data;
  if (!p.lastReviewedAt || !p.reviewReminderDays) return;
  const daysSince = Math.floor((Date.now() - new Date(p.lastReviewedAt)) / 86400000);
  const dismissed = parseInt(localStorage.getItem('reviewBannerDismissed') || '0');
  const dismissCount = parseInt(localStorage.getItem('reviewBannerDismissCount') || '0');
  const snoozeUntil = parseInt(localStorage.getItem('reviewBannerSnoozeUntil') || '0');
  const banner = document.getElementById('reviewBanner');
  if (!banner) return;
  const isOverdue = daysSince >= p.reviewReminderDays;
  const isSnoozed = Date.now() < snoozeUntil;
  const forceShow = dismissCount >= 3; // non-dismissible after 3 snoozes
  if (isOverdue && (!isSnoozed || forceShow)) {
    banner.style.display = 'flex';
    if (forceShow) banner.querySelector('button').style.display = 'none';
  }
});
```

Add the dismiss function:

```js
function dismissReviewBanner() {
  const banner = document.getElementById('reviewBanner');
  if (banner) banner.style.display = 'none';
  const count = parseInt(localStorage.getItem('reviewBannerDismissCount') || '0') + 1;
  localStorage.setItem('reviewBannerDismissCount', count);
  localStorage.setItem('reviewBannerSnoozeUntil', Date.now() + 7 * 86400000); // 7 days
}
```

- [ ] **Step 3: Commit**

```bash
git add public/index.html public/js/dashboard.js
git commit -m "feat: dashboard profile completion card and periodic review reminder banner"
```

---

## Plan 2 Complete

After all tasks complete:
- Onboarding wizard has 8 steps capturing religion, language community, cultural avoidances
- Phase 2 "Complete Your Profile" page live at `/profile-complete.html`
- Food checklist pre-populated by language community
- Dashboard shows completion card and review reminder banner
- All profile changes write a ProfileSnapshot

**Next plan:** `docs/superpowers/plans/2026-06-27-profile-v2-p3-plan-engine.md`
