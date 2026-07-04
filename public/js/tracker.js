'use strict';

(function () {
  // API base
  const API_BASE = '/api/tracker';
  const CALORIE_TARGET = 2100;
  const STEPS_GOAL = 8000;

  // State
  let trackerData = {
    meals: [],
    stepCount: 0,
    calorieTarget: CALORIE_TARGET,
    consumed: 0,
    remaining: CALORIE_TARGET
  };

  // ========== INITIALIZATION ==========
  async function initTracker() {
    setupEventListeners();
    await fetchTrackerData();
    renderCalories();
    renderSteps();
    document.body.classList.add('loaded');
  }

  // ========== DATA FETCHING ==========
  async function fetchTrackerData() {
    try {
      const response = await fetch(`${API_BASE}/today`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to fetch tracker data');
        return;
      }

      trackerData = await response.json();
    } catch (error) {
      console.error('Error fetching tracker data:', error);
    }
  }

  // ========== CALORIE RING & DISPLAY ==========
  function getCalorieRingColor(consumed, target) {
    const percentage = consumed / target;
    if (percentage > 1) return '#e63946'; // Red
    if (percentage >= 0.8) return '#f4a261'; // Orange
    return '#52b788'; // Green
  }

  function renderCalories() {
    // Update calorie amount text
    const consumed = trackerData.consumed || 0;
    const target = trackerData.calorieTarget || CALORIE_TARGET;
    const remaining = trackerData.remaining || 0;

    document.getElementById('calorieAmount').textContent = `${consumed.toLocaleString()} / ${target.toLocaleString()} kcal`;

    // Update ring color and progress
    const percentage = Math.min(consumed / target, 1.5); // Cap at 150% for visual
    const circumference = 2 * Math.PI * 70; // radius = 70
    const strokeDasharray = circumference * percentage;

    const progressRing = document.getElementById('calorieProgress');
    const ringColor = getCalorieRingColor(consumed, target);

    progressRing.setAttribute('stroke', ringColor);
    progressRing.setAttribute('stroke-dasharray', `${strokeDasharray} ${circumference}`);

    // Render meal log
    renderMealLog();

    // Update nutrition stats
    updateNutritionStats();
  }

  function renderMealLog() {
    const mealList = document.getElementById('mealLogList');
    const meals = trackerData.meals || [];

    if (meals.length === 0) {
      mealList.innerHTML = '<div class="meal-log-empty">No meals logged today</div>';
      return;
    }

    mealList.innerHTML = meals
      .map(
        (meal) => `
      <div class="meal-item">
        <div class="meal-info">
          <div class="meal-type">${meal.mealType || 'Meal'}</div>
          <div class="meal-name">${meal.recipeName || 'Unknown'}</div>
          <div class="meal-calories">${(meal.calories || 0).toLocaleString()} cal</div>
        </div>
        <button class="meal-delete" onclick="deleteMeal('${meal._id}')">Delete</button>
      </div>
    `
      )
      .join('');
  }

  function updateNutritionStats() {
    const meals = trackerData.meals || [];
    const protein = meals.reduce((sum, m) => sum + (m.proteinG || 0), 0);
    const carbs = meals.reduce((sum, m) => sum + (m.carbsG || 0), 0);
    const fat = meals.reduce((sum, m) => sum + (m.fatG || 0), 0);

    const proteinEl = document.getElementById('proteinStat');
    const carbsEl = document.getElementById('carbsStat');
    const fatEl = document.getElementById('fatStat');

    if (proteinEl) proteinEl.textContent = `${Math.round(protein)}g`;
    if (carbsEl) carbsEl.textContent = `${Math.round(carbs)}g`;
    if (fatEl) fatEl.textContent = `${Math.round(fat)}g`;
  }

  // ========== STEPS DISPLAY ==========
  function renderSteps() {
    const stepCount = trackerData.stepCount || 0;
    const goal = STEPS_GOAL;
    const percentage = Math.min((stepCount / goal) * 100, 100);

    // Update counter
    document.getElementById('stepCount').textContent = stepCount.toLocaleString();
    document.getElementById('stepsGoal').textContent = `/ ${goal.toLocaleString()} steps`;

    // Update progress bar
    document.getElementById('stepsBarFill').style.width = `${percentage}%`;
    document.getElementById('stepsPercentage').textContent = `${Math.round(percentage)}%`;

    // Update stat cards
    document.getElementById('stepsTodayStat').textContent = stepCount.toLocaleString();
    // TODO: Weekly avg and streak would require additional API calls or data
    document.getElementById('stepsWeeklyAvg').textContent = stepCount.toLocaleString();
    document.getElementById('stepsStreak').textContent = '0';
  }

  // ========== ADD MEAL ==========
  async function addMeal(mealData) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        ...mealData,
        date: today
      };

      const response = await fetch(`${API_BASE}/meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to add meal');
      }

      await fetchTrackerData();
      renderCalories();
      closeMealForm();
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Failed to add meal. Please try again.');
    }
  }

  // ========== DELETE MEAL ==========
  async function deleteMeal(mealId) {
    if (!confirm('Delete this meal?')) return;

    try {
      const response = await fetch(`${API_BASE}/meal/${mealId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      await fetchTrackerData();
      renderCalories();
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal. Please try again.');
    }
  }

  // ========== ADD STEPS ==========
  async function addSteps(stepCount) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // For adding steps, we need to add to existing count
      const currentSteps = trackerData.stepCount || 0;
      const newTotal = currentSteps + parseInt(stepCount, 10);

      const response = await fetch(`${API_BASE}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          stepCount: newTotal,
          date: today
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add steps');
      }

      await fetchTrackerData();
      renderSteps();
      closeStepsForm();
    } catch (error) {
      console.error('Error adding steps:', error);
      alert('Failed to add steps. Please try again.');
    }
  }

  // ========== TAB SWITCHING ==========
  function setupEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const tabName = this.getAttribute('data-tab');
        switchTab(tabName);
      });
    });

    // Add meal button
    document.getElementById('addMealBtn').addEventListener('click', openMealForm);

    // Meal form submit
    const mealForm = document.getElementById('mealForm');
    if (mealForm) {
      mealForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const mealType = document.getElementById('mealType').value;
        const recipeName = document.getElementById('recipeName').value;
        const calories = parseInt(document.getElementById('calories').value, 10);
        const fromPlan = document.getElementById('fromPlan').checked;

        addMeal({
          mealType,
          recipeName,
          calories,
          fromPlan
        });
      });
    }

    // Add steps button
    document.getElementById('addStepsBtn').addEventListener('click', openStepsForm);

    // Steps form submit
    const stepsForm = document.getElementById('stepsForm');
    if (stepsForm) {
      stepsForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const stepCount = document.getElementById('stepInput').value;
        addSteps(stepCount);
      });
    }

    // Modal close on background click
    document.getElementById('mealFormModal').addEventListener('click', function (e) {
      if (e.target === this) closeMealForm();
    });

    document.getElementById('stepsFormModal').addEventListener('click', function (e) {
      if (e.target === this) closeStepsForm();
    });
  }

  function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach((tab) => {
      tab.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.remove('active');
    });

    // Show selected tab
    const tabEl = document.getElementById(tabName);
    if (tabEl) {
      tabEl.classList.add('active');
    }

    // Activate button
    const btnEl = document.querySelector(`[data-tab="${tabName}"]`);
    if (btnEl) {
      btnEl.classList.add('active');
    }
  }

  // ========== MODAL HANDLERS ==========
  function openMealForm() {
    document.getElementById('mealFormModal').classList.add('active');
  }

  function closeMealForm() {
    document.getElementById('mealFormModal').classList.remove('active');
    document.getElementById('mealForm').reset();
  }

  function openStepsForm() {
    document.getElementById('stepsFormModal').classList.add('active');
  }

  function closeStepsForm() {
    document.getElementById('stepsFormModal').classList.remove('active');
    document.getElementById('stepsForm').reset();
  }

  // ========== GLOBAL EXPORTS ==========
  window.deleteMeal = deleteMeal;
  window.addSteps = addSteps;
  window.addMeal = addMeal;
  window.closeMealForm = closeMealForm;
  window.closeStepsForm = closeStepsForm;
  window.initTracker = initTracker;
  window.fetchTrackerData = fetchTrackerData;

  // ========== INITIALIZATION ON DOM READY ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracker);
  } else {
    initTracker();
  }
})();
