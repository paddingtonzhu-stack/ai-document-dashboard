const { getDb, persist } = require('../db/database');

async function saveDocument({ filename, originalText, summary, technicalSkills, softSkills, languageSkills, experience, education, keyPoints }) {
  const db = await getDb();
  db.run(
    `INSERT INTO documents (filename, original_text, summary, technical_skills, soft_skills, language_skills, experience, education, key_points)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      filename, originalText, summary,
      JSON.stringify(technicalSkills || []),
      JSON.stringify(softSkills || []),
      JSON.stringify(languageSkills || []),
      JSON.stringify(experience || []),
      JSON.stringify(education || []),
      JSON.stringify(keyPoints || []),
    ]
  );
  persist();
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
    technicalSkills: JSON.parse(row.technical_skills || '[]'),
    softSkills: JSON.parse(row.soft_skills || '[]'),
    languageSkills: JSON.parse(row.language_skills || '[]'),
    experience: JSON.parse(row.experience || '[]'),
    education: JSON.parse(row.education || '[]'),
    keyPoints: JSON.parse(row.key_points || '[]'),
    created_at: row.created_at,
  };
}

module.exports = { saveDocument, getAllDocuments };
