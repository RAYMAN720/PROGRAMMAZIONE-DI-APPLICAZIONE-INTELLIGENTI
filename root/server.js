const express = require('express');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = 3000;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const demoUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get('juray@gmail.com');
if (!demoUser) {
  db.prepare(`
    INSERT INTO users (name, email, password)
    VALUES (?, ?, ?)
  `).run('Juray Demo', 'juray@gmail.com', '1234');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Tutti i campi sono obbligatori.' });
  }

  try {
    db.prepare(`
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `).run(name.trim(), email.trim().toLowerCase(), password);

    return res.status(201).json({ message: 'Registrazione completata con successo.' });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ message: 'Questa email risulta già registrata.' });
    }
    return res.status(500).json({ message: 'Errore del server durante la registrazione.' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e password sono obbligatorie.' });
  }

  try {
    const user = db.prepare(`
      SELECT id, name, email
      FROM users
      WHERE email = ? AND password = ?
    `).get(email.trim().toLowerCase(), password);

    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    return res.json({ message: 'Accesso eseguito con successo.', user });
  } catch (error) {
    return res.status(500).json({ message: 'Errore del server durante il login.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
