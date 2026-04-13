const User = require('../models/User');

exports.getSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller', disponible: true })
      .select('email nombre bio foto foto2 nombrePareja precio habilidades ciudad disponible verificado ganancias totalContactos puntuacion valoraciones idiomas chat videollamada galeria _id');
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener anfitriones.' });
  }
};

exports.getSellerById = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
      .select('email nombre bio foto precio habilidades ciudad disponible verificado puntuacion valoraciones');
    if (!seller) return res.status(404).json({ error: 'Anfitrion no encontrado.' });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener anfitrion.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nombre, bio, precio, habilidades, ciudad, disponible, metodoPago, cuentaPago, foto, foto2, nombrePareja, galeria, idiomas, chat, videollamada } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (nombre !== undefined) user.nombre = nombre;
    if (bio !== undefined) user.bio = bio;
    if (precio !== undefined) user.precio = precio;
    if (habilidades !== undefined) user.habilidades = habilidades;
    if (ciudad !== undefined) user.ciudad = ciudad;
    if (disponible !== undefined) user.disponible = disponible;
    if (metodoPago !== undefined) user.metodoPago = metodoPago;
    if (cuentaPago !== undefined) user.cuentaPago = cuentaPago;
    if (foto !== undefined) user.foto = foto;
    if (foto2 !== undefined) user.foto2 = foto2;
    if (nombrePareja !== undefined) user.nombrePareja = nombrePareja;
    if (galeria !== undefined) user.galeria = galeria;
    if (idiomas !== undefined) user.idiomas = idiomas;
    if (chat !== undefined) user.chat = chat;
    if (videollamada !== undefined) user.videollamada = videollamada;
    await user.save({ validateBeforeSave: false });
    res.json(user);
  } catch (err) {
    console.error('updateProfile:', err.message);
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Cuenta eliminada correctamente.' });
  } catch (err) {
    console.error('deleteAccount:', err.message);
    res.status(500).json({ error: 'Error al eliminar cuenta.' });
  }
};

exports.deleteAccountAdmin = async (req, res) => {
  try {
    if (req.user.email !== 'info.knowan@gmail.com') return res.status(403).json({ error: 'No autorizado.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cuenta eliminada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar.' });
  }
};

exports.valorar = async (req, res) => {
  try {
    const { puntos } = req.body;
    if (!puntos || puntos < 1 || puntos > 5) {
      return res.status(400).json({ error: 'Puntuacion debe ser entre 1 y 5.' });
    }
    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ error: 'Anfitrion no encontrado.' });
    seller.valoraciones.push(puntos);
    const total = seller.valoraciones.reduce((a, b) => a + b, 0);
    seller.puntuacion = Math.round((total / seller.valoraciones.length) * 10) / 10;
    await seller.save({ validateBeforeSave: false });
    res.json({ puntuacion: seller.puntuacion, total: seller.valoraciones.length });
  } catch (err) {
    console.error('valorar:', err.message);
    res.status(500).json({ error: 'Error al valorar.' });
  }
};

exports.getBuyers = async (req, res) => {
  try {
    if (req.user.email !== 'info.knowan@gmail.com') return res.status(403).json({ error: 'No autorizado.' });
    const buyers = await User.find({ role: 'buyer' }).select('nombre email foto telefono emailVerificado createdAt').sort({ createdAt: -1 });
    res.json(buyers);
  } catch (err) {
    res.status(500).json({ error: 'Error.' });
  }
};

exports.emailMasivo = async (req, res) => {
  try {
    if (req.user.email !== 'info.knowan@gmail.com') return res.status(403).json({ error: 'No autorizado.' });
    const { asunto, mensaje, role, emailIndividual } = req.body;
    if (!asunto || !mensaje) return res.status(400).json({ error: 'Asunto y mensaje requeridos.' });
    const User = require('../models/User');
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const soloNoVerificados = req.body.soloNoVerificados;
    const users = emailIndividual 
      ? await User.find({ email: emailIndividual }).select('email nombre')
      : soloNoVerificados
        ? await User.find({ role: role || 'seller', emailVerificado: false }).select('email nombre')
        : await User.find({ role: role || 'seller', emailVerificado: true }).select('email nombre');
    let enviados = 0;
    for (const u of users) {
      try {
        await resend.emails.send({
          from: 'Knowan <info@knowan.net>',
          to: u.email,
          subject: asunto,
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
            <img src="https://res.cloudinary.com/djtsmuzlo/image/upload/v1775331191/Disen%CC%83o_sin_ti%CC%81tulo_l1nog6.png" style="height:60px;margin-bottom:20px" />
            <p>Hola ${u.nombre},</p>
            <div style="font-size:15px;line-height:1.6;color:#333">${mensaje}</div>
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
            <p style="font-size:12px;color:#aaa">Knowan · knowan.net · info@knowan.net</p>
          </div>`
        });
        enviados++;
      } catch {}
    }
    res.json({ message: `Email enviado a ${enviados} usuarios.` });
  } catch (err) {
    console.error('emailMasivo:', err.message);
    res.status(500).json({ error: 'Error al enviar emails.' });
  }
};
