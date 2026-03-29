const User = require('../models/User');

function stripe() {
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

exports.createSellerAccount = async (req, res) => {
  try {
    const user = req.user;
    if (user.stripeAccountId) return res.status(400).json({ error: 'Ya tenes cuenta de vendedor.' });
    const account = await stripe().accounts.create({
      type: 'express', country: 'AR', email: user.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } }
    });
    user.stripeAccountId = account.id;
    user.role = 'seller';
    await user.save();
    const link = await stripe().accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.CLIENT_URL}/onboarding/retry`,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
      type: 'account_onboarding'
    });
    res.json({ url: link.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cuenta.' });
  }
};

exports.getOnboardingLink = async (req, res) => {
  try {
    const user = req.user;
    if (!user.stripeAccountId) return res.status(400).json({ error: 'No tenes cuenta de vendedor.' });
    const link = await stripe().accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL}/onboarding/retry`,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
      type: 'account_onboarding'
    });
    res.json({ url: link.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener link.' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user.stripeAccountId) return res.json({ hasAccount: false });
    const account = await stripe().accounts.retrieve(user.stripeAccountId);
    res.json({
      hasAccount: true,
      onboardingComplete: account.details_submitted && account.charges_enabled,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estado.' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { amount, sellerUserId } = req.body;
    if (!amount || !sellerUserId) return res.status(400).json({ error: 'Faltan datos.' });
    if (amount < 50) return res.status(400).json({ error: 'Minimo 0.50 USD.' });
    const seller = await User.findById(sellerUserId);
    if (!seller || !seller.stripeAccountId) return res.status(404).json({ error: 'Anfitrion no encontrado.' });
    if (!seller.onboardingComplete) return res.status(400).json({ error: 'El anfitrion no completo Stripe.' });
    const intent = await stripe().paymentIntents.create({
      amount,
      currency: 'usd',
      application_fee_amount: Math.floor(amount * 0.15),
      transfer_data: { destination: seller.stripeAccountId }
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear pago.' });
  }
};

exports.createVerification = async (req, res) => {
  try {
    const user = req.user;
    const session = await stripe().identity.verificationSessions.create({
      type: 'document',
      metadata: { userId: user._id.toString() },
      options: {
        document: {
          allowed_types: ['id_card', 'passport', 'driving_license'],
          require_live_capture: true,
          require_matching_selfie: true
        }
      },
      return_url: `${process.env.CLIENT_URL}/dashboard?verified=true`
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear verificacion.' });
  }
};