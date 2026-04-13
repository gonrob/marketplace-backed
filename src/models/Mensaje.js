const mongoose = require('mongoose');
const MensajeSchema = new mongoose.Schema({
  de: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  para: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  texto: { type: String, required: true },
  nombre: { type: String },
}, { timestamps: true });
module.exports = mongoose.model('Mensaje', MensajeSchema);
