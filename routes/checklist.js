const express = require('express');
const ChecklistItem = require('../models/ChecklistItem');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');

const router = express.Router();
router.use(authenticate, requireProfile);

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
    let items = await ChecklistItem.find({ userId: req.user._id, isActive: true }).sort({ order: 1 });
    if (items.length === 0) {
      const docs = DEFAULT_ITEMS.map((label, i) => ({
        userId: req.user._id, label, order: i, isActive: true
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
    const item = await ChecklistItem.create({ userId: req.user._id, label, order: order || 0 });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/items/:id', async (req, res) => {
  try {
    const item = await ChecklistItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/items/:id', async (req, res) => {
  try {
    const item = await ChecklistItem.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
