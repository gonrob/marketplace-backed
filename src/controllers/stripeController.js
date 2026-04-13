const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createSellerAccount = async (req, res) => {
  res.json({ message: 'No necesario' });
};

exports.getOnboardingLink = async (req, res) => {
  res.json({ message: 'No necesario' });
};

exports.getStatus = async (req, res) => {
  res.json({ hasAccount: true, onboardingComplete: true });
};

// Contacto simple - 0.50 USD
exports.createPayment = async (req, res) => {
  try {
    const { sellerUserId, buyerEmail } = req.body;
    if (!sellerUserId) return res.status(400).json({ error: 'Faltan datos.' });

    const buyer = await User.findById(req.user._id);
    const seller = await User.findById(sellerUserId);
    if (!seller) return res.status(404).json({ error: 'Anfitrion no encontrado.' });

    // Admin saltea todo
    if (['info.knowan@gmail.com','gonrobtor@gmail.com'].includes(buyer.email)) {
      return res.json({ gratis: true, sellerId: sellerUserId });
    }

    // Verificar si ya contacto a este anfitrion
    const yaContacto = buyer.anfitrionesContactados.includes(sellerUserId);

    // Primer contacto gratis
    if (!yaContacto && buyer.contactosGratis) {
      await User.findByIdAndUpdate(buyer._id, {
        contactosGratis: false,
        $push: { anfitrionesContactados: sellerUserId }
      });
      await User.findByIdAndUpdate(sellerUserId, { $inc: { totalContactos: 1 } });
      return res.json({ gratis: true, sellerId: sellerUserId });
    }

    // Verificar si tiene creditos
    if (buyer.creditosContacto > 0) {
      await User.findByIdAndUpdate(buyer._id, {
        $inc: { creditosContacto: -1 },
        $push: { anfitrionesContactados: sellerUserId }
      });
      await User.findByIdAndUpdate(sellerUserId, {
        $inc: { totalContactos: 1, ganancias: 0.25 }
      });
      return res.json({ credito: true, sellerId: sellerUserId });
    }

    // Pago de 0.50 USD
    const intent = await stripe.paymentIntents.create({
      amount: 50,
      currency: 'usd',
      metadata: {
        tipo: 'contacto',
        sellerUserId,
        sellerEmail: seller.email,
        sellerNombre: seller.nombre || '',
        sellerTelefono: seller.telefono || '',
        sellerMetodoPago: seller.metodoPago || '',
        sellerCuentaPago: seller.cuentaPago || '',
        buyerUserId: buyer._id.toString(),
        buyerEmail: buyerEmail || buyer.email,
      }
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('createPayment:', err.message);
    res.status(500).json({ error: 'Error al crear pago.' });
  }
};

// Paquetes de contactos
exports.createPaquete = async (req, res) => {
  try {
    const { paquete } = req.body;
    const buyer = await User.findById(req.user._id);

    const PAQUETES = {
      p5:  { amount: 200, credits: 5,  desc: '5 contactos' },
      p10: { amount: 350, credits: 10, desc: '10 contactos' },
      p25: { amount: 700, credits: 25, desc: '25 contactos' },
    };

    const p = PAQUETES[paquete];
    if (!p) return res.status(400).json({ error: 'Paquete invalido.' });

    const intent = await stripe.paymentIntents.create({
      amount: p.amount,
      currency: 'usd',
      metadata: {
        tipo: 'paquete',
        paquete,
        creditos: p.credits,
        buyerUserId: buyer._id.toString(),
        buyerEmail: buyer.email,
      }
    });
    res.json({ clientSecret: intent.client_secret, paquete: p });
  } catch (err) {
    console.error('createPaquete:', err.message);
    res.status(500).json({ error: 'Error al crear paquete.' });
  }
};

// Retiro de ganancias anfitrion
exports.retirarGanancias = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'seller') return res.status(403).json({ error: 'Solo anfitriones.' });
    if (user.ganancias < 1) return res.status(400).json({ error: 'Minimo USD 1 para retirar.' });

    const monto = user.ganancias;
    await User.findByIdAndUpdate(user._id, { ganancias: 0 });

    // Notificar por email
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Knowan <onboarding@resend.dev>',
      to: 'info.knowan@gmail.com',
      subject: `Solicitud de retiro - ${user.email}`,
      html: `
        <h2>Solicitud de retiro</h2>
        <p><strong>Anfitrion:</strong> ${user.nombre} (${user.email})</p>
        <p><strong>Monto:</strong> USD ${monto.toFixed(2)}</p>
        <p><strong>Metodo:</strong> ${user.metodoPago}</p>
        <p><strong>Cuenta:</strong> ${user.cuentaPago}</p>
        <p><strong>Telefono:</strong> ${user.telefono}</p>
      `
    });

    res.json({ message: `Solicitud de retiro de USD ${monto.toFixed(2)} enviada. Te contactaremos pronto.`, monto });
  } catch (err) {
    console.error('retirarGanancias:', err.message);
    res.status(500).json({ error: 'Error al procesar retiro.' });
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
    if (!data.url && !data.session_url && !data.verification_url) {
      return res.status(500).json({ error: `Error Didit: ${JSON.stringify(data)}` });
    }
    res.json({ url: data.url || data.session_url || data.verification_url });
  } catch (err) {
    console.error('createVerification:', err.message);
    res.status(500).json({ error: 'Error al crear verificacion.' });
  }
};