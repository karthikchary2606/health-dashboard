'use strict';
const express        = require('express');
const router         = express.Router();
const authenticate   = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');

// In-memory grocery state per user per week (keyed by userId + ISO week)
const _groceryState = {};

function getISOWeek() {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

// Derive grocery list from template using first week's categories
function deriveGroceryList(profile) {
  const planTemplate = profile.planTemplate || 'weight-loss';
  let getGroceryList;
  try {
    getGroceryList = require(`../server/templates/${planTemplate}`).getGroceryList;
  } catch (e) {
    getGroceryList = require('../server/templates/weight-loss').getGroceryList;
  }

  const fullList = getGroceryList(profile);
  // fullList is an array of months; take first month's categories
  const categories = (fullList[0] && fullList[0].categories) || [];

  return categories.map(cat => ({
    category: cat.name,
    items: cat.items.map(itemName => ({
      name: itemName,
      purchased: false,
      removed: false
    }))
  }));
}

router.get('/week', authenticate, requireProfile, (req, res) => {
  const userId   = req.user._id.toString();
  const weekKey  = getISOWeek();
  const stateKey = `${userId}-${weekKey}`;

  if (!_groceryState[stateKey]) {
    _groceryState[stateKey] = deriveGroceryList(req.user.profile);
  }
  res.json(_groceryState[stateKey]);
});

router.patch('/week/item', authenticate, requireProfile, (req, res) => {
  const userId   = req.user._id.toString();
  const weekKey  = getISOWeek();
  const stateKey = `${userId}-${weekKey}`;
  const { name, purchased, removed } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  if (!_groceryState[stateKey]) {
    _groceryState[stateKey] = deriveGroceryList(req.user.profile);
  }

  let found = false;
  _groceryState[stateKey].forEach(cat => {
    const item = cat.items.find(i => i.name === name);
    if (item) {
      if (purchased !== undefined) item.purchased = purchased;
      if (removed   !== undefined) item.removed   = removed;
      found = true;
    }
  });

  if (!found) return res.status(404).json({ error: 'Item not found' });
  res.json({ success: true });
});

router.post('/week/custom', authenticate, requireProfile, (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const userId   = req.user._id.toString();
  const weekKey  = getISOWeek();
  const stateKey = `${userId}-${weekKey}`;

  if (!_groceryState[stateKey]) {
    _groceryState[stateKey] = deriveGroceryList(req.user.profile);
  }

  const catName = category || 'Other';
  const existing = _groceryState[stateKey].find(c => c.category === catName);
  if (existing) {
    existing.items.push({ name, purchased: false, removed: false, custom: true });
  } else {
    _groceryState[stateKey].push({ category: catName, items: [{ name, purchased: false, removed: false, custom: true }] });
  }
  res.json({ success: true });
});

module.exports = router;
