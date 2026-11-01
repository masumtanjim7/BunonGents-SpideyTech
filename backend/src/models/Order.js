const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
  },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  size: { type: String, default: 'M' },
  color: { type: String, default: 'Default' },
  image: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      default: '',
    },
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true, default: 'Dhaka' },
      area: { type: String, default: '' },
      deliveryZone: {
        type: String,
        enum: ['Inside Dhaka', 'Outside Dhaka'],
        default: 'Inside Dhaka',
      },
      notes: { type: String, default: '' },
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 70,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'bKash', 'Nagad'],
      default: 'COD',
    },
    paymentDetails: {
      senderNumber: { type: String, default: '' },
      transactionId: { type: String, default: '' },
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Failed'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
