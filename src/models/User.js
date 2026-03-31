const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:           { type: String, required: true, minlength: 6 },
  role:               { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
  stripeAccountId:    { type: String, default: null },
  onboardingComplete: { type: Boolean, default: false },
  verificado:         { type: Boolean, default: false },
  nombre:             { type: String, default: '' },
  bio:                { type: String, default: '' },
  foto:               { type: String, default: '' },
  precio:             { type: Number, default: 10 },
  habilidades:        { type: [String], default: [] },
  ciudad:             { type: String, default: '' },
  disponible:         { type: Boolean, default: true },
  telefono:           { type: String, default: '' },
  pais:               { type: String, default: '' },
  metodoPago:         { type: String, default: '' },
  cuentaPago:         { type: String, default: '' },
  ganancias:          { type: Number, default: 0 },
  totalContactos:     { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);