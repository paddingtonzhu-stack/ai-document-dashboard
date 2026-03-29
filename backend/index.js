console.log("Starting server...");

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// database
const db = new Database('data.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    summary TEXT
  )
`).run();

// routes
app.post('/summarize', (req, res) => {
  const { content } = req.body;

  const summary = content.slice(0, 100) + '...';

  db.prepare(
    'INSERT INTO documents (content, summary) VALUES (?, ?)'
  ).run(content, summary);

  res.json({ summary });
});

app.get('/history', (req, res) => {
  const rows = db.prepare('SELECT * FROM documents').all();
  res.json(rows);
});

// 🚨 THIS WAS MISSING
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});