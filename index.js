import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { createServer } from 'http';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "time-warp-super-secret-key-2026";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Storage
const users = new Map();
const onlineUsers = new Map();
let activePoll = null;
let leaderboard = [];

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Please login" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const isAdmin = (user) => user.email.includes('admin') || user.name?.toLowerCase() === 'admin';

// Pages
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Auth
app.post('/api/register', (req, res) => { /* same as before */ });
app.post('/api/login', (req, res) => { /* same as before */ });

// Poll & Leaderboard (same as before)
app.post('/api/admin/poll', authenticate, (req, res) => { /* same */ });
app.post('/api/vote', authenticate, (req, res) => { /* same */ });
app.post('/api/admin/close-poll', authenticate, (req, res) => { /* same */ });
app.get('/api/leaderboard', (req, res) => { /* same */ });

// New: Private Messages
app.get('/api/users', authenticate, (req, res) => {
  const userList = Array.from(users.values()).map(u => ({
    name: u.name,
    email: u.email
  }));
  res.json(userList);
});

// Socket.IO - Enhanced
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('login', (userData) => {
    onlineUsers.set(socket.id, { ...userData, socketId: socket.id });
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });

  // Private Message
  socket.on('privateMessage', (data) => {
    const targetSocket = Array.from(onlineUsers.entries()).find(([_, user]) => user.name === data.to);
    if (targetSocket) {
      io.to(targetSocket[0]).emit('privateMessage', data);
    }
    socket.emit('privateMessage', data); // Echo to sender
  });

  // Typing Indicator
  socket.on('typing', (data) => {
    socket.broadcast.emit('userTyping', data);
  });

  socket.on('stopTyping', () => {
    socket.broadcast.emit('userStopTyping');
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });
});

app.get('/health', (req, res) => res.json({ status: "✅ Healthy" }));

httpServer.listen(port, () => {
  console.log(`🚀 Time Warp running on port ${port}`);
});
