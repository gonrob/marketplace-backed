require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors({
  origin: [process.env.CLIENT_URL, /\.vercel\.app$/],
  credentials: true
}));

app.use('/webhook', express.raw({ type: 'application/json' }), require('./routes/webhookRoutes'));
app.use('/didit-webhook', express.json(), async (req, res) => {
  try {
    const { status, vendor_data } = req.body;
    if (status === 'Approved' && vendor_data) {
      await require('./models/User').findByIdAndUpdate(vendor_data, { verificado: true });
      console.log('Usuario verificado:', vendor_data);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Error didit webhook:', err);
    res.status(500).json({ error: 'Error' });
  }
});

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