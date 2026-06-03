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

// In-memory storage
const users = new Map();           // email -> user info
const onlineUsers = new Map();     // socket.id -> user info
let activePoll = null;
let leaderboard = []; // [{name, points, rank, year}]

// Authentication Middleware
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

// ====================== PAGES ======================
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ====================== AUTH API ======================
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (users.has(email)) return res.status(400).json({ error: "User already exists" });
  
  const isAdminUser = email.includes('admin') || name.toLowerCase() === 'admin';
  users.set(email, { name, password, isAdmin: isAdminUser });
  res.json({ success: true, message: "Account created!" });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ email, name: user.name, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, name: user.name, isAdmin: user.isAdmin });
});

// ====================== POLL & LEADERBOARD API ======================
app.post('/api/admin/poll', authenticate, (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: "Admin only" });
  
  activePoll = {
    id: Date.now(),
    question: req.body.question,
    game: req.body.game || "General",
    options: req.body.options || [],
    votes: {}
  };
  
  io.emit('newPoll', activePoll);
  res.json({ success: true, poll: activePoll });
});

app.post('/api/vote', authenticate, (req, res) => {
  if (!activePoll) return res.status(400).json({ error: "No active poll" });
  
  const { option } = req.body;
  activePoll.votes[req.user.email] = option;
  
  io.emit('pollUpdate', activePoll);
  res.json({ success: true });
});

app.post('/api/admin/close-poll', authenticate, (req, res) => {
  if (!isAdmin(req.user) || !activePoll) return res.status(403).json({ error: "Cannot close poll" });
  
  const results = {};
  Object.values(activePoll.votes).forEach(vote => {
    results[vote] = (results[vote] || 0) + 1;
  });

  // Update leaderboard (simple points system)
  const sorted = Object.entries(results).sort((a,b) => b[1] - a[1]);
  sorted.forEach(([player, votes], index) => {
    const existing = leaderboard.find(l => l.name === player);
    if (existing) {
      existing.points += votes;
    } else {
      leaderboard.push({ name: player, points: votes, rank: index + 1, year: new Date().getFullYear() });
    }
  });

  leaderboard.sort((a,b) => b.points - a.points);

  io.emit('pollClosed', { poll: activePoll, results, leaderboard: leaderboard.slice(0, 3) });
  activePoll = null;
  res.json({ success: true, results });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard.slice(0, 10));
});

// AI Chat API (unchanged)
app.post('/api/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const { OpenAI } = await import('openai');
    
    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com"
    });

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful AI assistant in Time Warp." },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "AI service error" });
  }
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('login', (userData) => {
    onlineUsers.set(socket.id, userData);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });

  socket.on('sendMessage', (messageData) => {
    io.emit('receiveMessage', messageData);
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
