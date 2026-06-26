const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');

beforeAll(async () => { await mongoose.connect(process.env.MONGODB_URI); });
afterEach(async () => { await User.deleteMany({}); });
afterAll(async () => { await mongoose.disconnect(); });

async function createUser(overrides = {}) {
  return User.create({
    name: 'Test User', email: 'test@test.com',
    passwordHash: 'hashed', isApproved: true,
    ...overrides
  });
}

function authHeader(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

test('POST /api/profile/onboarding sets profileComplete=true', async () => {
  const user = await createUser({ profileComplete: false });
  const body = {
    primaryGoal: 'weight-loss',
    currentWeightKg: 90,
    goalWeightKg: 75,
    heightCm: 175,
    age: 30,
    dietType: 'non-vegetarian',
    cuisinePreference: 'south-indian',
    fitnessLevel: 'lightly-active',
    healthConditions: [],
    medications: [],
    waterGoalL: 2.5
  };
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send(body);
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  expect(updated.profileComplete).toBe(true);
  expect(updated.profile.primaryGoal).toBe('weight-loss');
});

test('GET /api/profile returns user profile', async () => {
  const user = await createUser({
    profileComplete: true,
    profile: { primaryGoal: 'weight-loss' }
  });
  const res = await request(app)
    .get('/api/profile')
    .set(authHeader(user._id));
  expect(res.status).toBe(200);
  expect(res.body.primaryGoal).toBe('weight-loss');
});

test('PATCH /api/profile updates profile field', async () => {
  const user = await createUser({ profileComplete: true });
  const res = await request(app)
    .patch('/api/profile')
    .set(authHeader(user._id))
    .send({ currentWeightKg: 88 });
  expect(res.status).toBe(200);
  const updated = await User.findById(user._id);
  expect(updated.profile.currentWeightKg).toBe(88);
});

test('GET /api/profile/plan returns plan with meta', async () => {
  const user = await createUser({
    profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss',
      planTemplate: 'weight-loss',
      cuisinePreference: 'south-indian',
      healthConditions: [],
      medications: [],
      startDate: new Date(),
      waterGoalL: 2.5
    }
  });
  const res = await request(app)
    .get('/api/profile/plan')
    .set(authHeader(user._id));
  expect(res.status).toBe(200);
  expect(res.body.meta).toBeDefined();
  expect(res.body.diet).toBeDefined();
  expect(res.body.workout).toBeDefined();
});

test('POST /api/profile/onboarding accessible when profileComplete=false', async () => {
  const user = await createUser({ profileComplete: false });
  const res = await request(app)
    .post('/api/profile/onboarding')
    .set(authHeader(user._id))
    .send({
      primaryGoal: 'maintenance', currentWeightKg: 80, goalWeightKg: 80,
      heightCm: 170, age: 28, dietType: 'vegetarian', cuisinePreference: 'mixed',
      fitnessLevel: 'moderately-active', healthConditions: [], medications: [], waterGoalL: 2.5
    });
  expect(res.status).toBe(200);
});
