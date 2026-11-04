const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protectUser, protectAdmin } = require('../middleware/auth');
const {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
} = require('../services/emailService');

const router = express.Router();

// POST /api/orders (Authenticated Customer Checkout)
router.post('/', protectUser, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items,
      subtotal,
      shippingCost,
      totalAmount,
      paymentMethod,
      paymentDetails,
    } = req.body;

    if (!customerName || !customerPhone || !shippingAddress?.address || !items?.length) {
      return res.status(400).json({ message: 'Please complete all required order fields.' });
    }

    const orderNumber =
      'BG-' +
      new Date().getFullYear().toString().slice(-2) +
      Math.floor(100000 + Math.random() * 900000);

    const order = await Order.create({
      user: req.user._id,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail: customerEmail || req.user.email || '',
      shippingAddress,
      items,
      subtotal: Number(subtotal),
      shippingCost: Number(shippingCost || 0),
      totalAmount: Number(totalAmount),
      paymentMethod: paymentMethod || 'COD',
      paymentDetails: paymentDetails || { senderNumber: '', transactionId: '' },
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
    });

    // Save shipping address to user profile if empty
    if (!req.user.address || !req.user.phone) {
      req.user.phone = req.user.phone || customerPhone;
      req.user.address = req.user.address || shippingAddress.address;
      req.user.city = shippingAddress.city || 'Dhaka';
      req.user.deliveryZone = shippingAddress.deliveryZone || 'Inside Dhaka';
      await req.user.save().catch(() => {});
    }

    // Reduce product stock where applicable
    for (const item of items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -Math.abs(item.quantity || 1) },
        }).catch(() => {});
      }
    }

    // Send order confirmation email asynchronously
    sendOrderConfirmationEmail(order).catch((mailErr) => {
      console.error('[Order Email] Error sending confirmation email:', mailErr.message);
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/my-orders (Logged-in Customer's Orders)
router.get('/my-orders', protectUser, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { user: req.user._id },
        { customerEmail: req.user.email },
        ...(req.user.phone ? [{ customerPhone: req.user.phone }] : []),
      ],
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/track/:query (Public Order Tracking by Order Number or Phone)
router.get('/track/:query', async (req, res) => {
  try {
    const q = req.params.query.trim();
    const orders = await Order.find({
      $or: [
        { orderNumber: { $regex: new RegExp(`^${q}$`, 'i') } },
        { customerPhone: { $regex: q, $options: 'i' } },
      ],
    }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found with this Order Number or Phone' });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders (Admin - List all orders)
router.get('/', protectAdmin, async (req, res) => {
  try {
    const { status, paymentMethod, search } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.orderStatus = status;
    if (paymentMethod && paymentMethod !== 'All') filter.paymentMethod = paymentMethod;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { 'paymentDetails.transactionId': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/orders/:id (Admin - Update order/payment status)
router.put('/:id', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const previousStatus = order.orderStatus;

    if (req.body.orderStatus) order.orderStatus = req.body.orderStatus;
    if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;

    const updated = await order.save();

    // If order was marked as Confirmed, notify customer
    if (req.body.orderStatus === 'Confirmed' && previousStatus !== 'Confirmed') {
      sendOrderStatusUpdateEmail(updated).catch((mailErr) => {
        console.error('[Order Status Email] Error sending confirmed email:', mailErr.message);
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/orders/:id (Admin)
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await order.deleteOne();
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
