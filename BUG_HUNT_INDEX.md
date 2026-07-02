# Health Dashboard - Bug Hunt Report Index

**Date**: 2026-07-02 | **Status**: COMPLETE ✅

## Quick Access

### Issue Lists
- **[ISSUES_SUMMARY.txt](ISSUES_SUMMARY.txt)** - Read this first (concise summary, 13 KB)
- **[FINAL_BUG_HUNT_REPORT.txt](FINAL_BUG_HUNT_REPORT.txt)** - Full formatted report (26 KB)
- **[BUG_REPORT.md](BUG_REPORT.md)** - Detailed analysis with strategies (15 KB)
- **[ISSUES_TABLE.csv](ISSUES_TABLE.csv)** - Machine-readable format for tracking systems

## Summary

**Total Issues**: 11
- 🔴 **CRITICAL**: 3 (Blocks production workflow)
- 🟠 **HIGH**: 5 (Breaks key features)
- 🟡 **MEDIUM**: 2 (UX/Polish issues)
- 🔵 **LOW**: 1 (Edge case)

**Test Status**: ✅ ALL 253 EXISTING TESTS PASS

## Critical Issues (Must Fix First)

### 1. BreathingSession Technique Enum Mismatch
- **File**: `/routes/breathing.js` + `/models/BreathingSession.js`
- **Issue**: API returns Pranayama techniques but model rejects them
- **Fix Time**: 2 hours
- **Reproducible**: GET /api/breathing/techniques returns Pranayama; POST with same technique fails

### 2. HealthLog Stats Calculation Broken
- **File**: `/lib/computeStats.js` + `/routes/logs.js`
- **Issue**: Dashboard shows avgCalories: 0 due to nested structure mismatch
- **Fix Time**: 4 hours
- **Reproducible**: HealthLog with flat structure gets ignored

### 3. Sleep Duration API Confusion
- **File**: `/routes/logs.js` + `/routes/sleep.js`
- **Issue**: Top-level durationMinutes silently ignored (should error)
- **Fix Time**: 2 hours
- **Reproducible**: POST /api/logs with durationMinutes doesn't save sleep

## High Severity Issues

### 4. Yoga Style Not Applied to Workouts
- **File**: `/server/engine/plan-builder.js`
- **Fix**: Pass yogaStyle to exercise composer

### 5. Missing Profile Validation
- **File**: `/models/User.js` + `/routes/profile.js`
- **Fix**: Add enum/min/max validators

### 6. Recipe Filtering - Vegan Gaps
- **File**: `/server/meals/*.js`
- **Fix**: Create vegan-safe recipe pools

### 7. Date Format Inconsistency
- **File**: Multiple logs endpoints
- **Fix**: Standardize on YYYY-MM-DD string

### 8. Breathing Mood Range Mismatch
- **File**: `/models/BreathingSession.js`
- **Fix**: Document or adjust 1-5 range

## Module Testing Results

| Module | Status | Notes |
|--------|--------|-------|
| Recipe Data | ✅✅⚠️ | Works, vegan gaps |
| Yoga Styles | ✅⚠️❌ | Data available but not used in plan |
| Dashboard | ✅❌⚠️ | Loads but stats broken |
| Sleep | ❌✅⚠️ | API confusion, math works |
| Breathing | ❌✅⚠️ | Enum mismatch, filtering works |
| Grocery | ✅✅ | Working correctly |
| Profile | ✅❌⚠️ | Flag works, no field validation |

## Test Coverage

- **Total Tests**: 253
- **Passed**: 253 ✅
- **Failed**: 0

### Known Test Gaps
1. Yoga-only workouts for plan generation
2. Vegan diet with cultural avoidances intersection
3. Sleep with timezone offsets
4. Profile updates mid-plan
5. Concurrent log entry race conditions

## Fix Priority Timeline

### Week 1 - CRITICAL (8 hours)
1. BreathingSession enum fix (2h)
2. HealthLog stats fix (4h)
3. Sleep API routing (2h)

### Week 2 - HIGH (17 hours)
4. Profile validation (3h)
5. Yoga style in workouts (3h)
6. Date consistency (2h)
7. Recipe vegan filtering (4h)
8. Breathing mood docs (1h)
9. Other HIGH issues (4h)

### Week 3 - MEDIUM/LOW (15 hours)
10. Surya rounds personalization (2h)
11. Incomplete profile blocking (2h)
12. Vitals outlier detection (3h)
13. Test coverage improvements (4h)
14. Buffer for review/fixes (4h)

**Total**: ~40 hours to complete all fixes

## How to Use These Reports

### For Project Managers
→ Read **ISSUES_SUMMARY.txt** - 5 min overview
→ Reference **ISSUES_TABLE.csv** for tracking systems

### For Developers
→ Read **BUG_REPORT.md** - Detailed strategies per issue
→ Reference source files for quick navigation
→ Use reproducible steps to verify issues

### For QA/Testing
→ Use **FINAL_BUG_HUNT_REPORT.txt** for test cases
→ Cross-reference reproducible steps
→ Track fixes with issue IDs

## Key Findings

### What's Working Well ✅
- Recipe data fully available across all cuisines and diets
- Surya Namaskar rounds calculated correctly by age/fitness
- Breathing techniques filtered by age/conditions
- Grocery pricing calculations in INR
- Profile completion flag functionality
- Onboarding flow completes successfully

### What's Broken ❌
- BreathingSession technique enum mismatch (data model)
- HealthLog stats calculation (critical for dashboard)
- Sleep duration API confusion (UX failure)
- Yoga style not applied to plans (missing feature)
- Profile field validation (data integrity)

### What Needs Polish ⚠️
- Vegan recipe filtering (incomplete)
- Surya rounds personalized by style
- Dashboard blocks incomplete profiles
- Date format consistency
- Vitals outlier detection

---

## Next Steps

1. **Review** these reports with your team
2. **Prioritize** CRITICAL fixes for Week 1 deployment
3. **Assign** HIGH fixes for Week 2 sprint
4. **Schedule** MEDIUM/LOW for Week 3+ backlog
5. **Add** test cases from "Test Coverage Gaps"

All issues have reproducible steps and fix strategies provided in detailed reports.

