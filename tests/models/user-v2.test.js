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

test('foodList rejects entry without name', async () => {
  await expect(
    User.create({
      ...BASE, email: 'fl-invalid@x.com',
      profile: { foodList: [{ category: 'grains' }] }
    })
  ).rejects.toThrow();
});

test('reviewReminderDays rejects invalid value', async () => {
  await expect(
    User.create({
      ...BASE, email: 'rr-invalid@x.com',
      profile: { reviewReminderDays: 45 }
    })
  ).rejects.toThrow();
});

test('workoutDaysPerWeek accepts 1 day per week', async () => {
  const u = await User.create({
    ...BASE, email: 'wd1@x.com',
    profile: { workoutDaysPerWeek: 1 }
  });
  expect(u.profile.workoutDaysPerWeek).toBe(1);
});

test('workoutDaysPerWeek rejects 0', async () => {
  await expect(
    User.create({
      ...BASE, email: 'wd0@x.com',
      profile: { workoutDaysPerWeek: 0 }
    })
  ).rejects.toThrow();
});

test('nonVegDays stores array of strings', async () => {
  const u = await User.create({
    ...BASE, email: 'nvd@x.com',
    profile: { nonVegDays: ['Saturday', 'Sunday'] }
  });
  expect(u.profile.nonVegDays).toEqual(['Saturday', 'Sunday']);
});

test('nonVegDays defaults to empty array', async () => {
  const u = await User.create({
    ...BASE, email: 'nvd-default@x.com'
  });
  expect(u.profile.nonVegDays).toEqual([]);
});

test('eggDays stores array of strings', async () => {
  const u = await User.create({
    ...BASE, email: 'ed@x.com',
    profile: { eggDays: ['Monday', 'Wednesday', 'Friday'] }
  });
  expect(u.profile.eggDays).toEqual(['Monday', 'Wednesday', 'Friday']);
});

test('eggDays defaults to empty array', async () => {
  const u = await User.create({
    ...BASE, email: 'ed-default@x.com'
  });
  expect(u.profile.eggDays).toEqual([]);
});

test('stepGoal stores number', async () => {
  const u = await User.create({
    ...BASE, email: 'sg@x.com',
    profile: { stepGoal: 10000 }
  });
  expect(u.profile.stepGoal).toBe(10000);
});

test('stepGoal defaults to 8000', async () => {
  const u = await User.create({
    ...BASE, email: 'sg-default@x.com'
  });
  expect(u.profile.stepGoal).toBe(8000);
});
