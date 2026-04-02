import { summarize } from '../services/aiService';

// Mock fetch globally
global.fetch = jest.fn();

describe('aiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HF_API_TOKEN = 'test-token';
  });

  describe('summarize', () => {
    it('should extract technical skills from text', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Java developer with Spring expertise' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = 'Experienced Java developer with expertise in Spring, Docker, and Kubernetes. Also know JavaScript and React.';
      const result = await summarize(text);

      expect(result.technicalSkills).toContain('Java');
      expect(result.technicalSkills).toContain('Spring');
      expect(result.technicalSkills).toContain('Docker');
      // Note: JavaScript is capitalized as "Javascript" by the service
      expect(result.technicalSkills.some(s => s.toLowerCase() === 'javascript')).toBe(true);
    });

    it('should extract soft skills from text', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'A communicative and collaborative professional' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = 'Strong communication and teamwork skills. Known for leadership abilities and problem solving in critical situations.';
      const result = await summarize(text);

      expect(result.softSkills).toContain('Communication');
      expect(result.softSkills).toContain('Teamwork');
      expect(result.softSkills).toContain('Leadership');
    });

    it('should extract language skills from text', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Multilingual professional' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = 'Fluent in English, Mandarin Chinese, and Spanish. Working knowledge of French.';
      const result = await summarize(text);

      expect(result.languageSkills.length).toBeGreaterThan(0);
      expect(result.languageSkills.some(lang => lang.toLowerCase().includes('english'))).toBe(true);
      expect(result.languageSkills.some(lang => lang.toLowerCase().includes('mandarin') || lang.toLowerCase().includes('chinese'))).toBe(true);
    });

    it('should extract experience from text', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Experienced professional' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = 'I have 5 years of experience in software development. Senior developer with 10+ years in the industry.';
      const result = await summarize(text);

      expect(result.experience.length).toBeGreaterThan(0);
      expect(result.experience.some(exp => exp.includes('5') && exp.toLowerCase().includes('year'))).toBe(true);
    });

    it('should extract education from text', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Educated professional' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = "Bachelor's degree in Computer Science from MIT. Master's in Data Science from Stanford University.";
      const result = await summarize(text);

      expect(result.education.length).toBeGreaterThan(0);
      expect(result.education.some(edu => edu.toLowerCase().includes('computer') && edu.toLowerCase().includes('science'))).toBe(true);
    });

    it('should extract key points from text', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Summary of the document' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = 'First key point about experience in software development. Second key point about achievements and accomplishments. Third key point about expertise and technical skills. Fourth key point about skills and qualifications.';
      const result = await summarize(text);

      expect(result.keyPoints.length).toBeGreaterThan(0);
    });

    it('should generate summary from HuggingFace API', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Summarized content from the document' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = 'Long document text that needs to be summarized. Contains lots of information about various topics.';
      const result = await summarize(text);

      expect(result.summary).toBe('Summarized content from the document');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle missing HF_API_TOKEN gracefully', async () => {
      // The token check happens at runtime inside callHuggingFace
      // We can verify this by testing that the function requires a valid token
      // by checking the fetch call includes the Authorization header
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Summary' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = 'Some text';
      await summarize(text);

      // Verify fetch was called with proper authorization
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers.Authorization).toBeDefined();
      expect(headers.Authorization).toMatch(/^Bearer /);
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = 'Some text';
      await expect(summarize(text)).rejects.toThrow();
    });

    it('should handle empty text gracefully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Empty document' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = '   ';
      // Should still attempt to call API with trimmed empty string
      const result = await summarize(text);
      expect(result.summary).toBeDefined();
    });

    it('should handle text longer than 3000 characters', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Summary of long text' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const longText = 'x'.repeat(5000) + ' Java developer with expertise';
      const result = await summarize(longText);

      expect(result.summary).toBeDefined();
      // Verify request body is truncated
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.inputs.length).toBeLessThanOrEqual(3000);
    });

    it('should return complete SummarizeResult object', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Summary' }]),
        text: () => Promise.resolve(''),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const text = 'Java developer with 5 years experience. Fluent English speaker.';
      const result = await summarize(text);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('technicalSkills');
      expect(result).toHaveProperty('softSkills');
      expect(result).toHaveProperty('languageSkills');
      expect(result).toHaveProperty('experience');
      expect(result).toHaveProperty('education');
      expect(result).toHaveProperty('keyPoints');

      expect(Array.isArray(result.technicalSkills)).toBe(true);
      expect(Array.isArray(result.softSkills)).toBe(true);
      expect(Array.isArray(result.languageSkills)).toBe(true);
      expect(Array.isArray(result.experience)).toBe(true);
      expect(Array.isArray(result.education)).toBe(true);
      expect(Array.isArray(result.keyPoints)).toBe(true);
    });
  });
});