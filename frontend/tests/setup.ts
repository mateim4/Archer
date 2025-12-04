import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import './utils/custom-matchers';

// Mock localStorage (required before MSW loads)
// This MUST be done synchronously at module load time
class LocalStorageMock {
  private store: Record<string, string> = {};
  
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  
  removeItem(key: string): void {
    delete this.store[key];
  }
  
  clear(): void {
    this.store = {};
  }
  
  get length(): number {
    return Object.keys(this.store).length;
  }
  
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
}

const localStorageInstance = new LocalStorageMock();

// Set up localStorage mock immediately
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageInstance,
  writable: true,
  configurable: true,
});

// For jsdom environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageInstance,
    writable: true,
    configurable: true,
  });
}

// Now import MSW (after localStorage is set up)
// Using dynamic import to ensure localStorage is available first
const setupMSW = async () => {
  const { setupMockServer } = await import('./utils/mock-server');
  setupMockServer();
};

// Run MSW setup
setupMSW();

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver  
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:1420',
    origin: 'http://localhost:1420',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
});

// Mock console.warn to reduce noise in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings that are expected in tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('React Router') || 
     message.includes('Warning: ') ||
     message.includes('validateDOMNesting'))
  ) {
    return;
  }
  originalWarn(...args);
};