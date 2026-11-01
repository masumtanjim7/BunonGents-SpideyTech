const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'Bunon Gents',
    },
    topAnnouncement: {
      type: String,
      default: "THE MEN'S COLLECTION IS HERE  ·  DISCOVER YOUR NEXT EVERYDAY FAVORITE",
    },
    heroSubtitle: {
      type: String,
      default: 'A NEW WAY TO WEAR EVERYDAY',
    },
    heroTitleLine1: {
      type: String,
      default: 'Wear what',
    },
    heroTitleLine2: {
      type: String,
      default: 'feels like you.',
    },
    heroDescription: {
      type: String,
      default:
        "Thoughtful pieces for the moments that make up your life. Discover the men's collection—easy to wear, made to stand out.",
    },
    heroImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1800&auto=format&fit=crop',
    },
    winterBannerSubtitle: {
      type: String,
      default: 'THE WINTER COLLECTION',
    },
    winterBannerTitle1: {
      type: String,
      default: 'Cold weather.',
    },
    winterBannerTitle2: {
      type: String,
      default: 'Good style.',
    },
    winterBannerDesc: {
      type: String,
      default: 'Layers that bring warmth and character to every day of the season.',
    },
    winterBannerImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1600&auto=format&fit=crop',
    },
    bkashNumber: {
      type: String,
      default: '01700-000000 (Personal / Send Money)',
    },
    bkashActive: {
      type: Boolean,
      default: true,
    },
    nagadNumber: {
      type: String,
      default: '01800-000000 (Personal / Send Money)',
    },
    nagadActive: {
      type: Boolean,
      default: true,
    },
    codActive: {
      type: Boolean,
      default: true,
    },
    paymentInstructions: {
      type: String,
      default:
        'Send Money to our bKash or Nagad number above, then enter your Sender Mobile Number and Transaction ID (TrxID) below to confirm your order.',
    },
    insideDhakaShipping: {
      type: Number,
      default: 70,
    },
    outsideDhakaShipping: {
      type: Number,
      default: 130,
    },
    contactEmail: {
      type: String,
      default: 'support@example.com',
    },
    contactPhone: {
      type: String,
      default: '+880 1700-000000',
    },
    categories: {
      type: [String],
      default: ['Jeans', 'Shirts', 'T-shirts', 'Sweaters', 'Winter collection'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
