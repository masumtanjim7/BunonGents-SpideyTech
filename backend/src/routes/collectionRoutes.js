const express = require('express');
const Collection = require('../models/Collection');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find().sort({ order: 1, createdAt: 1 });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/collections (Admin)
router.post('/', protectAdmin, async (req, res) => {
  try {
    const { numberLabel, title, subtitle, status, image, order } = req.body;
    if (!title) return res.status(400).json({ message: 'Collection title is required' });

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const col = await Collection.create({
      numberLabel: numberLabel || '01 / AVAILABLE NOW',
      title,
      slug,
      subtitle: subtitle || 'EXPLORE THE COLLECTION →',
      status: status || 'AVAILABLE NOW',
      image: image || '',
      order: order !== undefined ? Number(order) : 0,
    });

    res.status(201).json(col);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/collections/:id (Admin)
router.put('/:id', protectAdmin, async (req, res) => {
  try {
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ message: 'Collection not found' });

    const fields = ['numberLabel', 'title', 'subtitle', 'status', 'image', 'order'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) col[f] = req.body[f];
    });

    const updated = await col.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/collections/:id (Admin)
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ message: 'Collection not found' });
    await col.deleteOne();
    res.json({ message: 'Collection removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
