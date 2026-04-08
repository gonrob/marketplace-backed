const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { emailAnfitrion, emailViajero, emailBienvenidaVerificado } = require('../services/emailService');

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { email, password, role, nombre, telefono, ciudad, pais, metodoPago, cuentaPago } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos.' });
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
    if (!user) return res.status(400).json({ error: 'Token inválido o expirado.' });
    user.emailVerificado = true;
    user.tokenEmail = null;
    await user.save({ validateBeforeSave: false });
    emailBienvenidaVerificado(user.email, user.nombre, user.role);
    res.redirect('https://knowan.net/dashboard?verified=email');
  } catch (err) {
    console.error('Verificar email error:', err.message);
    res.status(500).json({ error: 'Error al verificar email.' });
  }
};
