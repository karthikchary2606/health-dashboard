'use strict';
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');

beforeAll(async () => { await mongoose.connect(process.env.MONGODB_URI); });
afterEach(async () => { await User.deleteMany({}); });
afterAll(async () => { await mongoose.disconnect(); });

function authHeader(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

async function createUser(overrides = {}) {
  return User.create({
    name: 'Test', email: 'test@test.com',
    passwordHash: 'hashed', isApproved: true,
    profileComplete: true,
    ...overrides
  });
}

async function createPlanReadyUser(overrides = {}) {
  return createUser({
    email: 'plan-ready@test.com',
    profile: {
      primaryGoal: 'weight-loss',
      planTemplate: 'weight-loss',
      currentWeightKg: 80,
      goalWeightKg: 70,
      heightCm: 175,
      age: 30,
      dietType: 'vegetarian',
      fitnessLevel: 'lightly-active'
    },
    ...overrides
  });
}

test('onboarding saves sex field', async () => {
  const user = await createUser({ profileComplete: false });
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send({
      primaryGoal: 'weight-loss',
      currentWeightKg: 80,
      heightCm: 175,
      age: 30,
      dietType: 'vegetarian',
      fitnessLevel: 'moderately-active',
      sex: 'male'
    });
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  expect(updated.profile.sex).toBe('male');
});

test('onboarding with complete stats computes macro targets', async () => {
  const user = await createUser({ profileComplete: false });
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send({
      primaryGoal: 'weight-loss',
      currentWeightKg: 80,
      heightCm: 175,
      age: 30,
      dietType: 'vegetarian',
      fitnessLevel: 'moderately-active',
      sex: 'male'
    });
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  // Mifflin male: base=1743.75, bmr=1748.75, tdee=2711, -300 deficit = 2411
  expect(updated.profile.dailyCalorieTarget).toBe(2411);
  expect(updated.profile.dailyProteinG).toBe(181);
  expect(updated.profile.dailyCarbsG).toBe(271);
  expect(updated.profile.dailyFatG).toBe(67);
});

test('macro targets not set when sex is missing', async () => {
  const user = await createUser({ profileComplete: false });
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send({
      primaryGoal: 'muscle-gain',
      currentWeightKg: 70,
      heightCm: 170,
      age: 25,
      dietType: 'non-vegetarian',
      fitnessLevel: 'lightly-active'
      // no sex field
    });
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  // sex defaults to 'other' now so dailyCalorieTarget is always computed when age/height/weight present
  expect(updated.profile.dailyCalorieTarget).toBeDefined();
});

test('PATCH /api/profile accepts sex field', async () => {
  const user = await createUser({ profile: { primaryGoal: 'weight-loss' } });
  const res = await request(app)
    .patch('/api/profile')
    .set(authHeader(user._id))
    .send({ sex: 'female' });
  expect(res.status).toBe(200);
  expect(res.body.sex).toBe('female');
});

test('GET /api/profile/plan includes freshness metadata fields', async () => {
  const user = await createPlanReadyUser({ email: 'plan-meta@test.com' });
  const res = await request(app)
    .get('/api/profile/plan')
    .set(authHeader(user._id));

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('profileUpdatedAt');
  expect(res.body).toHaveProperty('planVersion');
  expect(res.body).toHaveProperty('meta.profileUpdatedAt');
  expect(res.body).toHaveProperty('meta.planVersion');
  expect(res.body.planVersion).toBe(res.body.profileUpdatedAt);
  expect(res.body.meta.planVersion).toBe(res.body.planVersion);
});

test('GET /api/profile/plan updates planVersion after profile patch', async () => {
  const user = await createPlanReadyUser({ email: 'plan-version-bump@test.com' });
  const firstRes = await request(app)
    .get('/api/profile/plan')
    .set(authHeader(user._id));
  expect(firstRes.status).toBe(200);

  await new Promise((resolve) => setTimeout(resolve, 10));
  const patchRes = await request(app)
    .patch('/api/profile')
    .set(authHeader(user._id))
    .send({ cuisinePreference: 'north-indian' });
  expect(patchRes.status).toBe(200);

  const secondRes = await request(app)
    .get('/api/profile/plan')
    .set(authHeader(user._id));
  expect(secondRes.status).toBe(200);
  expect(secondRes.body.planVersion).not.toBe(firstRes.body.planVersion);
});
