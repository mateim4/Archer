/**
 * Global Setup for Vitest
 * 
 * This file runs BEFORE any tests or setup files.
 * Used to set up global mocks that MSW and other libraries depend on.
 */

// Mock localStorage globally before MSW loads
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string): string | null {
    return this.store[key] || null;
  },
  setItem(key: string, value: string): void {
    this.store[key] = value;
  },
  removeItem(key: string): void {
    delete this.store[key];
  },
  clear(): void {
    this.store = {};
  },
  get length(): number {
    return Object.keys(this.store).length;
  },
  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  },
};

// @ts-ignore - globalThis typing
globalThis.localStorage = localStorageMock;

export default function setup() {
  // This function is called by Vitest global setup
  console.log('Global test setup complete');
}
