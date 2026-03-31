import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { getDb } from './db/database';
import documentsRouter from './routes/documents';

const app = express();
const PORT = process.env.PORT || '3001';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use(cors());
app.use(express.json());

app.use('/api', documentsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Initialize DB first, then start server
getDb()
  .then(() => {
    const portNumber = Number(PORT);
    const server = app.listen(portNumber, () => {
      console.log(`Backend running at http://localhost:${portNumber}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${portNumber} is already in use. Please stop the existing process or set PORT to another value.`);
        process.exit(1);
      }
      console.error('Server error:', err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
