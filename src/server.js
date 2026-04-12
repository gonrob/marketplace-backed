require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'https://knowan.net',
  'https://www.knowan.net',
  'https://argentalk.vercel.app',
  /\.vercel\.app$/,
  'http://localhost:3000',
  'http://localhost:3001',
];

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] }
});

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes. Intentá en 15 minutos.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Intentá en 15 minutos.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/webhook', express.raw({ type: 'application/json' }), require('./routes/webhookRoutes'));

app.use('/didit-webhook', express.json(), async (req, res) => {
  try {
    const { status, vendor_data } = req.body;
    if (status === 'Approved' && vendor_data) {
      await require('./models/User').findByIdAndUpdate(vendor_data, { verificado: true });
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Didit webhook error:', err);
    res.status(500).json({ error: 'Error' });
  }
});

app.use(express.json({ limit: '10mb' }));

app.use('/api/auth',   require('./routes/authRoutes'));
app.use('/api/users',  require('./routes/userRoutes'));
app.use('/api/stripe', require('./routes/stripeRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/eventos', require('./routes/eventosRoutes'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const usuarios = {};
io.on('connection', (socket) => {
  socket.on('join', (userId) => { usuarios[userId] = socket.id; });
  socket.on('mensaje', ({ de, para, texto, nombre }) => {
    const dest = usuarios[para];
    if (dest) io.to(dest).emit('mensaje', { de, texto, nombre, timestamp: new Date() });
    socket.emit('mensaje', { de, texto, nombre, timestamp: new Date(), propio: true });
  });
  socket.on('disconnect', () => {
    Object.keys(usuarios).forEach(k => { if (usuarios[k] === socket.id) delete usuarios[k]; });
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    server.listen(process.env.PORT || 3000, () => {
      console.log('Servidor en puerto', process.env.PORT || 3000);
    });
  })
  .catch(err => { console.error('Error MongoDB:', err); process.exit(1); });
