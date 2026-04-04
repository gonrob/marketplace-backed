const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Knowan <onboarding@resend.dev>';
const URL = 'https://knowan.net';

exports.emailAnfitrion = async (email, nombre) => {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: '¡Bienvenido a Knowan! 🧉',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <div style="background:#003DA5;padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
          <h1 style="color:white;margin:0">Argen<span style="color:#F4A020">talk</span> 🧉</h1>
        </div>
        <h2>¡Hola ${nombre || 'anfitrion'}!</h2>
        <p style="color:#555;line-height:1.6">Tu cuenta de anfitrion fue creada. Ya podes compartir la cultura argentina con el mundo.</p>
        <ul style="color:#555">
          <li>Completá tu perfil con tus habilidades y precio</li>
          <li>Verificá tu identidad con DNI o Pasaporte</li>
          <li>Empezá a recibir contactos</li>
        </ul>
        <div style="text-align:center;margin-top:24px">
          <a href="${URL}/dashboard" style="background:#F4A020;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">Ir al dashboard</a>
        </div>
      </div>`
    });
  } catch (err) {
    console.error('Email anfitrion error:', err.message);
  }
};

exports.emailViajero = async (email, nombre) => {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Welcome to Knowan! 🧉',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <div style="background:#003DA5;padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
          <h1 style="color:white;margin:0">Argen<span style="color:#F4A020">talk</span> 🧉</h1>
        </div>
        <h2>Welcome ${nombre || ''}!</h2>
        <p style="color:#555;line-height:1.6">Your Knowan account is ready. Start connecting with real Argentinians!</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${URL}/explorar" style="background:#F4A020;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">Find a host</a>
        </div>
      </div>`
    });
  } catch (err) {
    console.error('Email viajero error:', err.message);
  }
};
