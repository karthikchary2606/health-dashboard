/**
 * Compute aggregate health stats from an array of HealthLog documents.
 * @param {Object[]} logs - HealthLog docs (plain objects or Mongoose docs)
 * @param {Object} profile - User.profile sub-doc
 * @param {number} profile.waterGoalL - daily water goal in litres
 * @returns {Object} stats
 */
function computeStats(logs, profile) {
  const waterGoal = (profile && profile.waterGoalL) || 2.5;

  if (!logs || logs.length === 0) {
    return {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      workoutCompletionRate: 0,
      waterGoalMetDays: 0,
      latestWeight: null,
      totalLogs: 0
    };
  }

  const n = logs.length;
  const sum = (field) => logs.reduce((acc, l) => acc + (Number(l[field]) || 0), 0);

  const workoutDone = logs.filter(l => l.completedWorkout).length;
  const waterMetDays = logs.filter(l => (Number(l.waterIntake) || 0) >= waterGoal).length;

  const logsWithWeight = logs
    .filter(l => l.weight != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    avgCalories: Math.round(sum('calories') / n),
    avgProtein: Math.round(sum('protein') / n),
    avgCarbs: Math.round(sum('carbs') / n),
    avgFat: Math.round(sum('fat') / n),
    workoutCompletionRate: parseFloat(((workoutDone / n) * 100).toFixed(2)),
    waterGoalMetDays: waterMetDays,
    latestWeight: logsWithWeight.length ? logsWithWeight[0].weight : null,
    totalLogs: n
  };
}

module.exports = computeStats;
