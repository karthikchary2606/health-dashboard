const express = require('express');
const ChecklistItem = require('../models/ChecklistItem');
const authenticate = require('../middleware/authenticate');
const requireProfile = require('../middleware/requireProfile');

const TEMPLATES = {
  'weight-loss':     require('../server/templates/weight-loss'),
  'muscle-gain':     require('../server/templates/muscle-gain'),
  'maintenance':     require('../server/templates/maintenance'),
  'general-fitness': require('../server/templates/general-fitness')
};

const router = express.Router();
router.use(authenticate, requireProfile);

function templateDefaults(user) {
  const template = TEMPLATES[user.profile.planTemplate || 'weight-loss'];
  return template.getDefaultChecklist(user.profile).map((item, i) => ({
    userId: user._id,
    label: item.text,
    order: i,
    isActive: true,
    completed: false
  }));
}

router.get('/items', async (req, res) => {
  try {
    let items = await ChecklistItem.find({ userId: req.user._id, isActive: true }).sort({ order: 1 });
    if (items.length === 0) {
      const count = await ChecklistItem.countDocuments({ userId: req.user._id });
      if (count === 0) {
        const defaults = templateDefaults(req.user);
        try {
          await ChecklistItem.insertMany(defaults, { ordered: false });
        } catch (e) {
          // duplicate key — another request already seeded, safe to ignore
          if (e.code !== 11000) throw e;
        }
      }
      items = await ChecklistItem.find({ userId: req.user._id, isActive: true }).sort({ order: 1 });
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
    const { label, completed, order, isActive } = req.body;
    const update = {};
    if (label !== undefined) update.label = label;
    if (completed !== undefined) update.completed = completed;
    if (order !== undefined) update.order = order;
    if (isActive !== undefined) update.isActive = isActive;
    
    const item = await ChecklistItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: update },
      { new: true, runValidators: true }
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

router.post('/reset-to-defaults', async (req, res, next) => {
  try {
    await ChecklistItem.deleteMany({ userId: req.user._id });
    const items = await ChecklistItem.insertMany(templateDefaults(req.user));
    res.json({ items });
  } catch (err) { next(err); }
});

module.exports = router;
