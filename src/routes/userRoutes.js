const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Listar vendedores activos (público)
router.get('/sellers', async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      onboardingComplete: true
    }).select('email _id');
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener vendedores.' });
  }
});

module.exports = router;
