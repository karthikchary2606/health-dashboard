'use strict';
const { buildDietPlan, buildWorkoutPlan, buildCardioPlan, buildGroceryList } = require('../engine/plan-builder');

function getDietPlan(profile)    { return buildDietPlan(profile, 'general-fitness'); }
function getWorkoutPlan(profile) { return buildWorkoutPlan(profile, 'general-fitness'); }
function getCardioPlan(profile)  { return buildCardioPlan(profile, 'general-fitness'); }
function getGroceryList(profile) { return buildGroceryList(profile, 'general-fitness'); }

function getDefaultChecklist(profile) {
  const items = [
    { category: 'consistency', text: 'Complete 3–4 workouts per week consistently' },
    { category: 'sleep',       text: 'Get 8 hours of sleep — muscle repairs overnight' },
    { category: 'hydration',   text: 'Drink 2.5L water daily' },
    { category: 'activity',    text: 'Stay active with 8,000+ steps daily' }
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
  
  const phases = [
    { months: [1, 2], label: 'Establish Routine' },
    { months: [3, 4], label: 'Build Consistency' },
    { months: [5, 6], label: 'Advance & Maintain' }
  ];
  const currentPhaseObj = phases.find(p => p.months.includes(currentMonth)) || phases[0];
  return {
    templateName: 'general-fitness',
    totalMonths: 6,
    currentMonth,
    currentWeek,
    currentPhase: phases.indexOf(currentPhaseObj) + 1,
    currentPhaseLabel: currentPhaseObj.label,
    phases
  };
}

module.exports = { getDietPlan, getWorkoutPlan, getCardioPlan, getGroceryList, getDefaultChecklist, getPlanMeta };
