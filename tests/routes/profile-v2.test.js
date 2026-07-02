const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongod, app, token, freshMongoose;
let originalMongoUri, originalJwtSecret;

beforeAll(async () => {
  originalMongoUri   = process.env.MONGODB_URI;
  originalJwtSecret  = process.env.JWT_SECRET;
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET   = 'test-secret';
  // Clear module cache so server picks up the new MONGODB_URI
  jest.resetModules();
  app = require('../../server');
  // Re-require mongoose after reset so we connect the same instance the server's models use
  freshMongoose = require('mongoose');
  await freshMongoose.connect(mongod.getUri());

  const User = require('../../models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    name: 'Test', email: 't@x.com',
    passwordHash: await bcrypt.hash('Pass1234', 10),
    isApproved: true, profileComplete: false
  });

  const res = await request(app).post('/api/auth/login')
    .send({ email: 't@x.com', password: 'Pass1234' });
  token = res.headers['set-cookie'];
});

afterAll(async () => {
  await freshMongoose.disconnect();
  await mongod.stop();
  process.env.MONGODB_URI = originalMongoUri;
  process.env.JWT_SECRET  = originalJwtSecret;
});

test('POST /api/profile/onboarding accepts V2 fields', async () => {
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set('Cookie', token)
    .send({
      primaryGoal: 'weight-loss', currentWeightKg: 80, goalWeightKg: 70,
      heightCm: 170, age: 30, fitnessLevel: 'moderately-active', dietType: 'vegetarian',
      religion: 'Hindu', languageCommunity: 'Telugu',
      culturalFoodAvoidances: ['beef'],
      healthConditions: [{ name: 'diabetes', active: true }],
      medications: [{ name: 'Metformin', active: true }]
    });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});

test('GET /api/profile/completion returns percentage', async () => {
  const res = await request(app)
    .get('/api/profile/completion')
    .set('Cookie', token);
  expect(res.status).toBe(200);
  expect(typeof res.body.percentage).toBe('number');
  expect(res.body.percentage).toBeGreaterThanOrEqual(0);
  expect(res.body.percentage).toBeLessThanOrEqual(100);
});

test('GET /api/profile/snapshots returns array with onboarding snapshot', async () => {
  const res = await request(app)
    .get('/api/profile/snapshots')
    .set('Cookie', token);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0].reason).toBe('onboarding');
});

test('PATCH /api/profile accepts foodList and workoutPreferences', async () => {
  const res = await request(app)
    .patch('/api/profile')
    .set('Cookie', token)
    .send({
      foodList: [{ name: 'Idli', category: 'grains', custom: false }],
      workoutPreferences: ['yoga', 'surya-namaskar'],
      reviewReminderDays: 30
    });
  expect(res.status).toBe(200);
  expect(res.body.foodList).toHaveLength(1);
  expect(res.body.workoutPreferences).toContain('surya-namaskar');
});
