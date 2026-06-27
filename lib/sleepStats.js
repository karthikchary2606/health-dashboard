'use strict';

const GOAL_MINUTES = 450; // 7.5 hours

/**
 * Compute sleep stats from an array of sleep entry objects.
 *
 * @param {Array<{date: string, durationMinutes: number, quality: number}>} entries
 *   Sorted descending by date (newest first). Each entry must have `date` (YYYY-MM-DD),
 *   `durationMinutes` (number > 0), and `quality` (1–5).
 * @param {Date} [now] - injectable for testing; defaults to new Date()
 * @returns {{ avgDurationMinutes: number, avgQuality: number, goalNightsThisWeek: number, currentStreak: number }}
 */
function computeSleepStats(entries, now) {
  now = now || new Date();

  if (!entries || entries.length === 0) {
    return { avgDurationMinutes: 0, avgQuality: 0, goalNightsThisWeek: 0, currentStreak: 0 };
  }

  // --- avg duration + quality (count only entries with actual values) ---
  const durationEntries = entries.filter(e => e.durationMinutes > 0);
  const qualityEntries = entries.filter(e => e.quality > 0);

  const avgDurationMinutes = durationEntries.length > 0
    ? Math.round(durationEntries.reduce((s, e) => s + e.durationMinutes, 0) / durationEntries.length)
    : 0;
  const avgQuality = qualityEntries.length > 0
    ? Math.round((qualityEntries.reduce((s, e) => s + e.quality, 0) / qualityEntries.length) * 10) / 10
    : 0;

  // --- goal nights this week (Mon–Sun) ---
  const todayStr = toDateStr(now);
  const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  const mondayStr = toDateStr(monday);

  const goalNightsThisWeek = entries.filter(e =>
    e.date >= mondayStr && e.date <= todayStr && e.durationMinutes >= GOAL_MINUTES
  ).length;

  // --- current streak (consecutive days ending today, descending) ---
  const entryDates = new Set(entries.map(e => e.date));
  let streak = 0;
  const cursor = new Date(now);
  while (true) {
    const dateStr = toDateStr(cursor);
    if (!entryDates.has(dateStr)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { avgDurationMinutes, avgQuality, goalNightsThisWeek, currentStreak: streak };
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

module.exports = { computeSleepStats, GOAL_MINUTES };
