import initSqlJs, { Database as SQLJSDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', 'data.db');

let db: SQLJSDatabase | null = null;

export async function getDb(): Promise<SQLJSDatabase> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      // When running from `dist/server.js`, __dirname is `dist/`; keep wasm path rooted to project workspace.
      return path.resolve(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
    },
  });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(new Uint8Array(fileBuffer));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_text TEXT NOT NULL,
      summary TEXT NOT NULL,
      technical_skills TEXT DEFAULT '[]',
      soft_skills TEXT DEFAULT '[]',
      language_skills TEXT DEFAULT '[]',
      experience TEXT DEFAULT '[]',
      education TEXT DEFAULT '[]',
      key_points TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  persist();
  return db;
}

export function persist(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}
