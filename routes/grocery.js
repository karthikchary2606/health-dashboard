'use strict';
const express        = require('express');
const router         = express.Router();
const authenticate   = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');

// In-memory grocery state per user per week (keyed by userId + ISO week)
const _groceryState = {};

// Price (INR) and quantity lookup for common Indian grocery items
// quantity = suggested weekly purchase; price = approximate INR at Indian retail
const ITEM_META = {
  // Grains & Legumes
  'brown rice':       { quantity: '1 kg',   price: 80  },
  'rice':             { quantity: '2 kg',   price: 70  },
  'dal':              { quantity: '500 g',  price: 90  },
  'toor dal':         { quantity: '500 g',  price: 100 },
  'chana dal':        { quantity: '500 g',  price: 85  },
  'moong dal':        { quantity: '500 g',  price: 110 },
  'urad dal':         { quantity: '500 g',  price: 120 },
  'oats':             { quantity: '500 g',  price: 90  },
  'semolina':         { quantity: '500 g',  price: 40  },
  'rava':             { quantity: '500 g',  price: 40  },
  'poha':             { quantity: '500 g',  price: 45  },
  'ragi':             { quantity: '500 g',  price: 60  },
  'wheat flour':      { quantity: '1 kg',   price: 55  },
  'atta':             { quantity: '1 kg',   price: 55  },
  'quinoa':           { quantity: '250 g',  price: 150 },
  'besan':            { quantity: '500 g',  price: 60  },
  'rajma':            { quantity: '500 g',  price: 100 },
  'chickpeas':        { quantity: '500 g',  price: 90  },
  // Vegetables
  'spinach':          { quantity: '500 g',  price: 30  },
  'broccoli':         { quantity: '500 g',  price: 60  },
  'carrots':          { quantity: '500 g',  price: 35  },
  'tomatoes':         { quantity: '500 g',  price: 30  },
  'tomato':           { quantity: '500 g',  price: 30  },
  'onions':           { quantity: '1 kg',   price: 40  },
  'onion':            { quantity: '1 kg',   price: 40  },
  'potatoes':         { quantity: '1 kg',   price: 35  },
  'potato':           { quantity: '1 kg',   price: 35  },
  'cucumber':         { quantity: '500 g',  price: 25  },
  'capsicum':         { quantity: '250 g',  price: 40  },
  'green beans':      { quantity: '250 g',  price: 40  },
  'brinjal':          { quantity: '500 g',  price: 30  },
  'drumstick':        { quantity: '4 pcs',  price: 30  },
  'bitter gourd':     { quantity: '250 g',  price: 35  },
  'ridge gourd':      { quantity: '500 g',  price: 30  },
  'green peas':       { quantity: '250 g',  price: 50  },
  'cabbage':          { quantity: '1 pc',   price: 30  },
  'cauliflower':      { quantity: '1 pc',   price: 40  },
  'ginger':           { quantity: '100 g',  price: 20  },
  'garlic':           { quantity: '100 g',  price: 30  },
  'curry leaves':     { quantity: '1 bunch',price: 10  },
  'coriander leaves': { quantity: '1 bunch',price: 15  },
  'mint leaves':      { quantity: '1 bunch',price: 15  },
  'moringa':          { quantity: '250 g',  price: 40  },
  'gongura':          { quantity: '250 g',  price: 25  },
  // Fruits
  'banana':           { quantity: '1 dozen',price: 60  },
  'apple':            { quantity: '4 pcs',  price: 80  },
  'orange':           { quantity: '4 pcs',  price: 60  },
  'papaya':           { quantity: '1 pc',   price: 40  },
  'mango':            { quantity: '4 pcs',  price: 120 },
  'pomegranate':      { quantity: '2 pcs',  price: 80  },
  'guava':            { quantity: '4 pcs',  price: 40  },
  'watermelon':       { quantity: '1 kg',   price: 25  },
  'grapes':           { quantity: '500 g',  price: 80  },
  // Dairy & Protein
  'milk':             { quantity: '3.5 L',  price: 168 },
  'curd':             { quantity: '500 g',  price: 40  },
  'yoghurt':          { quantity: '500 g',  price: 40  },
  'greek yogurt':     { quantity: '400 g',  price: 130 },
  'paneer':           { quantity: '200 g',  price: 80  },
  'tofu':             { quantity: '200 g',  price: 80  },
  'eggs':             { quantity: '12 pcs', price: 90  },
  'chicken':          { quantity: '500 g',  price: 160 },
  'fish':             { quantity: '500 g',  price: 150 },
  'coconut milk':     { quantity: '400 ml', price: 65  },
  'soy milk':         { quantity: '1 L',    price: 100 },
  // Fats, Oils & Pantry
  'coconut oil':      { quantity: '500 ml', price: 120 },
  'groundnut oil':    { quantity: '1 L',    price: 150 },
  'sesame oil':       { quantity: '500 ml', price: 130 },
  'ghee':             { quantity: '200 g',  price: 120 },
  'olive oil':        { quantity: '250 ml', price: 250 },
  'nuts':             { quantity: '200 g',  price: 120 },
  'seeds':            { quantity: '100 g',  price: 60  },
  'almonds':          { quantity: '100 g',  price: 100 },
  'walnuts':          { quantity: '100 g',  price: 150 },
  'flaxseeds':        { quantity: '100 g',  price: 50  },
  // Spices & Condiments
  'turmeric':         { quantity: '100 g',  price: 20  },
  'cumin seeds':      { quantity: '100 g',  price: 30  },
  'mustard seeds':    { quantity: '100 g',  price: 20  },
  'coriander powder': { quantity: '100 g',  price: 25  },
  'red chilli powder':{ quantity: '100 g',  price: 30  },
  'tamarind':         { quantity: '100 g',  price: 20  },
  'jaggery':          { quantity: '250 g',  price: 40  },
  'salt':             { quantity: '1 kg',   price: 20  },
  'pepper':           { quantity: '50 g',   price: 40  },
  'cardamom':         { quantity: '10 g',   price: 30  },
};

// Resolve quantity + price for an item name (fuzzy match on key)
function resolveMeta(name) {
  const lower = name.toLowerCase().replace(/\s*\(.*?\)/g, '').trim(); // strip parentheticals
  if (ITEM_META[lower]) return ITEM_META[lower];
  // partial match
  const key = Object.keys(ITEM_META).find(k => lower.includes(k) || k.includes(lower));
  return key ? ITEM_META[key] : { quantity: '1 unit', price: null };
}

function getISOWeek() {
  // ISO 8601: week containing the first Thursday of the year is week 1.
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayOfWeek = date.getUTCDay() || 7; // convert Sunday 0 → 7
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek); // shift to nearest Thursday
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
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
    items: cat.items.map(itemName => {
      const meta = resolveMeta(itemName);
      return {
        name:               itemName,
        quantity:           meta.quantity,
        estimatedPriceINR:  meta.price,
        purchased:          false,
        removed:            false
      };
    })
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
  const { name, category, quantity, estimatedPriceINR } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const userId   = req.user._id.toString();
  const weekKey  = getISOWeek();
  const stateKey = `${userId}-${weekKey}`;

  if (!_groceryState[stateKey]) {
    _groceryState[stateKey] = deriveGroceryList(req.user.profile);
  }

  const newItem = {
    name,
    quantity:          quantity || '1 unit',
    estimatedPriceINR: estimatedPriceINR || null,
    purchased: false,
    removed:   false,
    custom:    true
  };

  const catName = category || 'Other';
  const existing = _groceryState[stateKey].find(c => c.category === catName);
  if (existing) {
    existing.items.push(newItem);
  } else {
    _groceryState[stateKey].push({ category: catName, items: [newItem] });
  }
  res.json({ success: true });
});

module.exports = router;
