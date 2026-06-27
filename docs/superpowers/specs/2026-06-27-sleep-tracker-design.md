# Sleep Tracker — Design Spec
**Date:** 2026-06-27  
**Status:** Approved  
**Scope:** Single sprint — sleep tracking only (water and meal logging are follow-on sprints)

---

## Overview

Add a dedicated sleep tracking module to the health dashboard. Users log each night's sleep (duration + emoji quality rating), view a 7-day bar chart, and see aggregated insight cards. A summary card on the main dashboard links to the full sleep page.

---

## Architecture

### Data model — extend `HealthLog`

Add a `sleepEntry` sub-document to the existing `HealthLog` Mongoose model. No new model needed.

```js
sleepEntry: {
  bedtime:         { type: String },           // "22:30" — optional
  wakeTime:        { type: String },           // "06:15" — optional
  durationMinutes: { type: Number },           // required (calculated or entered directly)
  quality:         { type: Number, min: 1, max: 5 }, // 1=😩 2=😴 3=😐 4=😊 5=🤩
  notes:           { type: String, default: '' }
}
```

**Validation rule:** Either `durationMinutes > 0` OR both `bedtime` + `wakeTime` must be present. Server calculates `durationMinutes` from times when both are provided. If `wakeTime < bedtime` (overnight sleep), add 24h to the wake side before subtracting.

**Sleep goal:** 7.5 hours (450 minutes). Hardcoded default for now; configurable from settings in a future sprint.

---

## API

All endpoints mounted at `/api/sleep`, behind `authenticate + requireProfile` middleware.

### `POST /api/sleep`
Create or update today's sleep entry. Upserts into the `HealthLog` document for the given date.

**Request body:**
```json
{
  "date": "2026-06-27",
  "bedtime": "22:30",
  "wakeTime": "06:15",
  "durationMinutes": 465,
  "quality": 4,
  "notes": "Woke up once around 3am"
}
```
- `date` defaults to today if omitted (frontend always sends it explicitly, defaulting the picker to yesterday)
- Either `bedtime + wakeTime` OR `durationMinutes` is required
- Returns 400 with `{ error: "..." }` if validation fails
- Returns the saved `sleepEntry` on success

### `GET /api/sleep/history`
Returns the last 30 days of sleep entries, sorted descending by date. Used by the chart and history table.

**Response:**
```json
[
  { "date": "2026-06-27", "durationMinutes": 465, "quality": 4, "bedtime": "22:30", "wakeTime": "06:15", "notes": "..." },
  ...
]
```

### `GET /api/sleep/stats`
Aggregated stats for the current week (Mon–Sun).

**Response:**
```json
{
  "avgDurationMinutes": 444,
  "avgQuality": 3.7,
  "goalNightsThisWeek": 5,
  "currentStreak": 4
}
```
- `goalNightsThisWeek`: nights where `durationMinutes >= 450` (7.5h)
- `currentStreak`: consecutive days ending today with a sleep entry logged

---

## Frontend

### `public/sleep.html` + `public/js/sleep.js`

**Page structure (single column, top → bottom):**

1. **Log form**
   - Date input (defaults to yesterday — most common use case)
   - Bedtime time-picker + Wake time-picker → auto-calculates and displays duration
   - "Or enter hours directly" fallback number input
   - Emoji quality picker: 😩 😴 😐 😊 🤩 (clicking one selects it, stores 1–5)
   - Optional notes textarea
   - Save button → `POST /api/sleep` → shows success toast

2. **Insight cards row (4 cards)**
   - Avg This Week (hours)
   - Goal Nights (n/7)
   - Avg Quality (emoji)
   - Current Streak (days 🔥)
   - Shows `—` if fewer than 3 entries exist

3. **7-day bar chart** (Chart.js, same library already on the page)
   - Bar per night, height = duration in hours
   - Green bar = met goal (≥7.5h), purple = below goal, grey = not logged
   - Horizontal dashed line at 7.5h goal
   - X-axis: day labels (Mon–Sun)

4. **Recent nights table**
   - Columns: Date | Duration | Quality | Notes
   - Last 7 entries
   - Empty state: "No sleep entries yet — log your first night above"

**Script load order in `sleep.html`:**
```html
<script src="/js/api.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/sleep.js"></script>
```

### Dashboard integration (`public/index.html` + `public/js/dashboard.js`)

Add a sleep summary card to the main dashboard stats area:
- Fetches `GET /api/sleep/history` (first result = most recent night)
- Shows: duration + quality emoji + "Last night"
- If no entry: shows "Log last night's sleep →" linking to `sleep.html`
- Does not block other dashboard sections if the fetch fails (graceful degradation)

---

## Error Handling

- All async route handlers use `try/catch` + `next(err)` (consistent with existing routes)
- `POST /api/sleep`: 400 on missing/invalid duration, 401 on missing auth, 500 on DB error
- Front-end toasts on save success (`"Sleep logged ✓"`) and failure (`"Failed to save — try again"`)
- Chart and history sections show empty states gracefully — no crashes if data is missing

---

## Testing

### `tests/routes/sleep.test.js` (Supertest + mongodb-memory-server)
- `POST /api/sleep` creates a new entry
- `POST /api/sleep` upserts when same date submitted twice
- `POST /api/sleep` returns 400 when neither duration nor times provided
- `POST /api/sleep` calculates duration correctly from bedtime + wakeTime (including overnight)
- `GET /api/sleep/history` returns entries sorted descending by date
- `GET /api/sleep/stats` returns correct streak and goal night count

### `tests/lib/sleepStats.test.js` (unit tests)
Extract the stats aggregation logic into `lib/sleepStats.js` (pure function) and test independently:
- Streak: 0 when no entries
- Streak: resets when a day is missed
- Goal nights: counts correctly against 450-minute threshold
- Avg quality rounds to 1 decimal

---

## Files Changed / Created

| File | Action |
|------|--------|
| `models/HealthLog.js` | Extend schema with `sleepEntry` sub-document |
| `routes/sleep.js` | New — POST, GET /history, GET /stats |
| `lib/sleepStats.js` | New — pure stats aggregation function |
| `server.js` | Mount `routes/sleep.js` at `/api/sleep` |
| `public/sleep.html` | New — full sleep tracker page |
| `public/js/sleep.js` | New — frontend logic |
| `public/index.html` | Add sleep summary card + nav link |
| `public/js/dashboard.js` | Fetch and render sleep summary card |
| `tests/routes/sleep.test.js` | New |
| `tests/lib/sleepStats.test.js` | New |

---

## Out of Scope (Follow-on Sprints)

- Water / hydration tracker
- Meal logging
- Configurable sleep goal from settings page
- Sleep recommendations based on patterns
- Correlation analysis (sleep vs workout performance)
