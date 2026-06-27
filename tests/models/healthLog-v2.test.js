'use strict';
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

const HealthLog = require('../../models/HealthLog');

test('HealthLog stores meals with calorie data', async () => {
  const userId = new mongoose.Types.ObjectId();
  const log = await HealthLog.create({
    userId, date: '2026-06-27',
    meals: [{
      mealType: 'breakfast',
      recipeName: 'Pesarattu',
      calories: 260, proteinG: 14, carbsG: 44, fatG: 4
    }]
  });
  expect(log.meals).toHaveLength(1);
  expect(log.meals[0].calories).toBe(260);
  expect(log.meals[0].mealType).toBe('breakfast');
});

test('HealthLog stores exerciseLog with sets/reps', async () => {
  const userId = new mongoose.Types.ObjectId();
  const log = await HealthLog.create({
    userId, date: '2026-06-28',
    exerciseLog: [{
      exerciseName: 'Push Up',
      sets: 3, reps: 15, weightKg: 0, durationMin: 0
    }]
  });
  expect(log.exerciseLog[0].exerciseName).toBe('Push Up');
  expect(log.exerciseLog[0].sets).toBe(3);
});

test('HealthLog stores Surya Namaskar rounds', async () => {
  const userId = new mongoose.Types.ObjectId();
  const log = await HealthLog.create({
    userId, date: '2026-06-29',
    exerciseLog: [{
      exerciseName: 'Surya Namaskar',
      sets: 12, reps: 1, weightKg: 0, durationMin: 20
    }]
  });
  expect(log.exerciseLog[0].exerciseName).toBe('Surya Namaskar');
  expect(log.exerciseLog[0].sets).toBe(12);
});

test('meals mealType enum rejects invalid values', async () => {
  const userId = new mongoose.Types.ObjectId();
  await expect(
    HealthLog.create({ userId, date: '2026-06-30', meals: [{ mealType: 'midnight-snack', recipeName: 'Chips', calories: 100, proteinG: 1, carbsG: 15, fatG: 5 }] })
  ).rejects.toThrow();
});
