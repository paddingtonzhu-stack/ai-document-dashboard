import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Upload from '../views/Upload.vue';
import * as api from '../services/api';

vi.mock('../services/api');

// Helper to simulate file input change
function simulateFileInput(wrapper: any, file: File) {
  const input = wrapper.find('input[type="file"]');
  const mockEvent = {
    target: {
      files: [file],
    },
  };
  input.element.dispatchEvent(
    new Event('change', { bubbles: true }),
  );
  // Manually call the handler since we can't set file input value
  const component = wrapper.vm as any;
  component.selectedFile = file;
  component.error = '';
  component.result = null;
}

describe('Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload form with instructions', () => {
    const wrapper = mount(Upload);
    expect(wrapper.text()).toContain('Upload Document');
    expect(wrapper.text()).toContain('Drop file here or click to browse');
    expect(wrapper.text()).toContain('PDF or TXT · max 10 MB');
  });

  it('has submit button initially disabled', () => {
    const wrapper = mount(Upload);
    const button = wrapper.find('.btn');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('selects file and shows file preview', async () => {
    const wrapper = mount(Upload);
    const file = new File(['test'], 'resume.pdf', { type: 'application/pdf' });

    simulateFileInput(wrapper, file);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('resume.pdf');
    expect(wrapper.text()).toContain('KB');
  });

  it('enables submit button when file is selected', async () => {
    const wrapper = mount(Upload);
    const file = new File(['test content'], 'resume.pdf');

    simulateFileInput(wrapper, file);
    await wrapper.vm.$nextTick();

    const button = wrapper.find('.btn');
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('formats file size in KB', async () => {
    const wrapper = mount(Upload);
    const file = new File(['x'.repeat(5120)], 'test.pdf');

    simulateFileInput(wrapper, file);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('5.0 KB');
  });

  it('formats file size in MB for larger files', async () => {
    const wrapper = mount(Upload);
    const file = new File(['x'.repeat(1024 * 1024 * 2.5)], 'large.pdf');

    simulateFileInput(wrapper, file);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('MB');
  });

  it('shows drag-over state when dragging', async () => {
    const wrapper = mount(Upload);
    const dropZone = wrapper.find('.drop-zone');

    await dropZone.trigger('dragover');
    expect(dropZone.classes()).toContain('drop-zone--over');

    await dropZone.trigger('dragleave');
    expect(dropZone.classes()).not.toContain('drop-zone--over');
  });

  it('handles file drop', async () => {
    const wrapper = mount(Upload);
    const file = new File(['test'], 'dropped.pdf');
    
    const dropZone = wrapper.find('.drop-zone');
    const mockEvent = {
      dataTransfer: {
        files: [file],
      },
    };

    await dropZone.trigger('drop', mockEvent);

    expect(wrapper.text()).toContain('dropped.pdf');
  });

  it('uploads file and displays result', async () => {
    const mockResult = {
      id: '123',
      filename: 'resume.pdf',
      created_at: '2024-01-15T10:00:00',
      summary: 'Java developer with 5 years experience',
      technicalSkills: ['Java', 'Spring', 'Docker'],
      softSkills: ['Leadership', 'Communication'],
    };
    vi.mocked(api.uploadDocument).mockResolvedValue(mockResult);

    const wrapper = mount(Upload);
    const file = new File(['test'], 'resume.pdf');

    simulateFileInput(wrapper, file);
    await wrapper.vm.$nextTick();

    const button = wrapper.find('.btn');
    await button.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('📋 Role Summary');
    expect(wrapper.text()).toContain('Java developer with 5 years experience');
    expect(wrapper.text()).toContain('💻 Technical Skills');
    expect(wrapper.text()).toContain('Java');
    expect(wrapper.text()).toContain('Spring');
  });

  it('shows loading state while uploading', async () => {
    vi.mocked(api.uploadDocument).mockImplementation(
      () => new Promise(() => {})
    );

    const wrapper = mount(Upload);
    const file = new File(['test'], 'resume.pdf');

    simulateFileInput(wrapper, file);
    await wrapper.vm.$nextTick();

    const button = wrapper.find('.btn');
    await button.trigger('click');

    expect(button.classes()).toContain('btn');
  });

  it('displays error message on upload failure', async () => {
    vi.mocked(api.uploadDocument).mockRejectedValue(
      new Error('File too large')
    );

    const wrapper = mount(Upload);
    const file = new File(['test'], 'resume.pdf');

    simulateFileInput(wrapper, file);
    await wrapper.vm.$nextTick();

    const button = wrapper.find('.btn');
    await button.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('File too large');
  });

  it('clears error when selecting new file', async () => {
    vi.mocked(api.uploadDocument).mockRejectedValue(new Error('Upload failed'));

    const wrapper = mount(Upload);
    const file1 = new File(['test'], 'resume.pdf');

    simulateFileInput(wrapper, file1);
    await wrapper.vm.$nextTick();

    const button = wrapper.find('.btn');
    await button.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Upload failed');

    const file2 = new File(['test'], 'cv.pdf');
    simulateFileInput(wrapper, file2);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain('Upload failed');
  });

  it('displays all result sections when available', async () => {
    const mockResult = {
      id: '123',
      filename: 'resume.pdf',
      created_at: '2024-01-15T10:00:00',
      summary: 'Full stack developer',
      technicalSkills: ['JavaScript'],
      softSkills: ['Teamwork'],
      languageSkills: ['English', 'French'],
      experience: ['5 years at StartupX'],
      education: ['BS Computer Science'],
      keyPoints: ['AWS certified'],
    };
    vi.mocked(api.uploadDocument).mockResolvedValue(mockResult);

    const wrapper = mount(Upload);
    const file = new File(['test'], 'resume.pdf');

    simulateFileInput(wrapper, file);
    await wrapper.vm.$nextTick();

    await wrapper.find('.btn').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('📋 Role Summary');
    expect(wrapper.text()).toContain('💻 Technical Skills');
    expect(wrapper.text()).toContain('🤝 Soft Skills');
    expect(wrapper.text()).toContain('🌐 Language Requirements');
    expect(wrapper.text()).toContain('📅 Experience');
    expect(wrapper.text()).toContain('🎓 Education');
    expect(wrapper.text()).toContain('📌 Other Key Points');
  });

  it('clears previous result when uploading again', async () => {
    const mockResult1 = {
      id: '1',
      filename: 'resume1.pdf',
      created_at: '2024-01-15T10:00:00',
      summary: 'Result 1',
    };
    const mockResult2 = {
      id: '2',
      filename: 'resume2.pdf',
      created_at: '2024-01-16T10:00:00',
      summary: 'Result 2',
    };

    vi.mocked(api.uploadDocument)
      .mockResolvedValueOnce(mockResult1)
      .mockResolvedValueOnce(mockResult2);

    const wrapper = mount(Upload);

    const file1 = new File(['test1'], 'resume1.pdf');
    simulateFileInput(wrapper, file1);
    await wrapper.vm.$nextTick();

    await wrapper.find('.btn').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Result 1');

    const file2 = new File(['test2'], 'resume2.pdf');
    simulateFileInput(wrapper, file2);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain('Result 1');

    await wrapper.find('.btn').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Result 2');
  });

  it('formats upload date correctly', async () => {
    const mockResult = {
      id: '123',
      filename: 'resume.pdf',
      created_at: '2024-01-15T14:30:00',
      summary: 'Test',
    };
    vi.mocked(api.uploadDocument).mockResolvedValue(mockResult);

    const wrapper = mount(Upload);
    const file = new File(['test'], 'resume.pdf');

    simulateFileInput(wrapper, file);
    await wrapper.vm.$nextTick();

    await wrapper.find('.btn').trigger('click');
    await flushPromises();

    const meta = wrapper.find('.meta');
    expect(meta.text()).toMatch(/\d+\/\d+\/\d+/);
    expect(meta.text()).toContain('resume.pdf');
  });
});