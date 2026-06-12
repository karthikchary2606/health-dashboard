const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthDB';
mongoose.connect(mongoURI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err.message));

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

app.get('/api/logs/:date', async (req, res) => {
    try {
        let log = await HealthLog.findOne({ date: req.params.date });
        if (!log) {
            log = new HealthLog({ date: req.params.date });
            await log.save();
        }
        res.json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/logs', async (req, res) => {
    const { date, checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes } = req.body;
    try {
        const log = await HealthLog.findOneAndUpdate(
            { date },
            { checklist, waterIntake, weight, completedWorkout, moodScore, energyScore, notes },
            { new: true, upsert: true, runValidators: true }
        );
        res.json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/weight-history', async (req, res) => {
    try {
        const logs = await HealthLog.find({ weight: { $gt: 0 } })
            .sort({ date: 1 })
            .select('date weight -_id');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const last30 = await HealthLog.find()
            .sort({ date: -1 })
            .limit(30)
            .select('date weight waterIntake completedWorkout checklist');

        const allWeights = last30.filter(l => l.weight > 0).map(l => l.weight);
        const currentWeight = allWeights[0] || 95;
        const startWeight = allWeights[allWeights.length - 1] || 95;

        let workoutStreak = 0;
        let waterStreak = 0;
        for (const log of last30) {
            if (log.completedWorkout) workoutStreak++;
            else break;
        }
        for (const log of last30) {
            if (log.waterIntake >= 3) waterStreak++;
            else break;
        }

        const completionRates = last30.map(l => {
            const done = l.checklist.filter(Boolean).length;
            return l.checklist.length > 0 ? (done / l.checklist.length) * 100 : 0;
        });
        const avgCompletion = completionRates.length
            ? completionRates.reduce((s, v) => s + v, 0) / completionRates.length
            : 0;

        res.json({
            currentWeight,
            startWeight,
            weightLost: parseFloat((startWeight - currentWeight).toFixed(1)),
            workoutStreak,
            waterStreak,
            avgCompletion: parseFloat(avgCompletion.toFixed(0)),
            totalDaysLogged: last30.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Health Engine → http://localhost:${PORT}`);
});
