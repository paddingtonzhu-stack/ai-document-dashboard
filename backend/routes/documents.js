const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { summarize } = require('../services/aiService');
const { saveDocument, getAllDocuments } = require('../services/documentService');

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

// POST /upload — upload a file, extract text, summarize, persist
router.post('/upload', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  let text = '';

  try {
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      text = fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    return res.status(422).json({ error: 'Could not read file content.' });
  } finally {
    fs.unlink(filePath, () => {}); // clean up temp file
  }

  if (!text.trim()) {
    return res.status(422).json({ error: 'File appears to be empty or unreadable.' });
  }

  let summary, keyPoints;
  try {
    ({ summary, keyPoints } = await summarize(text));
  } catch (err) {
    return res.status(502).json({ error: `AI summarization failed: ${err.message}` });
  }

  const doc = await saveDocument({
    filename: req.file.originalname,
    originalText: text,
    summary,
    keyPoints,
  });

  res.json(doc);
});

// POST /summarize — summarize raw text directly (no file)
router.post('/summarize', express.json(), async (req, res) => {
  const { text, filename = 'manual-input.txt' } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided.' });
  }

  let summary, keyPoints;
  try {
    ({ summary, keyPoints } = await summarize(text));
  } catch (err) {
    return res.status(502).json({ error: `AI summarization failed: ${err.message}` });
  }

  const doc = await saveDocument({ filename, originalText: text, summary, keyPoints });
  res.json(doc);
});

// GET /history — return all past documents
router.get('/history', async (req, res) => {
  try {
    const docs = await getAllDocuments();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch history: ${err.message}` });
  }
});

module.exports = router;
