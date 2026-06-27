const mongoose = require('mongoose');

const profileSnapshotSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  snapshotAt: { type: Date, default: Date.now },
  reason:     { type: String, enum: ['onboarding', 'user-edit', 'periodic-review'], required: true },
  data:       { type: mongoose.Schema.Types.Mixed, required: true }
});

profileSnapshotSchema.index({ userId: 1, snapshotAt: -1 });

profileSnapshotSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('ProfileSnapshot is immutable — create a new snapshot instead of updating'));
  }
  next();
});

module.exports = mongoose.model('ProfileSnapshot', profileSnapshotSchema);
