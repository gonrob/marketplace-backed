const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email:            { type: String, required: true, unique: true, lowercase: true },
  password:         { type: String, required: true },
  role:             { type: String, enum: ['seller', 'buyer'], default: 'buyer' },
  verificado:       { type: Boolean, default: false },
  emailVerificado:  { type: Boolean, default: false },
  nombrePareja:     { type: String, default: null },
  esPareja:         { type: Boolean, default: false },
  tokenEmail:       { type: String, default: null },
  nombre:           { type: String, default: '' },
  bio:              { type: String, default: '' },
  foto:             { type: String, default: '' },
  precio:           { type: Number, default: 10 },
  habilidades:      { type: [String], default: [] },
  ciudad:           { type: String, default: '' },
  disponible:       { type: Boolean, default: true },
  telefono:         { type: String, default: '' },
  pais:             { type: String, default: '' },
  metodoPago:       { type: String, default: '' },
  cuentaPago:       { type: String, default: '' },
  ganancias:        { type: Number, default: 0 },
  totalContactos:   { type: Number, default: 0 },
  valoraciones:     { type: [Number], default: [] },
  puntuacion:       { type: Number, default: 0 },
  contactosGratis:  { type: Boolean, default: true },
  contactosPagados: { type: Number, default: 0 },
  creditosContacto: { type: Number, default: 0 },
  anfitrionesContactados: { type: [String], default: [] },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);