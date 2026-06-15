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
│   └── breathing.js           (GET/POST /api/breathing/sessions)
├── models/
│   ├── User.js
│   ├── HealthLog.js           (existing + userId field)
│   └── BreathingSession.js    (new)
├── middleware/
│   ├── auth.js                (verifyToken — attaches req.user)
│   └── requireAdmin.js        (role: 'admin' check)
├── scripts/
│   ├── seed-admin.js          (create first admin account)
│   └── migrate-logs.js        (attribute existing logs to admin user)
└── public/
    ├── index.html             (app shell — redirects to /login.html if unauthenticated)
    ├── login.html             (login + register forms)
    ├── admin.html             (admin panel — redirects if not admin)
    └── js/
        ├── api.js             (fetch wrapper with Authorization header)
        ├── auth.js            (token storage, login/logout, redirect logic)
        ├── dashboard.js
        ├── diet.js
        ├── recipes.js
        ├── workout.js
        ├── cardio.js
        ├── progress.js
        ├── guidelines.js
        ├── grocery.js
        └── breathing.js
```

### 2.2 Auth Flow

- JWT stored in `localStorage` (key: `health_token`)
- `auth.js` checks token on every page load; missing or expired → redirect to `/login.html`
- `api.js` wraps all `fetch` calls, injects `Authorization: Bearer <token>`, handles 401 responses with auto-redirect to login
- Token payload: `{ userId, email, role, iat, exp }` — 7-day expiry

### 2.3 Frontend Modularisation

`index.html` becomes a thin shell: loads `auth.js` first (auth check), then loads section JS files on demand as the user navigates. Each JS file is responsible for fetching data and rendering its section. Inline JS in `index.html` is removed except for navigation/layout helpers.

---

## 3. Data Models

### 3.1 User

```js
{
  email:        String (unique, required, lowercase),
  passwordHash: String (bcrypt, 12 rounds),
  name:         String (required),
  role:         enum ['user', 'admin'] (default: 'user'),
  isApproved:   Boolean (default: false),
  profile: {
    age:                Number,
    heightCm:           Number,
    startWeightKg:      Number,
    goalWeightKg:       Number,
    dietaryPreferences: [String]
  },
  lastActiveAt: Date,
  createdAt:    Date (auto)
}
```

**Registration flow:** User submits registration → account created with `isApproved: false` → admin sees pending user in admin panel → approves → user can now log in. Login attempt with `isApproved: false` returns HTTP 403 with message "Your account is awaiting admin approval."

### 3.2 HealthLog (updated)

```js
{
  userId:           ObjectId (ref: User, required),   // ← new field
  date:             String (YYYY-MM-DD),
  checklist:        [Boolean],
  waterIntake:      Number,
  weight:           Number,
  completedWorkout: Boolean,
  moodScore:        Number (1–5),
  energyScore:      Number (1–5),
  notes:            String
}
// Indexes: compound unique { userId, date }
```

### 3.3 BreathingSession (new)

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

**Access:** Checks JWT on load; if `role !== 'admin'` → redirect to `/index.html`.

**Sections:**
- **Stats strip** — total users, active this week, pending count
- **Pending approvals** — name, email, registered date; "Approve" / "Reject" buttons
- **All users** — name, email, role, last active, log count; deactivate/delete/reset-password actions
- **Add user** — manual account creation form (name, email, temp password)

---

## 7. Deployment & Migration

### 7.1 New Environment Variables (Azure App Service Config)

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

### 7.2 One-Time Setup After Deployment

```bash
# 1. Create admin account
npm run seed:admin
# prompts: email, name, password → creates user with role:'admin', isApproved:true

# 2. Attribute existing HealthLog documents to admin account
npm run migrate:logs
# finds admin user by email, sets userId on all HealthLog docs where userId is null
```

### 7.3 CI/CD

No pipeline changes. Existing GitHub Actions workflow (push to `main` → ZIP deploy to Azure App Service) remains unchanged. New static JS files in `public/js/` are included in the ZIP automatically.

### 7.4 Rollout Order

1. Add `JWT_SECRET` to Azure App Service configuration
2. Push code to `main` → auto-deploy triggers
3. Run `seed:admin` → creates admin account
4. Run `migrate:logs` → attributes existing data
5. Auth middleware is live — all API routes now require valid JWT

---

## 8. Shared Content vs Per-User Plans

The current diet, workout, and recipe data is baked into `index.html` as JavaScript arrays. Post-migration:

- **Shared/static content** — Telugu recipes, general workout templates, cardio plans — remain as JavaScript data in their respective `public/js/*.js` files, available to all users
- **Per-user customisation** — user profile (height, weight, goal, dietary preferences) drives display customisation (calorie targets, phase progression)
- **Daily logs** — fully per-user via `userId` in `HealthLog`
- **Future enhancement** (out of scope for this spec): custom plan editor per user

---

## 9. Out of Scope

- Password reset via email (no email service configured)
- OAuth / social login
- Per-user custom meal/workout plan editor
- Mobile app / PWA push notifications
- Rate limiting / brute-force protection (deferred)
