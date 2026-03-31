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
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nombre, bio, precio, habilidades, ciudad, disponible, metodoPago, cuentaPago },
      { new: true }
    );
    res.json(user);
  } catch (err) {
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