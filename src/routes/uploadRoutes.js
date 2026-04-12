const router = require('express').Router();
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const rateLimit = require('express-rate-limit');
const uploadLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: { error: 'Demasiadas subidas. Intentá en 15 minutos.' } });
router.post('/photo-public', uploadLimiter, async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ error: 'Foto requerida.' });
    const result = await cloudinary.uploader.upload(photo, {
      folder: 'knowan',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Upload public error:', err.message);
    res.status(500).json({ error: 'Error al subir foto.' });
  }
});

router.post('/photo', auth, async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ error: 'Foto requerida.' });

    const result = await cloudinary.uploader.upload(photo, {
      folder: 'knowan',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
    });

    console.log('Cloudinary URL:', result.secure_url);

    await User.updateOne(
      { _id: req.user._id },
      { $set: { foto: result.secure_url } }
    );

    const user = await User.findById(req.user._id);
    console.log('Foto en DB:', user.foto);

    res.json({ url: result.secure_url, user });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Error al subir foto.' });
  }
});

module.exports = router;