import { vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock SVG file loading in jsdom environment
Object.defineProperty(window, 'SVGUseElement', {
  value: class {
    setAttribute() {}
    removeAttribute() {}
  },
  writable: true,
});

// Intercept fetch for missing SVG files
const originalFetch = global.fetch;
global.fetch = vi.fn((url: string | Request, ...args: any[]) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  if (urlStr.includes('icons.svg') || urlStr.includes('.svg')) {
    return Promise.resolve(
      new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
        status: 200,
        headers: { 'content-type': 'image/svg+xml' },
      })
    );
  }
  return (originalFetch as any)(url, ...args);
});