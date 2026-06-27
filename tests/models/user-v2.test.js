const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const User = require('../../models/User');

const BASE = {
  name: 'Test', email: 'test@x.com', passwordHash: 'hash',
  isApproved: true
};

test('healthConditions stores name + active + resolvedAt', async () => {
  const u = await User.create({
    ...BASE,
    email: 'hc@x.com',
    profile: {
      healthConditions: [{ name: 'diabetes', active: true }]
    }
  });
  expect(u.profile.healthConditions[0].name).toBe('diabetes');
  expect(u.profile.healthConditions[0].active).toBe(true);
  expect(u.profile.healthConditions[0].resolvedAt).toBeNull();
});

test('healthConditions active defaults to true', async () => {
  const u = await User.create({
    ...BASE, email: 'hc2@x.com',
    profile: { healthConditions: [{ name: 'thyroid' }] }
  });
  expect(u.profile.healthConditions[0].active).toBe(true);
});

test('medications stores active + resolvedAt', async () => {
  const u = await User.create({
    ...BASE, email: 'med@x.com',
    profile: {
      medications: [{ name: 'Metformin', dosage: '500mg', timing: 'morning', active: true }]
    }
  });
  expect(u.profile.medications[0].active).toBe(true);
  expect(u.profile.medications[0].resolvedAt).toBeNull();
});

test('foodList stores name + category + custom', async () => {
  const u = await User.create({
    ...BASE, email: 'fl@x.com',
    profile: {
      foodList: [
        { name: 'Idli', category: 'grains', custom: false },
        { name: 'Gongura Curry', category: 'vegetables', custom: true }
      ]
    }
  });
  expect(u.profile.foodList).toHaveLength(2);
  expect(u.profile.foodList[0].category).toBe('grains');
  expect(u.profile.foodList[1].custom).toBe(true);
});

test('workoutPreferences stores array of strings', async () => {
  const u = await User.create({
    ...BASE, email: 'wp@x.com',
    profile: { workoutPreferences: ['yoga', 'surya-namaskar'] }
  });
  expect(u.profile.workoutPreferences).toEqual(['yoga', 'surya-namaskar']);
});

test('reviewReminderDays defaults to 60', async () => {
  const u = await User.create({ ...BASE, email: 'rr@x.com' });
  expect(u.profile.reviewReminderDays).toBe(60);
});

test('culturalFoodAvoidances stores array', async () => {
  const u = await User.create({
    ...BASE, email: 'cfa@x.com',
    profile: { culturalFoodAvoidances: ['beef', 'pork'] }
  });
  expect(u.profile.culturalFoodAvoidances).toEqual(['beef', 'pork']);
});
