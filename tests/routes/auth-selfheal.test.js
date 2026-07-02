const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');

beforeAll(async () => { await mongoose.connect(process.env.MONGODB_URI); });
afterEach(async () => { await User.deleteMany({}); });
afterAll(async () => { await mongoose.disconnect(); });

const TIER1_PROFILE = {
  primaryGoal: 'weight-loss',
  age: 30,
  currentWeightKg: 80,
  heightCm: 170,
  dietType: 'vegetarian'
};

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

test('GET /api/auth/me self-heals profileComplete when all Tier 1 fields present', async () => {
  const user = await createUser({
    profileComplete: false,
    profile: { ...TIER1_PROFILE }
  });

  const res = await request(app)
    .get('/api/auth/me')
    .set(authHeader(user._id));

  expect(res.status).toBe(200);
  expect(res.body.profileComplete).toBe(true);

  // Verify persisted to DB
  const updated = await User.findById(user._id);
  expect(updated.profileComplete).toBe(true);
});

test('GET /api/auth/me does NOT self-heal when Tier 1 fields are missing', async () => {
  const user = await createUser({
    profileComplete: false,
    profile: { primaryGoal: 'weight-loss', age: 30 } // missing currentWeightKg, heightCm, dietType
  });

  const res = await request(app)
    .get('/api/auth/me')
    .set(authHeader(user._id));

  expect(res.status).toBe(200);
  expect(res.body.profileComplete).toBe(false);

  // Verify DB unchanged
  const unchanged = await User.findById(user._id);
  expect(unchanged.profileComplete).toBe(false);
});

test('GET /api/auth/me does NOT self-heal when profileComplete is already true', async () => {
  const user = await createUser({
    profileComplete: true,
    profile: { ...TIER1_PROFILE }
  });

  // Spy on findByIdAndUpdate to ensure it is NOT called for self-heal
  const spy = jest.spyOn(User, 'findByIdAndUpdate');

  const res = await request(app)
    .get('/api/auth/me')
    .set(authHeader(user._id));

  expect(res.status).toBe(200);
  expect(res.body.profileComplete).toBe(true);

  // Self-heal should not have been called with profileComplete:true update
  const selfHealCall = spy.mock.calls.find(
    call => call[1] && call[1].profileComplete === true
  );
  expect(selfHealCall).toBeUndefined();

  spy.mockRestore();
});
