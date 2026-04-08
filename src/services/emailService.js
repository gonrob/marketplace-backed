const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Knowan <info@knowan.net>';
const URL = 'https://knowan.net';

exports.emailAnfitrion = async (email, nombre, token) => {
  try {
    const linkVerificacion = `${URL}/api/auth/verificar/${token}`;
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: '¡Bienvenido a Knowan! Verificá tu email 🧉',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <div style="background:linear-gradient(90deg,#4B6CB7,#C94B4B);padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
          <h1 style="color:white;margin:0">Know<span style="color:#fff;opacity:0.8">an</span> 🌐</h1>
        </div>
        <h2>¡Hola ${nombre || 'anfitrión'}!</h2>
        <p style="color:#555;line-height:1.6">Tu cuenta de anfitrión fue creada. Para empezar a recibir contactos, verificá tu email:</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${linkVerificacion}" style="background:linear-gradient(90deg,#4B6CB7,#C94B4B);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">✅ Verificar mi email</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">Si no creaste esta cuenta, ignorá este email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="color:#555;font-size:13px"><strong>Próximos pasos:</strong></p>
        <ul style="color:#555;font-size:13px">
          <li>Completá tu perfil con tus experiencias y precio</li>
          <li>Verificá tu identidad con DNI o Pasaporte</li>
          <li>Empezá a recibir contactos de viajeros</li>
        </ul>
        <p style="color:#aaa;font-size:11px;text-align:center;margin-top:20px">knowan.net · info.knowan@gmail.com</p>
      </div>`
    });
  } catch (err) {
    console.error('Email anfitrion error:', err.message);
  }
};

exports.emailViajero = async (email, nombre, token) => {
  try {
    const linkVerificacion = `${URL}/api/auth/verificar/${token}`;
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Welcome to Knowan! Verify your email 🧉',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <div style="background:linear-gradient(90deg,#4B6CB7,#C94B4B);padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
          <h1 style="color:white;margin:0">Know<span style="color:#fff;opacity:0.8">an</span> 🌐</h1>
        </div>
        <h2>Welcome ${nombre || ''}! 🎉</h2>
        <p style="color:#555;line-height:1.6">Your Knowan account is ready. Please verify your email to start connecting with real Argentinians:</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${linkVerificacion}" style="background:linear-gradient(90deg,#4B6CB7,#C94B4B);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">✅ Verify my email</a>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">If you didn't create this account, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
        <p style="color:#555;font-size:13px">🎁 Your first contact with a host is <strong>FREE</strong>. After that, only USD 0.50 each.</p>
        <div style="text-align:center;margin-top:20px">
          <a href="${URL}/explorar" style="background:#f3f4f6;color:#4B6CB7;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">🔍 Browse hosts</a>
        </div>
        <p style="color:#aaa;font-size:11px;text-align:center;margin-top:20px">knowan.net · info.knowan@gmail.com</p>
      </div>`
    });
  } catch (err) {
    console.error('Email viajero error:', err.message);
  }
};

exports.emailBienvenidaVerificado = async (email, nombre, role) => {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: role === 'seller' ? '¡Email verificado! Ya estás en Knowan 🇦🇷' : 'Email verified! Welcome to Knowan 🇦🇷',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <div style="background:linear-gradient(90deg,#4B6CB7,#C94B4B);padding:24px;border-radius:12px;text-align:center;margin-bottom:20px">
          <h1 style="color:white;margin:0">Know<span style="color:#fff;opacity:0.8">an</span> 🌐</h1>
        </div>
        <h2 style="text-align:center">✅ ¡Email verificado!</h2>
        <p style="color:#555;line-height:1.6;text-align:center">Tu cuenta está activa. ${role === 'seller' ? '¡Ya podés recibir contactos de viajeros!' : '¡Ya podés contactar anfitriones!'}</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${URL}/dashboard" style="background:linear-gradient(90deg,#4B6CB7,#C94B4B);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700">Ir al dashboard</a>
        </div>
        <p style="color:#aaa;font-size:11px;text-align:center;margin-top:20px">knowan.net · info.knowan@gmail.com</p>
      </div>`
    });
  } catch (err) {
    console.error('Email bienvenida verificado error:', err.message);
  }
};
