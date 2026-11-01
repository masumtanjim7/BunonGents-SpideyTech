const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const { protectUser, protectAdmin } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register (Customer Registration)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, address, city, deliveryZone } = req.body;

    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email, mobile number, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'An account with this email already exists. Please sign in.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      address: address || '',
      city: city || 'Dhaka',
      deliveryZone: deliveryZone || 'Inside Dhaka',
      password,
      role: 'customer',
      isActive: true,
      lastLogin: new Date(),
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      deliveryZone: user.deliveryZone,
      role: user.role,
      isActive: user.isActive,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login (Customer & Admin Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || 'Dhaka',
      deliveryZone: user.deliveryZone || 'Inside Dhaka',
      role: user.role,
      isActive: user.isActive,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me (Current logged-in user profile)
router.get('/me', protectUser, async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/profile (Customer updates own profile)
router.put('/profile', protectUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name !== undefined) user.name = req.body.name.trim();
    if (req.body.phone !== undefined) user.phone = req.body.phone.trim();
    if (req.body.address !== undefined) user.address = req.body.address.trim();
    if (req.body.city !== undefined) user.city = req.body.city.trim();
    if (req.body.deliveryZone !== undefined) user.deliveryZone = req.body.deliveryZone;
    if (req.body.newPassword && req.body.newPassword.length >= 6) {
      user.password = req.body.newPassword;
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      city: updated.city,
      deliveryZone: updated.deliveryZone,
      role: updated.role,
      isActive: updated.isActive,
      token: generateToken(updated._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/credentials (Admin updates email/password)
router.put('/credentials', protectAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Admin user not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email.toLowerCase().trim();
    if (req.body.newPassword) {
      user.password = req.body.newPassword;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/auth/users (Admin - List all users with order count & total spent)
router.get('/users', protectAdmin, async (req, res) => {
  try {
    const [users, orders] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }),
      Order.find().sort({ createdAt: -1 }),
    ]);

    const enrichedUsers = users.map((u) => {
      const userOrders = orders.filter(
        (o) =>
          (o.user && String(o.user) === String(u._id)) ||
          (o.customerEmail && o.customerEmail.toLowerCase() === u.email.toLowerCase()) ||
          (u.phone && o.customerPhone === u.phone)
      );
      const validOrders = userOrders.filter((o) => o.orderStatus !== 'Cancelled');
      const totalSpent = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        ...u.toObject(),
        ordersCount: userOrders.length,
        totalSpent,
        lastOrderDate: userOrders[0]?.createdAt || null,
        recentOrders: userOrders.slice(0, 5),
      };
    });

    res.json(enrichedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/users/:id (Admin - Toggle active status or role)
router.put('/users/:id', protectAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      isActive: updated.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/auth/users/:id (Admin - Delete customer account)
router.delete('/users/:id', protectAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete the primary admin account' });
    }
    await user.deleteOne();
    res.json({ message: 'Customer account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
