const jwt = require('jsonwebtoken');
const User = require('../models/User');

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos.' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email ya registrado.' });
    const user = await User.create({ email, password, role: role || 'buyer' });
    res.status(201).json({ token: token(user._id), user });
  } catch (err) {
    console.error(err);
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
    res.json({ token: token(user._id), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesion.' });
  }
};

exports.me = (req, res) => res.json(req.user);
