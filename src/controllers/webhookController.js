const User = require('../models/User');

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook sig error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const sellerUserId = intent.metadata?.sellerUserId;

      if (sellerUserId) {
        const totalCents = intent.amount;
        const ganancias = Math.floor(totalCents * 0.85) / 100;

        const seller = await User.findByIdAndUpdate(
          sellerUserId,
          { $inc: { ganancias, totalContactos: 1 } },
          { new: true }
        );

        console.log('Pago procesado para:', seller?.email, 'Ganancias:', ganancias);

        if (seller && seller.cuentaPago && seller.metodoPago === 'mercadopago' && process.env.MP_ACCESS_TOKEN) {
          try {
            const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'X-Idempotency-Key': intent.id
              },
              body: JSON.stringify({
                transaction_amount: ganancias,
                currency_id: 'USD',
                description: `Argentalk - Contacto #${seller.totalContactos}`,
                payment_method_id: 'account_money',
                payer: { email: seller.cuentaPago }
              })
            });
            const mpData = await mpRes.json();
            console.log('MP pago:', mpData.id, mpData.status);
          } catch (mpErr) {
            console.error('MP error:', mpErr.message);
          }
        }
      }
    }

    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) await User.findByIdAndUpdate(userId, { verificado: true });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};