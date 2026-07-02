'use strict';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const bcrypt = require('bcryptjs');

let mongod, app, cookie;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret';
  app = require('../server');
  await mongoose.connect(mongod.getUri());

  const User = require('../models/User');
  await User.create({
    name: 'CriticalFixes',
    email: 'critical-fixes@test.com',
    passwordHash: await bcrypt.hash('Pass1234', 10),
    isApproved: true,
    profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss',
      planTemplate: 'weight-loss',
      cuisinePreference: 'south-indian',
      dietType: 'vegetarian',
      fitnessLevel: 'moderately-active',
      age: 30,
      heightCm: 170,
      currentWeightKg: 75,
      waterGoalL: 2.5,
      culturalFoodAvoidances: [],
      foodList: [],
      healthConditions: [],
      medications: []
    }
  });
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'critical-fixes@test.com',
    password: 'Pass1234'
  });
  cookie = loginRes.headers['set-cookie'];
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  delete require.cache[require.resolve('../server')];
});

describe('CRITICAL-1: BreathingSession Technique Enum', () => {
  const originalTechniques = ['box', '4-7-8', 'wim-hof', 'diaphragmatic'];
  const pranayamaTechniques = ['nadi-shodhana', 'anulom-vilom', 'bhramari', 'kapalabhati', 'bhastrika', 'ujjayi'];
  const allValidTechniques = [...originalTechniques, ...pranayamaTechniques];

  test('GET /api/breathing/techniques returns filtered pranayama', async () => {
    const res = await request(app).get('/api/breathing/techniques').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });

  test.each(originalTechniques)('POST breathing session with %s succeeds', async (technique) => {
    const res = await request(app)
      .post('/api/breathing/sessions')
      .set('Cookie', cookie)
      .send({
        technique,
        durationSeconds: 300,
        cyclesCompleted: 5,
        moodBefore: 3,
        moodAfter: 5
      });
    expect(res.status).toBe(201);
    expect(res.body.technique).toBe(technique);
  });

  test.each(pranayamaTechniques)('POST breathing session with pranayama %s succeeds', async (technique) => {
    const res = await request(app)
      .post('/api/breathing/sessions')
      .set('Cookie', cookie)
      .send({
        technique,
        durationSeconds: 300,
        cyclesCompleted: 5,
        moodBefore: 3,
        moodAfter: 5
      });
    expect(res.status).toBe(201);
    expect(res.body.technique).toBe(technique);
  });

  test('POST breathing session with invalid technique returns 400', async () => {
    const res = await request(app)
      .post('/api/breathing/sessions')
      .set('Cookie', cookie)
      .send({
        technique: 'invalid-technique',
        durationSeconds: 300
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid technique/);
  });

  test('POST breathing session without technique returns 400', async () => {
    const res = await request(app)
      .post('/api/breathing/sessions')
      .set('Cookie', cookie)
      .send({
        durationSeconds: 300
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/technique is required/);
  });
});

describe('CRITICAL-2: HealthLog Meals Validation', () => {
  const testDate = new Date().toISOString().split('T')[0];

  test('PATCH logs with valid nested meals structure succeeds', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        meals: [
          {
            mealType: 'breakfast',
            calories: 400,
            proteinG: 15,
            carbsG: 50,
            fatG: 10
          },
          {
            mealType: 'lunch',
            calories: 600,
            proteinG: 30,
            carbsG: 70,
            fatG: 15
          }
        ]
      });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.meals)).toBe(true);
    expect(res.body.meals.length).toBe(2);
    expect(res.body.meals[0].mealType).toBe('breakfast');
    expect(res.body.meals[0].calories).toBe(400);
  });

  test('PATCH logs with non-array meals returns 400', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        meals: { calories: 500 }
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/meals must be an array/);
  });

  test('PATCH logs with invalid meal type returns 400', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        meals: [
          {
            mealType: 'invalid-type',
            calories: 400
          }
        ]
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mealType must be one of/);
  });

  test('PATCH logs with null meal object returns 400', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        meals: [null]
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Each meal must be an object/);
  });

  test.each(['breakfast', 'lunch', 'dinner', 'snack'])(
    'PATCH logs with valid meal type %s succeeds',
    async (mealType) => {
      const res = await request(app)
        .patch(`/api/logs/${testDate}`)
        .set('Cookie', cookie)
        .send({
          meals: [
            {
              mealType,
              calories: 400,
              proteinG: 15,
              carbsG: 50,
              fatG: 10
            }
          ]
        });
      expect(res.status).toBe(200);
      expect(res.body.meals[0].mealType).toBe(mealType);
    }
  );

  test('PATCH logs with empty meals array succeeds', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        meals: []
      });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.meals)).toBe(true);
  });
});

describe('CRITICAL-3: Sleep Duration API Validation', () => {
  const testDate = new Date().toISOString().split('T')[0];

  test('PATCH logs with top-level durationMinutes returns 400', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        durationMinutes: 480,
        waterIntake: 2.5
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nested sleepEntry/);
  });

  test('PATCH logs with nested sleepEntry.durationMinutes succeeds', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        sleepEntry: {
          durationMinutes: 480,
          bedtime: '23:00',
          wakeTime: '07:00',
          quality: 4
        }
      });
    expect(res.status).toBe(200);
    expect(res.body.sleepEntry).toBeDefined();
    expect(res.body.sleepEntry.durationMinutes).toBe(480);
    expect(res.body.sleepEntry.quality).toBe(4);
  });

  test('PATCH logs sleepEntry only with durationMinutes succeeds', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        sleepEntry: {
          durationMinutes: 360
        }
      });
    expect(res.status).toBe(200);
    expect(res.body.sleepEntry.durationMinutes).toBe(360);
  });

  test('PATCH logs with both durationMinutes and sleepEntry rejects top-level', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        durationMinutes: 480,
        sleepEntry: {
          durationMinutes: 360
        }
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nested sleepEntry/);
  });

  test('PATCH logs sleepEntry validates quality min/max', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        sleepEntry: {
          durationMinutes: 480,
          quality: 0
        }
      });
    expect(res.status).toBe(500);
  });

  test('PATCH logs without sleepEntry and without durationMinutes succeeds', async () => {
    const res = await request(app)
      .patch(`/api/logs/${testDate}`)
      .set('Cookie', cookie)
      .send({
        waterIntake: 2.5,
        moodScore: 4
      });
    expect(res.status).toBe(200);
    expect(res.body.waterIntake).toBe(2.5);
    expect(res.body.moodScore).toBe(4);
  });
});
