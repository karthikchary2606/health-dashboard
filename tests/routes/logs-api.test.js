'use strict';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongod, app, cookie, userId, maleUserId, maleCookie;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret';
  app = require('../../server');
  await mongoose.connect(mongod.getUri());
  
  const User = require('../../models/User');
  const HealthLog = require('../../models/HealthLog');
  const bcrypt = require('bcryptjs');

  // Create female user
  const femaleUser = await User.create({
    name: 'Jane Doe',
    email: 'jane@test.com',
    passwordHash: await bcrypt.hash('Pass1234', 10),
    isApproved: true,
    profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss',
      sex: 'female',
      age: 28,
      heightCm: 165,
      currentWeightKg: 60,
      fitnessLevel: 'moderately-active',
      dietType: 'vegetarian',
      nonVegDays: [],
      eggDays: []
    }
  });
  userId = femaleUser._id;

  // Create male user
  const maleUser = await User.create({
    name: 'John Doe',
    email: 'john@test.com',
    passwordHash: await bcrypt.hash('Pass1234', 10),
    isApproved: true,
    profileComplete: true,
    profile: {
      primaryGoal: 'general-fitness',
      sex: 'male',
      age: 35,
      heightCm: 180,
      currentWeightKg: 80,
      fitnessLevel: 'lightly-active',
      dietType: 'non-vegetarian',
      nonVegDays: ['monday', 'wednesday', 'friday'],
      eggDays: ['tuesday', 'thursday']
    }
  });
  maleUserId = maleUser._id;

  // Login female user
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'jane@test.com', password: 'Pass1234' });
  cookie = loginRes.headers['set-cookie'];

  // Login male user
  const maleLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'john@test.com', password: 'Pass1234' });
  maleCookie = maleLoginRes.headers['set-cookie'];

  // Create a log with meals for today
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  await HealthLog.create({
    userId: userId,
    date: todayStr,
    meals: [
      { mealType: 'breakfast', calories: 350, proteinG: 15, carbsG: 45, fatG: 10 },
      { mealType: 'lunch', calories: 650, proteinG: 35, carbsG: 65, fatG: 20 }
    ],
    stepCount: 5000
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  delete require.cache[require.resolve('../../server')];
});

describe('GET /api/logs/today', () => {
  test('returns today\'s log data with meals, calories, and BMR', async () => {
    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('date');
    expect(res.body).toHaveProperty('meals');
    expect(res.body).toHaveProperty('stepCount');
    expect(res.body).toHaveProperty('calorieTarget');
    expect(res.body).toHaveProperty('consumed');
    expect(res.body).toHaveProperty('remaining');
    expect(res.body).toHaveProperty('bmr');
    expect(res.body).toHaveProperty('activityLevel');
    expect(res.body).toHaveProperty('profileData');
    expect(Array.isArray(res.body.meals)).toBe(true);
    expect(res.body.calorieTarget).toBe(2100);
  });

  test('requires authentication', async () => {
    const res = await request(app).get('/api/logs/today');
    expect(res.status).toBe(401);
  });

  test('requires profile completion', async () => {
    const User = require('../../models/User');
    const bcrypt = require('bcryptjs');

    // Create user with incomplete profile
    const incompleteUser = await User.create({
      name: 'Incomplete User',
      email: 'incomplete@test.com',
      passwordHash: await bcrypt.hash('Pass1234', 10),
      isApproved: true,
      profileComplete: false
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'incomplete@test.com', password: 'Pass1234' });
    const incompleteCookie = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', incompleteCookie);

    expect(res.status).toBe(403);
  });

  test('calculates BMR correctly for female (Mifflin-St Jeor)', async () => {
    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    // Female: 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 ≈ 1330
    expect(res.body.bmr).toBe(1330);
  });

  test('calculates BMR correctly for male (Mifflin-St Jeor)', async () => {
    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', maleCookie);

    expect(res.status).toBe(200);
    // Male: 10*80 + 6.25*180 - 5*35 + 5 = 800 + 1125 - 175 + 5 = 1755
    expect(res.body.bmr).toBe(1755);
  });

  test('maps activity levels correctly', async () => {
    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.activityLevel).toBe('moderate'); // 'moderately-active' maps to 'moderate'
  });

  test('maps activity level for lightly-active to light', async () => {
    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', maleCookie);

    expect(res.status).toBe(200);
    expect(res.body.activityLevel).toBe('light'); // 'lightly-active' maps to 'light'
  });

  test('calculates consumed and remaining calories correctly', async () => {
    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.consumed).toBe(1000); // 350 + 650
    expect(res.body.remaining).toBe(1100); // 2100 - 1000
  });

  test('returns empty meals and 0 steps if no log for today', async () => {
    const User = require('../../models/User');
    const bcrypt = require('bcryptjs');

    const newUser = await User.create({
      name: 'New User',
      email: 'newuser@test.com',
      passwordHash: await bcrypt.hash('Pass1234', 10),
      isApproved: true,
      profileComplete: true,
      profile: {
        primaryGoal: 'weight-loss',
        sex: 'male',
        age: 30,
        heightCm: 175,
        currentWeightKg: 75,
        fitnessLevel: 'very-active',
        dietType: 'vegetarian'
      }
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'newuser@test.com', password: 'Pass1234' });
    const newCookie = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', newCookie);

    expect(res.status).toBe(200);
    expect(res.body.meals).toEqual([]);
    expect(res.body.stepCount).toBe(0);
    expect(res.body.consumed).toBe(0);
    expect(res.body.remaining).toBe(2100);
  });

  test('extracts profile data (dietType, nonVegDays, eggDays)', async () => {
    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', maleCookie);

    expect(res.status).toBe(200);
    expect(res.body.profileData).toHaveProperty('dietType');
    expect(res.body.profileData).toHaveProperty('nonVegDays');
    expect(res.body.profileData).toHaveProperty('eggDays');
    expect(res.body.profileData.dietType).toBe('non-vegetarian');
    expect(res.body.profileData.nonVegDays).toEqual(['monday', 'wednesday', 'friday']);
    expect(res.body.profileData.eggDays).toEqual(['tuesday', 'thursday']);
  });

  test('handles missing profile fields with defaults', async () => {
    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.profileData.dietType).toBe('vegetarian');
    expect(Array.isArray(res.body.profileData.nonVegDays)).toBe(true);
    expect(Array.isArray(res.body.profileData.eggDays)).toBe(true);
  });

  test('returns today\'s date in YYYY-MM-DD format', async () => {
    const res = await request(app)
      .get('/api/logs/today')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
