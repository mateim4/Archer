import { expect } from 'vitest';
import type { MatcherFunction } from 'expect';

// Custom matchers for testing
const toBeWithinRange: MatcherFunction<[number, number]> = function (
  actual: number,
  floor: number,
  ceiling: number
) {
  const pass = actual >= floor && actual <= ceiling;
  return {
    pass,
    message: () =>
      pass
        ? `Expected ${actual} not to be within range ${floor} - ${ceiling}`
        : `Expected ${actual} to be within range ${floor} - ${ceiling}`,
  };
};

const toHaveValidApiResponse: MatcherFunction<[]> = function (actual: any) {
  const hasRequiredProperties = actual && 
    typeof actual === 'object' && 
    !Array.isArray(actual);
  
  const pass = hasRequiredProperties;
  return {
    pass,
    message: () =>
      pass
        ? `Expected response not to be a valid API response`
        : `Expected response to be a valid API response object`,
  };
};

const toBeAccessible: MatcherFunction<[]> = function (actual: HTMLElement) {
  // Basic accessibility checks
  const hasAriaLabel = actual.getAttribute('aria-label') !== null;
  const hasRole = actual.getAttribute('role') !== null;
  const hasTabIndex = actual.getAttribute('tabindex') !== null;
  const isFocusable = actual.tabIndex >= 0;
  
  const isAccessible = hasAriaLabel || hasRole || isFocusable;
  
  return {
    pass: isAccessible,
    message: () =>
      isAccessible
        ? `Expected element not to be accessible`
        : `Expected element to have accessibility attributes (aria-label, role, or be focusable)`,
  };
};

// Extend expect with custom matchers
expect.extend({
  toBeWithinRange,
  toHaveValidApiResponse,
  toBeAccessible,
});

// Type declarations for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
    toHaveValidApiResponse(): T;
    toBeAccessible(): T;
  }
}