const User = require('../models/User');

exports.createSellerAccount = async (req, res) => {
  res.json({ message: 'No necesario' });
};

exports.getOnboardingLink = async (req, res) => {
  res.json({ message: 'No necesario' });
};

exports.getStatus = async (req, res) => {
  res.json({ hasAccount: true, onboardingComplete: true });
};

exports.createPayment = async (req, res) => {
  try {
    const { amount, sellerUserId, buyerEmail } = req.body;
    if (!amount || !sellerUserId) return res.status(400).json({ error: 'Faltan datos.' });
    if (amount < 200) return res.status(400).json({ error: 'Minimo USD 2.' });

    const seller = await User.findById(sellerUserId);
    if (!seller) return res.status(404).json({ error: 'Anfitrion no encontrado.' });

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        sellerUserId: sellerUserId,
        sellerEmail: seller.email,
        sellerNombre: seller.nombre || '',
        sellerTelefono: seller.telefono || '',
        sellerMetodoPago: seller.metodoPago || '',
        sellerCuentaPago: seller.cuentaPago || '',
        buyerEmail: buyerEmail || '',
      }
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