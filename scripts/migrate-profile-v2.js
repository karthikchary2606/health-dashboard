#!/usr/bin/env node
/**
 * One-time migration: Profile V2
 * - healthConditions: [String] → [{ name, active: true }]
 * - medications: adds active: true, resolvedAt: null to each
 * - waterGoalL: recomputes from weight if not already set correctly
 * - Initialises new V2 array fields to [] if missing
 * - Sets reviewReminderDays default (60) if missing
 * Run: node scripts/migrate-profile-v2.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users`);

  let migrated = 0;
  for (const u of users) {
    const p = u.profile || {};
    const updates = {};

    // Migrate healthConditions: [String] → [{name, active: true}]
    if (Array.isArray(p.healthConditions) && p.healthConditions.length > 0) {
      const needsMigration = p.healthConditions.some(c => typeof c === 'string');
      if (needsMigration) {
        updates['profile.healthConditions'] = p.healthConditions.map(c =>
          typeof c === 'string' ? { name: c, active: true, resolvedAt: null } : c
        );
      }
    }

    // Migrate medications: add active + resolvedAt if missing
    if (Array.isArray(p.medications) && p.medications.length > 0) {
      const needsMigration = p.medications.some(m => m.active === undefined);
      if (needsMigration) {
        updates['profile.medications'] = p.medications.map(m => ({
          ...m,
          active: m.active !== undefined ? m.active : true,
          resolvedAt: m.resolvedAt || null
        }));
      }
    }

    // Recompute waterGoalL from weight if missing or at old default
    if (p.currentWeightKg && (!p.waterGoalL || p.waterGoalL === 2.5)) {
      updates['profile.waterGoalL'] = Math.round((p.currentWeightKg * 30) / 1000 * 10) / 10;
    }

    // Initialise new V2 array fields
    if (!p.foodList)                updates['profile.foodList']                = [];
    if (!p.culturalFoodAvoidances)  updates['profile.culturalFoodAvoidances']  = [];
    if (!p.workoutPreferences)      updates['profile.workoutPreferences']      = [];

    // Set default reviewReminderDays
    if (!p.reviewReminderDays) updates['profile.reviewReminderDays'] = 60;

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(u._id, updates);
      migrated++;
      console.log(`  Migrated: ${u.email}`);
    } else {
      console.log(`  Skipped (already current): ${u.email}`);
    }
  }

  console.log(`\n✅ Done — migrated ${migrated}/${users.length} users`);
  await mongoose.disconnect();
}

migrate().catch(err => { console.error(err); process.exit(1); });
