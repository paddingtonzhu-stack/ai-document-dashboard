import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import History from '../views/History.vue';
import * as api from '../services/api';

vi.mock('../services/api');

describe('History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(api.fetchHistory).mockReturnValue(new Promise(() => {}));
    const wrapper = mount(History);
    expect(wrapper.text()).toContain('Loading…');
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(api.fetchHistory).mockRejectedValue(new Error('Network error'));
    const wrapper = mount(History);
    await flushPromises();
    expect(wrapper.text()).toContain('Network error');
  });

  it('shows empty state when no documents', async () => {
    vi.mocked(api.fetchHistory).mockResolvedValue([]);
    const wrapper = mount(History);
    await flushPromises();
    expect(wrapper.text()).toContain('No documents yet');
  });

  it('renders documents list', async () => {
    const mockDocs = [
      {
        id: '1',
        filename: 'resume.pdf',
        created_at: '2024-01-01T10:00:00',
        summary: 'Java developer with 5 years experience',
        technicalSkills: ['Java', 'Spring'],
      },
    ];
    vi.mocked(api.fetchHistory).mockResolvedValue(mockDocs);
    const wrapper = mount(History);
    await flushPromises();

    expect(wrapper.text()).toContain('resume.pdf');
    
    // Expand to see summary
    await wrapper.find('.history-item').trigger('click');
    expect(wrapper.text()).toContain('Java developer with 5 years experience');
  });

  it('toggles document expansion', async () => {
    const mockDocs = [
      {
        id: '1',
        filename: 'resume.pdf',
        created_at: '2024-01-01T10:00:00',
        summary: 'Java developer',
        technicalSkills: ['Java'],
      },
    ];
    vi.mocked(api.fetchHistory).mockResolvedValue(mockDocs);
    const wrapper = mount(History);
    await flushPromises();

    const card = wrapper.find('.history-item');
    expect(card.classes()).not.toContain('expanded');

    await card.trigger('click');
    expect(card.classes()).toContain('expanded');

    await card.trigger('click');
    expect(card.classes()).not.toContain('expanded');
  });

  it('displays skills when expanded', async () => {
    const mockDocs = [
      {
        id: '1',
        filename: 'resume.pdf',
        created_at: '2024-01-01T10:00:00',
        summary: 'Java developer',
        technicalSkills: ['Java', 'Spring'],
        softSkills: ['Leadership', 'Communication'],
      },
    ];
    vi.mocked(api.fetchHistory).mockResolvedValue(mockDocs);
    const wrapper = mount(History);
    await flushPromises();

    await wrapper.find('.history-item').trigger('click');

    expect(wrapper.text()).toContain('💻 Technical Skills');
    expect(wrapper.text()).toContain('Java');
    expect(wrapper.text()).toContain('Spring');
    expect(wrapper.text()).toContain('🤝 Soft Skills');
    expect(wrapper.text()).toContain('Leadership');
  });

  it('formats date correctly', async () => {
    const mockDocs = [
      {
        id: '1',
        filename: 'test.pdf',
        created_at: '2024-01-15T14:30:00',
        summary: 'Test',
      },
    ];
    vi.mocked(api.fetchHistory).mockResolvedValue(mockDocs);
    const wrapper = mount(History);
    await flushPromises();

    const dateText = wrapper.find('.meta').text();
    expect(dateText).toMatch(/\d+\/\d+\/\d+/);
  });

  it('displays all document types when expanded', async () => {
    const mockDocs = [
      {
        id: '1',
        filename: 'resume.pdf',
        created_at: '2024-01-01T10:00:00',
        summary: 'Complete resume',
        technicalSkills: ['Java'],
        softSkills: ['Leadership'],
        languageSkills: ['English', 'Spanish'],
        experience: ['5 years at Company A', '3 years at Company B'],
        education: ['BS Computer Science'],
        keyPoints: ['Certified AWS', 'Agile certified'],
      },
    ];
    vi.mocked(api.fetchHistory).mockResolvedValue(mockDocs);
    const wrapper = mount(History);
    await flushPromises();

    await wrapper.find('.history-item').trigger('click');

    expect(wrapper.text()).toContain('📋 Summary');
    expect(wrapper.text()).toContain('💻 Technical Skills');
    expect(wrapper.text()).toContain('🤝 Soft Skills');
    expect(wrapper.text()).toContain('🌐 Language Requirements');
    expect(wrapper.text()).toContain('📅 Experience');
    expect(wrapper.text()).toContain('🎓 Education');
    expect(wrapper.text()).toContain('📌 Other Key Points');
  });
});