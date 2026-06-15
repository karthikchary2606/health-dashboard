const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true
  },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isApproved: { type: Boolean, default: false },
  profile: {
    age: Number,
    heightCm: Number,
    startWeightKg: Number,
    goalWeightKg: Number,
    startDate: Date,
    dietaryPreferences: [String]
  },
  lastActiveAt: Date
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
