const User = require('../models/User');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

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
      const tipo = intent.metadata?.tipo;

      // Paquete de contactos
      if (tipo === 'paquete') {
        const buyerUserId = intent.metadata?.buyerUserId;
        const creditos = parseInt(intent.metadata?.creditos || 0);
        if (buyerUserId && creditos > 0) {
          await User.findByIdAndUpdate(buyerUserId, {
            $inc: { creditosContacto: creditos }
          });
          const buyer = await User.findById(buyerUserId);
          if (buyer?.email) {
            await resend.emails.send({
              from: 'Knowan <onboarding@resend.dev>',
              to: buyer.email,
              subject: '✅ Paquete de contactos activado!',
              html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
                  <div style="background:#003DA5;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
                    <h1 style="color:white;margin:0">Argen<span style="color:#F4A020">talk</span> 🧉</h1>
                  </div>
                  <h2>Paquete activado!</h2>
                  <p>Tenes <strong>${creditos} contactos</strong> disponibles.</p>
                  <p>Usalos cuando quieras en <a href="https://knowan.net/explorar">knowan.net</a></p>
                </div>
              `
            });
          }
        }
      }

      // Contacto individual 0.50 USD
      if (tipo === 'contacto') {
        const sellerUserId = intent.metadata?.sellerUserId;
        const buyerUserId = intent.metadata?.buyerUserId;
        const buyerEmail = intent.metadata?.buyerEmail;

        if (sellerUserId) {
          const ganancias = 0.35; // 70% de 0.50
          const seller = await User.findByIdAndUpdate(
            sellerUserId,
            { $inc: { ganancias, totalContactos: 1 } },
            { new: true }
          );

          if (buyerUserId) {
            await User.findByIdAndUpdate(buyerUserId, {
              $push: { anfitrionesContactados: sellerUserId }
            });
          }

          // Email al anfitrion
          if (seller?.email) {
            await resend.emails.send({
              from: 'Knowan <onboarding@resend.dev>',
              to: seller.email,
              subject: '🎉 Nuevo contacto en Knowan!',
              html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
                  <div style="background:#003DA5;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
                    <h1 style="color:white;margin:0">Argen<span style="color:#F4A020">talk</span> 🧉</h1>
                  </div>
                  <h2>Hola ${seller.nombre || 'anfitrion'}!</h2>
                  <p>Alguien pago USD 0.50 para contactarte.</p>
                  <p>Vos recibis <strong>USD 0.35</strong> (70%).</p>
                  <div style="text-align:center;margin-top:20px">
                    <a href="https://knowan.net/dashboard" style="background:#F4A020;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Ver mi dashboard</a>
                  </div>
                </div>
              `
            }).catch(e => console.error('Email anfitrion:', e.message));
          }

          // Email al viajero
          if (buyerEmail && seller) {
            await resend.emails.send({
              from: 'Knowan <onboarding@resend.dev>',
              to: buyerEmail,
              subject: '✅ Contacto confirmado - Datos de tu anfitrion',
              html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
                  <div style="background:#003DA5;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
                    <h1 style="color:white;margin:0">Argen<span style="color:#F4A020">talk</span> 🧉</h1>
                  </div>
                  <h2>Contacto confirmado!</h2>
                  <div style="background:#f0f4ff;border-radius:10px;padding:16px;margin:16px 0">
                    <p style="margin:0;font-weight:600;color:#003DA5">Datos de tu anfitrion:</p>
                    <p style="margin:8px 0 0"><strong>Nombre:</strong> ${seller.nombre || 'Sin nombre'}</p>
                    <p style="margin:4px 0"><strong>Email:</strong> ${seller.email}</p>
                    ${seller.telefono ? `<p style="margin:4px 0"><strong>WhatsApp:</strong> ${seller.telefono}</p>` : ''}
                  </div>
                  <div style="text-align:center;margin-top:20px">
                    <a href="https://knowan.net/explorar" style="background:#F4A020;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Ver mas anfitriones</a>
                  </div>
                </div>
              `
            }).catch(e => console.error('Email viajero:', e.message));
          }

          // Pago MP si tiene cuenta
          if (seller?.cuentaPago && seller?.metodoPago === 'mercadopago' && process.env.MP_ACCESS_TOKEN) {
            fetch('https://api.mercadopago.com/v1/payments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'X-Idempotency-Key': intent.id
              },
              body: JSON.stringify({
                transaction_amount: 0.35,
                currency_id: 'USD',
                description: 'Knowan contacto',
                payment_method_id: 'account_money',
                payer: { email: seller.cuentaPago }
              })
            }).catch(e => console.error('MP error:', e.message));
          }
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};