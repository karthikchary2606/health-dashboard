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
  const baseProfile = {
    primaryGoal: 'weight-loss',
    age: 30,
    currentWeightKg: 80,
    heightCm: 175,
    dietType: 'vegetarian',
    stepGoal: 8000
  };
  
  return User.create({
    name: 'Test User',
    email: uniqueEmail,
    passwordHash: 'hashed',
    isApproved: true,
    profileComplete: true,
    ...overrides,
    profile: {
      ...baseProfile,
      ...(overrides.profile || {})
    }
  });
}

function authHeader(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

describe('POST /api/tracker/meal', () => {
  test('logs meal to today\'s HealthLog and returns mealId, calories, logged', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/tracker/meal')
      .set(authHeader(user._id))
      .send({
        fromPlan: false,
        recipeName: 'Grilled Chicken',
        calories: 350,
        mealType: 'lunch',
        date: localDateString()
      });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mealId');
    expect(res.body.calories).toBe(350);
    expect(res.body.logged).toBe(true);
    
    // Verify meal was saved to HealthLog
    const log = await HealthLog.findOne({ userId: user._id, date: localDateString() });
    expect(log).toBeDefined();
    expect(log.meals.length).toBe(1);
    expect(log.meals[0].recipeName).toBe('Grilled Chicken');
  });

  test('returns error if required fields missing', async () => {
    const user = await createUser();
    const res = await request(app)
      .post('/api/tracker/meal')
      .set(authHeader(user._id))
      .send({
        recipeName: 'Grilled Chicken'
        // missing calories, mealType, date
      });
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/tracker/today', () => {
  test('returns today\'s meals, steps, and calorie summary', async () => {
    const user = await createUser({
      profile: { stepGoal: 8000 }
    });
    
    const today = localDateString();
    await HealthLog.create({
      userId: user._id,
      date: today,
      stepCount: 5000,
      meals: [
        { mealType: 'breakfast', recipeName: 'Oats', calories: 350 },
        { mealType: 'lunch', recipeName: 'Chicken', calories: 500 },
        { mealType: 'snack', recipeName: 'Apple', calories: 100 }
      ]
    });
    
    const res = await request(app)
      .get('/api/tracker/today')
      .set(authHeader(user._id));
    
    expect(res.status).toBe(200);
    expect(res.body.meals).toHaveLength(3);
    expect(res.body.stepCount).toBe(5000);
    expect(res.body.calorieTarget).toBe(2100);
    expect(res.body.consumed).toBe(950);
    expect(res.body.remaining).toBe(1150);
  });

  test('returns empty meals and 0 steps if no log for today', async () => {
    const user = await createUser();
    
    const res = await request(app)
      .get('/api/tracker/today')
      .set(authHeader(user._id));
    
    expect(res.status).toBe(200);
    expect(res.body.meals).toHaveLength(0);
    expect(res.body.stepCount).toBe(0);
    expect(res.body.calorieTarget).toBe(2100);
    expect(res.body.consumed).toBe(0);
    expect(res.body.remaining).toBe(2100);
  });
});

describe('DELETE /api/tracker/meal/:mealId', () => {
  test('deletes meal from today\'s log and returns deleted: true', async () => {
    const user = await createUser();
    const today = localDateString();
    
    const log = await HealthLog.create({
      userId: user._id,
      date: today,
      meals: [
        { mealType: 'breakfast', recipeName: 'Oats', calories: 350 },
        { mealType: 'lunch', recipeName: 'Chicken', calories: 500 }
      ]
    });
    
    const mealId = log.meals[0]._id.toString();
    
    const res = await request(app)
      .delete(`/api/tracker/meal/${mealId}`)
      .set(authHeader(user._id));
    
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
    
    // Verify meal was deleted
    const updated = await HealthLog.findOne({ userId: user._id, date: today });
    expect(updated.meals.length).toBe(1);
    expect(updated.meals[0].recipeName).toBe('Chicken');
  });

  test('returns error if meal not found', async () => {
    const user = await createUser();
    const fakeId = new mongoose.Types.ObjectId();
    
    const res = await request(app)
      .delete(`/api/tracker/meal/${fakeId}`)
      .set(authHeader(user._id));
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/tracker/meal/:mealId', () => {
  test('updates meal and returns updated meal', async () => {
    const user = await createUser();
    const today = localDateString();
    
    const log = await HealthLog.create({
      userId: user._id,
      date: today,
      meals: [
        { mealType: 'breakfast', recipeName: 'Oats', calories: 350, proteinG: 12 }
      ]
    });
    
    const mealId = log.meals[0]._id.toString();
    
    const res = await request(app)
      .patch(`/api/tracker/meal/${mealId}`)
      .set(authHeader(user._id))
      .send({
        recipeName: 'Oats with Berries',
        calories: 400,
        mealType: 'breakfast'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.recipeName).toBe('Oats with Berries');
    expect(res.body.calories).toBe(400);
    
    // Verify update persisted
    const updated = await HealthLog.findOne({ userId: user._id, date: today });
    expect(updated.meals[0].recipeName).toBe('Oats with Berries');
    expect(updated.meals[0].calories).toBe(400);
  });

  test('returns error if meal not found', async () => {
    const user = await createUser();
    const fakeId = new mongoose.Types.ObjectId();
    
    const res = await request(app)
      .patch(`/api/tracker/meal/${fakeId}`)
      .set(authHeader(user._id))
      .send({ recipeName: 'Updated' });
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/tracker/steps', () => {
  test('adds/updates step count for date', async () => {
    const user = await createUser();
    const date = localDateString();
    
    const res = await request(app)
      .patch('/api/tracker/steps')
      .set(authHeader(user._id))
      .send({ stepCount: 8500, date });
    
    expect(res.status).toBe(200);
    expect(res.body.stepCount).toBe(8500);
    expect(res.body.date).toBe(date);
    
    // Verify saved to HealthLog
    const log = await HealthLog.findOne({ userId: user._id, date });
    expect(log.stepCount).toBe(8500);
  });

  test('updates existing step count', async () => {
    const user = await createUser();
    const date = localDateString();
    
    await HealthLog.create({
      userId: user._id,
      date,
      stepCount: 5000
    });
    
    const res = await request(app)
      .patch('/api/tracker/steps')
      .set(authHeader(user._id))
      .send({ stepCount: 7200, date });
    
    expect(res.status).toBe(200);
    expect(res.body.stepCount).toBe(7200);
    
    const log = await HealthLog.findOne({ userId: user._id, date });
    expect(log.stepCount).toBe(7200);
  });

  test('returns error if required fields missing', async () => {
    const user = await createUser();
    
    const res = await request(app)
      .patch('/api/tracker/steps')
      .set(authHeader(user._id))
      .send({ stepCount: 8500 }); // missing date
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/tracker/summary/:date', () => {
  test('returns summary for specific date', async () => {
    const user = await createUser({
      profile: { stepGoal: 8000 }
    });
    
    const date = localDateString();
    await HealthLog.create({
      userId: user._id,
      date,
      stepCount: 6000,
      meals: [
        { mealType: 'breakfast', recipeName: 'Oats', calories: 300 },
        { mealType: 'lunch', recipeName: 'Salmon', calories: 600 }
      ]
    });
    
    const res = await request(app)
      .get(`/api/tracker/summary/${date}`)
      .set(authHeader(user._id));
    
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(date);
    expect(res.body.meals).toHaveLength(2);
    expect(res.body.stepCount).toBe(6000);
    expect(res.body.calorieTarget).toBe(2100);
    expect(res.body.consumed).toBe(900);
    expect(res.body.remaining).toBe(1200);
  });

  test('returns empty data if no log for date', async () => {
    const user = await createUser();
    const date = localDateString();
    
    const res = await request(app)
      .get(`/api/tracker/summary/${date}`)
      .set(authHeader(user._id));
    
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(date);
    expect(res.body.meals).toHaveLength(0);
    expect(res.body.stepCount).toBe(0);
    expect(res.body.consumed).toBe(0);
    expect(res.body.remaining).toBe(2100);
  });
});
