const BASE = '/api';

export async function uploadDocument(file) {
  const form = new FormData();
  form.append('document', file);
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${BASE}/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}
