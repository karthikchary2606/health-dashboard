# Effective Diet Inference + 4-Week Plan Rotation Design

## Goal
Enable personalization for users who select vegetarian but include eggs/chicken/fish in food preferences, and guarantee meaningful week-to-week variation with strong phase rotation every 4 weeks.

## Decisions Locked
1. Runtime diet inference from food preferences is the source of truth for plan generation.
2. Stored `profile.dietType` remains unchanged for backward compatibility and UX continuity.
3. Meal and workout generation use deterministic 4-week rotation blocks to ensure variation without random instability.

## Architecture
### 1) Effective Diet Resolution
Add `deriveEffectiveDiet(profile)` in planner composition flow:
- Base from `profile.dietType`.
- Infer upgrades from `profile.foodList` tokens:
  - egg terms => at least `eggetarian`
  - chicken/fish/meat terms => `non-vegetarian`
- Precedence:
  - `vegan` remains strict vegan (no override).
  - `vegetarian` can upgrade to `eggetarian` or `non-vegetarian`.
  - `eggetarian` can upgrade to `non-vegetarian`.
- Effective diet is used only for plan generation paths.

### 2) Deterministic Rotation Seed
Add a planner seed function:
- Seed inputs: `userId + planTemplate + goal + cuisinePreference + blockIndex`
- `blockIndex = floor(globalWeekIndex / 4)`
- Use seed for deterministic selection order in meal and workout pools.
- Guarantee same profile state => same results in same block; new block => new pattern set.

### 3) Meal Rotation Behavior
- Use effective diet pool filtering before meal selection.
- Add anti-repeat constraints:
  - No identical full-day meal tuple on adjacent weeks.
  - Enforce new meal pattern families per 4-week block.
- Respect existing avoidances/allergies filtering after diet inference.

### 4) Workout Rotation Behavior
- Keep mode detection (`gym/home/yoga/hybrid/cardio`) but rotate block templates:
  - Strength: split variants rotate per block.
  - Yoga: style emphasis rotates per block unless explicitly pinned by user.
  - Cardio: intensity/session variants rotate by block.
- Constraint: no identical weekly schedule structure in adjacent blocks.

## Components Impacted
- `server/engine/plan-builder.js`
  - Add effective diet + seed plumbing.
  - Introduce block-level variation control.
- `server/engine/meal-composer.js`
  - Consume effective diet and seeded picker.
  - Anti-repeat guards.
- Workout builder paths in `plan-builder.js`
  - Seeded rotation over schedule variants.

## Data Flow
1. Profile loaded.
2. `deriveEffectiveDiet(profile)` computed.
3. `rotationSeed(profile, weekIndex)` computed.
4. Meal/workout composers generate output from effective diet + block seed.
5. Existing response contracts remain unchanged for frontend.

## Error Handling
- If inferred effective diet conflicts with allergy/avoidance filters, planner applies safety filters first.
- If filtered pool empties, fallback to safest compatible pool and log explicit planner warning context.
- No silent broad catch; preserve existing error propagation behavior.

## Testing Strategy
### Unit
- Effective diet precedence matrix:
  - vegetarian + eggs => eggetarian
  - vegetarian + chicken => non-vegetarian
  - vegan + chicken token => remains vegan
- Rotation invariants:
  - week N and N+4 use different pattern families
  - no exact day-plan duplicates across adjacent blocks
- Avoidance/allergy safety remains enforced after inference.

### Integration
- Generate 6-month plans for personas:
  - vegetarian+egg/chicken preference user
  - strict vegetarian
  - strict vegan
  - non-vegetarian
- Assert module outputs vary by block while staying profile-consistent.

## Non-Goals
- No schema migration in this phase.
- No frontend profile form redesign in this phase.
- No random/non-deterministic generation.

## Rollout
1. Implement in planner/composers with tests.
2. Deploy and run persona regression checks.
3. Validate production outputs for existing users without profile changes.
