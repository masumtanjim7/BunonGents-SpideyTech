const express = require('express');
const multer = require('multer');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB max
});

// POST /api/upload (Admin - Upload single image to ImgBB)
router.post('/', protectAdmin, upload.single('image'), async (req, res) => {
  try {
    let base64Image = '';

    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
    } else if (req.body.image) {
      // Allow base64 string directly in body
      base64Image = req.body.image.replace(/^data:image\/\w+;base64,/, '');
    } else {
      return res.status(400).json({ message: 'No image file or base64 data provided' });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'ImgBB API key is not configured on the server' });
    }

    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    formData.append('image', base64Image);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return res.status(400).json({
        message: data?.error?.message || 'Failed to upload image to ImgBB',
      });
    }

    res.json({
      url: data.data.display_url || data.data.url,
      originalUrl: data.data.url,
      thumbUrl: data.data.thumb?.url || data.data.url,
      deleteUrl: data.data.delete_url,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Image upload failed' });
  }
});

module.exports = router;
