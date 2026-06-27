'use strict';

const { buildDietPlan, buildWorkoutPlan, buildCardioPlan, buildGroceryList } = require('../engine/plan-builder');

const PHASES = [
  { months: [1, 2], label: 'Foundation' },
  { months: [3, 4], label: 'Progression' },
  { months: [5, 6], label: 'Peak' },
];

function getDietPlan(profile)    { return buildDietPlan(profile, 'weight-loss'); }
function getWorkoutPlan(profile) { return buildWorkoutPlan(profile, 'weight-loss'); }
function getCardioPlan(profile)  { return buildCardioPlan(profile, 'weight-loss'); }
function getGroceryList(profile) { return buildGroceryList(profile, 'weight-loss'); }

function getDefaultChecklist(profile) {
  const items = [
    { category: 'hydration', text: 'Drink 2.5–3L water daily' },
    { category: 'sleep',     text: 'Get 7–8 hours of sleep' },
    { category: 'tracking',  text: 'Log meals and weight weekly' },
    { category: 'activity',  text: 'Hit 7,000+ steps per day' },
  ];
  (profile.medications || []).forEach(med => {
    items.push({ category: 'medication', text: `Take ${med.name} as prescribed` });
  });
  return items;
}

function getPlanMeta(profile, currentMonth, currentWeek) {
  if (currentMonth === undefined) {
    const startDate   = profile.startDate ? new Date(profile.startDate) : new Date();
    const msElapsed   = Date.now() - startDate.getTime();
    const msPerMonth  = 1000 * 60 * 60 * 24 * 30;
    const msPerWeek   = 1000 * 60 * 60 * 24 * 7;
    currentMonth = Math.min(6, Math.max(1, Math.floor(msElapsed / msPerMonth) + 1));
    currentWeek  = (Math.floor(msElapsed / msPerWeek) % 4) + 1;
  }
  currentWeek = currentWeek || 1;
  
  // Clamp to valid ranges
  currentMonth = Math.max(1, Math.min(6, currentMonth));
  currentWeek  = Math.max(1, Math.min(4, currentWeek));
  const phase = PHASES.find(p => p.months.includes(currentMonth)) || PHASES[0];
  return {
    templateName:      'weight-loss',
    totalMonths:       6,
    currentMonth,
    currentWeek,
    currentPhase:      PHASES.indexOf(phase) + 1,
    currentPhaseLabel: phase.label,
    phases:            PHASES,
  };
}

module.exports = { getDietPlan, getWorkoutPlan, getCardioPlan, getGroceryList, getDefaultChecklist, getPlanMeta };
