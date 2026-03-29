const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      case 'account.updated': {
        const account = event.data.object;
        if (account.details_submitted && account.charges_enabled) {
          await User.findOneAndUpdate(
            { stripeAccountId: account.id },
            { onboardingComplete: true }
          );
          console.log(`✅ Onboarding completado para cuenta ${account.id}`);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        console.log(`💰 Pago exitoso: ${intent.id} - ${intent.amount / 100}€`);
        // Aquí puedes guardar el pago en tu DB, enviar email, etc.
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        console.log(`❌ Pago fallido: ${intent.id}`);
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    res.status(500).json({ error: 'Error interno procesando webhook' });
  }
};
