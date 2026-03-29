const stripeService = require('../services/stripeService');
const User = require('../models/User');

exports.createSellerAccount = async (req, res) => {
  try {
    const user = req.user;

    if (user.stripeAccountId) {
      return res.status(400).json({ error: 'Ya tienes una cuenta de vendedor.' });
    }

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

    if (!user.stripeAccountId) {
      return res.status(400).json({ error: 'No tienes cuenta de vendedor.' });
    }

    const link = await stripeService.createAccountLink(user.stripeAccountId, process.env.CLIENT_URL);

    res.json({ url: link.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener link de onboarding.' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { amount, sellerUserId } = req.body;

    if (!amount || !sellerUserId) {
      return res.status(400).json({ error: 'amount y sellerUserId son requeridos.' });
    }

    if (amount < 50) {
      return res.status(400).json({ error: 'El importe mínimo es 0.50€.' });
    }

    const seller = await User.findById(sellerUserId);
    if (!seller || !seller.stripeAccountId) {
      return res.status(404).json({ error: 'Vendedor no encontrado o sin cuenta de Stripe.' });
    }

    if (!seller.onboardingComplete) {
      return res.status(400).json({ error: 'El vendedor no ha completado el onboarding.' });
    }

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

    if (!user.stripeAccountId) {
      return res.json({ hasAccount: false });
    }

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
