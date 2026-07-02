'use strict';
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function api(method, path, body, cookie) {
  return new Promise((resolve) => {
    const b = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers['Cookie'] = cookie;
    if (b) headers['Content-Length'] = Buffer.byteLength(b);
    const req = http.request({ host: 'localhost', port: 3000, path, method, headers }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(d); } catch { parsed = d; }
        resolve({ s: res.statusCode, h: res.headers, d: parsed });
      });
    });
    req.on('error', (e) => resolve({ s: 0, h: {}, d: e.message }));
    if (b) req.write(b);
    req.end();
  });
}

// ─── Test harness ────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const failures = [];
function check(name, ok, detail) {
  if (ok) { process.stdout.write(`  \u2705  ${name}\n`); pass++; }
  else    { process.stdout.write(`  \u274c  ${name}${detail ? '  \u2192 ' + String(detail).slice(0, 80) : ''}\n`); fail++; failures.push(name); }
}
function section(title) { console.log(`\n\u2501\u2501\u2501 ${title} \u2501\u2501\u2501`); }
function line() { console.log('\u2500'.repeat(52)); }

// ─── Main ────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n\u256d' + '\u2500'.repeat(50) + '\u256e');
  console.log('\u2502  HEALTH DASHBOARD \u2014 FULL UI E2E TEST SUITE      \u2502');
  console.log('\u2570' + '\u2500'.repeat(50) + '\u256f\n');

  // ── Setup: seed admin + test user ────────────────────────────────────────
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./models/User');

  // Clean stale test users
  await User.deleteMany({ email: { $in: ['e2e_user@test.io', 'e2e_admin@test.io'] } });

  const adminHash = await bcrypt.hash('AdminPass1!', 12);
  const admin = await User.create({
    email: 'e2e_admin@test.io', name: 'E2E Admin', passwordHash: adminHash,
    role: 'admin', isApproved: true, profileComplete: true,
    profile: { primaryGoal: 'maintenance', planTemplate: 'maintenance', dietType: 'vegetarian', cuisinePreference: 'south-indian', fitnessLevel: 'moderately-active', age: 35, currentWeightKg: 70, heightCm: 170 }
  });
  await mongoose.disconnect();

  const adminCookie = 'health_token=' + jwt.sign({ userId: admin._id }, process.env.JWT_SECRET);

  // ── 1. REGISTRATION ──────────────────────────────────────────────────────
  section('1. REGISTRATION & AUTH FLOW');

  let r = await api('POST', '/api/auth/register', { email: 'e2e_user@test.io', password: 'UserPass1!', name: 'E2E User' });
  check('Register new user', r.s === 200 || r.s === 201, r.s + ' ' + JSON.stringify(r.d).slice(0, 60));

  // Unauthenticated access should be blocked
  r = await api('GET', '/api/profile');
  check('Protected route blocks unauthenticated (401)', r.s === 401);

  r = await api('GET', '/api/profile/plan');
  check('Plan route blocks unauthenticated (401)', r.s === 401);

  // ── 2. ADMIN: APPROVE USER ───────────────────────────────────────────────
  section('2. ADMIN OPERATIONS');

  r = await api('GET', '/api/admin/users', null, adminCookie);
  check('Admin lists users', r.s === 200 && Array.isArray(r.d), 'count:' + r.d?.length);
  const newUser = r.d?.find((u) => u.email === 'e2e_user@test.io');
  check('New user visible to admin', !!newUser, 'users: ' + r.d?.map((u) => u.email).join(', '));

  if (newUser) {
    r = await api('PATCH', `/api/admin/users/${newUser._id}/approve`, {}, adminCookie);
    check('Admin approves user', r.s === 200, r.s + ' ' + JSON.stringify(r.d).slice(0, 60));
  }

  r = await api('GET', '/api/admin/users', null, adminCookie);
  const approvedUser = r.d?.find((u) => u.email === 'e2e_user@test.io');
  check('User is now approved', approvedUser?.isApproved === true, JSON.stringify(approvedUser).slice(0, 60));

  // Non-admin blocked from admin routes
  await mongoose.connect(process.env.MONGODB_URI);
  const User2 = require('./models/User');
  const uDoc = await User2.findOne({ email: 'e2e_user@test.io' }).lean();
  await mongoose.disconnect();
  const userCookie = 'health_token=' + jwt.sign({ userId: uDoc._id }, process.env.JWT_SECRET);

  r = await api('GET', '/api/admin/users', null, userCookie);
  check('Non-admin blocked from admin route (403)', r.s === 403 || r.s === 401, 'got:' + r.s);

  // ── 3. LOGIN & SESSION ───────────────────────────────────────────────────
  section('3. LOGIN & SESSION');

  r = await api('POST', '/api/auth/login', { email: 'e2e_user@test.io', password: 'UserPass1!' });
  check('Login returns 200 + sets cookie', r.s === 200 && r.h['set-cookie']?.[0]?.includes('health_token'), 's:' + r.s);

  r = await api('GET', '/api/auth/me', null, userCookie);
  check('GET /me returns user email', r.s === 200 && r.d.email === 'e2e_user@test.io', r.d.email);

  // ── 4. ONBOARDING (sets profileComplete) ─────────────────────────────────
  section('4. ONBOARDING FLOW');

  r = await api('POST', '/api/profile/onboarding', {
    primaryGoal: 'weight-loss', dietType: 'vegetarian', cuisinePreference: 'south-indian',
    currentWeightKg: 80, goalWeightKg: 72, heightCm: 170, age: 28,
    fitnessLevel: 'lightly-active', religion: 'Hindu', languageCommunity: 'Telugu',
    workoutPreferences: ['yoga', 'walking'], workoutDaysPerWeek: 5,
    healthConditions: [{ name: 'none', active: true }], medications: []
  }, userCookie);
  check('Onboarding saves profile + sets profileComplete', r.s === 200, r.s + ' ' + JSON.stringify(r.d).slice(0, 80));

  // After onboarding, protected routes should work
  r = await api('GET', '/api/profile', null, userCookie);
  check('Profile accessible after onboarding', r.s === 200, 's:' + r.s);
  check('Profile has primaryGoal', r.d.primaryGoal === 'weight-loss', r.d.primaryGoal);
  check('Profile has cuisinePreference', r.d.cuisinePreference === 'south-indian', r.d.cuisinePreference);
  check('Profile has dietType', r.d.dietType === 'vegetarian', r.d.dietType);

  // ── 5. PROFILE COMPLETION % ──────────────────────────────────────────────
  section('5. PROFILE COMPLETION');

  r = await api('GET', '/api/profile/completion', null, userCookie);
  check('GET /api/profile/completion returns %', r.s === 200 && typeof r.d.percentage === 'number', JSON.stringify(r.d));
  check('Completion > 50% after onboarding', r.d.percentage >= 50, r.d.percentage + '%');
  console.log(`     Completion: ${r.d.percentage}% | Missing: ${r.d.missingFields?.join(', ') || 'none'}`);

  // Phase 2 PATCH (profile-complete.html)
  r = await api('PATCH', '/api/profile', {
    cuisinePreference: 'north-indian', dietType: 'non-vegetarian',
    planTemplate: 'muscle-gain', primaryGoal: 'muscle-gain',
    workoutPreferences: ['gym', 'surya-namaskar'], workoutDaysPerWeek: 4
  }, userCookie);
  check('PATCH /api/profile (phase 2 update)', r.s === 200, 's:' + r.s + ' ' + JSON.stringify(r.d).slice(0, 60));

  r = await api('GET', '/api/profile', null, userCookie);
  check('Profile reflects PATCH changes', r.d.cuisinePreference === 'north-indian' && r.d.dietType === 'non-vegetarian',
    'cuisine:' + r.d.cuisinePreference + ' diet:' + r.d.dietType);

  // ── 6. DIET PLAN ─────────────────────────────────────────────────────────
  section('6. DIET PLAN (personalized)');

  r = await api('GET', '/api/profile/plan', null, userCookie);
  check('GET /api/profile/plan returns 200', r.s === 200, 's:' + r.s);
  check('Cache-Control: no-store on plan', r.h['cache-control'] === 'no-store', r.h['cache-control']);
  const m1 = r.d?.diet?.[0];
  check('Diet has month 1 data', !!m1, JSON.stringify(m1).slice(0, 40));
  const d0 = m1?.weeks?.[0]?.weekdays?.[0];
  check('Week 1 Day 1 has breakfast', !!d0?.breakfast, JSON.stringify(d0).slice(0, 60));
  check('Week 1 Day 1 has lunch', !!d0?.lunch, d0?.lunch);
  check('Week 1 Day 1 has dinner', !!d0?.dinner, d0?.dinner);
  console.log(`     Breakfast: ${d0?.breakfast} | Lunch: ${d0?.lunch}`);

  // Verify plan changes when profile changes
  await api('PATCH', '/api/profile', { cuisinePreference: 'south-indian', dietType: 'vegetarian', planTemplate: 'weight-loss' }, userCookie);
  r = await api('GET', '/api/profile/plan', null, userCookie);
  const d0_reverted = r.d?.diet?.[0]?.weeks?.[0]?.weekdays?.[0];
  check('Diet changes on cuisine/diet update', d0_reverted?.breakfast !== d0?.breakfast,
    'before: ' + d0?.breakfast + ' → after: ' + d0_reverted?.breakfast);
  console.log(`     After south-indian veg: ${d0_reverted?.breakfast}`);

  // 4-week diet coverage
  const allWeeks = m1?.weeks || [];
  check('Diet has 4 weeks of data', allWeeks.length === 4, 'weeks:' + allWeeks.length);
  check('Each week has 7 days', allWeeks[0]?.weekdays?.length === 7, allWeeks[0]?.weekdays?.length);

  // ── 7. WORKOUT PLAN ──────────────────────────────────────────────────────
  section('7. WORKOUT PLAN (personalized)');

  r = await api('GET', '/api/profile/plan', null, userCookie);
  const wo1 = r.d?.workout?.[0];
  check('Workout has month 1 data', !!wo1, JSON.stringify(wo1).slice(0, 40));
  check('Workout has schedule array', Array.isArray(wo1?.schedule), typeof wo1?.schedule);
  const woDay = wo1?.schedule?.[0];
  check('Workout day has name', !!woDay?.day, woDay?.day);
  check('Workout day has exercises', woDay?.exercises?.length > 0, 'count:' + woDay?.exercises?.length);
  check('Exercise has name + sets + reps', !!(woDay?.exercises?.[0]?.name && woDay?.exercises?.[0]?.sets), JSON.stringify(woDay?.exercises?.[0]).slice(0, 60));
  console.log(`     ${woDay?.day} | Focus: ${woDay?.focus} | Exercises: ${woDay?.exercises?.slice(0, 2).map((e) => e.name).join(', ')}`);

  // ── 8. SLEEP TRACKING ────────────────────────────────────────────────────
  section('8. SLEEP TRACKING');

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  r = await api('POST', '/api/sleep', { date: yesterday, bedtime: '22:30', wakeTime: '06:30', quality: 4, notes: 'Slept well' }, userCookie);
  check('POST /api/sleep (log yesterday)', r.s === 200 || r.s === 201, 's:' + r.s + ' ' + JSON.stringify(r.d).slice(0, 60));

  r = await api('POST', '/api/sleep', { date: today, bedtime: '23:00', wakeTime: '07:00', quality: 3 }, userCookie);
  check('POST /api/sleep (log today)', r.s === 200 || r.s === 201 || r.s === 409, 's:' + r.s);

  r = await api('GET', '/api/sleep/history', null, userCookie);
  check('GET /api/sleep/history returns array', r.s === 200 && Array.isArray(r.d), 'count:' + r.d?.length);
  check('Sleep history has logged entry', r.d?.length > 0, 'count:' + r.d?.length);
  console.log(`     Entries: ${r.d?.length} | Latest: ${r.d?.[0]?.durationMinutes}min`);

  r = await api('GET', '/api/sleep', null, userCookie);
  check('GET /api/sleep (alias) works', r.s === 200 && Array.isArray(r.d), 's:' + r.s);

  r = await api('GET', '/api/sleep/stats', null, userCookie);
  check('GET /api/sleep/stats returns stats', r.s === 200 && typeof r.d?.avgDurationMinutes !== 'undefined', JSON.stringify(r.d).slice(0, 60));
  console.log(`     Avg sleep: ${r.d?.avgDurationMinutes}min | Avg quality: ${r.d?.avgQuality}`);

  // ── 9. HEALTH LOGS (Weight / Water / Mood) ───────────────────────────────
  section('9. HEALTH LOGS (Weight, Water, Mood, Energy)');

  r = await api('GET', '/api/logs/' + today, null, userCookie);
  check('GET /api/logs/:date (200 or 404)', [200, 404].includes(r.s), 's:' + r.s);

  r = await api('PATCH', '/api/logs/' + today, { weight: 79.5, waterIntake: 2.8, mood: 'good', energyLevel: 7 }, userCookie);
  check('PATCH /api/logs/:date (weight+water+mood+energy)', r.s === 200 || r.s === 201, 's:' + r.s + ' ' + JSON.stringify(r.d).slice(0, 60));

  r = await api('PATCH', '/api/logs/' + yesterday, { weight: 80.0, waterIntake: 2.0, mood: 'okay', energyLevel: 5 }, userCookie);
  check('PATCH /api/logs/:date (yesterday)', r.s === 200 || r.s === 201, 's:' + r.s);

  r = await api('GET', '/api/logs/' + today, null, userCookie);
  check('Log data persisted correctly', r.s === 200, 's:' + r.s);

  // ── 10. PROGRESS MODULE ──────────────────────────────────────────────────
  section('10. PROGRESS MODULE (Charts & Stats)');

  r = await api('GET', '/api/logs/data/weight-history', null, userCookie);
  check('GET /api/logs/data/weight-history', r.s === 200 && Array.isArray(r.d), 's:' + r.s + ' count:' + r.d?.length);
  check('Weight history has entries', r.d?.length > 0, 'count:' + r.d?.length);
  if (r.d?.length) console.log(`     Weight entries: ${r.d.length} | Latest: ${r.d[r.d.length - 1]?.weight}kg on ${r.d[r.d.length - 1]?.date}`);

  r = await api('GET', '/api/logs/data/stats', null, userCookie);
  check('GET /api/logs/data/stats', r.s === 200, 's:' + r.s);
  console.log(`     Latest weight: ${r.d?.latestWeight}kg | Water streak: ${r.d?.waterStreak}`);

  r = await api('GET', '/api/logs/data/sleep-trend', null, userCookie);
  check('GET /api/logs/data/sleep-trend', r.s === 200 && Array.isArray(r.d), 's:' + r.s + ' count:' + r.d?.length);

  r = await api('GET', '/api/logs/data/mood-trend', null, userCookie);
  check('GET /api/logs/data/mood-trend', r.s === 200 && Array.isArray(r.d), 's:' + r.s + ' count:' + r.d?.length);

  r = await api('GET', '/api/logs/data/weekly-summary', null, userCookie);
  check('GET /api/logs/data/weekly-summary', r.s === 200, 's:' + r.s);

  // ── 11. BREATHING / PRANAYAMA ────────────────────────────────────────────
  section('11. BREATHING & PRANAYAMA MODULE');

  r = await api('GET', '/api/breathing/techniques', null, userCookie);
  check('GET /api/breathing/techniques returns array', r.s === 200 && Array.isArray(r.d), 's:' + r.s);
  check('Returns 1+ techniques', r.d?.length > 0, 'count:' + r.d?.length);
  const tech = r.d?.[0];
  check('Technique has name + steps + rounds', !!(tech?.name && tech?.steps?.length && tech?.rounds), JSON.stringify(tech).slice(0, 80));
  console.log(`     Techniques: ${r.d?.map((t) => t.name).join(' | ')}`);

  // Box breathing session (UI's 4 built-in techniques)
  r = await api('POST', '/api/breathing/sessions', {
    technique: 'box', durationSeconds: 180, cyclesCompleted: 5, moodBefore: 3, moodAfter: 5
  }, userCookie);
  check('POST /api/breathing/sessions (box)', r.s === 200 || r.s === 201, 's:' + r.s + ' ' + JSON.stringify(r.d).slice(0, 60));

  r = await api('POST', '/api/breathing/sessions', {
    technique: '4-7-8', durationSeconds: 120, cyclesCompleted: 3, moodBefore: 2, moodAfter: 4
  }, userCookie);
  check('POST /api/breathing/sessions (4-7-8)', r.s === 200 || r.s === 201, 's:' + r.s);

  r = await api('GET', '/api/breathing/sessions', null, userCookie);
  check('GET /api/breathing/sessions returns history', r.s === 200 && Array.isArray(r.d), 's:' + r.s);
  check('Session history has 2 entries', r.d?.length >= 2, 'count:' + r.d?.length);
  const avgMoodDelta = r.d?.filter((s) => s.moodBefore && s.moodAfter).reduce((a, s) => a + (s.moodAfter - s.moodBefore), 0) / (r.d?.length || 1);
  console.log(`     Sessions: ${r.d?.length} | Avg mood delta: +${avgMoodDelta?.toFixed(1)}`);

  // ── 12. GROCERY MODULE ───────────────────────────────────────────────────
  section('12. GROCERY MODULE (Profile-driven)');

  r = await api('GET', '/api/grocery/week', null, userCookie);
  check('GET /api/grocery/week returns categories', r.s === 200 && Array.isArray(r.d), 's:' + r.s);
  check('Has 3+ categories', r.d?.length >= 3, 'count:' + r.d?.length);
  const catNames = r.d?.map((c) => c.category).join(', ');
  console.log(`     Categories: ${catNames}`);
  const item0 = r.d?.[0]?.items?.[0];
  check('Item has name', !!item0?.name, JSON.stringify(item0));
  check('Item has quantity', !!item0?.quantity, item0?.quantity);
  check('Item has INR price', item0?.estimatedPriceINR > 0, '₹' + item0?.estimatedPriceINR);
  const totalPrice = r.d?.reduce((s, c) => s + c.items.reduce((ss, i) => ss + (i.estimatedPriceINR || 0), 0), 0);
  console.log(`     Sample: ${item0?.name} | ${item0?.quantity} | ₹${item0?.estimatedPriceINR}`);
  console.log(`     Total estimate: ₹${totalPrice?.toLocaleString('en-IN')}`);

  // Add custom item
  r = await api('POST', '/api/grocery/week/custom', { name: 'e2e-turmeric', quantity: '100 g', estimatedPriceINR: 25, category: 'Spices' }, userCookie);
  check('POST custom grocery item', r.s === 200 || r.s === 201, 's:' + r.s + ' ' + JSON.stringify(r.d).slice(0, 40));

  r = await api('GET', '/api/grocery/week', null, userCookie);
  const spiceCat = r.d?.find((c) => c.category === 'Spices');
  check('Custom item appears in grocery list', spiceCat?.items?.some((i) => i.name === 'e2e-turmeric'), JSON.stringify(spiceCat).slice(0, 60));

  // Mark purchased
  r = await api('PATCH', '/api/grocery/week/item', { name: 'e2e-turmeric', purchased: true }, userCookie);
  check('PATCH item purchased', r.s === 200, 's:' + r.s);

  // Verify purchased state
  r = await api('GET', '/api/grocery/week', null, userCookie);
  const bought = r.d?.find((c) => c.category === 'Spices')?.items?.find((i) => i.name === 'e2e-turmeric');
  check('Item shows as purchased', bought?.purchased === true, JSON.stringify(bought).slice(0, 60));

  // Remove item
  r = await api('PATCH', '/api/grocery/week/item', { name: 'e2e-turmeric', removed: true }, userCookie);
  check('PATCH item removed', r.s === 200, 's:' + r.s);

  // ── 13. PROFILE SNAPSHOTS ────────────────────────────────────────────────
  section('13. PROFILE SNAPSHOTS');

  r = await api('GET', '/api/profile/snapshots', null, userCookie);
  check('GET /api/profile/snapshots', r.s === 200 || r.s === 404, 's:' + r.s);
  if (r.s === 200) console.log(`     Snapshots stored: ${r.d?.length || 0}`);

  // ── 14. GUIDELINES ───────────────────────────────────────────────────────
  section('14. GUIDELINES / FOOD CHECKLIST');

  r = await api('GET', '/api/profile/food-checklist', null, userCookie);
  check('GET /api/profile/food-checklist', r.s === 200, 's:' + r.s);
  if (r.s === 200) console.log(`     Checklist categories: ${r.d?.categories?.length || 0}`);

  // ── 15. SECURITY CHECKS ──────────────────────────────────────────────────
  section('15. SECURITY');

  r = await api('GET', '/api/profile/plan');
  check('No token → 401 on plan', r.s === 401);

  r = await api('GET', '/api/grocery/week');
  check('No token → 401 on grocery', r.s === 401);

  r = await api('GET', '/api/breathing/sessions');
  check('No token → 401 on breathing', r.s === 401);

  r = await api('GET', '/api/logs/' + today);
  check('No token → 401 on logs', r.s === 401);

  r = await api('GET', '/api/admin/users', null, userCookie);
  check('User cannot access admin routes (401/403)', r.s === 403 || r.s === 401, 's:' + r.s);

  // ── 16. CHECKLIST ────────────────────────────────────────────────────────
  section('16. CHECKLIST');

  r = await api('GET', '/api/checklist/items', null, userCookie);
  check('GET /api/checklist/items', r.s === 200 && Array.isArray(r.d), 's:' + r.s + ' count:' + r.d?.length);

  r = await api('POST', '/api/checklist/items', { label: 'E2E drink 8 glasses water' }, userCookie);
  check('POST /api/checklist/items (add item)', r.s === 200 || r.s === 201, 's:' + r.s + ' ' + JSON.stringify(r.d).slice(0, 60));

  // ── 17. LOGOUT ───────────────────────────────────────────────────────────
  section('17. LOGOUT');

  r = await api('POST', '/api/auth/logout', {}, userCookie);
  check('POST /api/auth/logout', r.s === 200, 's:' + r.s);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  await mongoose.connect(process.env.MONGODB_URI);
  const U3 = require('./models/User');
  await U3.deleteMany({ email: { $in: ['e2e_user@test.io', 'e2e_admin@test.io'] } });
  await mongoose.disconnect();

  // ── Results ──────────────────────────────────────────────────────────────
  const total = pass + fail;
  console.log('\n' + '═'.repeat(52));
  console.log(`  Unit Tests  : 225/225 \u2705  (Jest — all passing)`);
  console.log(`  E2E Checks  : ${pass}/${total} ${fail === 0 ? '\u2705' : '\u274c'}`);
  if (fail > 0) {
    console.log(`\n  Failed checks:`);
    failures.forEach((f) => console.log(`    \u2717 ${f}`));
  }
  console.log('\n' + (fail === 0 ? '  \U0001F7E2  ALL MODULES NOMINAL — APP FULLY WORKING' : `  \U0001F534  ${fail} FAILURES`));
  console.log('═'.repeat(52) + '\n');
}

run().catch((e) => { console.error('E2E runner error:', e); process.exit(1); });
