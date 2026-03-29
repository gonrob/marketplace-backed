const User = require('../models/User');

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    if (event.type === 'account.updated') {
      const account = event.data.object;
      if (account.details_submitted && account.charges_enabled) {
        await User.findOneAndUpdate({ stripeAccountId: account.id }, { onboardingComplete: true });
      }
    }
    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) await User.findByIdAndUpdate(userId, { verificado: true });
    }
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};
