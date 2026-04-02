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
      const sellerUserId = intent.metadata?.sellerUserId;

      if (sellerUserId) {
        const totalCents = intent.amount;
        const ganancias = Math.floor(totalCents * 0.85) / 100;
        const total = totalCents / 100;

        const seller = await User.findByIdAndUpdate(
          sellerUserId,
          { $inc: { ganancias, totalContactos: 1 } },
          { new: true }
        );

        console.log('Pago procesado para:', seller?.email, 'Ganancias:', ganancias);

        // Email al anfitrion
        if (seller?.email) {
          try {
            await resend.emails.send({
              from: 'Argentalk <onboarding@resend.dev>',
              to: seller.email,
              subject: '🎉 Nuevo contacto en Argentalk!',
              html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
                  <div style="background:#003DA5;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
                    <h1 style="color:white;margin:0">Argen<span style="color:#F4A020">talk</span> 🧉</h1>
                  </div>
                  <h2>Hola ${seller.nombre || 'anfitrion'}!</h2>
                  <p style="color:#555">Alguien pago tu primer contacto por <strong>USD ${total}</strong>.</p>
                  <p style="color:#555">Vos recibis <strong>USD ${ganancias}</strong> (85%).</p>
                  <div style="background:#f0f4ff;border-radius:10px;padding:16px;margin:16px 0">
                    <p style="margin:0;color:#003DA5;font-weight:600">El viajero te contactara pronto.</p>
                    <p style="margin:8px 0 0;color:#555;font-size:14px">Asegurate de tener tu WhatsApp o email disponible para responder.</p>
                  </div>
                  <div style="text-align:center;margin-top:20px">
                    <a href="https://argentalk.vercel.app/dashboard" style="background:#F4A020;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Ver mi dashboard</a>
                  </div>
                </div>
              `
            });
          } catch (emailErr) {
            console.error('Email anfitrion error:', emailErr.message);
          }
        }

        // Email al viajero con datos del anfitrion
        const buyerEmail = intent.receipt_email || intent.metadata?.buyerEmail;
        if (buyerEmail && seller) {
          try {
            await resend.emails.send({
              from: 'Argentalk <onboarding@resend.dev>',
              to: buyerEmail,
              subject: '✅ Pago confirmado - Datos de tu anfitrion',
              html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
                  <div style="background:#003DA5;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
                    <h1 style="color:white;margin:0">Argen<span style="color:#F4A020">talk</span> 🧉</h1>
                  </div>
                  <h2>Pago confirmado!</h2>
                  <p style="color:#555">Tu pago de <strong>USD ${total}</strong> fue procesado correctamente.</p>
                  <div style="background:#f0f4ff;border-radius:10px;padding:16px;margin:16px 0">
                    <p style="margin:0;font-weight:600;color:#003DA5">Datos de tu anfitrion:</p>
                    <p style="margin:8px 0 0;color:#555"><strong>Nombre:</strong> ${seller.nombre || 'Sin nombre'}</p>
                    <p style="margin:4px 0;color:#555"><strong>Email:</strong> ${seller.email}</p>
                    ${seller.telefono ? `<p style="margin:4px 0;color:#555"><strong>Telefono/WhatsApp:</strong> ${seller.telefono}</p>` : ''}
                    <p style="margin:8px 0 0;color:#888;font-size:13px">Contactalo directamente para coordinar.</p>
                  </div>
                  <div style="text-align:center;margin-top:20px">
                    <a href="https://argentalk.vercel.app/explorar" style="background:#F4A020;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600">Ver mas anfitriones</a>
                  </div>
                </div>
              `
            });
          } catch (emailErr) {
            console.error('Email viajero error:', emailErr.message);
          }
        }

        // Pago automatico por Mercado Pago
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

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};