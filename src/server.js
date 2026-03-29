require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use('/webhook', express.raw({ type: 'application/json' }), require('./routes/webhookRoutes'));
app.use(express.json());

app.use('/api/auth',   require('./routes/authRoutes'));
app.use('/api/users',  require('./routes/userRoutes'));
app.use('/api/stripe', require('./routes/stripeRoutes'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(process.env.PORT || 3000, () => {
      console.log('Servidor en puerto', process.env.PORT || 3000);
    });
  })
  .catch(err => { console.error('Error MongoDB:', err); process.exit(1); });
