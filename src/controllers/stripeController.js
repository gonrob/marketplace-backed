const User = require('../models/User');

exports.createSellerAccount = async (req, res) => {
  try {
    const user = req.user;
    if (user.stripeAccountId) return res.status(400).json({ error: 'Ya tenes cuenta de vendedor.' });
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.create({
      type: 'express', country: 'AR', email: user.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } }
    });
    user.stripeAccountId = account.id;
    user.role = 'seller';
    await user.save();
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.CLIENT_URL}/onboarding/retry`,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
      type: 'account_onboarding'
    });
    res.json({ url: link.url });
  } catch (err) {
    console.error('createSellerAccount:', err.message);
    res.status(500).json({ error: 'Error al crear cuenta.' });
  }
};

exports.getOnboardingLink = async (req, res) => {
  try {
    const user = req.user;
    if (!user.stripeAccountId) return res.status(400).json({ error: 'No tenes cuenta de vendedor.' });
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const link = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL}/onboarding/retry`,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
      type: 'account_onboarding'
    });
    res.json({ url: link.url });
  } catch (err) {
    console.error('getOnboardingLink:', err.message);
    res.status(500).json({ error: 'Error al obtener link.' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user.stripeAccountId) return res.json({ hasAccount: false });
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    res.json({
      hasAccount: true,
      onboardingComplete: account.details_submitted && account.charges_enabled,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
  } catch (err) {
    console.error('getStatus:', err.message);
    res.status(500).json({ error: 'Error al obtener estado.' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { amount, sellerUserId } = req.body;
    if (!amount || !sellerUserId) return res.status(400).json({ error: 'Faltan datos.' });
    if (amount < 200) return res.status(400).json({ error: 'Minimo 0.50 USD.' });
    const seller = await User.findById(sellerUserId);
    if (!seller || !seller.stripeAccountId) return res.status(404).json({ error: 'Anfitrion no encontrado.' });
    if (!seller.onboardingComplete) return res.status(400).json({ error: 'El anfitrion no completo Stripe.' });
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      application_fee_amount: Math.floor(amount * 0.15),
      transfer_data: { destination: seller.stripeAccountId }
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('createPayment:', err.message);
    res.status(500).json({ error: 'Error al crear pago.' });
  }
};

exports.createVerification = async (req, res) => {
  try {
    const user = req.user;
    const response = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.DIDIT_API_KEY
      },
      body: JSON.stringify({
        workflow_id: process.env.DIDIT_WORKFLOW_ID,
        vendor_data: user._id.toString(),
        callback: `${process.env.CLIENT_URL}/dashboard?verified=true`
      })
    });
    const data = await response.json();
    console.log('Didit response:', JSON.stringify(data));
    if (!data.url && !data.session_url && !data.verification_url) {
      return res.status(500).json({ error: `Error Didit: ${JSON.stringify(data)}` });
    }
    res.json({ url: data.url || data.session_url || data.verification_url });
  } catch (err) {
    console.error('createVerification:', err.message);
    res.status(500).json({ error: 'Error al crear verificacion.' });
  }
};