'use strict';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request  = require('supertest');

let mongod, app, cookie;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI  = mongod.getUri();
  process.env.JWT_SECRET   = 'test-secret';
  app = require('../../server');
  await mongoose.connect(mongod.getUri());

  const User   = require('../../models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    name: 'GroceryUser', email: 'grocery@x.com',
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

  const loginRes = await request(app).post('/api/auth/login').send({ email: 'grocery@x.com', password: 'Pass1234' });
  cookie = loginRes.headers['set-cookie'];
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  // Clear module cache so other test files get fresh server
  delete require.cache[require.resolve('../../server')];
});

test('GET /api/grocery/week returns categorised list', async () => {
  const res = await request(app).get('/api/grocery/week').set('Cookie', cookie);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
  expect(res.body[0]).toHaveProperty('category');
  expect(res.body[0]).toHaveProperty('items');
  expect(Array.isArray(res.body[0].items)).toBe(true);
});

test('GET /api/grocery/week items have name and purchased fields', async () => {
  const res = await request(app).get('/api/grocery/week').set('Cookie', cookie);
  const firstItem = res.body[0].items[0];
  expect(firstItem).toHaveProperty('name');
  expect(firstItem).toHaveProperty('purchased');
});

test('GET /api/grocery/week without auth returns 401', async () => {
  const res = await request(app).get('/api/grocery/week');
  expect(res.status).toBe(401);
});
