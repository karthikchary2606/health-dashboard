const mongoose = require('mongoose');

const HealthLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  checklist: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChecklistItem' },
    done: { type: Boolean, default: false }
  }],
  waterIntake: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  completedWorkout: { type: Boolean, default: false },
  moodScore: { type: Number, default: 3 },
  energyScore: { type: Number, default: 3 },
  notes: { type: String, default: '' },
  sleepEntry: {
    bedtime:         { type: String },
    wakeTime:        { type: String },
    durationMinutes: { type: Number, min: 0 },
    quality:         { type: Number, min: 1, max: 5 },
    notes:           { type: String, default: '' }
  }
}, { timestamps: true });

HealthLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HealthLog', HealthLogSchema);
