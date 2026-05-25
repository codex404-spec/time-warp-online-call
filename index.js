import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-this";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory users (later we'll use database)
const users = new Map(); // email -> {password, name}

// ====================== ROUTES ======================

// Login Page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Register Page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Main App (After Login)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API Routes
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (users.has(email)) {
    return res.status(400).json({ error: "User already exists" });
  }
  users.set(email, { name, password });
  res.json({ success: true, message: "Account created!" });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, name: user.name });
});

app.get('/health', (req, res) => {
  res.json({ status: "✅ Healthy" });
});

app.listen(port, () => {
  console.log(`✅ Time Warp Online Call running on port ${port}`);
});
