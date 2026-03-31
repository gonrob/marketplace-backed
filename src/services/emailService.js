const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.emailBienvenidaAnfitrion = async (email, nombre) => {
  try {
    await resend.emails.send({
      from: 'Argentalk <argentalk26@gmail.com>',
      to: email,
      subject: '¡Bienvenido a Argentalk! 🧉',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
          <div style="background:#003DA5;padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
            <h1 style="color:white;margin:0;font-size:28px">Argen<span style="color:#F4A020">talk</span> 🧉</h1>
          </div>
          <h2 style="color:#1a1a1a">¡Hola ${nombre || 'anfitrion'}!</h2>
          <p style="color:#555;line-height:1.6">Tu cuenta de anfitrion en Argentalk fue creada exitosamente. Ya podes empezar a compartir la cultura argentina con el mundo.</p>
          <div style="background:#f0f4ff;border-radius:10px;padding:16px;margin:20px 0">
            <p style="margin:0;font-weight:600;color:#003DA5">Proximos pasos:</p>
            <ul style="color:#555;margin-top:8px;padding-left:20px">
              <li>Completa tu perfil con tus habilidades y precio</li>
              <li>Conecta tu cuenta de Stripe para recibir pagos</li>
              <li>Verificá tu identidad con DNI o Pasaporte</li>
            </ul>
          </div>
          <div style="text-align:center;margin-top:24px">
            <a href="https://argentalk.vercel.app/dashboard" style="background:#F4A020;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
              Ir a mi dashboard
            </a>
          </div>
          <p style="color:#888;font-size:13px;text-align:center;margin-top:24px">argentalk26@gmail.com · argentalk.vercel.app</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Error email anfitrion:', err);
  }
};

exports.emailBienvenidaViajero = async (email, nombre) => {
  try {
    await resend.emails.send({
      from: 'Argentalk <argentalk26@gmail.com>',
      to: email,
      subject: 'Welcome to Argentalk! 🧉',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
          <div style="background:#003DA5;padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
            <h1 style="color:white;margin:0;font-size:28px">Argen<span style="color:#F4A020">talk</span> 🧉</h1>
          </div>
          <h2 style="color:#1a1a1a">Welcome ${nombre || ''}!</h2>
          <p style="color:#555;line-height:1.6">Your Argentalk account is ready. Start connecting with real Argentinians and live the culture!</p>
          <div style="background:#f0f4ff;border-radius:10px;padding:16px;margin:20px 0">
            <p style="margin:0;font-weight:600;color:#003DA5">What you can do:</p>
            <ul style="color:#555;margin-top:8px;padding-left:20px">
              <li>Browse Argentinian hosts</li>
              <li>Learn about mate, truco, football and more</li>
              <li>Chat with real-time translation in 8 languages</li>
              <li>Pay securely with Stripe</li>
            </ul>
          </div>
          <div style="text-align:center;margin-top:24px">
            <a href="https://argentalk.vercel.app/explorar" style="background:#F4A020;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
              Find a host
            </a>
          </div>
          <p style="color:#888;font-size:13px;text-align:center;margin-top:24px">argentalk26@gmail.com · argentalk.vercel.app</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Error email viajero:', err);
  }
};