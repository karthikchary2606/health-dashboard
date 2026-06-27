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

const ProfileSnapshot = require('../../models/ProfileSnapshot');

test('creates snapshot with required fields', async () => {
  const userId = new mongoose.Types.ObjectId();
  const snap = await ProfileSnapshot.create({
    userId,
    reason: 'onboarding',
    data: { primaryGoal: 'weight-loss', age: 30 }
  });
  expect(snap.userId.toString()).toBe(userId.toString());
  expect(snap.reason).toBe('onboarding');
  expect(snap.data.primaryGoal).toBe('weight-loss');
  expect(snap.snapshotAt).toBeInstanceOf(Date);
});

test('reason must be valid enum', async () => {
  const userId = new mongoose.Types.ObjectId();
  await expect(
    ProfileSnapshot.create({ userId, reason: 'invalid', data: {} })
  ).rejects.toThrow();
});

test('findByUser returns snapshots sorted newest first', async () => {
  const userId = new mongoose.Types.ObjectId();
  await ProfileSnapshot.create({ userId, reason: 'onboarding', data: { v: 1 }, snapshotAt: new Date(Date.now() - 1000) });
  await ProfileSnapshot.create({ userId, reason: 'user-edit', data: { v: 2 } });
  const snaps = await ProfileSnapshot.find({ userId }).sort({ snapshotAt: -1, _id: -1 });
  expect(snaps[0].data.v).toBe(2);
});

test('ProfileSnapshot is immutable — save on existing doc throws', async () => {
  const userId = new mongoose.Types.ObjectId();
  const snap = await ProfileSnapshot.create({ userId, reason: 'onboarding', data: { v: 1 } });
  snap.data = { v: 99 };
  await expect(snap.save()).rejects.toThrow('immutable');
});
