const User = require('../models/User');

exports.getSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller', disponible: true })
      .select('email nombre bio foto precio habilidades ciudad disponible verificado _id');
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener anfitriones.' });
  }
};

exports.getSellerById = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
      .select('email nombre bio foto precio habilidades ciudad disponible verificado');
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