const mongoose = require('mongoose');

const mealEntrySchema = new mongoose.Schema({
  mealType:   { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
  recipeName: { type: String },
  calories:   { type: Number, default: 0 },
  proteinG:   { type: Number, default: 0 },
  carbsG:     { type: Number, default: 0 },
  fatG:       { type: Number, default: 0 }
}, { _id: false });

const exerciseEntrySchema = new mongoose.Schema({
  exerciseName: { type: String, required: true },
  sets:         { type: Number, default: 0 },
  reps:         { type: Number, default: 0 },
  weightKg:     { type: Number, default: 0 },
  durationMin:  { type: Number, default: 0 }
}, { _id: false });

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
  },
  meals:       { type: [mealEntrySchema], default: [] },
  exerciseLog: { type: [exerciseEntrySchema], default: [] }
}, { timestamps: true });

HealthLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HealthLog', HealthLogSchema);
