// tests/routes/sleep.test.js
'use strict';
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');
const HealthLog = require('../../models/HealthLog');

beforeAll(async () => { await mongoose.connect(process.env.MONGODB_URI); });
afterEach(async () => {
  await User.deleteMany({});
  await HealthLog.deleteMany({});
});
afterAll(async () => { await mongoose.disconnect(); });

async function createUser(overrides = {}) {
  return User.create({
    name: 'Test User',
    email: 'sleep@test.com',
    passwordHash: 'hashed',
    isApproved: true,
    profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss',
      currentWeightKg: 80,
      goalWeightKg: 70,
      heightCm: 175,
      age: 30,
      dietType: 'non-vegetarian',
      cuisinePreference: 'south-indian',
      fitnessLevel: 'lightly-active',
      waterGoalL: 2.5
    },
    ...overrides
  });
}

function authHeader(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

describe('POST /api/sleep', () => {
  test('creates a sleep entry with durationMinutes', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', durationMinutes: 480, quality: 4, notes: 'Good night' });

    expect(res.status).toBe(200);
    expect(res.body.durationMinutes).toBe(480);
    expect(res.body.quality).toBe(4);
  });

  test('calculates durationMinutes from bedtime + wakeTime (same day)', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', bedtime: '22:00', wakeTime: '06:00' });

    expect(res.status).toBe(200);
    expect(res.body.durationMinutes).toBe(480); // 8h
  });

  test('handles overnight sleep (wakeTime < bedtime)', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', bedtime: '23:30', wakeTime: '06:00' });

    expect(res.status).toBe(200);
    expect(res.body.durationMinutes).toBe(390); // 6.5h
  });

  test('upserts when same date submitted twice', async () => {
    const user = await createUser();
    await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', durationMinutes: 360, quality: 2 });

    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', durationMinutes: 480, quality: 5 });

    expect(res.status).toBe(200);
    expect(res.body.durationMinutes).toBe(480);
    expect(res.body.quality).toBe(5);

    const count = await HealthLog.countDocuments({ userId: user._id, date: '2026-06-25' });
    expect(count).toBe(1);
  });

  test('returns 400 when neither durationMinutes nor times provided', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/sleep')
      .set(authHeader(user._id))
      .send({ date: '2026-06-25', quality: 3 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/durationMinutes/);
  });

  test('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/sleep')
      .send({ date: '2026-06-25', durationMinutes: 480 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/sleep/history', () => {
  test('returns entries sorted descending by date', async () => {
    const user = await createUser();
    await HealthLog.create([
      { userId: user._id, date: '2026-06-23', sleepEntry: { durationMinutes: 420, quality: 3 } },
      { userId: user._id, date: '2026-06-25', sleepEntry: { durationMinutes: 480, quality: 5 } },
      { userId: user._id, date: '2026-06-24', sleepEntry: { durationMinutes: 450, quality: 4 } },
    ]);

    const res = await request(app)
      .get('/api/sleep/history')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body[0].date).toBe('2026-06-25');
    expect(res.body[1].date).toBe('2026-06-24');
    expect(res.body[2].date).toBe('2026-06-23');
  });

  test('excludes logs without a sleep entry', async () => {
    const user = await createUser();
    await HealthLog.create([
      { userId: user._id, date: '2026-06-25', sleepEntry: { durationMinutes: 480, quality: 4 } },
      { userId: user._id, date: '2026-06-24', waterIntake: 2 },
    ]);

    const res = await request(app)
      .get('/api/sleep/history')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].date).toBe('2026-06-25');
  });
});

describe('GET /api/sleep/stats', () => {
  test('returns correct currentStreak and goalNightsThisWeek', async () => {
    const user = await createUser();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    await HealthLog.create([
      { userId: user._id, date: today,     sleepEntry: { durationMinutes: 480, quality: 4 } },
      { userId: user._id, date: yesterday, sleepEntry: { durationMinutes: 480, quality: 4 } },
    ]);

    const res = await request(app)
      .get('/api/sleep/stats')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.currentStreak).toBeGreaterThanOrEqual(2);
    expect(typeof res.body.avgDurationMinutes).toBe('number');
    expect(typeof res.body.goalNightsThisWeek).toBe('number');
  });
});
