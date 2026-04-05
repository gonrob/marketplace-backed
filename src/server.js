require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL, 'https://www.knowan.net', 'https://knowan.net', /\.vercel\.app$/],
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: [process.env.CLIENT_URL, /\.vercel\.app$/],
  credentials: true
}));

app.use('/webhook', express.raw({ type: 'application/json' }), require('./routes/webhookRoutes'));

app.use('/didit-webhook', express.json(), async (req, res) => {
  try {
    const { status, vendor_data } = req.body;
    console.log('Didit webhook:', status, vendor_data);
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
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.io chat
const usuarios = {};

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('join', (userId) => {
    usuarios[userId] = socket.id;
    console.log('Usuario unido:', userId);
  });

  socket.on('mensaje', ({ de, para, texto, nombre }) => {
    const socketDestino = usuarios[para];
    if (socketDestino) {
      io.to(socketDestino).emit('mensaje', { de, texto, nombre, timestamp: new Date() });
    }
    socket.emit('mensaje', { de, texto, nombre, timestamp: new Date(), propio: true });
  });

  socket.on('disconnect', () => {
    Object.keys(usuarios).forEach(key => {
      if (usuarios[key] === socket.id) delete usuarios[key];
    });
    console.log('Usuario desconectado:', socket.id);
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
  .catch(err => {
    console.error('Error MongoDB:', err);
    process.exit(1);
  });