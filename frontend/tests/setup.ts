import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';

// jsdom lacks matchMedia / ResizeObserver, which Ant Design components use.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}
if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!('IntersectionObserver' in globalThis)) {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}
// ProseMirror measures the current selection when typing. jsdom does not implement
// DOM range geometry, so provide stable zero-sized rectangles for editor tests.
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = (() => ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* () {},
  })) as unknown as typeof Range.prototype.getClientRects;
}
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = (() => ({
    x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0,
    toJSON: () => ({}),
  })) as typeof Range.prototype.getBoundingClientRect;
}
if (!document.elementFromPoint) {
  document.elementFromPoint = (() => document.body) as typeof document.elementFromPoint;
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// Tests that pass an explicit fetch implementation bypass MSW; component tests that
// hit `/config.json` or API routes are served by the handlers above.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
