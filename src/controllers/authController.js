const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { emailAnfitrion, emailViajero, emailBienvenidaVerificado } = require('../services/emailService');

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { email, password, role, nombre, telefono, ciudad, pais, metodoPago, cuentaPago, nombrePareja, foto, foto2 } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos.' });
    if (email.length > 100) return res.status(400).json({ error: 'Email demasiado largo.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password minimo 6 caracteres.' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email ya registrado.' });
    const tokenEmail = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      email, password,
      role: role || 'buyer',
      nombre: nombre || '',
      telefono: telefono || '',
      ciudad: ciudad || '',
      pais: pais || '',
      metodoPago: metodoPago || '',
      cuentaPago: cuentaPago || '',
      nombrePareja: nombrePareja || null,
      esPareja: !!nombrePareja,
      foto: foto || '',
      foto2: foto2 || null,
      tokenEmail
    });
    if (role === 'seller') emailAnfitrion(email, nombre, tokenEmail);
    else emailViajero(email, nombre, tokenEmail);
    res.status(201).json({ token: makeToken(user._id), user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Error al registrar.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos.' });
    if (email.length > 100) return res.status(400).json({ error: 'Email demasiado largo.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas.' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas.' });
    res.json({ token: makeToken(user._id), user });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Error al iniciar sesion.' });
  }
};

exports.me = (req, res) => res.json(req.user);

exports.verificarEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ tokenEmail: token });
    if (!user) return res.status(400).send('<html><body><h2>Token inválido o ya usado. <a href="https://knowan.net/login">Ir al login</a></h2></body></html>');
    user.emailVerificado = true;
    user.tokenEmail = null;
    await user.save({ validateBeforeSave: false });
    emailBienvenidaVerificado(user.email, user.nombre, user.role);
    res.send('<html><head><meta http-equiv="refresh" content="2;url=https://knowan.net/login?verified=1"></head><body><h2>✅ Email verificado. Redirigiendo al login...</h2><p><a href="https://knowan.net/login?verified=1">Click aquí si no redirige</a></p></body></html>');
  } catch (err) {
    console.error('Verificar email error:', err.message);
    res.status(500).json({ error: 'Error al verificar email.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'Si el email existe, recibirás un link.' });
    const tokenReset = crypto.randomBytes(32).toString('hex');
    await User.findByIdAndUpdate(user._id, { tokenReset });
    const link = `https://knowan.net/reset-password?token=${tokenReset}`;
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Knowan <info@knowan.net>',
      to: email,
      subject: 'Resetear contraseña — Knowan',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <h2>Resetear contraseña</h2>
        <p>Hacé click en el botón para crear una nueva contraseña:</p>
        <a href="${link}" style="display:block;background:linear-gradient(90deg,#4B6CB7,#C94B4B);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;text-align:center;margin:20px 0">🔑 Resetear contraseña</a>
        <p style="color:#aaa;font-size:12px">Si no pediste esto, ignorá este email.</p>
      </div>`
    });
    res.json({ message: 'Si el email existe, recibirás un link.' });
  } catch (err) {
    console.error('forgotPassword error:', err.message);
    res.status(500).json({ error: 'Error al procesar.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password mínimo 6 caracteres.' });
    const user = await User.findOne({ tokenReset: token });
    if (!user) return res.status(400).json({ error: 'Token inválido o expirado.' });
    user.password = password;
    user.tokenReset = null;
    await user.save();
    res.json({ message: 'Contraseña actualizada.' });
  } catch (err) {
    console.error('resetPassword error:', err.message);
    res.status(500).json({ error: 'Error al resetear.' });
  }
};

exports.reenviarVerificacion = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (user.emailVerificado) return res.json({ message: 'Tu email ya está verificado.' });
    const tokenEmail = require('crypto').randomBytes(32).toString('hex');
    user.tokenEmail = tokenEmail;
    await user.save({ validateBeforeSave: false });
    if (user.role === 'seller') emailAnfitrion(user.email, user.nombre, tokenEmail);
    else emailViajero(user.email, user.nombre, tokenEmail);
    res.json({ message: 'Email reenviado.' });
  } catch (err) {
    console.error('reenviarVerificacion:', err.message);
    res.status(500).json({ error: 'Error al reenviar.' });
  }
};
