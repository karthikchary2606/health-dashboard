# Profile & Onboarding V2 — Design Spec
**Date:** 2026-06-27  
**Status:** Approved  
**Scope:** Profile data model extension, onboarding wizard redesign, deep-profile dashboard page, plan engine integration, periodic condition review system

---

## 1. Problem Statement

The current onboarding captures a single diet-type label (vegetarian / eggetarian / non-vegetarian / vegan) and a cuisine preference. This is too coarse:

- Users with mixed diets (e.g., mostly vegetarian + chicken twice a week) have no way to express that
- Cultural food norms (religious avoidances, regional cuisine) are not captured
- Health conditions and medications are permanent once entered — no way to mark them resolved
- The plan engine generates meals from cuisine pools, not from what the user actually eats
- No preference history — plan changes cannot be traced to profile changes

---

## 2. Approach

**A + C hybrid:**
- **A:** Extend `User` model with new fields; add a lean Phase 2 "Complete Your Profile" dashboard page
- **C:** Add a `ProfileSnapshot` collection for versioned preference history — written on onboarding completion, every settings save, and periodic check-in responses

---

## 3. Data Model

### 3.1 User Model — New Fields

```js
// Cultural identity
religion:               String   // 'Hindu' | 'Muslim' | 'Christian' | 'Jain' | 'Sikh' | 'Other'
languageCommunity:      String   // 'Telugu' | 'Tamil' | 'Kannada' | 'Malayalam' | 'Hindi' | 'Other'
culturalFoodAvoidances: [String] // e.g. ['beef', 'pork', 'onion', 'garlic', 'alcohol']

// Food list — what the user actually eats
foodList: [{
  name:     String,   // 'Pesarattu', 'Chicken curry', 'Idli'
  category: String,   // 'grains' | 'vegetables' | 'proteins' | 'dairy' | 'snacks' | 'beverages'
  custom:   Boolean   // true = user typed it; false = selected from checklist
}]

// Periodic review
reviewReminderDays: Number   // 30 | 60 | 90 (default: 60)
lastReviewedAt:     Date
```

### 3.2 Existing Fields — Modified

**healthConditions** — change from `[String]` to structured objects:
```js
healthConditions: [{
  name:       String,
  active:     Boolean,  // true = still affects plan; false = resolved
  resolvedAt: Date      // set when user marks as resolved
}]
```

**medications** — same pattern:
```js
medications: [{
  name:       String,
  dosage:     String,
  timing:     String,
  active:     Boolean,
  resolvedAt: Date
}]
```

### 3.3 New Collection — ProfileSnapshot

```js
{
  userId:     ObjectId,  // ref: User
  snapshotAt: Date,
  reason:     String,    // 'onboarding' | 'user-edit' | 'periodic-review'
  data:       Object     // full profile copy at time of snapshot
}
```

**Snapshot triggers:**
1. Onboarding wizard submit
2. Any save on Phase 2 "Complete Your Profile" page
3. Periodic check-in response (user reviews conditions)

---

## 4. Phase 1 Wizard — Registration (8 Steps)

Goal: capture only what is needed to generate a first usable plan. Everything deeper goes to Phase 2.

| Step | Content |
|------|---------|
| 1 | Name, Email, Password |
| 2 | Age, Height, Current weight, Goal weight |
| 3 | Primary goal: weight-loss / muscle-gain / maintenance / general-fitness |
| 4 | Fitness level + Activity level |
| 5 | Health conditions (multi-select checklist, each starts `active: true`) |
| 6 | Medications (add/remove rows: name, dosage, timing — each starts `active: true`) |
| 7 | Religion + Language community + Cultural food avoidances (multi-select: beef, pork, onion, garlic, alcohol + "Add custom avoidance" input) |
| 8 | Review & Submit |

**Removed from wizard:** cuisine preference and equipment (moved to Phase 2 — require more thought than registration flow allows).

**On submit:**
- Creates user + profile in DB
- Writes first `ProfileSnapshot` with `reason: 'onboarding'`
- Redirects to dashboard with Phase 2 completion prompt visible

---

## 5. Phase 2 — "Complete Your Profile" Dashboard Page

Accessible from a persistent completion card on the dashboard:
> *"Your profile is X% complete — finish to get a fully personalised plan"*

Percentage = fields filled / total Phase 2 fields.

### 5.1 Sections

**Cuisine & Equipment**
- Cuisine preference: south-indian / north-indian / continental / mixed
- Equipment available: 7-option checkbox group (same as current onboarding step 4)

**Your Food List**
- Categorised checklist: Grains, Vegetables, Proteins, Dairy, Snacks, Beverages
- Each category expandable — shows common items for that category pre-populated based on `languageCommunity` (e.g., Telugu users see Pesarattu, Gongura, Pulusu in Vegetables)
- "Add custom food" input at bottom of each category
- User checks items they eat; unchecked = not consumed

**Health Conditions Review**
- Each condition from Phase 1 listed with:
  - Active / Resolved toggle
  - "Resolved on" date picker (appears when toggled to resolved)

**Medications Review**
- Same active/resolved toggle per medication

**Periodic Review Preference**
- Reminder frequency: Every 30 / 60 / 90 days
- "Last reviewed" date shown

**Every save on this page:**
- PATCHes the profile
- Writes a `ProfileSnapshot` with `reason: 'user-edit'`

---

## 6. Plan Engine Integration

### 6.1 Food List → Meal Selection

- When `foodList` has ≥ 10 items: meal composer filters meals so all ingredients are within the user's food list
- When `foodList` is empty (Phase 2 not completed): falls back to current cuisine-pool logic
- `culturalFoodAvoidances[]` is always a hard exclude — any meal containing an avoided ingredient is never shown, regardless of food list state

### 6.2 Active/Resolved Conditions → Plan Constraints

- Plan engine reads only `healthConditions` where `active === true`
- Resolved conditions are ignored in contraindication checks (exercise restrictions, dietary flags)
- Same for medications: only `active === true` medications affect plan

### 6.3 Plan Versioning

- Each generated plan records `snapshotId` (the ProfileSnapshot it was generated from)
- On profile save: if any plan-relevant field changed (foodList, avoidances, active conditions, goal), plan cache is invalidated and regenerated on next load

### 6.4 Religion + Language → Checklist Pre-population

- Phase 2 food checklist pre-selects commonly eaten foods based on `languageCommunity`:
  - Telugu: Idli, Dosa, Pesarattu, Gongura, Pulusu, Boorelu, Pongal, Rayalaseema items
  - Tamil: Pongal, Sambar, Rasam, Kozhukattai, Chettinad items
  - Kannada: Bisi bele bath, Ragi mudde, Coorg items
  - Others: generic South Indian / North Indian sets
- User can uncheck any pre-selected item
- `culturalFoodAvoidances` from Phase 1 are pre-checked in avoidances list

---

## 7. Periodic Review System

### 7.1 Check-in Flow

- Server-side: daily cron job (or on-login check) compares `lastReviewedAt + reviewReminderDays` against current date
- If overdue: dashboard shows dismissible banner:
  > *"It's been 60 days since you reviewed your health conditions. Take 2 minutes to update."*
- Clicking opens the Health Conditions Review section of the Phase 2 page
- On save: `lastReviewedAt` updated, `ProfileSnapshot` written with `reason: 'periodic-review'`

### 7.2 Dismiss Without Reviewing

- User can dismiss banner for 7 days ("Remind me later")
- After 3 consecutive dismissals, banner becomes non-dismissible until reviewed

---

## 8. API Changes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PATCH | `/api/profile` | Extended to accept all new fields |
| GET | `/api/profile/snapshots` | Returns snapshot history for a user |
| POST | `/api/profile/review` | Marks periodic review complete, writes snapshot |
| GET | `/api/profile/completion` | Returns % complete for Phase 2 prompt |

---

## 9. Migration

Existing users:
- `healthConditions: [String]` → migrated to `[{ name, active: true }]` (all assumed active)
- `medications: [{ name, dosage, timing }]` → add `active: true, resolvedAt: null` to each
- `foodList`: empty array (Phase 2 not yet completed — falls back to cuisine pool)
- `culturalFoodAvoidances`: empty array
- `religion`, `languageCommunity`: null (Phase 2 prompts for these)

Migration script: `scripts/migrate-profile-v2.js`

---

## 10. Testing

- Unit: ProfileSnapshot writes on each trigger
- Unit: Plan engine reads only `active: true` conditions/medications
- Unit: `culturalFoodAvoidances` hard-excludes from meal results
- Unit: foodList filter returns no meals with avoided ingredients
- Integration: Full onboarding wizard submit → ProfileSnapshot created
- Integration: Phase 2 save → snapshot written + plan cache invalidated
- Integration: Periodic review banner logic (overdue, dismiss, non-dismissible after 3)
- Migration: existing user data shape preserved and extended correctly
