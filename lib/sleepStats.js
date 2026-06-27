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

  // --- avg duration + quality (all entries) ---
  const total = entries.reduce((acc, e) => {
    acc.dur += e.durationMinutes || 0;
    acc.qual += e.quality || 0;
    return acc;
  }, { dur: 0, qual: 0 });

  const avgDurationMinutes = Math.round(total.dur / entries.length);
  const avgQuality = Math.round((total.qual / entries.length) * 10) / 10;

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
  return d.toISOString().slice(0, 10);
}

module.exports = { computeSleepStats, GOAL_MINUTES };
