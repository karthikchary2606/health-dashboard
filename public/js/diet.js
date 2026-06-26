// Diet rendering — data driven from window.planCache

let currentDietMonth = 0; // 0-based; set by initDiet from plan.meta.currentMonth
let currentDietWeek = 1;
let _dietPlan = null; // plan.diet array, populated by initDiet

// Visual metadata for meal slots — not plan data, just rendering config
const MEAL_META = {
  breakfast: { icon: "🌅", label: "Breakfast", cls: "b", time: "09:30 AM" },
  lunch:     { icon: "☀️",  label: "Lunch",     cls: "l", time: "01:30 PM" },
  snack:     { icon: "🍎",  label: "Snack",     cls: "s", time: "04:30 PM" },
  dinner:    { icon: "🌙",  label: "Dinner",    cls: "d", time: "07:30 PM" }
};

async function initDiet() {
  const plan = await window.planCache.getPlan();
  if (!plan) return;
  _dietPlan = plan.diet;
  currentDietMonth = plan.meta.currentMonth - 1; // server is 1-based, convert to 0-based
  buildDietPlan();
}

function buildDietPlan() {
  if (!_dietPlan) return;
  const mSel = document.getElementById("dietMonthSelector");
  mSel.innerHTML = _dietPlan.map((m, i) => {
    const isCur = i === currentDietMonth;
    const label = (m.monthLabel || `Month ${i + 1}`).replace(/\s—.*/, '');
    return `<button class="month-btn${currentDietMonth === i ? " active" : ""}${isCur ? " current-month" : ""}" onclick="selectDietMonth(${i})">${label}${isCur ? " ←" : ""}</button>`;
  }).join("");
  renderDietWeekSelector();
  renderDietMonthView();
}
function selectDietMonth(m) {
  currentDietMonth = m;
  currentDietWeek = 1;
  document.querySelectorAll("#dietMonthSelector .month-btn").forEach((b,i) => b.classList.toggle("active", i===m));
  renderDietWeekSelector();
  renderDietMonthView();
}
function renderDietWeekSelector() {
  const wSel = document.getElementById("dietWeekSelector");
  wSel.innerHTML = [1,2,3,4].map(w =>
    `<button class="week-btn${currentDietWeek===w?" active":""}" onclick="selectDietWeek(${w})">Week ${w}</button>`
  ).join("");
}
function selectDietWeek(w) {
  currentDietWeek = w;
  document.querySelectorAll("#dietWeekSelector .week-btn").forEach((b,i) => b.classList.toggle("active", i+1===w));
  renderDietMonthView();
}
function renderDietMonthView() {
  if (!_dietPlan) return;
  const md = _dietPlan[currentDietMonth];
  if (!md) return;
  document.getElementById("dietPhaseBanner").innerHTML = `<div class="phase-banner"><div><h4>📅 ${md.monthLabel}</h4><p>${(md.guidelines || []).join(" · ")}</p></div></div>`;
  document.getElementById("dietWeekNote").innerHTML = "";
  const today = new Date().toLocaleDateString("en-US",{weekday:"long"});
  const dayMap = Object.fromEntries((md.weekdays || []).map(d => [d.day, d]));
  const tabsEl = document.getElementById("dayTabs");
  tabsEl.innerHTML = "";
  (md.weekdays || []).forEach(d => {
    const btn = document.createElement("button");
    btn.className = "day-tab" + (d.day === today ? " active" : "");
    btn.textContent = d.day.substring(0,3);
    btn.onclick = () => { document.querySelectorAll(".day-tab").forEach(t => t.classList.remove("active")); btn.classList.add("active"); renderDietDay(d.day); };
    tabsEl.appendChild(btn);
  });
  renderDietDay(today in dayMap ? today : (md.weekdays?.[0]?.day ?? "Monday"));
}
function renderDietDay(day) {
  if (!_dietPlan) return;
  const md = _dietPlan[currentDietMonth];
  if (!md) return;
  const d = (md.weekdays || []).find(w => w.day === day);
  if (!d) return;
  let html = `<div class="day-theme">📅 ${day}</div>`;
  ["breakfast","lunch","snack","dinner"].forEach(key => {
    const meta = MEAL_META[key];
    const name = d[key] || "";
    html += `<div class="meal-card ${meta.cls}"><div class="meal-icon">${meta.icon}</div><div class="meal-info"><div class="meal-name">${name}</div><div class="meal-time">⏰ ${meta.time} · ${meta.label}</div></div></div>`;
  });
  document.getElementById("dietDayContent").innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initDiet);
