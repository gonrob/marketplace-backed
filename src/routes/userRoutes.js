const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Listar anfitriones activos (público)
router.get('/sellers', async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      onboardingComplete: true
    }).select('email nombre bio foto precio habilidades ciudad idiomas verificado disponible _id');
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener anfitriones.' });
  }
});

// Actualizar perfil del anfitrión
router.put('/profile', auth, async (req, res) => {
  try {
    const { nombre, bio, precio, habilidades, ciudad, idiomas, disponible } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nombre, bio, precio, habilidades, ciudad, idiomas, disponible },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
});

// Ver perfil público de un anfitrión
router.get('/sellers/:id', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
      .select('email nombre bio foto precio habilidades ciudad idiomas verificado disponible');
    if (!seller) return res.status(404).json({ error: 'Anfitrión no encontrado.' });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener anfitrión.' });
  }
});

module.exports = router;
