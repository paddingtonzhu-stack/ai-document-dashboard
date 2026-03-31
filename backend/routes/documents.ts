import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { summarize } from '../services/aiService';
import { saveDocument, getAllDocuments, DocumentRecord } from '../services/documentService';

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(req, file, cb) {
    const allowed = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and TXT files are allowed.'));
  },
});

router.post('/upload', upload.single('document'), async (req: Request, res: Response<DocumentRecord | { error: string }>) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = file.path;
  const ext = path.extname(file.originalname).toLowerCase();
  let text = '';

  try {
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      text = data?.text ?? '';
    } else {
      text = fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    return res.status(422).json({ error: 'Could not read file content.' });
  } finally {
    fs.unlink(filePath, () => {});
  }

  if (!text.trim()) {
    return res.status(422).json({ error: 'File appears to be empty or unreadable.' });
  }

  let summary: string;
  let technicalSkills: string[];
  let softSkills: string[];
  let languageSkills: string[];
  let experience: string[];
  let education: string[];
  let keyPoints: string[];

  try {
    ({ summary, technicalSkills, softSkills, languageSkills, experience, education, keyPoints } = await summarize(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI summarization error';
    return res.status(502).json({ error: `AI summarization failed: ${message}` });
  }

  const doc = await saveDocument({
    filename: file.originalname,
    originalText: text,
    summary,
    technicalSkills,
    softSkills,
    languageSkills,
    experience,
    education,
    keyPoints,
  });

  res.json(doc);
});

router.post('/summarize', express.json(), async (req: Request, res: Response<DocumentRecord | { error: string }>) => {
  const { text, filename = 'manual-input.txt' } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided.' });
  }

  let summary: string;
  let technicalSkills: string[];
  let softSkills: string[];
  let languageSkills: string[];
  let experience: string[];
  let education: string[];
  let keyPoints: string[];

  try {
    ({ summary, technicalSkills, softSkills, languageSkills, experience, education, keyPoints } = await summarize(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI summarization error';
    return res.status(502).json({ error: `AI summarization failed: ${message}` });
  }

  const doc = await saveDocument({
    filename,
    originalText: text,
    summary,
    technicalSkills,
    softSkills,
    languageSkills,
    experience,
    education,
    keyPoints,
  });

  res.json(doc);
});

router.get('/history', async (_req: Request, res: Response<DocumentRecord[] | { error: string }>) => {
  try {
    const docs = await getAllDocuments();
    res.json(docs);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    res.status(500).json({ error: `Failed to fetch history: ${message}` });
  }
});

export default router;
