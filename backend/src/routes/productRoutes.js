const express = require('express');
const Product = require('../models/Product');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();

const createSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') +
  '-' +
  Math.floor(1000 + Math.random() * 9000);

// GET /api/products
router.get('/', async (req, res) => {
  try {
    // Ensure legacy demo products never reappear
    await Product.deleteMany({
      slug: {
        $in: [
          'everyday-denim',
          'the-classic-shirt',
          'relaxed-tee',
          'weekend-knit',
          'cold-day-coat',
        ],
      },
    });

    const { category, search, featured } = req.query;
    const filter = {};

    if (category && category !== 'All pieces') {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (featured === 'true') {
      filter.featured = true;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { badge: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:idOrSlug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product = null;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug);
    }
    if (!product) {
      product = await Product.findOne({ slug: idOrSlug });
    }
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products (Admin)
router.post('/', protectAdmin, async (req, res) => {
  try {
    const {
      title,
      category,
      badge,
      price,
      originalPrice,
      description,
      fabricAndCare,
      image,
      gallery,
      sizes,
      sizeChart,
      colors,
      stock,
      featured,
      inStock,
    } = req.body;

    const primaryImage = image || (Array.isArray(gallery) && gallery.length > 0 ? gallery[0] : '');

    if (!title || price === undefined || !primaryImage) {
      return res.status(400).json({ message: 'Title, price, and at least one image are required' });
    }

    const slug = createSlug(title);
    const product = await Product.create({
      title,
      slug,
      category: category || 'Shirts',
      badge: badge || 'EVERYDAY ESSENTIAL',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      description: description || '',
      fabricAndCare:
        fabricAndCare || '100% Premium breathable cotton. Machine wash cold, tumble dry low.',
      image: primaryImage,
      gallery: Array.isArray(gallery) ? gallery.filter(Boolean) : [],
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL', 'XXL'],
      sizeChart: sizeChart && typeof sizeChart === 'object' ? sizeChart : {},
      colors: Array.isArray(colors) && colors.length > 0 ? colors : ['Charcoal', 'Warm Cream'],
      stock: stock !== undefined ? Number(stock) : 25,
      featured: featured !== undefined ? Boolean(featured) : true,
      inStock: inStock !== undefined ? Boolean(inStock) : true,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/products/:id (Admin)
router.put('/:id', protectAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const fields = [
      'title',
      'category',
      'badge',
      'price',
      'originalPrice',
      'description',
      'fabricAndCare',
      'image',
      'gallery',
      'sizes',
      'sizeChart',
      'colors',
      'stock',
      'featured',
      'inStock',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/products/:id (Admin)
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
