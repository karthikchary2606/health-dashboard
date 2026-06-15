const mongoose = require('mongoose');

const BreathingSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  technique: {
    type: String,
    enum: ['box', '4-7-8', 'wim-hof', 'diaphragmatic'],
    required: true
  },
  durationSeconds: { type: Number, default: 0 },
  cyclesCompleted: { type: Number, default: 0 },
  moodBefore: { type: Number, min: 1, max: 5 },
  moodAfter: { type: Number, min: 1, max: 5 },
  completedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BreathingSession', BreathingSessionSchema);
