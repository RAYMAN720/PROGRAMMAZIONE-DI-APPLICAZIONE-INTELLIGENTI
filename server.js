const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const chatRoutes = require('./routes/chatRoutes');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const APP_NAME = process.env.APP_NAME || 'Juray IA';
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');
const MISTRAL_API_URL = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

app.use('/api', chatRoutes);
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = String(storedHash || '').split(':');
  if (!salt || !originalHash) return false;
  const derivedHash = crypto.scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHash, 'hex');
  return originalBuffer.length === derivedHash.length && crypto.timingSafeEqual(originalBuffer, derivedHash);
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

function getSessionToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  return req.headers['x-session-token'] || '';
}

function getUserByToken(token) {
  if (!token) return null;
  return db.prepare(`
    SELECT users.id, users.name, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ?
  `).get(token);
}

function requireAuth(req, res, next) {
  const token = getSessionToken(req);
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  req.user = user;
  req.sessionToken = token;
  next();
}

function upsertDemoUser() {
  const email = 'juray@gmail.com';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!existing) {
    db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run('Demo User', email, hashPassword('1234'));
  }
}

upsertDemoUser();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: APP_NAME });
});

app.post('/api/signup', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (name.length < 2) return res.status(400).json({ message: 'Enter a valid name.' });
  if (!email || !email.includes('@')) return res.status(400).json({ message: 'Enter a valid email.' });
  if (password.length < 4) return res.status(400).json({ message: 'Password must contain at least 4 characters.' });

  try {
    const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hashPassword(password));
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = createSession(user.id);
    res.status(201).json({ message: 'Account created.', user, token });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return res.status(409).json({ message: 'Email already registered.' });
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Signup failed.' });
  }
});

app.post('/api/login', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const record = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email);
    if (!record || !verifyPassword(password, record.password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = createSession(record.id);
    res.json({ message: 'Login successful.', token, user: { id: record.id, name: record.name, email: record.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.' });
  }
});

app.get('/api/me', requireAuth, (req, res) => {
  const messages = db.prepare(`
    SELECT id, role, content, created_at AS createdAt
    FROM messages
    WHERE user_id = ?
    ORDER BY id ASC
    LIMIT 50
  `).all(req.user.id);
  res.json({ user: req.user, messages });
});

app.post('/api/logout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.sessionToken);
  res.json({ message: 'Logged out.' });
});

app.post('/api/chat', requireAuth, async (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message) return res.status(400).json({ message: 'Message cannot be empty.' });

  db.prepare('INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'user', message);

  if (!process.env.MISTRAL_API_KEY) {
    const fallback = 'Mistral key missing.';
    db.prepare('INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'assistant', fallback);
    return res.status(503).json({ reply: fallback, provider: 'fallback' });
  }

  try {
    const history = db.prepare(`
      SELECT role, content
      FROM messages
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 10
    `).all(req.user.id).reverse();

    const apiResponse = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          { role: 'system', content: `You are ${APP_NAME}. Reply in the same language as the user. Be concise, helpful, and professional.` },
          ...history
        ],
        temperature: 0.6
      })
    });

    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error('Mistral API error:', data);
      const reply = data?.message || data?.error || 'AI provider unavailable.';
      db.prepare('INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'assistant', reply);
      return res.status(502).json({ reply, provider: 'mistral' });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || 'No response available.';
    db.prepare('INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'assistant', reply);
    return res.json({ reply, provider: 'mistral' });
  } catch (error) {
    console.error('Chat error:', error);
    const reply = 'Server error while contacting the AI provider.';
    db.prepare('INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'assistant', reply);
    return res.status(500).json({ reply, provider: 'server' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
