#!/usr/bin/env node
/**
 * One-time migration: set Karthik's health profile and mark profileComplete.
 * Run: MONGODB_URI=<uri> node scripts/migrate-karthik-profile.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const TARGET_EMAIL = 'karthik.chary2606@gmail.com';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.error(`FATAL: User not found with email ${TARGET_EMAIL}`);
    process.exit(1);
  }

  user.profileComplete = true;
  user.profile = {
    ...user.profile,
    primaryGoal: 'weight-loss',
    currentWeightKg: 95,
    startWeightKg: 95,
    goalWeightKg: 75,
    heightCm: user.profile.heightCm || 175,
    age: user.profile.age || 30,
    dietType: 'non-vegetarian',
    cuisinePreference: 'south-indian',
    foodAllergies: [],
    fitnessLevel: 'lightly-active',
    equipmentAvailable: ['dumbbells', 'resistance-bands'],
    healthConditions: [{ name: 'lower-back-pain' }],
    medications: [
      { name: 'Thyronorm', dosage: '12.5mg', timing: 'morning-empty-stomach' }
    ],
    planTemplate: 'weight-loss',
    waterGoalL: 2.5,
    startDate: user.profile.startDate || new Date('2025-01-01')
  };

  await user.save();
  console.log(`SUCCESS: Profile updated for ${TARGET_EMAIL}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
