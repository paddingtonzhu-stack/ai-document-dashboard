import { getDb, persist } from '../db/database';

export interface DocumentInput {
  filename: string;
  originalText: string;
  summary: string;
  technicalSkills?: string[];
  softSkills?: string[];
  languageSkills?: string[];
  experience?: string[];
  education?: string[];
  keyPoints?: string[];
}

export interface DocumentRecord {
  id: number;
  filename: string;
  summary: string;
  technicalSkills: string[];
  softSkills: string[];
  languageSkills: string[];
  experience: string[];
  education: string[];
  keyPoints: string[];
  created_at: string;
}

export async function saveDocument(document: DocumentInput): Promise<DocumentRecord> {
  const db = await getDb();
  db.run(
    `INSERT INTO documents (filename, original_text, summary, technical_skills, soft_skills, language_skills, experience, education, key_points)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      document.filename,
      document.originalText,
      document.summary,
      JSON.stringify(document.technicalSkills ?? []),
      JSON.stringify(document.softSkills ?? []),
      JSON.stringify(document.languageSkills ?? []),
      JSON.stringify(document.experience ?? []),
      JSON.stringify(document.education ?? []),
      JSON.stringify(document.keyPoints ?? []),
    ]
  );

  const result = db.exec('SELECT * FROM documents ORDER BY id DESC LIMIT 1');
  if (!result.length || !result[0].values.length) {
    throw new Error('Failed to retrieve newly inserted document');
  }

  return parseRow(result[0].values[0], result[0].columns);
}

export async function getAllDocuments(): Promise<DocumentRecord[]> {
  const db = await getDb();
  const result = db.exec('SELECT * FROM documents ORDER BY created_at DESC');
  if (!result.length) return [];

  const { columns, values } = result[0];
  return values.map((row: any[]) => parseRow(row, columns));
}

function parseRow(row: any[], columns: string[]): DocumentRecord {
  const mapped = {} as Record<string, unknown>;
  columns.forEach((col, i) => {
    mapped[col] = row[i];
  });

  return {
    id: Number(mapped.id),
    filename: String(mapped.filename),
    summary: String(mapped.summary),
    technicalSkills: JSON.parse(String(mapped.technical_skills ?? '[]')) as string[],
    softSkills: JSON.parse(String(mapped.soft_skills ?? '[]')) as string[],
    languageSkills: JSON.parse(String(mapped.language_skills ?? '[]')) as string[],
    experience: JSON.parse(String(mapped.experience ?? '[]')) as string[],
    education: JSON.parse(String(mapped.education ?? '[]')) as string[],
    keyPoints: JSON.parse(String(mapped.key_points ?? '[]')) as string[],
    created_at: String(mapped.created_at),
  };
}
