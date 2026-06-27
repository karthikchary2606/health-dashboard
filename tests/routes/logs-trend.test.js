'use strict';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongod, app, cookie;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET  = 'test-secret';
  app = require('../../server');
  await mongoose.connect(mongod.getUri());
  const User   = require('../../models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    name: 'TrendUser', email: 'trend@x.com',
    passwordHash: await bcrypt.hash('Pass1234', 10),
    isApproved: true, profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss', planTemplate: 'weight-loss',
      cuisinePreference: 'south-indian', dietType: 'vegetarian',
      fitnessLevel: 'moderately-active', age: 30, heightCm: 170,
      currentWeightKg: 75, culturalFoodAvoidances: [],
      foodList: [], healthConditions: [], medications: []
    }
  });
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'trend@x.com', password: 'Pass1234' });
  cookie = loginRes.headers['set-cookie'];
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  delete require.cache[require.resolve('../../server')];
});

test('GET /api/logs/data/sleep-trend returns array', async () => {
  const res = await request(app).get('/api/logs/data/sleep-trend').set('Cookie', cookie);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('GET /api/logs/data/mood-trend returns array', async () => {
  const res = await request(app).get('/api/logs/data/mood-trend').set('Cookie', cookie);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('GET /api/logs/data/sleep-trend requires auth', async () => {
  const res = await request(app).get('/api/logs/data/sleep-trend');
  expect(res.status).toBe(401);
});
