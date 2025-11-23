// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
<<<<<<< Updated upstream
const mongoose = require('mongoose'); // MongoDB
=======
const mongoose = require('mongoose');
>>>>>>> Stashed changes
const socketHandlers = require('./socket/socketHandlers');
const authController = require('./controllers/authController');

const app = express();
const server = http.createServer(app);

<<<<<<< Updated upstream
// -------------------------
// MongoDB Connection
// -------------------------
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI) 
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established ✅');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error ❌', err);
});
// -------------------------
=======
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
>>>>>>> Stashed changes

// Configure CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// -------------------------
// Routes
// -------------------------

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Chat server is running!' });
});

// Authentication
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify', authController.verifyToken);

// Initialize Socket.io handlers
socketHandlers(io);

// -------------------------
// Start server
// -------------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
