require('dotenv').config();
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

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  bufferCommands: false
})
  .then(() => { console.log('✅ MongoDB Connected'); dbConnected = true; })
  .catch(err => console.warn('⚠️  MongoDB offline:', err.message));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: dbConnected ? 'connected' : 'offline', port: PORT });
});

// Reject API requests if DB is not connected
app.use('/api', (req, res, next) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database not connected. Please try again in a moment.' });
  next();
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
