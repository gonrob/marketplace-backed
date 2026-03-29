const stripeService = require('../services/stripeService');
const User = require('../models/User');

const getStripe = () => require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createSellerAccount = async (req, res) => {
  try {
    const user = req.user;
    if (user.stripeAccountId) return res.status(400).json({ error: 'Ya tenes una cuenta de vendedor.' });
    const account = await stripeService.createAccount(user.email);
    user.stripeAccountId = account.id;
    user.role = 'seller';
    await user.save();
    const link = await stripeService.createAccountLink(account.id, process.env.CLIENT_URL);
    res.json({ url: link.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear cuenta de vendedor.' });
  }
};

exports.getOnboardingLink = async (req, res) => {
  try {
    const user = req.user;
    if (!user.stripeAccountId) return res.status(400).json({ error: 'No tenes cuenta de vendedor.' });
    const link = await stripeService.createAccountLink(user.stripeAccountId, process.env.CLIENT_URL);
    res.json({ url: link.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener link.' });
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
    const intent = await stripeService.createPaymentIntent(amount, seller.stripeAccountId);
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el pago.' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user.stripeAccountId) return res.json({ hasAccount: false });
    const account = await stripeService.getAccountStatus(user.stripeAccountId);
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

exports.createVerification = async (req, res) => {
  try {
    const user = req.user;
    const session = await getStripe().identity.verificationSessions.create({
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