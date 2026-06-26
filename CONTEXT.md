# health-dashboard — Domain Glossary

Personal health tracker evolved into a multi-user platform. Deployed at kaha.online (Azure App Service + MongoDB Atlas).

## Core concepts

**Health Profile** — The full set of user-specific settings that drive all content: goal, body stats, dietary preferences, cuisine, fitness level, equipment, health conditions, medications, program start date, and assigned plan template. Stored as an embedded sub-document in the User. Source of truth for all plan content.

**Plan** — The computed content returned by `GET /api/profile/plan`. Derived from the user's Health Profile against a Plan Template. Includes diet schedule, workout schedule, cardio schedule, grocery list, seeds/supplements, current phase, and current month index. Not stored — computed at request time.

**Plan Template** — A server-side module in `server/templates/` that takes a Health Profile and returns a Plan. Four templates: `weight-loss`, `muscle-gain`, `maintenance`, `general-fitness`. Templates filter content by cuisine preference, health conditions, fitness level, and equipment.

**Health Log** — A daily record per user. Contains checklist completion, water intake, weight, workout completion, mood score, energy score, and notes. Stored as `HealthLog` documents indexed on `(userId, date)`.

**Checklist** — The user's daily task list. Stored as `ChecklistItem` documents per user. Seeded from the Plan Template on first use.

**Breathing Session** — A completed breathing exercise session. Stores technique, duration, cycles, and mood before/after.

**Phase** — A training period (Foundation, Strength, Cut) computed from the user's `profile.startDate`. Returned as part of the Plan — not computed client-side.

**Onboarding Wizard** — The 6-step first-login flow that collects a new user's Health Profile before granting dashboard access.

**Admin** — A user with `role: 'admin'`. Can approve/reject users, reset passwords, create users directly.

## Architectural decisions

- Plan data is computed at request time from Plan Templates — never stored in MongoDB.
- The `authenticate` middleware loads the full User document and attaches it to `req.user`. Routes do not query User independently.
- Phase and month index are computed server-side in Plan Templates and returned in the Plan response — not computed client-side.
- `planCache.js` (frontend) fetches the Plan once per session and shares it across all tab JS files.
- `apiFetch` (frontend) handles all response shapes: 401→login redirect, 403+redirect→onboarding redirect, 503→offline banner. Callers receive parsed data or null.
