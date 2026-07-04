const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');
const HealthLog = require('../../models/HealthLog');

// Helper to normalize date to YYYY-MM-DD
function localDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  await User.deleteMany({});
  await HealthLog.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});

async function createUser(overrides = {}) {
  const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`;
  return User.create({
    name: 'Test User',
    email: uniqueEmail,
    passwordHash: 'hashed',
    isApproved: true,
    profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss',
      age: 30,
      currentWeightKg: 80,
      heightCm: 175,
      sex: 'male',
      dietType: 'non-vegetarian',
      fitnessLevel: 'moderately-active',
      nonVegDays: ['Saturday', 'Sunday'],
      eggDays: [],
      ...overrides.profile
    },
    ...overrides
  });
}

function authHeader(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

describe('GET /api/logs/today', () => {
  test('returns correct shape with all required fields', async () => {
    const user = await createUser();
    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

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
  });

  test('date should be today in YYYY-MM-DD format', async () => {
    const user = await createUser();
    const today = localDateString();
    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.date).toBe(today);
  });

  test('returns empty meals array when no log for today', async () => {
    const user = await createUser();
    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.meals).toEqual([]);
    expect(res.body.stepCount).toBe(0);
    expect(res.body.consumed).toBe(0);
  });

  test('returns meals and calorie data for today only', async () => {
    const user = await createUser();
    const today = localDateString();
    const yesterday = localDateString(new Date(Date.now() - 86400000));

    // Create logs for both today and yesterday
    await HealthLog.create({
      userId: user._id,
      date: yesterday,
      meals: [
        { mealType: 'breakfast', recipeName: 'Old Breakfast', calories: 200, fromPlan: false }
      ],
      stepCount: 1000
    });

    await HealthLog.create({
      userId: user._id,
      date: today,
      meals: [
        { mealType: 'breakfast', recipeName: 'Idli', calories: 96, fromPlan: true },
        { mealType: 'lunch', recipeName: 'Butter Chicken', calories: 295, fromPlan: false }
      ],
      stepCount: 4250
    });

    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.date).toBe(today);
    expect(res.body.meals).toHaveLength(2);
    expect(res.body.meals[0].recipeName).toBe('Idli');
    expect(res.body.meals[1].recipeName).toBe('Butter Chicken');
    expect(res.body.stepCount).toBe(4250);
  });

  test('calorie math: consumed + remaining = calorieTarget', async () => {
    const user = await createUser();
    const today = localDateString();

    await HealthLog.create({
      userId: user._id,
      date: today,
      meals: [
        { mealType: 'breakfast', recipeName: 'Eggs', calories: 150, fromPlan: false },
        { mealType: 'lunch', recipeName: 'Rice', calories: 300, fromPlan: false }
      ],
      stepCount: 5000
    });

    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    const { consumed, remaining, calorieTarget } = res.body;
    expect(consumed).toBe(450);
    expect(consumed + remaining).toBe(calorieTarget);
  });

  test('calorieTarget defaults to 2100', async () => {
    const user = await createUser();
    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.calorieTarget).toBe(2100);
  });

  test('activityLevel maps fitnessLevel correctly', async () => {
    const user = await createUser({
      profile: { fitnessLevel: 'moderately-active' }
    });

    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.activityLevel).toBe('moderate');
  });

  test('profileData contains dietType, nonVegDays, eggDays', async () => {
    const user = await createUser({
      profile: {
        dietType: 'non-vegetarian',
        nonVegDays: ['Saturday', 'Sunday'],
        eggDays: ['Wednesday']
      }
    });

    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.profileData).toHaveProperty('dietType');
    expect(res.body.profileData).toHaveProperty('nonVegDays');
    expect(res.body.profileData).toHaveProperty('eggDays');
    expect(res.body.profileData.dietType).toBe('non-vegetarian');
    expect(res.body.profileData.nonVegDays).toEqual(['Saturday', 'Sunday']);
    expect(res.body.profileData.eggDays).toEqual(['Wednesday']);
  });

  test('bmr is calculated based on profile (Mifflin-St Jeor formula)', async () => {
    // Male, 30yo, 80kg, 175cm: BMR = (10*80 + 6.25*175 - 5*30) + 5 = (800 + 1093.75 - 150) + 5 = 1748.75
    const user = await createUser({
      profile: {
        age: 30,
        currentWeightKg: 80,
        heightCm: 175,
        sex: 'male'
      }
    });

    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    // BMR should be roughly 1748.75 (male adds 5)
    expect(Math.round(res.body.bmr)).toBe(1749);
  });

  test('requires authentication', async () => {
    const res = await request(app)
      .get('/api/logs/today');

    expect(res.status).toBe(401);
  });

  test('requires profile to be complete', async () => {
    const user = await createUser({ profileComplete: false });
    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    // This depends on the requireProfile middleware behavior
    // Most likely it returns 403 or redirects
    expect([403, 401, 302]).toContain(res.status);
  });

  test('meals array includes all meal properties', async () => {
    const user = await createUser();
    const today = localDateString();

    await HealthLog.create({
      userId: user._id,
      date: today,
      meals: [
        { mealType: 'breakfast', recipeName: 'Idli', calories: 96, fromPlan: true }
      ]
    });

    const res = await request(app)
      .get('/api/logs/today')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.meals[0]).toHaveProperty('mealType');
    expect(res.body.meals[0]).toHaveProperty('recipeName');
    expect(res.body.meals[0]).toHaveProperty('calories');
    expect(res.body.meals[0]).toHaveProperty('fromPlan');
  });
});
