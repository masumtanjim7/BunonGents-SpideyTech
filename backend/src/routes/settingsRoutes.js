const express = require('express');
const Settings = require('../models/Settings');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Collection = require('../models/Collection');
const User = require('../models/User');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings (Public)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings (Admin)
router.put('/', protectAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const allowedFields = [
      'siteName',
      'topAnnouncement',
      'heroSubtitle',
      'heroTitleLine1',
      'heroTitleLine2',
      'heroDescription',
      'heroImage',
      'winterBannerSubtitle',
      'winterBannerTitle1',
      'winterBannerTitle2',
      'winterBannerDesc',
      'winterBannerImage',
      'bkashNumber',
      'bkashActive',
      'nagadNumber',
      'nagadActive',
      'codActive',
      'paymentInstructions',
      'insideDhakaShipping',
      'outsideDhakaShipping',
      'contactEmail',
      'contactPhone',
      'categories',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    const updated = await settings.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/settings/stats (Admin Dashboard Overview Metrics)
router.get('/stats', protectAdmin, async (req, res) => {
  try {
    const [totalProducts, totalCollections, orders, allUsers] = await Promise.all([
      Product.countDocuments(),
      Collection.countDocuments(),
      Order.find().sort({ createdAt: -1 }),
      User.find().select('-password').sort({ createdAt: -1 }),
    ]);

    const totalOrders = orders.length;
    const activeOrders = orders.filter((o) => o.orderStatus !== 'Cancelled');
    const totalRevenue = activeOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const pendingOrders = orders.filter((o) => o.orderStatus === 'Pending').length;
    const deliveredOrders = orders.filter((o) => o.orderStatus === 'Delivered').length;

    const customers = allUsers.filter((u) => u.role === 'customer');
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((u) => u.isActive !== false).length;
    const blockedCustomers = customers.filter((u) => u.isActive === false).length;

    const paymentBreakdown = {
      COD: orders.filter((o) => o.paymentMethod === 'COD').length,
      bKash: orders.filter((o) => o.paymentMethod === 'bKash').length,
      Nagad: orders.filter((o) => o.paymentMethod === 'Nagad').length,
    };

    const recentOrders = orders.slice(0, 6);

    res.json({
      totalProducts,
      totalCollections,
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      totalCustomers,
      activeCustomers,
      blockedCustomers,
      paymentBreakdown,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
