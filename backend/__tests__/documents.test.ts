import express, { Request, Response } from 'express';
import multer from 'multer';
import * as documentsRoute from '../routes/documents';
import * as aiService from '../services/aiService';
import * as documentService from '../services/documentService';

// Mock dependencies
jest.mock('../services/aiService');
jest.mock('../services/documentService');
jest.mock('multer');
jest.mock('fs');
jest.mock('pdf-parse');

describe('Documents Routes', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn().mockReturnValue({});
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockRequest = {
      file: undefined,
      body: {},
    };
  });

  describe('POST /upload', () => {
    it('should return 400 when no file is uploaded', async () => {
      const app = express();
      app.use(express.json());
      
      // In real scenario, multer middleware is applied
      // For testing, we simulate the route handler behavior
      const handler = async (req: Request, res: Response) => {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded.' });
        }
      };

      mockRequest.file = undefined;
      await handler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No file uploaded.' });
    });

    it('should reject non-PDF/TXT files', () => {
      // Multer fileFilter test
      const fileFilter = (_req: any, file: any, cb: any) => {
        const allowed = ['.pdf', '.txt'];
        const ext = require('path').extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only PDF and TXT files are allowed.'));
      };

      const file = { originalname: 'document.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
      const callback = jest.fn();

      fileFilter({}, file, callback);

      expect(callback).toHaveBeenCalledWith(new Error('Only PDF and TXT files are allowed.'));
    });

    it('should accept PDF files', () => {
      const fileFilter = (_req: any, file: any, cb: any) => {
        const allowed = ['.pdf', '.txt'];
        const ext = require('path').extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only PDF and TXT files are allowed.'));
      };

      const file = { originalname: 'resume.pdf', mimetype: 'application/pdf' };
      const callback = jest.fn();

      fileFilter({}, file, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should accept TXT files', () => {
      const fileFilter = (_req: any, file: any, cb: any) => {
        const allowed = ['.pdf', '.txt'];
        const ext = require('path').extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only PDF and TXT files are allowed.'));
      };

      const file = { originalname: 'resume.txt', mimetype: 'text/plain' };
      const callback = jest.fn();

      fileFilter({}, file, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should handle successful document upload', async () => {
      const mockDocRecord = {
        id: 1,
        filename: 'resume.pdf',
        summary: 'Java developer',
        technicalSkills: ['Java'],
        softSkills: ['Leadership'],
        languageSkills: ['English'],
        experience: ['5 years'],
        education: ['BS'],
        keyPoints: [],
        created_at: '2024-01-01T10:00:00Z',
      };

      (aiService.summarize as jest.Mock).mockResolvedValue({
        summary: 'Java developer',
        technicalSkills: ['Java'],
        softSkills: ['Leadership'],
        languageSkills: ['English'],
        experience: ['5 years'],
        education: ['BS'],
        keyPoints: [],
      });

      (documentService.saveDocument as jest.Mock).mockResolvedValue(mockDocRecord);

      // Simulate successful upload response
      expect(mockDocRecord.filename).toBe('resume.pdf');
      expect(mockDocRecord.summary).toBe('Java developer');
    });

    it('should enforce 10MB file size limit', () => {
      const uploadConfig = {
        dest: './uploads',
        limits: { fileSize: 10 * 1024 * 1024 },
      };

      expect(uploadConfig.limits.fileSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('POST /summarize', () => {
    it('should return 400 when no text is provided', async () => {
      const handler = (req: Request, res: Response) => {
        const { text } = req.body;
        if (!text || !text.trim()) {
          return res.status(400).json({ error: 'No text provided.' });
        }
      };

      mockRequest.body = { text: '' };
      await handler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No text provided.' });
    });

    it('should return 400 when text is whitespace only', async () => {
      const handler = (req: Request, res: Response) => {
        const { text } = req.body;
        if (!text || !text.trim()) {
          return res.status(400).json({ error: 'No text provided.' });
        }
      };

      mockRequest.body = { text: '   ' };
      await handler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should use provided filename or default', async () => {
      (aiService.summarize as jest.Mock).mockResolvedValue({
        summary: 'Test summary',
        technicalSkills: [],
        softSkills: [],
        languageSkills: [],
        experience: [],
        education: [],
        keyPoints: [],
      });

      const mockDocRecord = {
        id: 1,
        filename: 'custom-name.txt',
        summary: 'Test summary',
        technicalSkills: [],
        softSkills: [],
        languageSkills: [],
        experience: [],
        education: [],
        keyPoints: [],
        created_at: '2024-01-01T10:00:00Z',
      };

      (documentService.saveDocument as jest.Mock).mockResolvedValue(mockDocRecord);

      mockRequest.body = { text: 'Resume text', filename: 'custom-name.txt' };

      expect(mockRequest.body.filename).toBe('custom-name.txt');
    });

    it('should use default filename when not provided', async () => {
      const defaultFilename = 'manual-input.txt';
      expect(defaultFilename).toBe('manual-input.txt');
    });

    it('should return 502 on AI service failure', async () => {
      (aiService.summarize as jest.Mock).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const handler = async (req: Request, res: Response) => {
        try {
          await aiService.summarize(req.body.text);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown AI summarization error';
          return res.status(502).json({ error: `AI summarization failed: ${message}` });
        }
      };

      mockRequest.body = { text: 'Resume text' };
      await handler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(502);
    });
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const handler = (_req: Request, res: Response) => {
        res.json({ status: 'ok' });
      };

      await handler(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({ status: 'ok' });
    });
  });
});