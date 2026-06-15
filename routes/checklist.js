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
