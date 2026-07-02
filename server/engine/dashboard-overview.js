'use strict';

const HealthLog = require('../../models/HealthLog');

const TEMPLATES = {
  'weight-loss': require('../templates/weight-loss'),
  'muscle-gain': require('../templates/muscle-gain'),
  'maintenance': require('../templates/maintenance'),
  'general-fitness': require('../templates/general-fitness')
};

const COMPLETENESS_FIELDS = [
  'primaryGoal',
  'dietType',
  'age',
  'currentWeightKg',
  'heightCm',
  'fitnessLevel'
];

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getTemplate(profile = {}) {
  const key = profile.planTemplate || profile.primaryGoal || 'weight-loss';
  return TEMPLATES[key] || TEMPLATES['weight-loss'];
}

function computeProfileCompleteness(profile = {}) {
  const missingFields = COMPLETENESS_FIELDS.filter((field) => {
    const value = profile[field];
    return value === null || value === undefined || value === '';
  });

  return {
    percentage: Math.round(((COMPLETENESS_FIELDS.length - missingFields.length) / COMPLETENESS_FIELDS.length) * 100),
    missingFields
  };
}

function pickTodayMeals(dietPlan = []) {
  const monthOne = dietPlan[0];
  const weekOne = monthOne && monthOne.weeks && monthOne.weeks[0];
  const weekdays = (weekOne && weekOne.weekdays) || [];
  const today = DAY_NAMES[new Date().getDay()];
  return weekdays.find((entry) => String(entry.day || '').toLowerCase() === today) || weekdays[0] || null;
}

function buildTimeline(todayMeals, latestLog) {
  const timeline = [];

  if (todayMeals) {
    timeline.push({ type: 'meal', label: 'Breakfast', value: todayMeals.breakfast });
    timeline.push({ type: 'meal', label: 'Lunch', value: todayMeals.lunch });
    timeline.push({ type: 'meal', label: 'Snack', value: todayMeals.snack });
    timeline.push({ type: 'meal', label: 'Dinner', value: todayMeals.dinner });
  }

  timeline.push({
    type: 'habit',
    label: 'Workout',
    completed: Boolean(latestLog && latestLog.completedWorkout)
  });

  return timeline;
}

function buildRecipePreview(todayMeals) {
  if (!todayMeals) return [];

  return [
    { mealType: 'breakfast', name: todayMeals.breakfast },
    { mealType: 'lunch', name: todayMeals.lunch },
    { mealType: 'snack', name: todayMeals.snack },
    { mealType: 'dinner', name: todayMeals.dinner }
  ].filter((item) => Boolean(item.name));
}

async function buildStats(userId) {
  const recentLogs = await HealthLog.find({ userId }).sort({ date: -1 }).limit(7).lean();

  const entries = recentLogs.length;
  const totalWater = recentLogs.reduce((sum, log) => sum + (log.waterIntake || 0), 0);
  const avgMood = entries
    ? recentLogs.reduce((sum, log) => sum + (log.moodScore || 0), 0) / entries
    : 0;

  return {
    daysLogged: entries,
    avgWaterIntakeL: Number((entries ? totalWater / entries : 0).toFixed(2)),
    avgMoodScore: Number(avgMood.toFixed(2))
  };
}

async function buildOverview(user) {
  const profile = (user && user.profile) || {};
  const template = getTemplate(profile);
  const dietPlan = template.getDietPlan(profile);
  const todayMeals = pickTodayMeals(dietPlan);
  const latestLog = await HealthLog.findOne({ userId: user._id }).sort({ date: -1 }).lean();

  return {
    timeline: buildTimeline(todayMeals, latestLog),
    dietPreview: {
      dailyCalorieTarget: profile.dailyCalorieTarget || null,
      macros: {
        proteinG: profile.dailyProteinG || null,
        carbsG: profile.dailyCarbsG || null,
        fatG: profile.dailyFatG || null
      },
      meals: todayMeals
        ? {
            breakfast: todayMeals.breakfast,
            lunch: todayMeals.lunch,
            snack: todayMeals.snack,
            dinner: todayMeals.dinner
          }
        : null
    },
    recipePreview: buildRecipePreview(todayMeals),
    stats: await buildStats(user._id),
    profileCompleteness: computeProfileCompleteness(profile)
  };
}

module.exports = { buildOverview };
