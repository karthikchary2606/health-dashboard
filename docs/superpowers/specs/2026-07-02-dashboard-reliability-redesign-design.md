# Dashboard Reliability + Personalization Redesign

## Status
Approved design (brainstorming + grill review with user).

## Problem statement
Production behavior is not trustworthy for core user outcomes:
- Daily Timeline intermittently missing.
- Diet preview appears generic even after profile capture.
- Recipe collection sometimes empty or not aligned to profile preferences.
- Dashboard quality does not match expected production confidence.

Current test passes are insufficient because API-level assertions do not guarantee end-user dashboard correctness across personas.

## Scope
In scope:
1. Stabilize dashboard data contract and loading behavior.
2. Enforce strict personalization consistency for timeline, diet, and recipes.
3. Redesign dashboard UI incrementally after data reliability gate.
4. Introduce hard persona-based browser E2E release gate.

Out of scope:
1. Full app rewrite.
2. Non-dashboard module redesign unless needed for shared personalization utility.

## Chosen approach
**Approach B (selected):** Thin architecture refactor + UX refresh.

Why:
- Lower delivery risk than full rewrite.
- Higher long-term reliability than patch-only fixes.
- Enables incremental rollout with measurable parity.

## Section 1 — Architecture
1. Add **`GET /api/dashboard/overview`** as a single dashboard contract returning:
   - `timeline`
   - `dietPreview`
   - `recipePreview`
   - `stats`
   - `profileCompleteness`
2. Dashboard reads only this contract for initial render; stop stitching multi-source state in client.
3. Keep `/api/profile/plan` for module pages; dashboard consumes overview API.
4. Add explicit state model per dashboard block:
   - `empty`
   - `partial`
   - `error`
   (No indefinite `"Loading..."` state.)
5. Include version metadata:
   - `profileUpdatedAt`
   - `planVersion`
   to detect stale cache and force invalidation.

## Section 2 — Personalization contract
Shared rule engine is used by both diet plan and recipe preview.

Rule order:
1. `dietType` hard filter.
2. `foodAllergies` and `culturalFoodAvoidances` hard exclusion.
3. `cuisinePreference` filter.
4. `foodList` affinity boost (ranking), not hard exclusion by default.

Additional requirements:
1. Timeline derives from a computed daily schedule object (`today.tasks`, `today.meals`, `today.workoutFocus`) from server contract.
2. Missing profile inputs show explicit prompts (which field is missing and why it affects personalization), never silent fallback to generic content.

## Section 3 — Quality gate
Hard release gate: persona-based browser E2E matrix.

Minimum persona matrix dimensions:
- Diet: vegetarian / non-vegetarian / vegan
- Language community: Telugu / Tamil / Hindi
- Goal: weight-loss / muscle-gain / maintenance

Required assertions per persona:
1. Timeline renders with at least one task entry.
2. Recipe grid renders at least one card.
3. Diet preview respects diet + cuisine constraints.
4. Calorie target equals profile-derived macro target.

Additional gate:
1. Visual regression snapshots for dashboard cards in old/new flag states.
2. Deployment blocked on any persona failure.

## Section 4 — Rollout strategy
Incremental rollout behind `dashboard_v2` feature flag.

Phase sequence:
1. Week 1: overview API + shared personalization utility + instrumentation.
2. Week 2: migrate dashboard to overview API behind flag.
3. Week 3: UI redesign on stable contract.
4. Week 4: persona UAT, parity comparison, old path removal.

## Risks and mitigations
1. **Risk:** UI redesign hides unresolved data defects.  
   **Mitigation:** No redesign rollout without passing persona gate.
2. **Risk:** Contract drift between dashboard and module pages.  
   **Mitigation:** Shared personalization utility + contract tests.
3. **Risk:** Cache staleness after profile edits.  
   **Mitigation:** Versioned payload + invalidation on mismatch.

## Success criteria
1. No dashboard card remains in `"Loading..."` after data response.
2. Timeline, diet, and recipes are populated and profile-aligned for all required personas.
3. Release blocked automatically when any persona assertion fails.
4. New dashboard ships with parity and then quality lift (layout + usability), without correctness regression.

