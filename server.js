// override:true forces .env to win over Azure App Settings
// (safe for tests — mongoose.connect is guarded by require.main === module)
require('dotenv').config({ override: true });
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

if (require.main === module) {
  console.log('🔗 MongoDB URI:', mongoURI.replace(/:([^@]+)@/, ':***@'));
  mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000
  })
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.warn('⚠️  MongoDB offline:', err.message));
}

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.json({ status: 'ok', db: connected ? 'connected' : 'offline', port: PORT });
});

// Reject API requests if DB is not connected
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected. Please try again in a moment.' });
  }
  next();
});

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/logs',      require('./routes/logs'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/breathing', require('./routes/breathing'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/profile',   require('./routes/profile'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler — must have 4 params for Express to treat it as error middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Health Engine → http://${HOST}:${PORT}`);
  });
}

module.exports = app;
