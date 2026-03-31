const BASE = '/api';

export interface DocumentRecord {
  id: string;
  filename: string;
  created_at: string;
  summary: string;
  technicalSkills?: string[];
  softSkills?: string[];
  languageSkills?: string[];
  experience?: string[];
  education?: string[];
  keyPoints?: string[];
}

export async function uploadDocument(file: File): Promise<DocumentRecord> {
  const form = new FormData();
  form.append('document', file);

  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as Record<string, unknown>));
    throw new Error((err as { error?: string }).error || 'Upload failed');
  }

  return res.json();
}

export async function fetchHistory(): Promise<DocumentRecord[]> {
  const res = await fetch(`${BASE}/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}
