#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const User = require('../models/User');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthDB';

// Support non-interactive mode via env vars: ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD
const nonInteractive = process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD;

const rl = nonInteractive ? null : readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  let email, name, password;

  if (nonInteractive) {
    email    = process.env.ADMIN_EMAIL.trim();
    name     = process.env.ADMIN_NAME || 'Admin';
    password = process.env.ADMIN_PASSWORD;
    console.log(`Using env vars: email=${email}, name=${name}`);
  } else {
    email    = await ask('Admin email: ');
    name     = await ask('Admin name: ');
    password = await ask('Admin password (min 8 chars): ');
    rl.close();
  }

  if (password.length < 8) { console.error('❌ Password too short'); process.exit(1); }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('⚠️  User already exists. Promoting to admin...');
    await User.findByIdAndUpdate(existing._id, { role: 'admin', isApproved: true });
    console.log('✅ User promoted to admin');
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ email: email.toLowerCase(), name, passwordHash, role: 'admin', isApproved: true });
    console.log('✅ Admin account created');
  }
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
