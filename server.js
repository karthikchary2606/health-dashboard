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
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthDB';

let dbConnected = false;

mongoose.connect(mongoURI)
    .then(() => { console.log('✅ MongoDB Connected'); dbConnected = true; })
    .catch(err => console.warn('⚠️  MongoDB offline — app runs with localStorage fallback:', err.message));

const HealthLogSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    checklist: { type: [Boolean], default: Array(12).fill(false) },
    waterIntake: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    completedWorkout: { type: Boolean, default: false },
    moodScore: { type: Number, default: 3 },
    energyScore: { type: Number, default: 3 },
    notes: { type: String, default: '' }
}, { timestamps: true });

const HealthLog = mongoose.model('HealthLog', HealthLogSchema);

// Middleware: return 503 for DB-dependent routes if not connected
function requireDB(req, res, next) {
    if (!dbConnected) return res.status(503).json({ error: 'Database not connected. Using localStorage fallback.' });
    next();
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: dbConnected ? 'connected' : 'offline', port: PORT });
});

app.get('/api/logs/:date', requireDB, async (req, res) => {
    try {
        let log = await HealthLog.findOne({ date: req.params.date });
        if (!log) { log = new HealthLog({ date: req.params.date }); await log.save(); }
        res.json(log);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/logs', requireDB, async (req, res) => {
    const { date, checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes } = req.body;
    try {
        const log = await HealthLog.findOneAndUpdate(
            { date },
            { checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes },
            { new: true, upsert: true, runValidators: true }
        );
        res.json(log);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/weight-history', requireDB, async (req, res) => {
    try {
        const logs = await HealthLog.find({ weight: { $gt: 0 } }).sort({ date: 1 }).select('date weight -_id');
        res.json(logs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats', requireDB, async (req, res) => {
    try {
        const last30 = await HealthLog.find().sort({ date: -1 }).limit(30).select('date weight waterIntake completedWorkout checklist');
        const allWeights = last30.filter(l => l.weight > 0).map(l => l.weight);
        const currentWeight = allWeights[0] || 95;
        const startWeight = allWeights[allWeights.length - 1] || 95;
        let workoutStreak = 0, waterStreak = 0;
        for (const log of last30) { if (log.completedWorkout) workoutStreak++; else break; }
        for (const log of last30) { if (log.waterIntake >= 3) waterStreak++; else break; }
        const completionRates = last30.map(l => l.checklist.length ? (l.checklist.filter(Boolean).length / l.checklist.length) * 100 : 0);
        const avgCompletion = completionRates.length ? completionRates.reduce((s, v) => s + v, 0) / completionRates.length : 0;
        res.json({ currentWeight, startWeight, weightLost: parseFloat((startWeight - currentWeight).toFixed(1)), workoutStreak, waterStreak, avgCompletion: parseFloat(avgCompletion.toFixed(0)), totalDaysLogged: last30.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`🚀 Health Engine → http://${HOST}:${PORT}`);
});
