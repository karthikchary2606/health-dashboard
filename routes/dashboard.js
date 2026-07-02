'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');
const { buildOverview } = require('../server/engine/dashboard-overview');

const router = express.Router();

router.get('/overview', authenticate, requireProfile, async (req, res, next) => {
  try {
    const payload = await buildOverview(req.user);
    res.set('Cache-Control', 'no-store');
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
