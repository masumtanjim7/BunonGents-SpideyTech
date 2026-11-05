const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Shirts',
    },
    badge: {
      type: String,
      default: 'EVERYDAY ESSENTIAL',
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    fabricAndCare: {
      type: String,
      default: '100% Premium breathable cotton. Machine wash cold, tumble dry low.',
    },
    image: {
      type: String,
      required: true,
    },
    gallery: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [String],
      default: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    sizeChart: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    colors: {
      type: [String],
      default: ['Charcoal', 'Forest Green', 'Warm Cream'],
    },
    stock: {
      type: Number,
      default: 25,
    },
    featured: {
      type: Boolean,
      default: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
