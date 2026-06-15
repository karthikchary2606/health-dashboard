#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

const User = require('../models/User');
const HealthLog = require('../models/HealthLog');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthDB';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  const email = await ask('Admin email to attribute existing logs to: ');
  rl.close();

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) { console.error('❌ User not found'); process.exit(1); }

  const orphaned = await HealthLog.countDocuments({ userId: { $exists: false } });
  console.log(`Found ${orphaned} logs without userId`);

  if (orphaned === 0) { console.log('✅ Nothing to migrate'); await mongoose.disconnect(); return; }

  const result = await HealthLog.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: user._id } }
  );

  console.log(`✅ Attributed ${result.modifiedCount} logs to ${user.email}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
