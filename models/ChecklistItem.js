const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

ChecklistItemSchema.index({ userId: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('ChecklistItem', ChecklistItemSchema);
