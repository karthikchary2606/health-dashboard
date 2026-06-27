const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  dosage:     String,
  timing:     String,
  active:     { type: Boolean, default: true },
  resolvedAt: { type: Date, default: null }
}, { _id: false });

const healthConditionSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  active:     { type: Boolean, default: true },
  resolvedAt: { type: Date, default: null }
}, { _id: false });

const profileSchema = new mongoose.Schema({
  // Existing fields (keep as-is)
  age: Number,
  heightCm: Number,
  startWeightKg: Number,
  goalWeightKg: Number,
  startDate: Date,
  dietaryPreferences: [String],
  // New fields
  primaryGoal: {
    type: String,
    enum: ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness']
  },
  secondaryGoals: [String],
  currentWeightKg: Number,
  dietType: {
    type: String,
    enum: ['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian']
  },
  cuisinePreference: {
    type: String,
    enum: ['south-indian', 'north-indian', 'continental', 'mixed'],
    default: 'mixed'
  },
  foodAllergies: [String],
  fitnessLevel: {
    type: String,
    enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active']
  },
  equipmentAvailable: [String],
  healthConditions: [healthConditionSchema],
  medications: [medicationSchema],
  planTemplate: {
    type: String,
    enum: ['weight-loss', 'muscle-gain', 'maintenance', 'general-fitness']
  },
  waterGoalL: { type: Number, default: 2.5 },

  // Cultural identity
  religion:               { type: String, enum: ['Hindu', 'Muslim', 'Christian', 'Jain', 'Sikh', 'Other'] },
  languageCommunity:      { type: String, enum: ['Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Hindi', 'Other'] },
  culturalFoodAvoidances: [String],

  // Food list
  foodList: [{
    name:     { type: String, required: true },
    category: { type: String, enum: ['grains', 'vegetables', 'proteins', 'dairy', 'snacks', 'beverages'] },
    custom:   { type: Boolean, default: false },
    _id:      false
  }],

  // Workout preferences
  workoutPreferences:  [String],
  workoutDaysPerWeek:  { type: Number, min: 1, max: 7 },
  workoutTime:         { type: String, enum: ['morning', 'afternoon', 'evening'] },
  yogaStyle:           { type: String, enum: ['hatha', 'vinyasa', 'pranayama-only', 'none'] },

  // Periodic review
  reviewReminderDays: { type: Number, enum: [30, 60, 90], default: 60 },
  lastReviewedAt:     Date,

  // Computed macro targets (set on plan generation)
  dailyCalorieTarget: Number,
  dailyProteinG:      Number,
  dailyCarbsG:        Number,
  dailyFatG:          Number
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profileComplete: { type: Boolean, default: false },
  lastActiveAt: { type: Date },
  profile: { type: profileSchema, default: () => ({}) }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
