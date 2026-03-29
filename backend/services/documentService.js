const { getDb, persist } = require('../db/database');

async function saveDocument({ filename, originalText, summary, keyPoints }) {
  const db = await getDb();
  db.run(
    `INSERT INTO documents (filename, original_text, summary, key_points) VALUES (?, ?, ?, ?)`,
    [filename, originalText, summary, JSON.stringify(keyPoints)]
  );
  persist();
  // Get last inserted row
  const result = db.exec('SELECT * FROM documents ORDER BY id DESC LIMIT 1');
  return parseRow(result[0].values[0], result[0].columns);
}

async function getAllDocuments() {
  const db = await getDb();
  const result = db.exec('SELECT * FROM documents ORDER BY created_at DESC');
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => parseRow(row, columns));
}

function parseRow(values, columns) {
  const row = {};
  columns.forEach((col, i) => { row[col] = values[i]; });
  return {
    id: row.id,
    filename: row.filename,
    summary: row.summary,
    keyPoints: JSON.parse(row.key_points),
    created_at: row.created_at,
  };
}

module.exports = { saveDocument, getAllDocuments };
