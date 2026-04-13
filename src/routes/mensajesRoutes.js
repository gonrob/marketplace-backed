const router = require('express').Router();
const auth = require('../middleware/auth');
const Mensaje = require('../models/Mensaje');

router.get('/:conId', auth, async (req, res) => {
  try {
    const { conId } = req.params;
    const userId = req.user._id;
    const mensajes = await Mensaje.find({
      $or: [
        { de: userId, para: conId },
        { de: conId, para: userId }
      ]
    }).sort({ createdAt: 1 }).limit(100);
    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener mensajes.' });
  }
});

router.post('/:conId', auth, async (req, res) => {
  try {
    const { conId } = req.params;
    const { texto } = req.body;
    if (!texto) return res.status(400).json({ error: 'Texto requerido.' });
    const msg = await Mensaje.create({
      de: req.user._id,
      para: conId,
      texto,
      nombre: req.user.nombre || req.user.email,
    });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar mensaje.' });
  }
});

module.exports = router;
