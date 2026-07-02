'use strict';

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Returns the current day/date in IST (Asia/Kolkata, UTC+5:30).
 * Accepts an optional `now` Date for testing.
 *
 * @param {Date} [now] - override for testing; defaults to new Date()
 * @returns {{ day: string, isoDate: string }}
 */
function todayIST(now) {
  const utcMs = (now || new Date()).getTime();
  const istMs = utcMs + IST_OFFSET_MS;
  const istDate = new Date(istMs);
  const day = DAY_NAMES[istDate.getUTCDay()];
  const yyyy = istDate.getUTCFullYear();
  const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(istDate.getUTCDate()).padStart(2, '0');
  return { day, isoDate: `${yyyy}-${mm}-${dd}` };
}

module.exports = { todayIST };
