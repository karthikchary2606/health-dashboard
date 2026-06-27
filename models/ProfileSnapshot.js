const mongoose = require('mongoose');

const profileSnapshotSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  snapshotAt: { type: Date, default: Date.now },
  reason:     { type: String, enum: ['onboarding', 'user-edit', 'periodic-review'], required: true },
  data:       { type: mongoose.Schema.Types.Mixed, required: true }
});

module.exports = mongoose.model('ProfileSnapshot', profileSnapshotSchema);
