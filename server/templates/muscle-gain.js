'use strict';
const { buildDietPlan, buildWorkoutPlan, buildCardioPlan, buildGroceryList } = require('../engine/plan-builder');

const PHASES = [
  { months: [1, 2], label: 'Hypertrophy Foundation' },
  { months: [3, 4], label: 'Progressive Overload' },
  { months: [5, 6], label: 'Strength Peak' }
];

function getDietPlan(profile)    { return buildDietPlan(profile, 'muscle-gain'); }
function getWorkoutPlan(profile) { return buildWorkoutPlan(profile, 'muscle-gain'); }
function getCardioPlan(profile)  { return buildCardioPlan(profile, 'muscle-gain'); }
function getGroceryList(profile) { return buildGroceryList(profile, 'muscle-gain'); }

function getDefaultChecklist(profile) {
  const items = [
    { category: 'protein',   text: 'Hit daily protein target (1.6–2.2g per kg body weight)' },
    { category: 'sleep',     text: 'Get 8 hours of sleep — muscle repairs overnight' },
    { category: 'hydration', text: 'Drink 3L water daily' },
    { category: 'tracking',  text: 'Log lifts and progressive overload weekly' }
  ];
  if (profile && profile.medications) {
    profile.medications.forEach(med => {
      items.push({ category: 'medication', text: `Take ${med.name} as prescribed` });
    });
  }
  return items;
}

function getPlanMeta(profile, currentMonth = 1, currentWeek = 1) {
  // Clamp to valid ranges
  currentMonth = Math.max(1, Math.min(6, currentMonth));
  currentWeek  = Math.max(1, Math.min(4, currentWeek));
  
  const phases = PHASES;
  const currentPhaseObj = phases.find(p => p.months.includes(currentMonth)) || phases[0];
  return {
    templateName: 'muscle-gain',
    totalMonths: 6,
    currentMonth,
    currentWeek,
    currentPhase: phases.indexOf(currentPhaseObj) + 1,
    currentPhaseLabel: currentPhaseObj.label,
    phases
  };
}

function getFullPlan(profile) {
  return {
    dietPlan:    getDietPlan(profile),
    workoutPlan: getWorkoutPlan(profile),
    cardioPlan:  getCardioPlan(profile),
    groceryList: getGroceryList(profile),
  };
}

module.exports = { getFullPlan, getDietPlan, getWorkoutPlan, getCardioPlan, getGroceryList, getDefaultChecklist, getPlanMeta };
