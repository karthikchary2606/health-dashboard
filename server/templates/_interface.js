/**
 * Plan Template Interface
 *
 * Every template module (weight-loss.js, muscle-gain.js, etc.) MUST export
 * the following functions. Each receives the full User.profile sub-doc.
 *
 * @module PlanTemplate
 */

/**
 * @typedef {Object} DayMeals
 * @property {string} breakfast
 * @property {string} lunch
 * @property {string} dinner
 * @property {string[]} snacks
 * @property {number} approxCalories
 */

/**
 * @typedef {Object} MonthDiet
 * @property {string} monthLabel  e.g. "Month 1 — Foundation"
 * @property {DayMeals[]} weekdays  7 items, index 0=Monday
 * @property {string[]} guidelines
 */

/**
 * @typedef {Object} WorkoutDay
 * @property {string} day
 * @property {string} focus
 * @property {Object[]} exercises  [{name, sets, reps, notes}]
 */

/**
 * @typedef {Object} MonthWorkout
 * @property {string} monthLabel
 * @property {WorkoutDay[]} schedule  7 items
 */

/**
 * @typedef {Object} CardioPlan
 * @property {string} monthLabel
 * @property {Object[]} sessions  [{day, type, duration, intensity}]
 * @property {Object} hrZones  {fat_burn, cardio, peak}
 */

/**
 * @typedef {Object} GroceryList
 * @property {string} monthLabel
 * @property {Object[]} categories  [{name, items: string[]}]
 */

/**
 * @typedef {Object} ChecklistItem
 * @property {string} category  e.g. "diet", "workout", "medication"
 * @property {string} text
 * @property {boolean} [isWeekly]
 */

/**
 * @typedef {Object} PlanMeta
 * @property {string} templateName
 * @property {number} totalMonths
 * @property {number} currentMonth  1-based, computed from startDate
 * @property {number} currentPhase  1-based phase index
 * @property {string} currentPhaseLabel
 * @property {Object[]} phases  [{label, months, description}]
 */

/**
 * Returns the diet plan for all months.
 * For stub months, return null in the array slot.
 * @param {Object} profile - User.profile
 * @returns {(MonthDiet|null)[]}  Length = totalMonths
 */
// exports.getDietPlan = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {(MonthWorkout|null)[]}
 */
// exports.getWorkoutPlan = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {(CardioPlan|null)[]}
 */
// exports.getCardioPlan = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {(GroceryList|null)[]}
 */
// exports.getGroceryList = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {ChecklistItem[]}
 */
// exports.getDefaultChecklist = (profile) => { ... }

/**
 * @param {Object} profile
 * @returns {PlanMeta}
 */
// exports.getPlanMeta = (profile) => { ... }
