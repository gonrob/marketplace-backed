const User = require('../models/User');

exports.getSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller', disponible: true })
      .select('email nombre bio foto precio habilidades ciudad disponible verificado ganancias totalContactos puntuacion valoraciones _id');
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
    const { nombre, bio, precio, habilidades, ciudad, disponible, metodoPago, cuentaPago } = req.body;
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
    if (req.user.email !== 'gonrobtor@gmail.com') return res.status(403).json({ error: 'No autorizado.' });
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
