// Workout rendering — data sourced from window.planCache.getPlan()

let currentWorkoutMonth = 0;
let currentWorkoutDay = "Monday";
let _workoutData = null; // data.workout array set by initWorkout()

// Per-day icons (API template does not include them)
const DAY_ICONS = {
  Monday: "💪", Tuesday: "🍑", Wednesday: "🧘",
  Thursday: "🦵", Friday: "🔥", Saturday: "🚶", Sunday: "🛌"
};

async function initWorkout() {
  const plan = await window.planCache.getPlan();
  if (!plan) return;

  _workoutData = plan.workout;
  currentWorkoutMonth = plan.meta.currentMonth - 1; // convert 1-based to 0-based index

  buildWorkout();
}

function buildWorkout() {
  if (!_workoutData) return;

  const mSel = document.getElementById("workoutMonthSelector");
  mSel.innerHTML = _workoutData.map((w, i) =>
    `<button class="month-btn${currentWorkoutMonth===i?" active":""}${i===currentWorkoutMonth?" current-month":""}" onclick="selectWorkoutMonth(${i})">${w.monthLabel}${i===currentWorkoutMonth?" ←":""}</button>`
  ).join("");
  renderWorkoutMonthBanner();
  renderWorkoutDayGrid();
}

function selectWorkoutMonth(m) {
  currentWorkoutMonth = m;
  document.querySelectorAll("#workoutMonthSelector .month-btn").forEach((b, i) => b.classList.toggle("active", i===m));
  renderWorkoutMonthBanner();
  renderWorkoutDayGrid();
}

function renderWorkoutMonthBanner() {
  if (!_workoutData) return;
  const w = _workoutData[currentWorkoutMonth];
  document.getElementById("workoutPhaseBanner").innerHTML =
    `<div class="phase-banner"><div><h4>💪 ${w.phaseLabel}</h4><p>${w.focus}</p></div><div><span class="phase-pill">💡 ${w.note}</span></div></div>`;
}

function renderWorkoutDayGrid() {
  if (!_workoutData) return;
  const schedule = _workoutData[currentWorkoutMonth].schedule;
  const grid = document.getElementById("workoutDayGrid");
  grid.innerHTML = "";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  schedule.forEach(dayData => {
    const isRest = dayData.type === "rest" || dayData.type === "cardio";
    const icon = DAY_ICONS[dayData.day] || "💪";
    const div = document.createElement("div");
    div.className = `wday${isRest?" rest":""}${dayData.day===today?" active":""}`;
    div.id = "wd-" + dayData.day;
    div.innerHTML = `<div class="wd-name">${dayData.day.substring(0,3)}</div><div class="wd-icon">${icon}</div><div class="wd-type" style="font-size:.62rem">${dayData.focus.split(" ")[0]}</div>`;
    div.onclick = () => selectWorkoutDay(dayData.day);
    grid.appendChild(div);
  });
  const todayEntry = schedule.find(s => s.day === today);
  selectWorkoutDay(todayEntry ? today : schedule[0].day);
}

function selectWorkoutDay(day) {
  currentWorkoutDay = day;
  document.querySelectorAll(".wday").forEach(d => d.classList.remove("active"));
  const el = document.getElementById("wd-" + day);
  if (el) el.classList.add("active");
  renderWorkoutDay(day);
}

function renderWorkoutDay(day) {
  if (!_workoutData) return;
  const schedule = _workoutData[currentWorkoutMonth].schedule;
  const w = schedule.find(s => s.day === day);
  if (!w) return;
  const icon = DAY_ICONS[day] || "💪";
  let wHtml = '<div class="card"><div class="card-title">' + icon + ' ' + day + ': ' + w.focus +
    '<span style="margin-left:auto;font-size:.72rem;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;padding:3px 8px;border-radius:8px;font-weight:600">⏱️ ' + w.duration + '</span>' +
    '<span class="spine-badge" style="margin-left:8px">🦴 Spine-Safe</span></div><div class="exercise-list">';
  w.exercises.forEach(ex => {
    const cat = ex.cat || "";
    wHtml += '<div class="exercise-item ' + cat + '"><span class="exercise-cat">' + cat + '</span><div>' +
      '<div class="exercise-name">' + ex.name + '</div>' +
      '<div class="exercise-detail">📊 ' + ex.sets + ' sets × ' + ex.reps + '</div>' +
      '<div class="exercise-note">' + ex.note + '</div></div></div>';
  });
  wHtml += '</div></div>';
  document.getElementById("workoutDayContent").innerHTML = wHtml;
}

document.addEventListener('DOMContentLoaded', initWorkout);
