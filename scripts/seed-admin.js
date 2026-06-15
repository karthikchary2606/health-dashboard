#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const User = require('../models/User');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthDB';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  const email = await ask('Admin email: ');
  const name  = await ask('Admin name: ');
  const password = await ask('Admin password (min 8 chars): ');
  rl.close();

  if (password.length < 8) { console.error('❌ Password too short'); process.exit(1); }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('⚠️  User already exists. Promoting to admin...');
    await User.findByIdAndUpdate(existing._id, { role: 'admin', isApproved: true });
    console.log('✅ User promoted to admin');
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ email, name, passwordHash, role: 'admin', isApproved: true });
    console.log('✅ Admin account created');
  }
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
