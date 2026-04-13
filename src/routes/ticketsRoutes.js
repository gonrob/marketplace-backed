const router = require('express').Router();
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

router.post('/pagar', auth, async (req, res) => {
  try {
    const { eventoNombre, eventoUrl } = req.body;
    if (!eventoNombre) return res.status(400).json({ error: 'Faltan datos del evento.' });

    const intent = await stripe.paymentIntents.create({
      amount: 100, // USD 1.00
      currency: 'usd',
      metadata: {
        tipo: 'ticket_servicio',
        eventoNombre,
        eventoUrl: eventoUrl || '',
        userId: req.user._id.toString(),
        userEmail: req.user.email,
      }
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('ticket pagar error:', err.message);
    res.status(500).json({ error: 'Error al crear pago.' });
  }
});

module.exports = router;
