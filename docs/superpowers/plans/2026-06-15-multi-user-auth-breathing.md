# Multi-User Auth, User Management & Breathing Exercises — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Health Engine from a single-user personal tracker into a multi-user platform with JWT auth (httpOnly cookies), admin-controlled user management, breathing exercises module, per-user daily logs, and modular JS frontend.

**Architecture:** Express/MongoDB backend split into route modules (`routes/auth`, `routes/logs`, `routes/admin`, `routes/breathing`, `routes/checklist`). JWT stored as httpOnly SameSite=Strict cookie. Frontend JS extracted from `index.html` into `public/js/*.js` modules (HTML markup stays in `index.html`). New pages: `login.html`, `admin.html`.

**Tech Stack:** Node.js/Express, Mongoose/MongoDB, bcryptjs, jsonwebtoken, cookie-parser, express-rate-limit, vanilla JS (no build step), Azure App Service (ZIP deploy via GitHub Actions — pipeline unchanged).

**Spec:** `docs/superpowers/specs/2026-06-15-multi-user-auth-breathing-design.md`

---

## File Map

### New files (create)
| File | Responsibility |
|------|----------------|
| `middleware/auth.js` | `verifyToken` — parse httpOnly cookie, attach `req.user` |
| `middleware/requireAdmin.js` | Check `req.user.role === 'admin'` |
| `models/User.js` | User schema (email, passwordHash, name, role, isApproved, profile) |
| `models/BreathingSession.js` | BreathingSession schema |
| `models/ChecklistItem.js` | Per-user checklist items |
| `routes/auth.js` | POST /api/auth/register, /login, /logout, GET /me |
| `routes/logs.js` | GET/POST /api/logs/:date, /weight-history, /stats |
| `routes/admin.js` | Admin CRUD endpoints |
| `routes/breathing.js` | GET/POST /api/breathing/sessions |
| `routes/checklist.js` | CRUD /api/checklist/items |
| `scripts/seed-admin.js` | CLI script to create first admin account |
| `scripts/migrate-logs.js` | Attribute existing HealthLog docs to admin userId |
| `public/login.html` | Login + register page |
| `public/admin.html` | Admin user management panel |
| `public/js/api.js` | `apiFetch()` wrapper — credentials:include, 401 redirect |
| `public/js/auth.js` | Page-load auth check, login/logout, sidebar personalisation |
| `public/js/dashboard.js` | `buildTimeline`, `loadDateData`, `syncData`, mood/water/workout |
| `public/js/diet.js` | Diet plan data + render functions |
| `public/js/recipes.js` | Recipes data + render functions |
| `public/js/workout.js` | Workout plan data + render functions |
| `public/js/cardio.js` | Cardio data + render functions |
| `public/js/progress.js` | `loadProgress`, charts, milestones, BMI |
| `public/js/guidelines.js` | Guidelines + seed tracker render |
| `public/js/grocery.js` | Grocery plan data + render functions |
| `public/js/breathing.js` | Breathing session UI, timer state machine, API calls |

### Modified files
| File | Change |
|------|--------|
| `server.js` | Mount all routers, add cookie-parser, rate-limit, JWT_SECRET guard, remove inline handlers |
| `models/HealthLog.js` | Add `userId` field, change `checklist` from `[Boolean]` to `[{itemId,done}]`, compound unique index |
| `package.json` | Add bcryptjs, jsonwebtoken, cookie-parser, express-rate-limit |
| `public/index.html` | Add `<script>` tags for `public/js/*.js`, remove inline `<script>` block (lines 776–2862), add breathing section HTML, update sidebar/nav, add user avatar/logout button |

---

## Task 1: Install dependencies and add JWT_SECRET guard

**Files:**
- Modify: `package.json`
- Modify: `server.js`

- [ ] **Step 1: Install new packages**

```bash
cd /Users/kkondoju/projects/health-dashboard
npm install bcryptjs jsonwebtoken cookie-parser express-rate-limit
```

Expected output: `added N packages` — no errors.

- [ ] **Step 2: Verify packages installed**

```bash
node -e "require('bcryptjs'); require('jsonwebtoken'); require('cookie-parser'); require('express-rate-limit'); console.log('✅ all deps ok')"
```

Expected: `✅ all deps ok`

- [ ] **Step 3: Add JWT_SECRET guard to server.js**

Replace the top of `server.js` (lines 1–6) with:

```js
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not set — refusing to start');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
```

- [ ] **Step 4: Verify server refuses to start without JWT_SECRET**

```bash
node server.js
```

Expected: `❌ JWT_SECRET not set — refusing to start` then exits.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json server.js
git commit -m "feat: install auth dependencies, add JWT_SECRET startup guard

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Create User model

**Files:**
- Create: `models/User.js`

- [ ] **Step 1: Create models directory and User.js**

```bash
mkdir -p /Users/kkondoju/projects/health-dashboard/models
```

- [ ] **Step 2: Write `models/User.js`**

```js
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
```

- [ ] **Step 3: Verify model loads**

```bash
JWT_SECRET=test node -e "require('./models/User'); console.log('✅ User model ok')"
```

Expected: `✅ User model ok`

- [ ] **Step 4: Commit**

```bash
git add models/User.js
git commit -m "feat: add User model

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Update HealthLog model — add userId, update checklist schema

**Files:**
- Modify: `models/HealthLog.js` (currently inlined in server.js — extract first)

- [ ] **Step 1: Create `models/HealthLog.js`**

```js
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
  notes: { type: String, default: '' }
}, { timestamps: true });

HealthLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HealthLog', HealthLogSchema);
```

- [ ] **Step 2: Create `models/ChecklistItem.js`**

```js
const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ChecklistItem', ChecklistItemSchema);
```

- [ ] **Step 3: Create `models/BreathingSession.js`**

```js
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
```

- [ ] **Step 4: Verify all models load**

```bash
JWT_SECRET=test node -e "
  require('./models/User');
  require('./models/HealthLog');
  require('./models/ChecklistItem');
  require('./models/BreathingSession');
  console.log('✅ all models ok');
"
```

Expected: `✅ all models ok`

- [ ] **Step 5: Commit**

```bash
git add models/HealthLog.js models/ChecklistItem.js models/BreathingSession.js
git commit -m "feat: extract and update data models (HealthLog userId + checklist, ChecklistItem, BreathingSession)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Auth middleware

**Files:**
- Create: `middleware/auth.js`
- Create: `middleware/requireAdmin.js`

- [ ] **Step 1: Create middleware directory**

```bash
mkdir -p /Users/kkondoju/projects/health-dashboard/middleware
```

- [ ] **Step 2: Write `middleware/auth.js`**

```js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.cookies && req.cookies.health_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
```

- [ ] **Step 3: Write `middleware/requireAdmin.js`**

```js
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { requireAdmin };
```

- [ ] **Step 4: Verify middleware loads**

```bash
JWT_SECRET=test node -e "
  const { verifyToken } = require('./middleware/auth');
  const { requireAdmin } = require('./middleware/requireAdmin');
  console.log('✅ middleware ok');
"
```

Expected: `✅ middleware ok`

- [ ] **Step 5: Commit**

```bash
git add middleware/auth.js middleware/requireAdmin.js
git commit -m "feat: add verifyToken and requireAdmin middleware

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Auth routes (register, login, logout, /me)

**Files:**
- Create: `routes/auth.js`

- [ ] **Step 1: Create routes directory**

```bash
mkdir -p /Users/kkondoju/projects/health-dashboard/routes
```

- [ ] **Step 2: Write `routes/auth.js`**

```js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, try again in 15 minutes' }
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts, try again in 15 minutes' }
});

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
};

router.post('/register', registerLimiter, async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, name, isApproved: false });
    res.status(201).json({ message: 'Registration successful. Your account is awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.isApproved) return res.status(403).json({ error: 'Your account is awaiting admin approval.' });
    await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('health_token', token, COOKIE_OPTS);
    res.json({ name: user.name, role: user.role, profile: user.profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('health_token', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Logged out' });
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user || !user.isApproved) return res.status(401).json({ error: 'Not authenticated' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 3: Verify route file loads**

```bash
JWT_SECRET=test node -e "require('./routes/auth'); console.log('✅ auth routes ok')"
```

Expected: `✅ auth routes ok`

- [ ] **Step 4: Commit**

```bash
git add routes/auth.js
git commit -m "feat: add auth routes (register, login, logout, /me) with rate limiting

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Logs routes (extracted and auth-scoped)

**Files:**
- Create: `routes/logs.js`

- [ ] **Step 1: Write `routes/logs.js`**

```js
const express = require('express');
const HealthLog = require('../models/HealthLog');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/:date', async (req, res) => {
  try {
    let log = await HealthLog.findOne({ userId: req.user.userId, date: req.params.date });
    if (!log) {
      log = new HealthLog({ userId: req.user.userId, date: req.params.date });
      await log.save();
    }
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { date, checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes } = req.body;
  try {
    const log = await HealthLog.findOneAndUpdate(
      { userId: req.user.userId, date },
      { checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/weight-history', async (req, res) => {
  try {
    const logs = await HealthLog.find({ userId: req.user.userId, weight: { $gt: 0 } })
      .sort({ date: 1 }).select('date weight -_id');
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/data/stats', async (req, res) => {
  try {
    const last30 = await HealthLog.find({ userId: req.user.userId })
      .sort({ date: -1 }).limit(30).select('date weight waterIntake completedWorkout checklist');
    const allWeights = last30.filter(l => l.weight > 0).map(l => l.weight);
    const currentWeight = allWeights[0] || 0;
    const startWeight = allWeights[allWeights.length - 1] || 0;
    let workoutStreak = 0, waterStreak = 0;
    for (const log of last30) { if (log.completedWorkout) workoutStreak++; else break; }
    for (const log of last30) { if (log.waterIntake >= 3) waterStreak++; else break; }
    const completionRates = last30.map(l =>
      l.checklist.length ? (l.checklist.filter(c => c.done).length / l.checklist.length) * 100 : 0
    );
    const avgCompletion = completionRates.length
      ? completionRates.reduce((s, v) => s + v, 0) / completionRates.length : 0;
    res.json({
      currentWeight, startWeight,
      weightLost: parseFloat((startWeight - currentWeight).toFixed(1)),
      workoutStreak, waterStreak,
      avgCompletion: parseFloat(avgCompletion.toFixed(0)),
      totalDaysLogged: last30.length
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

- [ ] **Step 2: Verify loads**

```bash
JWT_SECRET=test node -e "require('./routes/logs'); console.log('✅ logs routes ok')"
```

- [ ] **Step 3: Commit**

```bash
git add routes/logs.js
git commit -m "feat: add auth-scoped logs routes (GET/:date, POST, weight-history, stats)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Admin routes

**Files:**
- Create: `routes/admin.js`

- [ ] **Step 1: Write `routes/admin.js`**

```js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const HealthLog = require('../models/HealthLog');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();
router.use(verifyToken, requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    const counts = await HealthLog.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });
    const result = users.map(u => ({
      ...u.toObject(),
      logCount: countMap[u._id.toString()] || 0
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/users/:id/approve', async (req, res) => {
  try {
    const { approved } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: approved !== false },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/users', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email, passwordHash, name,
      role: role === 'admin' ? 'admin' : 'user',
      isApproved: true
    });
    res.status(201).json({ _id: user._id, email: user.email, name: user.name, role: user.role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    await HealthLog.deleteMany({ userId: req.params.id });
    res.json({ message: 'User and their data deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/users/:id/password', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(req.params.id, { passwordHash }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

- [ ] **Step 2: Verify loads**

```bash
JWT_SECRET=test node -e "require('./routes/admin'); console.log('✅ admin routes ok')"
```

- [ ] **Step 3: Commit**

```bash
git add routes/admin.js
git commit -m "feat: add admin routes (list/approve/create/delete/reset-password users)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: Breathing routes

**Files:**
- Create: `routes/breathing.js`

- [ ] **Step 1: Write `routes/breathing.js`**

```js
const express = require('express');
const BreathingSession = require('../models/BreathingSession');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.post('/sessions', async (req, res) => {
  const { technique, durationSeconds, cyclesCompleted, moodBefore, moodAfter } = req.body;
  if (!technique) return res.status(400).json({ error: 'technique is required' });
  try {
    const session = await BreathingSession.create({
      userId: req.user.userId,
      technique, durationSeconds, cyclesCompleted, moodBefore, moodAfter
    });
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await BreathingSession.find({ userId: req.user.userId })
      .sort({ completedAt: -1 }).limit(30);
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

- [ ] **Step 2: Create `routes/checklist.js`**

```js
const express = require('express');
const ChecklistItem = require('../models/ChecklistItem');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

const DEFAULT_ITEMS = [
  '8 hours of sleep',
  '30 min walk or exercise',
  'Drink 2L+ water',
  'Take morning medication',
  'Eat a healthy breakfast',
  'Avoid processed food',
  'Mindful eating (no screens during meals)',
  '10 min stretching or breathing'
];

router.get('/items', async (req, res) => {
  try {
    let items = await ChecklistItem.find({ userId: req.user.userId, isActive: true }).sort({ order: 1 });
    if (items.length === 0) {
      // Seed default items on first call
      const docs = DEFAULT_ITEMS.map((label, i) => ({
        userId: req.user.userId, label, order: i, isActive: true
      }));
      items = await ChecklistItem.insertMany(docs);
    }
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/items', async (req, res) => {
  const { label, order } = req.body;
  if (!label) return res.status(400).json({ error: 'label is required' });
  try {
    const item = await ChecklistItem.create({ userId: req.user.userId, label, order: order || 0 });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/items/:id', async (req, res) => {
  try {
    const item = await ChecklistItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/items/:id', async (req, res) => {
  try {
    const item = await ChecklistItem.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

- [ ] **Step 3: Verify both load**

```bash
JWT_SECRET=test node -e "require('./routes/breathing'); require('./routes/checklist'); console.log('✅ breathing + checklist routes ok')"
```

- [ ] **Step 4: Commit**

```bash
git add routes/breathing.js routes/checklist.js
git commit -m "feat: add breathing session routes and per-user checklist routes

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 9: Rewrite server.js — mount all routes, remove inline handlers

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Replace `server.js` entirely**

```js
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not set — refusing to start');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthDB';
let dbConnected = false;

mongoose.connect(mongoURI)
  .then(() => { console.log('✅ MongoDB Connected'); dbConnected = true; })
  .catch(err => console.warn('⚠️  MongoDB offline:', err.message));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: dbConnected ? 'connected' : 'offline', port: PORT });
});

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/logs',      require('./routes/logs'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/breathing', require('./routes/breathing'));
app.use('/api/checklist', require('./routes/checklist'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Health Engine → http://${HOST}:${PORT}`);
});
```

- [ ] **Step 2: Verify server starts (requires JWT_SECRET)**

```bash
JWT_SECRET=testsecret123 MONGODB_URI=mongodb://localhost:27017/healthDB node server.js &
sleep 2
curl -s http://localhost:3000/api/health
kill %1
```

Expected: `{"status":"ok","db":"offline","port":3000}` (or "connected" if Mongo is running locally)

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat: rewrite server.js — mount all route modules, remove inline handlers

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 10: Seed and migration scripts

**Files:**
- Create: `scripts/seed-admin.js`
- Create: `scripts/migrate-logs.js`

- [ ] **Step 1: Create scripts directory**

```bash
mkdir -p /Users/kkondoju/projects/health-dashboard/scripts
```

- [ ] **Step 2: Write `scripts/seed-admin.js`**

```js
#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const User = require('../models/User');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthDB';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  const email = await ask('Admin email: ');
  const name  = await ask('Admin name: ');
  const password = await ask('Admin password (min 8 chars): ');
  rl.close();

  if (password.length < 8) { console.error('❌ Password too short'); process.exit(1); }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('⚠️  User already exists. Promoting to admin...');
    await User.findByIdAndUpdate(existing._id, { role: 'admin', isApproved: true });
    console.log('✅ User promoted to admin');
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ email, name, passwordHash, role: 'admin', isApproved: true });
    console.log('✅ Admin account created');
  }
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 3: Write `scripts/migrate-logs.js`**

```js
#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

const User = require('../models/User');
const HealthLog = require('../models/HealthLog');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthDB';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  const email = await ask('Admin email to attribute existing logs to: ');
  rl.close();

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) { console.error('❌ User not found'); process.exit(1); }

  // Count orphaned logs (no userId)
  const orphaned = await HealthLog.countDocuments({ userId: { $exists: false } });
  console.log(`Found ${orphaned} logs without userId`);

  if (orphaned === 0) { console.log('✅ Nothing to migrate'); await mongoose.disconnect(); return; }

  const result = await HealthLog.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: user._id } }
  );

  console.log(`✅ Attributed ${result.modifiedCount} logs to ${user.email}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 4: Add npm scripts to package.json**

In `package.json`, update the `scripts` field:

```json
"scripts": {
  "start": "node server.js",
  "seed:admin": "node scripts/seed-admin.js",
  "migrate:logs": "node scripts/migrate-logs.js"
}
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-admin.js scripts/migrate-logs.js package.json
git commit -m "feat: add seed-admin and migrate-logs scripts

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 11: Frontend — api.js and auth.js modules

**Files:**
- Create: `public/js/api.js`
- Create: `public/js/auth.js`

- [ ] **Step 1: Create `public/js/` directory**

```bash
mkdir -p /Users/kkondoju/projects/health-dashboard/public/js
```

- [ ] **Step 2: Write `public/js/api.js`**

```js
// Centralised fetch wrapper — attaches credentials for httpOnly cookie
async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (res.status === 401) {
    window.location.href = '/login.html';
    return null;
  }
  return res;
}
```

- [ ] **Step 3: Write `public/js/auth.js`**

```js
// Runs on every page load for index.html — redirects to login if not authenticated
let currentUser = null;

async function initAuth() {
  const res = await apiFetch('/api/auth/me');
  if (!res) return; // apiFetch handles redirect on 401
  if (!res.ok) { window.location.href = '/login.html'; return; }
  currentUser = await res.json();
  // Personalise sidebar
  const logoP = document.querySelector('.sidebar-logo p');
  if (logoP) {
    const age = currentUser.profile && currentUser.profile.age ? ` · ${currentUser.profile.age}yr` : '';
    const height = currentUser.profile && currentUser.profile.heightCm ? ` · ${currentUser.profile.heightCm}cm` : '';
    logoP.textContent = `${currentUser.name}${age}${height}`;
  }
  // Add logout button to sidebar footer
  const footer = document.querySelector('.sidebar-footer');
  if (footer) {
    footer.innerHTML = `
      <div style="margin-bottom:8px;font-size:.78rem;color:rgba(255,255,255,.5)">
        Signed in as ${currentUser.email}
      </div>
      <button onclick="logout()" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:.78rem;width:100%">
        🚪 Sign Out
      </button>
    `;
  }
  return currentUser;
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

// Get phase from profile startDate (falls back to Phase 1, Week 1)
function getUserPhaseIndex() {
  if (!currentUser || !currentUser.profile || !currentUser.profile.startDate) return 0;
  const start = new Date(currentUser.profile.startDate);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  const weekNum = Math.floor(diffDays / 7);
  if (weekNum < 8) return 0;
  if (weekNum < 16) return 1;
  return 2;
}

function getUserMonthIndex() {
  if (!currentUser || !currentUser.profile || !currentUser.profile.startDate) return 0;
  const start = new Date(currentUser.profile.startDate);
  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  return Math.min(5, Math.floor(diffDays / 30));
}
```

- [ ] **Step 4: Commit**

```bash
git add public/js/api.js public/js/auth.js
git commit -m "feat: add api.js fetch wrapper and auth.js page-load auth check + sidebar personalisation

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 12: Create login.html

**Files:**
- Create: `public/login.html`

- [ ] **Step 1: Write `public/login.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Health Engine — Sign In</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Inter",sans-serif;background:#f0f4f0;min-height:100vh;display:flex;align-items:center;justify-content:center}
.login-card{background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);padding:40px;width:100%;max-width:400px}
.login-logo{text-align:center;margin-bottom:32px}
.login-logo h1{font-size:1.4rem;font-weight:800;color:#1b4332}
.login-logo p{font-size:.82rem;color:#718096;margin-top:4px}
.tabs{display:flex;border-bottom:2px solid #e2e8f0;margin-bottom:24px}
.tab{flex:1;padding:10px;text-align:center;cursor:pointer;font-size:.88rem;font-weight:600;color:#718096;transition:.2s}
.tab.active{color:#1b4332;border-bottom:2px solid #1b4332;margin-bottom:-2px}
.form-group{margin-bottom:16px}
.form-group label{display:block;font-size:.82rem;font-weight:600;color:#4a5568;margin-bottom:6px}
.form-group input{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:.9rem;outline:none;transition:.2s}
.form-group input:focus{border-color:#1b4332}
.btn-submit{width:100%;padding:12px;background:#1b4332;color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;margin-top:8px;transition:.2s}
.btn-submit:hover{background:#2d6a4f}
.error-msg{background:#fff5f5;border:1px solid #fecaca;color:#991b1b;padding:10px 14px;border-radius:8px;font-size:.82rem;margin-top:12px;display:none}
.success-msg{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:10px 14px;border-radius:8px;font-size:.82rem;margin-top:12px;display:none}
</style>
</head>
<body>
<div class="login-card">
  <div class="login-logo">
    <h1>⚡ Health Engine</h1>
    <p>Your personal health tracker</p>
  </div>
  <div class="tabs">
    <div class="tab active" id="tab-login" onclick="switchTab('login')">Sign In</div>
    <div class="tab" id="tab-register" onclick="switchTab('register')">Register</div>
  </div>

  <!-- LOGIN FORM -->
  <div id="form-login">
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="login-email" placeholder="you@example.com">
    </div>
    <div class="form-group">
      <label>Password</label>
      <input type="password" id="login-password" placeholder="••••••••">
    </div>
    <button class="btn-submit" onclick="doLogin()">Sign In</button>
    <div class="error-msg" id="login-error"></div>
  </div>

  <!-- REGISTER FORM -->
  <div id="form-register" style="display:none">
    <div class="form-group">
      <label>Full Name</label>
      <input type="text" id="reg-name" placeholder="Your name">
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="reg-email" placeholder="you@example.com">
    </div>
    <div class="form-group">
      <label>Password (min 8 characters)</label>
      <input type="password" id="reg-password" placeholder="••••••••">
    </div>
    <button class="btn-submit" onclick="doRegister()">Request Access</button>
    <div class="error-msg" id="reg-error"></div>
    <div class="success-msg" id="reg-success"></div>
  </div>
</div>

<script>
function switchTab(tab) {
  document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; errEl.style.display = 'block'; return; }
    window.location.href = data.role === 'admin' ? '/index.html' : '/index.html';
  } catch (e) {
    errEl.textContent = 'Connection error. Please try again.';
    errEl.style.display = 'block';
  }
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('reg-error');
  const sucEl = document.getElementById('reg-success');
  errEl.style.display = 'none'; sucEl.style.display = 'none';
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; errEl.style.display = 'block'; return; }
    sucEl.textContent = data.message;
    sucEl.style.display = 'block';
  } catch (e) {
    errEl.textContent = 'Connection error. Please try again.';
    errEl.style.display = 'block';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const active = document.getElementById('form-login').style.display !== 'none';
    if (active) doLogin(); else doRegister();
  }
});

// If already logged in, redirect to app
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => { if (r.ok) window.location.href = '/index.html'; })
  .catch(() => {});
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add public/login.html
git commit -m "feat: add login.html with sign-in and registration forms

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 13: Create admin.html

**Files:**
- Create: `public/admin.html`

- [ ] **Step 1: Write `public/admin.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Health Engine — Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Inter",sans-serif;background:#f0f4f0;color:#1a1a2e;min-height:100vh}
.topbar{background:#1b4332;color:#fff;padding:14px 28px;display:flex;align-items:center;justify-content:space-between}
.topbar h1{font-size:1rem;font-weight:700}
.topbar-right{display:flex;gap:12px;align-items:center;font-size:.82rem}
.content{padding:28px;max-width:1100px;margin:0 auto}
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
.stat-card{background:#fff;border-radius:10px;padding:16px 20px;box-shadow:0 2px 8px rgba(0,0,0,.08);border-left:4px solid #1b4332}
.stat-card .s-val{font-size:1.6rem;font-weight:800;color:#1b4332}
.stat-card .s-lbl{font-size:.75rem;color:#718096;margin-top:2px;text-transform:uppercase;letter-spacing:.5px}
.section-title{font-size:1rem;font-weight:700;color:#1b4332;margin:0 0 14px}
.card{background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:20px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:.83rem}
th{background:#f8fafb;padding:10px 12px;text-align:left;font-weight:700;color:#1b4332;border-bottom:2px solid #e2e8f0;font-size:.78rem;text-transform:uppercase;letter-spacing:.5px}
td{padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#4a5568;vertical-align:middle}
tr:hover td{background:#f8fafb}
.badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:.72rem;font-weight:700}
.badge.pending{background:#fef3c7;color:#92400e}
.badge.approved{background:#d1fae5;color:#065f46}
.badge.admin{background:#dbeafe;color:#1e40af}
.btn{padding:6px 12px;border-radius:6px;border:none;cursor:pointer;font-family:inherit;font-size:.78rem;font-weight:600;transition:.2s}
.btn-green{background:#d1fae5;color:#065f46}.btn-green:hover{background:#a7f3d0}
.btn-red{background:#fee2e2;color:#991b1b}.btn-red:hover{background:#fecaca}
.btn-blue{background:#dbeafe;color:#1e40af}.btn-blue:hover{background:#bfdbfe}
.btn-primary{background:#1b4332;color:#fff;padding:9px 18px;font-size:.85rem}.btn-primary:hover{background:#2d6a4f}
.form-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:12px}
.form-group{display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px}
.form-group label{font-size:.78rem;font-weight:600;color:#4a5568}
.form-group input, .form-group select{padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:6px;font-family:inherit;font-size:.85rem;outline:none}
.form-group input:focus, .form-group select:focus{border-color:#1b4332}
.msg{padding:10px 14px;border-radius:6px;font-size:.82rem;margin-bottom:12px;display:none}
.msg.success{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534}
.msg.error{background:#fff5f5;border:1px solid #fecaca;color:#991b1b}
</style>
</head>
<body>
<div class="topbar">
  <h1>⚡ Health Engine — Admin Panel</h1>
  <div class="topbar-right">
    <a href="/index.html" style="color:rgba(255,255,255,.7);text-decoration:none">← Back to App</a>
    <button onclick="logout()" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:.78rem">Sign Out</button>
  </div>
</div>

<div class="content">
  <!-- Stats Strip -->
  <div class="stat-row">
    <div class="stat-card"><div class="s-val" id="stat-total">—</div><div class="s-lbl">Total Users</div></div>
    <div class="stat-card" style="border-left-color:#f59e0b"><div class="s-val" id="stat-pending">—</div><div class="s-lbl">Pending Approval</div></div>
    <div class="stat-card" style="border-left-color:#10b981"><div class="s-val" id="stat-active">—</div><div class="s-lbl">Active (7 days)</div></div>
  </div>

  <!-- Pending Approvals -->
  <div class="card" id="pending-card">
    <div class="section-title">⏳ Pending Approvals</div>
    <div id="msg-pending" class="msg"></div>
    <div id="pending-table-wrap"><p style="color:#718096;font-size:.85rem">Loading...</p></div>
  </div>

  <!-- All Users -->
  <div class="card">
    <div class="section-title">👥 All Users</div>
    <div id="msg-users" class="msg"></div>
    <div id="users-table-wrap"><p style="color:#718096;font-size:.85rem">Loading...</p></div>
  </div>

  <!-- Add User -->
  <div class="card">
    <div class="section-title">➕ Add User</div>
    <div id="msg-add" class="msg"></div>
    <div class="form-row">
      <div class="form-group"><label>Full Name</label><input type="text" id="add-name" placeholder="Name"></div>
      <div class="form-group"><label>Email</label><input type="email" id="add-email" placeholder="email@example.com"></div>
      <div class="form-group"><label>Password</label><input type="password" id="add-password" placeholder="min 8 chars"></div>
      <div class="form-group" style="max-width:120px"><label>Role</label>
        <select id="add-role"><option value="user">User</option><option value="admin">Admin</option></select>
      </div>
      <div class="form-group" style="flex:0"><label>&nbsp;</label><button class="btn btn-primary" onclick="addUser()">Add User</button></div>
    </div>
  </div>
</div>

<script>
async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (res.status === 401 || res.status === 403) { window.location.href = '/login.html'; return null; }
  return res;
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  el.className = 'msg ' + type;
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

let allUsers = [];

async function loadUsers() {
  const res = await apiFetch('/api/admin/users');
  if (!res) return;
  allUsers = await res.json();
  const pending = allUsers.filter(u => !u.isApproved);
  const approved = allUsers.filter(u => u.isApproved);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeCount = approved.filter(u => u.lastActiveAt && new Date(u.lastActiveAt) > sevenDaysAgo).length;

  document.getElementById('stat-total').textContent = allUsers.length;
  document.getElementById('stat-pending').textContent = pending.length;
  document.getElementById('stat-active').textContent = activeCount;

  // Pending table
  if (pending.length === 0) {
    document.getElementById('pending-table-wrap').innerHTML = '<p style="color:#718096;font-size:.85rem">No pending approvals</p>';
  } else {
    document.getElementById('pending-table-wrap').innerHTML = `
      <table><thead><tr><th>Name</th><th>Email</th><th>Registered</th><th>Actions</th></tr></thead>
      <tbody>${pending.map(u => `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
          <td style="display:flex;gap:6px">
            <button class="btn btn-green" onclick="approveUser('${u._id}', true)">✅ Approve</button>
            <button class="btn btn-red" onclick="deleteUser('${u._id}', '${u.name}')">❌ Reject</button>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  // All users table
  document.getElementById('users-table-wrap').innerHTML = `
    <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Active</th><th>Logs</th><th>Actions</th></tr></thead>
    <tbody>${allUsers.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role}">${u.role}</span></td>
        <td><span class="badge ${u.isApproved ? 'approved' : 'pending'}">${u.isApproved ? 'Active' : 'Pending'}</span></td>
        <td>${u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}</td>
        <td>${u.logCount || 0}</td>
        <td style="display:flex;gap:4px;flex-wrap:wrap">
          ${u.isApproved
            ? `<button class="btn btn-red" onclick="approveUser('${u._id}', false)">Deactivate</button>`
            : `<button class="btn btn-green" onclick="approveUser('${u._id}', true)">Approve</button>`}
          <button class="btn btn-blue" onclick="resetPassword('${u._id}')">Reset PW</button>
          <button class="btn btn-red" onclick="deleteUser('${u._id}', '${u.name}')">Delete</button>
        </td>
      </tr>`).join('')}
    </tbody></table>`;
}

async function approveUser(id, approved) {
  const res = await apiFetch(`/api/admin/users/${id}/approve`, {
    method: 'PATCH', body: { approved }
  });
  if (!res) return;
  if (res.ok) { showMsg('msg-users', 'success', approved ? 'User approved' : 'User deactivated'); loadUsers(); }
  else { const d = await res.json(); showMsg('msg-users', 'error', d.error); }
}

async function deleteUser(id, name) {
  if (!confirm(`Delete user "${name}" and all their data? This cannot be undone.`)) return;
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  if (!res) return;
  if (res.ok) { showMsg('msg-users', 'success', 'User deleted'); loadUsers(); }
  else { const d = await res.json(); showMsg('msg-users', 'error', d.error); }
}

async function resetPassword(id) {
  const password = prompt('Enter new password (min 8 characters):');
  if (!password) return;
  const res = await apiFetch(`/api/admin/users/${id}/password`, {
    method: 'PATCH', body: { password }
  });
  if (!res) return;
  if (res.ok) showMsg('msg-users', 'success', 'Password reset');
  else { const d = await res.json(); showMsg('msg-users', 'error', d.error); }
}

async function addUser() {
  const name = document.getElementById('add-name').value.trim();
  const email = document.getElementById('add-email').value.trim();
  const password = document.getElementById('add-password').value;
  const role = document.getElementById('add-role').value;
  const res = await apiFetch('/api/admin/users', { method: 'POST', body: { name, email, password, role } });
  if (!res) return;
  const data = await res.json();
  if (res.ok) {
    showMsg('msg-add', 'success', `User ${data.email} created`);
    document.getElementById('add-name').value = '';
    document.getElementById('add-email').value = '';
    document.getElementById('add-password').value = '';
    loadUsers();
  } else {
    showMsg('msg-add', 'error', data.error);
  }
}

// Check admin on load
(async () => {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) { window.location.href = '/login.html'; return; }
  const user = await res.json();
  if (user.role !== 'admin') { window.location.href = '/index.html'; return; }
  loadUsers();
})();
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add public/admin.html
git commit -m "feat: add admin.html user management panel

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 14: Extract JS data modules from index.html

Extract the large JS data arrays into separate files. This makes each section independently maintainable.

**Files:**
- Create: `public/js/diet.js` — `MONTHLY_DIET` array + diet render functions
- Create: `public/js/recipes.js` — `RECIPES` array + recipe render functions
- Create: `public/js/workout.js` — `WORKOUT_PLAN`, `PHASE_TASKS`, `WORKOUT_PHASES` + workout render functions
- Create: `public/js/cardio.js` — `CARDIO_TABLE`, `CARDIO_PHASES`, `HR_ZONES` + cardio render functions
- Create: `public/js/guidelines.js` — `SEEDS`, `SUPP_TIMING` + guidelines render functions
- Create: `public/js/grocery.js` — `GROCERY_PLAN` + grocery render functions
- Create: `public/js/progress.js` — `loadProgress`, `renderWeightChart`, `renderMilestones`, `renderStats`, `updateBMI`
- Create: `public/js/dashboard.js` — `buildTimeline`, `loadDateData`, `syncData`, `toggleWater`, `setScore`, `updateCheckStat`, `setGreeting`, `updateCalorieStat`

- [ ] **Step 1: Identify line boundaries for each block in index.html**

```bash
grep -n "^// ====\|^const MONTHLY_DIET\|^const GROCERY_PLAN\|^const RECIPES\|^const WORKOUT_PLAN\|^const PHASE_TASKS\|^const CARDIO_TABLE\|^const SEEDS\|^const SUPP_TIMING\|^function buildTimeline\|^function buildDiet\|^function buildRecipes\|^function buildWorkout\|^function buildCardio\|^function buildGuidelines\|^function buildGrocery\|^async function loadDateData\|^async function syncData\|^async function loadProgress\|^document.addEventListener" /Users/kkondoju/projects/health-dashboard/public/index.html
```

- [ ] **Step 2: Create `public/js/diet.js`**

Cut lines 793–2013 from `index.html` (the `MONTHLY_DIET` array and all diet functions: `buildDietPlan`, `selectDietMonth`, `renderDietWeekSelector`, `selectDietWeek`, `renderDietMonthView`, `renderDietDay`). Place them into `public/js/diet.js`.

Update `renderDietMonthView` and `renderDietDay` to use `getUserMonthIndex()` and `getUserPhaseIndex()` from `auth.js` instead of `getCurrentMonthIndex()` and `getPhaseIndex()`.

- [ ] **Step 3: Create `public/js/recipes.js`**

Cut lines 1299–2013 (the `RECIPES` array and `buildRecipes`, `filterRecipes`, `renderRecipes`, `toggleRecipe`). Place into `public/js/recipes.js`.

- [ ] **Step 4: Create `public/js/workout.js`**

Cut `PHASE_TASKS`, `WORKOUT_PHASES`, `WORKOUT_PLAN` data arrays and `buildWorkout`, `selectWorkoutMonth`, `renderWorkoutMonthBanner`, `renderWorkoutDayGrid`, `selectWorkoutDay`, `renderWorkoutDay`. Place into `public/js/workout.js`.

Update `getPhaseIndex()` calls → `getUserPhaseIndex()`.

- [ ] **Step 5: Create `public/js/cardio.js`**

Cut `CARDIO_TABLE`, `CARDIO_PHASES`, `HR_ZONES` and `buildCardio`. Place into `public/js/cardio.js`.

- [ ] **Step 6: Create `public/js/guidelines.js`**

Cut `SEEDS`, `SUPP_TIMING` and `buildGuidelines`. Place into `public/js/guidelines.js`.

- [ ] **Step 7: Create `public/js/grocery.js`**

Cut `GROCERY_PLAN` and `buildGrocery`, `selectGroceryMonth`, `renderGrocery`. Place into `public/js/grocery.js`.

- [ ] **Step 8: Create `public/js/progress.js`**

Cut `loadProgress`, `renderWeightChart`, `renderMilestones`, `renderStats`, `updateBMI`. Place into `public/js/progress.js`. Update all `fetch('/api/weight-history')` and `fetch('/api/stats')` calls to use `apiFetch('/api/logs/data/weight-history')` and `apiFetch('/api/logs/data/stats')`.

- [ ] **Step 9: Create `public/js/dashboard.js`**

Cut `buildTimeline`, `onCheckChange`, `updateCheckStat`, `toggleWater`, `setScore`, `loadDateData`, `syncData`, `loadFromLocal`, `updateCalorieStat`, `setGreeting` and state variables (`currentMoodScore`, `currentEnergyScore`, `waterLevel`). Place into `public/js/dashboard.js`.

Update `loadDateData`:
- Change `fetch('/api/logs/' + date)` → `apiFetch('/api/logs/' + date)`
- Remove `catch` block that calls `loadFromLocal` (localStorage fallback removed per spec)

Update `syncData`:
- Change `fetch('/api/logs', ...)` → `apiFetch('/api/logs', { method:'POST', body: payload })`
- Remove `localStorage.setItem(...)` line

Update `buildTimeline` to call `getUserPhaseIndex()` instead of `getPhaseIndex()`.

- [ ] **Step 10: Update the inline `<script>` block in `index.html`**

Replace the entire `<script>` block (lines 776–2862) with:

```html
<script src="/js/api.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/diet.js"></script>
<script src="/js/recipes.js"></script>
<script src="/js/workout.js"></script>
<script src="/js/cardio.js"></script>
<script src="/js/guidelines.js"></script>
<script src="/js/grocery.js"></script>
<script src="/js/progress.js"></script>
<script src="/js/dashboard.js"></script>
<script src="/js/breathing.js"></script>
<script>
// Navigation helpers
const pageTitles = {
  dashboard:"🏠 Dashboard", diet:"🥗 Diet Plan", recipes:"📖 Recipes",
  workout:"💪 Workout", cardio:"🏃 Cardio", progress:"📈 Progress",
  guidelines:"🛡️ Guidelines", grocery:"🛒 Grocery List", breathing:"🌬️ Breathing"
};

function showSection(id, el) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("sec-" + id).classList.add("active");
  document.getElementById("pageTitle").textContent = pageTitles[id] || id;
  if (el) el.classList.add("active");
  const bnItem = document.getElementById("bn-" + id);
  document.querySelectorAll(".bn-item").forEach(b => b.classList.remove("active"));
  if (bnItem) bnItem.classList.add("active");
  if (id === "progress") loadProgress();
}

function openSidebar() { document.getElementById("sidebar").classList.add("open"); document.getElementById("sidebarOverlay").classList.add("show"); }
function closeSidebar() { document.getElementById("sidebar").classList.remove("open"); document.getElementById("sidebarOverlay").classList.remove("show"); }
function toggleMoreMenu() { openSidebar(); }

// Touch swipe
(function() {
  let touchStartX = 0, touchStartY = 0;
  document.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, { passive:true });
  document.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx > 60 && touchStartX < 30) { openSidebar(); }
  }, { passive:true });
})();

document.addEventListener("DOMContentLoaded", async () => {
  await initAuth(); // auth check + sidebar personalisation
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("logDate").value = today;
  buildTimeline();
  updateCalorieStat();
  buildDietPlan();
  buildRecipes();
  buildWorkout();
  buildCardio();
  buildGrocery();
  buildGuidelines();
  setGreeting();
  loadProgress();
  updateBMI(currentUser && currentUser.profile && currentUser.profile.startWeightKg || 95);
  loadDateData();
});
</script>
```

- [ ] **Step 11: Update sidebar in index.html — remove hardcoded personal info, add breathing nav item**

In `index.html`, find the sidebar HTML (around line 386–405) and replace:

```html
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo">
    <h2>⚡ HEALTH ENGINE</h2>
    <p id="sidebar-user">Loading...</p>
  </div>
  <ul class="nav-list">
    <li class="nav-item active" onclick="showSection('dashboard',this)"><span class="nav-icon">🏠</span>Dashboard</li>
    <li class="nav-item" onclick="showSection('diet',this)"><span class="nav-icon">🥗</span>Diet Plan</li>
    <li class="nav-item" onclick="showSection('recipes',this)"><span class="nav-icon">📖</span>Recipes</li>
    <li class="nav-item" onclick="showSection('workout',this)"><span class="nav-icon">💪</span>Workout</li>
    <li class="nav-item" onclick="showSection('cardio',this)"><span class="nav-icon">🏃</span>Cardio</li>
    <li class="nav-item" onclick="showSection('progress',this)"><span class="nav-icon">📈</span>Progress</li>
    <li class="nav-item" onclick="showSection('guidelines',this)"><span class="nav-icon">🛡️</span>Guidelines</li>
    <li class="nav-item" onclick="showSection('grocery',this)"><span class="nav-icon">🛒</span>Grocery</li>
    <li class="nav-item" onclick="showSection('breathing',this)"><span class="nav-icon">🌬️</span>Breathing</li>
  </ul>
  <div class="sidebar-footer" id="sidebar-footer"></div>
</aside>
```

The `auth.js` `initAuth()` will populate `#sidebar-user` → `.sidebar-logo p` and `#sidebar-footer`.

- [ ] **Step 12: Commit**

```bash
git add public/js/ public/index.html
git commit -m "feat: extract all JS into public/js/ modules, remove localStorage fallback, wire auth

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 15: Add breathing exercises section to index.html + breathing.js

**Files:**
- Modify: `public/index.html` — add `<div id="sec-breathing">` section
- Create: `public/js/breathing.js`

- [ ] **Step 1: Add breathing section HTML to index.html**

Before the closing `</div><!-- end .content -->` tag (around line 774), insert:

```html
<!-- ===== BREATHING ===== -->
<div id="sec-breathing" class="section">
  <div class="section-header">
    <div><h2>Breathing Exercises</h2><p>Guided sessions · Timer · Session history</p></div>
  </div>

  <!-- Technique selection -->
  <div id="breathing-select">
    <div class="grid-2" style="margin-bottom:20px" id="technique-cards"></div>
    <div class="card" id="breathing-config" style="display:none">
      <div class="card-title" id="config-title">🌬️ Configure Session</div>
      <div style="margin-bottom:16px">
        <label style="font-size:.82rem;font-weight:600;color:var(--text-med)">Cycles</label>
        <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
          <button onclick="adjustCycles(-1)" class="btn btn-primary btn-sm">−</button>
          <span id="cycle-count" style="font-size:1.2rem;font-weight:800;min-width:32px;text-align:center">5</span>
          <button onclick="adjustCycles(1)" class="btn btn-primary btn-sm">+</button>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:.82rem;font-weight:600;color:var(--text-med)">How do you feel right now?</label>
        <div class="score-row" id="mood-before-row" style="margin-top:8px">
          <button class="score-btn" onclick="setMoodBefore(1,this)">😔 1</button>
          <button class="score-btn" onclick="setMoodBefore(2,this)">😕 2</button>
          <button class="score-btn sel" onclick="setMoodBefore(3,this)">😐 3</button>
          <button class="score-btn" onclick="setMoodBefore(4,this)">🙂 4</button>
          <button class="score-btn" onclick="setMoodBefore(5,this)">😄 5</button>
        </div>
      </div>
      <button class="btn btn-primary" onclick="startBreathingSession()">▶ Start Session</button>
      <button class="btn btn-sm" onclick="cancelBreathingConfig()" style="margin-left:10px;background:#f8f9fa;border:1px solid var(--border)">Cancel</button>
    </div>
  </div>

  <!-- Active session view -->
  <div id="breathing-session" style="display:none;text-align:center;padding:40px 20px">
    <div id="breath-circle" style="width:200px;height:200px;border-radius:50%;background:var(--primary);margin:0 auto 24px;display:flex;align-items:center;justify-content:center;transition:transform 0.5s ease;transform:scale(1)">
      <span id="breath-phase" style="color:#fff;font-size:1.1rem;font-weight:700">Ready</span>
    </div>
    <div id="breath-countdown" style="font-size:3rem;font-weight:800;color:var(--primary);margin-bottom:8px">—</div>
    <div id="breath-cycle-info" style="font-size:.9rem;color:var(--text-med);margin-bottom:24px">Round — of —</div>
    <button class="btn btn-sm" onclick="stopBreathingSession()" style="background:#fff5f5;border:1px solid #fecaca;color:#991b1b">Stop Session</button>
  </div>

  <!-- Completion view -->
  <div id="breathing-complete" style="display:none;text-align:center;padding:40px 20px">
    <div style="font-size:3rem;margin-bottom:16px">✅</div>
    <h3 style="color:var(--primary);margin-bottom:8px">Session Complete!</h3>
    <p id="complete-summary" style="color:var(--text-med);font-size:.88rem;margin-bottom:20px"></p>
    <label style="font-size:.82rem;font-weight:600;color:var(--text-med)">How do you feel now?</label>
    <div class="score-row" id="mood-after-row" style="justify-content:center;margin:10px 0 20px">
      <button class="score-btn" onclick="setMoodAfter(1,this)">😔 1</button>
      <button class="score-btn" onclick="setMoodAfter(2,this)">😕 2</button>
      <button class="score-btn sel" onclick="setMoodAfter(3,this)">😐 3</button>
      <button class="score-btn" onclick="setMoodAfter(4,this)">🙂 4</button>
      <button class="score-btn" onclick="setMoodAfter(5,this)">😄 5</button>
    </div>
    <button class="btn btn-primary" onclick="saveBreathingSession()">💾 Save Session</button>
    <button class="btn btn-sm" onclick="resetBreathing()" style="margin-left:10px;background:#f8f9fa;border:1px solid var(--border)">New Session</button>
  </div>

  <!-- Session history -->
  <div class="card" style="margin-top:24px">
    <div class="card-title">📜 Recent Sessions</div>
    <div id="breathing-history"><p style="color:var(--text-light);font-size:.85rem">Loading...</p></div>
  </div>
</div>
```

- [ ] **Step 2: Write `public/js/breathing.js`**

```js
const TECHNIQUES = {
  box: {
    name: 'Box Breathing', icon: '⬜', color: '#3b82f6',
    description: 'Stress relief & focus. Inhale, hold, exhale, hold — equal counts.',
    use: 'Stress, focus, pre-meeting',
    phases: [
      { label: 'Inhale', duration: 4, scale: 1.4 },
      { label: 'Hold',   duration: 4, scale: 1.4 },
      { label: 'Exhale', duration: 4, scale: 1.0 },
      { label: 'Hold',   duration: 4, scale: 1.0 }
    ]
  },
  '4-7-8': {
    name: '4-7-8 Breathing', icon: '💤', color: '#8b5cf6',
    description: 'Activates parasympathetic nervous system. Ideal before sleep.',
    use: 'Sleep, anxiety, calming',
    phases: [
      { label: 'Inhale', duration: 4, scale: 1.4 },
      { label: 'Hold',   duration: 7, scale: 1.4 },
      { label: 'Exhale', duration: 8, scale: 1.0 }
    ]
  },
  'wim-hof': {
    name: 'Wim Hof Method', icon: '❄️', color: '#06b6d4',
    description: '30 deep power breaths, then extended exhale hold.',
    use: 'Energy boost, cold exposure prep',
    phases: [
      { label: 'Power Inhale', duration: 2, scale: 1.5 },
      { label: 'Exhale',       duration: 2, scale: 1.0 },
    ]
  },
  diaphragmatic: {
    name: 'Diaphragmatic', icon: '🫁', color: '#10b981',
    description: 'Deep belly breathing. Reduces cortisol, improves oxygen flow.',
    use: 'Relaxation, daily practice',
    phases: [
      { label: 'Belly Inhale', duration: 4, scale: 1.4 },
      { label: 'Exhale',       duration: 6, scale: 1.0 }
    ]
  }
};

let breathState = {
  technique: null,
  cycles: 5,
  moodBefore: 3,
  moodAfter: 3,
  currentCycle: 0,
  currentPhase: 0,
  countdown: 0,
  timer: null,
  startedAt: null,
  durationSeconds: 0
};

function buildBreathingSection() {
  const cards = document.getElementById('technique-cards');
  if (!cards) return;
  cards.innerHTML = Object.entries(TECHNIQUES).map(([key, t]) => `
    <div class="card" style="cursor:pointer;border-top-color:${t.color}" onclick="selectTechnique('${key}')">
      <div class="card-title" style="color:${t.color}">${t.icon} ${t.name}</div>
      <p style="font-size:.82rem;color:var(--text-med);margin-bottom:8px">${t.description}</p>
      <div style="font-size:.75rem;color:var(--text-light)">Best for: ${t.use}</div>
    </div>`).join('');
  loadBreathingHistory();
}

function selectTechnique(key) {
  breathState.technique = key;
  const t = TECHNIQUES[key];
  document.getElementById('config-title').textContent = `${t.icon} ${t.name}`;
  document.getElementById('breathing-config').style.display = 'block';
  document.getElementById('breathing-config').scrollIntoView({ behavior: 'smooth' });
}

function cancelBreathingConfig() {
  breathState.technique = null;
  document.getElementById('breathing-config').style.display = 'none';
}

function adjustCycles(delta) {
  breathState.cycles = Math.max(1, Math.min(30, breathState.cycles + delta));
  document.getElementById('cycle-count').textContent = breathState.cycles;
}

function setMoodBefore(val, btn) {
  breathState.moodBefore = val;
  document.querySelectorAll('#mood-before-row .score-btn').forEach((b, i) => b.classList.toggle('sel', i + 1 === val));
}

function setMoodAfter(val, btn) {
  breathState.moodAfter = val;
  document.querySelectorAll('#mood-after-row .score-btn').forEach((b, i) => b.classList.toggle('sel', i + 1 === val));
}

function startBreathingSession() {
  document.getElementById('breathing-config').style.display = 'none';
  document.getElementById('breathing-session').style.display = 'block';
  breathState.currentCycle = 0;
  breathState.currentPhase = 0;
  breathState.startedAt = Date.now();
  runPhase();
}

function runPhase() {
  const t = TECHNIQUES[breathState.technique];
  const phase = t.phases[breathState.currentPhase];
  breathState.countdown = phase.duration;

  const circle = document.getElementById('breath-circle');
  circle.style.transform = `scale(${phase.scale})`;
  document.getElementById('breath-phase').textContent = phase.label;
  document.getElementById('breath-cycle-info').textContent =
    `Round ${breathState.currentCycle + 1} of ${breathState.cycles}`;

  breathState.timer = setInterval(() => {
    document.getElementById('breath-countdown').textContent = breathState.countdown;
    breathState.countdown--;
    if (breathState.countdown < 0) {
      clearInterval(breathState.timer);
      nextPhase();
    }
  }, 1000);
}

function nextPhase() {
  const t = TECHNIQUES[breathState.technique];
  breathState.currentPhase++;
  if (breathState.currentPhase >= t.phases.length) {
    breathState.currentPhase = 0;
    breathState.currentCycle++;
    if (breathState.currentCycle >= breathState.cycles) {
      completeSession();
      return;
    }
  }
  runPhase();
}

function stopBreathingSession() {
  clearInterval(breathState.timer);
  breathState.durationSeconds = Math.floor((Date.now() - breathState.startedAt) / 1000);
  document.getElementById('breathing-session').style.display = 'none';
  showCompletion();
}

function completeSession() {
  breathState.durationSeconds = Math.floor((Date.now() - breathState.startedAt) / 1000);
  document.getElementById('breath-countdown').textContent = '✓';
  document.getElementById('breath-phase').textContent = 'Done!';
  setTimeout(() => {
    document.getElementById('breathing-session').style.display = 'none';
    showCompletion();
  }, 1200);
}

function showCompletion() {
  const t = TECHNIQUES[breathState.technique];
  const mins = Math.floor(breathState.durationSeconds / 60);
  const secs = breathState.durationSeconds % 60;
  document.getElementById('complete-summary').textContent =
    `${t.name} · ${breathState.currentCycle} cycle${breathState.currentCycle !== 1 ? 's' : ''} · ${mins}m ${secs}s`;
  document.getElementById('breathing-complete').style.display = 'block';
}

async function saveBreathingSession() {
  const res = await apiFetch('/api/breathing/sessions', {
    method: 'POST',
    body: {
      technique: breathState.technique,
      durationSeconds: breathState.durationSeconds,
      cyclesCompleted: breathState.currentCycle,
      moodBefore: breathState.moodBefore,
      moodAfter: breathState.moodAfter
    }
  });
  if (res && res.ok) {
    resetBreathing();
    loadBreathingHistory();
  }
}

function resetBreathing() {
  clearInterval(breathState.timer);
  breathState = { technique: null, cycles: 5, moodBefore: 3, moodAfter: 3, currentCycle: 0, currentPhase: 0, countdown: 0, timer: null, startedAt: null, durationSeconds: 0 };
  document.getElementById('breathing-complete').style.display = 'none';
  document.getElementById('breathing-session').style.display = 'none';
  document.getElementById('breathing-config').style.display = 'none';
  document.getElementById('cycle-count').textContent = '5';
}

async function loadBreathingHistory() {
  const res = await apiFetch('/api/breathing/sessions');
  if (!res || !res.ok) return;
  const sessions = await res.json();
  const el = document.getElementById('breathing-history');
  if (sessions.length === 0) {
    el.innerHTML = '<p style="color:var(--text-light);font-size:.85rem">No sessions yet. Start your first one above.</p>';
    return;
  }
  const thisWeek = sessions.filter(s => {
    const d = new Date(s.completedAt);
    return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });
  const avgMoodImprove = sessions.filter(s => s.moodBefore && s.moodAfter)
    .reduce((acc, s) => acc + (s.moodAfter - s.moodBefore), 0) /
    (sessions.filter(s => s.moodBefore && s.moodAfter).length || 1);

  el.innerHTML = `
    <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap">
      <div class="stat-chip" style="border-left-color:var(--info);flex:1;min-width:120px">
        <div class="label">This Week</div>
        <div class="value">${thisWeek.length}</div>
        <div class="sub">sessions</div>
      </div>
      <div class="stat-chip" style="border-left-color:var(--success);flex:1;min-width:120px">
        <div class="label">Avg Mood Lift</div>
        <div class="value">${avgMoodImprove >= 0 ? '+' : ''}${avgMoodImprove.toFixed(1)}</div>
        <div class="sub">mood score delta</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:.82rem">
      <thead><tr style="background:#f8fafb">
        <th style="padding:8px 10px;text-align:left;color:var(--primary);font-size:.76rem;border-bottom:2px solid var(--border)">Date</th>
        <th style="padding:8px 10px;text-align:left;color:var(--primary);font-size:.76rem;border-bottom:2px solid var(--border)">Technique</th>
        <th style="padding:8px 10px;text-align:left;color:var(--primary);font-size:.76rem;border-bottom:2px solid var(--border)">Duration</th>
        <th style="padding:8px 10px;text-align:left;color:var(--primary);font-size:.76rem;border-bottom:2px solid var(--border)">Mood</th>
      </tr></thead>
      <tbody>${sessions.map(s => {
        const t = TECHNIQUES[s.technique] || {};
        const mins = Math.floor((s.durationSeconds || 0) / 60);
        const secs = (s.durationSeconds || 0) % 60;
        const moodDelta = s.moodBefore && s.moodAfter ? s.moodAfter - s.moodBefore : null;
        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid var(--border)">${new Date(s.completedAt).toLocaleDateString()}</td>
          <td style="padding:8px 10px;border-bottom:1px solid var(--border)">${t.icon || ''} ${t.name || s.technique}</td>
          <td style="padding:8px 10px;border-bottom:1px solid var(--border)">${mins}m ${secs}s · ${s.cyclesCompleted} cycles</td>
          <td style="padding:8px 10px;border-bottom:1px solid var(--border)">${s.moodBefore || '—'} → ${s.moodAfter || '—'}${moodDelta !== null ? ` <span style="color:${moodDelta > 0 ? '#166534' : moodDelta < 0 ? '#991b1b' : '#718096'}">(${moodDelta > 0 ? '+' : ''}${moodDelta})</span>` : ''}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}
```

- [ ] **Step 3: Add `buildBreathingSection()` to the DOMContentLoaded block in index.html**

In the DOMContentLoaded handler, add:
```js
buildBreathingSection();
```

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/js/breathing.js
git commit -m "feat: add breathing exercises section with guided timer, mood tracking and session history

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 16: End-to-end smoke test (local)

- [ ] **Step 1: Start server locally**

```bash
cd /Users/kkondoju/projects/health-dashboard
JWT_SECRET=localtestsecret123 node server.js &
```

Expected: `🚀 Health Engine → http://0.0.0.0:3000`

- [ ] **Step 2: Test registration**

```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Expected: `{"message":"Registration successful. Your account is awaiting admin approval."}`

- [ ] **Step 3: Test login attempt before approval**

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected: `{"error":"Your account is awaiting admin approval."}`

- [ ] **Step 4: Open browser and verify redirect to login.html**

```
http://localhost:3000/
```

Expected: Redirected to `/login.html` (the auth.js `initAuth()` call fails → redirect).

- [ ] **Step 5: Verify `/api/health` still works unauthenticated**

```bash
curl -s http://localhost:3000/api/health
```

Expected: `{"status":"ok","db":"offline","port":3000}`

- [ ] **Step 6: Stop local server**

```bash
kill %1
```

- [ ] **Step 7: Commit any final fixes**

```bash
git add -A
git commit -m "fix: post-integration fixes from smoke test" --allow-empty
```

---

## Task 17: Push to GitHub (triggers Azure deploy)

- [ ] **Step 1: Verify all changes are committed**

```bash
cd /Users/kkondoju/projects/health-dashboard
git status
```

Expected: `nothing to commit, working tree clean`

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

Expected: `Branch 'main' set up to track remote branch 'main' from 'origin'.`

- [ ] **Step 3: Monitor GitHub Actions deployment**

```bash
gh run list --limit 3
```

Watch for the workflow to complete. Then:

```bash
gh run watch
```

- [ ] **Step 4: Add JWT_SECRET to Azure App Service**

In Azure Portal → App Service `health-dasboard` → Configuration → Application Settings:
- Add: `JWT_SECRET` = (generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- Save → App Service restarts

- [ ] **Step 5: Run seed script against production**

```bash
MONGODB_URI=<your-prod-mongodb-uri> npm run seed:admin
```

Enter your email, name, and password when prompted.

- [ ] **Step 6: Run migration against production**

```bash
MONGODB_URI=<your-prod-mongodb-uri> npm run migrate:logs
```

Enter the same admin email. Confirm N logs attributed.

- [ ] **Step 7: Verify production**

Visit `https://kaha.online/` — should redirect to `/login.html`.
Log in with your admin credentials — should land on the dashboard.
Visit `https://kaha.online/admin.html` — should show the admin panel.

---

## Task 18: Checklist customisation (implement last — deferred per spec)

This task is explicitly deferred per the spec. It can be implemented as a standalone Settings section once all other tasks are complete.

**When to implement:** After Tasks 1–17 are verified working in production.

**What it involves:**
- Add a Settings nav item to the sidebar
- Add `<div id="sec-settings">` section to `index.html` with a checklist item editor
- Create `public/js/checklist-settings.js` with GET/POST/PATCH/DELETE calls to `/api/checklist/items`
- Modify `dashboard.js` `buildTimeline()` to load checklist items from `/api/checklist/items` instead of using the hardcoded `PHASE_TASKS` array

---

## Self-Review Against Spec

| Spec Section | Covered By |
|---|---|
| JWT httpOnly SameSite=Strict cookies | Task 5 (routes/auth.js COOKIE_OPTS) |
| Rate limiting (10/5 per 15min) | Task 5 (loginLimiter, registerLimiter) |
| User model (email, passwordHash, name, role, isApproved, profile, startDate) | Task 2 |
| HealthLog userId + compound unique index | Task 3 |
| ChecklistItem model + default 8 items | Task 3 + Task 8 |
| BreathingSession model | Task 3 |
| Auth routes (register, login, logout, /me) | Task 5 |
| isApproved gate on login | Task 5 |
| Log routes scoped by userId | Task 6 |
| Admin CRUD (approve, create, delete, reset-password) | Task 7 |
| Breathing POST + GET sessions | Task 8 |
| Checklist CRUD routes | Task 8 |
| server.js router mount + cookie-parser | Task 9 |
| Seed admin script | Task 10 |
| Migrate logs script (local with MONGODB_URI=<prod>) | Task 10 |
| api.js (credentials:include, 401 redirect) | Task 11 |
| auth.js (initAuth, sidebar personalisation, logout, phase/month calc) | Task 11 |
| Phase auto-calc from profile.startDate | Task 11 (getUserPhaseIndex) |
| login.html | Task 12 |
| admin.html panel | Task 13 |
| JS module extraction (JS only, HTML stays) | Task 14 |
| localStorage fallback removed | Task 14 (syncData, loadDateData) |
| Breathing section HTML + JS | Task 15 |
| 4 techniques: box, 4-7-8, wim-hof, diaphragmatic | Task 15 |
| Mood before/after + session history | Task 15 |
| JWT_SECRET startup guard | Task 1 + 9 |
| Push to GitHub → Azure auto-deploy | Task 17 |
| JWT_SECRET Azure config + seed + migrate order | Task 17 |
| Sidebar personal info from /me API | Task 11 + 14 |
| Checklist customisation (deferred) | Task 18 (stub) |
