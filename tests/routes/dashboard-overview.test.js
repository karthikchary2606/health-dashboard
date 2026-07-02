'use strict';
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const User = require('../../models/User');
const northIndianMeals = require('../../server/meals/north-indian');

beforeAll(async () => { await mongoose.connect(process.env.MONGODB_URI); });
afterEach(async () => { await User.deleteMany({}); });
afterAll(async () => { await mongoose.disconnect(); });

function authHeader(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

async function createUser(overrides = {}) {
  return User.create({
    name: 'Dashboard User',
    email: 'dashboard@test.com',
    passwordHash: 'hashed',
    isApproved: true,
    profileComplete: true,
    profile: {
      primaryGoal: 'weight-loss',
      currentWeightKg: 80,
      goalWeightKg: 70,
      heightCm: 175,
      age: 30,
      dietType: 'vegetarian',
      cuisinePreference: 'south-indian',
      fitnessLevel: 'lightly-active',
      waterGoalL: 2.5,
      ...((overrides && overrides.profile) || {})
    },
    ...overrides
  });
}

describe('GET /api/dashboard/overview', () => {
  test('returns contract payload keys', async () => {
    const user = await createUser();

    const res = await request(app)
      .get('/api/dashboard/overview')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('timeline');
    expect(res.body).toHaveProperty('dietPreview');
    expect(res.body).toHaveProperty('recipePreview');
    expect(res.body).toHaveProperty('stats');
    expect(res.body).toHaveProperty('profileCompleteness');
  });

  test('sets cache-control no-store', async () => {
    const user = await createUser({ email: 'cache@test.com' });

    const res = await request(app)
      .get('/api/dashboard/overview')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('no-store');
  });

  test('requires authentication', async () => {
    const res = await request(app).get('/api/dashboard/overview');
    expect(res.status).toBe(401);
  });

  test('requires profile completion', async () => {
    const user = await createUser({
      email: 'incomplete@test.com',
      profileComplete: false
    });

    const res = await request(app)
      .get('/api/dashboard/overview')
      .set(authHeader(user._id));

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Profile incomplete/);
  });

  test('returns deterministic defaults when user has no logs', async () => {
    const user = await createUser({ email: 'no-logs@test.com' });

    const res = await request(app)
      .get('/api/dashboard/overview')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.timeline)).toBe(true);
    expect(res.body.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'habit',
          label: 'Workout',
          completed: false
        })
      ])
    );
    expect(res.body.dietPreview).toMatchObject({
      dailyCalorieTarget: null,
      macros: {
        proteinG: null,
        carbsG: null,
        fatG: null
      }
    });
    expect(res.body.stats).toEqual({
      daysLogged: 0,
      avgWaterIntakeL: 0,
      avgMoodScore: 0
    });
  });

  test('keeps stable overview structure for sparse but valid profile data', async () => {
    const user = await User.create({
      name: 'Sparse Profile',
      email: 'sparse-profile@test.com',
      passwordHash: 'hashed',
      isApproved: true,
      profileComplete: true,
      profile: {
        primaryGoal: 'maintenance',
        age: 32,
        currentWeightKg: 78,
        heightCm: 173,
        dietType: 'vegetarian'
      }
    });

    const res = await request(app)
      .get('/api/dashboard/overview')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        timeline: expect.any(Array),
        dietPreview: expect.objectContaining({
          dailyCalorieTarget: null,
          macros: expect.objectContaining({
            proteinG: null,
            carbsG: null,
            fatG: null
          }),
          meals: expect.any(Object)
        }),
        recipePreview: expect.any(Array),
        stats: {
          daysLogged: 0,
          avgWaterIntakeL: 0,
          avgMoodScore: 0
        },
        profileCompleteness: {
          percentage: 83,
          missingFields: ['fitnessLevel']
        }
      })
    );
    expect(res.body.recipePreview.every((item) => typeof item.name === 'string')).toBe(true);
    expect(res.body.timeline.find((item) => item.type === 'habit')).toEqual(
      expect.objectContaining({ label: 'Workout', completed: false })
    );
  });

  test('aligns recipePreview and dietPreview meals with profile diet/cuisine semantics', async () => {
    const user = await createUser({
      email: 'north-veg@test.com',
      profile: {
        primaryGoal: 'weight-loss',
        currentWeightKg: 80,
        goalWeightKg: 70,
        heightCm: 175,
        age: 30,
        cuisinePreference: 'north-indian',
        dietType: 'vegetarian',
        fitnessLevel: 'lightly-active',
        waterGoalL: 2.5
      }
    });

    const res = await request(app)
      .get('/api/dashboard/overview')
      .set(authHeader(user._id));

    expect(res.status).toBe(200);
    const mealMap = Object.fromEntries(
      res.body.recipePreview.map((recipe) => [recipe.mealType, recipe.name])
    );

    expect(res.body.dietPreview.meals).toEqual({
      breakfast: mealMap.breakfast || null,
      lunch: mealMap.lunch || null,
      snack: mealMap.snack || null,
      dinner: mealMap.dinner || null
    });

    res.body.recipePreview.forEach((recipe) => {
      expect(northIndianMeals[recipe.mealType].veg).toContain(recipe.name);
    });
  });

  test('fails closed when meal metadata cannot be resolved for preview meals', async () => {
    const weightLossTemplate = require('../../server/templates/weight-loss');
    const originalGetDietPlan = weightLossTemplate.getDietPlan;
    weightLossTemplate.getDietPlan = () => [{
      weeks: [{
        weekdays: [{
          day: 'monday',
          breakfast: 'Unknown Breakfast',
          lunch: 'Unknown Lunch',
          snack: 'Unknown Snack',
          dinner: 'Unknown Dinner'
        }]
      }]
    }];

    try {
      const user = await createUser({
        email: 'unmatched-cuisine@test.com',
        profile: {
          primaryGoal: 'weight-loss',
          currentWeightKg: 80,
          goalWeightKg: 70,
          heightCm: 175,
          age: 30,
          cuisinePreference: 'north-indian',
          dietType: 'vegetarian',
          fitnessLevel: 'lightly-active',
          waterGoalL: 2.5
        }
      });

      const res = await request(app)
        .get('/api/dashboard/overview')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.recipePreview).toEqual([]);
      expect(res.body.dietPreview.meals).toEqual({
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null
      });
    } finally {
      weightLossTemplate.getDietPlan = originalGetDietPlan;
    }
  });
});
