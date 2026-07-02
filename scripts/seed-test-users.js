#!/usr/bin/env node
/**
 * Creates test persona accounts for Playwright testing.
 * Run: node scripts/seed-test-users.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthDB';

const TEST_USERS = [
  { name: 'Harika Reddy',       email: 'harika.test@kaha.online',  password: 'Test@1234' },
  { name: 'Rahul Sharma',        email: 'rahul.test@kaha.online',   password: 'Test@1234' },
  { name: 'Priya Subramaniam',   email: 'priya.test@kaha.online',   password: 'Test@1234' },
];

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  for (const u of TEST_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      // Reset profile so onboarding can be done fresh
      await User.findByIdAndUpdate(existing._id, {
        'profile': {},
        'profileComplete': false,
        isApproved: true,
      });
      console.log(`🔄 Reset:  ${u.email}`);
    } else {
      const passwordHash = await bcrypt.hash(u.password, 12);
      await User.create({ email: u.email, name: u.name, passwordHash, isApproved: true });
      console.log(`✅ Created: ${u.email}`);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
