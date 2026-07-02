'use strict';

const HealthLog = require('../../models/HealthLog');
const southIndianMeals = require('../meals/south-indian');
const northIndianMeals = require('../meals/north-indian');
const continentalMeals = require('../meals/continental');
const { applyRules } = require('./personalization-rules');

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
const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];
const POOL_TO_DIET = {
  veg: ['vegetarian'],
  eggetarian: ['eggetarian'],
  'non-veg': ['non-vegetarian']
};
const CUISINE_MEALS = {
  'south-indian': southIndianMeals,
  'north-indian': northIndianMeals,
  continental: continentalMeals
};

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

function resolvePreviewMetadata(mealType, mealName, profile = {}) {
  const normalizedName = String(mealName || '').toLowerCase().trim();
  const preferredCuisine = String(profile.cuisinePreference || '').toLowerCase();
  const cuisines = Object.keys(CUISINE_MEALS);
  const orderedCuisines = preferredCuisine && preferredCuisine !== 'mixed'
    ? [preferredCuisine, ...cuisines.filter((cuisine) => cuisine !== preferredCuisine)]
    : cuisines;

  for (const cuisine of orderedCuisines) {
    const cuisineMeals = CUISINE_MEALS[cuisine];
    const mealPools = cuisineMeals && cuisineMeals[mealType];
    if (!mealPools) continue;

    for (const [poolName, meals] of Object.entries(mealPools)) {
      if (!Array.isArray(meals)) continue;
      const hasMatch = meals.some((meal) => String(meal || '').toLowerCase().trim() === normalizedName);
      if (!hasMatch) continue;
      return {
        cuisine,
        dietType: POOL_TO_DIET[poolName] || []
      };
    }
  }

  return null;
}

function personalizeMealPreview(profile, todayMeals) {
  if (!todayMeals) return { meals: null, recipePreview: [] };

  const previewCandidates = MEAL_TYPES
    .map((mealType) => {
      const mealName = todayMeals[mealType];
      if (!mealName) return null;
      const metadata = resolvePreviewMetadata(mealType, mealName, profile);
      if (!metadata) return null;
      return {
        mealType,
        name: mealName,
        ingredients: [mealName],
        cuisine: metadata.cuisine,
        dietType: metadata.dietType
      };
    })
    .filter(Boolean);

  const personalizedPreview = applyRules(profile, previewCandidates);
  const meals = personalizedPreview.reduce((acc, meal) => {
    acc[meal.mealType] = meal.name;
    return acc;
  }, { breakfast: null, lunch: null, snack: null, dinner: null });

  return {
    meals,
    recipePreview: personalizedPreview.map((meal) => ({
      mealType: meal.mealType,
      name: meal.name
    }))
  };
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
  const personalizedPreview = personalizeMealPreview(profile, todayMeals);
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
      meals: personalizedPreview.meals
    },
    recipePreview: personalizedPreview.recipePreview,
    stats: await buildStats(user._id),
    profileCompleteness: computeProfileCompleteness(profile)
  };
}

module.exports = { buildOverview };
