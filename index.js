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
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "time-warp-super-secret-key-2026";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();           // email -> user data
const onlineUsers = new Map();     // socket.id -> user

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

// Pages
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// Auth APIs
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (users.has(email)) return res.status(400).json({ error: "User exists" });
  users.set(email, { name, password });
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, name: user.name });
});

// Socket.io Real-time
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('login', (userData) => {
    onlineUsers.set(socket.id, userData);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });

  socket.on('sendMessage', (data) => {
    io.emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });
});

httpServer.listen(port, () => {
  console.log(`🚀 Time Warp Chat App running on port ${port}`);
});
