/**
 * Compute aggregate health stats from an array of HealthLog documents.
 * @param {Object[]} logs - HealthLog docs (plain objects or Mongoose docs)
 * @param {Object} profile - User.profile sub-doc
 * @param {number} profile.waterGoalL - daily water goal in litres
 * @returns {Object} stats
 */
function computeStats(logs, profile) {
  const waterGoal    = (profile && profile.waterGoalL) || 2.5;
  const startWeight  = (profile && (profile.startWeightKg || profile.currentWeightKg)) || null;

  if (!logs || logs.length === 0) {
    return {
      workoutStreak: 0, waterStreak: 0, avgCompletion: 0,
      weightLost: 0, totalDaysLogged: 0, avgWater: 0, latestWeight: null,
      avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0,
      avgSleepMinutes: 0, avgSleepQuality: 0,
      avgMoodScore: 0, avgEnergyScore: 0,
      workoutCompletionRate: 0, waterGoalMetDays: 0, totalLogs: 0
    };
  }

  const n = logs.length;
  const sum = (field) => logs.reduce((acc, l) => acc + (Number(l[field]) || 0), 0);

  // Sort descending by date for streak calculation
  const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));

  const logsWithWeight = sorted.filter(l => l.weight != null && l.weight > 0);
  const latestWeight   = logsWithWeight.length ? logsWithWeight[0].weight : null;

  const weightLost = (startWeight && latestWeight)
    ? parseFloat((startWeight - latestWeight).toFixed(1))
    : 0;

  // Consecutive-day streaks from the most recent log
  let workoutStreak = 0;
  for (const log of sorted) {
    if (log.completedWorkout) workoutStreak++;
    else break;
  }

  let waterStreak = 0;
  for (const log of sorted) {
    if ((Number(log.waterIntake) || 0) >= waterGoal) waterStreak++;
    else break;
  }

  const avgWater = parseFloat(
    (logs.reduce((s, l) => s + (Number(l.waterIntake) || 0), 0) / n).toFixed(1)
  );

  let totalChecked = 0, totalItems = 0;
  for (const log of logs) {
    if (Array.isArray(log.checklist) && log.checklist.length > 0) {
      totalItems   += log.checklist.length;
      totalChecked += log.checklist.filter(c => c.done).length;
    }
  }
  const avgCompletion = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  // Macro aggregation: prefer meals[] when present, fall back to top-level scalar fields
  const logsWithMeals = logs.filter(l => Array.isArray(l.meals) && l.meals.length > 0);
  const avgCalories = logsWithMeals.length
    ? Math.round(logsWithMeals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + (m.calories || 0), 0), 0) / logsWithMeals.length)
    : Math.round(sum('calories') / n);
  const avgProtein = logsWithMeals.length
    ? Math.round(logsWithMeals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + (m.proteinG || 0), 0), 0) / logsWithMeals.length)
    : Math.round(sum('protein') / n);
  const avgCarbs = logsWithMeals.length
    ? Math.round(logsWithMeals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + (m.carbsG || 0), 0), 0) / logsWithMeals.length)
    : Math.round(sum('carbs') / n);
  const avgFat = logsWithMeals.length
    ? Math.round(logsWithMeals.reduce((s, l) => s + l.meals.reduce((ms, m) => ms + (m.fatG || 0), 0), 0) / logsWithMeals.length)
    : Math.round(sum('fat') / n);

  // Sleep aggregation from sleepEntry
  const sleepLogs = logs.filter(l => l.sleepEntry && l.sleepEntry.durationMinutes > 0);
  const avgSleepMinutes = sleepLogs.length
    ? Math.round(sleepLogs.reduce((s, l) => s + l.sleepEntry.durationMinutes, 0) / sleepLogs.length)
    : 0;
  const avgSleepQuality = sleepLogs.length
    ? parseFloat((sleepLogs.reduce((s, l) => s + (l.sleepEntry.quality || 0), 0) / sleepLogs.length).toFixed(1))
    : 0;

  // Mood and energy
  const moodLogs = logs.filter(l => l.moodScore > 0);
  const avgMoodScore = moodLogs.length
    ? parseFloat((moodLogs.reduce((s, l) => s + l.moodScore, 0) / moodLogs.length).toFixed(1))
    : 0;
  const energyLogs = logs.filter(l => l.energyScore > 0);
  const avgEnergyScore = energyLogs.length
    ? parseFloat((energyLogs.reduce((s, l) => s + l.energyScore, 0) / energyLogs.length).toFixed(1))
    : 0;

  // Legacy aggregates kept for backward compatibility
  const workoutDone = logs.filter(l => l.completedWorkout).length;
  const waterMetDays = logs.filter(l => (Number(l.waterIntake) || 0) >= waterGoal).length;

  return {
    workoutStreak,
    waterStreak,
    avgCompletion,
    weightLost,
    totalDaysLogged: n,
    avgWater,
    latestWeight,
    avgCalories, avgProtein, avgCarbs, avgFat,
    avgSleepMinutes, avgSleepQuality,
    avgMoodScore, avgEnergyScore,
    workoutCompletionRate: parseFloat(((workoutDone / n) * 100).toFixed(2)),
    waterGoalMetDays: waterMetDays,
    totalLogs: n
  };
}

module.exports = computeStats;
