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
