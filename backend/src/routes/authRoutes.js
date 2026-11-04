const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const { protectUser, protectAdmin } = require('../middleware/auth');
const { sendPasswordResetOtp } = require('../services/emailService');

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
// PASSWORD RESET FOR USERS & ADMINS (OTP VIA NODEMAILER)
// ==========================================

// POST /api/auth/forgot-password (Request 6-digit OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOtp = otp;
    user.resetOtpExpires = expiresAt;
    await user.save();

    console.log(`[AUTH] Password reset OTP for ${normalizedEmail} (${user.role}): ${otp} (expires ${expiresAt.toISOString()})`);

    // Dispatch email via Nodemailer
    const emailResult = await sendPasswordResetOtp({
      to: user.email,
      otp,
      userName: user.name,
      role: user.role,
    });

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${user.email}. Check your inbox.`,
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error('[AUTH] Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/verify-otp (Verify OTP before password entry)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.resetOtp) {
      return res.status(400).json({ message: 'No active password reset request found. Please request a new code.' });
    }

    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    res.json({ success: true, message: 'Code verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/reset-password (Set new password using verified OTP)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.resetOtp) {
      return res.status(400).json({ message: 'Invalid or expired password reset request.' });
    }

    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    console.log(`[AUTH] Password successfully reset for: ${user.email} (${user.role})`);

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || 'Dhaka',
        deliveryZone: user.deliveryZone || 'Inside Dhaka',
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('[AUTH] Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/auth/admins (Admin - List all admin accounts)
router.get('/admins', protectAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password -resetOtp -resetOtpExpires')
      .sort({ createdAt: 1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/admins (Admin - Create a new admin or promote existing user)
router.post('/admins', protectAdmin, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and initial password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.role === 'admin') {
        return res.status(400).json({ message: 'An admin account with this email already exists' });
      }
      // Upgrade customer to admin
      user.role = 'admin';
      user.name = name.trim();
      if (phone) user.phone = phone.trim();
      user.password = password;
      user.isActive = true;
      await user.save();

      return res.status(200).json({
        message: 'Existing user promoted to admin successfully',
        admin: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    }

    // Create new admin
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      password,
      role: 'admin',
      isActive: true,
      lastLogin: new Date(),
    });

    res.status(201).json({
      message: 'New admin account created successfully',
      admin: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[AUTH] Create admin error:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/auth/users/:id (Admin - Delete customer or admin account)
router.delete('/users/:id', protectAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent self-deletion
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account while logged in.' });
    }

    // If deleting an admin, ensure at least one other admin remains
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only remaining admin account.' });
      }
    }

    await user.deleteOne();
    res.json({ message: `${user.role === 'admin' ? 'Admin' : 'User'} account removed successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
