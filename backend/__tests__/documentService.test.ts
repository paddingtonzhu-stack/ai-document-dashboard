import { saveDocument, getAllDocuments, DocumentInput, DocumentRecord } from '../services/documentService';
import * as db from '../db/database';

jest.mock('../db/database');

describe('documentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveDocument', () => {
    it('should save a new document with all fields', async () => {
      const mockDb = {
        run: jest.fn(),
        exec: jest.fn().mockReturnValue([
          {
            columns: ['id', 'filename', 'summary', 'technical_skills', 'soft_skills', 'language_skills', 'experience', 'education', 'key_points', 'created_at'],
            values: [
              [
                '1',
                'resume.pdf',
                'Java developer',
                '["Java","Spring"]',
                '["Leadership"]',
                '["English"]',
                '["5 years"]',
                '["BS CS"]',
                '["AWS"]',
                '2024-01-01T10:00:00Z',
              ],
            ],
          },
        ]),
      };
      (db.getDb as jest.Mock).mockResolvedValue(mockDb);

      const input: DocumentInput = {
        filename: 'resume.pdf',
        originalText: 'Full CV text here',
        summary: 'Java developer',
        technicalSkills: ['Java', 'Spring'],
        softSkills: ['Leadership'],
        languageSkills: ['English'],
        experience: ['5 years'],
        education: ['BS CS'],
        keyPoints: ['AWS'],
      };

      const result = await saveDocument(input);

      expect(mockDb.run).toHaveBeenCalled();
      expect(result.filename).toBe('resume.pdf');
      expect(result.summary).toBe('Java developer');
      expect(result.technicalSkills).toEqual(['Java', 'Spring']);
      expect(result.softSkills).toEqual(['Leadership']);
    });

    it('should handle optional fields with defaults', async () => {
      const mockDb = {
        run: jest.fn(),
        exec: jest.fn().mockReturnValue([
          {
            columns: ['id', 'filename', 'summary', 'technical_skills', 'soft_skills', 'language_skills', 'experience', 'education', 'key_points', 'created_at'],
            values: [
              [
                '2',
                'doc.txt',
                'Summary',
                '[]',
                '[]',
                '[]',
                '[]',
                '[]',
                '[]',
                '2024-01-02T10:00:00Z',
              ],
            ],
          },
        ]),
      };
      (db.getDb as jest.Mock).mockResolvedValue(mockDb);

      const input: DocumentInput = {
        filename: 'doc.txt',
        originalText: 'Some text',
        summary: 'Summary',
      };

      const result = await saveDocument(input);

      expect(result.technicalSkills).toEqual([]);
      expect(result.softSkills).toEqual([]);
      expect(result.languageSkills).toEqual([]);
    });

    it('should throw error if document not found after insert', async () => {
      const mockDb = {
        run: jest.fn(),
        exec: jest.fn().mockReturnValue([]),
      };
      (db.getDb as jest.Mock).mockResolvedValue(mockDb);

      const input: DocumentInput = {
        filename: 'test.pdf',
        originalText: 'Test',
        summary: 'Test summary',
      };

      await expect(saveDocument(input)).rejects.toThrow('Failed to retrieve newly inserted document');
    });
  });

  describe('getAllDocuments', () => {
    it('should return all documents sorted by date', async () => {
      const mockDb = {
        exec: jest.fn().mockReturnValue([
          {
            columns: ['id', 'filename', 'summary', 'technical_skills', 'soft_skills', 'language_skills', 'experience', 'education', 'key_points', 'created_at'],
            values: [
              [
                '1',
                'resume1.pdf',
                'Developer',
                '["Java"]',
                '["Leadership"]',
                '["English"]',
                '["5 years"]',
                '["BS"]',
                '["AWS"]',
                '2024-01-02T10:00:00Z',
              ],
              [
                '2',
                'resume2.pdf',
                'Manager',
                '["Python"]',
                '["Teamwork"]',
                '[]',
                '["10 years"]',
                '["MS"]',
                '[]',
                '2024-01-01T10:00:00Z',
              ],
            ],
          },
        ]),
      };
      (db.getDb as jest.Mock).mockResolvedValue(mockDb);

      const results = await getAllDocuments();

      expect(results).toHaveLength(2);
      expect(results[0].filename).toBe('resume1.pdf');
      expect(results[1].filename).toBe('resume2.pdf');
      expect(results[0].technicalSkills).toEqual(['Java']);
      expect(results[1].technicalSkills).toEqual(['Python']);
    });

    it('should return empty array when no documents exist', async () => {
      const mockDb = {
        exec: jest.fn().mockReturnValue([]),
      };
      (db.getDb as jest.Mock).mockResolvedValue(mockDb);

      const results = await getAllDocuments();

      expect(results).toEqual([]);
    });

    it('should properly parse JSON fields', async () => {
      const mockDb = {
        exec: jest.fn().mockReturnValue([
          {
            columns: ['id', 'filename', 'summary', 'technical_skills', 'soft_skills', 'language_skills', 'experience', 'education', 'key_points', 'created_at'],
            values: [
              [
                '1',
                'test.pdf',
                'Test',
                '["React","Vue","Angular"]',
                '["Communication","Creativity"]',
                '["English","French","Spanish"]',
                '["2020-2023","2023-present"]',
                '["BS Computer Science","MS Data Science"]',
                '["Certified Scrum Master","AWS Solutions Architect"]',
                '2024-01-01T10:00:00Z',
              ],
            ],
          },
        ]),
      };
      (db.getDb as jest.Mock).mockResolvedValue(mockDb);

      const results = await getAllDocuments();

      expect(results[0].technicalSkills).toEqual(['React', 'Vue', 'Angular']);
      expect(results[0].softSkills).toEqual(['Communication', 'Creativity']);
      expect(results[0].languageSkills).toEqual(['English', 'French', 'Spanish']);
      expect(results[0].experience.length).toBe(2);
      expect(results[0].education.length).toBe(2);
      expect(results[0].keyPoints.length).toBe(2);
    });
  });
});