# Design Spec: Multi-User Auth, User Management & Breathing Exercises

**Date:** 2026-06-15  
**Author:** Karthik Chary  
**Status:** Approved  

---

## 1. Problem Statement

The Health Engine application (kaha.online) was built as a single-user personal health tracker. The goal is to open it to all users with:

1. **Login-based authentication** — all features gated behind a user account
2. **User management** — admin-controlled registration approval and user administration
3. **Breathing exercises** — guided sessions with session logging
4. **Modular frontend architecture** — split the monolithic `index.html` into separate JS modules

---

## 2. Architecture

### 2.1 Backend Structure

```
health-dashboard/
├── server.js                  (entry point — mounts all routers)
├── routes/
│   ├── auth.js                (POST /api/auth/register, /login, /logout, /me)
│   ├── logs.js                (GET/POST /api/logs/:date, /weight-history, /stats)
│   ├── admin.js               (user management — admin role required)
│   ├── breathing.js           (GET/POST /api/breathing/sessions)
│   └── checklist.js           (GET/POST/PATCH/DELETE /api/checklist/items)
├── models/
│   ├── User.js
│   ├── HealthLog.js           (existing schema + userId field; checklist items referenced by id)
│   ├── BreathingSession.js    (new)
│   └── ChecklistItem.js       (new — per-user customisable checklist items)
├── middleware/
│   ├── auth.js                (verifyToken from httpOnly cookie — attaches req.user)
│   └── requireAdmin.js        (role: 'admin' check)
├── scripts/
│   ├── seed-admin.js          (create first admin account)
│   └── migrate-logs.js        (attribute existing logs to admin user; run locally with MONGODB_URI=<prod>)
└── public/
    ├── index.html             (app shell — JS checks cookie via /api/auth/me; redirects to /login.html if 401)
    ├── login.html             (login + register forms)
    ├── admin.html             (admin panel — redirects if not admin)
    └── js/
        ├── api.js             (fetch wrapper — credentials:'include' for cookie; handles 401 redirect)
        ├── auth.js            (login/logout, page-load auth check, sidebar personalisation)
        ├── dashboard.js
        ├── diet.js
        ├── recipes.js
        ├── workout.js
        ├── cardio.js
        ├── progress.js
        ├── guidelines.js
        ├── grocery.js
        ├── breathing.js
        └── checklist-settings.js  (checklist item CRUD UI — in Settings section)
```

### 2.2 Auth Flow

- JWT issued as `httpOnly`, `SameSite=Strict`, `Secure` cookie (key: `health_token`)
- Token payload: `{ userId, email, role, iat, exp }` — 7-day expiry; no refresh token
- On page load: `api.js` calls `GET /api/auth/me` with `credentials: 'include'`. If cookie missing or expired (401), redirect to `/login.html`. JWT is trusted fully — no additional DB check per request (de-approval takes effect at next token expiry, max 7 days)
- `api.js` wraps all `fetch` calls with `credentials: 'include'`, handles 401 with auto-redirect to login
- On page load, `auth.js` injects `{ name, profile }` from `/me` response into the sidebar (name, age, height) replacing any hardcoded personal data
- The sidebar footer (previously "Thyronorm 12.5mg · LCHF Diet") is **removed** from the template entirely

### 2.3 Frontend Modularisation

**JS extraction only** — the HTML section markup remains in `index.html`. `index.html` becomes the app shell with HTML structure intact; all business logic, data fetching, and DOM manipulation moves to the separate JS files in `public/js/`. Inline `<script>` blocks in `index.html` are removed (except minimal nav/layout helpers).

### 2.4 New Dependencies

| Package | Purpose |
|---------|---------|
| `bcryptjs` | Password hashing (pure JS, no native build deps — safe for Azure App Service) |
| `jsonwebtoken` | JWT signing/verification |
| `cookie-parser` | Parse `httpOnly` cookie on incoming requests |
| `express-rate-limit` | Brute-force protection on `/api/auth/login` and `/api/auth/register` |

### 2.5 localStorage Fallback — Removed

The existing localStorage fallback (used when MongoDB is offline) is **removed**. A multi-user app with shared browser storage is a data privacy risk. On DB unavailability, the API returns 503 and the frontend displays a clear "Service temporarily unavailable" banner. No writes are accepted during outages.

---

## 3. Data Models

### 3.1 User

```js
{
  email:        String (unique, required, lowercase),
  passwordHash: String (bcryptjs, 12 rounds),
  name:         String (required),
  role:         enum ['user', 'admin'] (default: 'user'),
  isApproved:   Boolean (default: false),
  profile: {
    age:                Number,
    heightCm:           Number,
    startWeightKg:      Number,
    goalWeightKg:       Number,
    startDate:          Date,               // drives phase auto-calculation
    dietaryPreferences: [String]
  },
  lastActiveAt: Date,
  createdAt:    Date (auto)
}
```

**Registration flow:** User submits registration → account created with `isApproved: false` → admin sees pending user in admin panel → approves → user can now log in. Login attempt with `isApproved: false` returns HTTP 403 with message "Your account is awaiting admin approval."

**Rate limiting:** `express-rate-limit` applied to `POST /api/auth/login` (10 attempts per 15 min per IP) and `POST /api/auth/register` (5 attempts per 15 min per IP).

### 3.2 HealthLog (updated)

```js
{
  userId:           ObjectId (ref: User, required),   // ← new field
  date:             String (YYYY-MM-DD),
  checklist:        [{ itemId: ObjectId, done: Boolean }],  // ← updated: references ChecklistItem
  waterIntake:      Number,
  weight:           Number,
  completedWorkout: Boolean,
  moodScore:        Number (1–5),
  energyScore:      Number (1–5),
  notes:            String
}
// Indexes: compound unique { userId, date }
```

### 3.3 ChecklistItem (new)

```js
{
  userId:    ObjectId (ref: User, required),
  label:     String (required),
  order:     Number (for sorting),
  isActive:  Boolean (default: true),
  createdAt: Date (auto)
}
// Default items seeded on first login: 8 generic health habits
// (e.g. "8 hours sleep", "30 min walk", "2L water minimum", etc.)
```

### 3.4 BreathingSession (new)

```js
{
  userId:           ObjectId (ref: User, required),
  technique:        enum ['box', '4-7-8', 'wim-hof', 'diaphragmatic'],
  durationSeconds:  Number,
  cyclesCompleted:  Number,
  moodBefore:       Number (1–5),
  moodAfter:        Number (1–5),
  completedAt:      Date (default: now)
}
```

---

## 4. API Endpoints

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | None | Create account (`isApproved: false`) |
| POST | `/login` | None | Returns JWT if approved |
| GET | `/me` | User | Returns current user profile |
| POST | `/logout` | User | Invalidates session (client-side token removal) |

### Logs (`/api/logs`) — require auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/:date` | Get or create log for user+date |
| POST | `/` | Upsert log for user+date |
| GET | `/weight-history` | Weight over time for current user |
| GET | `/stats` | 30-day stats for current user |

### Breathing (`/api/breathing`) — require auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions` | Save completed session |
| GET | `/sessions` | List user's sessions (last 30) |

### Admin (`/api/admin`) — require admin role
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | All users |
| PATCH | `/users/:id/approve` | Approve/unapprove user |
| POST | `/users` | Admin-created user account |
| DELETE | `/users/:id` | Delete user and their data |
| PATCH | `/users/:id/password` | Reset user password |

---

## 5. Breathing Exercises Feature

### 5.1 Techniques

| Technique | Pattern | Use Case |
|-----------|---------|----------|
| Box Breathing | Inhale 4s → Hold 4s → Exhale 4s → Hold 4s | Stress, focus |
| 4-7-8 | Inhale 4s → Hold 7s → Exhale 8s | Sleep prep, anxiety |
| Wim Hof | 30× deep breaths → exhale hold → inhale hold | Energy, cold exposure |
| Diaphragmatic | Inhale 4s (belly) → Exhale 6s (pursed lips) | Relaxation, daily practice |

### 5.2 Guided Session UI

1. **Technique selection** — 4 cards, each showing technique name, description, recommended use
2. **Configuration** — cycle count (input, default: 5), mood check-in before (1–5 score)
3. **Guided session** — full-screen animated breathing circle:
   - CSS keyframe animation: expand on inhale, hold, contract on exhale
   - Phase label: "Inhale", "Hold", "Exhale"
   - Countdown timer per phase
   - Cycle counter (e.g. "Round 3 of 5")
   - Audio cue toggle (soft chime via Web Audio API)
4. **Completion** — mood check-in after, session summary, auto-save to API

### 5.3 Session History

- Card list: date, technique, duration, mood delta (before → after)
- Weekly summary stat: sessions this week, average mood improvement

### 5.4 State Machine (`breathing.js`)

```
idle → configuring → inhale → hold1 → exhale → hold2 → idle (loop per cycle)
       ↓                                                      ↓
     (on start)                                        (cycles complete → completion)
```

---

## 6. Admin Panel (`admin.html`)

**Access:** Checks JWT cookie on load; if `role !== 'admin'` → redirect to `/index.html`.

**Sections:**
- **Stats strip** — total users, active this week, pending count
- **Pending approvals** — name, email, registered date; "Approve" / "Reject" buttons
- **All users** — name, email, role, last active, log count; deactivate/delete/reset-password actions
- **Add user** — manual account creation form (name, email, temp password)

**API endpoints (admin-only):**
- `GET /api/admin/users` — all users
- `PATCH /api/admin/users/:id/approve` — flip isApproved
- `POST /api/admin/users` — create user
- `DELETE /api/admin/users/:id` — remove user + their data
- `PATCH /api/admin/users/:id/password` — reset user password

---

## 7. Phase Progression (Diet & Workout)

The phase (1 = Foundation, 2 = Strength, 3 = Cut) auto-calculates from `profile.startDate`:

- Weeks 1–8 → Phase 1
- Weeks 9–16 → Phase 2
- Weeks 17–24 → Phase 3

New users who haven't set `profile.startDate` default to Phase 1, Week 1. A "Set start date" prompt appears on first login. Users can manually override their current phase/week in Settings.

---

## 8. Deployment & Migration

### 8.1 New Environment Variables (Azure App Service Config)

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Random 64-char string — **required**; server refuses to start if not set |
| `MONGODB_URI` | Already exists |

Server startup guard:
```js
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not set — refusing to start');
  process.exit(1);
}
```

### 8.2 One-Time Setup After Deployment

Migration scripts run locally pointing at production MongoDB:

```bash
# 1. Create admin account
MONGODB_URI=<prod-uri> npm run seed:admin
# prompts: email, name, password → creates user with role:'admin', isApproved:true

# 2. Attribute existing HealthLog documents to admin account
MONGODB_URI=<prod-uri> npm run migrate:logs
# finds admin user by email, sets userId on all HealthLog docs where userId is null
# Script is idempotent — safe to re-run
```

### 8.3 CI/CD

No pipeline changes. Existing GitHub Actions workflow (push to `main` → ZIP deploy to Azure App Service) remains unchanged. New static JS files in `public/js/` are included in the ZIP automatically.

### 8.4 Rollout Order

1. Add `JWT_SECRET` to Azure App Service configuration
2. Push code to `main` → auto-deploy triggers
3. Run `seed:admin` locally → creates admin account
4. Run `migrate:logs` locally → attributes existing data to admin
5. Auth middleware is live — all API routes now require valid JWT cookie

---

## 9. Shared Content vs Per-User Plans

The current diet, workout, and recipe data is baked into `index.html` as JavaScript arrays. Post-migration:

- **Shared/static content** — Telugu recipes, general workout templates, cardio plans — remain as JavaScript data in their respective `public/js/*.js` files, available to all users
- **Per-user customisation** — user profile (`startDate`, height, weight, goal) drives phase calculation and calorie targets
- **Daily logs** — fully per-user via `userId` in `HealthLog`
- **Future enhancement** (out of scope for this spec): custom plan editor per user

---

## 10. Out of Scope

- Password reset via email (no email service configured)
- OAuth / social login
- Per-user custom meal/workout plan editor
- Mobile app / PWA push notifications
- HTML template extraction (section markup stays in `index.html`)
