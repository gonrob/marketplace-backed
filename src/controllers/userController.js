const User = require('../models/User');

exports.getSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller', onboardingComplete: true })
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
    const { nombre, bio, precio, habilidades, ciudad, disponible } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nombre, bio, precio, habilidades, ciudad, disponible },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
};
