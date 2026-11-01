const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    numberLabel: {
      type: String,
      default: '01 / AVAILABLE NOW',
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    subtitle: {
      type: String,
      default: 'EXPLORE THE COLLECTION →',
    },
    status: {
      type: String,
      enum: ['AVAILABLE NOW', 'COMING SOON'],
      default: 'AVAILABLE NOW',
    },
    image: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Collection', collectionSchema);
